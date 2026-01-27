import { db } from '@/db';
import { users, stores, items } from '@/db/schema';
import { eq } from 'drizzle-orm';
import RoutePlanner from '@/components/route-planner';

export default async function RoutePlannerPage() {
    const drivers = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.role, 'driver'));
    const allStores = await db.select({ id: stores.id, name: stores.name, address: stores.address }).from(stores);
    const allItems = await db.select().from(items);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-black dark:text-white">Delivery Route Planner</h1>
            <p className="text-gray-500">Assign drivers and drag stores to create the optimal delivery path.</p>

            <RoutePlanner
                drivers={drivers}
                stores={allStores}
                items={allItems}
            />
        </div>
    );
}
