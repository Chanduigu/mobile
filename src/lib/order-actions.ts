'use server';

import { db } from '@/db';
import { orders, orderItems, routeStops } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { redirect } from 'next/navigation';
import { eq, and } from 'drizzle-orm';

export async function createOrder(data: {
    storeId: string;
    driverId?: string;
    routeId?: string; // Add routeId to input
    items: { itemId: string; quantity: number; price: number }[];
    // Replace single paidAmount/method with split
    collectedBy?: 'OWNER' | 'DRIVER';
    collectorName?: string;
    type?: 'delivery' | 'collection';
    cashReceived?: number;
    upiReceived?: number;
    status?: string;
    redirectPath?: string;
}) {
    // Validate basics
    if (!data.storeId) {
        return { error: "Invalid order data: Missing Shop" };
    }
    // For Collection: empty items are allowed. For Delivery: items required.
    if ((!data.type || data.type === 'delivery') && data.items.length === 0) {
        return { error: "Invalid order data: No items in delivery" };
    }

    const orderId = uuidv4();
    const isCollection = data.type === 'collection';

    // For Collection, totalAmount represents 'Value of Goods Sold' which is 0.
    // For Delivery, it is sum of item prices.
    const totalAmount = isCollection
        ? 0
        : data.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    // Split payment logic
    const cashReceived = data.cashReceived || 0;
    const upiReceived = data.upiReceived || 0;
    const totalPaid = cashReceived + upiReceived;

    const status = data.status || 'pending';

    // Determine payment method string for legacy support/badge
    let paymentMethod = 'none';
    if (cashReceived > 0 && upiReceived > 0) paymentMethod = 'split';
    else if (cashReceived > 0) paymentMethod = 'cash';
    else if (upiReceived > 0) paymentMethod = 'upi';

    // Handle Owner Collection (Driver is irrelevant)
    const finalDriverId = data.collectedBy === 'OWNER' ? null : data.driverId;

    console.log('[createOrder] Starting...', {
        orderId,
        storeId: data.storeId,
        driverId: finalDriverId,
        routeId: data.routeId,
        paymentMethod,
        cashReceived,
        upiReceived,
        itemsCount: data.items.length,
        type: data.type,
        collectedBy: data.collectedBy
    });

    try {
        // NOTE: better-sqlite3 transactions are synchronous. Do not await them.
        db.transaction((tx: any) => {
            console.log('[createOrder] Inserting order...');
            tx.insert(orders).values({
                id: orderId,
                storeId: data.storeId,
                driverId: finalDriverId || null,
                routeId: data.routeId || null,
                date: new Date().toISOString(),
                status: status as 'pending' | 'delivered' | 'cancelled',
                totalAmount: totalAmount,
                paidAmount: totalPaid,
                cashPaid: cashReceived,
                upiPaid: upiReceived,
                paymentMethod: paymentMethod as 'cash' | 'upi' | 'split' | 'none',
                collectedBy: data.collectedBy || 'DRIVER',
                collectorName: data.collectorName || null,
                type: data.type || 'delivery'
            }).run();

            console.log('[createOrder] Inserting items...');
            for (const item of data.items) {
                tx.insert(orderItems).values({
                    id: uuidv4(),
                    orderId: orderId,
                    itemId: item.itemId,
                    quantity: item.quantity,
                    price: item.price,
                }).run();
            }

            // Update Route Stop Status if routeId and storeId are present
            if (data.routeId && data.storeId) {
                console.log(`[createOrder] Marking stop visited for Route: ${data.routeId}, Store: ${data.storeId}`);
                tx.update(routeStops)
                    .set({
                        status: 'visited',
                        completedAt: new Date()
                    })
                    .where(
                        and(
                            eq(routeStops.routeId, data.routeId),
                            eq(routeStops.storeId, data.storeId)
                        )
                    )
                    .run();
            }



        });
        console.log('[createOrder] Transaction success');
    } catch (e: any) {
        console.error('[createOrder] Transaction FAILED:', e);
        return { error: `Failed to create order: ${e.message || e}` };
    }

    revalidatePath('/owner');
    revalidatePath('/driver');

    if (data.redirectPath) {
        // If it's a driver creating an order, it might be /driver/orders/[id]
        const path = data.redirectPath.replace('[id]', orderId);
        redirect(path);
    } else {
        redirect('/owner'); // Default to owner dashboard
    }
}
