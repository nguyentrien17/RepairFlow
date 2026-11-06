# DANH SÁCH CẦN SỬA — REPAIRFLOW (ĐỢT RÀ SOÁT 3)

> Ngày rà soát: 06/11/2026
> Phạm vi: toàn bộ `server/`, `shared/`, `src/services/`, các trang `src/pages/` có gọi API.
> Trạng thái lúc rà soát: `tsc --noEmit` không lỗi; `npm test` 5/5 đạt. Chưa chạy với MySQL thật.
> Tài liệu trước: [REVIEW_FIX_PLAN.md](REVIEW_FIX_PLAN.md)

---

## TÓM TẮT

| Mức | Số mục | Ý nghĩa |
|---|:---:|---|
| 🔴 Cao | 2 | Hỏng chức năng hoặc âm thầm làm sai DB khi chạy thật |
| 🟠 Trung bình | 4 | Sai nghiệp vụ hoặc dữ liệu tiền, bảo hành |
| 🟡 Thấp | 5 | Ổn định, trải nghiệm, quy trình |

Mỗi mục gồm: **Vị trí** → **Vấn đề** → **Cách sửa** → **Hoàn thành khi**.

---

## 🔴 MỨC CAO

### A. Lỗi migration bị nuốt, các migration sau sẽ không bao giờ chạy

- **Vị trí:** [server/db/pool.ts:82-89](../server/db/pool.ts)
- **Vấn đề:**
  - `migrate()` được bọc trong `catch`, bỏ qua mọi lỗi có chữ `already exists`. Trong khi đó, file `0000_freezing_sally_floyd.sql` dùng `CREATE TABLE` không có `IF NOT EXISTS`.
  - Với DB đã có bảng từ trước (tạo bằng DDL viết tay cũ): migration `0000` lỗi rồi bị bỏ qua, và không được ghi vào `__drizzle_migrations`.
  - Mỗi lần khởi động, server lại thử `0000` rồi lại bỏ qua. Migration `0001`, `0002`… **không bao giờ được chạy**. Cột hoặc bảng mới không có trong DB mà không có thông báo lỗi nào.
- **Cách sửa:**
  1. Xóa khối `try/catch` quanh `migrate()`. Migration lỗi thì server phải dừng khởi động.
  2. Với DB cũ đang có dữ liệu, chọn một trong hai cách:
     - **Baseline:** viết script `server/db/baseline.ts` chạy một lần, kiểm tra schema hiện tại khớp với `0000`, rồi chèn bản ghi `0000` (gồm hash và `created_at` lấy từ `meta/_journal.json`) vào bảng `__drizzle_migrations`.
     - **Tạo lại:** export dữ liệu, xóa DB, chạy migrate, rồi import lại.
  3. Ghi lại cách làm vào README: dev dùng `npm run db:generate` để sinh migration, deploy chỉ chạy `migrate()`. Không dùng `db:push` trên production.
- **Hoàn thành khi:**
  - DB mới: tất cả migration chạy, `__drizzle_migrations` có đủ bản ghi.
  - DB cũ sau baseline: tạo thử migration `0001` (thêm một cột) thì cột xuất hiện sau khi khởi động lại.
  - Cố ý làm migration lỗi thì server dừng với `exit 1`.

### B. Bán "sản phẩm tự nhập" ở trang bán lẻ luôn thất bại

- **Vị trí:**
  - [src/components/sales/CustomItemModal.tsx:62](../src/components/sales/CustomItemModal.tsx): `part_id = 900000 + random`.
  - [server/modules/sales/sales.routes.ts:135-140](../server/modules/sales/sales.routes.ts): mọi item bắt buộc có `part_id` thật, sau đó gọi `deductPartStockFIFOInTx`.
- **Vấn đề:** server không tìm thấy linh kiện có `part_id` ngẫu nhiên nên trả 404. **Cả đơn hàng bị hủy**, kể cả các món bình thường trong cùng giỏ.
- **Cách sửa** (chọn một hướng):
  - **Hướng 1, khuyên dùng nếu sản phẩm có quản lý tồn kho** (máy cũ, thiết bị nhập lẻ): trong modal, gọi API tạo `part` mới cùng lô nhập (số lượng 1, giá vốn, giá bán) trước, lấy `part_id` thật rồi mới cho vào giỏ.
  - **Hướng 2, cho dịch vụ hoặc hàng không quản lý kho:** thêm `item_type: 'custom'`. Server bỏ qua bước trừ kho với loại này, nhận `unit_price` và `product_name` từ client, **chỉ cho phép admin/manager**, và ghi audit log riêng (`CUSTOM_SALE_ITEM`).
  - Cả hai hướng đều phải xóa phần sinh `part_id` ngẫu nhiên.
