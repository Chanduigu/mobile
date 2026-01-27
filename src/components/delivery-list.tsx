'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import SearchableSelect from '@/components/searchable-select';

type Order = {
    id: string;
    date: string;
    totalAmount: number | null;
    paidAmount: number | null;
    storeName: string | null;
    driverName: string | null;
    status: string;
};

type Store = { id: string; name: string; address?: string | null };
type Driver = { id: string; name: string };

export default function DeliveryList({ initialOrders, stores, drivers }: { initialOrders: Order[], stores: Store[], drivers: Driver[] }) {
    const [selectedStoreId, setSelectedStoreId] = useState<string>('');
    const [selectedDriverId, setSelectedDriverId] = useState<string>('');
    const [dateFilter, setDateFilter] = useState<string>('');

    const driversMap = useMemo(() => new Map(drivers.map(d => [d.id, d.name])), [drivers]);
    const storesMap = useMemo(() => new Map(stores.map(s => [s.id, s.name])), [stores]);

    const filteredOrders = useMemo(() => {
        return initialOrders.filter(order => {
            // Store Filter
            // Note: initialOrders has storeName, but to strictly filter by ID we'd need storeId in result. 
            // For now, let's assume we filter by matching name if we only have name, or better, update query.
            // Actually, for search, better to filter by text if we don't reload.
            // Let's rely on name matching for simplicity or we should fail if strictly needed.
            // Ideally passing storeId is better. Let's assume passed orders have names to match.

            if (selectedStoreId) {
                const storeName = storesMap.get(selectedStoreId);
                if (storeName && order.storeName !== storeName) return false;
            }

            if (selectedDriverId) {
                const driverName = driversMap.get(selectedDriverId);
                // Simple name match as fallback
                if (driverName && order.driverName !== driverName) return false;
            }

            if (dateFilter) {
                if (!order.date.startsWith(dateFilter)) return false;
            }

            return true;
        });
    }, [initialOrders, selectedStoreId, selectedDriverId, dateFilter, storesMap, driversMap]);

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-4 md:space-y-0 md:flex md:gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <SearchableSelect
                        label="Filter by Store"
                        options={stores.map(s => ({ id: s.id, label: s.name, subLabel: s.address || '' }))}
                        value={selectedStoreId}
                        onChange={setSelectedStoreId}
                        placeholder="Search store..."
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Filter by Driver</label>
                    <select
                        className="w-full rounded border p-2 text-black"
                        value={selectedDriverId}
                        onChange={(e) => setSelectedDriverId(e.target.value)}
                    >
                        <option value="">All Drivers</option>
                        {drivers.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Filter by Date</label>
                    <input
                        type="date"
                        className="w-full rounded border p-2 text-black"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => { setSelectedStoreId(''); setSelectedDriverId(''); setDateFilter(''); }}
                    className="px-4 py-2 bg-gray-200 text-black rounded hover:bg-gray-300"
                >
                    Clear
                </button>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-900 shadow overflow-hidden rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                        {filteredOrders.map((order) => {
                            const balance = (order.totalAmount || 0) - (order.paidAmount || 0);
                            return (
                                <tr key={order.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(order.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                        {order.id.slice(0, 8)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-medium">
                                        {order.storeName}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right">
                                        ₹{order.totalAmount}
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {balance > 0 ? `₹${balance}` : 'Paid'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {order.driverName || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                                        <Link
                                            href={`/owner/orders/${order.id}`}
                                            className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded"
                                        >
                                            View / PDF
                                        </Link>
                                        <a
                                            href={`https://wa.me/?text=Invoice%20${order.id}%20Total:%20${order.totalAmount}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded"
                                        >
                                            WhatsApp
                                        </a>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {filteredOrders.length === 0 && (
                    <div className="text-center py-8 text-gray-500">No orders found matching filters</div>
                )}
            </div>
        </div>
    );
}
