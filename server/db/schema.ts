import {
  mysqlTable,
  int,
  varchar,
  text,
  bigint,
  double,
  primaryKey,
  index,
} from 'drizzle-orm/mysql-core';

export const schemaMigrations = mysqlTable('schema_migrations', {
  version: varchar('version', { length: 100 }).primaryKey().notNull(),
  applied_at: varchar('applied_at', { length: 50 }).notNull(),
});

export const codeSequences = mysqlTable(
  'code_sequences',
  {
    prefix: varchar('prefix', { length: 20 }).notNull(),
    date_str: varchar('date_str', { length: 20 }).notNull(),
    last_no: int('last_no').notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.prefix, table.date_str] })]
);

export const storeSettings = mysqlTable('store_settings', {
  id: int('id').primaryKey().notNull(),
  store_name: varchar('store_name', { length: 255 }).notNull(),
  store_slogan: varchar('store_slogan', { length: 255 }),
  phone: varchar('phone', { length: 100 }).notNull(),
  email: varchar('email', { length: 150 }),
  address: varchar('address', { length: 500 }).notNull(),
  tax_number: varchar('tax_number', { length: 50 }),
  bank_name: varchar('bank_name', { length: 150 }),
  bank_account_no: varchar('bank_account_no', { length: 50 }),
  bank_account_name: varchar('bank_account_name', { length: 150 }),
  ticket_prefix: varchar('ticket_prefix', { length: 20 }).notNull().default('SC'),
  default_warranty_days: int('default_warranty_days').notNull().default(90),
  default_return_days: int('default_return_days').notNull().default(15),
  terms_intake: text('terms_intake'),
  terms_warranty: text('terms_warranty'),
  auto_payment_enabled: int('auto_payment_enabled').notNull().default(1),
  payment_gateway_provider: varchar('payment_gateway_provider', { length: 50 }).default('sepay'),
  gateway_api_key: varchar('gateway_api_key', { length: 255 }),
  gateway_webhook_secret: varchar('gateway_webhook_secret', { length: 255 }),
  pos_terminal_id: varchar('pos_terminal_id', { length: 100 }),
  pos_ip_address: varchar('pos_ip_address', { length: 100 }),
});

export const users = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey().notNull(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 120 }).notNull().unique(),
  full_name: varchar('full_name', { length: 120 }).notNull(),
  phone: varchar('phone', { length: 30 }),
  role: varchar('role', { length: 30 }).notNull().default('technician'),
  password_hash: varchar('password_hash', { length: 255 }).notNull(),
  must_change_password: int('must_change_password').notNull().default(0),
  is_active: int('is_active').notNull().default(1),
  /** Incremented on logout / password change / lock / role change to revoke every previously issued JWT */
  token_version: int('token_version').notNull().default(0),
  avatar_url: varchar('avatar_url', { length: 500 }),
  created_at: varchar('created_at', { length: 50 }).notNull(),
  last_login_at: varchar('last_login_at', { length: 50 }),
});

export const customers = mysqlTable(
  'customers',
  {
    id: int('id').autoincrement().primaryKey().notNull(),
    code: varchar('code', { length: 30 }).notNull().unique(),
    name: varchar('name', { length: 200 }).notNull(),
    phone: varchar('phone', { length: 30 }).notNull(),
    email: varchar('email', { length: 120 }),
    address: varchar('address', { length: 500 }),
    customer_type: varchar('customer_type', { length: 30 }).notNull().default('individual'),
    tax_number: varchar('tax_number', { length: 50 }),
    current_debt: bigint('current_debt', { mode: 'number' }).notNull().default(0),
    notes: text('notes'),
    created_at: varchar('created_at', { length: 50 }).notNull(),
  },
  (table) => [index('idx_customers_phone').on(table.phone)]
);

export const deviceCategories = mysqlTable('device_categories', {
  id: int('id').autoincrement().primaryKey().notNull(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 120 }).notNull(),
  icon: varchar('icon', { length: 50 }),
  is_active: int('is_active').notNull().default(1),
});

export const deviceBrands = mysqlTable('device_brands', {
  id: int('id').autoincrement().primaryKey().notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  is_active: int('is_active').notNull().default(1),
});

