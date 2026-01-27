'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Search } from 'lucide-react';

type Store = {
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
};

type StoreStats = {
    balance: number;
    revenue: number;
};

type Props = {
    stores: Store[];
    balances: Record<string, StoreStats>;
    deleteStoreAction: (id: string) => Promise<void>;
};

export default function StoreList({ stores, balances, deleteStoreAction }: Props) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredStores = stores.filter(store =>
        store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (store.phone && store.phone.includes(searchTerm)) ||
        (store.address && store.address.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div>
            <div className="mb-4 relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black dark:text-white shadow-sm"
                    placeholder="Search stores by name, phone, or address..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="mt-8 flow-root">
                <div className="inline-block min-w-full align-middle">
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-2 md:pt-0">
                        <table className="min-w-full text-gray-900 dark:text-gray-100">
                            <thead className="rounded-lg text-left text-sm font-normal">
                                <tr>
                                    <th scope="col" className="px-4 py-5 font-medium sm:pl-6">Name</th>
                                    <th scope="col" className="px-3 py-5 font-medium">Address</th>
                                    <th scope="col" className="px-3 py-5 font-medium">Phone</th>
                                    <th scope="col" className="px-3 py-5 font-medium text-right">Revenue</th>
                                    <th scope="col" className="px-3 py-5 font-medium text-right">Balance</th>
                                    <th scope="col" className="px-3 py-5 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900">
                                {filteredStores.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-gray-500">
                                            No stores found matching "{searchTerm}"
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStores.map((store) => {
                                        const stats = balances[store.id] || { balance: 0, revenue: 0 };
                                        return (
                                            <tr key={store.id} className="w-full border-b py-3 text-sm last-of-type:border-none border-gray-100 dark:border-gray-800">
                                                <td className="whitespace-nowrap py-3 pl-6 pr-3 font-medium">
                                                    {store.name}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-3 text-gray-500">{store.address || '-'}</td>
                                                <td className="whitespace-nowrap px-3 py-3 text-gray-500">{store.phone || '-'}</td>
                                                <td className="whitespace-nowrap px-3 py-3 text-right font-medium text-blue-600">
                                                    ₹{stats.revenue}
                                                </td>
                                                <td className={`whitespace-nowrap px-3 py-3 text-right font-bold ${stats.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                    ₹{stats.balance}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-3">
                                                    <div className="flex gap-3">
                                                        <Link href={`/owner/stores/${store.id}/details`} className="rounded-md border p-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-blue-600">
                                                            View Details
                                                        </Link>
                                                        <Link href={`/owner/stores/${store.id}`} className="rounded-md border p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
                                                            Manage Prices
                                                        </Link>
                                                        <form action={async () => {
                                                            if (confirm('Are you sure you want to delete this store?')) {
                                                                await deleteStoreAction(store.id);
                                                            }
                                                        }}>
                                                            <button className="rounded-md border p-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-red-600">
                                                                Delete
                                                            </button>
                                                        </form>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
