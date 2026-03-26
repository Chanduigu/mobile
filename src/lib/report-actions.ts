'use server';

import { db } from '@/db';
import { routes, routeStops, orders, users, stores, items, orderItems } from '@/db/schema';
import { eq, and, desc, asc, inArray, sql, gte, lte } from 'drizzle-orm';

// --- Route Management Reports ---

export async function getRouteHistory(startDate?: string, endDate?: string, driverId?: string) {
    const conditions = [];
    if (startDate && endDate) {
        conditions.push(and(gte(routes.date, startDate), lte(routes.date, endDate)));
    }
    if (driverId) {
        conditions.push(eq(routes.driverId, driverId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const allRoutes = await db.select({
        id: routes.id,
        date: routes.date,
        driverId: routes.driverId,
        driverName: users.name,
        status: routes.status,
        routeNumber: routes.routeNumber,
    })
        .from(routes)
        .leftJoin(users, eq(routes.driverId, users.id))
        .where(whereClause)
        .orderBy(desc(routes.date));

    const history = await Promise.all(allRoutes.map(async (route: any) => {
        const stops = await db.select().from(routeStops).where(eq(routeStops.routeId, route.id));

        // Fix: fetch by routeId for strict linking
        const routeOrders = await db.select().from(orders).where(eq(orders.routeId, route.id));

        const totalStops = stops.length;
        const completedStops = stops.filter((s: any) => s.status === 'visited').length;
        const totalRevenue = routeOrders.reduce((sum: number, o: any) => sum + (o.paidAmount || 0), 0);
        const totalPending = routeOrders.reduce((sum: number, o: any) => sum + ((o.totalAmount || 0) - (o.paidAmount || 0)), 0);

        return {
            ...route,
            totalStops,
            completedStops,
            totalRevenue,
            totalPending
        };
    }));

    return history;
}

export async function getRouteDetails(routeId: string) {
    const route = await db.select({
        id: routes.id,
        date: routes.date,
        driverId: routes.driverId,
        driverName: users.name,
        status: routes.status,
    })
        .from(routes)
        .leftJoin(users, eq(routes.driverId, users.id))
        .where(eq(routes.id, routeId))
        .then(res => res[0]);

    if (!route) return null;

    const stops = await db.select({
        id: routeStops.id,
        storeId: routeStops.storeId,
        sequence: routeStops.sequence,
        status: routeStops.status,
        completedAt: routeStops.completedAt,
        storeName: stores.name,
        address: stores.address,
        phone: stores.phone,
        gmapsLink: stores.gmapsLink
    })
        .from(routeStops)
        .leftJoin(stores, eq(routeStops.storeId, stores.id))
        .where(eq(routeStops.routeId, routeId))
        .orderBy(asc(routeStops.sequence));



    const routeOrders = await db.select().from(orders).where(eq(orders.routeId, routeId));

    // Fetch items for consolidated summary
    const orderIds = routeOrders.map((o: any) => o.id);
    let allOrderItems: any[] = [];

    if (orderIds.length > 0) {
        allOrderItems = await db.select({
            orderId: orderItems.orderId,
            itemId: orderItems.itemId,
            itemName: items.name,
            quantity: orderItems.quantity,
            price: orderItems.price,
            total: sql<number>`${orderItems.quantity} * ${orderItems.price}`
        })
            .from(orderItems)
            .leftJoin(items, eq(orderItems.itemId, items.id))
            .where(inArray(orderItems.orderId, orderIds));
    }

    const consolidatedItems: Record<string, { name: string, quantity: number, total: number }> = {};

    allOrderItems.forEach((item: any) => {
        if (!consolidatedItems[item.itemId]) {
            consolidatedItems[item.itemId] = { name: item.itemName || 'Unknown', quantity: 0, total: 0 };
        }
        consolidatedItems[item.itemId].quantity += item.quantity;
        consolidatedItems[item.itemId].total += item.total;
    });

    const itemSummary = Object.values(consolidatedItems);

    const ordersWithItems = routeOrders.map((order: any) => {
        // Find store info from stops if possible, or we need to join in the first query.
        // Actually, stores are joined in routeStops, but orders has storeId.
        // Let's rely on the fact we need store address.
        // The current query for routeOrders is simple. Let's update it or map from stops.

        const stopWithStore = stops.find((s: any) => s.storeId === order.storeId);

        return {
            ...order,
            items: consolidatedItems ?
                allOrderItems.filter((i: any) => i.orderId === order.id).map((i: any) => ({
                    itemName: i.itemName,
                    quantity: i.quantity,
                    price: i.price
                }))
                : [],
            storeAddress: stopWithStore?.address,
            storeName: stopWithStore?.storeName // Ensure name is present
        };
    });

    return {
        route,
        stops,
        orders: ordersWithItems,
        itemSummary
    };
}

// --- General Dashboard Reports ---

export async function getRevenueReport(startDate?: string, endDate?: string) {
    const whereClause = (startDate && endDate)
        ? and(gte(orders.date, startDate), lte(orders.date, endDate))
        : undefined;

    const allOrders = await db.select({
        storeId: orders.storeId,
        total: orders.totalAmount,
        paid: orders.paidAmount,
        storeName: stores.name
    })
        .from(orders)
        .leftJoin(stores, eq(orders.storeId, stores.id))
        .where(whereClause);

    const storeStats: Record<string, { name: string, total: number, paid: number, pending: number }> = {};
    let grandTotal = 0;
    let grandPaid = 0;
    let grandPending = 0;

    for (const o of allOrders) {
        if (!o.storeId) continue;
        if (!storeStats[o.storeId]) {
            storeStats[o.storeId] = { name: o.storeName || 'Unknown', total: 0, paid: 0, pending: 0 };
        }
        const t = o.total || 0;
        const p = o.paid || 0;
        storeStats[o.storeId].total += t;
        storeStats[o.storeId].paid += p;
        storeStats[o.storeId].pending += (t - p);

        grandTotal += t;
        grandPaid += p;
        grandPending += (t - p);
    }

    return {
        grandTotal,
        grandPaid,
        grandPending,
        storeWise: Object.values(storeStats)
    };
}

export async function getItemSalesReport(startDate?: string, endDate?: string) {
    // Need to join orders to filter by date
    const whereClause = (startDate && endDate)
        ? and(gte(orders.date, startDate), lte(orders.date, endDate))
        : undefined;

    const soldItems = await db.select({
        itemId: orderItems.itemId,
        storeId: orders.storeId,
        itemName: items.name,
        storeName: stores.name,
        quantity: orderItems.quantity,
        price: orderItems.price,
        total: sql<number>`${orderItems.quantity} * ${orderItems.price}`
    })
        .from(orderItems)
        .leftJoin(orders, eq(orderItems.orderId, orders.id))
        .leftJoin(items, eq(orderItems.itemId, items.id))
        .leftJoin(stores, eq(orders.storeId, stores.id))
        .where(whereClause);

    const itemStats: Record<string, {
        name: string,
        totalQty: number,
        totalAmount: number,
        storeBreakup: { storeName: string, qty: number, amount: number }[]
    }> = {};

    for (const row of soldItems) {
        if (!row.itemId) continue;
        if (!itemStats[row.itemId]) {
            itemStats[row.itemId] = { name: row.itemName || 'Unknown', totalQty: 0, totalAmount: 0, storeBreakup: [] };
        }

        itemStats[row.itemId].totalQty += row.quantity;
        itemStats[row.itemId].totalAmount += row.total;

        // Store breakdown
        const storeName = row.storeName || 'Unknown';
        const existingStore = itemStats[row.itemId].storeBreakup.find((s: any) => s.storeName === storeName);
        if (existingStore) {
            existingStore.qty += row.quantity;
            existingStore.amount += row.total;
        } else {
            itemStats[row.itemId].storeBreakup.push({ storeName, qty: row.quantity, amount: row.total });
        }
    }

    return Object.values(itemStats);
}

export async function getDriverReport(startDate?: string, endDate?: string) {
    const whereClause = (startDate && endDate)
        ? and(gte(orders.date, startDate), lte(orders.date, endDate))
        : undefined;

    const allOrders = await db.select({
        driverId: orders.driverId,
        driverName: users.name,
        total: orders.totalAmount,
        paid: orders.paidAmount,
        paymentMethod: orders.paymentMethod,
        cashReceived: orders.cashPaid,
        upiReceived: orders.upiPaid,
        id: orders.id
    })
        .from(orders)
        .leftJoin(users, eq(orders.driverId, users.id))
        .where(whereClause);

    // Need items to count total items delivered? That's expensive to fetch all items for all orders.
    // Let's do a separate aggregate if needed, or just count orders/revenue for now.
    // Efficient way:
    const driverStats: Record<string, {
        driverId: string,
        name: string,
        deliveriesCount: number,
        cashCollected: number,
        upiCollected: number,
        totalItems: number
    }> = {};

    const orderIds = allOrders.map((o: any) => o.id);
    let itemCounts: Record<string, number> = {};

    if (orderIds.length > 0) {
        const counts = await db.select({
            orderId: orderItems.orderId,
            qty: sql<number>`sum(${orderItems.quantity})`
        })
            .from(orderItems)
            .where(inArray(orderItems.orderId, orderIds))
            .groupBy(orderItems.orderId);

        counts.forEach((c: any) => itemCounts[c.orderId] = c.qty);
    }

    for (const o of allOrders) {
        if (!o.driverId) continue;
        const driverId = o.driverId;

        if (!driverStats[driverId]) {
            driverStats[driverId] = {
                driverId,
                name: o.driverName || 'Unknown',
                deliveriesCount: 0,
                cashCollected: 0,
                upiCollected: 0,
                totalItems: 0
            };
        }

        driverStats[driverId].deliveriesCount++;

        if (o.paymentMethod === 'cash') {
            driverStats[driverId].cashCollected += (o.paid || 0);
        } else if (o.paymentMethod === 'upi') {
            driverStats[driverId].upiCollected += (o.paid || 0);
        } else if (o.paymentMethod === 'split') {
            driverStats[driverId].cashCollected += (o.cashReceived || 0);
            driverStats[driverId].upiCollected += (o.upiReceived || 0);
        }

        driverStats[driverId].totalItems += (itemCounts[o.id] || 0);
    }

    return Object.values(driverStats);
}

export async function getDriverDailyStats(driverId: string, date: string) {
    const dayOrders = await db.select().from(orders).where(
        and(
            eq(orders.driverId, driverId),
            eq(orders.date, date)
        )
    );

    const totalCollected = dayOrders.reduce((sum: number, o: any) => sum + (o.paidAmount || 0), 0);
    const totalPending = dayOrders.reduce((sum: number, o: any) => sum + ((o.totalAmount || 0) - (o.paidAmount || 0)), 0);

    return {
        ordersCount: dayOrders.length,
        totalCollected,
        totalPending
    };
}

export async function getDriverOrders(driverId: string, startDate?: string, endDate?: string) {
    const whereClause = (startDate && endDate)
        ? and(eq(orders.driverId, driverId), gte(orders.date, startDate), lte(orders.date, endDate))
        : eq(orders.driverId, driverId);

    const driverOrders = await db.select({
        id: orders.id,
        date: orders.date,
        storeName: stores.name,
        totalAmount: orders.totalAmount,
        paidAmount: orders.paidAmount,
        paymentMethod: orders.paymentMethod,
        cashPaid: orders.cashPaid,
        upiPaid: orders.upiPaid
    })
        .from(orders)
        .leftJoin(stores, eq(orders.storeId, stores.id))
        .where(whereClause)
        .orderBy(desc(orders.date));

    // Fetch items for these orders
    const orderIds = driverOrders.map((o: any) => o.id);
    let orderItemsMap: Record<string, any[]> = {};

    if (orderIds.length > 0) {
        const itemsData = await db.select({
            orderId: orderItems.orderId,
            itemName: items.name,
            quantity: orderItems.quantity,
            price: orderItems.price
        })
            .from(orderItems)
            .leftJoin(items, eq(orderItems.itemId, items.id))
            .where(inArray(orderItems.orderId, orderIds));

        itemsData.forEach((item: any) => {
            if (!orderItemsMap[item.orderId]) {
                orderItemsMap[item.orderId] = [];
            }
            orderItemsMap[item.orderId].push(item);
        });
    }

    const ordersWithItems = driverOrders.map((order: any) => ({
        ...order,
        items: orderItemsMap[order.id] || [],
        storeAddress: order['address'] // Map address if available from join
    }));

    const totals = {
        totalDeliveries: driverOrders.length,
        totalRevenue: driverOrders.reduce((acc: number, o: any) => acc + (o.totalAmount || 0), 0),
        totalCash: driverOrders.reduce((acc: number, o: any) => {
            if (o.paymentMethod === 'cash') return acc + (o.paidAmount || 0);
            if (o.paymentMethod === 'split') return acc + (o.cashReceived || o.cashPaid || 0); // Handle schema variations if any, usually cashPaid
            return acc;
        }, 0),
        totalUpi: driverOrders.reduce((acc: number, o: any) => {
            if (o.paymentMethod === 'upi') return acc + (o.paidAmount || 0);
            if (o.paymentMethod === 'split') return acc + (o.upiReceived || o.upiPaid || 0);
            return acc;
        }, 0),
        // Add Pending Calculation
        totalPending: driverOrders.reduce((acc: number, o: any) => acc + ((o.totalAmount || 0) - (o.paidAmount || 0)), 0)
    };

    return {
        orders: ordersWithItems,
        totals
    };
}

export async function getDriverItemSummary(driverId: string, startDate?: string, endDate?: string) {
    const whereClause = (startDate && endDate)
        ? and(eq(orders.driverId, driverId), gte(orders.date, startDate), lte(orders.date, endDate))
        : eq(orders.driverId, driverId);

    // Get order IDs first
    const driverOrders = await db.select({ id: orders.id }).from(orders).where(whereClause);
    const orderIds = driverOrders.map((o: any) => o.id);

    if (orderIds.length === 0) return [];

    const summary = await db.select({
        itemId: orderItems.itemId,
        itemName: items.name,
        totalQty: sql<number>`sum(${orderItems.quantity})`,
        totalValue: sql<number>`sum(${orderItems.quantity} * ${orderItems.price})`
    })
        .from(orderItems)
        .leftJoin(items, eq(orderItems.itemId, items.id))
        .where(inArray(orderItems.orderId, orderIds))
        .groupBy(orderItems.itemId, items.name)
        .orderBy(desc(sql<number>`sum(${orderItems.quantity})`));

    return summary.map((item: any) => ({
        itemId: item.itemId,
        name: item.itemName || 'Unknown',
        quantity: Number(item.totalQty),
        value: Number(item.totalValue)
    }));
}
