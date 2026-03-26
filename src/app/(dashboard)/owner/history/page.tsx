import { getRouteHistory } from '@/lib/report-actions';
import { getDrivers } from '@/lib/user-actions';
import { auth } from '@/auth';
import Link from 'next/link';
import DateRangeFilter from '@/components/date-range-filter';
import DriverFilter from '@/components/driver-filter';
import CloseRouteButton from '@/components/close-route-button';
import { format, startOfToday, startOfWeek, startOfMonth } from 'date-fns';
import { Calendar, User } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function RouteHistoryPage({
    searchParams
}: {
    searchParams: Promise<{ range?: string, from?: string, to?: string, driverId?: string }>
}) {
    await auth();
    const { range = 'today', from, to, driverId } = await searchParams;

    let startDate: string | undefined;
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

    const [routes, drivers] = await Promise.all([
        getRouteHistory(startDate, endDate, driverId),
        getDrivers()
    ]);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Route History</h1>

            <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex flex-wrap items-center gap-2 no-print">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Time Range:
                    </span>
                    {['today', 'week', 'month', 'all'].map((r) => {
                        const driverParam = driverId ? `& driverId=${driverId} ` : '';
                        return (
                            <a
                                key={r}
                                href={`?range=${r}${driverParam}`}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${range === r ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                            >
                                {r}
                            </a>
                        );
                    })}
                    <DateRangeFilter />
                </div>

                <div className="flex items-center gap-2 no-print min-w-[200px]">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <User className="w-3 h-3" /> Driver:
                    </span>
                    <DriverFilter
                        drivers={drivers}
                        currentDriverId={driverId}
                        currentRange={range}
                        currentFrom={from}
                        currentTo={to}
                    />
                </div>
            </div>

            {routes.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-100 dark:border-gray-700 shadow-sm">
                    <p className="text-gray-500 text-lg">No routes found matching the current filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {routes.map((route) => {
                        const totalBilled = (route.totalRevenue || 0) + (route.totalPending || 0);

                        return (
                            <div key={route.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                                <div className="p-5 border-b border-gray-50 dark:border-gray-700 flex justify-between items-start">
                                    <div>
                                        <div className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">{route.date}</div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                            {route.driverName}
                                        </h3>
                                        <div className="text-sm font-medium text-gray-500">
                                            Route {route.routeNumber}
                                        </div>
                                    </div>
                                    <div className={`px - 3 py - 1 rounded - full text - xs font - bold ${route.status === 'completed' ? 'bg-green-100 text-green-700' : route.status === 'active' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'} `}>
                                        {route.status ? route.status.charAt(0).toUpperCase() + route.status.slice(1) : 'Unknown'}
                                    </div>
                                </div>

                                <div className="p-5 flex-grow space-y-4">
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Stops Completed</div>
                                        <div className="font-bold flex items-center gap-2">
                                            <span className={route.completedStops === route.totalStops ? 'text-green-600' : 'text-gray-900 dark:text-gray-100'}>
                                                {route.completedStops} / {route.totalStops}
                                            </span>
                                            {route.completedStops === route.totalStops && <span className="text-green-500 text-lg">✓</span>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                                        <div>
                                            <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Total Billed</div>
                                            <div className="font-bold text-gray-900 dark:text-gray-100">₹{totalBilled}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Pending</div>
                                            <div className="font-bold text-red-500">₹{route.totalPending}</div>
                                        </div>
                                        <div className="col-span-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                            <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Collected</div>
                                            <div className="font-bold text-green-600 text-lg">₹{route.totalRevenue}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 mt-auto flex flex-col gap-2">
                                    <CloseRouteButton
                                        routeId={route.id}
                                        pendingAmount={route.totalPending}
                                        status={route.status || 'active'}
                                    />
                                    <Link
                                        href={`/owner/history/${route.id}`}
                                        className="w-full block text-center py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-orange-600 transition-colors"
                                    >
                                        View Details
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
