# GÓP Ý & KẾ HOẠCH ĐIỀU CHỈNH — REPAIRFLOW

> Phạm vi rà soát: `server/` (backend Express + MySQL/SQLite, chưa commit), `src/services/`, `src/contexts/AuthContext.tsx`, `src/utils/crypto.ts`, cấu hình build.
> Ngày rà soát: 06/11/2026.

---

## TÓM TẮT

Nghiệp vụ và giao diện đã đầy đủ (33 use case). Vấn đề nằm ở **kiến trúc dữ liệu và bảo mật**:

- Toàn bộ nghiệp vụ (sinh ID, sinh mã phiếu, tính tiền, trừ kho, đăng nhập) chạy ở **trình duyệt** trong `mockStorage.ts`. Backend chỉ ghi lại những gì client gửi lên.
- API **không có xác thực**: ai truy cập được cổng 3000 đều đọc được mật khẩu của mọi tài khoản, đổi được quyền và xóa được dữ liệu.
- Backend dồn vào 2 file lớn, không chia tầng, chưa có migration, chưa có cách chạy khi production.

**Mục tiêu sau khi sửa:** server là nguồn dữ liệu duy nhất (single source of truth), client chỉ hiển thị và gọi API.

| Mức | Ý nghĩa |
|---|---|
| 🔴 P0 | Lỗ hổng bảo mật hoặc mất dữ liệu. Phải sửa trước khi dùng thật |
| 🟠 P1 | Sai nghiệp vụ hoặc dữ liệu không nhất quán |
| 🟡 P2 | Cấu trúc, khả năng bảo trì, hiệu năng |
| ⚪ P3 | Dọn dẹp |

---

## 🔴 P0 — BẢO MẬT

### P0-1. API không có xác thực và phân quyền
- **Vị trí:** [server/routes/api.routes.ts](../server/routes/api.routes.ts), toàn bộ route. [server/app.ts:18](../server/app.ts) dùng `cors()` mở cho mọi origin.
- **Hậu quả:**
  - `GET /api/bootstrap` trả về toàn bộ bảng `users` **kèm cột `password`**, cùng `gateway_api_key` và `gateway_webhook_secret`.
  - `POST /api/reset` cho phép bất kỳ ai xóa và seed lại dữ liệu.
  - `PUT /api/users/:id` với body `{ "role": "admin" }` cho phép tự nâng quyền.
- **Cách sửa:**
  1. Tạo `POST /api/auth/login`: kiểm tra mật khẩu ở server, trả JWT (lưu trong httpOnly cookie) hoặc dùng session.
  2. Thêm middleware `requireAuth` cho mọi route `/api/*`, trừ `/auth/login`, `/health` và các route của cổng tra cứu công khai.
  3. Thêm middleware `requireRole(...roles)` theo ma trận phân quyền trong `USE_CASES.md`. Ví dụ: `/settings` và `/users` chỉ cho Admin; `/reset` chỉ cho Admin và chỉ khi `NODE_ENV !== 'production'`.
  4. Cấu hình `cors({ origin: process.env.APP_URL, credentials: true })`.
  5. Không bao giờ trả `password`, `gateway_api_key`, `gateway_webhook_secret` ra client. Viết hàm `toPublicUser()` và `toPublicSettings()`.
- **Hoàn thành khi:** gọi bất kỳ API nào (trừ các route công khai) không kèm token thì nhận `401`; Technician gọi `PUT /settings` thì nhận `403`; response `/bootstrap` không có trường `password`.

### P0-2. Mật khẩu plaintext và mật khẩu chủ
- **Vị trí:**
  - [src/contexts/AuthContext.tsx:80-81](../src/contexts/AuthContext.tsx): chấp nhận `123456` hoặc `admin` cho **mọi tài khoản**; mật khẩu mặc định là `'123'`.
  - [src/contexts/AuthContext.tsx:111-112](../src/contexts/AuthContext.tsx): lỗi tương tự trong `changePassword`.
  - [server/routes/api.routes.ts:392](../server/routes/api.routes.ts), `:410`, `:441`: `password || '123'`.
