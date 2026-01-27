import { db } from '@/db';
import { stores, orders, orderItems, items } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function StoreDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const store = await db.select().from(stores).where(eq(stores.id, id)).get();

    if (!store) notFound();

    // Fetch all orders for this store
    const storeOrders = await db.select().from(orders).where(eq(orders.storeId, id)).orderBy(desc(orders.date)).all();

    // Fetch all order items linked to these orders
    // SQLite doesn't support complex joins easily in one go with simple query builder, 
    // but for "Simple Pani Puri" app, fetching all items for these orders is fine.
    // Or we can just get all order items where orderId in storeOrders.map(id)

    // Let's get "Item Sales Report" for this store
    // 1. Get all items
    const allItems = await db.select().from(items).all();
    const itemMap = new Map(allItems.map((i: any) => [i.id, i.name]));

    // 2. We need to aggregate sales per item for this store.
    // We can iterate over orders -> fetch their items -> aggregate.
    // Optimization: Select * from orderItems where orderId is in (select id from orders where storeId = id)
    // But better-sqlite3 logic:

    const allOrderIds = storeOrders.map((o: any) => o.id);
    let storeOrderItems: any[] = [];
    if (allOrderIds.length > 0) {
        // Batching or getting all is tricky with limitations, but let's try direct loop for simplicity or a raw query if needed.
        // For small scale, loop is okay or one big select if we can.
        // Let's use a simpler approach: Get all orderItems and filter in memory if dataset is small, 
        // OR use a raw join query which Drizzle supports.

        // Let's use Drizzle's relational query capabilities or manual join equivalent.
        // Since we didn't setup relational schema fully (withRelations), we'll do:
        const rows = await db.select({
            itemId: orderItems.itemId,
            quantity: orderItems.quantity,
            price: orderItems.price
        })
            .from(orderItems)
            .innerJoin(orders, eq(orders.id, orderItems.orderId))
            .where(eq(orders.storeId, id))
            .all();

        storeOrderItems = rows;
    }

    // Aggregate Items
    const itemSales: Record<string, { qty: number, revenue: number, name: string }> = {};
    storeOrderItems.forEach(row => {
        const name = itemMap.get(row.itemId) || 'Unknown Item';
        if (!itemSales[row.itemId]) {
            itemSales[row.itemId] = { qty: 0, revenue: 0, name: name as string };
        }
        itemSales[row.itemId].qty += row.quantity;
        itemSales[row.itemId].revenue += (row.quantity * row.price);
    });

    const sortedItemSales = Object.values(itemSales).sort((a, b) => b.revenue - a.revenue);

    // Calculate totals
    const totalRevenue = storeOrders.reduce((acc: number, o: any) => acc + (o.totalAmount || 0), 0);
    const totalPaid = storeOrders.reduce((acc: number, o: any) => acc + (o.paidAmount || 0), 0);
    const totalPending = totalRevenue - totalPaid;

    return (
        <div className="w-full text-black dark:text-white pb-10">
            <Link href="/owner/stores" className="text-gray-500 hover:text-black mb-4 inline-block">&larr; Back to Stores</Link>

            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-3xl font-bold">{store.name}</h1>
                    <p className="text-gray-600">{store.address} | {store.phone}</p>
                </div>
                <div className="text-right">
                    <div className="text-sm text-gray-500">Total Outstanding</div>
                    <div className={`text-3xl font-bold ${totalPending > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ₹{totalPending}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* ITEM SALES */}
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
                        <h2 className="font-bold text-lg">Item Sales Summary</h2>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {sortedItemSales.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="px-6 py-3 text-sm font-medium">{item.name}</td>
                                    <td className="px-6 py-3 text-sm text-right">{item.qty}</td>
                                    <td className="px-6 py-3 text-sm text-right">₹{item.revenue}</td>
                                </tr>
                            ))}
                            {sortedItemSales.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-6 py-4 text-center text-gray-500 text-sm">No items sold yet.</td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot className="bg-gray-50 dark:bg-gray-800 font-bold border-t">
                            <tr>
                                <td className="px-6 py-3 text-sm">Total</td>
                                <td className="px-6 py-3 text-sm text-right">{sortedItemSales.reduce((a, b) => a + b.qty, 0)}</td>
                                <td className="px-6 py-3 text-sm text-right">₹{sortedItemSales.reduce((a, b) => a + b.revenue, 0)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* TRANSACTIONS */}
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
                        <h2 className="font-bold text-lg">Transaction History</h2>
                    </div>
                    <div className="overflow-y-auto max-h-[500px]">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Bill Amount</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Paid</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {storeOrders.map((order: any) => {
                                    const balance = (order.totalAmount || 0) - (order.paidAmount || 0);
                                    return (
                                        <tr key={order.id}>
                                            <td className="px-6 py-3 text-sm text-gray-500">
                                                {new Date(order.date).toLocaleDateString()}
                                                <div className="text-xs text-gray-400">{new Date(order.date).toLocaleTimeString()}</div>
                                            </td>
                                            <td className="px-6 py-3 text-sm text-right font-medium">₹{order.totalAmount}</td>
                                            <td className="px-6 py-3 text-sm text-right text-green-600">₹{order.paidAmount}</td>
                                            <td className={`px-6 py-3 text-sm text-right font-bold ${balance > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                                {balance > 0 ? `₹${balance}` : 'Paid'}
                                            </td>
                                            <td className="px-6 py-3 text-sm text-right font-medium space-x-2">
                                                <Link
                                                    href={`/owner/orders/${order.id}`}
                                                    className="text-blue-600 hover:text-blue-800 underline"
                                                >
                                                    View
                                                </Link>
                                                <span className="text-gray-300">|</span>
                                                <a
                                                    href={`https://wa.me/?text=Invoice%20for%20${store.name}%0ADate:%20${new Date(order.date).toLocaleDateString()}%0ATotal:%20${order.totalAmount}`}
                                                    target="_blank"
                                                    className="text-green-600 hover:text-green-800"
                                                >
                                                    Share
                                                </a>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {storeOrders.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-4 text-center text-gray-500 text-sm">No transactions yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
