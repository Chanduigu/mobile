import { db } from './src/db';
import { users } from './src/db/schema';

async function listUsers() {
    const allUsers = await db.select().from(users).all();
    console.log(JSON.stringify(allUsers, null, 2));
}

listUsers();
