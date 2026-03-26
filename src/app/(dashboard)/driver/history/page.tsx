import { auth } from '@/auth';
import { db } from '@/db';
import { orders, stores, orderItems, items } from '@/db/schema';
import { desc, eq, and, inArray } from 'drizzle-orm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import HistoryList from '@/components/history-list';

// Server Action to fetch items on demand
async function getOrderItemsAction(orderId: string) {
    'use server';
    const itemsData = await db.select({
        itemName: items.name,
        quantity: orderItems.quantity,
        price: orderItems.price
    })
        .from(orderItems)
        .leftJoin(items, eq(orderItems.itemId, items.id))
        .where(eq(orderItems.orderId, orderId));

    return itemsData;
}

export default async function DriverHistoryPage(props: { params: Promise<{}>, searchParams: Promise<{}> }) {
    const session = await auth();
    const driverId = session?.user?.id;

    if (!driverId) {
        return <div>Not authorized</div>;
    }

    // Fetch driver's past orders
    const history = await db.select({
        id: orders.id,
        date: orders.date,
        totalAmount: orders.totalAmount,
        paidAmount: orders.paidAmount,
        paymentMethod: orders.paymentMethod,
        cashPaid: orders.cashPaid,
        upiPaid: orders.upiPaid,
        status: orders.status,
        storeName: stores.name,
        storeAddress: stores.address
    })
        .from(orders)
        .leftJoin(stores, eq(orders.storeId, stores.id))
        .where(eq(orders.driverId, driverId))
        .orderBy(desc(orders.date));

    // Calculate stats
    const totalDeliveries = history.length;
    const totalCollected = history.reduce((acc: number, order: any) => acc + (order.paidAmount || 0), 0);

    return (
        <main className="pb-20 space-y-6">
            <header className="flex items-center gap-4">
                <Link href="/driver" className="p-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors shadow-sm">
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold font-heading text-gray-900 dark:text-white">Delivery History</h1>
                    <p className="text-sm text-gray-500">Your past trips and collections</p>
                </div>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-5 rounded-2xl text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
                    <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Total Trips</p>
                    <p className="text-3xl font-bold">{totalDeliveries}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-5 rounded-2xl text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
                    <p className="text-green-100 text-xs font-bold uppercase tracking-wider mb-1">Total Collected</p>
                    <p className="text-3xl font-bold">₹{totalCollected}</p>
                </div>
            </div>

            {/* Client Component for Interactive List */}
            <HistoryList history={history} getOrderItems={getOrderItemsAction} />
        </main>
    );
}
