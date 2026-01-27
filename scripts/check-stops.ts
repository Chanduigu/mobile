import { db } from '../src/db';
import { routeStops } from '../src/db/schema';

async function main() {
    const stops = await db.select().from(routeStops).all();
    console.table(stops);
}

main();