- **Hoàn thành khi:** đơn gồm 1 linh kiện có sẵn và 1 sản phẩm tự nhập được tạo thành công. Tồn kho của linh kiện bị trừ đúng. Lễ tân thêm món `custom` thì bị từ chối với `403` (nếu chọn hướng 2).

---

## 🟠 MỨC TRUNG BÌNH

### C. Bảo hành vẫn được cấp dù bàn giao thất bại

- **Vị trí:**
  - [src/pages/tickets/TicketDetailPage.tsx:761-766](../src/pages/tickets/TicketDetailPage.tsx): gọi `updateTicket(Delivered)` không chờ kết quả, rồi gọi `addWarranty` ngay và hiện toast thành công.
  - [server/modules/warranties/warranties.routes.ts](../server/modules/warranties/warranties.routes.ts): không kiểm tra trạng thái phiếu, không chặn cấp trùng.
- **Vấn đề:** server từ chối chuyển sang `Delivered` (còn nợ, chưa QC đạt, báo giá chưa duyệt) nhưng phiếu bảo hành **vẫn được ghi vào DB**. Ngoài ra, một phiếu có thể nhận nhiều phiếu bảo hành.
- **Cách sửa:**
  1. Server tự tạo bảo hành **bên trong** `transitionTicketStatusInTx` khi chuyển sang `Delivered`. Thêm tham số `warranty_days` vào `POST /tickets/:id/transition`; nếu không gửi thì dùng `default_warranty_days` trong cài đặt.
  2. `POST /warranties` chỉ còn dùng cho trường hợp cấp lại thủ công (admin/manager). Route này phải kiểm tra `ticket.status === 'Delivered'` và chưa có bảo hành `Active`.
  3. Thêm ràng buộc DB: mỗi `ticket_id` chỉ có một bảo hành `Active` (unique index hoặc kiểm tra trong transaction).
  4. Frontend: `await` lời gọi chuyển trạng thái, đọc `warranty_code` từ response, và chỉ hiện toast khi thành công.
- **Hoàn thành khi:** bàn giao phiếu còn nợ thì nhận lỗi và **không có** bảo hành mới trong DB. Bàn giao hợp lệ tạo đúng 1 bảo hành. Gọi lại `POST /warranties` cho cùng phiếu thì nhận `409`.

### D. Thanh toán thủ công có thể giả dạng "đã xác minh tự động"

- **Vị trí:**
  - [server/modules/payments/payments.routes.ts:49-51, 91-93](../server/modules/payments/payments.routes.ts): route thu tiền thủ công nhận `is_auto_verified`, `gateway_provider`, `card_brand` từ body.
  - [src/services/mockStorage.ts:1997](../src/services/mockStorage.ts) `processPaymentWebhook`: mô phỏng webhook ngay trên trình duyệt, tự tạo `transaction_ref = TXN${Date.now()}`, rồi gọi `POST /payments` với `is_auto_verified: true`. Được gọi tại [TicketDetailPage.tsx:690, 731](../src/pages/tickets/TicketDetailPage.tsx).
- **Vấn đề:** lễ tân tạo được khoản thu mang nhãn "đã xác minh qua ngân hàng hoặc SmartPOS" mà không có giao dịch thật. Khi đối soát, không phân biệt được khoản nào do webhook thật ghi nhận.
- **Cách sửa:**
  1. Trong `POST /payments`: luôn đặt `is_auto_verified = 0`, bỏ qua `gateway_provider` từ client. `payment_method` chỉ nhận các giá trị hợp lệ (`Cash`, `Bank_Transfer`, `POS_Card`…).
  2. Chỉ route `POST /webhooks/payment/:provider` được ghi `is_auto_verified = 1`.
  3. Xóa `processPaymentWebhook` ở frontend. Nếu cần demo, tạo route `POST /api/dev/simulate-webhook`, chỉ bật khi `ENABLE_DEV_TOOLS=true`. Route này tự ký HMAC rồi gọi đúng luồng webhook.
  4. Validate `amount` là số hữu hạn, khác 0 (hiện `Number('abc')` cho `NaN` vẫn lọt qua kiểm tra `=== 0`).
