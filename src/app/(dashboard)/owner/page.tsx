import { db } from '@/db';
import { orders, stores, users } from '@/db/schema';
import { sql, eq, desc, and } from 'drizzle-orm';
import { IndianRupee, TrendingUp, AlertCircle, ShoppingBag, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default async function Page() {
    // Fetch summary stats
    const todayStr = new Date().toISOString().split('T')[0];

    // Total Sales Today
    const todaySales = await db.select({
        total: sql<number>`sum(${orders.totalAmount})`
    }).from(orders).where(sql`date(${orders.date}) = ${todayStr}`);

    // Total Outstanding (All time)
    const allOrders = await db.select().from(orders).where(sql`${orders.status} != 'cancelled'`);
    const totalOutstanding = allOrders.reduce((acc: number, o: any) => acc + ((o.totalAmount || 0) - (o.paidAmount || 0)), 0);

    // Active Drivers count
    const activeDrivers = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, 'driver'));

    // Total Stores
    const totalStores = await db.select({ count: sql<number>`count(*)` }).from(stores);

    // Pending Bills List
    const pendingBills = await db.select({
        id: orders.id,
        date: orders.date,
        total: orders.totalAmount,
        paid: orders.paidAmount,
        storeName: stores.name,
        storeId: stores.id
    })
        .from(orders)
        .leftJoin(stores, eq(orders.storeId, stores.id))
        .where(sql`${orders.totalAmount} > ${orders.paidAmount} AND ${orders.status} != 'cancelled'`)
        .orderBy(desc(orders.date))
        .limit(5);

    // Recent Activity
    const recentActivity = await db.select({
        id: orders.id,
        date: orders.date,
        total: orders.totalAmount,
        store: stores.name,
        type: orders.type
    })
        .from(orders)
        .leftJoin(stores, eq(orders.storeId, stores.id))
        .orderBy(desc(orders.date))
        .limit(5);

    return (
        <main className="space-y-8 pb-10">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
                        Dashboard Overview
                    </h1>
                    <p className="text-sm text-gray-500">Welcome back, here's what's happening today.</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/owner/billing" className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-orange-200 transition-all active:scale-95 flex items-center gap-2">
                        <span>+ New Bill</span>
                    </Link>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {/* Total Sales Card */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 p-6 text-white shadow-lg transition-transform hover:-translate-y-1">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-10 -mb-10 blur-xl"></div>

                    <div className="relative z-10 flex justify-between items-start mb-4">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-full text-orange-50">TODAY</span>
                    </div>

                    <h3 className="text-3xl font-bold mb-1">₹{todaySales[0]?.total || 0}</h3>
                    <p className="text-orange-100 text-sm font-medium opacity-90">Total Revenue</p>
                </div>

                {/* Outstanding Card */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-6 text-white shadow-lg transition-transform hover:-translate-y-1">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>

                    <div className="relative z-10 flex justify-between items-start mb-4">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <AlertCircle className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-full text-indigo-50">ALL TIME</span>
                    </div>

                    <h3 className="text-3xl font-bold mb-1">₹{totalOutstanding}</h3>
                    <p className="text-indigo-100 text-sm font-medium opacity-90">Total Outstanding</p>
                </div>

                {/* Drivers Card */}
                <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:border-orange-200 transition-all group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /></svg>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Active Drivers</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{activeDrivers[0]?.count || 0}</h3>
                        </div>
                    </div>
                </div>

                {/* Stores Card */}
                <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:border-orange-200 transition-all group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-xl group-hover:bg-green-100 transition-colors">
                            <ShoppingBag className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Stores</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{totalStores[0]?.count || 0}</h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pending Invoices Panel */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/30">
                        <h2 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                            Pending Payments
                        </h2>
                        <Link href="/owner/stores" className="text-xs font-semibold text-blue-600 hover:text-blue-700">View All</Link>
                    </div>

                    <div className="flex-1 overflow-auto">
                        {pendingBills.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 text-green-600">
                                    <CheckCircleIcon />
                                </div>
                                <p className="text-gray-500 font-medium">All clear! No pending payments.</p>
                            </div>
                        ) : (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 font-medium border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-3">Store</th>
                                        <th className="px-6 py-3 text-right">Balance</th>
                                        <th className="px-6 py-3 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {pendingBills.map((bill: any) => {
                                        const balance = (bill.total || 0) - (bill.paid || 0);
                                        return (
                                            <tr key={bill.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-gray-900">{bill.storeName}</div>
                                                    <div className="text-xs text-gray-500">{new Date(bill.date).toLocaleDateString()}</div>
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-red-600">
                                                    ₹{balance}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <Link href={`/owner/billing?storeId=${bill.storeId}`} className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors font-medium">
                                                        Collect
                                                    </Link>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Recent Activity Panel */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/30">
                        <h2 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            Recent Activity
                        </h2>
                        <Link href="/owner/orders" className="text-xs font-semibold text-blue-600 hover:text-blue-700">View All</Link>
                    </div>

                    <div className="flex-1 p-0">
                        {recentActivity.map((order: any) => (
                            <div key={order.id} className="px-6 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${order.type === 'collection' ? 'bg-purple-50 text-purple-600' : 'bg-orange-50 text-orange-600'}`}>
                                        {order.type === 'collection' ? <WalletIcon size={16} /> : <ShoppingBag size={16} />}
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900">{order.store || 'Unknown Store'}</div>
                                        <div className="text-xs text-gray-500 uppercase tracking-wide">{order.type}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-gray-900">₹{order.total}</div>
                                    <div className="text-xs text-gray-400">{new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}

function CheckCircleIcon() {
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
}

function WalletIcon({ size = 24 }: { size?: number }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" /></svg>
}
