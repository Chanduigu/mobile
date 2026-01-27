import { db } from '@/db';
import { stores, items, storePrices } from '@/db/schema';
import { updateStorePriceSimpleAction } from '@/lib/store-actions';
import { eq, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';

export default async function StorePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const store = await db.select().from(stores).where(eq(stores.id, id)).get();
    if (!store) notFound();

    const allItems = await db.select().from(items);
    // Get all custom prices for this store
    const customPrices = await db.select().from(storePrices).where(eq(storePrices.storeId, store.id));

    // Transform to map for easy lookup
    const priceMap = new Map();
    customPrices.forEach((cp: any) => priceMap.set(cp.itemId, cp.price));

    return (
        <div className="w-full text-black dark:text-white">
            <h1 className="text-2xl font-bold mb-4">{store.name} - Pricing</h1>
            <p className="mb-6 text-gray-500">Set custom prices for this store. If no custom price is set, the item default price applies.</p>

            <div className="flow-root">
                <div className="inline-block min-w-full align-middle">
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-2 md:pt-0">
                        <table className="min-w-full text-gray-900 dark:text-gray-100">
                            <thead className="rounded-lg text-left text-sm font-normal">
                                <tr>
                                    <th scope="col" className="px-4 py-5 font-medium sm:pl-6">Item</th>
                                    <th scope="col" className="px-3 py-5 font-medium">Default Price</th>
                                    <th scope="col" className="px-3 py-5 font-medium">Custom Price</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900">
                                {allItems.map((item: any) => {
                                    const currentCustomPrice = priceMap.get(item.id);
                                    return (
                                        <tr key={item.id} className="w-full border-b py-3 text-sm last-of-type:border-none border-gray-100 dark:border-gray-800">
                                            <td className="whitespace-nowrap py-3 pl-6 pr-3 font-medium">{item.name}</td>
                                            <td className="whitespace-nowrap px-3 py-3 text-gray-500">₹{item.defaultPrice}</td>
                                            <td className="whitespace-nowrap px-3 py-3">
                                                <form action={updateStorePriceSimpleAction} className="flex gap-2">
                                                    <input type="hidden" name="storeId" value={store.id} />
                                                    <input type="hidden" name="itemId" value={item.id} />
                                                    <input
                                                        name="price"
                                                        type="number"
                                                        step="0.01"
                                                        defaultValue={currentCustomPrice ?? ''}
                                                        placeholder="Default"
                                                        className="block w-24 rounded-md border border-gray-200 py-1 px-2 text-sm outline-2 placeholder:text-gray-400 text-black"
                                                    />
                                                    <button className="text-blue-600 hover:text-blue-800 text-xs">Save</button>
                                                </form>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
