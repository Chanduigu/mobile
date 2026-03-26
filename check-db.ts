import { db } from './src/db';
import { users } from './src/db/schema';

async function check() {
    try {
        const allUsers = await db.select().from(users);
        console.log('Users:', allUsers);
        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
}
check();
