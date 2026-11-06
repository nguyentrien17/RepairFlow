import {
  User,
  Customer,
  DeviceCategory,
  DeviceBrand,
  CustomerDevice,
  RepairTicket,
  RepairStatusHistory,
  RepairDiagnostic,
  RepairQuote,
  QCChecklist,
  Part,
  Supplier,
  InventoryTransaction,
  RepairPartUsage,
  Payment,
  PaymentMethod,
  DeliveryRecord,
  Warranty,
  StoreSettings,
  AuditLog,
  RepairStatus,
  Promotion,
  InventoryBatch,
  RetailSaleOrder,
  RetailSaleOrderItem,
} from '../types';
import { ApiClient } from './apiClient';

const STORAGE_KEY_PREFIX = 'repairflow_';

export const INITIAL_USERS: User[] = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@repairflow.vn',
    full_name: 'Nguyễn Triển (Admin)',
    phone: '0901234567',
    role: 'admin',
    is_active: true,
    created_at: '2026-01-01T08:00:00Z',
    last_login_at: '2026-11-03T07:30:00Z',
  },
  {
    id: 2,
    username: 'manager',
    email: 'manager@repairflow.vn',
    full_name: 'Nguyễn Văn Quản (Quản lý)',
    phone: '0912345678',
    role: 'manager',
    is_active: true,
    created_at: '2026-01-05T08:00:00Z',
  },
  {
    id: 3,
    username: 'letan',
    email: 'letan@repairflow.vn',
    full_name: 'Trần Thị Thu Hà (Lễ tân & Thu ngân)',
    phone: '0923456789',
    role: 'receptionist',
    is_active: true,
    created_at: '2026-01-10T08:00:00Z',
  },
  {
    id: 4,
    username: 'kythuat',
    email: 'kythuat@repairflow.vn',
    full_name: 'Lê Hoàng Nam (Kỹ thuật viên Trưởng)',
    phone: '0934567890',
    role: 'technician',
    is_active: true,
    created_at: '2026-01-15T08:00:00Z',
  },
  {
    id: 5,
    username: 'thungan',
    email: 'letan2@repairflow.vn',
    full_name: 'Phạm Minh Anh (Lễ tân & Thu ngân 2)',
    phone: '0945678901',
    role: 'receptionist',
    is_active: true,
    created_at: '2026-02-01T08:00:00Z',
  },
];

export const INITIAL_SETTINGS: StoreSettings = {
  store_name: 'TRUNG TÂM SỬA CHỮA ĐIỆN TỬ REPAIRFLOW',
  store_slogan: 'Uy tín tạo niềm tin — Bắt đúng bệnh, sửa chuẩn giá',
  phone: '028.3888.9999 - 0901.234.567',
  email: 'hotro@repairflow.vn',
  address: 'Số 123 Đường Cách Mạng Tháng Tám, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
  tax_number: '0312345678',
  bank_name: 'Ngân hàng Quân Đội (MB Bank)',
  bank_account_no: '88880901234567',
  bank_account_name: 'CTY TNHH CONG NGHE REPAIRFLOW',
  ticket_prefix: 'SC',
  default_warranty_days: 90,
  default_return_days: 15,
  terms_intake:
    '1. Quý khách vui lòng sao lưu dữ liệu cá nhân trước khi bàn giao. Cửa hàng không chịu trách nhiệm về dữ liệu phần mềm.\n2. Thiết bị sau khi thông báo hoàn tất, quý khách vui lòng đến nhận trong vòng 30 ngày.\n3. Vui lòng giữ phiếu tiếp nhận để đối chiếu khi nhận máy.',
  terms_warranty:
    '1. Bảo hành miễn phí các lỗi kỹ thuật và linh kiện đã thay thế trong thời hạn cam kết.\n2. Không bảo hành các trường hợp: Rơi vỡ, nứt cấn, ngấm nước, chập cháy do nguồn điện không ổn định hoặc tự ý tháo dỡ tem niêm phong.',
  auto_payment_enabled: true,
  payment_gateway_provider: 'sepay',
  pos_terminal_id: 'VNPAY_POS_Q1_01',
  pos_ip_address: '192.168.1.188:8080',
};

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 1,
    code: 'KH-000101',
    name: 'Công ty Cổ phần Công nghệ VinaTech',
    phone: '0987654321',
    email: 'it@vinatech.com.vn',
    address: 'Tầng 8, Tòa nhà Vincom, 72 Lê Thánh Tôn, Q.1, TP.HCM',
    customer_type: 'company',
    tax_number: '0309988776',
    current_debt: 2500000,
    notes: 'Khách hàng doanh nghiệp, công nợ thanh toán cuối tháng',
    created_at: '2026-01-10T09:00:00Z',
  },
  {
    id: 2,
    code: 'KH-000102',
    name: 'Anh Hoàng Tuấn Minh',
    phone: '0918234567',
    email: 'tuanminh.hoang@gmail.com',
    address: '45/12 Nguyễn Thị Minh Khai, P. Đa Kao, Q.1, TP.HCM',
    customer_type: 'individual',
    current_debt: 0,
    notes: 'Khách quen giới thiệu',
    created_at: '2026-02-14T10:15:00Z',
  },
  {
    id: 3,
    code: 'KH-000103',
    name: 'Chị Mai Ngọc Lan',
    phone: '0938112233',
    email: 'lan.maingoc@outlook.com',
    address: '128 Điện Biên Phủ, P.15, Q. Bình Thạnh, TP.HCM',
    customer_type: 'individual',
    current_debt: 0,
    notes: 'Cần xử lý gấp thiết bị phục vụ công việc',
    created_at: '2026-03-01T14:30:00Z',
  },
];

export const INITIAL_CATEGORIES: DeviceCategory[] = [
  { id: 1, code: 'laptop', name: 'Laptop', is_active: true },
  { id: 2, code: 'pc', name: 'Máy tính để bàn (PC)', is_active: true },
  { id: 3, code: 'phone', name: 'Điện thoại di động', is_active: true },
  { id: 4, code: 'tablet', name: 'Máy tính bảng', is_active: true },
  { id: 5, code: 'printer', name: 'Máy in / Scan', is_active: true },
  { id: 6, code: 'monitor', name: 'Màn hình máy tính', is_active: true },
  { id: 7, code: 'other', name: 'Thiết bị điện tử khác', is_active: true },
];

export const INITIAL_BRANDS: DeviceBrand[] = [
  { id: 1, name: 'Apple', is_active: true },
  { id: 2, name: 'Dell', is_active: true },
  { id: 3, name: 'Asus', is_active: true },
  { id: 4, name: 'HP', is_active: true },
  { id: 5, name: 'Lenovo', is_active: true },
  { id: 6, name: 'Samsung', is_active: true },
  { id: 7, name: 'Canon', is_active: true },
  { id: 8, name: 'LG', is_active: true },
];

export const INITIAL_DEVICES: CustomerDevice[] = [
  {
    id: 1,
    customer_id: 1,
    customer_name: 'Công ty Cổ phần Công nghệ VinaTech',
    customer_phone: '0987654321',
    category_id: 1,
    category_name: 'Laptop',
    brand_id: 2,
    brand_name: 'Dell',
    model_name: 'Dell XPS 15 9500 (i7-10750H / 16GB / 512GB)',
    serial_number: 'CN0XPS15-9500-VT01',
    color: 'Bạc kim loại (Silver)',
    notes: 'Máy công ty cấp nhân sự, có dán tem tài sản',
    created_at: '2026-01-10T09:15:00Z',
  },
  {
    id: 2,
    customer_id: 2,
    customer_name: 'Anh Hoàng Tuấn Minh',
    customer_phone: '0918234567',
    category_id: 3,
    category_name: 'Điện thoại di động',
    brand_id: 1,
    brand_name: 'Apple',
    model_name: 'iPhone 14 Pro Max 256GB',
    imei: '356789123456789',
    serial_number: 'DNQX1234M1N9',
    color: 'Tím đậm (Deep Purple)',
    notes: 'Có dán cường lực mặt trước',
    created_at: '2026-02-14T10:20:00Z',
  },
  {
    id: 3,
    customer_id: 3,
    customer_name: 'Chị Mai Ngọc Lan',
    customer_phone: '0938112233',
    category_id: 1,
    category_name: 'Laptop',
    brand_id: 1,
    brand_name: 'Apple',
    model_name: 'MacBook Pro 14 inch 2021 (Chip M1 Pro)',
    serial_number: 'C02G1234MD6R',
    color: 'Xám không gian (Space Gray)',
    notes: 'Mặt đáy trầy xước nhẹ ở góc trái',
    created_at: '2026-03-01T14:35:00Z',
  },
];

