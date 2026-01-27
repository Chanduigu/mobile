import { db } from '@/db';
import { stores, users, items, storePrices } from '@/db/schema';
import CreateOrderForm from '@/components/create-order-form';
import { eq } from 'drizzle-orm';

export default async function BillingPage() {
    const allStores = await db.select({ id: stores.id, name: stores.name }).from(stores);
    const allDrivers = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.role, 'driver'));
    const allItems = await db.select().from(items);
    const allPrices = await db.select().from(storePrices);

    return (
        <div className="w-full h-full pb-20 md:pb-0">
            <h1 className="text-2xl font-bold text-black dark:text-white mb-6">Create New Bill</h1>
            <CreateOrderForm
                stores={allStores}
                drivers={allDrivers}
                items={allItems}
                storePrices={allPrices}
                role="owner"
            />
        </div>
    );
}