- **Cách sửa:**
  1. Xóa toàn bộ mật khẩu chủ và mật khẩu mặc định.
  2. Hash mật khẩu bằng `bcrypt` (cost ≥ 10) hoặc `argon2`. Đổi tên cột thành `password_hash`.
  3. Viết migration chuyển dữ liệu cũ: hash các mật khẩu hiện có, và buộc đổi mật khẩu ở lần đăng nhập đầu (`must_change_password = 1`).
  4. Chuyển `login` và `changePassword` sang API: `POST /auth/login`, `POST /auth/change-password`. `AuthContext` chỉ gọi API và lưu thông tin user trả về.
  5. Đặt lại mật khẩu (UC-02) phải do server sinh mật khẩu tạm.
- **Hoàn thành khi:** trong DB không còn mật khẩu dạng rõ; đăng nhập bằng `123456` vào tài khoản bất kỳ thì thất bại.

### P0-3. "Mã hóa" mật khẩu thiết bị chỉ là XOR với khóa nằm trong bundle JS
- **Vị trí:** [src/utils/crypto.ts](../src/utils/crypto.ts). `SECRET_SALT` được viết cứng và nằm trong bundle JS gửi xuống trình duyệt.
- **Cách sửa:**
  1. Chuyển việc mã hóa sang server: dùng AES-256-GCM (`node:crypto`), khóa lấy từ `.env` (`DEVICE_SECRET_KEY`, 32 byte).
  2. Khi tạo hoặc sửa phiếu, client gửi mật khẩu dạng rõ qua HTTPS; server mã hóa rồi mới lưu `device_password_hint`.
  3. Tạo endpoint riêng `GET /tickets/:id/device-password` chỉ cho Technician, Manager, Admin, và ghi audit log mỗi lần xem.
  4. API danh sách và chi tiết phiếu không trả trường này.
  5. Xóa `encryptPassword`/`decryptPassword` khỏi frontend. Giữ `sanitizeLogDetails`, nhưng chạy nó ở server.
- **Hoàn thành khi:** tìm trong bundle `dist/` không thấy khóa; dữ liệu trong DB không giải được nếu không có `.env`.

### P0-4. Webhook thanh toán xử lý ở client, không xác minh chữ ký
- **Vị trí:** [src/services/mockStorage.ts:1734](../src/services/mockStorage.ts), hàm xử lý webhook VietQR/SmartPOS.
- **Hậu quả:** bất kỳ ai cũng có thể giả lập "đã thanh toán" cho một phiếu.
- **Cách sửa:**
  1. Tạo `POST /api/webhooks/payment/:provider` ở server, xác minh HMAC bằng `gateway_webhook_secret` theo tài liệu của SePay hoặc nhà cung cấp tương ứng.
  2. Chống xử lý trùng: thêm ràng buộc `UNIQUE(transaction_ref)` ở bảng `payments`.
  3. Đối chiếu số tiền nhận được với `debt_amount` của phiếu. Nếu nhận thừa hoặc thiếu thì ghi nhận đúng số thực nhận và cập nhật lại công nợ.
- **Hoàn thành khi:** gửi webhook sai chữ ký thì nhận `401`; gửi cùng một `transaction_ref` hai lần thì chỉ tạo một bản ghi thanh toán.

### P0-5. Lộ chi tiết lỗi SQL ra client
- **Vị trí:** mọi khối `res.status(500).json({ error: err?.message })`.
- **Cách sửa:** dùng error handler chung (xem P2-2). Trả cho client thông báo chung kèm `requestId`; chi tiết lỗi chỉ ghi vào log ở server.

---

## 🟠 P1 — TÍNH ĐÚNG CỦA DỮ LIỆU & NGHIỆP VỤ

