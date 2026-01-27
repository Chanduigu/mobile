'use client';

import { useState } from 'react';
import { updateOrderAndPayment } from '@/lib/driver-actions';

type OrderItem = { itemId: string; name: string; quantity: number; price: number };

import { useRouter } from 'next/navigation';

export default function DriverOrderForm({ orderId, initialItems, previousBalance = 0 }: { orderId: string, initialItems: OrderItem[], previousBalance?: number }) {
    const router = useRouter();
    const [items, setItems] = useState(initialItems);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi'>('cash');
    const [receivedAmount, setReceivedAmount] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleQtyChange = (itemId: string, newQty: number) => {
        setItems(prev => prev.map(item => item.itemId === itemId ? { ...item, quantity: newQty } : item));
    };

    const currentTotal = items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
    const totalDue = currentTotal + previousBalance;
    const balance = totalDue - receivedAmount;



    const handleSubmit = async () => {
        if (!confirm('Confirm delivery details?')) return;
        setIsSubmitting(true);

        const itemsPayload = items.reduce((acc, item) => ({ ...acc, [item.itemId]: item.quantity }), {});

        try {
            const result = await updateOrderAndPayment(orderId, itemsPayload, {
                method: paymentMethod,
                amount: receivedAmount
            });

            if (result?.error) {
                alert(result.error);
                setIsSubmitting(false);
            } else {
                // Success! The server action revalidates, but client router refresh ensures we switch views
                router.refresh();
            }
        } catch (e) {
            console.error(e);
            alert('Something went wrong');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Item</th>
                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Price</th>
                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Qty (Delivered)</th>
                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white dark:bg-gray-900">
                        {items.map(item => (
                            <tr key={item.itemId}>
                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-gray-100">{item.name}</td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">₹{item.price}</td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                    <input
                                        type="number"
                                        className="w-20 rounded-md border-gray-300 border px-2 py-1 text-black"
                                        value={item.quantity}
                                        onChange={(e) => handleQtyChange(item.itemId, parseInt(e.target.value) || 0)}
                                    />
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">₹{item.quantity * item.price}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-4">
                <h3 className="font-bold text-lg">Payment</h3>

                {previousBalance > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4 text-yellow-800">
                        <div className="flex justify-between font-bold">
                            <span>Previous Pending:</span>
                            <span>₹{previousBalance}</span>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Method</label>
                        <div className="flex space-x-4">
                            <button
                                onClick={() => setPaymentMethod('cash')}
                                className={`px-4 py-2 rounded-md border ${paymentMethod === 'cash' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-black border-gray-300'}`}
                            >
                                Cash
                            </button>
                            <button
                                onClick={() => setPaymentMethod('upi')}
                                className={`px-4 py-2 rounded-md border ${paymentMethod === 'upi' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-black border-gray-300'}`}
                            >
                                UPI
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Received Amount (₹)</label>
                        <input
                            type="number"
                            className="block w-full rounded-md border-gray-300 border py-2 px-3 text-black"
                            value={receivedAmount || ''}
                            onChange={(e) => setReceivedAmount(parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                        />
                    </div>
                </div>

                {/* UPI QR Display Placeholder */}
                {paymentMethod === 'upi' && (
                    <div className="mt-4 p-4 bg-white rounded flex flex-col items-center justify-center">
                        <div className="w-48 h-48 bg-gray-200 flex items-center justify-center mb-2">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=thanush8123@okhdfcbank&pn=Sri%20Balaji%20Pani%20Puri&am=${balance > 0 ? balance : ''}`}
                                alt="UPI QR"
                                className="w-full h-full mix-blend-multiply"
                            />
                        </div>
                        <p className="text-sm text-gray-500">Scan to Pay Balance</p>
                    </div>
                )}

                <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between text-lg">
                        <span>Current Bill:</span>
                        <span>₹{currentTotal}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold border-b pb-2 mb-2">
                        <span>Total Due:</span>
                        <span>₹{totalDue}</span>
                    </div>

                    <div className="flex justify-between text-lg text-green-600">
                        <span>Paid:</span>
                        <span className="font-bold">₹{receivedAmount}</span>
                    </div>
                    <div className="flex justify-between text-lg text-red-600">
                        <span>Remaining Balance:</span>
                        <span className="font-bold">₹{balance}</span>
                    </div>
                </div>
            </div>

            <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-green-700 disabled:opacity-50"
            >
                {isSubmitting ? 'Processing...' : 'Complete Delivery'}
            </button>
        </div>
    );
}
