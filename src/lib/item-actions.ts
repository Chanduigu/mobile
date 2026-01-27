'use server';

import { db } from '@/db';
import { items } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const CreateItemSchema = z.object({
    name: z.string().min(1),
    defaultPrice: z.coerce.number().min(0),
});

export async function createItem(formData: FormData) {
    const { name, defaultPrice } = CreateItemSchema.parse({
        name: formData.get('name'),
        defaultPrice: formData.get('defaultPrice'),
    });

    try {
        await db.insert(items).values({
            id: uuidv4(),
            name,
            defaultPrice,
        });
        revalidatePath('/owner/items');
    } catch (e) {
        console.error(e);
    }
}

export async function deleteItem(id: string) {
    try {
        await db.delete(items).where(eq(items.id, id));
        revalidatePath('/owner/items');
    } catch (e) {
        return { message: 'Failed to delete item' };
    }
}