### P1-1. Client là nguồn dữ liệu chính, đồng bộ "fire-and-forget"
- **Vị trí:** [src/services/mockStorage.ts](../src/services/mockStorage.ts): mọi hàm ghi đều theo mẫu `save(...)` rồi gọi `ApiClient.post(...)` mà không `await`. Thêm [src/services/apiClient.ts:34-43](../src/services/apiClient.ts): khi lỗi chỉ `console.warn` rồi trả `null`.
- **Hậu quả:** request thất bại thì localStorage và DB lệch nhau mà không ai biết. Hai máy dùng cùng lúc sẽ ghi đè dữ liệu của nhau. Lần `syncFromBackend()` sau sẽ xóa mất dữ liệu chưa kịp lưu lên server.
- **Cách sửa (làm dần theo từng module):**
  1. `ApiClient.request` **ném lỗi** (`ApiError` có `status` và `message`) thay vì trả `null`.
  2. Mỗi hàm ghi trở thành `async`, `await` API, và **dùng dữ liệu server trả về** (có `id` và mã do server sinh) để cập nhật state.
  3. Hiển thị lỗi bằng `ToastContext`.
  4. Bỏ localStorage làm nơi lưu dữ liệu nghiệp vụ. Nếu cần cache thì dùng TanStack Query hoặc state trong bộ nhớ.
  5. Thứ tự chuyển: Auth → Tickets (gồm histories, diagnostics, quotes, QC) → Inventory → Payments → Retail sales → các module còn lại.
- **Hoàn thành khi:** tắt server rồi thao tác trên UI thì thấy toast báo lỗi, không có dữ liệu "ảo" được lưu; mở 2 trình duyệt thì cả hai thấy cùng một dữ liệu sau khi tải lại.

### P1-2. ID và mã phiếu do client sinh, có thể trùng
- **Vị trí:** [src/services/mockStorage.ts:1197-1202](../src/services/mockStorage.ts): `Math.max(...ids) + 1`.
- **Hậu quả:**
  - Hai quầy tạo phiếu cùng lúc sẽ trùng `id` hoặc `ticket_code`.
  - Số thứ tự `XXXX` đang lấy theo `id` tổng, không reset theo ngày như định dạng `SC-YYYYMMDD-XXXX` yêu cầu.
  - `toISOString()` trả về ngày **UTC**: phiếu tạo trong khoảng 00:00–07:00 giờ Việt Nam sẽ mang ngày hôm trước.
- **Cách sửa:**
  1. Cột `id` dùng `AUTO_INCREMENT`; server bỏ qua `id` trong body gửi lên.
  2. Tạo bảng `code_sequences(prefix, date, last_no)`. Trong transaction: `SELECT ... FOR UPDATE`, tăng `last_no`, rồi sinh mã. Ngày lấy theo múi `Asia/Ho_Chi_Minh`.
  3. Thêm ràng buộc `UNIQUE` cho `ticket_code`, `quote_code`, `payment_code`, `warranty_code`, `order_code`, `batch_code`, `customers.code`, `parts.sku`.
  4. Áp dụng cùng cách cho mọi loại mã: phiếu, báo giá, thanh toán, bảo hành, đơn bán lẻ, lô hàng.

### P1-3. Server tin số tiền và tồn kho client gửi lên
- **Vị trí:**
  - `POST /tickets`, `PUT /tickets/:id`, `POST /retail-orders`, `POST /payments` nhận nguyên `final_amount`, `paid_amount`, `debt_amount` từ client.
  - `PUT /parts/:id` nhận nguyên `stock_quantity`.
  - Trừ kho đang làm ở [src/services/mockStorage.ts:2040](../src/services/mockStorage.ts) bằng `Math.max(0, ...)`, nghĩa là âm thầm "cho phép" xuất quá số tồn.
- **Cách sửa:** server tự tính lại tất cả:
  - **Báo giá:** `subtotal = Σ(quantity × unit_price + labor_fee)`. Khuyến mãi được kiểm tra ở server: còn hạn, còn lượt, đạt đơn tối thiểu, có trần giảm giá. `usage_count` được tăng trong transaction.
  - **Thanh toán:** `paid_amount = Σ payments`, `debt_amount = final_amount − paid_amount`, và cập nhật công nợ khách hàng `customers.current_debt`.
  - **Kho:** trừ trực tiếp bằng `UPDATE inventory_batches SET remaining_quantity = remaining_quantity - ? WHERE id = ? AND remaining_quantity >= ?`. Nếu `affectedRows = 0` thì trả lỗi "Không đủ tồn kho". `parts.stock_quantity` được tính lại từ tổng các lô.
  - Client chỉ gửi **ý định** (ví dụ `part_id`, `batch_id`, `quantity`), không gửi kết quả đã tính.

