import { db } from './src/db';
import { users } from './src/db/schema';

async function main() {
    const allUsers = await db.select().from(users);
    console.log('--- USERS ---');
    console.table(allUsers);
}

main();
