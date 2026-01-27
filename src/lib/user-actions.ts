'use server';

import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

// --- Driver Management ---

export async function addDriver(prevState: any, formData: FormData) {
    const name = formData.get('name') as string;
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    if (!name || !username || !password) {
        return { message: 'All fields are required.' };
    }

    try {
        // Check if username exists
        const existing = await db.select().from(users).where(eq(users.username, username)).then(res => res[0]);
        if (existing) {
            return { message: 'Username already taken.' };
        }

        await db.insert(users).values({
            id: uuidv4(),
            name,
            username,
            password, // Note: In a real app, hash this! but adhering to existing pattern (plain text '123' used previously)
            role: 'driver'
        });

        revalidatePath('/owner/settings');
        return { message: 'Driver added successfully!', success: true };
    } catch (e) {
        console.error(e);
        return { message: 'Failed to add driver.' };
    }
}

export async function deleteDriver(id: string) {
    try {
        await db.delete(users).where(and(eq(users.id, id), eq(users.role, 'driver')));
        revalidatePath('/owner/settings');
    } catch (e) {
        console.error('Failed to delete driver', e);
    }
}

// --- Owner Management ---

export async function updateOwner(prevState: any, formData: FormData) {
    const currentUsername = formData.get('currentUsername') as string;
    const newUsername = formData.get('newUsername') as string;
    const newPassword = formData.get('newPassword') as string;

    if (!currentUsername || !newUsername || !newPassword) {
        return { message: 'All fields are required.' };
    }

    try {
        // Find owner (Safety check: Must be role='owner')
        const owner = await db.select().from(users).where(and(eq(users.role, 'owner'), eq(users.username, currentUsername))).then(res => res[0]);

        if (!owner) {
            return { message: 'Current username incorrect or not an owner.' };
        }

        // Check uniqueness if changing username
        if (newUsername !== currentUsername) {
            const existing = await db.select().from(users).where(eq(users.username, newUsername)).then(res => res[0]);
            if (existing) {
                return { message: 'New username is already taken.' };
            }
        }

        await db.update(users).set({
            username: newUsername,
            password: newPassword
        }).where(eq(users.id, owner.id));

        // We do NOT redirect because it might log them out or just be confusing. Just show success.
        revalidatePath('/owner/settings');
        return { message: 'Owner credentials updated successfully!', success: true };

    } catch (e) {
        console.error(e);
        return { message: 'Failed to update credentials.' };
    }
}

export async function getDrivers() {
    return await db.select().from(users).where(eq(users.role, 'driver'));
}