export const INITIAL_PARTS: Part[] = [
  {
    id: 1,
    sku: 'LK-PIN-IP14PM',
    name: 'Pin chuẩn dung lượng cao iPhone 14 Pro Max (4323mAh)',
    category_id: 1,
    category_name: 'Pin thiết bị',
    supplier_id: 2,
    supplier_name: 'Tổng Kho Phụ Kiện & Màn Hình Apple Việt Mỹ',
    compatible_models: 'Apple iPhone 14 Pro Max (A2894, A2651)',
    cost_price: 650000,
    selling_price: 1150000,
    stock_quantity: 8,
    min_stock_alert: 3,
    location: 'Kệ A2 - Ngăn 04',
    created_at: '2026-01-10T08:00:00Z',
  },
  {
    id: 2,
    sku: 'LK-MH-DELL-XPS15',
    name: 'Màn hình IPS 15.6 inch FHD+ (1920x1200) Dell XPS 9500 / 9510',
    category_id: 2,
    category_name: 'Màn hình hiển thị',
    supplier_id: 1,
    supplier_name: 'Công ty TNHH Phân Phối Linh Kiện Công Nghệ Sài Gòn',
    compatible_models: 'Dell XPS 15 9500, XPS 9510, Precision 5550',
    cost_price: 2400000,
    selling_price: 3600000,
    stock_quantity: 2,
    min_stock_alert: 2,
    location: 'Kệ B1 - Hộp chống sốc',
    created_at: '2026-01-12T08:00:00Z',
  },
  {
    id: 3,
    sku: 'LK-SSD-NVME-1TB',
    name: 'Ổ cứng SSD Samsung 980 1TB NVMe PCIe Gen 3x4',
    category_id: 3,
    category_name: 'Ổ cứng & Lưu trữ',
    supplier_id: 1,
    supplier_name: 'Công ty TNHH Phân Phối Linh Kiện Công Nghệ Sài Gòn',
    compatible_models: 'Hỗ trợ tất cả Laptop & PC có khe M.2 NVMe',
    cost_price: 1550000,
    selling_price: 2200000,
    stock_quantity: 12,
    min_stock_alert: 4,
    location: 'Kệ C3 - Ngăn 01',
    created_at: '2026-01-15T08:00:00Z',
  },
  {
    id: 4,
    sku: 'LK-RAM-DDR4-16GB',
    name: 'RAM Laptop Kingston 16GB DDR4 3200MHz',
    category_id: 4,
    category_name: 'Bộ nhớ RAM',
    supplier_id: 1,
    supplier_name: 'Công ty TNHH Phân Phối Linh Kiện Công Nghệ Sài Gòn',
    compatible_models: 'Laptop DDR4 SODIMM',
    cost_price: 720000,
    selling_price: 1100000,
    stock_quantity: 15,
    min_stock_alert: 5,
    location: 'Kệ C3 - Ngăn 02',
    created_at: '2026-01-15T08:00:00Z',
  },
  {
    id: 5,
    sku: 'LK-KEO-MX4-4G',
    name: 'Keo tản nhiệt gốm cao cấp Arctic MX-4 (Tuýp 4g)',
    category_id: 5,
    category_name: 'Vật tư bảo dưỡng',
    supplier_id: 1,
    supplier_name: 'Công ty TNHH Phân Phối Linh Kiện Công Nghệ Sài Gòn',
    compatible_models: 'CPU / GPU mọi thiết bị',
    cost_price: 90000,
    selling_price: 180000,
    stock_quantity: 25,
    min_stock_alert: 5,
    location: 'Bàn kỹ thuật số 1',
    created_at: '2026-01-20T08:00:00Z',
  },
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 1,
    code: 'NCC-001',
    name: 'Công ty TNHH Phân Phối Linh Kiện Công Nghệ Sài Gòn',
    phone: '028.3999.7777',
    email: 'kinhdoanh@saigonparts.vn',
    address: '158 Bùi Thị Xuân, P. Phạm Ngũ Lão, Q.1, TP.HCM',
    is_active: true,
  },
  {
    id: 2,
    code: 'NCC-002',
    name: 'Tổng Kho Phụ Kiện & Màn Hình Apple Việt Mỹ',
    phone: '0909.888.999',
    email: 'support@vietmyapple.com',
    address: '42 Trần Quang Khải, P. Tân Định, Q.1, TP.HCM',
    is_active: true,
  },
  {
    id: 3,
    code: 'NCC-003',
    name: 'Công ty TNHH Thương Mại Điện Tử Minh Hoàng',
    phone: '0912.345.678',
    email: 'contact@minhhoangelec.vn',
    address: '88 Nguyễn Trãi, P. Ben Thanh, Q.1, TP.HCM',
    is_active: true,
  },
];

export const INITIAL_PART_USAGES: RepairPartUsage[] = [
  {
    id: 1,
    ticket_id: 1,
    part_id: 5,
    part_name: 'Keo tản nhiệt gốm cao cấp Arctic MX-4 (Tuýp 4g)',
    sku: 'LK-KEO-MX4-4G',
    quantity: 1,
    cost_price: 90000,
    selling_price: 180000,
    status: 'Used',
    technician_name: 'Lê Hoàng Nam (KTV Trưởng)',
    created_at: '2026-11-02T09:30:00Z',
  },
  {
    id: 2,
    ticket_id: 2,
    part_id: 1,
    part_name: 'Pin chuẩn dung lượng cao iPhone 14 Pro Max (4323mAh)',
    sku: 'LK-PIN-IP14PM',
    quantity: 1,
    cost_price: 650000,
    selling_price: 1150000,
    status: 'Used',
    technician_name: 'Lê Hoàng Nam (KTV Trưởng)',
    created_at: '2026-11-02T10:15:00Z',
  },
];

export const INITIAL_BATCHES: InventoryBatch[] = [
  {
    id: 1,
    batch_code: 'LOT-20260110-001',
    part_id: 1,
    part_name: 'Pin chuẩn dung lượng cao iPhone 14 Pro Max (4323mAh)',
    sku: 'LK-PIN-IP14PM',
    supplier_id: 2,
    supplier_name: 'Tổng Kho Phụ Kiện & Màn Hình Apple Việt Mỹ',
    import_quantity: 10,
    remaining_quantity: 8,
    cost_price: 650000,
    selling_price: 1150000,
    import_date: '2026-01-10',
    created_by_name: 'Nguyễn Triển (Admin)',
    notes: 'Đợt nhập chính hãng Apple Việt Mỹ - Tháng 01/2026',
    created_at: '2026-01-10T08:00:00Z',
  },
  {
    id: 2,
    batch_code: 'LOT-20260112-001',
    part_id: 2,
    part_name: 'Màn hình IPS 15.6 inch FHD+ (1920x1200) Dell XPS 9500 / 9510',
    sku: 'LK-MH-DELL-XPS15',
    supplier_id: 1,
    supplier_name: 'Công ty TNHH Phân Phối Linh Kiện Công Nghệ Sài Gòn',
    import_quantity: 3,
    remaining_quantity: 2,
    cost_price: 2400000,
    selling_price: 3600000,
    import_date: '2026-01-12',
    created_by_name: 'Nguyễn Triển (Admin)',
    notes: 'Lô màn hình linh kiện Dell chuẩn A+',
    created_at: '2026-01-12T08:00:00Z',
  },
  {
    id: 3,
    batch_code: 'LOT-20260115-001',
    part_id: 3,
    part_name: 'Ổ cứng SSD Samsung 980 1TB NVMe PCIe Gen 3x4',
    sku: 'LK-SSD-NVME-1TB',
    supplier_id: 1,
    supplier_name: 'Công ty TNHH Phân Phối Linh Kiện Công Nghệ Sài Gòn',
    import_quantity: 15,
    remaining_quantity: 12,
    cost_price: 1550000,
    selling_price: 2200000,
    import_date: '2026-01-15',
    created_by_name: 'Nguyễn Văn Quản (Quản lý)',
    notes: 'Lô SSD Samsung phân phối chính ngạch',
    created_at: '2026-01-15T08:00:00Z',
  },
  {
    id: 4,
    batch_code: 'LOT-20260115-002',
    part_id: 4,
    part_name: 'RAM Laptop Kingston 16GB DDR4 3200MHz',
    sku: 'LK-RAM-DDR4-16GB',
    supplier_id: 1,
    supplier_name: 'Công ty TNHH Phân Phối Linh Kiện Công Nghệ Sài Gòn',
    import_quantity: 20,
    remaining_quantity: 15,
    cost_price: 720000,
    selling_price: 1100000,
    import_date: '2026-01-15',
    created_by_name: 'Nguyễn Văn Quản (Quản lý)',
    notes: 'Lô RAM DDR4 chính hãng Vĩnh Xuân',
    created_at: '2026-01-15T08:00:00Z',
  },
  {
    id: 5,
    batch_code: 'LOT-20260120-001',
    part_id: 5,
    part_name: 'Keo tản nhiệt gốm cao cấp Arctic MX-4 (Tuýp 4g)',
    sku: 'LK-KEO-MX4-4G',
    supplier_id: 1,
    supplier_name: 'Công ty TNHH Phân Phối Linh Kiện Công Nghệ Sài Gòn',
    import_quantity: 30,
    remaining_quantity: 25,
    cost_price: 90000,
    selling_price: 180000,
    import_date: '2026-01-20',
    created_by_name: 'Lê Hoàng Nam (KTV Trưởng)',
    notes: 'Lô keo tản nhiệt phục vụ bảo dưỡng định kỳ',
    created_at: '2026-01-20T08:00:00Z',
  },
];