- **Hoàn thành khi:** gửi `POST /payments` với `is_auto_verified: true` thì bản ghi lưu `0`. Bundle production không còn code mô phỏng webhook.

### E. Báo giá ghi đè tổng tiền phiếu trước khi khách duyệt

- **Vị trí:** [server/modules/tickets/tickets.routes.ts:606-679](../server/modules/tickets/tickets.routes.ts) (`createQuoteHandler`).
- **Vấn đề:**
  1. Báo giá mới ở trạng thái `Sent` đã cập nhật ngay `subtotal_amount`, `discount_amount`, `final_amount`, `debt_amount` của phiếu, **kể cả khi phiếu đang có một báo giá khác đã được duyệt**. Công nợ của khách thay đổi theo một báo giá họ chưa đồng ý.
  2. Tạo báo giá mà không gửi `promotion_code`: `promoId`/`promoCode` cũ của phiếu vẫn được giữ, nhưng `finalDiscount` bằng 0 với role không phải admin/manager. Kết quả là khách mất giảm giá trong khi khuyến mãi vẫn bị tính lượt.
  3. Cho tạo báo giá ở mọi trạng thái, kể cả `Delivered` và `Cancelled`.
- **Cách sửa:**
  1. `createQuoteHandler` **chỉ** ghi vào `repair_quotes` và `repair_quote_items`, không cập nhật tiền của phiếu. Tổng tiền phiếu chỉ được cập nhật trong `respondToQuoteInTx` khi báo giá chuyển sang `Approved` (logic này đã có sẵn).
  2. Khi không gửi `promotion_code`: nếu phiếu đang có khuyến mãi thì tính lại giảm giá theo mã đó với `subtotal` mới. Nếu mã không còn hợp lệ thì báo lỗi rõ ràng, không âm thầm đặt về 0.
  3. Lượt khuyến mãi chỉ bị tính khi báo giá được `Approved`, không tính lúc tạo báo giá.
  4. Chặn tạo báo giá khi phiếu ở `Delivered` hoặc `Cancelled`. Khi tạo báo giá mới, đánh dấu các báo giá `Sent` cũ của phiếu là `Superseded`.
  5. Tự tăng `version` ở server (số version lớn nhất của phiếu + 1), không nhận từ client.
- **Hoàn thành khi:** tạo báo giá `Sent` thì `final_amount` của phiếu không đổi. Duyệt báo giá thì `final_amount` bằng `total_amount` của báo giá đó. Tạo báo giá thứ 2 không kèm mã thì vẫn giữ đúng giảm giá của mã cũ.

### F. Frontend: phần Ticket, Kanban, Inventory vẫn ghi local trước rồi mới đồng bộ

- **Vị trí:** [src/services/mockStorage.ts](../src/services/mockStorage.ts), gồm các hàm `updateTicket`, `addDiagnostic`, `addQuote`, `updateQuoteStatus`, `saveChecklist`, `addPayment`, `addWarranty`, `addPartUsage`, `addInventoryBatch`, `updateInventoryBatch`, `addCustomer`, `addPart`. Được gọi từ `TicketDetailPage`, `KanbanPage`, `InventoryPage`, `CustomerListPage`.
- **Vấn đề:**
  - UI hiện toast "thành công" trước khi server phản hồi. Khi server từ chối, dữ liệu tự quay lại sau lần đồng bộ, khiến người dùng bối rối.
  - Các thao tác liên tiếp không được sắp thứ tự. Ví dụ: `saveChecklist` rồi chuyển sang `Ready_For_Pickup` (dòng 630-638) gửi song song, nên lần chuyển trạng thái có thể chạy trước khi checklist được lưu.
  - Nếu thao tác tiếp theo diễn ra trước khi đồng bộ xong, `id` tạm (`Math.max + 1`) có thể bị gửi lên server.
  - Lần nào cũng gọi lại toàn bộ `/bootstrap`, rất nặng khi dữ liệu lớn.
