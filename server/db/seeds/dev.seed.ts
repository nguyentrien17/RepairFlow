import { eq, isNull, or, sql } from 'drizzle-orm';
import { db, withTransaction } from '../pool';
import {
  storeSettings,
  users,
  customers,
  deviceCategories,
  deviceBrands,
  customerDevices,
  suppliers,
  parts,
  inventoryBatches,
  promotions,
  repairTickets,
  repairStatusHistories,
  repairDiagnostics,
  repairQuotes,
  repairQuoteItems,
  qcChecklists,
  repairPartUsages,
  payments,
  warranties,
  retailSaleOrders,
  retailSaleOrderItems,
  auditLogs,
  codeSequences,
} from '../schema';
import { hashPassword, encryptDevicePassword } from '../../utils/crypto';
import { DEFAULT_STORE_SETTINGS } from '../../../shared/constants';

export async function seedDevelopmentData(forceReset = false): Promise<void> {
  if (!forceReset) {
    const existing = await db.select({ cnt: sql<number>`COUNT(*)` }).from(users);
    if (existing.length > 0 && Number(existing[0].cnt) > 0) {
      // Ensure any legacy users with empty password_hash get migrated (P0-2)
      const unhashed = await db
        .select({ id: users.id, username: users.username })
        .from(users)
        .where(or(eq(users.password_hash, ''), isNull(users.password_hash)));
      for (const u of unhashed) {
        const defaultPass = u.username === 'admin' ? 'Admin@123' : 'Staff@2026';
        await withTransaction(async (tx) => {
          await tx
            .update(users)
            .set({ password_hash: hashPassword(defaultPass), must_change_password: 1 })
            .where(eq(users.id, u.id));
        });
      }
      return;
    }
  }

  await withTransaction(async (tx) => {
    if (forceReset) {
      await tx.delete(retailSaleOrderItems);
      await tx.delete(retailSaleOrders);
      await tx.delete(repairQuoteItems);
      await tx.delete(repairQuotes);
      await tx.delete(qcChecklists);
      await tx.delete(repairPartUsages);
      await tx.delete(repairDiagnostics);
      await tx.delete(repairStatusHistories);
      await tx.delete(payments);
      await tx.delete(warranties);
      await tx.delete(repairTickets);
      await tx.delete(inventoryBatches);
      await tx.delete(parts);
      await tx.delete(suppliers);
      await tx.delete(customerDevices);
      await tx.delete(deviceBrands);
      await tx.delete(deviceCategories);
      await tx.delete(customers);
      await tx.delete(promotions);
      await tx.delete(auditLogs);
      await tx.delete(users);
      await tx.delete(storeSettings);
      await tx.delete(codeSequences);
    }

    // 1. Store Settings
    const s = DEFAULT_STORE_SETTINGS;
    await tx.insert(storeSettings).values({
      id: 1,
      store_name: s.store_name,
      store_slogan: s.store_slogan,
      phone: s.phone,
      email: s.email,
      address: s.address,
      tax_number: s.tax_number,
      bank_name: s.bank_name,
      bank_account_no: s.bank_account_no,
      bank_account_name: s.bank_account_name,
      ticket_prefix: s.ticket_prefix,
      default_warranty_days: s.default_warranty_days,
      default_return_days: s.default_return_days ?? 15,
      terms_intake: s.terms_intake,
      terms_warranty: s.terms_warranty,
      auto_payment_enabled: 1,
      payment_gateway_provider: 'sepay',
      gateway_api_key: 'SP_LIVE_DEMO_KEY_98821102',
      gateway_webhook_secret: 'whsec_repflow_secret_key_8899',
      pos_terminal_id: s.pos_terminal_id || 'VNPAY_POS_Q1_01',
      pos_ip_address: s.pos_ip_address || '192.168.1.188:8080',
    });

    // 2. Users (Hashed passwords with scrypt - P0-2)
    const seedUsers = [
      {
        id: 1,
        username: 'admin',
        email: 'admin@repairflow.vn',
        full_name: 'Nguyễn Triển (Admin)',
        phone: '0901234567',
        role: 'admin',
        plainPass: 'Admin@123',
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
        plainPass: 'Manager@123',
        created_at: '2026-01-05T08:00:00Z',
      },
      {
        id: 3,
        username: 'letan',
        email: 'letan@repairflow.vn',
        full_name: 'Trần Thị Thu Hà (Lễ tân & Thu ngân)',
        phone: '0923456789',
        role: 'receptionist',
        plainPass: 'Letan@123',
        created_at: '2026-01-10T08:00:00Z',
      },
      {
        id: 4,
        username: 'kythuat',
        email: 'kythuat@repairflow.vn',
        full_name: 'Lê Hoàng Nam (Kỹ thuật viên Trưởng)',
        phone: '0934567890',
        role: 'technician',
        plainPass: 'Kythuat@123',
        created_at: '2026-01-15T08:00:00Z',
      },
      {
        id: 5,
        username: 'thungan',
        email: 'letan2@repairflow.vn',
        full_name: 'Phạm Minh Anh (Lễ tân & Thu ngân 2)',
        phone: '0945678901',
        role: 'receptionist',
        plainPass: 'Thungan@123',
        created_at: '2026-02-01T08:00:00Z',
      },
    ];

    for (const u of seedUsers) {
      await tx.insert(users).values({
        id: u.id,
        username: u.username,
        email: u.email,
        full_name: u.full_name,
        phone: u.phone,
        role: u.role,
        password_hash: hashPassword(u.plainPass),
        must_change_password: 0,
        is_active: 1,
        created_at: u.created_at,
        last_login_at: u.last_login_at || null,
      });
    }

    // 3. Customers
    const customerList = [
      {
        id: 1,
        code: 'KH-000101',
        name: 'Công ty Cổ phần Công nghệ VinaTech',
        phone: '0987654321',
        email: 'it@vinatech.com.vn',
        address: 'Tầng 8, Tòa nhà Vincom, 72 Lê Thánh Tôn, Q.1, TP.HCM',
        customer_type: 'company',
        tax_number: '0309988776',
        current_debt: 850000,
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
        tax_number: null,
        current_debt: 1450000,
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
        tax_number: null,
        current_debt: 0,
        notes: 'Cần xử lý gấp thiết bị phục vụ công việc',
        created_at: '2026-03-01T14:30:00Z',
      },
    ];
    for (const c of customerList) {
      await tx.insert(customers).values(c);
    }

    // 4. Categories & Brands
    const categoryList = [
      { id: 1, code: 'laptop', name: 'Laptop', is_active: 1 },
      { id: 2, code: 'pc', name: 'Máy tính để bàn (PC)', is_active: 1 },
      { id: 3, code: 'phone', name: 'Điện thoại di động', is_active: 1 },
      { id: 4, code: 'tablet', name: 'Máy tính bảng', is_active: 1 },
      { id: 5, code: 'printer', name: 'Máy in / Scan', is_active: 1 },
      { id: 6, code: 'monitor', name: 'Màn hình máy tính', is_active: 1 },
      { id: 7, code: 'other', name: 'Thiết bị điện tử khác', is_active: 1 },
    ];
    for (const cat of categoryList) {
      await tx.insert(deviceCategories).values(cat);
    }

    const brandNames = ['Apple', 'Dell', 'Asus', 'HP', 'Lenovo', 'Samsung', 'Canon', 'LG'];
    for (let i = 0; i < brandNames.length; i++) {
      await tx.insert(deviceBrands).values({ id: i + 1, name: brandNames[i], is_active: 1 });
    }

    // 5. Customer Devices
    const deviceList = [
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
        imei: null,
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
        serial_number: 'DNQX1234M1N9',
        imei: '356789123456789',
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
        imei: null,
        color: 'Xám không gian (Space Gray)',
        notes: 'Mặt đáy trầy xước nhẹ ở góc trái',
        created_at: '2026-03-01T14:35:00Z',
      },
    ];
    for (const d of deviceList) {
      await tx.insert(customerDevices).values(d);
    }

    // 6. Suppliers, Parts, Batches
    const supplierList = [
      {
        id: 1,
        code: 'NCC-001',
        name: 'Công ty TNHH Phân Phối Linh Kiện Công Nghệ Sài Gòn',
        phone: '028.3999.7777',
        email: 'kinhdoanh@saigonparts.vn',
        address: '158 Bùi Thị Xuân, P. Phạm Ngũ Lão, Q.1, TP.HCM',
        is_active: 1,
      },
      {
        id: 2,
        code: 'NCC-002',
        name: 'Tổng Kho Phụ Kiện & Màn Hình Apple Việt Mỹ',
        phone: '0909.888.999',
        email: 'support@vietmyapple.com',
        address: '42 Trần Quang Khải, P. Tân Định, Q.1, TP.HCM',
        is_active: 1,
      },
      {
        id: 3,
        code: 'NCC-003',
        name: 'Công ty TNHH Thương Mại Điện Tử Minh Hoàng',
        phone: '0912.345.678',
        email: 'contact@minhhoangelec.vn',
        address: '88 Nguyễn Trãi, P. Bến Thành, Q.1, TP.HCM',
        is_active: 1,
      },
    ];
    for (const sup of supplierList) {
      await tx.insert(suppliers).values(sup);
    }

    const partList = [
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
    for (const p of partList) {
      await tx.insert(parts).values(p);
    }

    const batchList = [
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
        expiry_date: null,
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
        expiry_date: null,
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
        expiry_date: null,
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
        expiry_date: null,
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
        expiry_date: null,
        created_by_name: 'Lê Hoàng Nam (KTV Trưởng)',
        notes: 'Lô keo tản nhiệt phục vụ bảo dưỡng định kỳ',
        created_at: '2026-01-20T08:00:00Z',
      },
    ];
    for (const b of batchList) {
      await tx.insert(inventoryBatches).values(b);
    }

    // 7. Promotions
    const promoList = [
      {
        id: 1,
        code: 'KHACHQUEN10',
        name: 'Ưu đãi Khách hàng thân thiết (10%)',
        description:
          'Giảm 10% tổng chi phí sửa chữa, tối đa 100.000đ cho khách hàng đã từng sử dụng dịch vụ tại trung tâm.',
        discount_type: 'percentage',
        discount_value: 10,
        max_discount_amount: 100000,
        min_order_amount: 200000,
        applicable_to: 'all',
        start_date: '2026-01-01',
        end_date: '2027-12-31',
        usage_limit: 500,
        usage_count: 38,
        is_active: 1,
        created_at: '2026-01-01T00:00:00Z',
      },
      {
        id: 2,
        code: 'HSSV50K',
        name: 'Hỗ trợ Học sinh - Sinh viên (50.000 đ)',
        description:
          'Giảm trực tiếp 50.000đ cho học sinh, sinh viên xuất trình thẻ hợp lệ, áp dụng đơn sửa chữa từ 250.000đ.',
        discount_type: 'fixed',
        discount_value: 50000,
        max_discount_amount: null,
        min_order_amount: 250000,
        applicable_to: 'all',
        start_date: '2026-01-01',
        end_date: '2027-12-31',
        usage_limit: 200,
        usage_count: 45,
        is_active: 1,
        created_at: '2026-01-01T00:00:00Z',
      },
    ];
    for (const pr of promoList) {
      await tx.insert(promotions).values(pr);
    }

    // 8. Repair Tickets (with AES-256-GCM encrypted device passwords - P0-3)
    const ticketList = [
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
        device_password_hint: encryptDevicePassword('PIN: 9988'),
        estimated_completion: '2026-11-04T17:00:00Z',
        subtotal_amount: 1450000,
        discount_amount: 100000,
        final_amount: 1350000,
        paid_amount: 500000,
        debt_amount: 850000,
        is_warranty_claim: 0,
        created_at: '2026-11-02T08:30:00Z',
        updated_at: '2026-11-02T14:20:00Z',
      },
      {
        id: 2,
        ticket_code: 'SC-20261102-0002',
        customer_id: 2,
        customer_name: 'Anh Hoàng Tuấn Minh',
        customer_phone: '0918234567',
        customer_address: null,
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
        defect_description: 'Pin tụt nhanh từ 100% xuống 20% trong 2 tiếng, máy báo dung lượng pin tối đa 74%.',
        initial_condition: 'Mở máy bình thường, Face ID hoạt động, sạc vào chậm.',
        cosmetic_condition: 'Kính lưng có 1 vết xước dăm nhỏ, viền thép bóng đẹp.',
        accessories_included: 'Chỉ nhận thân máy, không giữ phụ kiện.',
        device_password_hint: encryptDevicePassword('112233'),
        estimated_completion: '2026-11-05T12:00:00Z',
        subtotal_amount: 1450000,
        discount_amount: 0,
        final_amount: 1450000,
        paid_amount: 0,
        debt_amount: 1450000,
        is_warranty_claim: 0,
        created_at: '2026-11-02T09:45:00Z',
        updated_at: '2026-11-02T11:00:00Z',
      },
    ];
    for (const t of ticketList) {
      await tx.insert(repairTickets).values(t);
    }

    // 9. Initialize code_sequences
    await tx.insert(codeSequences).values([
      { prefix: 'KH', date_str: 'GLOBAL', last_no: 103 },
      { prefix: 'NCC', date_str: 'GLOBAL', last_no: 3 },
    ]);
  });
}
