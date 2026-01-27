'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Wallet, CreditCard, Calendar, Clock, Package } from 'lucide-react';

export default function HistoryList({ history, getOrderItems }: { history: any[], getOrderItems: (orderId: string) => Promise<any[]> }) {
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
    const [orderItems, setOrderItems] = useState<Record<string, any[]>>({});
    const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({});

    const toggleOrder = async (orderId: string) => {
        if (expandedOrder === orderId) {
            setExpandedOrder(null);
        } else {
            setExpandedOrder(orderId);
            if (!orderItems[orderId]) {
                setLoadingItems(prev => ({ ...prev, [orderId]: true }));
                try {
                    const items = await getOrderItems(orderId);
                    setOrderItems(prev => ({ ...prev, [orderId]: items }));
                } catch (error) {
                    console.error("Failed to load items", error);
                } finally {
                    setLoadingItems(prev => ({ ...prev, [orderId]: false }));
                }
            }
        }
    };

    if (history.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <Clock className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">No History Yet</h3>
                <p className="text-gray-500">Your completed deliveries will appear here.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {history.map((order) => (
                <div key={order.id} className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all">
                    <div
                        className="flex justify-between items-start cursor-pointer"
                        onClick={() => toggleOrder(order.id)}
                    >
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">{order.storeName}</h3>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(order.date).toLocaleDateString()}
                                <span className="mx-1">•</span>
                                <Clock className="w-3 h-3" />
                                {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                        <div className="text-right">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${order.status === 'delivered' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100'}`}>
                                {order.status}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between py-4 border-t border-b border-gray-50 dark:border-gray-800 my-4">
                        <div className="text-center flex-1 border-r border-gray-50 dark:border-gray-800">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">Total Bill</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">₹{order.totalAmount}</p>
                        </div>
                        <div className="text-center flex-1">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">Collected</p>
                            <p className="text-xl font-bold text-green-600">₹{order.paidAmount}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">
                            <span className="font-bold uppercase tracking-tight text-gray-400">Start Mode:</span>
                            {order.paymentMethod === 'split' ? (
                                <span className="flex items-center gap-2">
                                    <span className="flex items-center gap-1 font-semibold text-gray-700"><Wallet className="w-3 h-3 text-purple-500" /> ₹{order.cashPaid}</span>
                                    <span className="text-gray-300">|</span>
                                    <span className="flex items-center gap-1 font-semibold text-gray-700"><CreditCard className="w-3 h-3 text-blue-500" /> ₹{order.upiPaid}</span>
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 capitalize font-semibold text-gray-700">
                                    {order.paymentMethod === 'cash' ? <Wallet className="w-3 h-3 text-purple-500" /> : <CreditCard className="w-3 h-3 text-blue-500" />}
                                    {order.paymentMethod || 'None'}
                                </span>
                            )}
                        </div>

                        <button
                            onClick={(e) => { e.stopPropagation(); toggleOrder(order.id); }}
                            className="bg-gray-50 hover:bg-gray-100 p-2 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            {expandedOrder === order.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                    </div>

                    {/* Expanded Details */}
                    {expandedOrder === order.id && (
                        <div className="mt-4 pt-4 border-t border-gray-100 animate-in slide-in-from-top-2 fade-in duration-200">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                                <Package className="w-3 h-3" /> Item Details
                            </h4>

                            {loadingItems[order.id] ? (
                                <div className="text-center py-4 text-gray-400 text-sm">Loading items...</div>
                            ) : (
                                <div className="space-y-2">
                                    {orderItems[order.id]?.length > 0 ? (
                                        <table className="w-full text-sm">
                                            <thead className="text-[10px] text-gray-400 font-bold uppercase bg-gray-50">
                                                <tr>
                                                    <th className="text-left px-2 py-1 rounded-l-md">Item</th>
                                                    <th className="text-center px-2 py-1">Qty</th>
                                                    <th className="text-right px-2 py-1 rounded-r-md">Price</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {orderItems[order.id].map((item: any, idx: number) => (
                                                    <tr key={idx}>
                                                        <td className="px-2 py-2 font-medium text-gray-700">{item.itemName}</td>
                                                        <td className="px-2 py-2 text-center text-gray-500">x{item.quantity}</td>
                                                        <td className="px-2 py-2 text-right font-bold text-gray-900">₹{item.quantity * item.price}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <p className="text-sm text-gray-400 italic text-center py-2">No items recorded (Balance Collection)</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
