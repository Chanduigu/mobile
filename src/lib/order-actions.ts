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
    paymentProof?: string;
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
        await db.transaction(async (tx) => {
            console.log('[createOrder] Inserting order...');
            await tx.insert(orders).values({
                id: orderId,
                storeId: data.storeId,
                driverId: finalDriverId || null,
                routeId: data.routeId || null,
                date: new Date().toISOString(),
                status: status as any, // Enums mismatch potential, casting as any or matching strictly
                totalAmount: totalAmount,
                paidAmount: totalPaid,
                cashPaid: cashReceived,
                upiPaid: upiReceived,
                paymentMethod: paymentMethod as any,
                collectedBy: (data.collectedBy || 'DRIVER') as any,
                collectorName: data.collectorName || null,
                type: (data.type || 'delivery') as any,
                paymentProof: data.paymentProof || null
            });

            console.log('[createOrder] Inserting items...');
            for (const item of data.items) {
                await tx.insert(orderItems).values({
                    id: uuidv4(),
                    orderId: orderId,
                    itemId: item.itemId,
                    quantity: item.quantity,
                    price: item.price,
                });
            }

            // Update Route Stop Status if routeId and storeId are present
            if (data.routeId && data.storeId) {
                console.log(`[createOrder] Marking stop visited for Route: ${data.routeId}, Store: ${data.storeId}`);
                await tx.update(routeStops)
                    .set({
                        status: 'visited',
                        completedAt: new Date()
                    })
                    .where(
                        and(
                            eq(routeStops.routeId, data.routeId),
                            eq(routeStops.storeId, data.storeId)
                        )
                    );
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
