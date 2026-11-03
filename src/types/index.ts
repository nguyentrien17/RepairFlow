export type UserRole = 'admin' | 'manager' | 'receptionist' | 'technician' | 'cashier';

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
  total_amount: number;
  status: QuoteStatus;
  rejection_reason?: string;
  confirmed_by?: string;
  confirmed_at?: string;
  created_by_name: string;
  created_at: string;
  items: RepairQuoteItem[];
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
  terms_intake: string;
  terms_warranty: string;
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
