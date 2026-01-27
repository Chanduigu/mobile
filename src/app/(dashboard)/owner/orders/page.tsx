import { db } from '@/db';
import { orders, stores, users } from '@/db/schema';
import { desc, eq, and, like } from 'drizzle-orm';
import Link from 'next/link';

import DeliveryList from '@/components/delivery-list'; // We'll make this client-side for interactivity

export default async function DeliveriesPage({ searchParams }: { searchParams: Promise<{ store?: string; date?: string; driver?: string }> }) {
    const params = await searchParams;

    // Fetch initial data
    const allStores = await db.select({ id: stores.id, name: stores.name, address: stores.address }).from(stores);
    const allDrivers = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.role, 'driver'));

    // Ideally, we fetch orders based on search params here or let the client component handle filtering if dataset is small.
    // Given "Simple App", let's fetch recent 100 or all if possible.

    const dbOrders = await db.select({
        id: orders.id,
        date: orders.date,
        totalAmount: orders.totalAmount,
        paidAmount: orders.paidAmount,
        storeName: stores.name,
        driverName: users.name,
        status: orders.status
    })
        .from(orders)
        .leftJoin(stores, eq(orders.storeId, stores.id))
        .leftJoin(users, eq(orders.driverId, users.id))
        .orderBy(desc(orders.date))
        .limit(200); // Limit for performance

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-black dark:text-white">All Deliveries</h1>
            <DeliveryList
                initialOrders={dbOrders}
                stores={allStores}
                drivers={allDrivers}
            />
        </div>
    );
}
