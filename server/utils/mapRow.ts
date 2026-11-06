import {
  User,
  StoreSettings,
  Customer,
  DeviceCategory,
  DeviceBrand,
  CustomerDevice,
  Supplier,
  Part,
  InventoryBatch,
  Promotion,
  RepairTicket,
  RepairStatusHistory,
  RepairDiagnostic,
  RepairQuote,
  RepairQuoteItem,
  QCChecklist,
  RepairPartUsage,
  Payment,
  Warranty,
  RetailSaleOrder,
  RetailSaleOrderItem,
  AuditLog,
} from '../../shared/types';
import { DEFAULT_STORE_SETTINGS } from '../../shared/constants';

/**
 * Strips password_hash and sensitive fields before returning User to client (P0-1, P0-2)
 */
export function toPublicUser(row: any): User {
  return {
    id: Number(row.id),
    username: row.username,
    email: row.email,
    full_name: row.full_name,
    phone: row.phone || '',
    role: row.role,
    is_active: Boolean(row.is_active),
    must_change_password: Boolean(row.must_change_password),
    avatar_url: row.avatar_url || undefined,
    created_at: row.created_at,
    last_login_at: row.last_login_at || undefined,
  };
}

/**
 * Strips gateway_api_key and gateway_webhook_secret before returning Settings to client (P0-1)
 */
export function toPublicSettings(row: any): StoreSettings {
  if (!row) return DEFAULT_STORE_SETTINGS;
  return {
    store_name: row.store_name,
    store_slogan: row.store_slogan || '',
    phone: row.phone,
    email: row.email || '',
    address: row.address,
    tax_number: row.tax_number || '',
    bank_name: row.bank_name || '',
    bank_account_no: row.bank_account_no || '',
    bank_account_name: row.bank_account_name || '',
    ticket_prefix: row.ticket_prefix || 'SC',
    default_warranty_days: Number(row.default_warranty_days || 90),
    default_return_days: Number(row.default_return_days ?? 15),
    terms_intake: row.terms_intake || '',
    terms_warranty: row.terms_warranty || '',
    auto_payment_enabled: Boolean(row.auto_payment_enabled),
    payment_gateway_provider: row.payment_gateway_provider || 'sepay',
    pos_terminal_id: row.pos_terminal_id || '',
    pos_ip_address: row.pos_ip_address || '',
  };
}

/**
 * Strips device_password_hint from ticket responses and only exposes boolean flag has_device_password (P0-3)
 */
