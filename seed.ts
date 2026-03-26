import { db } from './src/db';
import { users } from './src/db/schema';
import { v4 as uuidv4 } from 'uuid';
import { sql } from 'drizzle-orm';

async function main() {
    console.log('Seeding database...');

    try {
        console.log('Clearing old data...');
        // SQLite does not support TRUNCATE CASCADE. We use DELETE carefully to reset data.
        await db.execute(sql`DELETE FROM route_vehicle_load;`);
        await db.execute(sql`DELETE FROM route_stops;`);
        await db.execute(sql`DELETE FROM order_items;`);
        await db.execute(sql`DELETE FROM orders;`);
        await db.execute(sql`DELETE FROM routes;`);
        await db.execute(sql`DELETE FROM store_prices;`);
        await db.execute(sql`DELETE FROM stores;`);
        await db.execute(sql`DELETE FROM items;`);
        await db.execute(sql`DELETE FROM users;`);

        console.log('Inserting new default accounts...');
        await db.insert(users).values([
            {
                id: uuidv4(),
                name: 'Owner',
                username: 'owner',
                password: '123', // Simple password for now
                role: 'owner',
            },
            {
                id: uuidv4(),
                name: 'Driver 1',
                username: 'driver1',
                password: '123',
                role: 'driver',
            }
        ]).onConflictDoNothing();
        console.log('Database wiped and seeded with default accounts successfully.');
    } catch (error) {
        console.error(error);
    }
}

main();