export const INITIAL_TICKETS: RepairTicket[] = [
  {
    id: 1,
    ticket_code: 'SC-20261102-0001',
    customer_id: 1,
    customer_name: 'Công ty Cổ phần Công nghệ VinaTech',
    customer_phone: '0987654321',
    customer_address: 'Tầng 8, Vincom Center, Q.1, TP.HCM',
    device_id: 1,
    device_model: 'Dell XPS 15 9500',
    device_category: 'Laptop',
    device_brand: 'Dell',
    device_serial: 'CN0XPS15-9500-VT01',
    device_color: 'Bạc kim loại',
    created_by_id: 3,
    created_by_name: 'Trần Thị Thu Hà (Lễ tân)',
    primary_technician_id: 4,
    primary_technician_name: 'Lê Hoàng Nam (KTV Trưởng)',
    status: 'In_Progress',
    priority: 'Urgent',
    defect_description: 'Máy chạy 10 phút sập nguồn đột ngột, quạt kêu rít to, sờ mặt đáy rất nóng.',
    initial_condition: 'Mở nguồn lên được màn hình Dell nhưng quạt quay tối đa, nhiệt độ CPU báo 98 độ C.',
    cosmetic_condition: 'Ngoại quan còn đẹp, không nứt vỡ, trầy nhẹ viền cao su.',
    accessories_included: 'Củ sạc zin Type-C 130W, túi chống sốc Targus.',
    has_device_password: true,
    estimated_completion: '2026-11-04T17:00:00Z',
    subtotal_amount: 1450000,
    discount_amount: 100000,
    final_amount: 1350000,
    paid_amount: 500000,
    debt_amount: 850000,
    is_warranty_claim: false,
    created_at: '2026-11-02T08:30:00Z',
    updated_at: '2026-11-02T14:20:00Z',
  },
  {
    id: 2,
    ticket_code: 'SC-20261102-0002',
    customer_id: 2,
    customer_name: 'Anh Hoàng Tuấn Minh',
    customer_phone: '0918234567',
    device_id: 2,
    device_model: 'iPhone 14 Pro Max 256GB',
    device_category: 'Điện thoại di động',
    device_brand: 'Apple',
    device_serial: 'DNQX1234M1N9',
    device_color: 'Tím đậm',
    created_by_id: 3,
    created_by_name: 'Trần Thị Thu Hà (Lễ tân)',
    primary_technician_id: 4,
    primary_technician_name: 'Lê Hoàng Nam (KTV Trưởng)',
    status: 'Waiting_Approval',
    priority: 'Normal',
    defect_description: 'Pin tụt nhanh từ 100% xuống 20% trong 2 tiếng, máy báo dung lượng pin tối đa 74%, màn hình có sọc chỉ xanh nhỏ mờ mép phải.',
    initial_condition: 'Mở máy bình thường, Face ID hoạt động, sạc vào chậm.',
    cosmetic_condition: 'Kính lưng có 1 vết xước dăm nhỏ, viền thép bóng đẹp.',
    accessories_included: 'Chỉ nhận thân máy, không giữ phụ kiện.',
    has_device_password: true,
    estimated_completion: '2026-11-05T12:00:00Z',
    subtotal_amount: 1450000,
    discount_amount: 0,
    final_amount: 1450000,
    paid_amount: 0,
    debt_amount: 1450000,
    is_warranty_claim: false,
    created_at: '2026-11-02T09:45:00Z',
    updated_at: '2026-11-02T11:00:00Z',
  },
  {
    id: 3,
    ticket_code: 'SC-20261101-0005',
    customer_id: 3,
    customer_name: 'Chị Mai Ngọc Lan',
    customer_phone: '0938112233',
    device_id: 3,
    device_model: 'MacBook Pro 14 inch 2021 M1 Pro',
    device_category: 'Laptop',
    device_brand: 'Apple',
    device_serial: 'C02G1234MD6R',
    device_color: 'Xám không gian',
    created_by_id: 3,
    created_by_name: 'Trần Thị Thu Hà (Lễ tân)',
    primary_technician_id: 4,
    primary_technician_name: 'Lê Hoàng Nam (KTV Trưởng)',
    status: 'Ready_For_Pickup',
    priority: 'Normal',
    defect_description: 'Bàn phím bị kẹt phím Space và chữ E sau khi làm đổ ít cà phê sữa.',
    initial_condition: 'Bàn phím rít, máy mở nguồn bình thường, màn hình đẹp.',
    cosmetic_condition: 'Vết trầy nhẹ đáy máy, màn hình sạch không trầy.',
    accessories_included: 'Sạc MagSafe 3 67W, cáp dù bọc đen.',
    has_device_password: true,
    estimated_completion: '2026-11-02T18:00:00Z',
    subtotal_amount: 850000,
    discount_amount: 50000,
    final_amount: 800000,
    paid_amount: 800000,
    debt_amount: 0,
    is_warranty_claim: false,
    created_at: '2026-11-01T10:00:00Z',
    updated_at: '2026-11-02T16:00:00Z',
  },
  {
    id: 4,
    ticket_code: 'SC-20261025-0012',
    customer_id: 2,
    customer_name: 'Anh Hoàng Tuấn Minh',
    customer_phone: '0918234567',
    device_id: 2,
    device_model: 'iPhone 14 Pro Max 256GB',
    device_category: 'Điện thoại di động',
    device_brand: 'Apple',
    device_serial: 'DNQX1234M1N9',
    device_color: 'Tím đậm',
    created_by_id: 3,
    created_by_name: 'Trần Thị Thu Hà (Lễ tân)',
    primary_technician_id: 4,
    primary_technician_name: 'Lê Hoàng Nam (KTV Trưởng)',
    status: 'Delivered',
    priority: 'Normal',
    defect_description: 'Thay cụm chân sạc Type-C/Lightning bị chập chờn tiếp xúc.',
    initial_condition: 'Cắm cáp phải giữ chặt tay mới nhận sạc.',
    cosmetic_condition: 'Bình thường.',
    accessories_included: 'Không có.',
    estimated_completion: '2026-10-26T17:00:00Z',
    subtotal_amount: 650000,
    discount_amount: 0,
    final_amount: 650000,
    paid_amount: 650000,
    debt_amount: 0,
    is_warranty_claim: false,
    created_at: '2026-10-25T14:00:00Z',
    updated_at: '2026-10-26T16:30:00Z',
  },
];

export const INITIAL_HISTORIES: RepairStatusHistory[] = [
  {
    id: 1,
    ticket_id: 1,
    to_status: 'Received',
    changed_by_name: 'Trần Thị Thu Hà',
    notes: 'Tiếp nhận thiết bị tại quầy, hẹn khách 2 ngày xử lý',
    created_at: '2026-11-02T08:30:00Z',
  },
  {
    id: 2,
    ticket_id: 1,
    from_status: 'Received',
    to_status: 'Diagnosing',
    changed_by_name: 'Lê Hoàng Nam',
    notes: 'Tiến hành tháo máy kiểm tra khối tản nhiệt và quạt tản',
    created_at: '2026-11-02T09:15:00Z',
  },
  {
    id: 3,
    ticket_id: 1,
    from_status: 'Diagnosing',
    to_status: 'Waiting_Approval',
    changed_by_name: 'Lê Hoàng Nam',
    notes: 'Lập báo giá vệ sinh tra keo MX4 và thay 01 quạt tản nhiệt CPU bị vỡ cánh',
    created_at: '2026-11-02T10:30:00Z',
  },
  {
    id: 4,
    ticket_id: 1,
    from_status: 'Waiting_Approval',
    to_status: 'In_Progress',
    changed_by_name: 'Trần Thị Thu Hà',
    notes: 'Khách hàng VinaTech đã gọi điện xác nhận duyệt báo giá 1.350.000 đ',
    created_at: '2026-11-02T14:20:00Z',
  },
  {
    id: 5,
    ticket_id: 2,
    to_status: 'Received',
    changed_by_name: 'Trần Thị Thu Hà',
    notes: 'Tiếp nhận máy kiểm tra tình trạng pin',
    created_at: '2026-11-02T09:45:00Z',
  },
  {
    id: 6,
    ticket_id: 2,
    from_status: 'Received',
    to_status: 'Diagnosing',
    changed_by_name: 'Lê Hoàng Nam',
    notes: 'Đo kiểm dòng xả pin và kiểm tra socket màn hình',
    created_at: '2026-11-02T10:15:00Z',
  },
  {
    id: 7,
    ticket_id: 2,
    from_status: 'Diagnosing',
    to_status: 'Waiting_Approval',
    changed_by_name: 'Lê Hoàng Nam',
    notes: 'Đã gửi báo giá thay pin chính hãng 1.150.000 đ và công xử lý socket 300.000 đ',
    created_at: '2026-11-02T11:00:00Z',
  },
];