export const customerDevices = mysqlTable(
  'customer_devices',
  {
    id: int('id').autoincrement().primaryKey().notNull(),
    customer_id: int('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    customer_name: varchar('customer_name', { length: 200 }),
    customer_phone: varchar('customer_phone', { length: 30 }),
    category_id: int('category_id').notNull(),
    category_name: varchar('category_name', { length: 120 }),
    brand_id: int('brand_id').notNull(),
    brand_name: varchar('brand_name', { length: 100 }),
    model_name: varchar('model_name', { length: 255 }).notNull(),
    serial_number: varchar('serial_number', { length: 100 }),
    imei: varchar('imei', { length: 100 }),
    color: varchar('color', { length: 100 }),
    notes: text('notes'),
    created_at: varchar('created_at', { length: 50 }).notNull(),
  },
  (table) => [
    index('idx_devices_serial').on(table.serial_number),
    index('idx_devices_imei').on(table.imei),
  ]
);

export const suppliers = mysqlTable('suppliers', {
  id: int('id').autoincrement().primaryKey().notNull(),
  code: varchar('code', { length: 30 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }).notNull(),
  email: varchar('email', { length: 120 }),
  address: varchar('address', { length: 500 }),
  is_active: int('is_active').notNull().default(1),
});

export const parts = mysqlTable('parts', {
  id: int('id').autoincrement().primaryKey().notNull(),
  sku: varchar('sku', { length: 80 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  category_id: int('category_id').notNull().default(1),
  category_name: varchar('category_name', { length: 120 }).notNull(),
  supplier_id: int('supplier_id'),
  supplier_name: varchar('supplier_name', { length: 255 }),
  compatible_models: varchar('compatible_models', { length: 500 }),
  cost_price: bigint('cost_price', { mode: 'number' }).notNull().default(0),
  selling_price: bigint('selling_price', { mode: 'number' }).notNull().default(0),
  stock_quantity: int('stock_quantity').notNull().default(0),
  min_stock_alert: int('min_stock_alert').notNull().default(3),
  location: varchar('location', { length: 120 }),
  created_at: varchar('created_at', { length: 50 }).notNull(),
});

export const inventoryBatches = mysqlTable('inventory_batches', {
  id: int('id').autoincrement().primaryKey().notNull(),
  batch_code: varchar('batch_code', { length: 60 }).notNull().unique(),
  part_id: int('part_id')
    .notNull()
    .references(() => parts.id, { onDelete: 'cascade' }),
  part_name: varchar('part_name', { length: 255 }).notNull(),
  sku: varchar('sku', { length: 80 }).notNull(),
  supplier_id: int('supplier_id'),
  supplier_name: varchar('supplier_name', { length: 255 }),
  import_quantity: int('import_quantity').notNull().default(0),
  remaining_quantity: int('remaining_quantity').notNull().default(0),
  cost_price: bigint('cost_price', { mode: 'number' }).notNull().default(0),
  selling_price: bigint('selling_price', { mode: 'number' }).notNull().default(0),
  import_date: varchar('import_date', { length: 30 }).notNull(),
  expiry_date: varchar('expiry_date', { length: 30 }),
  created_by_name: varchar('created_by_name', { length: 120 }).notNull(),
  notes: text('notes'),
  created_at: varchar('created_at', { length: 50 }).notNull(),
});

export const promotions = mysqlTable('promotions', {
  id: int('id').autoincrement().primaryKey().notNull(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  discount_type: varchar('discount_type', { length: 30 }).notNull().default('fixed'),
  discount_value: bigint('discount_value', { mode: 'number' }).notNull().default(0),
  max_discount_amount: bigint('max_discount_amount', { mode: 'number' }),
  min_order_amount: bigint('min_order_amount', { mode: 'number' }),
  applicable_to: varchar('applicable_to', { length: 30 }).default('all'),
  start_date: varchar('start_date', { length: 20 }),
  end_date: varchar('end_date', { length: 20 }),
  usage_limit: int('usage_limit'),
  usage_count: int('usage_count').notNull().default(0),
  is_active: int('is_active').notNull().default(1),
  created_at: varchar('created_at', { length: 50 }).notNull(),
});

export const repairTickets = mysqlTable(
  'repair_tickets',
  {
    id: int('id').autoincrement().primaryKey().notNull(),
    ticket_code: varchar('ticket_code', { length: 50 }).notNull().unique(),
    customer_id: int('customer_id')
      .notNull()
      .references(() => customers.id),
    customer_name: varchar('customer_name', { length: 200 }).notNull(),
    customer_phone: varchar('customer_phone', { length: 30 }).notNull(),
    customer_address: varchar('customer_address', { length: 500 }),
    device_id: int('device_id').notNull(),
    device_model: varchar('device_model', { length: 255 }).notNull(),
    device_category: varchar('device_category', { length: 120 }).notNull(),
    device_brand: varchar('device_brand', { length: 100 }).notNull(),
    device_serial: varchar('device_serial', { length: 100 }),
    device_color: varchar('device_color', { length: 100 }),
    created_by_id: int('created_by_id').notNull(),
    created_by_name: varchar('created_by_name', { length: 120 }).notNull(),
    primary_technician_id: int('primary_technician_id'),
    primary_technician_name: varchar('primary_technician_name', { length: 120 }),
    status: varchar('status', { length: 40 }).notNull().default('Received'),
    priority: varchar('priority', { length: 20 }).notNull().default('Normal'),
    defect_description: text('defect_description').notNull(),
    initial_condition: text('initial_condition'),
    cosmetic_condition: text('cosmetic_condition'),
    accessories_included: text('accessories_included'),
    device_password_hint: varchar('device_password_hint', { length: 500 }),
    estimated_completion: varchar('estimated_completion', { length: 50 }),
    subtotal_amount: bigint('subtotal_amount', { mode: 'number' }).notNull().default(0),
    discount_amount: bigint('discount_amount', { mode: 'number' }).notNull().default(0),
    promotion_code: varchar('promotion_code', { length: 50 }),
    promotion_id: int('promotion_id'),
    final_amount: bigint('final_amount', { mode: 'number' }).notNull().default(0),
    paid_amount: bigint('paid_amount', { mode: 'number' }).notNull().default(0),
    debt_amount: bigint('debt_amount', { mode: 'number' }).notNull().default(0),
    is_warranty_claim: int('is_warranty_claim').notNull().default(0),
    parent_ticket_id: int('parent_ticket_id'),
    cancellation_reason: text('cancellation_reason'),
    created_at: varchar('created_at', { length: 50 }).notNull(),
    updated_at: varchar('updated_at', { length: 50 }).notNull(),
  },
  (table) => [
    index('idx_tickets_status').on(table.status),
    index('idx_tickets_created_at').on(table.created_at),
  ]
);

export const repairStatusHistories = mysqlTable('repair_status_histories', {
  id: int('id').autoincrement().primaryKey().notNull(),
  ticket_id: int('ticket_id')
    .notNull()
    .references(() => repairTickets.id, { onDelete: 'cascade' }),
  from_status: varchar('from_status', { length: 40 }),
  to_status: varchar('to_status', { length: 40 }).notNull(),
  changed_by_name: varchar('changed_by_name', { length: 120 }).notNull(),
  notes: text('notes'),
  created_at: varchar('created_at', { length: 50 }).notNull(),
});

export const repairDiagnostics = mysqlTable('repair_diagnostics', {
  id: int('id').autoincrement().primaryKey().notNull(),
  ticket_id: int('ticket_id')
    .notNull()
    .references(() => repairTickets.id, { onDelete: 'cascade' }),
  technician_id: int('technician_id').notNull(),
  technician_name: varchar('technician_name', { length: 120 }).notNull(),
  root_cause: text('root_cause').notNull(),
  proposed_solution: text('proposed_solution').notNull(),
  estimated_cost: bigint('estimated_cost', { mode: 'number' }).notNull().default(0),
  estimated_hours: double('estimated_hours'),
  notes: text('notes'),
  created_at: varchar('created_at', { length: 50 }).notNull(),
});

export const repairQuotes = mysqlTable('repair_quotes', {
  id: int('id').autoincrement().primaryKey().notNull(),
  ticket_id: int('ticket_id')
    .notNull()
    .references(() => repairTickets.id, { onDelete: 'cascade' }),
  quote_code: varchar('quote_code', { length: 50 }).notNull().unique(),
  version: int('version').notNull().default(1),
  subtotal: bigint('subtotal', { mode: 'number' }).notNull().default(0),
  discount: bigint('discount', { mode: 'number' }).notNull().default(0),
  promotion_code: varchar('promotion_code', { length: 50 }),
  promotion_id: int('promotion_id'),
  total_amount: bigint('total_amount', { mode: 'number' }).notNull().default(0),
  status: varchar('status', { length: 30 }).notNull().default('Sent'),
  rejection_reason: text('rejection_reason'),
  confirmed_by: varchar('confirmed_by', { length: 150 }),
  confirmed_at: varchar('confirmed_at', { length: 50 }),
  created_by_name: varchar('created_by_name', { length: 120 }).notNull(),
  created_at: varchar('created_at', { length: 50 }).notNull(),
});

export const repairQuoteItems = mysqlTable('repair_quote_items', {
  id: int('id').autoincrement().primaryKey().notNull(),
  quote_id: int('quote_id')
    .notNull()
    .references(() => repairQuotes.id, { onDelete: 'cascade' }),
  item_type: varchar('item_type', { length: 20 }).notNull().default('part'),
  part_id: int('part_id'),
  batch_id: int('batch_id'),
  batch_code: varchar('batch_code', { length: 60 }),
  name: varchar('name', { length: 255 }).notNull(),
  quantity: int('quantity').notNull().default(1),
  unit_price: bigint('unit_price', { mode: 'number' }).notNull().default(0),
  labor_fee: bigint('labor_fee', { mode: 'number' }).notNull().default(0),
  subtotal: bigint('subtotal', { mode: 'number' }).notNull().default(0),
  warranty_months: int('warranty_months').notNull().default(0),
});

export const qcChecklists = mysqlTable('qc_checklists', {
  id: int('id').autoincrement().primaryKey().notNull(),
  ticket_id: int('ticket_id')
    .notNull()
    .unique()
    .references(() => repairTickets.id, { onDelete: 'cascade' }),
  checked_by_name: varchar('checked_by_name', { length: 120 }).notNull(),
  is_passed: int('is_passed').notNull().default(1),
  notes: text('notes'),
  items_json: text('items_json').notNull(),
  created_at: varchar('created_at', { length: 50 }).notNull(),
});

export const repairPartUsages = mysqlTable('repair_part_usages', {
  id: int('id').autoincrement().primaryKey().notNull(),
  ticket_id: int('ticket_id')
    .notNull()
    .references(() => repairTickets.id, { onDelete: 'cascade' }),
  part_id: int('part_id').notNull(),
  batch_id: int('batch_id'),
  batch_code: varchar('batch_code', { length: 60 }),
  part_name: varchar('part_name', { length: 255 }).notNull(),
  sku: varchar('sku', { length: 80 }).notNull(),
  quantity: int('quantity').notNull().default(1),
  cost_price: bigint('cost_price', { mode: 'number' }).notNull().default(0),
  selling_price: bigint('selling_price', { mode: 'number' }).notNull().default(0),
  status: varchar('status', { length: 30 }).notNull().default('Used'),
  technician_name: varchar('technician_name', { length: 120 }).notNull(),
  created_at: varchar('created_at', { length: 50 }).notNull(),
});

export const payments = mysqlTable('payments', {
  id: int('id').autoincrement().primaryKey().notNull(),
  payment_code: varchar('payment_code', { length: 50 }).notNull().unique(),
  ticket_id: int('ticket_id')
    .notNull()
    .references(() => repairTickets.id, { onDelete: 'cascade' }),
  ticket_code: varchar('ticket_code', { length: 50 }).notNull(),
  customer_name: varchar('customer_name', { length: 200 }).notNull(),
  amount: bigint('amount', { mode: 'number' }).notNull().default(0),
  payment_method: varchar('payment_method', { length: 40 }).notNull().default('Cash'),
  payment_type: varchar('payment_type', { length: 40 }).notNull().default('Final'),
  transaction_ref: varchar('transaction_ref', { length: 100 }).unique(),
  cashier_name: varchar('cashier_name', { length: 120 }).notNull(),
  notes: text('notes'),
  is_auto_verified: int('is_auto_verified').default(0),
  gateway_provider: varchar('gateway_provider', { length: 50 }),
  card_brand: varchar('card_brand', { length: 50 }),
  created_at: varchar('created_at', { length: 50 }).notNull(),
});

export const warranties = mysqlTable('warranties', {
  id: int('id').autoincrement().primaryKey().notNull(),
  warranty_code: varchar('warranty_code', { length: 50 }).notNull().unique(),
  ticket_id: int('ticket_id')
    .notNull()
    .references(() => repairTickets.id, { onDelete: 'cascade' }),
  ticket_code: varchar('ticket_code', { length: 50 }).notNull(),
  device_summary: varchar('device_summary', { length: 255 }).notNull(),
  customer_name: varchar('customer_name', { length: 200 }).notNull(),
  customer_phone: varchar('customer_phone', { length: 30 }).notNull(),
  start_date: varchar('start_date', { length: 20 }).notNull(),
  end_date: varchar('end_date', { length: 20 }).notNull(),
  terms: text('terms'),
  status: varchar('status', { length: 30 }).notNull().default('Active'),
  created_at: varchar('created_at', { length: 50 }).notNull(),
});

export const retailSaleOrders = mysqlTable('retail_sale_orders', {
  id: int('id').autoincrement().primaryKey().notNull(),
  order_code: varchar('order_code', { length: 50 }).notNull().unique(),
  customer_id: int('customer_id').notNull(),
  customer_name: varchar('customer_name', { length: 200 }).notNull(),
  customer_phone: varchar('customer_phone', { length: 30 }).notNull(),
  customer_address: varchar('customer_address', { length: 500 }),
  created_by_id: int('created_by_id').notNull(),
  created_by_name: varchar('created_by_name', { length: 120 }).notNull(),
  subtotal_amount: bigint('subtotal_amount', { mode: 'number' }).notNull().default(0),
  discount_amount: bigint('discount_amount', { mode: 'number' }).notNull().default(0),
  promotion_code: varchar('promotion_code', { length: 50 }),
  promotion_id: int('promotion_id'),
  final_amount: bigint('final_amount', { mode: 'number' }).notNull().default(0),
  paid_amount: bigint('paid_amount', { mode: 'number' }).notNull().default(0),
  debt_amount: bigint('debt_amount', { mode: 'number' }).notNull().default(0),
  payment_method: varchar('payment_method', { length: 40 }).notNull().default('Cash'),
  payment_status: varchar('payment_status', { length: 40 }).notNull().default('Paid'),
  order_status: varchar('order_status', { length: 40 }).default('Completed'),
  refund_amount: bigint('refund_amount', { mode: 'number' }),
  refund_reason: text('refund_reason'),
  refunded_at: varchar('refunded_at', { length: 50 }),
  refunded_by_name: varchar('refunded_by_name', { length: 120 }),
  return_to_stock: int('return_to_stock'),
  transaction_ref: varchar('transaction_ref', { length: 100 }),
  notes: text('notes'),
  warranty_months: int('warranty_months').notNull().default(6),
  return_days: int('return_days').default(15),
  created_at: varchar('created_at', { length: 50 }).notNull(),
});

export const retailSaleOrderItems = mysqlTable('retail_sale_order_items', {
  id: int('id').autoincrement().primaryKey().notNull(),
  order_id: int('order_id')
    .notNull()
    .references(() => retailSaleOrders.id, { onDelete: 'cascade' }),
  item_type: varchar('item_type', { length: 30 }).notNull().default('part'),
  part_id: int('part_id'),
  batch_id: int('batch_id'),
  batch_code: varchar('batch_code', { length: 60 }),
  product_name: varchar('product_name', { length: 255 }).notNull(),
  sku: varchar('sku', { length: 80 }),
  serial_number: varchar('serial_number', { length: 100 }),
  quantity: int('quantity').notNull().default(1),
  cost_price: bigint('cost_price', { mode: 'number' }).notNull().default(0),
  unit_price: bigint('unit_price', { mode: 'number' }).notNull().default(0),
  subtotal: bigint('subtotal', { mode: 'number' }).notNull().default(0),
  warranty_months: int('warranty_months').notNull().default(6),
  return_days: int('return_days').default(15),
});

export const auditLogs = mysqlTable('audit_logs', {
  id: int('id').autoincrement().primaryKey().notNull(),
  user_id: int('user_id'),
  user_name: varchar('user_name', { length: 120 }).notNull(),
  action: varchar('action', { length: 100 }).notNull(),
  entity_type: varchar('entity_type', { length: 100 }).notNull(),
  entity_id: varchar('entity_id', { length: 100 }).notNull(),
  details: text('details').notNull(),
  ip_address: varchar('ip_address', { length: 60 }),
  created_at: varchar('created_at', { length: 50 }).notNull(),
});

