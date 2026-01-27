import { db } from '@/db';
import { stores } from '@/db/schema';
import { deleteStore, getStoreBalances } from '@/lib/store-actions';
import Link from 'next/link';
import CreateStoreForm from '@/components/create-store-form';

import StoreList from '@/components/store-list';

export default async function StoresPage() {
    const allStores = await db.select().from(stores).all();
    const balances = await getStoreBalances();

    return (
        <div className="w-full text-black dark:text-white">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Manage Stores</h1>
            </div>

            <CreateStoreForm />

            <StoreList
                stores={allStores}
                balances={balances}
                deleteStoreAction={deleteStore}
            />
        </div>
    );
}