export const INITIAL_DIAGNOSTICS: RepairDiagnostic[] = [
  {
    id: 1,
    ticket_id: 1,
    technician_id: 4,
    technician_name: 'Lê Hoàng Nam',
    root_cause: 'Khối tản nhiệt bị đóng cục bụi dày đặc ngăn luồng gió. 01 quạt tản nhiệt bên trái bị gãy 2 cánh gây mất cân bằng động, rung giật và kẹt động cơ khi chạy tải nặng.',
    proposed_solution: 'Vệ sinh toàn bộ bo mạch, làm sạch ống đồng dẫn nhiệt, tra keo gốm dẫn nhiệt cao cấp Arctic MX-4, thay thế quạt tản nhiệt Dell XPS 9500 mới chính hãng.',
    estimated_cost: 1350000,
    estimated_hours: 2.5,
    notes: 'Bo mạch và chipset đồ họa GTX 1650 Ti còn nguyên zin chưa bị cháy, cần xử lý sớm tránh cong vênh die chip.',
    created_at: '2026-11-02T10:25:00Z',
  },
  {
    id: 2,
    ticket_id: 2,
    technician_id: 4,
    technician_name: 'Lê Hoàng Nam',
    root_cause: 'Pin đã chai qua 850 chu kỳ sạc, dung lượng thực tế chỉ còn 73%. Cáp màn hình hơi lỏng chấu tiếp xúc gây sọc chỉ mờ.',
    proposed_solution: 'Thay thế pin dung lượng chuẩn mới kèm fix thông báo bảo trì, bấm lại socket màn hình và dán keo chống nước chuyên dụng.',
    estimated_cost: 1450000,
    estimated_hours: 1.5,
    notes: 'Đã thông báo khách không cần thay màn hình tốn kém.',
    created_at: '2026-11-02T10:55:00Z',
  },
];

export const INITIAL_QUOTES: RepairQuote[] = [
  {
    id: 1,
    ticket_id: 1,
    quote_code: 'BG-20261102-0001',
    version: 1,
    subtotal: 1450000,
    discount: 100000,
    total_amount: 1350000,
    status: 'Approved',
    confirmed_by: 'Khách hàng (VinaTech - Anh Trí IT)',
    confirmed_at: '2026-11-02T14:15:00Z',
    created_by_name: 'Lê Hoàng Nam',
    created_at: '2026-11-02T10:30:00Z',
    items: [
      {
        id: 1,
        quote_id: 1,
        item_type: 'part',
        name: 'Quạt tản nhiệt CPU Dell XPS 15 9500 (Trái)',
        quantity: 1,
        unit_price: 850000,
        labor_fee: 0,
        subtotal: 850000,
        warranty_months: 6,
      },
      {
        id: 2,
        quote_id: 1,
        item_type: 'labor',
        name: 'Gói vệ sinh chuyên sâu & Tra keo tản nhiệt Arctic MX-4',
        quantity: 1,
        unit_price: 350000,
        labor_fee: 250000,
        subtotal: 600000,
        warranty_months: 3,
      },
    ],
  },
  {
    id: 2,
    ticket_id: 2,
    quote_code: 'BG-20261102-0002',
    version: 1,
    subtotal: 1450000,
    discount: 0,
    total_amount: 1450000,
    status: 'Sent',
    created_by_name: 'Lê Hoàng Nam',
    created_at: '2026-11-02T11:00:00Z',
    items: [
      {
        id: 3,
        quote_id: 2,
        item_type: 'part',
        name: 'Pin chuẩn dung lượng cao iPhone 14 Pro Max (4323mAh)',
        quantity: 1,
        unit_price: 1150000,
        labor_fee: 0,
        subtotal: 1150000,
        warranty_months: 12,
      },
      {
        id: 4,
        quote_id: 2,
        item_type: 'labor',
        name: 'Công xử lý cáp socket màn hình & Ron chống nước zin',
        quantity: 1,
        unit_price: 300000,
        labor_fee: 0,
        subtotal: 300000,
        warranty_months: 3,
      },
    ],
  },
];

export const INITIAL_CHECKLISTS: QCChecklist[] = [
  {
    id: 1,
    ticket_id: 3,
    checked_by_name: 'Lê Hoàng Nam',
    is_passed: true,
    notes: 'Toàn bộ phím nảy êm, không còn hiện tượng kẹt, loa và mic hoạt động sắc nét.',
    created_at: '2026-11-02T15:30:00Z',
    items: [
      { id: 1, item_name: 'Khởi động nguồn ổn định', status: 'Pass' },
      { id: 2, item_name: 'Màn hình hiển thị sắc nét, không sọc/điểm chết', status: 'Pass' },
      { id: 3, item_name: 'Bàn phím & Touchpad hoạt động mượt mà', status: 'Pass' },
      { id: 4, item_name: 'Loa & Microphone thu phát rõ ràng', status: 'Pass' },
      { id: 5, item_name: 'Kết nối Wi-Fi & Bluetooth bắt sóng tốt', status: 'Pass' },
      { id: 6, item_name: 'Camera FaceTime hoạt động tốt', status: 'Pass' },
      { id: 7, item_name: 'Cổng sạc MagSafe 3 & Type-C tiếp xúc chuẩn', status: 'Pass' },
      { id: 8, item_name: 'Lỗi kẹt phím ban đầu đã được giải quyết dứt điểm', status: 'Pass' },
    ],
  },
];

export const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 1,
    payment_code: 'PT-20261102-0001',
    ticket_id: 1,
    ticket_code: 'SC-20261102-0001',
    customer_name: 'Công ty Cổ phần Công nghệ VinaTech',
    amount: 500000,
    payment_method: 'Bank_Transfer',
    payment_type: 'Deposit',
    transaction_ref: 'MB8899221102',
    cashier_name: 'Phạm Minh Anh (Thu ngân)',
    notes: 'Khách chuyển khoản cọc linh kiện',
    created_at: '2026-11-02T14:30:00Z',
  },
  {
    id: 2,
    payment_code: 'PT-20261102-0002',
    ticket_id: 3,
    ticket_code: 'SC-20261101-0005',
    customer_name: 'Chị Mai Ngọc Lan',
    amount: 800000,
    payment_method: 'Cash',
    payment_type: 'Final',
    cashier_name: 'Phạm Minh Anh (Thu ngân)',
    notes: 'Thanh toán hoàn tất bằng tiền mặt tại quầy',
    created_at: '2026-11-02T16:00:00Z',
  },
];

export const INITIAL_WARRANTIES: Warranty[] = [
  {
    id: 1,
    warranty_code: 'BH-20261026-0008',
    ticket_id: 4,
    ticket_code: 'SC-20261025-0012',
    device_summary: 'Apple iPhone 14 Pro Max (Tím đậm)',
    customer_name: 'Anh Hoàng Tuấn Minh',
    customer_phone: '0918234567',
    start_date: '2026-10-26',
    end_date: '2027-01-26',
    terms: 'Bảo hành 90 ngày cho cụm cổng sạc đã thay thế',
    status: 'Active',
    created_at: '2026-10-26T16:30:00Z',
  },
];