- **Cách sửa:**
  1. Viết phiên bản `async` cho từng hàm còn lại (theo mẫu `createTicketAsync`, `createRetailOrderAsync` đã có). Các hàm này `await` API, dùng dữ liệu server trả về, và báo lỗi qua toast.
  2. Ở các trang: dùng `await`, khóa nút trong lúc gửi (`isSubmitting`), chỉ hiện toast thành công sau khi có response.
  3. Xóa các phiên bản đồng bộ cũ cùng phần tính tiền, trừ kho ở client (`updatePartStock`, `updateBatchRemainingQuantity`, `recordPromotionUsage`, `validateAndCalculatePromotion` phía client).
  4. Sau đó thay `/bootstrap` bằng API theo từng trang (`GET /tickets/:id` đã có).
- **Hoàn thành khi:** không còn chỗ nào gọi `Math.max(...ids) + 1`. Tắt server rồi thao tác thì thấy toast lỗi, không có toast thành công.

---

## 🟡 MỨC THẤP

### G. Rate limit theo mã phiếu khóa nhầm khách thật
- **Vị trí:** [server/modules/public/public.routes.ts:36-42](../server/modules/public/public.routes.ts)
- **Vấn đề:** bộ đếm tính cả request đúng. Người khác chỉ cần thử sai 8 lần là chủ phiếu không tra cứu được trong 5 phút.
- **Cách sửa:** chỉ tăng bộ đếm khi số điện thoại sai (tăng sau khi so khớp, không tăng ở middleware). Trả lỗi giống nhau cho cả trường hợp "không có phiếu" và "sai số điện thoại" (hiện đã giống nhau, cần giữ nguyên).

### H. Đơn bán lẻ nhiều món có thể deadlock
- **Vị trí:** [server/modules/sales/sales.routes.ts:130-140](../server/modules/sales/sales.routes.ts)
- **Vấn đề:** các dòng `parts` bị khóa `FOR UPDATE` theo thứ tự trong giỏ hàng. Hai đơn cùng có món A và B nhưng thứ tự ngược nhau sẽ khóa chéo nhau, MySQL báo lỗi `1213` và trả `500`.
- **Cách sửa:** gộp các item theo `part_id` rồi sắp xếp tăng dần trước khi trừ kho. Bắt lỗi `ER_LOCK_DEADLOCK` để tự thử lại transaction tối đa 2 lần, hoặc trả `409`.

### I. Hủy phiếu luôn tự hoàn 100% tiền mặt
- **Vị trí:** [server/modules/tickets/tickets.service.ts:82-104](../server/modules/tickets/tickets.service.ts)
- **Vấn đề:** số tiền hoàn luôn bằng toàn bộ `paid_amount`, phương thức luôn là `Cash`. Cửa hàng không giữ lại được phí kiểm tra, và không hoàn được theo đúng phương thức khách đã trả.
- **Cách sửa:** thêm `refund_amount` (mặc định bằng `paid_amount`, cho phép từ 0 đến `paid_amount`) và `refund_method` vào `POST /tickets/:id/transition` khi chuyển sang `Cancelled`. Phần giữ lại được ghi thành doanh thu phí kiểm tra.

### J. Chưa có integration test cho các luồng tiền và kho
- Các test hiện có chỉ là unit test (validator, crypto, rate limit, schema).
- **Cần thêm** (Vitest/node:test + Supertest, MySQL chạy trong Docker):
  - 2 request thanh toán đồng thời cho cùng một phiếu thì `paid_amount` đúng.
  - Webhook gửi cùng `transaction_ref` 2 lần thì chỉ ghi 1 lần; sai chữ ký thì nhận `401`.
  - Xuất kho vượt tồn thì nhận `409`, tồn kho không đổi; xuất qua nhiều lô thì trừ đúng theo FIFO.
  - Bàn giao khi còn nợ hoặc chưa QC thì nhận `400`, không có bảo hành mới.
  - Hoàn tiền vượt số đã thu thì nhận `400`; hoàn một phần rồi hoàn phần còn lại thì đơn chuyển sang `Refunded`.
  - Kỹ thuật viên gửi `discount_amount` thì nhận `403`; tài khoản bị khóa thì token cũ nhận `401`.
  - Tạo 2 phiếu song song trong ngày đầu tiên thì mã không trùng.
