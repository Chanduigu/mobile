import { db } from '@/db';
import { orders, orderItems, stores, items } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import InvoiceView from '@/components/invoice-view';

export default async function OrderInvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const order = await db.select().from(orders).where(eq(orders.id, id)).get();
    if (!order) notFound();

    const store = await db.select().from(stores).where(eq(stores.id, order.storeId)).get();

    // Fetch items
    const orderItemRows = await db.select({
        id: orderItems.id,
        quantity: orderItems.quantity,
        price: orderItems.price,
        name: items.name
    })
        .from(orderItems)
        .leftJoin(items, eq(orderItems.itemId, items.id))
        .where(eq(orderItems.orderId, id));

    return (
        <div className="p-4 md:p-8">
            <InvoiceView
                order={order}
                items={orderItemRows}
                store={store}
                previousBalance={0} // For simplicity in individual view or fetch real balance if needed
            />
        </div>
    );
}
