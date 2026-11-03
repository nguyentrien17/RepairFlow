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
  DeliveryRecord,
  Warranty,
  StoreSettings,
  AuditLog,
  RepairStatus,
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
    full_name: 'Trần Thị Thu Hà (Lễ tân)',
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
    email: 'thungan@repairflow.vn',
    full_name: 'Phạm Minh Anh (Thu ngân)',
    phone: '0945678901',
    role: 'cashier',
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
    save('tickets', INITIAL_TICKETS);
    save('histories', INITIAL_HISTORIES);
    save('diagnostics', INITIAL_DIAGNOSTICS);
    save('quotes', INITIAL_QUOTES);
    save('checklists', INITIAL_CHECKLISTS);
    save('payments', INITIAL_PAYMENTS);
    save('warranties', INITIAL_WARRANTIES);
    save('audit_logs', INITIAL_AUDIT_LOGS);
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
      this.addStatusHistory(
        id,
        oldStatus,
        updates.status,
        updates.primary_technician_name || 'Hệ thống',
        updates.cancellation_reason || `Chuyển trạng thái sang ${updates.status}`
      );
    }

    return list[idx];
  },

  // Status history
  getStatusHistories(ticketId: number): RepairStatusHistory[] {
    const all = loadOrInit('histories', INITIAL_HISTORIES);
    return all.filter((h) => h.ticket_id === ticketId);
  },
  addStatusHistory(
    ticketId: number,
    fromStatus: RepairStatus | undefined,
    toStatus: RepairStatus,
    changedBy: string,
    notes?: string
  ): void {
    const all = loadOrInit('histories', INITIAL_HISTORIES);
    const newId = all.length > 0 ? Math.max(...all.map((i) => i.id)) + 1 : 1;
    all.push({
      id: newId,
      ticket_id: ticketId,
      from_status: fromStatus,
      to_status: toStatus,
      changed_by_name: changedBy,
      notes,
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
    return newPart;
  },
  updatePartStock(partId: number, delta: number): void {
    const list = this.getParts();
    const idx = list.findIndex((p) => p.id === partId);
    if (idx !== -1) {
      list[idx].stock_quantity = Math.max(0, list[idx].stock_quantity + delta);
      save('parts', list);
    }
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

    // Update ticket debt and paid
    const ticket = this.getTicketById(data.ticket_id);
    if (ticket) {
      const newPaid = ticket.paid_amount + data.amount;
      const newDebt = Math.max(0, ticket.final_amount - newPaid);
      this.updateTicket(ticket.id, {
        paid_amount: newPaid,
        debt_amount: newDebt,
      });
    }

    this.addAuditLog('PAYMENT', 'payments', code, `Thu tiền ${data.amount.toLocaleString()} đ từ ${data.customer_name}`);
    return newPayment;
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

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    return loadOrInit('audit_logs', INITIAL_AUDIT_LOGS);
  },
  addAuditLog(action: string, entityType: string, entityId: string, details: string): void {
    const all = loadOrInit('audit_logs', INITIAL_AUDIT_LOGS);
    const newId = all.length > 0 ? Math.max(...all.map((i) => i.id)) + 1 : 1;
    all.unshift({
      id: newId,
      user_name: 'Người dùng',
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
      created_at: new Date().toISOString(),
    });
    save('audit_logs', all.slice(0, 200)); // Keep last 200 logs
  },
};
