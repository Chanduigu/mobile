
import { db } from './src/db';
import { users } from './src/db/schema';

async function main() {
    console.log('--- Users ---');
    const allUsers = await db.select().from(users);
    console.log(JSON.stringify(allUsers, null, 2));
}

main().catch(console.error);
