import { db } from '@/db';
import { orders, stores, orderItems, items } from '@/db/schema';
import { eq, sql, and, ne } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import DriverOrderForm from '@/components/driver-order-form';
import InvoiceView from '@/components/invoice-view';

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const order = await db.select().from(orders).where(eq(orders.id, id)).then(res => res[0]);
    if (!order) notFound();

    const store = await db.select().from(stores).where(eq(stores.id, order.storeId)).then(res => res[0]);

    // Calculate previous balance (excluding current order)
    const storeOrders = await db.select().from(orders).where(
        and(
            eq(orders.storeId, order.storeId),
            ne(orders.id, order.id),
            ne(orders.status, 'cancelled')
        )
    );

    // Sum of (total - paid) for past orders
    const previousBalance = storeOrders.reduce((acc: number, o: any) => acc + ((o.totalAmount || 0) - (o.paidAmount || 0)), 0);

    const oItems = await db.select({
        itemId: items.id,
        name: items.name,
        quantity: orderItems.quantity,
        price: orderItems.price,
    })
        .from(orderItems)
        .leftJoin(items, eq(orderItems.itemId, items.id))
        .where(eq(orderItems.orderId, order.id));

    return (
        <div className="max-w-3xl mx-auto pb-20">
            {order.status === 'delivered' ? (
                <InvoiceView order={order} items={oItems} store={store} previousBalance={previousBalance} />
            ) : (
                <div>
                    <h1 className="text-2xl font-bold mb-2">Delivery for {store?.name}</h1>
                    <p className="text-gray-500 mb-6">{store?.address}</p>
                    <DriverOrderForm
                        orderId={order.id}
                        initialItems={oItems as any[]}
                        previousBalance={previousBalance}
                    />
                </div>
            )}
        </div>
    );
}
