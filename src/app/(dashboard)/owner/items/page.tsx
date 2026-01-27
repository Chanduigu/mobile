import { db } from '@/db';
import { items } from '@/db/schema';
import { createItem, deleteItem } from '@/lib/item-actions'; // Ensure this matches file path
import { revalidatePath } from 'next/cache';

export default async function ItemsPage() {
    const allItems = await db.select().from(items);

    return (
        <div className="w-full text-black dark:text-white">
            <div className="flex w-full items-center justify-between">
                <h1 className="text-2xl font-bold">Items</h1>
            </div>

            {/* Add Item Form */}
            <div className="mt-4 rounded-md bg-gray-50 dark:bg-gray-800 p-4 md:p-6">
                <h2 className="mb-4 text-lg">Add New Item</h2>
                <form action={createItem} className="flex gap-4 items-end flex-wrap">
                    <div>
                        <label className="mb-2 block text-sm font-medium">Name</label>
                        <input name="name" type="text" placeholder="Pani Puri" className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500 text-black" required />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium">Default Price (₹)</label>
                        <input name="defaultPrice" type="number" step="0.01" placeholder="50.00" className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500 text-black" required />
                    </div>
                    <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">
                        Add Item
                    </button>
                </form>
            </div>

            {/* Items List */}
            <div className="mt-8 flow-root">
                <div className="inline-block min-w-full align-middle">
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-2 md:pt-0">
                        <table className="min-w-full text-gray-900 dark:text-gray-100">
                            <thead className="rounded-lg text-left text-sm font-normal">
                                <tr>
                                    <th scope="col" className="px-4 py-5 font-medium sm:pl-6">Name</th>
                                    <th scope="col" className="px-3 py-5 font-medium">Default Price</th>
                                    <th scope="col" className="relative py-3 pl-6 pr-3">
                                        <span className="sr-only">Edit</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900">
                                {allItems.map((item: any) => (
                                    <tr key={item.id} className="w-full border-b py-3 text-sm last-of-type:border-none border-gray-100 dark:border-gray-800">
                                        <td className="whitespace-nowrap py-3 pl-6 pr-3">
                                            <div className="flex items-center gap-3">
                                                <p>{item.name}</p>
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-3">
                                            ₹{item.defaultPrice}
                                        </td>
                                        <td className="whitespace-nowrap py-3 pl-6 pr-3">
                                            <div className="flex justify-end gap-3">
                                                <form action={async () => {
                                                    'use server';
                                                    await deleteItem(item.id);
                                                }}>
                                                    <button className="rounded-md border p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
                                                        <span className="sr-only">Delete</span>
                                                        🗑️
                                                    </button>
                                                </form>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