### P1-4. Không có transaction cho các thao tác ghi nhiều bảng
- **Vị trí:** `POST /quotes` (quote + items), `POST /retail-orders` (order + items), cùng các luồng xuất kho, thanh toán, hoàn tiền.
- **Cách sửa:** viết hàm `withTransaction(async (tx) => { ... })` trong `db/pool.ts`, dùng được cho cả MySQL (`getConnection` → `beginTransaction`/`commit`/`rollback`) và SQLite (`BEGIN`/`COMMIT`). Một nghiệp vụ = một transaction.
- **Hoàn thành khi:** nếu insert item thứ 3 của đơn bị lỗi thì DB không còn đơn nào ghi dở.

### P1-5. Chuyển trạng thái phiếu không được kiểm tra ở server
- **Vị trí:** `PUT /tickets/:id` cho phép đặt `status` bất kỳ. Luật chuyển trạng thái hiện chỉ có ở [src/utils/statusTransitions.ts](../src/utils/statusTransitions.ts) phía client.
- **Cách sửa:**
  1. Chuyển `statusTransitions.ts` vào thư mục `shared/` để client và server dùng chung.
  2. Tạo `POST /tickets/:id/transition { to_status, notes }`. Server kiểm tra trạng thái đích có được phép từ trạng thái hiện tại không, role có đủ quyền không, điều kiện đi kèm đã thỏa chưa (ví dụ báo giá đã duyệt, QC đã đạt, đã thanh toán đủ trước khi bàn giao). Sau đó ghi `repair_status_histories` và `audit_logs` **trong cùng transaction**.
  3. `PUT /tickets/:id` chỉ cho sửa các trường mô tả, không được sửa `status` hay các trường tiền.

### P1-6. Âm thầm fallback sang SQLite khi MySQL lỗi
- **Vị trí:** [server/database/db.ts:460-530](../server/database/db.ts).
- **Hậu quả:** MySQL chết vài phút là dữ liệu bị ghi sang file SQLite. Khi MySQL sống lại, dữ liệu bị chia đôi giữa hai nơi.
- **Cách sửa:** chỉ dùng SQLite khi `.env` đặt `DB_CLIENT=sqlite` một cách tường minh. Khi `DB_CLIENT=mysql` mà không kết nối được thì server **dừng khởi động** và báo lỗi rõ ràng. Bỏ endpoint `POST /db/reconnect`, hoặc chỉ cho Admin dùng ở môi trường dev.

### P1-7. Audit log do client tự khai
- **Vị trí:** `POST /audit-logs` nhận `user_id`, `user_name`, `ip_address` từ body.
- **Cách sửa:** bỏ endpoint này. Server tự ghi audit log bên trong các service; `user_id` lấy từ token, IP lấy từ `req.ip`. Chỉ cho phép đọc (`GET /audit-logs`, có phân trang và bộ lọc).

### P1-8. Cổng tra cứu công khai cần API riêng
- **Vị trí:** [src/pages/lookup/PublicLookupPortal.tsx](../src/pages/lookup/PublicLookupPortal.tsx) đọc dữ liệu từ localStorage, tức là cần đã có sẵn toàn bộ dữ liệu.
- **Cách sửa:** tạo `GET /public/tickets/:code?phone=xxxx`, yêu cầu cả mã phiếu và 4 số cuối điện thoại. Chỉ trả các trường an toàn: trạng thái, lịch sử, báo giá; không trả mật khẩu thiết bị hay số điện thoại đầy đủ. Tạo `POST /public/quotes/:id/respond` để khách duyệt hoặc từ chối báo giá. Áp rate limit (ví dụ `express-rate-limit`, 20 lần/phút/IP).

---

## 🟡 P2 — CẤU TRÚC BACKEND

### P2-1. Tái cấu trúc theo module, chia tầng
Hiện tại `api.routes.ts` (1200 dòng) và `db.ts` (1000 dòng) chứa cả route, SQL, map dữ liệu, DDL và seed. Cấu trúc đề xuất:

```
server/
├── server.ts                  # listen; serve dist/ khi production
├── app.ts                     # helmet, cors, json, routes, errorHandler
├── config/env.ts              # validate .env bằng zod, fail-fast
├── db/
│   ├── pool.ts                # query, execute, withTransaction
│   ├── migrations/            # 001_init.sql, 002_..., chạy theo thứ tự, lưu trong bảng schema_migrations
│   └── seeds/dev.seed.ts      # dữ liệu mẫu, chỉ dùng cho dev
├── middleware/
│   ├── asyncHandler.ts
│   ├── auth.ts                # requireAuth
│   ├── requireRole.ts
│   ├── validate.ts            # validate(schema) cho body/params/query
│   └── errorHandler.ts
├── modules/
│   ├── auth/
│   ├── users/
│   ├── customers/             # gồm devices
│   ├── tickets/               # gồm histories, diagnostics, quotes, qc
│   ├── inventory/             # parts, batches, suppliers, part-usages
│   ├── payments/              # gồm webhooks
│   ├── warranties/
│   ├── promotions/
│   ├── sales/                 # retail orders, refund
│   ├── reports/               # tổng hợp bằng SQL, không tính ở client
│   ├── settings/
│   ├── audit/
│   └── public/                # cổng tra cứu
└── utils/                     # AppError, mapRow, codeGenerator, crypto
shared/                        # types/index.ts, statusTransitions.ts, formatters dùng chung
```

Mỗi module gồm các file sau:

| File | Trách nhiệm |
|---|---|
| `*.routes.ts` | Khai báo route, gắn middleware (auth, role, validate) |
| `*.controller.ts` | Lấy dữ liệu từ `req`, gọi service, trả `res`. Không chứa SQL |
| `*.service.ts` | Nghiệp vụ: kiểm tra điều kiện, tính tiền, gọi transaction |
| `*.repo.ts` | Chỉ chứa câu SQL |
| `*.schema.ts` | Schema zod cho input |

### P2-2. Xử lý lỗi thống nhất
- **Vấn đề:**
  - Các route GET (`/settings`, `/users`, `/customers`) không có `try/catch`. Express 4 không bắt lỗi trong handler `async`, nên request bị treo và Node báo unhandled rejection.
  - Khối `try/catch` thủ công lặp lại khoảng 35 lần.
- **Cách sửa:**
  - Bọc mọi handler bằng `asyncHandler`, hoặc nâng lên Express 5 (tự bắt lỗi `async`).
  - Tạo lớp `AppError(status, code, message)`.
  - Có một `errorHandler` cuối chuỗi middleware, trả về `{ error: { code, message } }`.
  - Lỗi validate trả `400`; lỗi vi phạm ràng buộc `UNIQUE` trả `409`.

### P2-3. Validate input
- Dùng `zod` cho mọi body và params. Hiện tại server nhận bất kỳ trường nào, và mẫu `{ ...rows[0], ...req.body }` cho phép ghi đè cả những trường không nên sửa.
- Các API cập nhật chỉ nhận **danh sách trường được phép** (whitelist).

### P2-4. Một nguồn schema duy nhất + migration
- **Vấn đề:** DDL trong [server/database/db.ts:110](../server/database/db.ts) và [server/database/schema.mysql.sql](../server/database/schema.mysql.sql) **không khớp nhau** (12 so với 22 ràng buộc FK/INDEX/UNIQUE). Cách tạo bảng bằng `CREATE TABLE IF NOT EXISTS` không cập nhật được bảng cũ khi thêm cột.
- **Cách sửa:**
  - Giữ một bộ migration duy nhất trong `server/db/migrations/`, có bảng `schema_migrations` để ghi lại migration nào đã chạy.
  - Thêm khóa ngoại (FK) cho mọi cột `*_id`.
  - Thêm index cho các cột hay tìm kiếm: `customers.phone`, `customer_devices.serial_number`, `customer_devices.imei`, `repair_tickets.status`, `repair_tickets.created_at`.
  - Cân nhắc dùng **Drizzle ORM** hoặc **Kysely**: vẫn gần SQL, có type-safe, có sẵn công cụ migration.
- Tách 500 dòng seed ra khỏi `db.ts`.

