
import { db } from './src/db';
import { orders, orderItems, items, stores, storePrices } from './src/db/schema';

async function reset() {
    console.log('Starting DB Reset...');

    // Delete in order to satisfy Foreign Key constraints
    console.log('Deleting Order Items...');
    await db.delete(orderItems);

    console.log('Deleting Orders...');
    await db.delete(orders);

    console.log('Deleting Store Prices...');
    await db.delete(storePrices);

    console.log('Deleting Items...');
    await db.delete(items);

    console.log('Deleting Stores...');
    await db.delete(stores);

    console.log('---');
    console.log('✅ All Business Data (Orders, Items, Stores) has been cleared.');
    console.log('ℹ️  User accounts (Owner/Driver) were PRESERVED so you can still log in.');
}

reset().catch(console.error);
