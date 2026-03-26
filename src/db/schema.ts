import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    username: text('username').notNull().unique(),
    password: text('password').notNull(),
    role: text('role').notNull().default('driver'), // sqlite doesn't have native enums, using text
});

export const items = sqliteTable('items', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    defaultPrice: real('default_price').notNull(), // using real for float/double
});

export const stores = sqliteTable('stores', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    address: text('address'),
    phone: text('phone'),
    latitude: real('latitude'),
    longitude: real('longitude'),
    gmapsLink: text('gmaps_link'),
});

export const storePrices = sqliteTable('store_prices', {
    id: text('id').primaryKey(),
    storeId: text('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
    itemId: text('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
    price: real('price').notNull(),
});

export const orders = sqliteTable('orders', {
    id: text('id').primaryKey(),
    storeId: text('store_id').notNull().references(() => stores.id),
    driverId: text('driver_id').references(() => users.id, { onDelete: 'set null' }),
    routeId: text('route_id').references(() => routes.id),
    date: text('date').notNull(),
    status: text('status').notNull().default('pending'),
    totalAmount: real('total_amount').default(0),
    paidAmount: real('paid_amount').default(0),
    cashPaid: real('cash_paid').default(0),
    upiPaid: real('upi_paid').default(0),
    paymentMethod: text('payment_method').default('none'),
    collectedBy: text('collected_by').default('DRIVER'),
    collectorName: text('collector_name'),
    type: text('type').default('delivery'),
    paymentProof: text('payment_proof'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const orderItems = sqliteTable('order_items', {
    id: text('id').primaryKey(),
    orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    itemId: text('item_id').notNull().references(() => items.id),
    quantity: integer('quantity').notNull(),
    price: real('price').notNull(),
});

export const routes = sqliteTable('routes', {
    id: text('id').primaryKey(),
    driverId: text('driver_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    date: text('date').notNull(),
    routeNumber: integer('route_number').notNull().default(1),
    status: text('status').default('new'),
    slot: text('slot').default('Morning'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
    closedAt: integer('closed_at', { mode: 'timestamp' }),
});

export const routeStops = sqliteTable('route_stops', {
    id: text('id').primaryKey(),
    routeId: text('route_id').notNull().references(() => routes.id, { onDelete: 'cascade' }),
    storeId: text('store_id').notNull().references(() => stores.id),
    sequence: integer('sequence').notNull(),
    status: text('status').default('pending'),
    completedAt: integer('completed_at', { mode: 'timestamp' }),
});

export const routeVehicleLoad = sqliteTable('route_vehicle_load', {
    id: text('id').primaryKey(),
    routeId: text('route_id').notNull().references(() => routes.id, { onDelete: 'cascade' }),
    itemId: text('item_id').notNull().references(() => items.id),
    quantity: integer('quantity').notNull(),
});