export const INITIAL_PROMOTIONS: Promotion[] = [
  {
    id: 1,
    code: 'KHACHQUEN10',
    name: 'Ưu đãi Khách hàng thân thiết (10%)',
    description: 'Giảm 10% tổng chi phí sửa chữa, tối đa 100.000đ cho khách hàng đã từng sử dụng dịch vụ tại trung tâm.',
    discount_type: 'percentage',
    discount_value: 10,
    max_discount_amount: 100000,
    min_order_amount: 200000,
    applicable_to: 'all',
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    usage_limit: 500,
    usage_count: 38,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 2,
    code: 'HSSV50K',
    name: 'Hỗ trợ Học sinh - Sinh viên (50.000 đ)',
    description: 'Giảm trực tiếp 50.000đ cho học sinh, sinh viên xuất trình thẻ hợp lệ, áp dụng đơn sửa chữa từ 250.000đ.',
    discount_type: 'fixed',
    discount_value: 50000,
    min_order_amount: 250000,
    applicable_to: 'all',
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    usage_limit: 200,
    usage_count: 45,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 3,
    code: 'TRIAN20',
    name: 'Tri ân khách hàng tháng sinh nhật (20%)',
    description: 'Giảm 20% tổng hóa đơn, tối đa 150.000đ dành cho hóa đơn sửa chữa từ 400.000đ.',
    discount_type: 'percentage',
    discount_value: 20,
    max_discount_amount: 150000,
    min_order_amount: 400000,
    applicable_to: 'all',
    start_date: '2026-10-01',
    end_date: '2026-12-31',
    usage_limit: 100,
    usage_count: 19,
    is_active: true,
    created_at: '2026-10-01T00:00:00Z',
  },
  {
    id: 4,
    code: 'KHACHMOI30K',
    name: 'Chào đón Khách hàng mới (30.000 đ)',
    description: 'Giảm ngay 30.000đ cho khách hàng lần đầu sửa chữa thiết bị tại hệ thống RepairFlow, đơn từ 150.000đ.',
    discount_type: 'fixed',
    discount_value: 30000,
    min_order_amount: 150000,
    applicable_to: 'all',
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    usage_limit: 1000,
    usage_count: 82,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 5,
    code: 'CONGSUA50K',
    name: 'Giảm tiền công kỹ thuật & Vệ sinh (50.000 đ)',
    description: 'Hỗ trợ giảm 50.000đ tiền công kiểm tra chuyên sâu, vệ sinh tra keo tản nhiệt định kỳ cho laptop và máy bàn.',
    discount_type: 'fixed',
    discount_value: 50000,
    min_order_amount: 100000,
    applicable_to: 'labor',
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    usage_limit: 300,
    usage_count: 26,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 1,
    user_name: 'Trần Thị Thu Hà',
    action: 'CREATE_TICKET',
    entity_type: 'repair_tickets',
    entity_id: 'SC-20261102-0001',
    details: 'Tạo phiếu sửa chữa mới cho khách hàng Công ty VinaTech',
    ip_address: '192.168.1.15',
    created_at: '2026-11-02T08:30:00Z',
  },
  {
    id: 2,
    user_name: 'Lê Hoàng Nam',
    action: 'CREATE_QUOTE',
    entity_type: 'repair_quotes',
    entity_id: 'BG-20261102-0001',
    details: 'Lập báo giá 1.350.000 đ cho phiếu SC-20261102-0001',
    ip_address: '192.168.1.20',
    created_at: '2026-11-02T10:30:00Z',
  },
  {
    id: 3,
    user_name: 'Phạm Minh Anh',
    action: 'CREATE_PAYMENT',
    entity_type: 'payments',
    entity_id: 'PT-20261102-0001',
    details: 'Thu tiền cọc 500.000 đ qua chuyển khoản cho phiếu SC-20261102-0001',
    ip_address: '192.168.1.12',
    created_at: '2026-11-02T14:30:00Z',
  },
];

export const INITIAL_RETAIL_ORDERS: RetailSaleOrder[] = [
  {
    id: 1,
    order_code: 'HD-20261103-0001',
    customer_id: 2,
    customer_name: 'Anh Hoàng Tuấn Minh',
    customer_phone: '0918234567',
    created_by_id: 3,
    created_by_name: 'Trần Thị Thu Hà (Lễ tân)',
    subtotal_amount: 1150000,
    discount_amount: 50000,
    promotion_code: 'KHACHMOI30K',
    final_amount: 1100000,
    paid_amount: 1100000,
    debt_amount: 0,
    payment_method: 'Bank_Transfer',
    payment_status: 'Paid',
    notes: 'Bán lẻ pin iPhone 14 Pro Max kèm phụ kiện sạc',
    warranty_months: 6,
    created_at: '2026-11-03T11:20:00Z',
    items: [
      {
        id: 1,
        item_type: 'part',
        part_id: 1,
        batch_id: 1,
        batch_code: 'LOT-20261102-001',
        product_name: 'Pin chuẩn dung lượng cao iPhone 14 Pro Max',
        sku: 'LK-PIN-IP14PM',
        quantity: 1,
        cost_price: 650000,
        unit_price: 1150000,
        subtotal: 1150000,
        warranty_months: 6,
      },
    ],
  },
];

// Helper functions for persistent LocalStorage
function loadOrInit<T>(key: string, initialData: T): T {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return initialData;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(initialData));
      return initialData;
    }
    return JSON.parse(raw);
  } catch {
    return initialData;
  }
}

function save<T>(key: string, data: T): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.error('Storage error:', e);
  }
}

const STATUS_LABELS: Record<string, string> = {
  Received: 'Đã tiếp nhận',
  Diagnosing: 'Đang kiểm tra',
  Waiting_Approval: 'Chờ khách duyệt',
  Waiting_Parts: 'Chờ linh kiện',
  In_Progress: 'Đang sửa chữa',
  Quality_Check: 'Kiểm tra chất lượng',
  Completed: 'Đã sửa xong',
  Ready_For_Pickup: 'Chờ khách nhận',
  Delivered: 'Đã bàn giao',
  Warranty: 'Đang bảo hành',
  Cancelled: 'Đã hủy',
};

function cleanStatusText(text?: string): string {
  if (!text) return '';
  let res = text;
  for (const [key, label] of Object.entries(STATUS_LABELS)) {
    res = res.replace(new RegExp(`\\b${key}\\b`, 'g'), label);
  }
  return res;
}

function getLocalIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const StorageService = {
  /**
   * Hydrate Frontend cache from Node.js + MySQL Backend (/api/bootstrap)
   */
  async syncFromBackend(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    const data = await ApiClient.request<any>('/bootstrap');
    if (!data || !data.users) return false;

    if (data.dbStatus) {
      ApiClient.setStatus(data.dbStatus);
    }

    save('settings', data.settings);
    save('users', data.users);
    save('customers', data.customers);
    save('categories', data.categories);
    save('brands', data.brands);
    save('devices', data.devices);
    save('suppliers', data.suppliers);
    save('parts', data.parts);
    save('part_batches', data.part_batches);
    save('promotions', data.promotions);
    save('tickets', data.tickets);
    save('histories', data.histories);
    save('diagnostics', data.diagnostics);
    save('quotes', data.quotes);
    save('checklists', data.checklists);
    save('part_usages', data.part_usages);
    save('payments', data.payments);
    save('warranties', data.warranties);
    save('retail_orders', data.retail_orders);
    save('audit_logs', data.audit_logs);

    window.dispatchEvent(new CustomEvent('repairflow_sql_hydrated', { detail: data }));
    return true;
  },

  /**
   * Reconciles a mutation promise with the authoritative backend state.
   * On success, applies any immediate ID/code callback and then refreshes from /api/bootstrap.
   * On failure, refreshes from /api/bootstrap to roll back any stale local state.
   */
  reconcileWithServer<T = any>(promise: Promise<T | null>, onSuccess?: (res: T) => void): Promise<T | null> {
    return promise
      .then(async (res) => {
        if (res && onSuccess) {
          onSuccess(res);
        }
        await this.syncFromBackend();
        return res;
      })
      .catch(async () => {
        await this.syncFromBackend();
        return null;
      });
  },

  // Reset all data to factory sample data
  resetToSampleData(): void {
    this.reconcileWithServer(ApiClient.post('/reset', {}), () => {
      save('users', INITIAL_USERS);
      save('settings', INITIAL_SETTINGS);
      save('customers', INITIAL_CUSTOMERS);
      save('categories', INITIAL_CATEGORIES);
      save('brands', INITIAL_BRANDS);
      save('devices', INITIAL_DEVICES);
      save('parts', INITIAL_PARTS);
      save('suppliers', INITIAL_SUPPLIERS);
      save('part_usages', INITIAL_PART_USAGES);
      save('tickets', INITIAL_TICKETS);
      save('histories', INITIAL_HISTORIES);
      save('diagnostics', INITIAL_DIAGNOSTICS);
      save('quotes', INITIAL_QUOTES);
      save('checklists', INITIAL_CHECKLISTS);
      save('payments', INITIAL_PAYMENTS);
      save('warranties', INITIAL_WARRANTIES);
      save('audit_logs', INITIAL_AUDIT_LOGS);
      save('promotions', INITIAL_PROMOTIONS);
      save('part_batches', INITIAL_BATCHES);
      save('retail_orders', INITIAL_RETAIL_ORDERS);
    });
  },

  // Settings
  getSettings(): StoreSettings {
    return loadOrInit('settings', INITIAL_SETTINGS);
  },
  async saveSettingsAsync(settings: StoreSettings): Promise<StoreSettings> {
    const res = await ApiClient.requestStrict<StoreSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
    const updated = { ...settings, ...(res || {}) };
    save('settings', updated);
    await this.syncFromBackend();
    return this.getSettings();
  },

  // Users
  getUsers(): User[] {
    return loadOrInit('users', INITIAL_USERS);
  },
  getUserById(id: number): User | undefined {
    return this.getUsers().find((u) => u.id === id);
  },
  saveUsers(users: User[]): void {
    save('users', users);
  },
  saveUsersLocalOnly(users: User[]): void {
    save('users', users);
  },
  updateUserLocalOnly(user: User): void {
    const list = this.getUsers();
    const idx = list.findIndex((u) => u.id === user.id);
    if (idx !== -1) {
      list[idx] = user;
      save('users', list);
    }
  },
  async updateUserAsync(id: number, data: Partial<User>): Promise<User> {
    const res = await ApiClient.requestStrict<{ user?: User } & Partial<User>>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    const updatedUser = (res?.user || res) as User;
    await this.syncFromBackend();
    return this.getUserById(id) || updatedUser;
  },

  // Customers
  getCustomers(): Customer[] {
    return loadOrInit('customers', INITIAL_CUSTOMERS);
  },
  async addCustomerAsync(c: Omit<Customer, 'id' | 'code' | 'created_at'>): Promise<Customer> {
    const res = await ApiClient.requestStrict<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(c),
    });
    const newCustomer: Customer = {
      ...c,
      ...res,
      id: res.id,
      code: res.code,
      created_at: res.created_at || new Date().toISOString(),
    };
    const list = this.getCustomers().filter((item) => item.id !== newCustomer.id);
    list.unshift(newCustomer);
    save('customers', list);
    await this.syncFromBackend();
    return this.getCustomers().find((item) => item.id === res.id) || newCustomer;
  },
  async updateCustomerAsync(id: number, data: Partial<Customer>): Promise<Customer> {
    const res = await ApiClient.requestStrict<Customer>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    await this.syncFromBackend();
    return this.getCustomers().find((c) => c.id === id) || res;
  },

  // Devices
  getDevices(): CustomerDevice[] {
    return loadOrInit('devices', INITIAL_DEVICES);
  },
  async addDeviceAsync(d: Omit<CustomerDevice, 'id' | 'created_at'>): Promise<CustomerDevice> {
    const res = await ApiClient.requestStrict<CustomerDevice>('/devices', {
      method: 'POST',
      body: JSON.stringify(d),
    });
    const newDevice: CustomerDevice = {
      ...d,
      ...res,
      id: res.id,
      created_at: res.created_at || new Date().toISOString(),
    };
    const list = this.getDevices().filter((item) => item.id !== newDevice.id);
    list.unshift(newDevice);
    save('devices', list);
    await this.syncFromBackend();
    return this.getDevices().find((item) => item.id === res.id) || newDevice;
  },

  // Categories & Brands
  getCategories(): DeviceCategory[] {
    return loadOrInit('categories', INITIAL_CATEGORIES);
  },
  getBrands(): DeviceBrand[] {
    return loadOrInit('brands', INITIAL_BRANDS);
  },

  // Tickets
  getTickets(): RepairTicket[] {
    return loadOrInit('tickets', INITIAL_TICKETS);
  },
  getTicketByCode(code: string): RepairTicket | undefined {
    return this.getTickets().find((t) => t.ticket_code.toLowerCase() === code.trim().toLowerCase());
  },
  getTicketById(id: number): RepairTicket | undefined {
    return this.getTickets().find((t) => t.id === id);
  },
  async createTicketAsync(
    data: Omit<RepairTicket, 'id' | 'ticket_code' | 'created_at' | 'updated_at'>
  ): Promise<RepairTicket> {
    const res = await ApiClient.requestStrict<RepairTicket>('/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const nowIso = new Date().toISOString();
    const newTicket: RepairTicket = {
      ...data,
      ...res,
      id: res.id,
      ticket_code: res.ticket_code,
      has_device_password: Boolean(res.has_device_password ?? data.device_password_hint),
      created_at: res.created_at || nowIso,
      updated_at: res.updated_at || nowIso,
    };
    const list = this.getTickets().filter((t) => t.id !== newTicket.id);
    list.unshift(newTicket);
    save('tickets', list);
    await this.syncFromBackend();
    return this.getTicketById(res.id) || newTicket;
  },

  async transitionTicketAsync(
    id: number,
    targetStatus: RepairStatus,
    options?: {
      note?: string;
      cancellation_reason?: string;
      is_override?: boolean;
      warranty_days?: number;
      refund_amount?: number;
      refund_method?: string;
    }
  ): Promise<RepairTicket & { warranty?: Warranty }> {
    const targetLabel = STATUS_LABELS[targetStatus] || targetStatus;
    const note = options?.note || options?.cancellation_reason || `Chuyển trạng thái sang ${targetLabel}`;
    const res = await ApiClient.requestStrict<RepairTicket & { warranty?: Warranty }>(
      `/tickets/${id}/transition`,
      {
        method: 'POST',
        body: JSON.stringify({
          to_status: targetStatus,
          note,
          cancellation_reason: options?.cancellation_reason,
          is_override: Boolean(options?.is_override),
          warranty_days: options?.warranty_days,
          refund_amount: options?.refund_amount,
          refund_method: options?.refund_method,
        }),
      }
    );
    await this.syncFromBackend();
    const syncedTicket = this.getTicketById(id) || res;
    return res.warranty ? { ...syncedTicket, warranty: res.warranty } : syncedTicket;
  },

  async updateTicketAsync(
    id: number,
    updates: Partial<RepairTicket>,
    isOverride = false,
    transitionOptions?: {
      note?: string;
      warranty_days?: number;
      refund_amount?: number;
      refund_method?: string;
    }
  ): Promise<RepairTicket & { warranty?: Warranty }> {
    const existing = this.getTicketById(id);
    const hasStatusChange = Boolean(updates.status && (!existing || updates.status !== existing.status));
    const nonStatusUpdates: Record<string, any> = {};
    for (const [k, v] of Object.entries(updates)) {
      if (k !== 'status' && k !== 'cancellation_reason') {
        nonStatusUpdates[k] = v;
      }
    }

    let transitionResult: (RepairTicket & { warranty?: Warranty }) | null = null;

    if (Object.keys(nonStatusUpdates).length > 0) {
      await ApiClient.requestStrict<RepairTicket>(`/tickets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    }

    if (hasStatusChange && updates.status) {
      transitionResult = await this.transitionTicketAsync(id, updates.status, {
        note: transitionOptions?.note,
        cancellation_reason: updates.cancellation_reason,
        is_override: isOverride,
        warranty_days: transitionOptions?.warranty_days,
        refund_amount: transitionOptions?.refund_amount,
        refund_method: transitionOptions?.refund_method,
      });
    } else {
      await this.syncFromBackend();
    }

    const latest = this.getTicketById(id) || transitionResult;
    if (!latest) throw new Error('Không tìm thấy phiếu sửa chữa sau khi cập nhật');
    return transitionResult?.warranty ? { ...latest, warranty: transitionResult.warranty } : latest;
  },

  // Fetch decrypted device password on demand from server (with RBAC & Audit Log)
  async getTicketDevicePassword(ticketId: number): Promise<string> {
    const res = await ApiClient.requestStrict<{ password: string }>(`/tickets/${ticketId}/device-password`);
    return res.password || '';
  },

  // Status history
  getStatusHistories(ticketId: number): RepairStatusHistory[] {
    const all = loadOrInit('histories', INITIAL_HISTORIES);
    return all
      .filter((h) => h.ticket_id === ticketId)
      .map((h) => ({
        ...h,
        notes: cleanStatusText(h.notes),
      }));
  },

  // Diagnostics
  getDiagnostics(ticketId: number): RepairDiagnostic[] {
    const all = loadOrInit('diagnostics', INITIAL_DIAGNOSTICS);
    return all.filter((d) => d.ticket_id === ticketId);
  },
  async addDiagnosticAsync(d: Omit<RepairDiagnostic, 'id' | 'created_at'>): Promise<RepairDiagnostic> {
    const res = await ApiClient.requestStrict<RepairDiagnostic>('/diagnostics', {
      method: 'POST',
      body: JSON.stringify(d),
    });
    const newDiag: RepairDiagnostic = {
      ...d,
      ...res,
      id: res.id,
      created_at: res.created_at || new Date().toISOString(),
    };
    const all = loadOrInit('diagnostics', INITIAL_DIAGNOSTICS).filter((item) => item.id !== newDiag.id);
    all.unshift(newDiag);
    save('diagnostics', all);
    await this.syncFromBackend();
    return newDiag;
  },

  // Quotes
  getQuotes(ticketId: number): RepairQuote[] {
    const all = loadOrInit('quotes', INITIAL_QUOTES);
    return all.filter((q) => q.ticket_id === ticketId);
  },
  async addQuoteAsync(q: Omit<RepairQuote, 'id' | 'quote_code' | 'created_at'>): Promise<RepairQuote> {
    const res = await ApiClient.requestStrict<RepairQuote>('/quotes', {
      method: 'POST',
      body: JSON.stringify({
        ...q,
        status: 'Sent',
      }),
    });
    await this.syncFromBackend();
    return this.getQuotes(q.ticket_id).find((item) => item.id === res.id) || res;
  },
  async updateQuoteStatusAsync(
    quoteId: number,
    status: 'Approved' | 'Rejected',
    confirmedBy?: string,
    reason?: string
  ): Promise<RepairQuote> {
    const res = await ApiClient.requestStrict<RepairQuote>(`/quotes/${quoteId}/status`, {
      method: 'PUT',
      body: JSON.stringify({
        status,
        confirmed_by: confirmedBy,
        rejection_reason: reason,
      }),
    });
    await this.syncFromBackend();
    return res;
  },

  // QC Checklists
  getChecklist(ticketId: number): QCChecklist | undefined {
    const all = loadOrInit('checklists', INITIAL_CHECKLISTS);
    return all.find((c) => c.ticket_id === ticketId);
  },
  async saveChecklistAsync(c: Omit<QCChecklist, 'id' | 'created_at'>): Promise<QCChecklist> {
    const payload = {
      ...c,
      items: c.items.map((it: any) => ({
        ...it,
        title: it.item_name || it.title,
        passed: it.passed !== undefined ? Boolean(it.passed) : it.status === 'Pass' || it.status === 'NA',
      })),
    };
    const res = await ApiClient.requestStrict<QCChecklist>('/checklists', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    await this.syncFromBackend();
    return this.getChecklist(c.ticket_id) || res;
  },

  // Inventory & Parts
  getParts(): Part[] {
    return loadOrInit('parts', INITIAL_PARTS);
  },
  async addPartAsync(p: Omit<Part, 'id' | 'created_at'>): Promise<Part> {
    const res = await ApiClient.requestStrict<Part>('/parts', {
      method: 'POST',
      body: JSON.stringify(p),
    });
    await this.syncFromBackend();
    return this.getParts().find((item) => item.id === res.id) || res;
  },
  async updatePartAsync(id: number, updates: Partial<Part>): Promise<Part> {
    if (updates.supplier_id && !updates.supplier_name) {
      const supp = this.getSuppliers().find((s) => s.id === updates.supplier_id);
      if (supp) updates.supplier_name = supp.name;
    }
    const res = await ApiClient.requestStrict<Part>(`/parts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    await this.syncFromBackend();
    return this.getParts().find((item) => item.id === id) || res;
  },

  // Suppliers
  getSuppliers(): Supplier[] {
    return loadOrInit('suppliers', INITIAL_SUPPLIERS);
  },
  async addSupplierAsync(data: Omit<Supplier, 'id' | 'code'>): Promise<Supplier> {
    const res = await ApiClient.requestStrict<Supplier>('/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    await this.syncFromBackend();
    return this.getSuppliers().find((s) => s.id === res.id) || res;
  },
  async updateSupplierAsync(id: number, updates: Partial<Supplier>): Promise<Supplier> {
    const res = await ApiClient.requestStrict<Supplier>(`/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    await this.syncFromBackend();
    return this.getSuppliers().find((s) => s.id === id) || res;
  },
  async deleteSupplierAsync(id: number): Promise<boolean> {
    await ApiClient.requestStrict(`/suppliers/${id}`, {
      method: 'DELETE',
    });
    await this.syncFromBackend();
    return true;
  },

  // Inventory Batches / Lô đợt nhập kho (UC-15, UC-16)
  getBatches(partId?: number): InventoryBatch[] {
    const all = loadOrInit('part_batches', INITIAL_BATCHES);
    if (partId) return all.filter((b) => b.part_id === partId);
    return all;
  },
  async addInventoryBatchAsync(data: {
    part_id: number;
    part_name: string;
    sku: string;
    supplier_id?: number;
    supplier_name?: string;
    import_quantity: number;
    cost_price: number;
    selling_price: number;
    import_date?: string;
    expiry_date?: string;
    created_by_name?: string;
    notes?: string;
    custom_batch_code?: string;
  }): Promise<InventoryBatch> {
    const res = await ApiClient.requestStrict<InventoryBatch>('/batches', {
      method: 'POST',
      body: JSON.stringify({
        part_id: data.part_id,
        part_name: data.part_name,
        sku: data.sku,
        supplier_id: data.supplier_id,
        supplier_name: data.supplier_name,
        import_quantity: Number(data.import_quantity),
        cost_price: Number(data.cost_price),
        selling_price: Number(data.selling_price),
        import_date: data.import_date || getLocalIsoDate(),
        expiry_date: data.expiry_date,
        notes: data.notes,
        batch_code: data.custom_batch_code?.trim() || undefined,
      }),
    });
    await this.syncFromBackend();
    return this.getBatches().find((b) => b.id === res.id) || res;
  },
  async updateInventoryBatchAsync(
    batchId: number,
    updates: Partial<InventoryBatch>
  ): Promise<InventoryBatch> {
    if (updates.supplier_id && !updates.supplier_name) {
      const supp = this.getSuppliers().find((s) => s.id === updates.supplier_id);
      if (supp) updates.supplier_name = supp.name;
    }
    const res = await ApiClient.requestStrict<InventoryBatch>(`/batches/${batchId}`, {
      method: 'PUT',
      body: JSON.stringify({
        batch_code: updates.batch_code,
        supplier_id: updates.supplier_id,
        supplier_name: updates.supplier_name,
        import_quantity: updates.import_quantity,
        cost_price: updates.cost_price,
        selling_price: updates.selling_price,
        import_date: updates.import_date,
        expiry_date: updates.expiry_date,
        notes: updates.notes,
      }),
    });
    await this.syncFromBackend();
    return this.getBatches().find((b) => b.id === batchId) || res;
  },
  async deleteInventoryBatchAsync(batchId: number): Promise<boolean> {
    await ApiClient.requestStrict(`/batches/${batchId}`, {
      method: 'DELETE',
    });
    await this.syncFromBackend();
    return true;
  },

  // Repair Part Usages (Xuất & Hoàn trả linh kiện cho phiếu sửa chữa - UC-17)
  getPartUsages(ticketId?: number): RepairPartUsage[] {
    const all = loadOrInit('part_usages', INITIAL_PART_USAGES);
    if (ticketId) return all.filter((u) => u.ticket_id === ticketId);
    return all;
  },
  async addPartUsageAsync(
    usageData: Omit<RepairPartUsage, 'id' | 'created_at' | 'status'>
  ): Promise<RepairPartUsage> {
    const res = await ApiClient.requestStrict<RepairPartUsage>('/part-usages', {
      method: 'POST',
      body: JSON.stringify(usageData),
    });
    await this.syncFromBackend();
    return this.getPartUsages(usageData.ticket_id).find((u) => u.id === res.id) || res;
  },
  async returnPartUsageAsync(usageId: number, _technicianName?: string): Promise<boolean> {
    await ApiClient.requestStrict(`/part-usages/${usageId}/return`, {
      method: 'PUT',
      body: JSON.stringify({}),
    });
    await this.syncFromBackend();
    return true;
  },

  // Payments
  getPayments(ticketId?: number): Payment[] {
    const all = loadOrInit('payments', INITIAL_PAYMENTS);
    if (ticketId) return all.filter((p) => p.ticket_id === ticketId);
    return all;
  },
  async addPaymentAsync(data: Omit<Payment, 'id' | 'payment_code' | 'created_at'>): Promise<Payment> {
    const res = await ApiClient.requestStrict<Payment>('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    await this.syncFromBackend();
    return this.getPayments(data.ticket_id).find((p) => p.id === res.id) || res;
  },

  // Item D.3: Dev-only Server Webhook Simulation
  async simulateWebhookAsync(payload: {
    amount: number;
    content: string;
    transaction_ref?: string;
    gateway_provider?: string;
    payment_method?: PaymentMethod;
    card_brand?: string;
  }): Promise<{
    processed: boolean;
    matched?: boolean;
    duplicate?: boolean;
    reason?: string;
    payment?: Payment;
    ticket?: RepairTicket;
  }> {
    const res = await ApiClient.requestStrict<{
      processed: boolean;
      matched?: boolean;
      duplicate?: boolean;
      reason?: string;
      payment?: Payment;
      ticket?: RepairTicket;
    }>('/dev/simulate-webhook', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    await this.syncFromBackend();
    if (typeof window !== 'undefined' && res.payment) {
      window.dispatchEvent(
        new CustomEvent('repairflow_auto_payment', {
          detail: { payment: res.payment, ticket: res.ticket },
        })
      );
    }
    return res;
  },

  // Warranties
  getWarranties(): Warranty[] {
    return loadOrInit('warranties', INITIAL_WARRANTIES);
  },
  async addWarrantyAsync(ticket: RepairTicket, days = 90): Promise<Warranty> {
    const now = new Date();
    const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    const formatLocalIsoDate = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    const res = await ApiClient.requestStrict<Warranty>('/warranties', {
      method: 'POST',
      body: JSON.stringify({
        ticket_id: ticket.id,
        ticket_code: ticket.ticket_code,
        device_summary: `${ticket.device_brand} ${ticket.device_model}`,
        customer_name: ticket.customer_name,
        customer_phone: ticket.customer_phone,
        start_date: formatLocalIsoDate(now),
        end_date: formatLocalIsoDate(endDate),
        terms: `Bảo hành ${days} ngày cho dịch vụ & linh kiện đã thay thế.`,
        status: 'Active',
      }),
    });
    await this.syncFromBackend();
    return this.getWarranties().find((w) => w.id === res.id) || res;
  },

  // Promotions & Discounts
  getPromotions(): Promotion[] {
    return loadOrInit('promotions', INITIAL_PROMOTIONS);
  },
  getPromotionById(id: number): Promotion | undefined {
    return this.getPromotions().find((p) => p.id === id);
  },
  getPromotionByCode(code: string): Promotion | undefined {
    if (!code) return undefined;
    const clean = code.trim().toUpperCase();
    return this.getPromotions().find((p) => p.code.toUpperCase() === clean);
  },
  async addPromotionAsync(data: Omit<Promotion, 'id' | 'created_at' | 'usage_count'>): Promise<Promotion> {
    const cleanCode = data.code.trim().toUpperCase();
    const res = await ApiClient.requestStrict<Promotion>('/promotions', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        code: cleanCode,
      }),
    });
    await this.syncFromBackend();
    return this.getPromotionById(res.id) || res;
  },
  async updatePromotionAsync(id: number, data: Partial<Promotion>): Promise<Promotion> {
    if (data.code) {
      data.code = data.code.trim().toUpperCase();
    }
    const existing = this.getPromotionById(id);
    const res = await ApiClient.requestStrict<Promotion>(`/promotions/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...(existing || {}), ...data }),
    });
    await this.syncFromBackend();
    return this.getPromotionById(id) || res;
  },
  async deletePromotionAsync(id: number): Promise<boolean> {
    await ApiClient.requestStrict(`/promotions/${id}`, {
      method: 'DELETE',
    });
    await this.syncFromBackend();
    return true;
  },
  async validatePromotionAsync(
    code: string,
    subtotal: number
  ): Promise<{
    valid: boolean;
    promotion?: Promotion;
    discountAmount: number;
    message?: string;
  }> {
    if (!code || !code.trim()) {
      return { valid: false, discountAmount: 0, message: 'Vui lòng nhập hoặc chọn mã ưu đãi.' };
    }
    try {
      const res = await ApiClient.requestStrict<{
        valid: boolean;
        promotion: Promotion;
        discountAmount: number;
        message?: string;
      }>('/promotions/validate', {
        method: 'POST',
        body: JSON.stringify({ code: code.trim().toUpperCase(), subtotal }),
      });
      return {
        valid: true,
        promotion: res.promotion,
        discountAmount: res.discountAmount,
        message:
          res.message ||
          `Áp dụng thành công mã ${res.promotion.code}: Giảm ${res.discountAmount.toLocaleString('vi-VN')} đ (${res.promotion.name})`,
      };
    } catch (err: any) {
      return {
        valid: false,
        discountAmount: 0,
        message: err?.message || 'Mã ưu đãi không hợp lệ.',
      };
    }
  },
  validateAndCalculatePromotion(
    code: string,
    subtotal: number
  ): {
    valid: boolean;
    promotion?: Promotion;
    discountAmount: number;
    message?: string;
  } {
    if (!code || !code.trim()) {
      return { valid: false, discountAmount: 0, message: 'Vui lòng nhập hoặc chọn mã ưu đãi.' };
    }
    const promo = this.getPromotionByCode(code);
    if (!promo) {
      return {
        valid: false,
        discountAmount: 0,
        message: `Mã ưu đãi "${code.trim().toUpperCase()}" không tồn tại hoặc đã hết hiệu lực.`,
      };
    }
    if (!promo.is_active) {
      return {
        valid: false,
        discountAmount: 0,
        message: `Chương trình ưu đãi "${promo.code}" đang tạm ngưng áp dụng.`,
      };
    }

    const today = getLocalIsoDate();
    if (promo.start_date && today < promo.start_date) {
      return {
        valid: false,
        discountAmount: 0,
        message: `Mã ưu đãi có hiệu lực từ ngày ${promo.start_date}.`,
      };
    }
    if (promo.end_date && today > promo.end_date) {
      return {
        valid: false,
        discountAmount: 0,
        message: `Mã ưu đãi đã hết hạn sử dụng (${promo.end_date}).`,
      };
    }

    if (promo.usage_limit && promo.usage_count >= promo.usage_limit) {
      return {
        valid: false,
        discountAmount: 0,
        message: 'Chương trình ưu đãi này đã hết lượt sử dụng quy định.',
      };
    }

    if (promo.min_order_amount && subtotal < promo.min_order_amount) {
      return {
        valid: false,
        discountAmount: 0,
        message: `Đơn hàng tối thiểu ${promo.min_order_amount.toLocaleString('vi-VN')} đ mới được áp dụng (Hiện tại: ${subtotal.toLocaleString('vi-VN')} đ).`,
      };
    }

    let calculated = 0;
    if (promo.discount_type === 'percentage') {
      calculated = Math.round((subtotal * promo.discount_value) / 100);
      if (promo.max_discount_amount && calculated > promo.max_discount_amount) {
        calculated = promo.max_discount_amount;
      }
    } else {
      calculated = promo.discount_value;
    }

    calculated = Math.min(calculated, subtotal);

    return {
      valid: true,
      promotion: promo,
      discountAmount: calculated,
      message: `Áp dụng thành công mã ${promo.code}: Giảm ${calculated.toLocaleString('vi-VN')} đ (${promo.name})`,
    };
  },

  // Audit Logs (Audit logs are generated automatically on the server)
  getAuditLogs(): AuditLog[] {
    return loadOrInit('audit_logs', INITIAL_AUDIT_LOGS);
  },
  addAuditLog(_action: string, _entityType: string, _entityId: string, _details: string, _userName?: string): void {
    // No-op on client: audit logs are recorded authoritatively by the backend
  },

  // Retail Sales Orders (Bán hàng & Bán thiết bị tại quầy)
  getRetailOrders(): RetailSaleOrder[] {
    return loadOrInit('retail_orders', INITIAL_RETAIL_ORDERS);
  },
  getRetailOrderById(id: number): RetailSaleOrder | undefined {
    return this.getRetailOrders().find((o) => o.id === id);
  },
  async createRetailOrderAsync(
    orderData: Omit<RetailSaleOrder, 'id' | 'order_code' | 'created_at'>
  ): Promise<RetailSaleOrder> {
    const res = await ApiClient.requestStrict<{
      id: number;
      order_code: string;
      subtotal_amount: number;
      discount_amount: number;
      final_amount: number;
      paid_amount: number;
      debt_amount: number;
    }>('/retail-orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });

    await this.syncFromBackend();
    const synced = this.getRetailOrderById(res.id);
    if (synced) return synced;

    return {
      ...orderData,
      id: res.id,
      order_code: res.order_code,
      subtotal_amount: res.subtotal_amount ?? orderData.subtotal_amount,
      discount_amount: res.discount_amount ?? orderData.discount_amount,
      final_amount: res.final_amount ?? orderData.final_amount,
      paid_amount: res.paid_amount ?? orderData.paid_amount,
      debt_amount: res.debt_amount ?? orderData.debt_amount,
      created_at: new Date().toISOString(),
    };
  },

  async refundRetailOrderAsync(
    orderId: number,
    options: {
      refundReason: string;
      refundAmount: number;
      returnStockToInventory: boolean;
      refundedByName: string;
    }
  ): Promise<RetailSaleOrder> {
    await ApiClient.requestStrict(`/retail-orders/${orderId}/refund`, {
      method: 'POST',
      body: JSON.stringify({
        refund_amount: options.refundAmount,
        refund_reason: options.refundReason,
        return_to_stock: options.returnStockToInventory,
        refunded_by_name: options.refundedByName,
      }),
    });
    await this.syncFromBackend();
    const updated = this.getRetailOrderById(orderId);
    if (!updated) throw new Error('Không tìm thấy hóa đơn sau khi hoàn trả');
    return updated;
  },
};
