'use server';

import { db } from '@/db';
import { orders, orderItems } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function updateOrderAndPayment(
    orderId: string,
    itemsData: Record<string, number>, // itemId -> new Qty
    paymentData: { method: 'cash' | 'upi'; amount: number; paymentProof?: string }
) {
    if (!orderId) return { error: "Invalid ID" };

    try {
        await db.transaction(async (tx: any) => {
            // 1. Update quantities & Recalculate Total
            let newTotal = 0;

            // Fetch current items to get prices
            const currentItems = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));

            for (const item of currentItems) {
                const newQty = itemsData[item.itemId] ?? item.quantity; // Use new qty or fallback

                // Update item qty in DB if changed
                if (newQty !== item.quantity) {
                    await tx.update(orderItems)
                        .set({ quantity: newQty })
                        .where(eq(orderItems.id, item.id));
                }

                newTotal += newQty * item.price;
            }

            // 2. Update Order (Status, Total, Paid)
            await tx.update(orders).set({
                totalAmount: newTotal,
                paidAmount: paymentData.amount,
                paymentMethod: paymentData.method,
                status: 'delivered', // Mark as delivered when driver submits
                paymentProof: paymentData.paymentProof || null
            }).where(eq(orders.id, orderId));
        });

        revalidatePath(`/driver/orders/${orderId}`);
        revalidatePath(`/driver`);

    } catch (e) {
        console.error(e);
        return { error: 'Failed to update order' };
    }
}
