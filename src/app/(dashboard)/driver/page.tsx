import { db } from '@/db';
import { orders, stores, items, storePrices, routes, routeStops } from '@/db/schema';
import { auth } from '@/auth';
import { eq, desc, and } from 'drizzle-orm';
import CreateOrderForm from '@/components/create-order-form';
import DriverSummary from '@/components/driver-summary';
import DriverRouteView from '@/components/driver-route-view';
import { getDriverDailyStats, getDriverOrders } from '@/lib/report-actions';
import { getDailyRoutes, getRouteLoadComparison } from '@/lib/route-actions';
import { getStoreBalances } from '@/lib/store-actions';

export default async function DriverPage({ searchParams }: { searchParams: Promise<{ view?: string; storeId?: string; routeId?: string }> }) {
    const session = await auth();
    const driverId = session?.user?.id;
    const { view, storeId, routeId } = await searchParams; // 'route' or 'bill' or 'history'

    if (!driverId) return <div>Not authenticated</div>;

    // Fetch today's routes
    const today = new Date().toISOString().split('T')[0];
    const allRoutes = await getDailyRoutes(driverId, today);
    // Filter out closed routes and sort by route number
    const dailyRoutes = allRoutes
        .filter(r => r.route.status !== 'closed')
        .sort((a, b) => (a.route.routeNumber || 0) - (b.route.routeNumber || 0));

    // Determine active route: searchParams.routeId -> OR first route -> OR null
    const activeRouteData = routeId
        ? dailyRoutes.find(r => r.route.id === routeId)
        : dailyRoutes.length > 0 ? dailyRoutes[0] : null;

    const hasRoute = !!activeRouteData;
    const currentRouteId = activeRouteData?.route.id;

    // Fetch orders for this driver today - ALL today's orders
    // NOTE: We might want to filter orders by routeId if we strictly want per-route stats, 
    // but the summary usually implies "Today's Performance". 
    // Let's keep summary as "Whole Day" for now, but maybe break down in history view.
    const todaysOrders = await db.select({
        id: orders.id,
        date: orders.date,
        totalAmount: orders.totalAmount,
        paidAmount: orders.paidAmount,
        cashPaid: orders.cashPaid,
        upiPaid: orders.upiPaid,
        storeId: orders.storeId,
        paymentMethod: orders.paymentMethod,
        driverId: orders.driverId,
        routeId: orders.routeId,
        type: orders.type
    }).from(orders).where(
        and(
            eq(orders.driverId, driverId),
        )
    ).all();

    // Filter logic for today relative to order.date string
    const ordersToday = todaysOrders.filter((o: any) => o.date.startsWith(today));

    // Filter orders for CURRENT route if filtering applied
    const ordersForRoute = activeRouteData
        ? ordersToday.filter((o: any) => o.routeId === activeRouteData.route.id)
        : [];

    const totalCollected = ordersToday.reduce((sum: any, o: any) => sum + (o.paidAmount || 0), 0);
    const totalCash = ordersToday.reduce((sum: any, o: any) => sum + (o.cashPaid || 0), 0);
    const totalUpi = ordersToday.reduce((sum: any, o: any) => sum + (o.upiPaid || 0), 0);
    const totalPending = ordersToday.reduce((sum: any, o: any) => sum + ((o.totalAmount || 0) - (o.paidAmount || 0)), 0);

    const stops = activeRouteData?.stops || [];
    const completedStops = stops.filter((s: any) => s.status === 'visited').length;
    const pendingStops = stops.length - completedStops;

    const allStores = await db.select().from(stores);
    const allItems = await db.select().from(items);
    const allStorePrices = await db.select().from(storePrices);
    const storeStats = await getStoreBalances();

    // Fetch live inventory for active route
    const loadStats = activeRouteData ? await getRouteLoadComparison(activeRouteData.route.id) : [];

    // --- HISTORY VIEW ---
    if (view === 'history') {
        const historyData = await getDriverOrders(driverId);
        return (
            <main className="max-w-4xl mx-auto space-y-6">
                <header className="flex items-center gap-4">
                    <a href="/driver" className="p-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors shadow-sm">
                        &larr; Back
                    </a>
                    <h1 className="text-2xl font-bold">Delivery History</h1>
                </header>

                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                            <p className="text-xs text-blue-600 dark:text-blue-400">Total Deliveries</p>
                            <p className="text-2xl font-bold">{historyData.totals.totalDeliveries}</p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                            <p className="text-xs text-green-600 dark:text-green-400">Total Collected</p>
                            <p className="text-2xl font-bold">₹{historyData.totals.totalCash + historyData.totals.totalUpi}</p>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                            <p className="text-xs text-purple-600 dark:text-purple-400">Cash Collected</p>
                            <p className="text-2xl font-bold">₹{historyData.totals.totalCash}</p>
                        </div>
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                            <p className="text-xs text-indigo-600 dark:text-indigo-400">UPI Collected</p>
                            <p className="text-2xl font-bold">₹{historyData.totals.totalUpi}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {historyData.orders.map((order: any) => (
                            <div key={order.id} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-center mb-2">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{order.storeName || 'Unknown Store'}</h3>
                                        <p className="text-xs text-gray-500">
                                            {new Date(order.date).toLocaleDateString()} • {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-gray-900 dark:text-gray-100">₹{order.totalAmount}</div>
                                        <div className={`text-xs capitalize ${order.paymentMethod === 'cash' ? 'text-green-600' : 'text-blue-600'}`}>{order.paymentMethod}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="max-w-4xl mx-auto">
            {/* Route Selector (Tabs) */}
            {dailyRoutes.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-4 mb-2">
                    {dailyRoutes.map((r) => {
                        const isActive = r.route.id === currentRouteId;
                        return (
                            <a
                                key={r.route.id}
                                href={`/driver?routeId=${r.route.id}`}
                                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${isActive
                                    ? 'bg-black text-white shadow-md'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                <span className="capitalize">Route {r.route.routeNumber}</span>
                                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${r.route.status === 'completed' ? 'bg-green-500/20 text-green-200' : 'bg-white/20'
                                    }`}>
                                    {r.stops.length} stops
                                </span>
                            </a>
                        )
                    })}
                </div>
            )}

            {/* Summary Dashboard - Shows WHOLE DAY stats always */}
            <DriverSummary
                totalStops={dailyRoutes.reduce((acc, r) => acc + r.stops.length, 0)}
                completedStops={dailyRoutes.reduce((acc, r) => acc + r.stops.filter((s: any) => s.status === 'visited').length, 0)}
                pendingStops={dailyRoutes.reduce((acc, r) => acc + r.stops.filter((s: any) => s.status !== 'visited').length, 0)}
                totalCollected={totalCollected}
                totalCash={totalCash}
                totalUpi={totalUpi}
                totalPending={totalPending}
                todaysOrdersCount={ordersToday.length}
            />


            {view === 'bill' ? (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold">Create New Bill</h1>
                        {hasRoute ? (
                            <a href={`/driver?routeId=${currentRouteId}`} className="text-blue-600 underline text-sm">&larr; Back to Route</a>
                        ) : (
                            <a href="/driver" className="text-blue-600 underline text-sm">&larr; Dashboard</a>
                        )}
                    </div>

                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 mb-10">
                        <CreateOrderForm
                            stores={allStores}
                            items={allItems}
                            storePrices={allStorePrices}
                            drivers={[]} // Not needed for driver role
                            role="driver"
                            currentUserId={driverId}
                            storeStats={storeStats}
                            initialStoreId={storeId}
                            routeId={currentRouteId}
                        />
                    </div>

                    {/* Recent Bills List */}
                    <div className="mt-8">
                        <h2 className="text-lg font-bold mb-4">Today's Bills</h2>
                        {ordersToday.length === 0 ? (
                            <p className="text-gray-500 text-sm">No bills created today.</p>
                        ) : (
                            <div className="space-y-4">
                                {ordersToday.map((order: any) => {
                                    const store = allStores.find((s: any) => s.id === order.storeId);
                                    return (
                                        <div key={order.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex justify-between items-center">
                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                                    {store?.name || 'Unknown Store'}
                                                    {order.type === 'collection' && (
                                                        <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
                                                            Collection
                                                        </span>
                                                    )}
                                                </h3>
                                                <p className="text-xs text-gray-500">#{order.id.slice(0, 8)} • {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-gray-900 dark:text-gray-100">₹{order.totalAmount}</div>
                                                <div className={`text-xs ${order.paidAmount && order.paidAmount >= (order.totalAmount || 0) ? 'text-green-600' : 'text-red-500'}`}>
                                                    {order.paidAmount && order.paidAmount >= (order.totalAmount || 0) ? 'Paid' : 'Pending'}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            ) : hasRoute ? (
                <div>
                    {/* Route Header */}
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-2xl font-bold">
                                {activeRouteData.route.slot ? <span className="capitalize">{activeRouteData.route.slot} Route</span> : 'My Delivery Route'}
                            </h1>
                            <p className="text-sm text-gray-500">{activeRouteData.stops.length} locations</p>
                        </div>
                        <a href={`/driver?view=bill&routeId=${currentRouteId}`} className="text-blue-600 underline text-sm">Create Ad-hoc Bill</a>
                    </div>

                    {pendingStops === 0 && completedStops > 0 && (
                        <div className="bg-gradient-to-br from-green-500 to-emerald-700 p-8 rounded-3xl text-center text-white shadow-xl mb-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                            <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner animate-pulse">
                                <span className="text-5xl">🎉</span>
                            </div>
                            <h2 className="text-3xl font-heading font-bold mb-2">Route Completed!</h2>
                            <p className="text-green-100 mb-8 text-lg font-medium">All deliveries done for this route.</p>

                            <div className="mt-4">
                                <a href={`/driver?view=bill&routeId=${currentRouteId}`} className="bg-white text-green-700 px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all inline-block w-full sm:w-auto">
                                    + Create Extra Bill
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Vehicle Load Card */}
                    {hasRoute && loadStats && loadStats.length > 0 && (
                        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 rounded-2xl text-white shadow-lg mb-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                            <h3 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
                                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                    🚚
                                </div>
                                <div className="flex flex-col">
                                    <span className="leading-none">Vehicle Inventory</span>
                                    <span className="text-[10px] text-indigo-200 font-normal uppercase tracking-wider">Live Tracking • {activeRouteData.route.slot}</span>
                                </div>
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {loadStats.filter((i: any) => i.loaded > 0).map((item: any) => (
                                    <div key={item.itemId} className="flex flex-col bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10 relative overflow-hidden group">
                                        {/* Progress Bar Background */}
                                        <div
                                            className="absolute bottom-0 left-0 h-1 bg-green-400 transition-all duration-500"
                                            style={{ width: `${Math.min(100, ((item.remaining || 0) / item.loaded) * 100)}%` }}
                                        />

                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs text-indigo-100 font-medium truncate pr-2">{item.itemName}</span>
                                            {item.remaining < 5 && item.remaining > 0 && (
                                                <span className="text-[9px] bg-red-500/80 px-1.5 rounded text-white animate-pulse">Low</span>
                                            )}
                                        </div>

                                        <div className="flex items-baseline gap-1">
                                            <span className={`font-bold text-2xl ${item.remaining === 0 ? 'text-white/40' : 'text-white'}`}>
                                                {item.remaining}
                                            </span>
                                            <span className="text-xs text-indigo-200">
                                                / {item.loaded}
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-indigo-300">left to deliver</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <DriverRouteView stops={activeRouteData.stops} routeId={activeRouteData.route.id} />
                </div>
            ) : (
                <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <h2 className="text-xl font-bold text-gray-400 mb-2">No active route selected.</h2>
                    <p className="text-gray-500 mb-6 text-sm">You have no assigned route for this slot/day.</p>
                    <a href="/driver?view=bill" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow hover:bg-blue-700 transition-colors">
                        + Create Ad-hoc Bill
                    </a>
                </div>
            )}

            <div className="space-y-4 mt-8">
                <p className="text-gray-500 italic text-sm text-center">
                    {hasRoute ? "Follow the route order for efficiency." : "No route assigned for today."}
                </p>
            </div>
        </main >
    );
}
