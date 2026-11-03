# TÀI LIỆU ĐẶC TẢ DỰ ÁN (PROJECT SPECIFICATION)
## DỰ ÁN: REPAIRFLOW — HỆ THỐNG QUẢN LÝ TIẾP NHẬN & SỬA CHỮA THIẾT BỊ ĐIỆN TỬ

---

### 1. TỔNG QUAN DỰ ÁN

- **Tên hệ thống:** RepairFlow (Repair Shop Management System)
- **Mục tiêu:** Xây dựng phần mềm quản lý toàn bộ vòng đời tiếp nhận, chẩn đoán, báo giá, khách hàng xác nhận, điều phối kỹ thuật, sửa chữa, kiểm tra chất lượng (QC), thanh toán, bàn giao và bảo hành thiết bị điện tử (Laptop, PC, Điện thoại, Máy tính bảng, Máy in, Màn hình...).
- **Quy mô đối tượng phục vụ:** Cửa hàng sửa chữa thiết bị công nghệ, trung tâm bảo hành và sửa chữa quy mô vừa và nhỏ (SMB), có khả năng mở rộng kiến trúc đa chi nhánh / SaaS.
- **Thị trường mục tiêu:** Việt Nam — Hỗ trợ đầy đủ tiếng Việt, chuẩn tiền tệ VND, múi giờ `Asia/Ho_Chi_Minh` (GMT+7), in ấn biểu mẫu A4/A5 và mã QR tra cứu tương thích điện thoại di động.

---

### 2. PHÂN TÍCH HIỆN TRẠNG KỸ THUẬT & ĐỀ XUẤT CÔNG NGHỆ

#### 2.1. Đánh giá hiện trạng môi trường dự án
- **Runtime & Ngôn ngữ:** Node.js v22+, TypeScript v7+, tsx.
- **Frontend Stack:** React 19.0.1, Tailwind CSS v4.3.3, Lucide React (bộ icon giao diện hoàn chỉnh), Motion (hoạt ảnh mượt mà).
- **Backend Stack:** Express 4.21.2, dotenv 17.2.3.
- **Build Tool:** Vite 8.3.0, hỗ trợ chế độ dev server tích hợp với Express middleware hoặc REST API proxy.
- **Cổng dịch vụ:** 3000 (yêu cầu chuẩn của môi trường triển khai).

#### 2.2. Đánh giá và quyết định lựa chọn công nghệ (Technology Architecture Decision)
- **Về đề cập trong prompt liên quan đến PHP/Laravel:**
  Môi trường hiện tại không có PHP runtime/Composer/Apache. Vì vậy, việc áp dụng kiến trúc **Full-stack Node.js + TypeScript + Express + React 19** là giải pháp tối ưu nhất:
  - **Type-Safety End-to-End:** Chia sẻ Interface/Type định nghĩa dữ liệu giữa Backend (API, DTO, Database Entities) và Frontend (UI State, React Hooks, Forms).
  - **Khả năng triển khai thực tế:** Chạy trực tiếp trên 1 container/server port 3000, tốc độ khởi động cực nhanh (<1s), tiêu thụ ít RAM và hoàn toàn tương thích với Cloud Run, Docker và VPS Linux/Windows.
  - **Thiết kế kiến trúc chuẩn MVC & Layered Architecture:**
    - `Controller`: Tiếp nhận HTTP Request, xử lý validation đầu vào, trả về JSON Resource.
    - `Service`: Đảm nhiệm nghiệp vụ cốt lõi (Business Logic), quản lý Database Transactions, tính toán giá trị, kiểm tra điều kiện chuyển trạng thái.
    - `Repository / Data Access`: Thao tác trực tiếp với cơ sở dữ liệu quan hệ, đảm bảo tính toàn vẹn foreign key, index và locking.
    - `Middleware`: Xác thực Token (Bearer), kiểm tra RBAC Role & Permission, ghi Audit Log tự động, xử lý Error Handling tập trung.

#### 2.3. Lựa chọn Cơ sở dữ liệu (Database Engine)
- Sử dụng cơ sở dữ liệu quan hệ chuẩn SQL (SQLite / MySQL Compatible Engine với Drizzle ORM hoặc Knex/Better-SQLite3 có hỗ trợ Foreign Keys ON, WAL mode, ACID Transactions).
- Hệ thống hỗ trợ migration tuần tự, seed dữ liệu mẫu đầy đủ các vai trò: Admin, Manager, Receptionist, Technician, Cashier.
- Thiết kế đảm bảo sẵn sàng chuyển đổi kết nối sang MySQL/PostgreSQL thông qua biến môi trường cấu hình `.env` mà không phải viết lại logic tầng Service.

---

### 3. ĐẶC TẢ NGHIỆP VỤ & BẢN ĐỊA HÓA (LOCALIZATION)

