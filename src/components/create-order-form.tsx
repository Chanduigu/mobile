'use client';

import { useState, useMemo, useEffect } from 'react';
import { createOrder } from '@/lib/order-actions';
import { uploadPaymentProof } from '@/lib/upload-actions';
import { getStoreDetails } from '@/lib/store-actions';
import SearchableSelect from '@/components/searchable-select';
import { ShoppingCart, Wallet, CreditCard, User, Store, AlertCircle, CheckCircle2, QrCode } from 'lucide-react';

// Types definition inline for simplicity
type Store = { id: string; name: string; address?: string | null };
type User = { id: string; name: string };
type Item = { id: string; name: string; defaultPrice: number };
type StorePrice = { storeId: string; itemId: string; price: number };

export default function CreateOrderForm({
    stores,
    drivers,
    items,
    storePrices,
    role,
    currentUserId,
    storeStats,
    initialStoreId,
    routeId
}: {
    stores: Store[];
    drivers: User[];
    items: Item[];
    storePrices: StorePrice[];
    storeStats?: Record<string, { balance: number; revenue: number }>;
    role: 'owner' | 'driver';
    currentUserId?: string;
    initialStoreId?: string;
    routeId?: string;
}) {
    const [selectedStoreId, setSelectedStoreId] = useState<string>(initialStoreId || '');
    const [selectedDriverId, setSelectedDriverId] = useState<string>(role === 'driver' ? (currentUserId || '') : '');
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [cashPaid, setCashPaid] = useState<number>(0);
    const [upiPaid, setUpiPaid] = useState<number>(0);
    const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [fetchedBalance, setFetchedBalance] = useState<number>(0);

    // New State for Direct Collection & Balance Bill
    const [collectedBy, setCollectedBy] = useState<'OWNER' | 'DRIVER'>(role === 'owner' ? 'OWNER' : 'DRIVER');
    const [billType, setBillType] = useState<'delivery' | 'collection'>('delivery');

    // Calculate prices based on selected store
    const itemPrices = useMemo(() => {
        const prices: Record<string, number> = {};
        items.forEach(item => {
            // Find custom price
            const custom = storePrices.find(sp => sp.storeId === selectedStoreId && sp.itemId === item.id);
            prices[item.id] = custom ? custom.price : item.defaultPrice;
        });
        return prices;
    }, [selectedStoreId, items, storePrices]);

    const currentStoreBalance = useMemo(() => {
        return fetchedBalance;
    }, [fetchedBalance]);

    // Fetch balance when store changes
    useEffect(() => {
        async function fetchBalance() {
            if (selectedStoreId) {
                const details = await getStoreDetails(selectedStoreId);
                if (details) {
                    setFetchedBalance(details.balance);
                }
            } else {
                setFetchedBalance(0);
            }
        }
        fetchBalance();
    }, [selectedStoreId]);

    // Auto-fill payment amount for collection mode
    useEffect(() => {
        if (billType === 'collection' && fetchedBalance > 0) {
            setCashPaid(fetchedBalance);
            setUpiPaid(0);
        }
    }, [billType, fetchedBalance]);

    // Handle Qty Change
    const handleQtyChange = (itemId: string, qty: number) => {
        setQuantities(prev => ({ ...prev, [itemId]: qty }));
    };

    const total = useMemo(() => {
        if (billType === 'collection') return 0;
        return items.reduce((acc, item) => {
            const qty = quantities[item.id] || 0;
            return acc + (qty * itemPrices[item.id]);
        }, 0);
    }, [quantities, itemPrices, items, billType]);

    // Reset driver selection when collectedBy changes
    useEffect(() => {
        if (collectedBy === 'OWNER') {
            setSelectedDriverId(''); // Owner collects directly
        } else if (role === 'owner') {
            // If Owner toggles to 'DRIVER', they must select one.
            setSelectedDriverId('');
        }
    }, [collectedBy, role]);

    const handleSubmit = async () => {
        if (!selectedStoreId) return alert('Select a store');

        setIsSubmitting(true);

        // Prepare Item List (Empty for Collection Mode)
        let orderItems: any[] = [];
        if (billType === 'delivery') {
            orderItems = items
                .filter(item => (quantities[item.id] || 0) > 0)
                .map(item => ({
                    itemId: item.id,
                    quantity: quantities[item.id],
                    price: itemPrices[item.id]
                }));

            if (orderItems.length === 0) {
                setIsSubmitting(false);
                return alert('Add at least one item for Delivery Bill');
            }
        } else {

            // Collection Mode: Check at least some payment
            if (cashPaid === 0 && upiPaid === 0) {
                setIsSubmitting(false);
                return alert('Enter a payment amount for Balance Collection');
            }
            if ((cashPaid + upiPaid) > fetchedBalance) {
                if (!confirm(`Warning: You are collecting ₹${cashPaid + upiPaid} which is more than the outstanding balance of ₹${fetchedBalance}. Continue?`)) {
                    setIsSubmitting(false);
                    return;
                }
            }
        }


        // Validate UPI Proof
        if (upiPaid > 0 && !paymentProofFile) {
            alert('Please upload UPI payment screenshot to proceed.');
            setIsSubmitting(false);
            return;
        }

        // Upload Proof if exists
        let proofUrl = undefined;
        if (paymentProofFile) {
            const formData = new FormData();
            formData.append('file', paymentProofFile);
            const uploadRes = await uploadPaymentProof(formData);
            if (uploadRes.error || !uploadRes.url) {
                alert('Failed to upload payment proof');
                setIsSubmitting(false);
                return;
            }
            proofUrl = uploadRes.url;
        }

        try {
            const result = await createOrder({
                storeId: selectedStoreId,
                driverId: selectedDriverId || undefined, // undefined if owner collects
                routeId: routeId,
                items: orderItems,
                cashReceived: cashPaid,
                upiReceived: upiPaid,
                status: (role === 'driver' || billType === 'collection') ? 'delivered' : 'pending',
                redirectPath: role === 'driver' ? '/driver/orders/[id]' : '/owner',
                collectedBy: collectedBy,
                collectorName: collectedBy === 'OWNER' ? 'Owner' : drivers.find(d => d.id === selectedDriverId)?.name,
                type: billType,
                paymentProof: proofUrl
            });

            if (result && result.error) {
                alert(result.error);
                setIsSubmitting(false);
            }
        } catch (error) {
            console.error(error);
            alert(`Failed to create bill: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setIsSubmitting(false);
        }
    };

    const storeOptions = useMemo(() => stores.map(s => ({
        id: s.id,
        label: s.name,
        subLabel: s.address || undefined
    })), [stores]);

    return (
        <div className="space-y-6 pb-40 md:pb-24">
            {/* QR Code Modal */}
            {showQR && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white p-8 rounded-3xl max-w-sm w-full text-center relative shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setShowQR(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                        >
                            &times;
                        </button>
                        <h3 className="text-xl font-bold mb-6 text-gray-900">Scan to Pay</h3>
                        <div className="bg-white p-4 rounded-xl shadow-inner border border-gray-100 inline-block mb-6">
                            <img
                                src="/images/phonepe-qr.jpg"
                                alt="PhonePe QR"
                                className="w-64 h-64 object-cover rounded-lg"
                            />
                        </div>
                        <p className="font-bold text-lg mb-1 text-gray-900">SAPTHAGIRI FOODS</p>
                        <p className="text-sm text-gray-500 mb-6">Accepted via PhonePe / UPI</p>
                        <button
                            onClick={() => setShowQR(false)}
                            className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Form Controls */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Store Selection Card */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Store className="w-5 h-5 text-gray-400" />
                            <span>Customer Details</span>
                        </h2>

                        <div className="space-y-4">
                            <SearchableSelect
                                label="Select Store"
                                options={storeOptions}
                                value={selectedStoreId}
                                onChange={(val) => {
                                    setSelectedStoreId(val);
                                    setQuantities({});
                                    setCashPaid(0);
                                    setUpiPaid(0);
                                }}
                                placeholder="Search for a store..."
                            />

                            {selectedStoreId && (
                                <div className={`flex items-center justify-between p-4 rounded-xl border ${fetchedBalance > 0 ? 'bg-red-50 border-red-100 text-red-700' : 'bg-green-50 border-green-100 text-green-700'}`}>
                                    <span className="text-sm font-medium opacity-80">Outstanding Balance</span>
                                    <span className="text-xl font-bold">₹{currentStoreBalance}</span>
                                </div>
                            )}

                            {!routeId && role === 'driver' && (
                                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-sm">
                                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                    <p><strong>Ad-Hoc Order:</strong> No active route found. This transaction will be recorded but not linked to a specific daily route plan.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Order Type & Collector Card */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-gray-400" />
                            <span>Order Type</span>
                        </h2>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => setBillType('delivery')}
                                className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${billType === 'delivery' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 hover:border-gray-200'}`}
                            >
                                <ShoppingCart className={`w-6 h-6 mb-2 ${billType === 'delivery' ? 'text-orange-600' : 'text-gray-400'}`} />
                                <span className="font-bold text-sm">Delivery Bill</span>
                                <span className="text-xs opacity-70">Add Items</span>
                            </button>
                            <button
                                onClick={() => setBillType('collection')}
                                className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${billType === 'collection' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-100 hover:border-gray-200'}`}
                            >
                                <Wallet className={`w-6 h-6 mb-2 ${billType === 'collection' ? 'text-purple-600' : 'text-gray-400'}`} />
                                <span className="font-bold text-sm">Balance Collection</span>
                                <span className="text-xs opacity-70">Payment Only</span>
                            </button>
                        </div>

                        {/* Role: Owner Controls */}
                        {role === 'owner' && (
                            <div className="mt-6 pt-6 border-t border-gray-100">
                                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 block">Collected By</label>
                                <div className="flex gap-2">
                                    <button
                                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all border ${collectedBy === 'OWNER' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                        onClick={() => setCollectedBy('OWNER')}
                                    >
                                        Owner
                                    </button>
                                    <button
                                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all border ${collectedBy === 'DRIVER' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                        onClick={() => setCollectedBy('DRIVER')}
                                    >
                                        Driver
                                    </button>
                                </div>
                                {collectedBy === 'DRIVER' && (
                                    <div className="mt-4">
                                        <select
                                            className="block w-full rounded-lg border-gray-300 py-2.5 px-3 border text-gray-900 text-sm focus:border-orange-500 focus:ring-orange-500"
                                            value={selectedDriverId}
                                            onChange={(e) => setSelectedDriverId(e.target.value)}
                                        >
                                            <option value="">-- Select Driver --</option>
                                            {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Items List (Only for Delivery) */}
                    {selectedStoreId && billType === 'delivery' && (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <div className="p-6 border-b border-gray-100">
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    <ShoppingBagIcon />
                                    <span>Select Items</span>
                                </h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4 text-left">Item</th>
                                            <th className="px-6 py-4 text-center">Price</th>
                                            <th className="px-6 py-4 text-center">Qty</th>
                                            <th className="px-6 py-4 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {items.map(item => {
                                            const price = itemPrices[item.id];
                                            const qty = quantities[item.id] || 0;
                                            const subtotal = price * qty;
                                            const isActive = qty > 0;

                                            return (
                                                <tr key={item.id} className={`transition-colors hover:bg-gray-50 ${isActive ? 'bg-orange-50/30' : ''}`}>
                                                    <td className="px-6 py-4">
                                                        <span className={`font-medium ${isActive ? 'text-orange-900' : 'text-gray-900'}`}>{item.name}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center text-sm text-gray-500">₹{price}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex items-center justify-center">
                                                            <button
                                                                className="w-8 h-8 rounded-l-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-600 transition-colors"
                                                                onClick={() => handleQtyChange(item.id, Math.max(0, qty - 1))}
                                                            >
                                                                -
                                                            </button>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                className="w-12 h-8 border-y border-gray-200 text-center text-sm focus:outline-none focus:ring-0"
                                                                value={qty || ''}
                                                                onChange={(e) => handleQtyChange(item.id, parseInt(e.target.value) || 0)}
                                                                placeholder="0"
                                                            />
                                                            <button
                                                                className="w-8 h-8 rounded-r-lg border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-600 transition-colors"
                                                                onClick={() => handleQtyChange(item.id, qty + 1)}
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className={`px-6 py-4 text-right font-medium ${subtotal > 0 ? 'text-orange-700' : 'text-gray-400'}`}>
                                                        ₹{subtotal}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {selectedStoreId && billType === 'collection' && (
                        <div className="p-8 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl text-center">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-purple-600">
                                <Wallet className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-purple-900 mb-2">Balance Collection Mode</h3>
                            <p className="text-purple-700/80 mb-6">Enter the amount collected towards the outstanding balance.</p>
                            <div className="inline-block px-6 py-3 bg-white rounded-xl shadow-sm border border-purple-100">
                                <span className="text-sm text-gray-500 block">Current Outstanding</span>
                                <span className="text-3xl font-bold text-red-500">₹{currentStoreBalance}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column (Desktop) / Bottom Sticky (Mobile): Payment Footer */}
                <div className="lg:col-span-1">
                    <div className="lg:sticky lg:top-24 space-y-4">
                        <div className={`fixed bottom-0 left-0 w-full lg:static lg:w-full bg-white lg:bg-white dark:bg-gray-900 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] lg:shadow-xl lg:border border-gray-100 lg:rounded-2xl z-40 p-5 lg:p-6 transition-transform duration-300`}>

                            {/* Mobile Drag Handle */}
                            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 lg:hidden" />

                            <h2 className="text-lg font-bold mb-6 hidden lg:flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-gray-400" />
                                <span>Payment Details</span>
                            </h2>

                            <div className="space-y-5">
                                <div className="flex justify-between items-end pb-4 border-b border-gray-100">
                                    <span className="text-gray-500 font-medium">Grand Total</span>
                                    <span className="text-3xl font-bold text-gray-900">₹{total}</span>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Cash Collected</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
                                            <input
                                                type="number"
                                                min="0"
                                                className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all font-bold text-lg text-gray-900"
                                                value={cashPaid === 0 ? '' : cashPaid}
                                                onChange={(e) => setCashPaid(parseFloat(e.target.value) || 0)}
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-1.5">
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">UPI Collected</label>
                                            <button
                                                onClick={() => setShowQR(true)}
                                                className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md hover:bg-blue-100 transition-colors flex items-center gap-1"
                                            >
                                                <QrCode className="w-3 h-3" /> SCAN QR
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
                                            <input
                                                type="number"
                                                min="0"
                                                className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-bold text-lg text-gray-900"
                                                value={upiPaid === 0 ? '' : upiPaid}
                                                onChange={(e) => setUpiPaid(parseFloat(e.target.value) || 0)}
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>

                                    {/* UPI Proof Upload */}
                                    {upiPaid > 0 && (
                                        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                                UPI Screenshot (Required)
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    capture="environment" // Optional: prefer camera on mobile
                                                    onChange={(e) => setPaymentProofFile(e.target.files?.[0] || null)}
                                                    className="block w-full text-sm text-gray-500
                                                        file:mr-4 file:py-2 file:px-4
                                                        file:rounded-full file:border-0
                                                        file:text-sm file:font-semibold
                                                        file:bg-blue-50 file:text-blue-700
                                                        hover:file:bg-blue-100"
                                                />
                                            </div>
                                            {paymentProofFile && (
                                                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3" /> Image selected: {paymentProofFile.name}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 flex items-center justify-between text-sm">
                                <span className="text-gray-500">Total Paid</span>
                                <span className="font-bold text-green-600 text-lg">₹{cashPaid + upiPaid}</span>
                            </div>

                            {total > (cashPaid + upiPaid) && (
                                <div className="flex items-center justify-between text-sm bg-red-50 p-2 rounded-lg text-red-700 border border-red-100">
                                    <span className="font-medium">Pending Amount</span>
                                    <span className="font-bold">₹{total - (cashPaid + upiPaid)}</span>
                                </div>
                            )}

                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-orange-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none mt-2 text-lg"
                            >
                                {isSubmitting ? 'Processing...' : 'Complete Order'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    );
}

function ShoppingBagIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shopping-bag"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
    )
}
