import { getRouteHistory } from '@/lib/report-actions';
import { auth } from '@/auth';
import Link from 'next/link';
import CloseRouteButton from '@/components/close-route-button';

export default async function RouteHistoryPage() {
    await auth();
    const routes = await getRouteHistory();

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Route History</h1>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stops</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {routes.map((route) => (
                            <tr key={route.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{route.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{route.driverName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700">Route {route.routeNumber}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className={route.completedStops === route.totalStops ? 'text-green-600 font-bold' : ''}>
                                        {route.completedStops} / {route.totalStops}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">₹{route.totalRevenue}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <CloseRouteButton
                                        routeId={route.id}
                                        pendingAmount={route.totalPending}
                                        status={route.status || 'active'}
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <Link href={`/owner/history/${route.id}`} className="text-blue-600 hover:text-blue-900">View Report</Link>
                                </td>
                            </tr>
                        ))}
                        {routes.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">No routes found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
