'use server';

import { db } from '@/db';
import { stores, storePrices, orders } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const CreateStoreSchema = z.object({
    name: z.string().min(1),
    address: z.string().optional(),
    phone: z.string().optional(),
    latitude: z.string().nullable().optional(),
    longitude: z.string().nullable().optional(),
    gmapsLink: z.string().optional(),
});

export async function createStore(formData: FormData) {
    const { name, address, phone, latitude, longitude, gmapsLink } = CreateStoreSchema.parse({
        name: formData.get('name'),
        address: formData.get('address'),
        phone: formData.get('phone'),
        latitude: formData.get('latitude'),
        longitude: formData.get('longitude'),
        gmapsLink: formData.get('gmapsLink'),
    });

    try {
        await db.insert(stores).values({
            id: uuidv4(),
            name,
            address: address || null,
            phone: phone || null,
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null,
            gmapsLink: gmapsLink || null,
        });
        revalidatePath('/owner/stores');
    } catch (e) {
        console.error(e);
    }
}

export async function deleteStore(id: string, _formData?: FormData) {
    try {
        await db.delete(stores).where(eq(stores.id, id));
        revalidatePath('/owner/stores');
    } catch (e) {
        console.error('Failed to delete store', e);
    }
}


export async function updateStorePrice(storeId: string, itemId: string, price: number) {
    try {
        console.log(`Updating price for Store ${storeId}, Item ${itemId} to ${price}`);
        const existing = await db.select().from(storePrices).where(and(eq(storePrices.storeId, storeId), eq(storePrices.itemId, itemId))).then(res => res[0]);

        if (existing) {
            await db.update(storePrices).set({ price }).where(eq(storePrices.id, existing.id));
        } else {
            await db.insert(storePrices).values({
                id: uuidv4(),
                storeId,
                itemId,
                price
            });
        }
        revalidatePath(`/owner/stores/${storeId}`);
    } catch (e) {
        console.error('Error updating store price:', e);
        throw e;
    }
}

export async function updateStorePriceSimpleAction(formData: FormData) {
    const storeId = formData.get('storeId') as string;
    const itemId = formData.get('itemId') as string;
    const priceRaw = formData.get('price');

    console.log(`[ACTION] Update Price: Store=${storeId}, Item=${itemId}, PriceRaw=${priceRaw}`);

    if (!storeId || !itemId) {
        console.error('[ACTION] Missing ID');
        return;
    }

    try {
        if (priceRaw === null || priceRaw === '' || priceRaw.toString().trim() === '') {
            // If empty, delete the custom price
            console.log(`[ACTION] Deleting custom price for ${itemId}`);
            await db.delete(storePrices).where(and(eq(storePrices.storeId, storeId), eq(storePrices.itemId, itemId)));
        } else {
            const price = Number(priceRaw);
            if (!isNaN(price)) {
                await updateStorePrice(storeId, itemId, price);
            } else {
                console.error('[ACTION] Invalid price number');
            }
        }
        revalidatePath(`/owner/stores/${storeId}`);
    } catch (error) {
        console.error('[ACTION] Error in updateStorePriceSimpleAction:', error);
    }
}

export async function getStoreBalances() {
    const allOrders = await db.select({
        storeId: orders.storeId,
        total: orders.totalAmount,
        paid: orders.paidAmount
    }).from(orders);

    const storeStats: Record<string, { balance: number, revenue: number }> = {};

    for (const order of allOrders) {
        if (!storeStats[order.storeId]) {
            storeStats[order.storeId] = { balance: 0, revenue: 0 };
        }
        const total = order.total || 0;
        const paid = order.paid || 0;

        // Ensure numbers
        const r = storeStats[order.storeId].revenue + total;
        const b = storeStats[order.storeId].balance + (total - paid);

        // Fix precision issues
        storeStats[order.storeId].revenue = Math.round(r * 100) / 100;
        storeStats[order.storeId].balance = Math.round(b * 100) / 100;
    }

    return storeStats;
}

export async function getStoreDetails(storeId: string) {
    if (!storeId) return null;

    const storeOrders = await db.select({
        total: orders.totalAmount,
        paid: orders.paidAmount
    }).from(orders).where(eq(orders.storeId, storeId));

    let totalBilled = 0;
    let totalPaid = 0;

    for (const order of storeOrders) {
        totalBilled += (order.total || 0);
        totalPaid += (order.paid || 0);
    }

    // Fix precision
    totalBilled = Math.round(totalBilled * 100) / 100;
    totalPaid = Math.round(totalPaid * 100) / 100;
    const balance = Math.round((totalBilled - totalPaid) * 100) / 100;

    const store = await db.select().from(stores).where(eq(stores.id, storeId)).then(res => res[0]);

    return {
        id: storeId,
        name: store?.name || 'Unknown',
        totalBilled,
        totalPaid,
        balance
    };
}
