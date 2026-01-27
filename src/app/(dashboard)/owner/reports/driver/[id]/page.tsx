import { db } from '@/db';
import { users } from '@/db/schema';
import { getDriverOrders, getDriverItemSummary } from '@/lib/report-actions';
import { eq } from 'drizzle-orm';
import { format, startOfToday, startOfWeek, startOfMonth } from 'date-fns';
import Link from 'next/link';
import { ArrowLeft, Wallet, CreditCard, ShoppingBag, Package, Calendar } from 'lucide-react';
import ReportActionsCell from '@/components/report-actions-cell';
import DownloadReportButton from '@/components/download-report-button';

import { auth } from '@/auth';

export default async function DriverReportDetailsPage({
    params,
    searchParams
}: {
    params: Promise<{ id: string }>,
    searchParams: Promise<{ range?: string }>
}) {
    const session = await auth();
    const { id } = await params;
    const { range = 'today' } = await searchParams;

    // Fetch driver details
    const [driver] = await db.select().from(users).where(eq(users.id, id));

    if (!driver) {
        return <div>Driver not found</div>;
    }

    let startDate: string | undefined;
    let endDate: string | undefined = format(new Date(), 'yyyy-MM-dd') + 'T23:59:59';
    const today = new Date();

    if (range === 'today') {
        startDate = format(startOfToday(), 'yyyy-MM-dd');
    } else if (range === 'week') {
        startDate = format(startOfWeek(today), 'yyyy-MM-dd');
    } else if (range === 'month') {
        startDate = format(startOfMonth(today), 'yyyy-MM-dd');
    } else if (range === 'all') {
        startDate = undefined;
        endDate = undefined;
    }

    const { orders, totals } = await getDriverOrders(id, startDate, endDate);
    const itemSummary = await getDriverItemSummary(id, startDate, endDate);

    return (
        <div className="pb-20 text-gray-900 dark:text-white space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:mb-8">
                <div className="flex items-center gap-4">
                    <Link href={`/owner/reports?type=driver&range=${range}`} className="p-2.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors no-print shadow-sm">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-bold font-heading">{driver.name}</h1>
                            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-blue-50 text-blue-600 border border-blue-100 tracking-wider">Driver Report</span>
                        </div>
                        <p className="text-gray-500 text-sm flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span className="capitalize">{range}</span> Range
                        </p>
                    </div>
                </div>
                <div className="no-print">
                    <DownloadReportButton
                        orders={orders}
                        totals={totals}
                        driverName={driver.name}
                        range={range}
                        generatedBy={session?.user?.name || 'Verif'}
                        userRole={session?.user?.role || 'Admin'}
                    />
                </div>
            </header>

            {/* Premium Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-colors">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Package className="w-12 h-12 text-blue-600" />
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Billed</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">₹{totals.totalRevenue}</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-5 rounded-2xl border border-green-100 dark:border-green-800 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wallet className="w-12 h-12 text-green-600" />
                    </div>
                    <p className="text-xs font-bold text-green-700/70 uppercase tracking-wider mb-1">Total Collected</p>
                    <p className="text-2xl font-bold text-green-700">₹{totals.totalCash + totals.totalUpi}</p>
                </div>

                <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-colors">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <CreditCard className="w-12 h-12 text-blue-600" />
                    </div>
                    <p className="text-xs font-bold text-blue-600/70 uppercase tracking-wider mb-1">UPI Collected</p>
                    <p className="text-2xl font-bold text-blue-600">₹{totals.totalUpi}</p>
                </div>

                <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group hover:border-purple-200 transition-colors">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wallet className="w-12 h-12 text-purple-600" />
                    </div>
                    <p className="text-xs font-bold text-purple-600/70 uppercase tracking-wider mb-1">Cash Collected</p>
                    <p className="text-2xl font-bold text-purple-600">₹{totals.totalCash}</p>
                </div>

                <div className="bg-red-50 dark:bg-red-900/10 p-5 rounded-2xl border border-red-100 dark:border-red-800 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                        <Wallet className="w-12 h-12 text-red-600" />
                    </div>
                    <p className="text-xs font-bold text-red-600/70 uppercase tracking-wider mb-1">Pending Balance</p>
                    <p className="text-2xl font-bold text-red-600">₹{totals.totalPending}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Item-wise Delivery Summary */}
                <div className="lg:col-span-1 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden h-fit">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-gray-500" />
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wide">Item Summary</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                            <thead className="bg-white dark:bg-gray-900">
                                <tr>
                                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Item</th>
                                    <th className="px-6 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">Qty</th>
                                    <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">Value</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {itemSummary.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-8 text-center text-gray-500 text-sm italic">
                                            No items delivered.
                                        </td>
                                    </tr>
                                ) : (
                                    itemSummary.map((item: any) => (
                                        <tr key={item.itemId} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                            <td className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{item.name}</td>
                                            <td className="px-6 py-3 text-sm text-center font-bold text-blue-600 bg-blue-50/50 rounded-lg">{item.quantity}</td>
                                            <td className="px-6 py-3 text-sm text-right font-medium text-gray-600 dark:text-gray-300">₹{item.value}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Orders Table */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden h-fit">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-500" />
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wide">Detailed Delivery Log</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                            <thead className="bg-white dark:bg-gray-900">
                                <tr>
                                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Time / Store</th>
                                    <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">Payment</th>
                                    <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {orders.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">
                                            No delivery records found for this period.
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map((order: any) => (
                                        <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{order.storeName}</span>
                                                    <span className="text-[10px] text-gray-400 mt-0.5">
                                                        {new Date(order.date).toLocaleDateString()} • {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right font-bold text-gray-900 dark:text-gray-100">
                                                ₹{order.totalAmount}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-center">
                                                {order.paidAmount > 0 ? (
                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-gray-200 bg-gray-50">
                                                        <span className={`w-2 h-2 rounded-full ${order.paymentMethod === 'upi' ? 'bg-blue-500' : 'bg-purple-500'}`}></span>
                                                        <span className="text-xs font-semibold text-gray-700 uppercase">{order.paymentMethod}</span>
                                                        <span className="text-xs text-gray-400 border-l border-gray-200 pl-1.5 ml-0.5">₹{order.paidAmount}</span>
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-red-50 text-red-600 border border-red-100">
                                                        PENDING
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <ReportActionsCell
                                                    order={order}
                                                    driverName={driver.name}
                                                    generatedBy={session?.user?.name || 'Verif'}
                                                    userRole={session?.user?.role || 'Admin'}
                                                />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