- Chạy `npm run lint` và `npm test` trong CI (GitHub Actions).

### K. Phần lớn công việc chưa được commit
- `server/`, `shared/`, `drizzle.config.ts`, `package-lock.json`, `src/services/apiClient.ts` và khoảng 20 file đã sửa đều chưa có trong git.
- **Cách làm:** commit ngay phần hiện tại theo từng nhóm trước khi sửa tiếp:
  1. Backend nền tảng (config, middleware, db).
  2. Các module.
  3. Frontend chuyển sang API.
  4. Tài liệu.
- Thêm `.claude/` vào `.gitignore` nếu không muốn commit thư mục này.

---

## THỨ TỰ THỰC HIỆN ĐỀ XUẤT

| Bước | Việc | Mục |
|:---:|---|---|
| 1 | Commit phần hiện tại | K |
| 2 | Sửa migration và baseline DB cũ | A |
| 3 | Sửa bán sản phẩm tự nhập | B |
| 4 | Bàn giao kèm bảo hành trong cùng transaction; khóa thanh toán thủ công | C, D |
| 5 | Báo giá không ghi đè tiền phiếu khi chưa duyệt | E |
| 6 | Chuyển `TicketDetailPage`, `Kanban`, `Inventory` sang `await` API | F |
| 7 | Rate limit, deadlock, hoàn phí khi hủy | G, H, I |
| 8 | Integration test và CI | J |

Sau mỗi bước: chạy `npm run lint`, `npm test`, `npm run build`, `npm run build:server`, rồi commit riêng.

---

## PHỤ LỤC: CÁC MỤC ĐÃ XỬ LÝ (ĐỢT 2 → ĐỢT 3)

| Vấn đề cũ | Kết quả |
|---|---|
| Công cụ dev (`dev-switch-role`, `/reset`, seed) mở khi thiếu `NODE_ENV` | ✅ Mặc định production, cần `ENABLE_DEV_TOOLS=true`, từ chối khóa mẫu |
| Route tiền không phân quyền | ✅ Có role cho từng route; giá bán lẻ lấy từ DB; báo giá luôn `Sent`; QC do server tính |
| Hoàn tiền vượt số đã thu | ✅ Giới hạn theo `paid_amount − refund_amount`, có hoàn một phần |
| Webhook ký trên JSON đã tạo lại | ✅ Dùng raw body; kiểm tra `auto_payment_enabled`; nhận `ticket_prefix` |
| Tồn kho lô và tồn kho tổng lệch nhau | ✅ FIFO; `stock_quantity` bằng tổng các lô |
| JWT không kiểm tra DB; token lưu localStorage | ✅ Kiểm tra DB mỗi request; chỉ dùng cookie httpOnly; ép đổi mật khẩu tạm |
| Deadlock khi sinh mã đầu ngày | ✅ `INSERT … ON DUPLICATE KEY UPDATE LAST_INSERT_ID()` |
| Thanh toán đồng thời | ✅ `FOR UPDATE` trên phiếu |
| Lượt khuyến mãi bị tính nhiều lần | ✅ Có tham số `alreadyConsumedPromoId`, trả lượt khi hủy hoặc hoàn (còn lỗi phụ ở mục E) |
| Hủy phiếu không hoàn kho, hoàn tiền; bàn giao không kiểm tra điều kiện | ✅ (còn mục I) |
| Thông tin khách lấy từ client | ✅ Đọc từ DB, kiểm tra thiết bị thuộc khách |
| Duyệt báo giá ở hai nơi khác nhau | ✅ Dùng chung `respondToQuoteInTx` |
| Schema nằm ở 3 nơi | ✅ Chỉ còn Drizzle (còn mục A) |
| Login không rate limit, lộ trạng thái tài khoản bị khóa | ✅ Kiểm tra mật khẩu trước; có rate limit |
| Thiếu `trust proxy`; `Map` rate limit không được dọn | ✅ |
| `/bootstrap` trả mọi dữ liệu cho mọi role | ✅ Lọc theo role |
| `validateBody` sai với boolean | ✅ Có test |
| Nghiệp vụ nằm trong file route | ✅ Đã tách `*.service.ts` cho customers, inventory, tickets, promotions |
| `dist-server/` chưa nằm trong `.gitignore` | ✅ |