1. **Ngôn ngữ:** 100% Tiếng Việt chuẩn giao diện quản lý nghiệp vụ bán lẻ và kỹ thuật tại Việt Nam.
2. **Tiền tệ:** Việt Nam Đồng (VND), định dạng hiển thị `1.250.000 đ`. Phép tính backend luôn dùng số nguyên (`INTEGER`) để tránh lỗi sai số số thực.
3. **Múi giờ & Định dạng ngày:** `Asia/Ho_Chi_Minh` (UTC+7). Định dạng: `DD/MM/YYYY HH:mm:ss` hoặc `DD/MM/YYYY`.
4. **Quy chuẩn mã phiếu:**
   - Phiếu sửa chữa: `SC-YYYYMMDD-XXXX` (Ví dụ: `SC-20261103-0001`).
   - Phiếu thu / Hóa đơn: `PT-YYYYMMDD-XXXX`.
   - Phiếu nhập kho: `PN-YYYYMMDD-XXXX`.
   - Phiếu xuất kho: `PX-YYYYMMDD-XXXX`.
   - Mã khách hàng: `KH-XXXXXX`.
   - Mã thiết bị: `TB-XXXXXX`.
5. **In ấn (Print Layout):**
   - Hỗ trợ in Phiếu tiếp nhận, Báo giá, Hóa đơn thanh toán, Biên bản bàn giao theo khổ giấy A5 (chuẩn cửa hàng) và A4 (chuẩn doanh nghiệp).
   - Tự động ẩn toàn bộ Sidebar, Header, Nút bấm hành động khi mở hộp thoại in của trình duyệt (`@media print`).
   - Tích hợp mã QR dẫn thẳng tới trang tra cứu trực tuyến của khách hàng (`/lookup?ticket=SC-20261103-0001`).

---

### 4. MA TRẬN PHÂN QUYỀN VAI TRÒ (RBAC MATRIX)

Hệ thống thiết lập 6 vai trò tiêu chuẩn:
1. **Admin (Quản trị viên tối cao):** Toàn quyền truy cập mọi tính năng, cấu hình hệ thống, quản lý tài khoản nhân viên, xem audit log, báo cáo tài chính.
2. **Manager (Quản lý cửa hàng):** Quản lý phiếu tiếp nhận, phân công kỹ thuật viên, duyệt hủy phiếu, quản lý kho linh kiện, xem báo cáo hoạt động.
3. **Receptionist (Nhân viên tiếp nhận / Lễ tân):** Tiếp nhận khách hàng, tạo phiếu sửa chữa, ghi nhận ngoại quan/lỗi, in phiếu tiếp nhận, liên hệ thông báo khách, bàn giao thiết bị.
4. **Technician (Kỹ thuật viên):** Xem danh sách phiếu được phân công, chẩn đoán lỗi, lập báo giá kỹ thuật, đề xuất xuất kho linh kiện, thực hiện sửa chữa, điền checklist kiểm tra chất lượng (QC).
5. **Cashier (Thu ngân):** Tiếp nhận thanh toán (tiền mặt / chuyển khoản), ghi nhận đặt cọc, theo dõi công nợ, in hóa đơn thanh toán.
6. **Customer (Khách hàng):** Truy cập cổng tra cứu công khai không cần đăng nhập nội bộ (chỉ xem thông tin phiếu sửa chữa của mình qua mã phiếu và 4 số cuối SĐT bảo mật).

| Chức năng | Admin | Manager | Receptionist | Technician | Cashier | Customer (Public) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Quản lý tài khoản & Phân quyền | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Cấu hình cửa hàng & Mẫu in | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Tiếp nhận thiết bị & Tạo phiếu | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Phân công kỹ thuật viên | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Chẩn đoán & Đề xuất linh kiện | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Lập báo giá & Duyệt báo giá | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Cập nhật tiến độ sửa chữa | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Kiểm tra chất lượng (QC Checklist) | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Quản lý kho & Nhập/Xuất vật tư | ✅ | ✅ | ❌ | Xem tồn | ❌ | ❌ |
| Thu tiền & Quản lý công nợ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Bàn giao thiết bị & Bảo hành | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Báo cáo doanh thu & Lợi nhuận | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Xem Audit Log hệ thống | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Tra cứu tình trạng phiếu qua QR | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (Chỉ thông tin cho phép) |

---

### 5. CẤU TRÚC THƯ MỤC DỰ ÁN (PROJECT STRUCTURE)

