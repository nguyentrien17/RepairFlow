export type UserRole = 'admin' | 'manager' | 'receptionist' | 'technician';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone: string;
  role: UserRole;
  is_active: boolean;
  avatar_url?: string;
  created_at: string;
  last_login_at?: string;
  password?: string;
}

export interface Customer {
  id: number;
  code: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  customer_type: 'individual' | 'company';
  tax_number?: string;
  current_debt: number;
  notes?: string;
  created_at: string;
}

export interface DeviceCategory {
  id: number;
  code: string;
  name: string;
  icon?: string;
  is_active: boolean;
}

export interface DeviceBrand {
  id: number;
  name: string;
  is_active: boolean;
}

export interface CustomerDevice {
  id: number;
  customer_id: number;
  customer_name?: string;
  customer_phone?: string;
  category_id: number;
  category_name?: string;
  brand_id: number;
  brand_name?: string;
  model_name: string;
  serial_number?: string;
  imei?: string;
  color?: string;
  notes?: string;
  created_at: string;
}

export type RepairStatus =
  | 'Received'
  | 'Diagnosing'
  | 'Waiting_Approval'
  | 'Waiting_Parts'
  | 'In_Progress'
  | 'Quality_Check'
  | 'Completed'
  | 'Ready_For_Pickup'
  | 'Delivered'
  | 'Warranty'
  | 'Cancelled';

export type RepairPriority = 'Low' | 'Normal' | 'High' | 'Urgent';