### P2-5. Server không được import code frontend
- **Vị trí:** [server/routes/api.routes.ts:9](../server/routes/api.routes.ts) import `INITIAL_SETTINGS` từ `src/services/mockStorage`, và file này lại import `ApiClient`.
- **Cách sửa:** chuyển types, hằng số và dữ liệu mặc định vào `shared/`. Thêm alias `@shared` vào `tsconfig.json` và `vite.config.ts`.

### P2-6. Ghép kiểu dữ liệu ở một chỗ
- `getBootstrapDataFromSQL` gọi `Number(...)` và `Boolean(...)` rải rác hàng trăm lần.
- **Cách sửa:**
  - Dùng `typeCast` của mysql2 để chuyển `DECIMAL` sang `number` và `TINYINT(1)` sang `boolean`, hoặc viết hàm `mapRow` cho mỗi bảng trong repo.
  - Tiền VND nên lưu `BIGINT` (đơn vị đồng) thay cho `DECIMAL`, để tránh lỗi làm tròn.

### P2-7. Hiệu năng API
- `GET /settings`, `/users`, `/customers` đang gọi `getBootstrapDataFromSQL()`, tức query khoảng 22 bảng chỉ để lấy một bảng. Cần query đúng bảng cần thiết.
- Gán items vào quote hoặc order bằng `filter` lồng trong `map` có độ phức tạp O(n×m). Chuyển sang gom nhóm bằng `Map` theo `quote_id`, hoặc query theo `WHERE quote_id IN (...)`.
- Bỏ `/bootstrap` tải toàn bộ DB. Thay bằng các API danh sách có phân trang và bộ lọc (`?page=&limit=&q=&status=`), cùng API chi tiết như `GET /tickets/:id`, trả kèm histories, quotes, QC, usages, payments.
- Dashboard và báo cáo được tổng hợp bằng SQL (`GROUP BY`) ở server.

### P2-8. Chạy production và cấu hình
- **Vấn đề:**
  - Express chỉ được gắn vào Vite qua `configureServer`, hook này chỉ chạy khi dev. `vite preview` không có API.
  - `server.ts` không serve thư mục `dist/`.
  - `npm run dev` và `npm run server` đều dùng port 3000, chạy cùng lúc sẽ đụng port.
- **Cách sửa:**
  - **Dev:** chạy Vite (port 5173) và API (port 3000) riêng, dùng `server.proxy: { '/api': 'http://localhost:3000' }`. Bỏ plugin `configureServer`.
  - **Production:** `server.ts` gọi `express.static('dist')`, có fallback trả `index.html` cho SPA, và chạy qua `node` sau khi build backend (bằng `tsc` hoặc `esbuild`).
  - Thêm script `build:server` và `start`.
  - Thêm `helmet()`, giới hạn `express.json({ limit: '1mb' })` (hiện là 10mb), và `trust proxy` nếu chạy sau Nginx.
  - `config/env.ts` validate các biến bắt buộc: `DB_*`, `JWT_SECRET`, `DEVICE_SECRET_KEY`, `APP_URL`. Thiếu biến nào thì dừng ngay khi khởi động.
- Xóa `GEMINI_API_KEY` khỏi `.env.example` và dependency `@google/genai` nếu không dùng.

---

## 🟡 P2 — FRONTEND

### P2-9. Tách các file quá lớn
| File | Số dòng | Gợi ý tách |
|---|---:|---|
| [src/pages/tickets/TicketDetailPage.tsx](../src/pages/tickets/TicketDetailPage.tsx) | ~3100 | Mỗi tab hoặc khu vực là một component riêng (`DiagnosticPanel`, `QuotePanel`, `PartUsagePanel`, `QcPanel`, `PaymentPanel`, `HandoverPanel`); logic đưa vào hook `useTicket(id)` |
| [src/services/mockStorage.ts](../src/services/mockStorage.ts) | ~2000 | Thay bằng `src/api/*.ts` theo module; dữ liệu mẫu chuyển sang seed ở server |
| [src/pages/inventory/InventoryPage.tsx](../src/pages/inventory/InventoryPage.tsx) | ~1600 | Tách các tab Linh kiện / Lô hàng / Nhà cung cấp |
| [src/pages/sales/RetailSalesPage.tsx](../src/pages/sales/RetailSalesPage.tsx) | ~1100 | Tách giỏ hàng, thanh toán, lịch sử đơn |
| [src/pages/intake/IntakePage.tsx](../src/pages/intake/IntakePage.tsx) | ~1100 | Tách các section của form |