```
/
├── docs/                               # Tài liệu thiết kế & đặc tả kiến trúc
│   ├── PROJECT_SPECIFICATION.md        # Tài liệu tổng quan đặc tả dự án
│   ├── USE_CASES.md                    # Đặc tả chi tiết 33 Use Cases
│   ├── DATABASE_DESIGN.md              # Thiết kế ERD & CSDL 25+ bảng
│   └── IMPLEMENTATION_PLAN.md          # Lộ trình triển khai 5 Phase
│
├── server/                             # Mã nguồn Backend (Express + TypeScript)
│   ├── config/                         # Cấu hình hệ thống, env, constants
│   ├── database/                       # Kết nối CSDL, migrations, seed data
│   │   ├── migrations/
│   │   └── seeders/
│   ├── middlewares/                    # Auth, RBAC, AuditLog, ErrorHandler
│   ├── modules/                        # Cấu trúc Module chuẩn DDD
│   │   ├── auth/                       # Đăng nhập, profile, refresh token
│   │   ├── users/                      # Quản lý nhân viên & phân quyền
│   │   ├── customers/                  # Khách hàng & danh sách thiết bị
│   │   ├── devices/                    # Thiết bị, Hãng sản xuất, Model
│   │   ├── repair-tickets/             # Tiếp nhận, chẩn đoán, báo giá, trạng thái, QC
│   │   ├── inventory/                  # Linh kiện, Kho hàng, Nhập/Xuất, NCC
│   │   ├── payments/                   # Thu tiền, Công nợ, Hóa đơn
│   │   ├── warranties/                 # Bảo hành, Tra cứu, Khiếu nại
│   │   ├── dashboard/                  # Thống kê, KPI, Báo cáo doanh thu
│   │   └── audit-logs/                 # Nhật ký hoạt động hệ thống
│   └── server.ts                       # Entry point Express backend API
│
├── src/                                # Mã nguồn Frontend (React 19 + TypeScript)
│   ├── assets/                         # Hình ảnh, logo, tài nguyên tĩnh
│   ├── components/                     # UI Components dùng chung
│   │   ├── common/                     # Button, Input, Modal, Badge, Table, Toast
│   │   ├── layout/                     # Sidebar, Header, Breadcrumb, PageHeader
│   │   └── print/                      # Biểu mẫu in A5/A4 (Phiếu nhận, Báo giá, Hóa đơn)
│   ├── contexts/                       # React Context (AuthContext, ToastContext)
│   ├── hooks/                          # Custom hooks (useAuth, useFetch, useDebounce)
│   ├── pages/                          # Các màn hình chức năng chính
│   │   ├── auth/                       # Đăng nhập, Quên mật khẩu
│   │   ├── dashboard/                  # Bảng điều khiển KPI & Biểu đồ
│   │   ├── repair-tickets/             # Danh sách phiếu, Tạo mới, Chi tiết, In ấn
│   │   ├── kanban/                     # Bảng Kanban kéo thả trực quan theo trạng thái
│   │   ├── customers/                  # Danh sách & Hồ sơ khách hàng
│   │   ├── inventory/                  # Quản lý vật tư, Nhập kho, Xuất kho
│   │   ├── payments/                   # Quản lý thu tiền, Công nợ
│   │   ├── warranties/                 # Quản lý & Tra cứu bảo hành
│   │   ├── reports/                    # Báo cáo doanh thu, hiệu suất kỹ thuật
│   │   ├── staff/                      # Quản lý nhân viên & vai trò
│   │   ├── settings/                   # Cấu hình cửa hàng & hệ thống
│   │   └── public-lookup/              # Trang tra cứu tiến độ công khai cho khách hàng
│   ├── services/                       # API Client kết nối Backend (Fetch / Axios wrapper)
│   ├── types/                          # TypeScript Interfaces & Enums
│   ├── utils/                          # Hàm định dạng tiền VND, ngày giờ, QR generator
│   ├── App.tsx                         # Bộ định tuyến (Routing) & Phân quyền trang
│   ├── index.css                       # Tailwind CSS v4 & Print Style Rules
│   └── main.tsx                        # Bootstrap ứng dụng React
│
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

### 6. QUY TẮC BẢO MẬT VÀ XỬ LÝ DỮ LIỆU NHẠY CẢM

1. **Bảo mật mật khẩu người dùng:** Sử dụng thuật toán băm an toàn (Argon2id hoặc PBKDF2 / Bcrypt) kèm muối bảo vệ (Salt).
2. **Bảo vệ mật khẩu thiết bị khách hàng:** Tuyệt đối không lưu mật khẩu màn hình/BIOS của khách hàng dưới dạng plain text. Chỉ hiển thị cho kỹ thuật viên được phân công khi đã đăng nhập và được mã hóa tại tầng lưu trữ.
3. **Cổng tra cứu công khai (Public Lookup):**
   - Không yêu cầu đăng nhập nhân viên.
   - Chỉ hiển thị: Trạng thái hiện tại, Ngày nhận, Lỗi khách mô tả, Tiến độ công việc cơ bản, Số tiền thanh toán hợp lệ và Thời hạn bảo hành.
   - **Tuyệt đối ẩn:** Ghi chú nội bộ, chi phí vốn linh kiện, tên kỹ thuật viên cá nhân, mật khẩu thiết bị, thông tin tài chính chi tiết khác.
4. **Tính toàn vẹn giao dịch (ACID Transactions):**
   - Mọi thao tác xuất/nhập kho linh kiện liên kết với phiếu sửa chữa và thu tiền phải được thực thi trong Transaction. Nếu xảy ra lỗi giữa chừng, toàn bộ thay đổi phải được rollback tự động.
   - Tồn kho không được phép âm trong điều kiện bình thường.
