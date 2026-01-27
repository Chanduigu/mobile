import { db } from './src/db';
import { users } from './src/db/schema';
import { v4 as uuidv4 } from 'uuid';

async function main() {
    console.log('Seeding database...');

    try {
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
                username: 'driver',
                password: '123',
                role: 'driver',
            }
        ]).onConflictDoNothing();
        console.log('Seeding finished.');
    } catch (error) {
        console.error(error);
    }
}

main();