### P2-10. Lớp gọi API phía client
- `ApiClient.request` hiện ghi đè `headers` sai thứ tự: `...options` được spread **sau** `headers`, nên khi truyền `options.headers` thì `Content-Type` bị mất. Sửa lại thứ tự spread.
- Thêm `credentials: 'include'`. Khi nhận `401` thì chuyển về trang đăng nhập.
- Trả về kiểu cụ thể thay cho `any`.
- Cân nhắc dùng **TanStack Query** để có cache, trạng thái loading/error và tự làm mới dữ liệu sau khi ghi.

---

## ⚪ P3 — DỌN DẸP

- Đổi `name` trong `package.json` từ `react-example` thành `repairflow`.
- Bỏ các comment còn sót lại từ AI Studio trong `vite.config.ts` (`DISABLE_HMR`) nếu không còn dùng.
- Thư mục `public/assets/aistudio/`: đổi tên ảnh cho có nghĩa, xóa ảnh không dùng.
- Thêm `.claude/` vào `.gitignore` nếu không muốn commit.
- Commit phần backend đang làm dở thành các commit nhỏ theo từng bước bên dưới, đừng commit một lần cho tất cả.

---

## TESTING

Hiện dự án chưa có test. Nên bổ sung ít nhất:

1. **Unit test** (Vitest) cho `shared/statusTransitions.ts`, hàm tính tiền báo giá và khuyến mãi, `codeGenerator`, `numberToWords`.
2. **Integration test** cho API (Vitest + Supertest, DB SQLite in-memory hoặc MySQL trong Docker):
   - Không có token thì nhận `401`; sai role thì nhận `403`.
   - Tạo 2 phiếu song song thì mã không trùng.
   - Xuất kho vượt tồn thì nhận `409` và tồn kho không đổi.
   - Webhook sai chữ ký bị từ chối; webhook trùng `transaction_ref` chỉ ghi một lần.
   - Luồng đầy đủ: tiếp nhận → chẩn đoán → báo giá → duyệt → sửa → QC → thanh toán → bàn giao → bảo hành.
3. Script `npm test` và chạy test trong CI (GitHub Actions) cùng `npm run lint`.

---

## LỘ TRÌNH ĐỀ XUẤT

| Bước | Nội dung | Mục liên quan |
|:---:|---|---|
| 1 | Nền tảng backend: `config/env`, `asyncHandler`, `errorHandler`, `AppError`, `helmet`, cấu hình CORS, tách dev/prod và proxy | P0-5, P2-2, P2-8 |
| 2 | Migration thống nhất, `withTransaction`, bỏ fallback SQLite ngầm, chuyển code dùng chung vào `shared/` | P1-4, P1-6, P2-4, P2-5 |
| 3 | Module `auth`: bcrypt, JWT, `requireAuth`, `requireRole`, bỏ mật khẩu chủ, migration hash mật khẩu cũ; `AuthContext` gọi API | P0-1, P0-2 |
| 4 | Module `tickets` làm mẫu: sinh mã ở server, API chuyển trạng thái, tính tiền báo giá ở server, mã hóa mật khẩu thiết bị ở server; frontend dùng API thật | P0-3, P1-2, P1-3, P1-5, P2-1 |
| 5 | `inventory` và `payments`: trừ kho có kiểm tra tồn, webhook có chữ ký, công nợ tính ở server | P0-4, P1-3 |
| 6 | `sales`, `promotions`, `warranties`, `public`, `reports`, `audit` | P1-7, P1-8, P2-7 |
| 7 | Xóa `mockStorage.ts` và `/bootstrap`; tách các page lớn; viết test | P1-1, P2-9, P2-10 |

Sau mỗi bước, ứng dụng phải chạy được. Commit riêng từng bước.
