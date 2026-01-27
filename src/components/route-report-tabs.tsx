'use client';

import { useState } from 'react';
import { Share2, Download } from 'lucide-react';

export default function RouteReportTabs({ stops, orders, itemSummary }: { stops: any[], orders: any[], itemSummary: any[] }) {
    const [activeTab, setActiveTab] = useState<'progress' | 'completed' | 'pending'>('progress');

    const completedStops = stops.filter(s => s.status === 'visited');
    const pendingStops = stops.filter(s => s.status !== 'visited');

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('progress')}
                    className={`flex-1 py-4 text-sm font-medium text-center ${activeTab === 'progress' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Progress
                </button>
                <button
                    onClick={() => setActiveTab('completed')}
                    className={`flex-1 py-4 text-sm font-medium text-center ${activeTab === 'completed' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Completed ({completedStops.length})
                </button>
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`flex-1 py-4 text-sm font-medium text-center ${activeTab === 'pending' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Pending ({pendingStops.length})
                </button>
            </div>

            <div className="p-4">
                {activeTab === 'progress' && (
                    <div className="space-y-6">
                        {stops.map((stop, index) => {
                            const isLast = index === stops.length - 1;
                            const isVisited = stop.status === 'visited';
                            const order = orders.find(o => o.storeId === stop.storeId);

                            return (
                                <div key={stop.id} className="relative pl-8 pb-8 last:pb-0">
                                    {!isLast && <div className="absolute left-3 top-3 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>}
                                    <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center font-bold text-xs
                                        ${isVisited ? 'bg-green-100 border-green-500 text-green-700' : 'bg-gray-100 border-gray-300 text-gray-500'}
                                    `}>
                                        {isVisited ? '✓' : index + 1}
                                    </div>

                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                        <div>
                                            <h3 className={`font-semibold ${isVisited ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500'}`}>
                                                {stop.storeName}
                                            </h3>
                                            <p className="text-sm text-gray-500">{stop.address}</p>
                                            {stop.completedAt && (
                                                <p className="text-xs text-green-600 mt-1">
                                                    Visited: {new Date(stop.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            )}
                                        </div>

                                        {order ? (
                                            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded text-sm min-w-[200px]">
                                                <div className="flex justify-between mb-1">
                                                    <span>Total:</span>
                                                    <span className="font-medium">₹{order.totalAmount}</span>
                                                </div>
                                                <div className="flex justify-between mb-1 text-green-700">
                                                    <span>Paid:</span>
                                                    <span>₹{order.paidAmount}</span>
                                                </div>
                                                {((order.totalAmount || 0) - (order.paidAmount || 0)) > 0 && (
                                                    <div className="flex justify-between text-red-600 font-bold border-t pt-1 mt-1 border-gray-200">
                                                        <span>Bal:</span>
                                                        <span>₹{(order.totalAmount || 0) - (order.paidAmount || 0)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-sm text-gray-400 italic self-center">
                                                {isVisited ? 'No Bill Created' : 'Pending Visit'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {activeTab === 'completed' && (
                    <div className="space-y-4">
                        {completedStops.length === 0 && <p className="text-center text-gray-500 py-8">No stops completed yet.</p>}
                        {completedStops.map(stop => {
                            const order = orders.find(o => o.storeId === stop.storeId);
                            return (
                                <div key={stop.id} className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col md:flex-row justify-between gap-4">
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-gray-100">{stop.storeName}</h3>
                                        <p className="text-sm text-gray-500">{stop.address}</p>
                                        <p className="text-sm text-gray-500 mt-1">📞 {stop.phone || 'No Phone'}</p>
                                        {stop.completedAt && (
                                            <p className="text-xs text-green-600 mt-2 font-medium">
                                                Visited at {new Date(stop.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        )}
                                    </div>

                                    {order && (
                                        <div className="min-w-[250px] space-y-3">
                                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-sm">
                                                <div className="flex justify-between border-b pb-2 mb-2 dark:border-gray-700">
                                                    <span className="text-gray-500">Invoice #</span>
                                                    <span className="font-mono">{order.id.slice(0, 8)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Total</span>
                                                    <span className="font-bold">₹{order.totalAmount}</span>
                                                </div>
                                                <div className="flex justify-between text-green-600">
                                                    <span>Paid</span>
                                                    <span>₹{order.paidAmount}</span>
                                                </div>
                                                <div className="flex justify-between text-red-500">
                                                    <span>Balance</span>
                                                    <span>₹{(order.totalAmount || 0) - (order.paidAmount || 0)}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button className="flex-1 flex items-center justify-center gap-1 bg-blue-50 text-blue-700 py-2 rounded text-xs font-medium hover:bg-blue-100">
                                                    <Download className="w-3 h-3" /> Download
                                                </button>
                                                <button className="flex-1 flex items-center justify-center gap-1 bg-green-50 text-green-700 py-2 rounded text-xs font-medium hover:bg-green-100">
                                                    <Share2 className="w-3 h-3" /> WhatsApp
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {activeTab === 'pending' && (
                    <div className="space-y-4">
                        {pendingStops.length === 0 && <p className="text-center text-gray-500 py-8">All stops completed!</p>}
                        {pendingStops.map((stop, idx) => (
                            <div key={stop.id} className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-100 dark:border-gray-800 shadow-sm flex justify-between items-center opacity-75">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">Sequence #{stop.sequence}</span>
                                    </div>
                                    <h3 className="font-bold text-gray-900 dark:text-gray-100">{stop.storeName}</h3>
                                    <p className="text-sm text-gray-500">{stop.address}</p>
                                    <p className="text-sm text-gray-500 mt-1">📞 {stop.phone || 'No Phone'}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-medium bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Pending</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
