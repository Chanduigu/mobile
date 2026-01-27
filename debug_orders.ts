
import { db } from './src/db';
import { orders, users } from './src/db/schema';
import { desc, eq } from 'drizzle-orm';

async function main() {
    console.log('--- Recent Orders ---');
    const recentOrders = await db.select({
        id: orders.id,
        date: orders.date,
        total: orders.totalAmount,
        paid: orders.paidAmount,
        paymentMethod: orders.paymentMethod,
        driverId: orders.driverId,
        driverName: users.name
    })
        .from(orders)
        .leftJoin(users, eq(orders.driverId, users.id))
        .orderBy(desc(orders.date))
        .limit(5);

    console.log(JSON.stringify(recentOrders, null, 2));
}

main().catch(console.error);
