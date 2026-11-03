# KẾ HOẠCH TRIỂN KHAI DỰ ÁN (IMPLEMENTATION PLAN)
## DỰ ÁN: REPAIRFLOW — HỆ THỐNG QUẢN LÝ TIẾP NHẬN & SỬA CHỮA THIẾT BỊ ĐIỆN TỬ

---

### 1. TỔNG QUAN LỘ TRÌNH 5 GIAI ĐOẠN (5-PHASE ROADMAP)

Để đảm bảo chất lượng kỹ thuật, tính ổn định, độ tin cậy của dữ liệu và tuân thủ nguyên tắc không bỏ sót bất kỳ Use Case nào trong số 33 Use Cases, dự án được chia thành 5 Phase có mục tiêu và kiểm thử nghiệm thu rõ ràng:

```
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 1: Phân tích & Nền tảng (Foundation, Auth, RBAC, Layout, DB)    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 2: Tiếp nhận & Vòng đời Phiếu (Customer, Device, Ticket, Print) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 3: Nghiệp vụ Kỹ thuật & Kho (Diagnose, Quote, Parts, Inventory) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 4: Tài chính, Bàn giao & Bảo hành (Payments, Delivery, Warranty)│
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 5: Quản trị, Thống kê & Hoàn thiện (Dashboard, Audit, Settings)  │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 2. CHI TIẾT TỪNG GIAI ĐOẠN

---

#### PHASE 1 — PHÂN TÍCH & NỀN TẢNG KIẾN TRÚC (FOUNDATION & CORE INFRASTRUCTURE)
- **Mục tiêu:** Xây dựng khung kiến trúc full-stack vững chắc, cơ sở dữ liệu quan hệ hoàn chỉnh, cơ chế xác thực an toàn, kiểm soát quyền hạn (RBAC), layout giao diện chuẩn doanh nghiệp và bộ API client đồng bộ.
- **Các nhiệm vụ cụ thể:**
  1. Phân tích hiện trạng dự án, thiết lập TypeScript cấu hình strict, hoàn thiện tài liệu đặc tả kiến trúc.
  2. Thiết lập tầng Database Engine với đầy đủ 25+ bảng dữ liệu theo thiết kế ERD chuẩn hóa 3NF, hỗ trợ foreign keys, constraints, indexes và transaction.
  3. Xây dựng bộ Seeder dữ liệu ban đầu: Cấu hình cửa hàng mặc định, 5 vai trò hệ thống (`admin`, `manager`, `receptionist`, `technician`, `cashier`), các tài khoản nhân sự mẫu kèm mật khẩu đã được mã hóa an toàn, danh mục loại thiết bị và hãng sản xuất.
  4. Triển khai Module Xác thực (Auth Module): Đăng nhập (`/api/auth/login`), Lấy thông tin cá nhân (`/api/auth/me`), Đăng xuất (`/api/auth/logout`), quản lý phiên JWT / Session an toàn, mã hóa mật khẩu, kiểm tra tài khoản hoạt động và ghi nhận thời gian đăng nhập.
  5. Xây dựng Middleware phân quyền (RBAC Middleware): Kiểm tra quyền theo vai trò trên từng API route.
  6. Xây dựng Layout ứng dụng chuẩn ERP: Sidebar điều hướng thông minh theo vai trò, Header có avatar tài khoản và thanh tìm kiếm, Breadcrumb động, Toast thông báo, Modal xác nhận.
- **Kết quả nghiệm thu (Deliverables):**
  - Cơ sở dữ liệu khởi tạo thành công với seed data sẵn sàng.
  - API Auth & RBAC hoạt động 100%, có tài khoản Admin mẫu để đăng nhập.
  - Giao diện đăng nhập và Layout khung dashboard hiển thị sắc nét, responsive trên cả mobile và desktop.
  - Biến môi trường `.env.example` hoàn chỉnh.

---

#### PHASE 2 — NGHIỆP VỤ TIẾP NHẬN & VÒNG ĐỜI PHIẾU (CORE INTAKE & TICKET LIFECYCLE)
- **Mục tiêu:** Hiện thực hóa quy trình nghiệp vụ cốt lõi đầu vào: Khách hàng, Thiết bị, Tiếp nhận máy, Sinh mã phiếu, In phiếu tiếp nhận A5/A4 kèm QR tra cứu và Phân công kỹ thuật viên.
- **Các Use Case thuộc Phase 2:**
  - `UC-05`: Quản lý khách hàng (Thêm mới, sửa, tìm kiếm SĐT, xem lịch sử sửa chữa và công nợ).
  - `UC-06`: Quản lý thiết bị của khách (Liên kết khách hàng, tra cứu Serial/IMEI, xem lịch sử sửa cũ).
  - `UC-07`: Quản lý danh mục thiết bị & hãng sản xuất.
  - `UC-08`: Tiếp nhận thiết bị sửa chữa (Form tiếp nhận toàn diện: mô tả lỗi, ngoại quan, phụ kiện, mật khẩu máy an toàn, tạo mã `SC-YYYYMMDD-XXXX`).
  - `UC-09`: In phiếu tiếp nhận (Khổ giấy A5 và A4, tối ưu `@media print`, mã QR tra cứu trực tuyến).
  - `UC-10`: Phân công kỹ thuật viên (Chỉ định người phụ trách chính, chuyển giao phiếu, lọc phiếu theo kỹ thuật viên).
  - `UC-14`: Quản lý 11 trạng thái sửa chữa chuẩn & Bảng Kanban trực quan kéo thả.
- **Kết quả nghiệm thu (Deliverables):**
  - Nhân viên lễ tân có thể tạo phiếu mới trong < 60 giây, tìm khách cũ qua SĐT.
  - In phiếu tiếp nhận ra giấy A5/A4 đẹp mắt, quét được mã QR trên điện thoại.
  - Bảng Kanban hiển thị danh sách phiếu theo từng cột trạng thái trực quan.

---

#### PHASE 3 — NGHIỆP VỤ KỸ THUẬT & QUẢN LÝ KHO (TECHNICAL DIAGNOSTICS & INVENTORY)
- **Mục tiêu:** Xử lý toàn bộ công việc chuyên môn của Kỹ thuật viên: Chẩn đoán lỗi, Báo giá có phiên bản, Khách hàng xác nhận báo giá, Quản lý kho linh kiện, Nhập/Xuất kho và Kiểm tra chất lượng (QC Checklist).
- **Các Use Case thuộc Phase 3:**
  - `UC-11`: Kiểm tra và chẩn đoán thiết bị (Nguyên nhân lỗi, phương án khắc phục, dự toán chi phí & thời gian).
  - `UC-12`: Lập báo giá sửa chữa (Chi tiết tiền công + linh kiện, tính tổng tiền, chiết khấu, in báo giá).
  - `UC-13`: Khách hàng xác nhận báo giá (Ghi nhận đồng ý/từ chối, quy tắc cấm sửa khi chưa duyệt báo giá).
  - `UC-15`: Quản lý linh kiện và vật tư (Danh mục SKU, giá vốn, giá bán, tồn kho, cảnh báo sắp hết hàng).
  - `UC-16`: Nhập kho linh kiện (Phiếu `PN-...`, cập nhật tồn kho và giá vốn trong Transaction).
  - `UC-17`: Xuất kho linh kiện cho phiếu sửa chữa (Phiếu `PX-...`, kiểm tra tồn kho không âm, liên kết phiếu sửa).
  - `UC-18`: Quản lý nhà cung cấp linh kiện.
  - `UC-19`: Quản lý chi phí sửa chữa (Tách bạch giá bán và chi phí vốn, chi phí thuê ngoài gia công).
  - `UC-20`: Kiểm tra chất lượng sau sửa chữa (Bảng Checklist tiêu chuẩn 8+ tiêu chí, điều kiện tiên quyết để hoàn thành).
- **Kết quả nghiệm thu (Deliverables):**
  - Luồng kỹ thuật vận hành trơn tru từ Chẩn đoán → Báo giá → Xuất kho linh kiện → QC Checklist.
  - Kho hàng kiểm soát chặt chẽ, không xảy ra sai lệch tồn kho khi xuất nhập.

---

#### PHASE 4 — TÀI CHÍNH, BÀN GIAO & BẢO HÀNH (PAYMENT, DELIVERY & WARRANTY)
- **Mục tiêu:** Hoàn thiện khâu kết thúc vòng đời sửa chữa: Thu tiền, quản lý công nợ, bàn giao thiết bị, bảo hành và cổng tra cứu công khai cho khách hàng.
- **Các Use Case thuộc Phase 4:**
  - `UC-21`: Quản lý thanh toán (Thu tiền mặt, chuyển khoản VietQR động, hỗ trợ cọc và nhiều đợt, in phiếu thu).
  - `UC-22`: Quản lý công nợ (Theo dõi phiếu nợ, báo cáo nợ theo khách hàng, thu nợ bổ sung).
  - `UC-23`: Bàn giao thiết bị (Kiểm tra điều kiện bàn giao, trả lại phụ kiện, ký nhận, chuyển `Delivered`).
  - `UC-24`: Quản lý bảo hành (Tự động kích hoạt gói BH, tính ngày hết hạn, tra cứu nhanh, tạo phiếu BH lại).
  - `UC-25`: Cổng tra cứu công khai (Khách quét QR tra cứu tiến độ, xem báo giá, xác nhận online an toàn).
  - `UC-26`: Notification Service (Hệ thống thông báo trạng thái phiếu cho khách hàng và nội bộ).
- **Kết quả nghiệm thu (Deliverables):**
  - Quy trình thanh toán chính xác tuyệt đối, hóa đơn và biên bản bàn giao in ấn chuẩn mực.
  - Cổng tra cứu hoạt động độc lập, không yêu cầu đăng nhập, ẩn toàn bộ dữ liệu nội bộ.

---

#### PHASE 5 — QUẢN TRỊ, THỐNG KÊ & HOÀN THIỆN HỆ THỐNG (ADMINISTRATION, AUDIT & STABILIZATION)
- **Mục tiêu:** Cung cấp bức tranh toàn cảnh cho Ban quản lý, bảo mật, nhật ký kiểm toán và kiểm thử hoàn chỉnh.
- **Các Use Case thuộc Phase 5:**
  - `UC-02` & `UC-03`: Quản lý nhân sự, phân quyền chi tiết, đặt lại mật khẩu.
  - `UC-04` & `UC-33`: Cấu hình thông tin cửa hàng, mẫu in, quy định bảo hành, tài khoản ngân hàng.
  - `UC-27`: Quản lý Audit Log (Ghi vết chi tiết thay đổi dữ liệu trước/sau dạng JSON).
  - `UC-28`: Dashboard tổng quan (Biểu đồ doanh thu thời gian thực, KPI phiếu theo trạng thái, cảnh báo trễ hẹn).
  - `UC-29`: Báo cáo & Thống kê chuyên sâu (Xuất file Excel/CSV, in báo cáo doanh thu & kho).
  - `UC-30`: Tìm kiếm toàn hệ thống (Global search đa thực thể).
  - `UC-31`: Quản lý tệp đính kèm và hình ảnh thiết bị.
  - `UC-32`: Quản lý hủy phiếu an toàn (Hoàn kho tự động, xử lý tiền cọc, lưu vết lịch sử hủy).
  - Viết Unit Tests & Integration Tests kiểm tra các quy tắc nghiệp vụ cốt lõi (Không âm kho, tính đúng công nợ, chặn chuyển trạng thái sai quy trình).
- **Kết quả nghiệm thu (Deliverables):**
  - Toàn bộ 33 Use Cases hoạt động trơn tru.
  - Hệ thống sẵn sàng triển khai trên môi trường thực tế.

---

### 3. KẾ HOẠCH TRIỂN KHAI CHI TIẾT PHASE 1 (PHASE 1 IMPLEMENTATION PLAN)

1. **Bước 1 — Thiết lập Tầng Cơ Sở Dữ Liệu & Migration:**
   - Tạo file database schema & connection (`server/database/db.ts`).
   - Xây dựng các bảng dữ liệu: `roles`, `permissions`, `role_permissions`, `users`, `store_settings`, `customers`, `device_categories`, `device_brands`, `customer_devices`, `repair_tickets`, `repair_status_histories`, v.v.
   - Viết Seeder khởi tạo dữ liệu mẫu thực tế:
     - 5 Vai trò: `admin`, `manager`, `receptionist`, `technician`, `cashier`.
     - Các tài khoản nhân viên mặc định:
       - Admin: `admin@repairflow.vn` / `admin123`
       - Quản lý: `manager@repairflow.vn` / `manager123`
       - Lễ tân: `letan@repairflow.vn` / `letan123`
       - Kỹ thuật viên: `kythuat@repairflow.vn` / `kythuat123`
       - Thu ngân: `thungan@repairflow.vn` / `thungan123`
     - Cấu hình cửa hàng: "Trung Tâm Sửa Chữa Điện Tử RepairFlow", địa chỉ, hotline, mẫu in, tài khoản VietQR.
     - Dữ liệu danh mục: Laptop, PC, Điện thoại, Máy tính bảng, Máy in, Màn hình và các hãng sản xuất hàng đầu (Apple, Dell, Asus, HP, Lenovo, Samsung).

2. **Bước 2 — Xây dựng Backend Express Server & Auth API:**
   - Thiết lập Server API chạy trên Node.js + Express: Tích hợp Vite middleware ở chế độ dev để phục vụ SPA trên cổng 3000.
   - Xây dựng Auth Controller & Service: Băm mật khẩu bằng PBKDF2/Crypto chuẩn, tạo Auth Token, ghi nhận thời gian đăng nhập.
   - Xây dựng Auth Middleware & RBAC Permission Guard.
   - Viết các endpoints: `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`.

3. **Bước 3 — Xây dựng Giao diện Frontend (React 19 + Tailwind v4):**
   - Thiết lập Hệ thống Type Definition (`src/types/index.ts`).
   - Xây dựng `AuthContext` quản lý trạng thái đăng nhập, lưu token, tự động khôi phục session.
   - Xây dựng Trang Đăng Nhập (`src/pages/auth/LoginPage.tsx`) chuyên nghiệp, hỗ trợ chọn nhanh tài khoản mẫu để test, thông báo lỗi an toàn, loading state.
   - Xây dựng Bộ khung Layout doanh nghiệp (`src/components/layout/AppLayout.tsx`):
     - Sidebar responsive: Điều hướng menu theo đúng quyền hạn của từng vai trò, thu gọn/mở rộng, huy hiệu số lượng phiếu cần xử lý.
     - Header: Thanh tìm kiếm nhanh toàn hệ thống, hiển thị vai trò người dùng, nút chuyển đổi ca làm việc, thông báo, menu dropdown đăng xuất.
     - Breadcrumb & PageHeader đồng nhất.
   - Xây dựng các components dùng chung: `Button`, `Input`, `Badge`, `Modal`, `ToastNotification`.

4. **Bước 4 — Kiểm thử & Nghiệm thu Phase 1:**
   - Kiểm tra đăng nhập với từng vai trò: Admin, Manager, Lễ tân, Kỹ thuật viên, Thu ngân.
   - Xác minh menu hiển thị chính xác theo ma trận RBAC.
   - Thử nghiệm đăng nhập sai mật khẩu để kiểm tra thông báo bảo mật.
   - Chạy lệnh biên dịch và kiểm tra không có bất kỳ lỗi cú pháp hoặc TypeScript nào.
