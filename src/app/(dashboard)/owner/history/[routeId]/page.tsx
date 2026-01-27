import { getRouteDetails } from '@/lib/report-actions';
import { getRouteLoadComparison } from '@/lib/route-actions';
import { auth } from '@/auth';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReportActionsCell from '@/components/report-actions-cell';
import DownloadReportButton from '@/components/download-report-button';

export default async function RouteReportPage({ params }: { params: Promise<{ routeId: string }> }) {
    const session = await auth();
    const { routeId } = await params;
    const data = await getRouteDetails(routeId);
    const loadComparison = await getRouteLoadComparison(routeId);

    if (!data) return notFound();

    const { route, stops, orders, itemSummary } = data;
    const completedStops = stops.filter((s: any) => s.status === 'visited').length;
    const totalStops = stops.length;

    // Identify Extra Orders (Ad-hoc)
    // Fix: We must exclude orders that are ALREADY shown in the timeline.
    // The timeline shows one order per stop (the first one found for that store).
    const displayedOrderIds = new Set(
        stops.map((s: any) => orders.find((o: any) => o.storeId === s.storeId)?.id).filter(Boolean)
    );
    const extraOrders = orders.filter((o: any) => !displayedOrderIds.has(o.id));

    // Revenue calc
    const totalRevenue = orders.reduce((acc: any, o: any) => acc + (o.paidAmount || 0), 0);
    const totalPending = orders.reduce((acc: any, o: any) => acc + ((o.totalAmount || 0) - (o.paidAmount || 0)), 0);

    // Split calc
    const totalCash = orders.reduce((acc: any, o: any) => acc + (o.cashPaid || 0), 0);
    const totalUpi = orders.reduce((acc: any, o: any) => acc + (o.upiPaid || 0), 0);

    const reportTotals = {
        totalDeliveries: orders.length,
        totalRevenue: orders.reduce((acc: any, o: any) => acc + (o.totalAmount || 0), 0),
        totalCash,
        totalUpi
    };

    return (
        <div className="space-y-8 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/owner/history" className="text-sm text-gray-500 hover:underline">&larr; Back to History</Link>
                    <h1 className="text-2xl font-bold mt-1">Route Report</h1>
                    <p className="text-gray-500">{route.date} • {route.driverName}</p>
                </div>
                <div className="text-right no-print">
                    <DownloadReportButton
                        orders={orders}
                        totals={reportTotals}
                        driverName={route.driverName || 'Unknown'}
                        range={route.date || 'Single Date'}
                        generatedBy={session?.user?.name || 'Verif'}
                        userRole={session?.user?.role || 'Admin'}
                    />
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-500">Route Progress</div>
                    <div className="text-2xl font-bold">
                        {completedStops} <span className="text-gray-400 text-lg">/ {totalStops}</span>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-500">Total Billed</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        ₹{orders.reduce((acc: any, o: any) => acc + (o.totalAmount || 0), 0)}
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-500">Collected</div>
                    <div className="text-2xl font-bold text-green-600">₹{totalRevenue}</div>
                    <div className="text-xs text-gray-400 flex gap-2 mt-1">
                        <span>UPI: <b className="text-blue-600">₹{totalUpi}</b></span>
                        <span>Cash: <b className="text-purple-600">₹{totalCash}</b></span>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-500">Pending</div>
                    <div className="text-2xl font-bold text-red-500">₹{totalPending}</div>
                </div>
            </div>

            {/* Route Timeline */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <h2 className="font-semibold">Execution Timeline</h2>
                </div>
                <div className="p-4">
                    {stops.map((stop: any, index: any) => {
                        const isLast = index === stops.length - 1;
                        const isVisited = stop.status === 'visited';
                        const order = orders.find((o: any) => o.storeId === stop.storeId);

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
                                                Visited: {stop.completedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        )}
                                    </div>

                                    {order ? (
                                        <div className="flex items-center gap-4">
                                            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded text-sm min-w-[220px]">
                                                <div className="flex justify-between mb-1">
                                                    <span>Total:</span>
                                                    <span className="font-medium">₹{order.totalAmount}</span>
                                                </div>
                                                <div className="flex justify-between mb-1 items-center">
                                                    <span>Paid:</span>
                                                    <div className="flex flex-col items-end">
                                                        <span className="font-medium text-green-700">₹{order.paidAmount}</span>
                                                        {order.paymentMethod === 'split' ? (
                                                            <span className="text-[10px] text-gray-500">
                                                                (Cash: ₹{order.cashPaid}, UPI: ₹{order.upiPaid})
                                                            </span>
                                                        ) : (
                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase ${order.paymentMethod === 'upi' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                                                {order.paymentMethod}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {((order.totalAmount || 0) - (order.paidAmount || 0)) > 0 && (
                                                    <div className="flex justify-between text-red-600 font-bold border-t pt-1 mt-1 border-gray-200">
                                                        <span>Bal:</span>
                                                        <span>₹{(order.totalAmount || 0) - (order.paidAmount || 0)}</span>
                                                    </div>
                                                )}
                                                <div className="text-xs text-gray-400 mt-1">INV: #{order.id.slice(0, 8).toUpperCase()}</div>
                                            </div>

                                            <div className="no-print">
                                                <ReportActionsCell
                                                    order={order}
                                                    driverName={route.driverName || 'Driver'}
                                                    generatedBy={session?.user?.name || 'Verif'}
                                                    userRole={session?.user?.role || 'Admin'}
                                                />
                                            </div>
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
            </div>

            {/* Extra Deliveries Section */}
            {extraOrders.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 mt-6 border-l-4 border-l-purple-500">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-purple-50 dark:bg-gray-900 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <h2 className="font-semibold text-purple-900 dark:text-purple-100">Extra / Ad-hoc Deliveries</h2>
                            <span className="text-xs bg-white/50 px-2 py-0.5 rounded-full border border-purple-200 text-purple-700">
                                After Route
                            </span>
                        </div>
                        <span className="text-xs font-bold bg-purple-100 text-purple-700 px-2 py-1 rounded-full border border-purple-200">
                            {extraOrders.length} New
                        </span>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {extraOrders.map((order: any) => (
                            <div key={order.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                        {order.storeName || 'Unknown Store'}
                                        <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200 uppercase tracking-widest font-bold">Ad-hoc</span>
                                    </h3>
                                    <p className="text-sm text-gray-500">{order.storeAddress || 'Walk-in / Unlisted'}</p>
                                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                        <span>Time: {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        <span>•</span>
                                        <span>INV: #{order.id.slice(0, 6).toUpperCase()}</span>
                                    </p>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="bg-white dark:bg-gray-900 p-3 rounded text-sm border border-gray-100 dark:border-gray-700 shadow-sm min-w-[200px]">
                                        <div className="flex justify-between mb-1">
                                            <span>Total:</span>
                                            <span className="font-bold">₹{order.totalAmount}</span>
                                        </div>
                                        <div className="flex justify-between mb-1 items-center">
                                            <span>Paid:</span>
                                            <div className="text-right">
                                                <span className="font-bold text-green-600 block">₹{order.paidAmount}</span>
                                                <span className="text-[10px] text-gray-400 uppercase">{order.paymentMethod}</span>
                                            </div>
                                        </div>
                                        {((order.totalAmount || 0) - (order.paidAmount || 0)) > 0 && (
                                            <div className="flex justify-between text-red-600 font-bold border-t pt-1 mt-1 border-gray-100">
                                                <span>Bal:</span>
                                                <span>₹{(order.totalAmount || 0) - (order.paidAmount || 0)}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="no-print">
                                        <ReportActionsCell
                                            order={order}
                                            driverName={route.driverName || 'Driver'}
                                            generatedBy={session?.user?.name || 'Verif'}
                                            userRole={session?.user?.role || 'Admin'}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Vehicle Stock Report */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <h2 className="font-semibold">Vehicle Stock Report (Load vs Delivered)</h2>
                </div>
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead>
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Loaded</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Delivered</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Remaining</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {loadComparison && loadComparison.length > 0 ? (
                            loadComparison.map((item: any, idx: number) => (
                                <tr key={idx}>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">{item.itemName}</td>
                                    <td className="px-6 py-4 text-sm text-right text-blue-600 font-medium">{item.loaded}</td>
                                    <td className="px-6 py-4 text-sm text-right text-green-600 font-medium">{item.delivered}</td>
                                    <td className={`px-6 py-4 text-sm text-right font-bold ${item.remaining < 0 ? 'text-red-500' : 'text-gray-900 dark:text-gray-100'}`}>
                                        {item.remaining}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="px-6 py-4 text-sm text-center text-gray-500 italic">No vehicle load data recorded.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Consolidated Items */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <h2 className="font-semibold">Consolidated Item Summary</h2>
                </div>
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead>
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Qty Delivered</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Value</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {itemSummary.map((item, idx) => (
                            <tr key={idx}>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">{item.name}</td>
                                <td className="px-6 py-4 text-sm text-right text-gray-500">{item.quantity}</td>
                                <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-gray-100 font-medium">₹{item.total}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
    );
}
