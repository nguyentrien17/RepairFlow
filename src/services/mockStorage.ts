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
} from '../types';

const STORAGE_KEY_PREFIX = 'repairflow_';

export const INITIAL_USERS: User[] = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@repairflow.vn',
    full_name: 'Nguyễn Triển (Admin)',
    phone: '0901234567',
    role: 'admin',
    password: 'admin',
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
    password: '123',
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
    password: '123',
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
    password: '123',
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
    password: '123',
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
  terms_intake:
    '1. Quý khách vui lòng sao lưu dữ liệu cá nhân trước khi bàn giao. Cửa hàng không chịu trách nhiệm về dữ liệu phần mềm.\n2. Thiết bị sau khi thông báo hoàn tất, quý khách vui lòng đến nhận trong vòng 30 ngày.\n3. Vui lòng giữ phiếu tiếp nhận để đối chiếu khi nhận máy.',
  terms_warranty:
    '1. Bảo hành miễn phí các lỗi kỹ thuật và linh kiện đã thay thế trong thời hạn cam kết.\n2. Không bảo hành các trường hợp: Rơi vỡ, nứt cấn, ngấm nước, chập cháy do nguồn điện không ổn định hoặc tự ý tháo dỡ tem niêm phong.',
  auto_payment_enabled: true,
  payment_gateway_provider: 'sepay',
  gateway_api_key: 'SP_LIVE_DEMO_KEY_98821102',
  gateway_webhook_secret: 'whsec_repflow_secret_key_8899',
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
    device_password_hint: 'PIN: 9988',
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
    device_password_hint: 'Vẽ hình chữ Z (hoặc 112233)',
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
    device_password_hint: 'macbook2021',
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

