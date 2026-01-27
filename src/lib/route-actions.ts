'use server';

import { db } from '@/db';
import { routes, routeStops, stores, routeVehicleLoad, items, orders, orderItems } from '@/db/schema';
import { eq, and, asc, sql, inArray, like } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

export async function saveRoute(driverId: string, date: string, storeIds: string[]) {
    try {
        // 1. Get total count or max route number for this driver + date
        // efficient way: count existing routes
        const existingRoutes = await db.select({ id: routes.id })
            .from(routes)
            .where(
                and(
                    eq(routes.driverId, driverId),
                    eq(routes.date, date)
                )
            )
            ;

        const routeNumber = existingRoutes.length + 1;
        const routeId = uuidv4();

        console.log(`[saveRoute] Creating Route ${routeNumber} for Driver ${driverId} on ${date}`);

        // 2. Create NEW Route (Append only, never overwrite)
        await db.insert(routes).values({
            id: routeId,
            driverId,
            date,
            routeNumber: routeNumber, // Auto increment
            status: 'new' // Start as 'new'
        });

        // 3. Insert Stops
        if (storeIds.length > 0) {
            const stopsToInsert = storeIds.map((storeId, index) => ({
                id: uuidv4(),
                routeId,
                storeId,
                sequence: index + 1,
                status: 'pending' as const
            }));

            for (const stop of stopsToInsert) {
                await db.insert(routeStops).values(stop);
            }
        }

        revalidatePath('/owner/planner');
        revalidatePath('/owner/history');
        revalidatePath('/driver');
        return { success: true, routeId, routeNumber };
    } catch (e: any) {
        console.error('Error saving route:', e);
        return { error: e.message };
    }
}

export async function saveRouteLoad(routeId: string, items: { itemId: string, quantity: number }[]) {
    try {
        // Clear existing load for this route to avoid duplicates/conflicts during updates
        await db.delete(routeVehicleLoad).where(eq(routeVehicleLoad.routeId, routeId));

        if (items.length > 0) {
            const loadToInsert = items.map(item => ({
                id: uuidv4(),
                routeId,
                itemId: item.itemId,
                quantity: item.quantity
            }));

            for (const load of loadToInsert) {
                await db.insert(routeVehicleLoad).values(load);
            }
        }

        revalidatePath('/owner/planner');
        revalidatePath('/driver');
        return { success: true };
    } catch (e: any) {
        console.error('Error saving route load:', e);
        return { error: e.message };
    }
}

// Fetches ALL routes for a driver on a specific date
export async function getDailyRoutes(driverId: string, date: string) {
    const dailyRoutes = await db.select().from(routes).where(
        and(eq(routes.driverId, driverId), eq(routes.date, date))
    );

    if (dailyRoutes.length === 0) return [];

    const results = [];

    for (const route of dailyRoutes) {
        const stops = await db.select({
            id: routeStops.id,
            storeId: routeStops.storeId,
            sequence: routeStops.sequence,
            status: routeStops.status,
            completedAt: routeStops.completedAt,
            storeName: stores.name,
            address: stores.address,
            phone: stores.phone,
            lat: stores.latitude,
            lng: stores.longitude,
            gmapsLink: stores.gmapsLink
        })
            .from(routeStops)
            .leftJoin(stores, eq(routeStops.storeId, stores.id))
            .where(eq(routeStops.routeId, route.id))
            .orderBy(asc(routeStops.sequence));

        const load = await db.select({
            itemId: routeVehicleLoad.itemId,
            itemName: items.name,
            quantity: routeVehicleLoad.quantity
        })
            .from(routeVehicleLoad)
            .leftJoin(items, eq(routeVehicleLoad.itemId, items.id))
            .where(eq(routeVehicleLoad.routeId, route.id));

        results.push({ route, stops, load });
    }

    return results;
}

export async function getRoute(driverId: string, date: string) {
    // Deprecated? Or just returns the first one for backward compatibility
    const routes = await getDailyRoutes(driverId, date);
    return routes.length > 0 ? routes[0] : null;
}

export async function getRouteLoadComparison(routeId: string) {
    try {
        // 1. Get Route Details to find Driver + Date
        const currentRoute = await db.select().from(routes).where(eq(routes.id, routeId)).then(res => res[0]);
        if (!currentRoute) return null;

        const { driverId, date } = currentRoute;

        // 2. Get Loaded Quantities for THIS ROUTE ONLY
        const loadedItems = await db.select({
            itemId: routeVehicleLoad.itemId,
            quantity: routeVehicleLoad.quantity
        })
            .from(routeVehicleLoad)
            .where(eq(routeVehicleLoad.routeId, routeId));

        // 3. Get Delivered Quantities for THIS ROUTE ONLY
        const driverOrders = await db.select({ id: orders.id })
            .from(orders)
            .where(eq(orders.routeId, routeId));

        const orderIds = driverOrders.map((o: any) => o.id);

        let deliveredMap: Record<string, number> = {};

        if (orderIds.length > 0) {
            const deliveredData = await db.select({
                itemId: orderItems.itemId,
                totalQty: sql<number>`sum(${orderItems.quantity})`
            })
                .from(orderItems)
                .where(inArray(orderItems.orderId, orderIds))
                .groupBy(orderItems.itemId);

            deliveredData.forEach((d: any) => {
                if (d.itemId) deliveredMap[d.itemId] = Number(d.totalQty);
            });
        }

        // 5. Merge and Compare
        const allItems = await db.select().from(items);
        const itemMap = new Map(allItems.map((i: any) => [i.id, i.name]));

        const involvedItemIds = new Set([
            ...loadedItems.map((l: any) => l.itemId),
            ...Object.keys(deliveredMap)
        ]);

        const comparison = Array.from(involvedItemIds).map(itemId => {
            const loaded = Number(loadedItems.find((l: any) => l.itemId === itemId)?.quantity || 0);
            const delivered = deliveredMap[itemId] || 0;
            return {
                itemId,
                itemName: itemMap.get(itemId) || 'Unknown Item',
                loaded,
                delivered,
                remaining: loaded - delivered
            };
        });

        return comparison;

    } catch (e) {
        console.error("Error getting load comparison:", e);
        return [];
    }
}


export async function toggleStopStatus(stopId: string, status: 'visited' | 'pending' | 'skipped') {
    try {
        await db.update(routeStops).set({
            status,
            completedAt: status === 'visited' ? new Date() : null
        }).where(eq(routeStops.id, stopId));
        revalidatePath('/driver');
        revalidatePath('/owner/history');
        revalidatePath('/owner/planner');
        return { success: true };
    } catch (e) {
        console.error('Error toggling stop:', e);
        return { error: 'Failed to update status' };
    }
}

export async function closeRoute(routeId: string) {
    try {
        await db.update(routes).set({
            status: 'closed',
            closedAt: new Date()
        }).where(eq(routes.id, routeId));

        revalidatePath('/owner/history');
        revalidatePath('/owner/planner');
        revalidatePath('/driver');
        return { success: true };
    } catch (e: any) {
        console.error('Error closing route:', e);
        return { error: e.message };
    }
}
