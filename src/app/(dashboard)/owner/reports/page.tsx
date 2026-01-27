import { getRevenueReport, getItemSalesReport, getDriverReport } from '@/lib/report-actions';
import { format, startOfToday, startOfWeek, startOfMonth } from 'date-fns';
import ReportToolbar from '@/components/report-toolbar';
import DateRangeFilter from '@/components/date-range-filter';
import { BarChart3, ShoppingBag, Truck, Calendar, Wallet, CreditCard, AlertCircle, CheckCircle2 } from 'lucide-react';

export default async function ReportsPage({
    searchParams
}: {
    searchParams: Promise<{ type?: string, range?: string, from?: string, to?: string }>
}) {
    const { type = 'revenue', range = 'today', from, to } = await searchParams;

    let startDate: string | undefined;

    // endDate defaults to end of today to include today's records
    let endDate: string | undefined = format(new Date(), 'yyyy-MM-dd') + 'T23:59:59';

    const today = new Date();
    if (range === 'custom' && from && to) {
        startDate = from;
        endDate = to + 'T23:59:59';
    } else if (range === 'today') {
        startDate = format(startOfToday(), 'yyyy-MM-dd');
    } else if (range === 'week') {
        startDate = format(startOfWeek(today), 'yyyy-MM-dd');
    } else if (range === 'month') {
        startDate = format(startOfMonth(today), 'yyyy-MM-dd');
    } else if (range === 'all') {
        startDate = undefined;
        endDate = undefined;
    }

    const revenueData = type === 'revenue' ? await getRevenueReport(startDate, endDate) : null;
    const itemData = type === 'items' ? await getItemSalesReport(startDate, endDate) : null;
    const driverData = type === 'driver' ? await getDriverReport(startDate, endDate) : null;

    return (
        <main className="pb-20 space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <BarChart3 className="w-6 h-6 text-orange-600" />
                        Business Analysis
                    </h1>
                    <p className="text-sm text-gray-500">Track performance across revenue, items, and drivers.</p>
                </div>

                <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl no-print self-start md:self-auto shadow-inner">
                    <a
                        href={`?type=revenue&range=${range}`}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${type === 'revenue' ? 'bg-white dark:bg-gray-700 shadow text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Wallet className="w-4 h-4" /> Revenue
                    </a>
                    <a
                        href={`?type=items&range=${range}`}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${type === 'items' ? 'bg-white dark:bg-gray-700 shadow text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <ShoppingBag className="w-4 h-4" /> Items
                    </a>
                    <a
                        href={`?type=driver&range=${range}`}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${type === 'driver' ? 'bg-white dark:bg-gray-700 shadow text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Truck className="w-4 h-4" /> Drivers
                    </a>
                </div>
            </header>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex flex-wrap items-center gap-2 no-print">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Time Range:
                    </span>
                    {['today', 'week', 'month', 'all'].map((r) => (
                        <a
                            key={r}
                            href={`?type=${type}&range=${r}`}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${range === r ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                        >
                            {r}
                        </a>
                    ))}
                    <DateRangeFilter />
                </div>

                <ReportToolbar />
            </div>

            {type === 'revenue' && revenueData && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid gap-6 sm:grid-cols-3">
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
                            <p className="text-blue-100/80 text-sm font-medium mb-1 uppercase tracking-wider">Total Revenue</p>
                            <p className="text-3xl font-bold">₹{revenueData.grandTotal}</p>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-green-100/80 text-sm font-medium mb-1 uppercase tracking-wider">Total Paid</p>
                                    <p className="text-3xl font-bold">₹{revenueData.grandPaid}</p>
                                </div>
                                <CheckCircle2 className="w-8 h-8 text-green-200/50" />
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-red-500 to-rose-600 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-red-100/80 text-sm font-medium mb-1 uppercase tracking-wider">Outstanding</p>
                                    <p className="text-3xl font-bold">₹{revenueData.grandPending}</p>
                                </div>
                                <AlertCircle className="w-8 h-8 text-red-200/50" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50">
                            <h3 className="font-bold text-gray-900 dark:text-gray-100">Store-wise Revenue Breakdown</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Store</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Billed</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Paid</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Pending</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {revenueData.storeWise.map((s, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                            <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-gray-100">{s.name}</td>
                                            <td className="px-6 py-4 text-sm text-right font-medium text-gray-600">₹{s.total}</td>
                                            <td className="px-6 py-4 text-sm text-right text-green-600 font-bold">₹{s.paid}</td>
                                            <td className={`px-6 py-4 text-sm text-right font-bold ${s.pending > 0 ? 'text-red-600' : 'text-gray-300'}`}>₹{s.pending}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {type === 'items' && itemData && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-8 rounded-2xl text-white shadow-xl text-center relative overflow-hidden">
                        <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
                        <p className="text-purple-200 text-sm font-bold uppercase tracking-wider mb-2">Total Items Sold</p>
                        <p className="text-5xl font-bold mb-2">
                            {itemData.reduce((acc, i) => acc + i.totalQty, 0)}
                        </p>
                        <p className="text-purple-200 text-sm">Valid across all stores for selected range</p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        {itemData.map((item, idx) => (
                            <div key={idx} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
                                <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{item.name}</h3>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-orange-600">{item.totalQty}</div>
                                        <div className="text-[10px] text-gray-400 uppercase tracking-wider">Total Qty</div>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-auto max-h-64">
                                    <table className="min-w-full divide-y divide-gray-100">
                                        <thead className="bg-white sticky top-0">
                                            <tr>
                                                <th className="px-6 py-2 text-left text-[10px] font-bold text-gray-400 uppercase">Store</th>
                                                <th className="px-6 py-2 text-right text-[10px] font-bold text-gray-400 uppercase">Qty</th>
                                                <th className="px-6 py-2 text-right text-[10px] font-bold text-gray-400 uppercase">Value</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {item.storeBreakup.map((s, sIdx) => (
                                                <tr key={sIdx}>
                                                    <td className="px-6 py-2 text-sm text-gray-600 dark:text-gray-400">{s.storeName}</td>
                                                    <td className="px-6 py-2 text-sm text-right font-medium">{s.qty}</td>
                                                    <td className="px-6 py-2 text-sm text-right text-gray-500">₹{s.amount}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-sm">
                                    <span className="text-gray-500 font-medium">Total Value Generated</span>
                                    <span className="font-bold text-green-600">₹{item.totalAmount}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {type === 'driver' && driverData && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between h-32">
                            <Truck className="w-8 h-8 text-gray-300 mb-auto" />
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Deliveries</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {driverData.reduce((acc, d) => acc + d.deliveriesCount, 0)}
                                </p>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 p-5 rounded-2xl border border-green-100 dark:border-green-800 shadow-sm flex flex-col justify-between h-32">
                            <Wallet className="w-8 h-8 text-green-300 mb-auto" />
                            <div>
                                <p className="text-xs font-bold text-green-600/70 uppercase tracking-wider mb-1">Cash Collected</p>
                                <p className="text-2xl font-bold text-green-700">
                                    ₹{driverData.reduce((acc, d) => acc + d.cashCollected, 0)}
                                </p>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-800 shadow-sm flex flex-col justify-between h-32">
                            <CreditCard className="w-8 h-8 text-blue-300 mb-auto" />
                            <div>
                                <p className="text-xs font-bold text-blue-600/70 uppercase tracking-wider mb-1">UPI Collected</p>
                                <p className="text-2xl font-bold text-blue-700">
                                    ₹{driverData.reduce((acc, d) => acc + d.upiCollected, 0)}
                                </p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between h-32">
                            <ShoppingBag className="w-8 h-8 text-purple-300 mb-auto" />
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Items Delivered</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {driverData.reduce((acc, d) => acc + d.totalItems, 0)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                            <h3 className="font-bold text-gray-900">Driver Performance Leaderboard</h3>
                        </div>
                        <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                            <thead className="bg-white dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Driver</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Deliveries</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Cash</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">UPI</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {driverData.map((d, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900 dark:text-white">{d.name}</div>
                                            <div className="text-xs text-gray-500">ID: {d.driverId.slice(0, 6)}...</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right font-medium">{d.deliveriesCount}</td>
                                        <td className="px-6 py-4 text-sm text-right text-green-600 font-bold">₹{d.cashCollected}</td>
                                        <td className="px-6 py-4 text-sm text-right text-blue-600 font-bold">₹{d.upiCollected}</td>
                                        <td className="px-6 py-4 text-right">
                                            <a
                                                href={`/owner/reports/driver/${d.driverId}?range=${range}`}
                                                className="inline-flex items-center gap-1 text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                                            >
                                                View Report
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </main>
    );
}