export function toPublicTicket(row: any): RepairTicket {
  return {
    id: Number(row.id),
    ticket_code: row.ticket_code,
    customer_id: Number(row.customer_id),
    customer_name: row.customer_name,
    customer_phone: row.customer_phone,
    customer_address: row.customer_address || undefined,
    device_id: Number(row.device_id),
    device_model: row.device_model,
    device_category: row.device_category,
    device_brand: row.device_brand,
    device_serial: row.device_serial || undefined,
    device_color: row.device_color || undefined,
    created_by_id: Number(row.created_by_id),
    created_by_name: row.created_by_name,
    primary_technician_id: row.primary_technician_id ? Number(row.primary_technician_id) : undefined,
    primary_technician_name: row.primary_technician_name || undefined,
    status: row.status,
    priority: row.priority,
    defect_description: row.defect_description,
    initial_condition: row.initial_condition || undefined,
    cosmetic_condition: row.cosmetic_condition || undefined,
    accessories_included: row.accessories_included || undefined,
    has_device_password: Boolean(row.device_password_hint),
    estimated_completion: row.estimated_completion || undefined,
    subtotal_amount: Number(row.subtotal_amount || 0),
    discount_amount: Number(row.discount_amount || 0),
    promotion_code: row.promotion_code || undefined,
    promotion_id: row.promotion_id ? Number(row.promotion_id) : undefined,
    final_amount: Number(row.final_amount || 0),
    paid_amount: Number(row.paid_amount || 0),
    debt_amount: Number(row.debt_amount || 0),
    is_warranty_claim: Boolean(row.is_warranty_claim),
    parent_ticket_id: row.parent_ticket_id ? Number(row.parent_ticket_id) : undefined,
    cancellation_reason: row.cancellation_reason || undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function mapCustomerRow(row: any): Customer {
  return {
    id: Number(row.id),
    code: row.code,
    name: row.name,
    phone: row.phone,
    email: row.email || undefined,
    address: row.address || undefined,
    customer_type: row.customer_type || 'individual',
    tax_number: row.tax_number || undefined,
    current_debt: Number(row.current_debt || 0),
    notes: row.notes || undefined,
    created_at: row.created_at,
  };
}

export function mapCategoryRow(row: any): DeviceCategory {
  return {
    id: Number(row.id),
    code: row.code,
    name: row.name,
    icon: row.icon || undefined,
    is_active: Boolean(row.is_active),
  };
}

export function mapBrandRow(row: any): DeviceBrand {
  return {
    id: Number(row.id),
    name: row.name,
    is_active: Boolean(row.is_active),
  };
}

export function mapDeviceRow(row: any): CustomerDevice {
  return {
    id: Number(row.id),
    customer_id: Number(row.customer_id),
    customer_name: row.customer_name || undefined,
    customer_phone: row.customer_phone || undefined,
    category_id: Number(row.category_id),
    category_name: row.category_name || undefined,
    brand_id: Number(row.brand_id),
    brand_name: row.brand_name || undefined,
    model_name: row.model_name,
    serial_number: row.serial_number || undefined,
    imei: row.imei || undefined,
    color: row.color || undefined,
    notes: row.notes || undefined,
    created_at: row.created_at,
  };
}

export function mapSupplierRow(row: any): Supplier {
  return {
    id: Number(row.id),
    code: row.code,
    name: row.name,
    phone: row.phone,
    email: row.email || undefined,
    address: row.address || undefined,
    is_active: Boolean(row.is_active),
  };
}

export function mapPartRow(row: any): Part {
  return {
    id: Number(row.id),
    sku: row.sku,
    name: row.name,
    category_id: Number(row.category_id || 1),
    category_name: row.category_name,
    supplier_id: row.supplier_id ? Number(row.supplier_id) : undefined,
    supplier_name: row.supplier_name || undefined,
    compatible_models: row.compatible_models || undefined,
    cost_price: Number(row.cost_price || 0),
    selling_price: Number(row.selling_price || 0),
    stock_quantity: Number(row.stock_quantity || 0),
    min_stock_alert: Number(row.min_stock_alert || 0),
    location: row.location || undefined,
    created_at: row.created_at,
  };
}

export function mapBatchRow(row: any): InventoryBatch {
  return {
    id: Number(row.id),
    batch_code: row.batch_code,
    part_id: Number(row.part_id),
    part_name: row.part_name,
    sku: row.sku,
    supplier_id: row.supplier_id ? Number(row.supplier_id) : undefined,
    supplier_name: row.supplier_name || undefined,
    import_quantity: Number(row.import_quantity || 0),
    remaining_quantity: Number(row.remaining_quantity || 0),
    cost_price: Number(row.cost_price || 0),
    selling_price: Number(row.selling_price || 0),
    import_date: row.import_date,
    expiry_date: row.expiry_date || undefined,
    created_by_name: row.created_by_name,
    notes: row.notes || undefined,
    created_at: row.created_at,
  };
}

export function mapPromotionRow(row: any): Promotion {
  return {
    id: Number(row.id),
    code: row.code,
    name: row.name,
    description: row.description || undefined,
    discount_type: row.discount_type,
    discount_value: Number(row.discount_value || 0),
    max_discount_amount: row.max_discount_amount ? Number(row.max_discount_amount) : undefined,
    min_order_amount: row.min_order_amount ? Number(row.min_order_amount) : undefined,
    applicable_to: row.applicable_to || 'all',
    start_date: row.start_date || undefined,
    end_date: row.end_date || undefined,
    usage_limit: row.usage_limit ? Number(row.usage_limit) : undefined,
    usage_count: Number(row.usage_count || 0),
    is_active: Boolean(row.is_active),
    created_at: row.created_at,
  };
}

export function mapHistoryRow(row: any): RepairStatusHistory {
  return {
    id: Number(row.id),
    ticket_id: Number(row.ticket_id),
    from_status: row.from_status || undefined,
    to_status: row.to_status,
    changed_by_name: row.changed_by_name,
    notes: row.notes || undefined,
    created_at: row.created_at,
  };
}

export function mapDiagnosticRow(row: any): RepairDiagnostic {
  return {
    id: Number(row.id),
    ticket_id: Number(row.ticket_id),
    technician_id: Number(row.technician_id),
    technician_name: row.technician_name,
    root_cause: row.root_cause,
    proposed_solution: row.proposed_solution,
    estimated_cost: Number(row.estimated_cost || 0),
    estimated_hours:
      row.estimated_hours !== null && row.estimated_hours !== undefined ? Number(row.estimated_hours) : undefined,
    notes: row.notes || undefined,
    created_at: row.created_at,
  };
}

export function mapQuoteItemRow(row: any): RepairQuoteItem {
  return {
    id: Number(row.id),
    quote_id: Number(row.quote_id),
    item_type: row.item_type,
    part_id: row.part_id ? Number(row.part_id) : undefined,
    batch_id: row.batch_id ? Number(row.batch_id) : undefined,
    batch_code: row.batch_code || undefined,
    name: row.name,
    quantity: Number(row.quantity || 1),
    unit_price: Number(row.unit_price || 0),
    labor_fee: Number(row.labor_fee || 0),
    subtotal: Number(row.subtotal || 0),
    warranty_months: Number(row.warranty_months || 0),
  };
}

export function mapQuoteRow(row: any, items: RepairQuoteItem[]): RepairQuote {
  return {
    id: Number(row.id),
    ticket_id: Number(row.ticket_id),
    quote_code: row.quote_code,
    version: Number(row.version || 1),
    subtotal: Number(row.subtotal || 0),
    discount: Number(row.discount || 0),
    promotion_code: row.promotion_code || undefined,
    promotion_id: row.promotion_id ? Number(row.promotion_id) : undefined,
    total_amount: Number(row.total_amount || 0),
    status: row.status,
    rejection_reason: row.rejection_reason || undefined,
    confirmed_by: row.confirmed_by || undefined,
    confirmed_at: row.confirmed_at || undefined,
    created_by_name: row.created_by_name,
    created_at: row.created_at,
    items,
  };
}

export function mapChecklistRow(row: any): QCChecklist {
  let items = [];
  try {
    items = typeof row.items_json === 'string' ? JSON.parse(row.items_json) : row.items_json || [];
  } catch {}
  return {
    id: Number(row.id),
    ticket_id: Number(row.ticket_id),
    checked_by_name: row.checked_by_name,
    is_passed: Boolean(row.is_passed),
    notes: row.notes || undefined,
    created_at: row.created_at,
    items,
  };
}

export function mapPartUsageRow(row: any): RepairPartUsage {
  return {
    id: Number(row.id),
    ticket_id: Number(row.ticket_id),
    part_id: Number(row.part_id),
    batch_id: row.batch_id ? Number(row.batch_id) : undefined,
    batch_code: row.batch_code || undefined,
    part_name: row.part_name,
    sku: row.sku,
    quantity: Number(row.quantity || 1),
    cost_price: Number(row.cost_price || 0),
    selling_price: Number(row.selling_price || 0),
    status: row.status,
    technician_name: row.technician_name,
    created_at: row.created_at,
  };
}

export function mapPaymentRow(row: any): Payment {
  return {
    id: Number(row.id),
    payment_code: row.payment_code,
    ticket_id: Number(row.ticket_id),
    ticket_code: row.ticket_code,
    customer_name: row.customer_name,
    amount: Number(row.amount || 0),
    payment_method: row.payment_method,
    payment_type: row.payment_type,
    transaction_ref: row.transaction_ref || undefined,
    cashier_name: row.cashier_name,
    notes: row.notes || undefined,
    is_auto_verified: Boolean(row.is_auto_verified),
    gateway_provider: row.gateway_provider || undefined,
    card_brand: row.card_brand || undefined,
    created_at: row.created_at,
  };
}

export function mapWarrantyRow(row: any): Warranty {
  return {
    id: Number(row.id),
    warranty_code: row.warranty_code,
    ticket_id: Number(row.ticket_id),
    ticket_code: row.ticket_code,
    device_summary: row.device_summary,
    customer_name: row.customer_name,
    customer_phone: row.customer_phone,
    start_date: row.start_date,
    end_date: row.end_date,
    terms: row.terms || undefined,
    status: row.status,
    created_at: row.created_at,
  };
}

export function mapRetailOrderItemRow(row: any): RetailSaleOrderItem {
  return {
    id: Number(row.id),
    item_type: row.item_type || 'part',
    part_id: row.part_id ? Number(row.part_id) : undefined,
    batch_id: row.batch_id ? Number(row.batch_id) : undefined,
    batch_code: row.batch_code || undefined,
    product_name: row.product_name,
    sku: row.sku || undefined,
    serial_number: row.serial_number || undefined,
    quantity: Number(row.quantity || 1),
    cost_price: Number(row.cost_price || 0),
    unit_price: Number(row.unit_price || 0),
    subtotal: Number(row.subtotal || 0),
    warranty_months: Number(row.warranty_months || 0),
    return_days: row.return_days !== null && row.return_days !== undefined ? Number(row.return_days) : 15,
  };
}

export function mapRetailOrderRow(row: any, items: RetailSaleOrderItem[]): RetailSaleOrder {
  return {
    id: Number(row.id),
    order_code: row.order_code,
    customer_id: Number(row.customer_id),
    customer_name: row.customer_name,
    customer_phone: row.customer_phone,
    customer_address: row.customer_address || undefined,
    created_by_id: Number(row.created_by_id),
    created_by_name: row.created_by_name,
    subtotal_amount: Number(row.subtotal_amount || 0),
    discount_amount: Number(row.discount_amount || 0),
    promotion_code: row.promotion_code || undefined,
    promotion_id: row.promotion_id ? Number(row.promotion_id) : undefined,
    final_amount: Number(row.final_amount || 0),
    paid_amount: Number(row.paid_amount || 0),
    debt_amount: Number(row.debt_amount || 0),
    payment_method: row.payment_method,
    payment_status: row.payment_status,
    order_status: row.order_status || 'Completed',
    refund_amount: row.refund_amount !== null && row.refund_amount !== undefined ? Number(row.refund_amount) : undefined,
    refund_reason: row.refund_reason || undefined,
    refunded_at: row.refunded_at || undefined,
    refunded_by_name: row.refunded_by_name || undefined,
    return_to_stock:
      row.return_to_stock !== null && row.return_to_stock !== undefined ? Boolean(row.return_to_stock) : undefined,
    transaction_ref: row.transaction_ref || undefined,
    notes: row.notes || undefined,
    warranty_months: Number(row.warranty_months || 0),
    return_days: row.return_days !== null && row.return_days !== undefined ? Number(row.return_days) : 15,
    created_at: row.created_at,
    items,
  };
}

export function mapAuditLogRow(row: any): AuditLog {
  return {
    id: Number(row.id),
    user_id: row.user_id ? Number(row.user_id) : undefined,
    user_name: row.user_name,
    action: row.action,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    details: row.details,
    ip_address: row.ip_address || undefined,
    created_at: row.created_at,
  };
}

