CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`user_name` varchar(120) NOT NULL,
	`action` varchar(100) NOT NULL,
	`entity_type` varchar(100) NOT NULL,
	`entity_id` varchar(100) NOT NULL,
	`details` text NOT NULL,
	`ip_address` varchar(60),
	`created_at` varchar(50) NOT NULL,
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `code_sequences` (
	`prefix` varchar(20) NOT NULL,
	`date_str` varchar(20) NOT NULL,
	`last_no` int NOT NULL DEFAULT 0,
	CONSTRAINT `code_sequences_prefix_date_str_pk` PRIMARY KEY(`prefix`,`date_str`)
);
--> statement-breakpoint
CREATE TABLE `customer_devices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customer_id` int NOT NULL,
	`customer_name` varchar(200),
	`customer_phone` varchar(30),
	`category_id` int NOT NULL,
	`category_name` varchar(120),
	`brand_id` int NOT NULL,
	`brand_name` varchar(100),
	`model_name` varchar(255) NOT NULL,
	`serial_number` varchar(100),
	`imei` varchar(100),
	`color` varchar(100),
	`notes` text,
	`created_at` varchar(50) NOT NULL,
	CONSTRAINT `customer_devices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(30) NOT NULL,
	`name` varchar(200) NOT NULL,
	`phone` varchar(30) NOT NULL,
	`email` varchar(120),
	`address` varchar(500),
	`customer_type` varchar(30) NOT NULL DEFAULT 'individual',
	`tax_number` varchar(50),
	`current_debt` bigint NOT NULL DEFAULT 0,
	`notes` text,
	`created_at` varchar(50) NOT NULL,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `customers_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `device_brands` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`is_active` int NOT NULL DEFAULT 1,
	CONSTRAINT `device_brands_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `device_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(120) NOT NULL,
	`icon` varchar(50),
	`is_active` int NOT NULL DEFAULT 1,
	CONSTRAINT `device_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `device_categories_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `inventory_batches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`batch_code` varchar(60) NOT NULL,
	`part_id` int NOT NULL,
	`part_name` varchar(255) NOT NULL,
	`sku` varchar(80) NOT NULL,
	`supplier_id` int,
	`supplier_name` varchar(255),
	`import_quantity` int NOT NULL DEFAULT 0,
	`remaining_quantity` int NOT NULL DEFAULT 0,
	`cost_price` bigint NOT NULL DEFAULT 0,
	`selling_price` bigint NOT NULL DEFAULT 0,
	`import_date` varchar(30) NOT NULL,
	`expiry_date` varchar(30),
	`created_by_name` varchar(120) NOT NULL,
	`notes` text,
	`created_at` varchar(50) NOT NULL,
	CONSTRAINT `inventory_batches_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_batches_batch_code_unique` UNIQUE(`batch_code`)
);
--> statement-breakpoint
CREATE TABLE `parts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sku` varchar(80) NOT NULL,
	`name` varchar(255) NOT NULL,
	`category_id` int NOT NULL DEFAULT 1,
	`category_name` varchar(120) NOT NULL,
	`supplier_id` int,
	`supplier_name` varchar(255),
	`compatible_models` varchar(500),
	`cost_price` bigint NOT NULL DEFAULT 0,
	`selling_price` bigint NOT NULL DEFAULT 0,
	`stock_quantity` int NOT NULL DEFAULT 0,
	`min_stock_alert` int NOT NULL DEFAULT 3,
	`location` varchar(120),
	`created_at` varchar(50) NOT NULL,
	CONSTRAINT `parts_id` PRIMARY KEY(`id`),
	CONSTRAINT `parts_sku_unique` UNIQUE(`sku`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`payment_code` varchar(50) NOT NULL,
	`ticket_id` int NOT NULL,
	`ticket_code` varchar(50) NOT NULL,
	`customer_name` varchar(200) NOT NULL,
	`amount` bigint NOT NULL DEFAULT 0,
	`payment_method` varchar(40) NOT NULL DEFAULT 'Cash',
	`payment_type` varchar(40) NOT NULL DEFAULT 'Final',
	`transaction_ref` varchar(100),
	`cashier_name` varchar(120) NOT NULL,
	`notes` text,
	`is_auto_verified` int DEFAULT 0,
	`gateway_provider` varchar(50),
	`card_brand` varchar(50),
	`created_at` varchar(50) NOT NULL,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `payments_payment_code_unique` UNIQUE(`payment_code`),
	CONSTRAINT `payments_transaction_ref_unique` UNIQUE(`transaction_ref`)
);
--> statement-breakpoint
CREATE TABLE `promotions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`discount_type` varchar(30) NOT NULL DEFAULT 'fixed',
	`discount_value` bigint NOT NULL DEFAULT 0,
	`max_discount_amount` bigint,
	`min_order_amount` bigint,
	`applicable_to` varchar(30) DEFAULT 'all',
	`start_date` varchar(20),
	`end_date` varchar(20),
	`usage_limit` int,
	`usage_count` int NOT NULL DEFAULT 0,
	`is_active` int NOT NULL DEFAULT 1,
	`created_at` varchar(50) NOT NULL,
	CONSTRAINT `promotions_id` PRIMARY KEY(`id`),
	CONSTRAINT `promotions_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `qc_checklists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticket_id` int NOT NULL,
	`checked_by_name` varchar(120) NOT NULL,
	`is_passed` int NOT NULL DEFAULT 1,
	`notes` text,
	`items_json` text NOT NULL,
	`created_at` varchar(50) NOT NULL,
	CONSTRAINT `qc_checklists_id` PRIMARY KEY(`id`),
	CONSTRAINT `qc_checklists_ticket_id_unique` UNIQUE(`ticket_id`)
);
--> statement-breakpoint
CREATE TABLE `repair_diagnostics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticket_id` int NOT NULL,
	`technician_id` int NOT NULL,
	`technician_name` varchar(120) NOT NULL,
	`root_cause` text NOT NULL,
	`proposed_solution` text NOT NULL,
	`estimated_cost` bigint NOT NULL DEFAULT 0,
	`estimated_hours` double,
	`notes` text,
	`created_at` varchar(50) NOT NULL,
	CONSTRAINT `repair_diagnostics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `repair_part_usages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticket_id` int NOT NULL,
	`part_id` int NOT NULL,
	`batch_id` int,
	`batch_code` varchar(60),
	`part_name` varchar(255) NOT NULL,
	`sku` varchar(80) NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`cost_price` bigint NOT NULL DEFAULT 0,
	`selling_price` bigint NOT NULL DEFAULT 0,
	`status` varchar(30) NOT NULL DEFAULT 'Used',
	`technician_name` varchar(120) NOT NULL,
	`created_at` varchar(50) NOT NULL,
	CONSTRAINT `repair_part_usages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `repair_quote_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quote_id` int NOT NULL,
	`item_type` varchar(20) NOT NULL DEFAULT 'part',
	`part_id` int,
	`batch_id` int,
	`batch_code` varchar(60),
	`name` varchar(255) NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`unit_price` bigint NOT NULL DEFAULT 0,
	`labor_fee` bigint NOT NULL DEFAULT 0,
	`subtotal` bigint NOT NULL DEFAULT 0,
	`warranty_months` int NOT NULL DEFAULT 0,
	CONSTRAINT `repair_quote_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `repair_quotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticket_id` int NOT NULL,
	`quote_code` varchar(50) NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`subtotal` bigint NOT NULL DEFAULT 0,
	`discount` bigint NOT NULL DEFAULT 0,
	`promotion_code` varchar(50),
	`promotion_id` int,
	`total_amount` bigint NOT NULL DEFAULT 0,
	`status` varchar(30) NOT NULL DEFAULT 'Sent',
	`rejection_reason` text,
	`confirmed_by` varchar(150),
	`confirmed_at` varchar(50),
	`created_by_name` varchar(120) NOT NULL,
	`created_at` varchar(50) NOT NULL,
	CONSTRAINT `repair_quotes_id` PRIMARY KEY(`id`),
	CONSTRAINT `repair_quotes_quote_code_unique` UNIQUE(`quote_code`)
);
--> statement-breakpoint
CREATE TABLE `repair_status_histories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticket_id` int NOT NULL,
	`from_status` varchar(40),
	`to_status` varchar(40) NOT NULL,
	`changed_by_name` varchar(120) NOT NULL,
	`notes` text,
	`created_at` varchar(50) NOT NULL,
	CONSTRAINT `repair_status_histories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `repair_tickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticket_code` varchar(50) NOT NULL,
	`customer_id` int NOT NULL,
	`customer_name` varchar(200) NOT NULL,
	`customer_phone` varchar(30) NOT NULL,
	`customer_address` varchar(500),
	`device_id` int NOT NULL,
	`device_model` varchar(255) NOT NULL,
	`device_category` varchar(120) NOT NULL,
	`device_brand` varchar(100) NOT NULL,
	`device_serial` varchar(100),
	`device_color` varchar(100),
	`created_by_id` int NOT NULL,
	`created_by_name` varchar(120) NOT NULL,
	`primary_technician_id` int,
	`primary_technician_name` varchar(120),
	`status` varchar(40) NOT NULL DEFAULT 'Received',
	`priority` varchar(20) NOT NULL DEFAULT 'Normal',
	`defect_description` text NOT NULL,
	`initial_condition` text,
	`cosmetic_condition` text,
	`accessories_included` text,
	`device_password_hint` varchar(500),
	`estimated_completion` varchar(50),
	`subtotal_amount` bigint NOT NULL DEFAULT 0,
	`discount_amount` bigint NOT NULL DEFAULT 0,
	`promotion_code` varchar(50),
	`promotion_id` int,
	`final_amount` bigint NOT NULL DEFAULT 0,
	`paid_amount` bigint NOT NULL DEFAULT 0,
	`debt_amount` bigint NOT NULL DEFAULT 0,
	`is_warranty_claim` int NOT NULL DEFAULT 0,
	`parent_ticket_id` int,
	`cancellation_reason` text,
	`created_at` varchar(50) NOT NULL,
	`updated_at` varchar(50) NOT NULL,
	CONSTRAINT `repair_tickets_id` PRIMARY KEY(`id`),
	CONSTRAINT `repair_tickets_ticket_code_unique` UNIQUE(`ticket_code`)
);
--> statement-breakpoint
CREATE TABLE `retail_sale_order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_id` int NOT NULL,
	`item_type` varchar(30) NOT NULL DEFAULT 'part',
	`part_id` int,
	`batch_id` int,
	`batch_code` varchar(60),
	`product_name` varchar(255) NOT NULL,
	`sku` varchar(80),
	`serial_number` varchar(100),
	`quantity` int NOT NULL DEFAULT 1,
	`cost_price` bigint NOT NULL DEFAULT 0,
	`unit_price` bigint NOT NULL DEFAULT 0,
	`subtotal` bigint NOT NULL DEFAULT 0,
	`warranty_months` int NOT NULL DEFAULT 6,
	`return_days` int DEFAULT 15,
	CONSTRAINT `retail_sale_order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `retail_sale_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_code` varchar(50) NOT NULL,
	`customer_id` int NOT NULL,
	`customer_name` varchar(200) NOT NULL,
	`customer_phone` varchar(30) NOT NULL,
	`customer_address` varchar(500),
	`created_by_id` int NOT NULL,
	`created_by_name` varchar(120) NOT NULL,
	`subtotal_amount` bigint NOT NULL DEFAULT 0,
	`discount_amount` bigint NOT NULL DEFAULT 0,
	`promotion_code` varchar(50),
	`promotion_id` int,
	`final_amount` bigint NOT NULL DEFAULT 0,
	`paid_amount` bigint NOT NULL DEFAULT 0,
	`debt_amount` bigint NOT NULL DEFAULT 0,
	`payment_method` varchar(40) NOT NULL DEFAULT 'Cash',
	`payment_status` varchar(40) NOT NULL DEFAULT 'Paid',
	`order_status` varchar(40) DEFAULT 'Completed',
	`refund_amount` bigint,
	`refund_reason` text,
	`refunded_at` varchar(50),
	`refunded_by_name` varchar(120),
	`return_to_stock` int,
	`transaction_ref` varchar(100),
	`notes` text,
	`warranty_months` int NOT NULL DEFAULT 6,
	`return_days` int DEFAULT 15,
	`created_at` varchar(50) NOT NULL,
	CONSTRAINT `retail_sale_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `retail_sale_orders_order_code_unique` UNIQUE(`order_code`)
);
--> statement-breakpoint
CREATE TABLE `schema_migrations` (
	`version` varchar(100) NOT NULL,
	`applied_at` varchar(50) NOT NULL,
	CONSTRAINT `schema_migrations_version` PRIMARY KEY(`version`)
);
--> statement-breakpoint
CREATE TABLE `store_settings` (
	`id` int NOT NULL,
	`store_name` varchar(255) NOT NULL,
	`store_slogan` varchar(255),
	`phone` varchar(100) NOT NULL,
	`email` varchar(150),
	`address` varchar(500) NOT NULL,
	`tax_number` varchar(50),
	`bank_name` varchar(150),
	`bank_account_no` varchar(50),
	`bank_account_name` varchar(150),
	`ticket_prefix` varchar(20) NOT NULL DEFAULT 'SC',
	`default_warranty_days` int NOT NULL DEFAULT 90,
	`default_return_days` int NOT NULL DEFAULT 15,
	`terms_intake` text,
	`terms_warranty` text,
	`auto_payment_enabled` int NOT NULL DEFAULT 1,
	`payment_gateway_provider` varchar(50) DEFAULT 'sepay',
	`gateway_api_key` varchar(255),
	`gateway_webhook_secret` varchar(255),
	`pos_terminal_id` varchar(100),
	`pos_ip_address` varchar(100),
	CONSTRAINT `store_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(30) NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone` varchar(50) NOT NULL,
	`email` varchar(120),
	`address` varchar(500),
	`is_active` int NOT NULL DEFAULT 1,
	CONSTRAINT `suppliers_id` PRIMARY KEY(`id`),
	CONSTRAINT `suppliers_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(50) NOT NULL,
	`email` varchar(120) NOT NULL,
	`full_name` varchar(120) NOT NULL,
	`phone` varchar(30),
	`role` varchar(30) NOT NULL DEFAULT 'technician',
	`password_hash` varchar(255) NOT NULL,
	`must_change_password` int NOT NULL DEFAULT 0,
	`is_active` int NOT NULL DEFAULT 1,
	`avatar_url` varchar(500),
	`created_at` varchar(50) NOT NULL,
	`last_login_at` varchar(50),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_username_unique` UNIQUE(`username`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `warranties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`warranty_code` varchar(50) NOT NULL,
	`ticket_id` int NOT NULL,
	`ticket_code` varchar(50) NOT NULL,
	`device_summary` varchar(255) NOT NULL,
	`customer_name` varchar(200) NOT NULL,
	`customer_phone` varchar(30) NOT NULL,
	`start_date` varchar(20) NOT NULL,
	`end_date` varchar(20) NOT NULL,
	`terms` text,
	`status` varchar(30) NOT NULL DEFAULT 'Active',
	`created_at` varchar(50) NOT NULL,
	CONSTRAINT `warranties_id` PRIMARY KEY(`id`),
	CONSTRAINT `warranties_warranty_code_unique` UNIQUE(`warranty_code`)
);
--> statement-breakpoint
ALTER TABLE `customer_devices` ADD CONSTRAINT `customer_devices_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventory_batches` ADD CONSTRAINT `inventory_batches_part_id_parts_id_fk` FOREIGN KEY (`part_id`) REFERENCES `parts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_ticket_id_repair_tickets_id_fk` FOREIGN KEY (`ticket_id`) REFERENCES `repair_tickets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `qc_checklists` ADD CONSTRAINT `qc_checklists_ticket_id_repair_tickets_id_fk` FOREIGN KEY (`ticket_id`) REFERENCES `repair_tickets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `repair_diagnostics` ADD CONSTRAINT `repair_diagnostics_ticket_id_repair_tickets_id_fk` FOREIGN KEY (`ticket_id`) REFERENCES `repair_tickets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `repair_part_usages` ADD CONSTRAINT `repair_part_usages_ticket_id_repair_tickets_id_fk` FOREIGN KEY (`ticket_id`) REFERENCES `repair_tickets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `repair_quote_items` ADD CONSTRAINT `repair_quote_items_quote_id_repair_quotes_id_fk` FOREIGN KEY (`quote_id`) REFERENCES `repair_quotes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `repair_quotes` ADD CONSTRAINT `repair_quotes_ticket_id_repair_tickets_id_fk` FOREIGN KEY (`ticket_id`) REFERENCES `repair_tickets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `repair_status_histories` ADD CONSTRAINT `repair_status_histories_ticket_id_repair_tickets_id_fk` FOREIGN KEY (`ticket_id`) REFERENCES `repair_tickets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `repair_tickets` ADD CONSTRAINT `repair_tickets_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `retail_sale_order_items` ADD CONSTRAINT `retail_sale_order_items_order_id_retail_sale_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `retail_sale_orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `warranties` ADD CONSTRAINT `warranties_ticket_id_repair_tickets_id_fk` FOREIGN KEY (`ticket_id`) REFERENCES `repair_tickets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_devices_serial` ON `customer_devices` (`serial_number`);--> statement-breakpoint
CREATE INDEX `idx_devices_imei` ON `customer_devices` (`imei`);--> statement-breakpoint
CREATE INDEX `idx_customers_phone` ON `customers` (`phone`);--> statement-breakpoint
CREATE INDEX `idx_tickets_status` ON `repair_tickets` (`status`);--> statement-breakpoint
CREATE INDEX `idx_tickets_created_at` ON `repair_tickets` (`created_at`);