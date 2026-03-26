CREATE TABLE `items` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`default_price` real NOT NULL
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`item_id` text NOT NULL,
	`quantity` integer NOT NULL,
	`price` real NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`driver_id` text,
	`route_id` text,
	`date` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`total_amount` real DEFAULT 0,
	`paid_amount` real DEFAULT 0,
	`cash_paid` real DEFAULT 0,
	`upi_paid` real DEFAULT 0,
	`payment_method` text DEFAULT 'none',
	`collected_by` text DEFAULT 'DRIVER',
	`collector_name` text,
	`type` text DEFAULT 'delivery',
	`payment_proof` text,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`driver_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`route_id`) REFERENCES `routes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `route_stops` (
	`id` text PRIMARY KEY NOT NULL,
	`route_id` text NOT NULL,
	`store_id` text NOT NULL,
	`sequence` integer NOT NULL,
	`status` text DEFAULT 'pending',
	`completed_at` integer,
	FOREIGN KEY (`route_id`) REFERENCES `routes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `route_vehicle_load` (
	`id` text PRIMARY KEY NOT NULL,
	`route_id` text NOT NULL,
	`item_id` text NOT NULL,
	`quantity` integer NOT NULL,
	FOREIGN KEY (`route_id`) REFERENCES `routes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `routes` (
	`id` text PRIMARY KEY NOT NULL,
	`driver_id` text NOT NULL,
	`date` text NOT NULL,
	`route_number` integer DEFAULT 1 NOT NULL,
	`status` text DEFAULT 'new',
	`slot` text DEFAULT 'Morning',
	`created_at` integer DEFAULT (unixepoch()),
	`closed_at` integer,
	FOREIGN KEY (`driver_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `store_prices` (
	`id` text PRIMARY KEY NOT NULL,
	`store_id` text NOT NULL,
	`item_id` text NOT NULL,
	`price` real NOT NULL,
	FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `stores` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`address` text,
	`phone` text,
	`latitude` real,
	`longitude` real,
	`gmaps_link` text
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`role` text DEFAULT 'driver' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);