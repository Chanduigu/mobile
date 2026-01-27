import { sql } from 'drizzle-orm';
import { pgTable, text, integer, doublePrecision, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// Enums
export const roleEnum = pgEnum('role', ['owner', 'driver']);
export const orderStatusEnum = pgEnum('order_status', ['pending', 'delivered', 'cancelled']);
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'upi', 'split', 'none']);
export const collectedByEnum = pgEnum('collected_by', ['OWNER', 'DRIVER']);
export const orderTypeEnum = pgEnum('order_type', ['delivery', 'collection']);
export const routeStatusEnum = pgEnum('route_status', ['new', 'active', 'completed', 'closed']);
export const routeStopStatusEnum = pgEnum('route_stop_status', ['pending', 'visited', 'skipped']);

export const users = pgTable('users', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    username: text('username').notNull().unique(),
    password: text('password').notNull(), // In real app, hash this
    role: roleEnum('role').notNull().default('driver'),
});

export const items = pgTable('items', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    defaultPrice: doublePrecision('default_price').notNull(),
});

export const stores = pgTable('stores', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    address: text('address'),
    phone: text('phone'),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    gmapsLink: text('gmaps_link'),
});

// Custom price for a store for a specific item
export const storePrices = pgTable('store_prices', {
    id: text('id').primaryKey(),
    storeId: text('store_id').notNull().references(() => stores.id, { onDelete: 'cascade' }),
    itemId: text('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
    price: doublePrecision('price').notNull(),
});

export const orders = pgTable('orders', {
    id: text('id').primaryKey(),
    storeId: text('store_id').notNull().references(() => stores.id),
    driverId: text('driver_id').references(() => users.id),
    routeId: text('route_id').references(() => routes.id), // Link order to specific route
    date: text('date').notNull(), // ISO strings
    status: orderStatusEnum('status').notNull().default('pending'),
    totalAmount: doublePrecision('total_amount').default(0),
    paidAmount: doublePrecision('paid_amount').default(0),
    cashPaid: doublePrecision('cash_paid').default(0), // New field for split payment
    upiPaid: doublePrecision('upi_paid').default(0),   // New field for split payment
    paymentMethod: paymentMethodEnum('payment_method').default('none'),
    collectedBy: collectedByEnum('collected_by').default('DRIVER'),
    collectorName: text('collector_name'),
    type: orderTypeEnum('type').default('delivery'),
    createdAt: timestamp('created_at').defaultNow(),
});

export const orderItems = pgTable('order_items', {
    id: text('id').primaryKey(),
    orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    itemId: text('item_id').notNull().references(() => items.id),
    quantity: integer('quantity').notNull(),
    price: doublePrecision('price').notNull(), // Locked price at time of order
});

export const routes = pgTable('routes', {
    id: text('id').primaryKey(),
    driverId: text('driver_id').notNull().references(() => users.id),
    date: text('date').notNull(), // YYYY-MM-DD
    routeNumber: integer('route_number').notNull().default(1),
    status: routeStatusEnum('status').default('new'),
    createdAt: timestamp('created_at').defaultNow(),
    closedAt: timestamp('closed_at'),
});

export const routeStops = pgTable('route_stops', {
    id: text('id').primaryKey(),
    routeId: text('route_id').notNull().references(() => routes.id, { onDelete: 'cascade' }),
    storeId: text('store_id').notNull().references(() => stores.id),
    sequence: integer('sequence').notNull(), // 1, 2, 3...
    status: routeStopStatusEnum('status').default('pending'),
    completedAt: timestamp('completed_at'),
});

export const routeVehicleLoad = pgTable('route_vehicle_load', {
    id: text('id').primaryKey(),
    routeId: text('route_id').notNull().references(() => routes.id, { onDelete: 'cascade' }),
    itemId: text('item_id').notNull().references(() => items.id),
    quantity: integer('quantity').notNull(),
});