// Helper functions for persistent LocalStorage
function loadOrInit<T>(key: string, initialData: T): T {
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

export const StorageService = {
  // Reset all data to factory sample data
  resetToSampleData(): void {
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
  },

  // Settings
  getSettings(): StoreSettings {
    return loadOrInit('settings', INITIAL_SETTINGS);
  },
  saveSettings(settings: StoreSettings): void {
    save('settings', settings);
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
  updateUser(id: number, data: Partial<User>): User | undefined {
    const list = this.getUsers();
    const idx = list.findIndex((u) => u.id === id);
    if (idx === -1) return undefined;
    list[idx] = { ...list[idx], ...data };
    this.saveUsers(list);
    return list[idx];
  },

  // Customers
  getCustomers(): Customer[] {
    return loadOrInit('customers', INITIAL_CUSTOMERS);
  },
  addCustomer(c: Omit<Customer, 'id' | 'code' | 'created_at'>): Customer {
    const list = this.getCustomers();
    const newId = list.length > 0 ? Math.max(...list.map((i) => i.id)) + 1 : 1;
    const code = `KH-${String(newId + 100).padStart(6, '0')}`;
    const newCustomer: Customer = {
      ...c,
      id: newId,
      code,
      created_at: new Date().toISOString(),
    };
    list.unshift(newCustomer);
    save('customers', list);
    this.addAuditLog('CREATE_CUSTOMER', 'customers', code, `Thêm khách hàng mới: ${c.name}`);
    return newCustomer;
  },

  // Devices
  getDevices(): CustomerDevice[] {
    return loadOrInit('devices', INITIAL_DEVICES);
  },
  addDevice(d: Omit<CustomerDevice, 'id' | 'created_at'>): CustomerDevice {
    const list = this.getDevices();
    const newId = list.length > 0 ? Math.max(...list.map((i) => i.id)) + 1 : 1;
    const newDevice: CustomerDevice = {
      ...d,
      id: newId,
      created_at: new Date().toISOString(),
    };
    list.unshift(newDevice);
    save('devices', list);
    return newDevice;
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
  createTicket(data: Omit<RepairTicket, 'id' | 'ticket_code' | 'created_at' | 'updated_at'>): RepairTicket {
    const list = this.getTickets();
    const settings = this.getSettings();
    const newId = list.length > 0 ? Math.max(...list.map((i) => i.id)) + 1 : 1;
    
    // Generate code: SC-YYYYMMDD-XXXX
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const code = `${settings.ticket_prefix || 'SC'}-${dateStr}-${String(newId).padStart(4, '0')}`;

    const newTicket: RepairTicket = {
      ...data,
      id: newId,
      ticket_code: code,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    list.unshift(newTicket);
    save('tickets', list);

    // Initial status history
    this.addStatusHistory(newId, undefined, 'Received', data.created_by_name, 'Tiếp nhận thiết bị mới');
    this.addAuditLog('CREATE_TICKET', 'repair_tickets', code, `Tạo mới phiếu sửa chữa ${code} cho ${data.customer_name}`);

    return newTicket;
  },

  updateTicket(id: number, updates: Partial<RepairTicket>): RepairTicket | undefined {
    const list = this.getTickets();
    const idx = list.findIndex((t) => t.id === id);
    if (idx === -1) return undefined;

    const oldStatus = list[idx].status;

    list[idx] = {
      ...list[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    save('tickets', list);

    if (updates.status && updates.status !== oldStatus) {
      const targetLabel = STATUS_LABELS[updates.status] || updates.status;
      this.addStatusHistory(
        id,
        oldStatus,
        updates.status,
        updates.primary_technician_name || 'Hệ thống',
        updates.cancellation_reason || `Chuyển trạng thái sang ${targetLabel}`
      );
    }

    return list[idx];
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
  addStatusHistory(
    ticketId: number,
    fromStatus: RepairStatus | undefined,
    toStatus: RepairStatus,
    changedBy: string,
    notes?: string,
    changedByRole?: string,
    accountabilityStatement?: string
  ): void {
    const all = loadOrInit('histories', INITIAL_HISTORIES);
    const newId = all.length > 0 ? Math.max(...all.map((i) => i.id)) + 1 : 1;
    all.push({
      id: newId,
      ticket_id: ticketId,
      from_status: fromStatus,
      to_status: toStatus,
      changed_by_name: changedBy,
      notes: cleanStatusText(notes),
      created_at: new Date().toISOString(),
    });
    save('histories', all);
  },

  // Diagnostics
  getDiagnostics(ticketId: number): RepairDiagnostic[] {
    const all = loadOrInit('diagnostics', INITIAL_DIAGNOSTICS);
    return all.filter((d) => d.ticket_id === ticketId);
  },
  addDiagnostic(d: Omit<RepairDiagnostic, 'id' | 'created_at'>): RepairDiagnostic {
    const all = loadOrInit('diagnostics', INITIAL_DIAGNOSTICS);
    const newId = all.length > 0 ? Math.max(...all.map((i) => i.id)) + 1 : 1;
    const newDiag: RepairDiagnostic = {
      ...d,
      id: newId,
      created_at: new Date().toISOString(),
    };
    all.unshift(newDiag);
    save('diagnostics', all);
    return newDiag;
  },

  // Quotes
  getQuotes(ticketId: number): RepairQuote[] {
    const all = loadOrInit('quotes', INITIAL_QUOTES);
    return all.filter((q) => q.ticket_id === ticketId);
  },
  addQuote(q: Omit<RepairQuote, 'id' | 'quote_code' | 'created_at'>): RepairQuote {
    const all = loadOrInit('quotes', INITIAL_QUOTES);
    const newId = all.length > 0 ? Math.max(...all.map((i) => i.id)) + 1 : 1;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const code = `BG-${dateStr}-${String(newId).padStart(4, '0')}`;
    const newQuote: RepairQuote = {
      ...q,
      id: newId,
      quote_code: code,
      created_at: new Date().toISOString(),
    };
    all.unshift(newQuote);
    save('quotes', all);
    return newQuote;
  },
  updateQuoteStatus(quoteId: number, status: RepairQuote['status'], confirmedBy?: string, reason?: string): void {
    const all = loadOrInit('quotes', INITIAL_QUOTES);
    const idx = all.findIndex((q) => q.id === quoteId);
    if (idx !== -1) {
      all[idx].status = status;
      if (confirmedBy) all[idx].confirmed_by = confirmedBy;
      if (reason) all[idx].rejection_reason = reason;
      all[idx].confirmed_at = new Date().toISOString();
      save('quotes', all);
    }
  },

  // QC Checklists
  getChecklist(ticketId: number): QCChecklist | undefined {
    const all = loadOrInit('checklists', INITIAL_CHECKLISTS);
    return all.find((c) => c.ticket_id === ticketId);
  },
  saveChecklist(c: Omit<QCChecklist, 'id' | 'created_at'>): QCChecklist {
    const all = loadOrInit('checklists', INITIAL_CHECKLISTS);
    const idx = all.findIndex((item) => item.ticket_id === c.ticket_id);
    const newId = all.length > 0 ? Math.max(...all.map((i) => i.id)) + 1 : 1;
    const entry: QCChecklist = {
      ...c,
      id: idx !== -1 ? all[idx].id : newId,
      created_at: new Date().toISOString(),
    };
    if (idx !== -1) {
      all[idx] = entry;
    } else {
      all.unshift(entry);
    }
    save('checklists', all);
    return entry;
  },

  // Inventory & Parts
  getParts(): Part[] {
    return loadOrInit('parts', INITIAL_PARTS);
  },
  addPart(p: Omit<Part, 'id' | 'created_at'>): Part {
    const list = this.getParts();
    const newId = list.length > 0 ? Math.max(...list.map((i) => i.id)) + 1 : 1;
    const newPart: Part = { ...p, id: newId, created_at: new Date().toISOString() };
    list.unshift(newPart);
    save('parts', list);
    this.addAuditLog('CREATE_PART', 'parts', p.sku, `Thêm linh kiện mới: ${p.name} (SL: ${p.stock_quantity})`);
    return newPart;
  },
  updatePart(id: number, updates: Partial<Part>): Part {
    const list = this.getParts();
    const idx = list.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Không tìm thấy linh kiện');
    
    // If supplier is updated, fill supplier_name if supplier_id changed
    if (updates.supplier_id && !updates.supplier_name) {
      const supp = this.getSuppliers().find((s) => s.id === updates.supplier_id);
      if (supp) updates.supplier_name = supp.name;
    }

    const updated: Part = { ...list[idx], ...updates };
    list[idx] = updated;
    save('parts', list);
    this.addAuditLog('UPDATE_PART', 'parts', updated.sku, `Cập nhật thông tin linh kiện: ${updated.name}`);
    return updated;
  },
  updatePartStock(partId: number, delta: number): void {
    const list = this.getParts();
    const idx = list.findIndex((p) => p.id === partId);
    if (idx !== -1) {
      list[idx].stock_quantity = Math.max(0, list[idx].stock_quantity + delta);
      save('parts', list);
    }
  },

  // Suppliers
  getSuppliers(): Supplier[] {
    return loadOrInit('suppliers', INITIAL_SUPPLIERS);
  },
  addSupplier(data: Omit<Supplier, 'id' | 'code'>): Supplier {
    const list = this.getSuppliers();
    const newId = list.length > 0 ? Math.max(...list.map((i) => i.id)) + 1 : 1;
    const code = `NCC-${String(newId).padStart(3, '0')}`;
    const newSupplier: Supplier = {
      ...data,
      id: newId,
      code,
      is_active: data.is_active ?? true,
    };
    list.unshift(newSupplier);
    save('suppliers', list);
    this.addAuditLog('CREATE_SUPPLIER', 'suppliers', code, `Thêm nhà cung cấp mới: ${data.name}`);
    return newSupplier;
  },
  updateSupplier(id: number, updates: Partial<Supplier>): Supplier {
    const list = this.getSuppliers();
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Không tìm thấy nhà cung cấp');
    const updated: Supplier = { ...list[idx], ...updates };
    list[idx] = updated;
    save('suppliers', list);
    this.addAuditLog('UPDATE_SUPPLIER', 'suppliers', updated.code, `Cập nhật thông tin nhà cung cấp: ${updated.name}`);
    return updated;
  },
  deleteSupplier(id: number): boolean {
    const list = this.getSuppliers();
    const target = list.find((s) => s.id === id);
    if (!target) return false;
    const filtered = list.filter((s) => s.id !== id);
    save('suppliers', filtered);
    this.addAuditLog('DELETE_SUPPLIER', 'suppliers', target.code, `Xóa nhà cung cấp: ${target.name}`);
    return true;
  },

  // Inventory Batches / Lô đợt nhập kho (UC-15, UC-16)
  getBatches(partId?: number): InventoryBatch[] {
    const all = loadOrInit('part_batches', INITIAL_BATCHES);
    if (partId) return all.filter((b) => b.part_id === partId);
    return all;
  },
  updateBatchRemainingQuantity(batchId: number, delta: number): void {
    const all = loadOrInit('part_batches', INITIAL_BATCHES);
    const idx = all.findIndex((b) => b.id === batchId);
    if (idx !== -1) {
      all[idx].remaining_quantity = Math.max(0, all[idx].remaining_quantity + delta);
      save('part_batches', all);
    }
  },
  addInventoryBatch(data: {
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
  }): InventoryBatch {
    const all = loadOrInit('part_batches', INITIAL_BATCHES);
    const newId = all.length > 0 ? Math.max(...all.map((b) => b.id)) + 1 : 1;

    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const code = data.custom_batch_code?.trim() || `LOT-${todayStr}-${String(newId).padStart(3, '0')}`;

    const newBatch: InventoryBatch = {
      id: newId,
      batch_code: code,
      part_id: data.part_id,
      part_name: data.part_name,
      sku: data.sku,
      supplier_id: data.supplier_id,
      supplier_name: data.supplier_name,
      import_quantity: Number(data.import_quantity),
      remaining_quantity: Number(data.import_quantity),
      cost_price: Number(data.cost_price),
      selling_price: Number(data.selling_price),
      import_date: data.import_date || new Date().toISOString().slice(0, 10),
      expiry_date: data.expiry_date,
      created_by_name: data.created_by_name || 'Hệ thống',
      notes: data.notes,
      created_at: new Date().toISOString(),
    };

    all.unshift(newBatch);
    save('part_batches', all);

    // Increase total part stock
    this.updatePartStock(data.part_id, Number(data.import_quantity));

    // Sync part's cost_price / selling_price / supplier if updated in batch
    this.updatePart(data.part_id, {
      cost_price: Number(data.cost_price),
      selling_price: Number(data.selling_price),
      supplier_id: data.supplier_id,
      supplier_name: data.supplier_name,
    });

    this.addAuditLog(
      'IMPORT_BATCH',
      'inventory_batches',
      code,
      `Nhập kho đợt ${code}: +${data.import_quantity}x ${data.part_name} (Giá vốn: ${data.cost_price.toLocaleString()}đ)`
    );

    return newBatch;
  },
  updateInventoryBatch(batchId: number, updates: Partial<InventoryBatch>): InventoryBatch {
    const all = loadOrInit('part_batches', INITIAL_BATCHES);
    const idx = all.findIndex((b) => b.id === batchId);
    if (idx === -1) throw new Error('Không tìm thấy thông tin đợt nhập kho');

    const oldBatch = all[idx];
    const updatedBatch: InventoryBatch = {
      ...oldBatch,
      ...updates,
      import_quantity: updates.import_quantity !== undefined ? Number(updates.import_quantity) : oldBatch.import_quantity,
      remaining_quantity: updates.remaining_quantity !== undefined ? Number(updates.remaining_quantity) : oldBatch.remaining_quantity,
      cost_price: updates.cost_price !== undefined ? Number(updates.cost_price) : oldBatch.cost_price,
      selling_price: updates.selling_price !== undefined ? Number(updates.selling_price) : oldBatch.selling_price,
    };

    if (updates.supplier_id && !updates.supplier_name) {
      const supp = this.getSuppliers().find((s) => s.id === updates.supplier_id);
      if (supp) updatedBatch.supplier_name = supp.name;
    }

    all[idx] = updatedBatch;
    save('part_batches', all);

    // Sync total stock for part if remaining_quantity changed
    const allPartBatches = all.filter((b) => b.part_id === updatedBatch.part_id);
    const totalPartStock = allPartBatches.reduce((acc, b) => acc + b.remaining_quantity, 0);
    const parts = this.getParts();
    const pIdx = parts.findIndex((p) => p.id === updatedBatch.part_id);
    if (pIdx !== -1) {
      parts[pIdx].stock_quantity = totalPartStock;
      parts[pIdx].cost_price = updatedBatch.cost_price;
      parts[pIdx].selling_price = updatedBatch.selling_price;
      save('parts', parts);
    }

    this.addAuditLog(
      'UPDATE_BATCH',
      'inventory_batches',
      updatedBatch.batch_code,
      `Cập nhật đợt nhập kho ${updatedBatch.batch_code}: Tồn kho ${updatedBatch.remaining_quantity} cái, Giá vốn: ${updatedBatch.cost_price.toLocaleString()}đ, Giá bán: ${updatedBatch.selling_price.toLocaleString()}đ`
    );

    return updatedBatch;
  },
  deleteInventoryBatch(batchId: number): boolean {
    const all = loadOrInit('part_batches', INITIAL_BATCHES);
    const target = all.find((b) => b.id === batchId);
    if (!target) return false;

    const filtered = all.filter((b) => b.id !== batchId);
    save('part_batches', filtered);

    // Recalculate total part stock
    const remainingPartBatches = filtered.filter((b) => b.part_id === target.part_id);
    const totalPartStock = remainingPartBatches.reduce((acc, b) => acc + b.remaining_quantity, 0);
    const parts = this.getParts();
    const pIdx = parts.findIndex((p) => p.id === target.part_id);
    if (pIdx !== -1) {
      parts[pIdx].stock_quantity = totalPartStock;
      save('parts', parts);
    }

    this.addAuditLog('DELETE_BATCH', 'inventory_batches', target.batch_code, `Xóa đợt nhập kho ${target.batch_code} của linh kiện ${target.part_name}`);
    return true;
  },

  // Repair Part Usages (Xuất & Hoàn trả linh kiện cho phiếu sửa chữa - UC-17)
  getPartUsages(ticketId?: number): RepairPartUsage[] {
    const all = loadOrInit('part_usages', INITIAL_PART_USAGES);
    if (ticketId) return all.filter((u) => u.ticket_id === ticketId);
    return all;
  },
  addPartUsage(usageData: Omit<RepairPartUsage, 'id' | 'created_at' | 'status'>): RepairPartUsage {
    const all = loadOrInit('part_usages', INITIAL_PART_USAGES);
    const newId = all.length > 0 ? Math.max(...all.map((i) => i.id)) + 1 : 1;
    
    // Deduct stock quantity
    const part = this.getParts().find((p) => p.id === usageData.part_id);
    if (!part) throw new Error('Không tìm thấy thông tin linh kiện');
    if (part.stock_quantity < usageData.quantity) {
      throw new Error(`Số lượng tồn kho không đủ (Hiện tại còn: ${part.stock_quantity}, Yêu cầu: ${usageData.quantity})`);
    }

    if (usageData.batch_id) {
      const batches = this.getBatches();
      const batch = batches.find((b) => b.id === usageData.batch_id);
      if (batch && batch.remaining_quantity < usageData.quantity) {
        throw new Error(`Số lượng đợt nhập [${batch.batch_code}] không đủ (Còn: ${batch.remaining_quantity}, Yêu cầu: ${usageData.quantity})`);
      }
      this.updateBatchRemainingQuantity(usageData.batch_id, -usageData.quantity);
    }

    this.updatePartStock(part.id, -usageData.quantity);

    const newUsage: RepairPartUsage = {
      ...usageData,
      id: newId,
      status: 'Used',
      created_at: new Date().toISOString(),
    };

    all.unshift(newUsage);
    save('part_usages', all);

    // Audit log
    const ticket = this.getTicketById(usageData.ticket_id);
    const ticketCode = ticket ? ticket.ticket_code : `ID #${usageData.ticket_id}`;
    const batchInfo = usageData.batch_code ? ` [Đợt ${usageData.batch_code}]` : '';
    this.addAuditLog(
      'EXPORT_PART_TO_TICKET',
      'repair_part_usages',
      ticketCode,
      `Xuất ${usageData.quantity}x ${usageData.part_name}${batchInfo} (${usageData.selling_price.toLocaleString()}đ/cái) cho phiếu ${ticketCode} bởi ${usageData.technician_name}`
    );

    return newUsage;
  },
  returnPartUsage(usageId: number, technicianName: string): boolean {
    const all = loadOrInit('part_usages', INITIAL_PART_USAGES);
    const idx = all.findIndex((u) => u.id === usageId);
    if (idx === -1) return false;

    const usage = all[idx];
    if (usage.status === 'Returned') {
      throw new Error('Linh kiện này đã được hoàn trả lại kho trước đó.');
    }

    // Restore stock
    this.updatePartStock(usage.part_id, usage.quantity);

    // Restore batch stock if batch_id is present
    if (usage.batch_id) {
      this.updateBatchRemainingQuantity(usage.batch_id, usage.quantity);
    }

    // Update status to Returned
    all[idx].status = 'Returned';
    save('part_usages', all);

    // Audit log
    const ticket = this.getTicketById(usage.ticket_id);
    const ticketCode = ticket ? ticket.ticket_code : `ID #${usage.ticket_id}`;
    const batchInfo = usage.batch_code ? ` [Đợt ${usage.batch_code}]` : '';
    this.addAuditLog(
      'RETURN_PART_TO_STOCK',
      'repair_part_usages',
      ticketCode,
      `Hoàn trả kho ${usage.quantity}x ${usage.part_name}${batchInfo} từ phiếu ${ticketCode} bởi ${technicianName}`
    );

    return true;
  },

  // Payments
  getPayments(ticketId?: number): Payment[] {
    const all = loadOrInit('payments', INITIAL_PAYMENTS);
    if (ticketId) return all.filter((p) => p.ticket_id === ticketId);
    return all;
  },
  addPayment(data: Omit<Payment, 'id' | 'payment_code' | 'created_at'>): Payment {
    const all = loadOrInit('payments', INITIAL_PAYMENTS);
    const newId = all.length > 0 ? Math.max(...all.map((i) => i.id)) + 1 : 1;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const code = `PT-${dateStr}-${String(newId).padStart(4, '0')}`;
    const newPayment: Payment = {
      ...data,
      id: newId,
      payment_code: code,
      created_at: new Date().toISOString(),
    };
    all.unshift(newPayment);
    save('payments', all);

    // Safety sanitization: Never allow negative payment
    const validAmount = Math.max(0, data.amount);

    // Update ticket debt and paid
    const ticket = this.getTicketById(data.ticket_id);
    if (ticket) {
      // If ticket has a final_amount, cannot pay more than remaining debt
      const maxPayable = ticket.debt_amount > 0 ? ticket.debt_amount : (ticket.final_amount > 0 ? 0 : validAmount);
      const effectiveAmount = ticket.final_amount > 0 ? Math.min(validAmount, ticket.debt_amount) : validAmount;
      const newPaid = ticket.paid_amount + effectiveAmount;
      const newDebt = Math.max(0, ticket.final_amount - newPaid);
      this.updateTicket(ticket.id, {
        paid_amount: newPaid,
        debt_amount: newDebt,
      });
    }

    this.addAuditLog('PAYMENT', 'payments', code, `Thu tiền ${data.amount.toLocaleString()} đ từ ${data.customer_name}`);
    return newPayment;
  },

  // Automated Payment Webhook Processor (VietQR / SmartPOS)
  processPaymentWebhook(payload: {
    amount: number;
    content: string;
    transaction_id?: string;
    bank_brand?: string;
    gateway_provider?: string;
    payment_method?: PaymentMethod;
    card_brand?: string;
    pos_terminal?: string;
  }): { success: boolean; message: string; payment?: Payment; ticket?: RepairTicket } {
    const tickets = this.getTickets();
    
    // Extract ticket code: regex pattern SC-YYYYMMDD-XXXX
    const match = payload.content.match(/SC-\d{8}-\d{4}/i);
    let matchedTicket: RepairTicket | undefined;
    if (match) {
      matchedTicket = tickets.find((t) => t.ticket_code.toLowerCase() === match[0].toLowerCase());
    }
    
    // Fuzzy matching if not matched by strict regex
    if (!matchedTicket) {
      matchedTicket = tickets.find((t) => payload.content.toLowerCase().includes(t.ticket_code.toLowerCase()));
    }

    if (!matchedTicket) {
      return {
        success: false,
        message: `Không tìm thấy phiếu sửa chữa tương ứng với nội dung: "${payload.content}"`,
      };
    }

    const txRef = payload.transaction_id || `TXN${Date.now()}`;
    const method: PaymentMethod = payload.payment_method || (payload.card_brand ? 'POS_Card' : 'Bank_Transfer');
    const isPOS = method === 'POS_Card';

    const newPayment = this.addPayment({
      ticket_id: matchedTicket.id,
      ticket_code: matchedTicket.ticket_code,
      customer_name: matchedTicket.customer_name,
      amount: payload.amount,
      payment_method: method,
      payment_type: matchedTicket.debt_amount <= payload.amount ? 'Final' : 'Installment',
      transaction_ref: txRef,
      cashier_name: isPOS
        ? `SmartPOS (${payload.pos_terminal || 'Quầy thu ngân'})`
        : `Cổng ${payload.gateway_provider || 'VietQR'} Auto-Webhook`,
      notes: isPOS
        ? `Tự động xác nhận quẹt thẻ SmartPOS [${payload.card_brand || 'Thẻ ATM/Visa'}] qua máy ${payload.pos_terminal || 'POS-01'}`
        : `Tự động nhận diện biến động số dư từ ${payload.bank_brand || 'Ngân hàng'}: "${payload.content}"`,
      is_auto_verified: true,
      gateway_provider: payload.gateway_provider || (isPOS ? 'VNPAY_POS' : 'SePAY'),
      card_brand: payload.card_brand,
    });

    const updatedTicket = this.getTicketById(matchedTicket.id);

    this.addAuditLog(
      'AUTO_PAYMENT_WEBHOOK',
      'payments',
      newPayment.payment_code,
      `Hệ thống tự động xác nhận thu tiền ${payload.amount.toLocaleString()} đ qua ${isPOS ? 'Máy SmartPOS' : 'VietQR Webhook'} cho phiếu ${matchedTicket.ticket_code}`
    );

    // Trigger window event for real-time reactivity across active tabs
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('repairflow_auto_payment', {
          detail: { payment: newPayment, ticket: updatedTicket },
        })
      );
    }

    return {
      success: true,
      message: `Đã tự động xác nhận thanh toán ${payload.amount.toLocaleString()} đ cho phiếu ${matchedTicket.ticket_code}!`,
      payment: newPayment,
      ticket: updatedTicket,
    };
  },

  // Warranties
  getWarranties(): Warranty[] {
    return loadOrInit('warranties', INITIAL_WARRANTIES);
  },
  addWarranty(ticket: RepairTicket, days = 90): Warranty {
    const all = this.getWarranties();
    const newId = all.length > 0 ? Math.max(...all.map((i) => i.id)) + 1 : 1;
    const now = new Date();
    const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const code = `BH-${dateStr}-${String(newId).padStart(4, '0')}`;

    const newWarranty: Warranty = {
      id: newId,
      warranty_code: code,
      ticket_id: ticket.id,
      ticket_code: ticket.ticket_code,
      device_summary: `${ticket.device_brand} ${ticket.device_model}`,
      customer_name: ticket.customer_name,
      customer_phone: ticket.customer_phone,
      start_date: now.toISOString().slice(0, 10),
      end_date: endDate.toISOString().slice(0, 10),
      terms: `Bảo hành ${days} ngày cho dịch vụ & linh kiện đã thay thế.`,
      status: 'Active',
      created_at: now.toISOString(),
    };

    all.unshift(newWarranty);
    save('warranties', all);
    return newWarranty;
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
  addPromotion(data: Omit<Promotion, 'id' | 'created_at' | 'usage_count'>): Promotion {
    const all = this.getPromotions();
    const cleanCode = data.code.trim().toUpperCase();
    if (all.some((p) => p.code.toUpperCase() === cleanCode)) {
      throw new Error(`Mã ưu đãi "${cleanCode}" đã tồn tại trên hệ thống! Vui lòng chọn mã khác.`);
    }
    const newId = all.length > 0 ? Math.max(...all.map((p) => p.id)) + 1 : 1;
    const newPromo: Promotion = {
      ...data,
      id: newId,
      code: cleanCode,
      usage_count: 0,
      created_at: new Date().toISOString(),
    };
    all.unshift(newPromo);
    save('promotions', all);
    this.addAuditLog('CREATE_PROMO', 'promotions', newPromo.code, `Tạo mã ưu đãi mới: ${newPromo.code} - ${newPromo.name}`);
    return newPromo;
  },
  updatePromotion(id: number, data: Partial<Promotion>): Promotion {
    const all = this.getPromotions();
    const idx = all.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Không tìm thấy chương trình ưu đãi');
    
    if (data.code) {
      const cleanCode = data.code.trim().toUpperCase();
      const existing = all.find((p) => p.code.toUpperCase() === cleanCode && p.id !== id);
      if (existing) {
        throw new Error(`Mã ưu đãi "${cleanCode}" đã bị trùng với chương trình khác!`);
      }
      data.code = cleanCode;
    }

    const updated = {
      ...all[idx],
      ...data,
    };
    all[idx] = updated;
    save('promotions', all);
    this.addAuditLog('UPDATE_PROMO', 'promotions', updated.code, `Cập nhật chương trình ưu đãi ${updated.code}`);
    return updated;
  },
  deletePromotion(id: number): boolean {
    const all = this.getPromotions();
    const target = all.find((p) => p.id === id);
    if (!target) return false;
    const filtered = all.filter((p) => p.id !== id);
    save('promotions', filtered);
    this.addAuditLog('DELETE_PROMO', 'promotions', target.code, `Xóa mã ưu đãi: ${target.code}`);
    return true;
  },
  validateAndCalculatePromotion(code: string, subtotal: number): {
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
      return { valid: false, discountAmount: 0, message: `Mã ưu đãi "${code.trim().toUpperCase()}" không tồn tại hoặc đã hết hiệu lực.` };
    }
    if (!promo.is_active) {
      return { valid: false, discountAmount: 0, message: `Chương trình ưu đãi "${promo.code}" đang tạm ngưng áp dụng.` };
    }

    // Check validity date
    const today = new Date().toISOString().slice(0, 10);
    if (promo.start_date && today < promo.start_date) {
      return { valid: false, discountAmount: 0, message: `Mã ưu đãi có hiệu lực từ ngày ${promo.start_date}.` };
    }
    if (promo.end_date && today > promo.end_date) {
      return { valid: false, discountAmount: 0, message: `Mã ưu đãi đã hết hạn sử dụng (${promo.end_date}).` };
    }

    // Check usage limit
    if (promo.usage_limit && promo.usage_count >= promo.usage_limit) {
      return { valid: false, discountAmount: 0, message: 'Chương trình ưu đãi này đã hết lượt sử dụng quy định.' };
    }

    // Check min order
    if (promo.min_order_amount && subtotal < promo.min_order_amount) {
      return {
        valid: false,
        discountAmount: 0,
        message: `Đơn hàng tối thiểu ${promo.min_order_amount.toLocaleString('vi-VN')} đ mới được áp dụng (Hiện tại: ${subtotal.toLocaleString('vi-VN')} đ).`,
      };
    }

    // Calculate discount amount
    let calculated = 0;
    if (promo.discount_type === 'percentage') {
      calculated = Math.round((subtotal * promo.discount_value) / 100);
      if (promo.max_discount_amount && calculated > promo.max_discount_amount) {
        calculated = promo.max_discount_amount;
      }
    } else {
      calculated = promo.discount_value;
    }

    // Cannot exceed total
    calculated = Math.min(calculated, subtotal);

    return {
      valid: true,
      promotion: promo,
      discountAmount: calculated,
      message: `Áp dụng thành công mã ${promo.code}: Giảm ${calculated.toLocaleString('vi-VN')} đ (${promo.name})`,
    };
  },
  recordPromotionUsage(code: string): void {
    const promo = this.getPromotionByCode(code);
    if (!promo) return;
    this.updatePromotion(promo.id, { usage_count: promo.usage_count + 1 });
  },

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    return loadOrInit('audit_logs', INITIAL_AUDIT_LOGS);
  },
  addAuditLog(action: string, entityType: string, entityId: string, details: string, userName?: string): void {
    const all = loadOrInit('audit_logs', INITIAL_AUDIT_LOGS);
    const newId = all.length > 0 ? Math.max(...all.map((i) => i.id)) + 1 : 1;
    // Ensure passwords or secret codes are never recorded in audit logs
    const sanitizedDetails = details.replace(/(?:mật khẩu|pass|pin|password)[^,.\n]*/gi, '[BẢO MẬT]');
    all.unshift({
      id: newId,
      user_name: userName || 'Người dùng',
      action,
      entity_type: entityType,
      entity_id: entityId,
      details: sanitizedDetails,
      created_at: new Date().toISOString(),
    });
    save('audit_logs', all.slice(0, 200)); // Keep last 200 logs
  },
};