export interface RepairTicket {
  id: number;
  ticket_code: string;
  customer_id: number;
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  device_id: number;
  device_model: string;
  device_category: string;
  device_brand: string;
  device_serial?: string;
  device_color?: string;
  created_by_id: number;
  created_by_name: string;
  primary_technician_id?: number;
  primary_technician_name?: string;
  status: RepairStatus;
  priority: RepairPriority;
  defect_description: string;
  initial_condition?: string;
  cosmetic_condition?: string;
  accessories_included?: string;
  device_password_hint?: string;
  estimated_completion?: string;
  subtotal_amount: number;
  discount_amount: number;
  promotion_code?: string;
  promotion_id?: number;
  final_amount: number;
  paid_amount: number;
  debt_amount: number;
  is_warranty_claim: boolean;
  parent_ticket_id?: number;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface RepairStatusHistory {
  id: number;
  ticket_id: number;
  from_status?: RepairStatus;
  to_status: RepairStatus;
  changed_by_name: string;
  notes?: string;
  created_at: string;
}

export interface RepairDiagnostic {
  id: number;
  ticket_id: number;
  technician_id: number;
  technician_name: string;
  root_cause: string;
  proposed_solution: string;
  estimated_cost: number;
  estimated_hours?: number;
  notes?: string;
  created_at: string;
}

export type QuoteStatus = 'Draft' | 'Sent' | 'Approved' | 'Rejected' | 'Expired';

export interface RepairQuoteItem {
  id: number;
  quote_id: number;
  item_type: 'labor' | 'part';
  part_id?: number;
  batch_id?: number;
  batch_code?: string;
  name: string;
  quantity: number;
  unit_price: number;
  labor_fee: number;
  subtotal: number;
  warranty_months: number;
}

export interface RepairQuote {
  id: number;
  ticket_id: number;
  quote_code: string;
  version: number;
  subtotal: number;
  discount: number;
  promotion_code?: string;
  promotion_id?: number;
  total_amount: number;
  status: QuoteStatus;
  rejection_reason?: string;
  confirmed_by?: string;
  confirmed_at?: string;
  created_by_name: string;
  created_at: string;
  items: RepairQuoteItem[];
}

export type DiscountType = 'percentage' | 'fixed';

export interface Promotion {
  id: number;
  code: string;
  name: string;
  description?: string;
  discount_type: DiscountType;
  discount_value: number; // e.g., 10 for 10% or 50000 for 50.000 VND
  max_discount_amount?: number; // Maximum discount cap in VND
  min_order_amount?: number; // Minimum subtotal in VND required to use this promotion
  applicable_to?: 'all' | 'labor' | 'part'; // All items, labor only, or parts only
  start_date?: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  usage_limit?: number; // Maximum usages allowed (optional)
  usage_count: number; // Current number of usages
  is_active: boolean;
  created_at: string;
}

export interface QCItem {
  id: number;
  item_name: string;
  status: 'Pass' | 'Fail' | 'NA';
  note?: string;
}

export interface QCChecklist {
  id: number;
  ticket_id: number;
  checked_by_name: string;
  is_passed: boolean;
  notes?: string;
  created_at: string;
  items: QCItem[];
}

export interface Part {
  id: number;
  sku: string;
  name: string;
  category_id: number;
  category_name: string;
  supplier_id?: number;
  supplier_name?: string;
  compatible_models?: string;
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  min_stock_alert: number;
  location?: string;
  created_at: string;
}

export interface PartCategory {
  id: number;
  name: string;
}

export interface Supplier {
  id: number;
  code: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  is_active: boolean;
}

export interface InventoryBatch {
  id: number;
  batch_code: string;
  part_id: number;
  part_name: string;
  sku: string;
  supplier_id?: number;
  supplier_name?: string;
  import_quantity: number;
  remaining_quantity: number;
  cost_price: number;
  selling_price: number;
  import_date: string;
  expiry_date?: string;
  created_by_name: string;
  notes?: string;
  created_at: string;
}

export interface InventoryTransactionItem {
  part_id: number;
  part_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface InventoryTransaction {
  id: number;
  transaction_code: string;
  type: 'Receipt' | 'Issue' | 'Return';
  supplier_name?: string;
  ticket_code?: string;
  created_by_name: string;
  total_value: number;
  notes?: string;
  created_at: string;
  items: InventoryTransactionItem[];
}

export interface RepairPartUsage {
  id: number;
  ticket_id: number;
  part_id: number;
  batch_id?: number;
  batch_code?: string;
  part_name: string;
  sku: string;
  quantity: number;
  cost_price: number;
  selling_price: number;
  status: 'Used' | 'Returned';
  technician_name: string;
  created_at: string;
}

export type PaymentMethod = 'Cash' | 'Bank_Transfer' | 'POS_Card';
export type PaymentType = 'Deposit' | 'Installment' | 'Final';

export interface Payment {
  id: number;
  payment_code: string;
  ticket_id: number;
  ticket_code: string;
  customer_name: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_type: PaymentType;
  transaction_ref?: string;
  cashier_name: string;
  notes?: string;
  is_auto_verified?: boolean;
  gateway_provider?: string;
  card_brand?: string;
  created_at: string;
}

export interface DeliveryRecord {
  id: number;
  ticket_id: number;
  ticket_code: string;
  receiver_name: string;
  receiver_phone: string;
  delivered_by_name: string;
  accessories_returned: string;
  customer_feedback?: string;
  signature_confirmed: boolean;
  delivered_at: string;
}

export interface Warranty {
  id: number;
  warranty_code: string;
  ticket_id: number;
  ticket_code: string;
  device_summary: string;
  customer_name: string;
  customer_phone: string;
  start_date: string;
  end_date: string;
  terms?: string;
  status: 'Active' | 'Expired' | 'Voided';
  created_at: string;
}

export interface StoreSettings {
  store_name: string;
  store_slogan: string;
  phone: string;
  email: string;
  address: string;
  tax_number: string;
  bank_name: string;
  bank_account_no: string;
  bank_account_name: string;
  ticket_prefix: string;
  default_warranty_days: number;
  default_return_days?: number;
  terms_intake: string;
  terms_warranty: string;
  // Automated Payment & POS Settings
  auto_payment_enabled?: boolean;
  payment_gateway_provider?: 'sepay' | 'payos' | 'casso' | 'vnpay_pos' | 'direct_bank';
  gateway_api_key?: string;
  gateway_webhook_secret?: string;
  pos_terminal_id?: string;
  pos_ip_address?: string;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
  ip_address?: string;
  created_at: string;
}

export interface RetailSaleOrderItem {
  id: number;
  item_type: 'part' | 'device' | 'accessory';
  part_id?: number;
  batch_id?: number;
  batch_code?: string;
  product_name: string;
  sku?: string;
  serial_number?: string;
  quantity: number;
  cost_price: number;
  unit_price: number;
  subtotal: number;
  warranty_months: number;
  return_days?: number;
}

export interface RetailSaleOrder {
  id: number;
  order_code: string;
  customer_id: number;
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  created_by_id: number;
  created_by_name: string;
  subtotal_amount: number;
  discount_amount: number;
  promotion_code?: string;
  promotion_id?: number;
  final_amount: number;
  paid_amount: number;
  debt_amount: number;
  payment_method: PaymentMethod;
  payment_status: 'Paid' | 'Partial' | 'Unpaid' | 'Refunded' | 'Partially_Refunded';
  order_status?: 'Completed' | 'Refunded' | 'Partially_Refunded';
  refund_amount?: number;
  refund_reason?: string;
  refunded_at?: string;
  refunded_by_name?: string;
  return_to_stock?: boolean;
  transaction_ref?: string;
  notes?: string;
  warranty_months: number;
  return_days?: number;
  created_at: string;
  items: RetailSaleOrderItem[];
}
