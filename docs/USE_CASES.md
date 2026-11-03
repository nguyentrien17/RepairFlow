# ĐẶC TẢ CHI TIẾT 33 USE CASES (USE CASE SPECIFICATION)
## DỰ ÁN: REPAIRFLOW — HỆ THỐNG QUẢN LÝ TIẾP NHẬN & SỬA CHỮA THIẾT BỊ ĐIỆN TỬ

---

### MỤC LỤC USE CASES
- [UC-01: Đăng nhập hệ thống](#uc-01-đăng-nhập-hệ-thống)
- [UC-02: Quản lý tài khoản nhân viên](#uc-02-quản-lý-tài-khoản-nhân-viên)
- [UC-03: Quản lý vai trò và phân quyền](#uc-03-quản-lý-vai-trò-và-phân-quyền)
- [UC-04: Quản lý thông tin cửa hàng](#uc-04-quản-lý-thông-tin-cửa-hàng)
- [UC-05: Quản lý khách hàng](#uc-05-quản-lý-khách-hàng)
- [UC-06: Quản lý thiết bị khách hàng](#uc-06-quản-lý-thiết-bị-khách-hàng)
- [UC-07: Quản lý danh mục thiết bị](#uc-07-quản-lý-danh-mục-thiết-bị)
- [UC-08: Tiếp nhận thiết bị sửa chữa](#uc-08-tiếp-nhận-thiết-bị-sửa-chữa)
- [UC-09: In phiếu tiếp nhận](#uc-09-in-phiếu-tiếp-nhận)
- [UC-10: Phân công kỹ thuật viên](#uc-10-phân-công-kỹ-thuật-viên)
- [UC-11: Kiểm tra và chẩn đoán thiết bị](#uc-11-kiểm-tra-và-chẩn-đoán-thiết-bị)
- [UC-12: Lập báo giá sửa chữa](#uc-12-lập-báo-giá-sửa-chữa)
- [UC-13: Khách hàng xác nhận báo giá](#uc-13-khách-hàng-xác-nhận-báo-giá)
- [UC-14: Quản lý trạng thái sửa chữa](#uc-14-quản-lý-trạng-thái-sửa-chữa)
- [UC-15: Quản lý linh kiện và vật tư](#uc-15-quản-lý-linh-kiện-và-vật-tư)
- [UC-16: Nhập kho linh kiện](#uc-16-nhập-kho-linh-kiện)
- [UC-17: Xuất kho linh kiện cho phiếu sửa chữa](#uc-17-xuất-kho-linh-kiện-cho-phiếu-sửa-chữa)
- [UC-18: Quản lý nhà cung cấp](#uc-18-quản-lý-nhà-cung-cấp)
- [UC-19: Quản lý chi phí sửa chữa](#uc-19-quản-lý-chi-phí-sửa-chữa)
- [UC-20: Kiểm tra chất lượng sau sửa chữa (QC Checklist)](#uc-20-kiểm-tra-chất-lượng-sau-sửa-chữa)
- [UC-21: Quản lý thanh toán](#uc-21-quản-lý-thanh-toán)
- [UC-22: Quản lý công nợ](#uc-22-quản-lý-công-nợ)
- [UC-23: Bàn giao thiết bị](#uc-23-bàn-giao-thiết-bị)
- [UC-24: Quản lý bảo hành sửa chữa](#uc-24-quản-lý-bảo-hành-sửa-chữa)
- [UC-25: Tra cứu tình trạng sửa chữa công khai](#uc-25-tra-cứu-tình-trạng-sửa-chữa-công-khai)
- [UC-26: Gửi thông báo cho khách hàng](#uc-26-gửi-thông-báo-cho-khách-hàng)
- [UC-27: Quản lý lịch sử hoạt động (Audit Log)](#uc-27-quản-lý-lịch-sử-hoạt-động-audit-log)
- [UC-28: Dashboard tổng quan](#uc-28-dashboard-tổng-quan)
- [UC-29: Báo cáo và thống kê](#uc-29-báo-cáo-và-thống-kê)
- [UC-30: Tìm kiếm toàn hệ thống](#uc-30-tìm-kiếm-toàn-hệ-thống)
- [UC-31: Quản lý tệp đính kèm](#uc-31-quản-lý-tệp-đính-kèm)
- [UC-32: Quản lý hủy phiếu sửa chữa](#uc-32-quản-lý-hủy-phiếu-sửa-chữa)
- [UC-33: Cấu hình hệ thống](#uc-33-cấu-hình-hệ-thống)

---

### UC-01: Đăng nhập hệ thống
- **Actor:** Chủ cửa hàng (Admin), Quản lý (Manager), Nhân viên (Receptionist, Technician, Cashier).
- **Tiền điều kiện:** Tài khoản đã được tạo trên hệ thống và ở trạng thái "Active".
- **Hậu điều kiện:** Người dùng nhận JWT Access Token an toàn, điều hướng tới trang chức năng tương ứng theo vai trò.
- **Luồng chính:**
  1. Người dùng truy cập trang `/login` và nhập Email hoặc Tên đăng nhập kèm Mật khẩu.
  2. Hệ thống kiểm tra dữ liệu đầu vào (không rỗng, định dạng hợp lệ).
  3. Backend truy vấn tài khoản, kiểm tra hash mật khẩu và trạng thái hoạt động.
  4. Nếu khớp và tài khoản active: Tạo phiên làm việc (Token), cập nhật trường `last_login_at`, ghi Audit Log thành công.
  5. Trả về thông tin người dùng và quyền hạn; Frontend lưu trạng thái và chuyển trang Dashboard.
- **Ngoại lệ:**
  - Thông tin đăng nhập sai: Hiển thị thông báo chung *"Tài khoản hoặc mật khẩu không chính xác"* (không tiết lộ việc email có tồn tại hay không).
  - Tài khoản bị vô hiệu hóa: Thông báo *"Tài khoản đã bị tạm khóa, vui lòng liên hệ quản trị viên"*.
  - Đăng nhập sai quá 5 lần liên tiếp: Tạm thời khóa đăng nhập trong 15 phút để chống brute-force.
- **API tương ứng:** `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.

---

### UC-02: Quản lý tài khoản nhân viên
- **Actor:** Admin.
- **Tiền điều kiện:** Đã đăng nhập với vai trò Admin.
- **Hậu điều kiện:** Danh sách nhân sự được cập nhật chính xác trong cơ sở dữ liệu.
- **Chức năng:**
  - Xem danh sách nhân viên phân trang, tìm kiếm theo tên, email, số điện thoại.
  - Lọc theo chức vụ (Role) và trạng thái (Active / Inactive).
  - Thêm mới nhân viên: Điền họ tên, tên đăng nhập, email, SĐT, địa chỉ, gán vai trò ban đầu, mật khẩu khởi tạo.
  - Chỉnh sửa thông tin nhân viên, đổi trạng thái kích hoạt / tạm khóa.
  - Đặt lại mật khẩu (Reset password) ngẫu nhiên hoặc chỉ định.
  - Xem nhật ký các tác vụ nhân viên đã thực hiện trong hệ thống.
- **Quy tắc:**
  - Không cho phép người dùng tự chỉnh sửa vai trò của chính mình để nâng quyền.
  - Không xóa vĩnh viễn nhân viên đã từng tạo phiếu, xuất kho hoặc ký nhận chứng từ (sử dụng soft-delete hoặc chuyển `is_active = false`).
- **API tương ứng:** `GET /api/users`, `POST /api/users`, `PUT /api/users/:id`, `PATCH /api/users/:id/status`, `POST /api/users/:id/reset-password`.

---

### UC-03: Quản lý vai trò và phân quyền
- **Actor:** Admin.
- **Mô tả:** Hệ thống hỗ trợ mô hình RBAC (Role-Based Access Control) chặt chẽ.
- **Các vai trò:** Admin, Manager, Receptionist, Technician, Cashier.
- **Quy tắc:**
  - Backend là nơi quyết định tối cao quyền thực thi (Check permission middleware trên từng API route), không chỉ ẩn nút trên giao diện.
  - Các quyền gồm: `ticket:create`, `ticket:assign`, `ticket:diagnose`, `ticket:quote`, `ticket:approve_quote`, `inventory:manage`, `payment:create`, `report:view`, `settings:manage`.
- **API tương ứng:** `GET /api/roles`, `GET /api/permissions`, `PUT /api/roles/:id/permissions`.

---

### UC-04: Quản lý thông tin cửa hàng
- **Actor:** Admin, Manager.
- **Chức năng:** Cập nhật thông tin nhận diện thương hiệu hiển thị trên phiếu in và trang tra cứu: Tên cửa hàng, Logo, Địa chỉ, Hotline, Email, Mã số thuế, Thông tin tài khoản ngân hàng (Số TK, Ngân hàng, Chủ TK, QR VietQR), Tiền tố mã phiếu sửa chữa, Mẫu in mặc định.
- **API tương ứng:** `GET /api/store-settings`, `PUT /api/store-settings`.

---

### UC-05: Quản lý khách hàng
- **Actor:** Receptionist, Manager, Admin.
- **Chức năng:**
  - Xem danh sách khách hàng, tìm kiếm nhanh theo SĐT hoặc Họ tên.
  - Phân loại: Khách hàng cá nhân hoặc Khách hàng doanh nghiệp (có MST, tên công ty).
  - Thêm mới khách hàng với kiểm tra trùng lặp SĐT tự động.
  - Xem hồ sơ chi tiết 360 độ của khách hàng: Toàn bộ danh sách thiết bị đã mang đến, lịch sử tất cả phiếu sửa chữa, tổng chi phí đã giao dịch, tổng công nợ hiện tại.
- **API tương ứng:** `GET /api/customers`, `POST /api/customers`, `GET /api/customers/:id`, `PUT /api/customers/:id`, `GET /api/customers/:id/history`.

---

### UC-06: Quản lý thiết bị khách hàng
- **Actor:** Receptionist, Technician.
- **Chức năng:**
  - Lưu trữ hồ sơ thiết bị gắn liền với khách hàng sở hữu: Mã thiết bị, Loại thiết bị, Hãng (Brand), Dòng máy (Model), Serial Number / IMEI, Màu sắc, Ghi chú đặc điểm.
  - Cho phép tra cứu nhanh thiết bị theo Serial / IMEI khi khách mang đến lần sau để tái sử dụng hồ sơ cũ.
  - Xem lịch sử các lần bảo hành, sửa chữa trước đó của đúng thiết bị này.
- **API tương ứng:** `GET /api/devices`, `POST /api/devices`, `GET /api/devices/:id`, `GET /api/devices/lookup?serial=...`.

---

### UC-07: Quản lý danh mục thiết bị
- **Actor:** Admin, Manager.
- **Chức năng:**
  - Quản lý danh mục loại thiết bị: Laptop, PC (Desktop), Điện thoại, Máy tính bảng, Máy in, Màn hình, Thiết bị khác.
  - Quản lý Hãng sản xuất (Brand): Apple, Dell, Asus, HP, Lenovo, Samsung, Acer, Canon, v.v.
  - Quản lý Model tiêu biểu theo từng Hãng.
  - Bật / tắt danh mục. Ràng buộc toàn vẹn: Không cho xóa cứng các danh mục/hãng đã có thiết bị liên kết trong lịch sử phiếu.
- **API tương ứng:** `GET /api/device-categories`, `POST /api/device-categories`, `GET /api/device-brands`, `POST /api/device-brands`.

---

### UC-08: Tiếp nhận thiết bị sửa chữa (Core Intake)
- **Actor:** Receptionist.
- **Quy trình:**
  1. Lễ tân chọn khách hàng hiện có qua tìm kiếm SĐT hoặc tạo nhanh khách hàng mới ngay trên form tiếp nhận.
  2. Chọn thiết bị cũ của khách hoặc thêm mới thiết bị.
  3. Hệ thống tự động sinh Mã phiếu sửa chữa theo định dạng `SC-YYYYMMDD-XXXX` (đảm bảo tính tuần tự, duy nhất trong transaction).
  4. Ghi nhận thông tin kỹ thuật ban đầu:
     - Lỗi khách hàng mô tả.
     - Tình trạng thiết bị lúc nhận: Mở được nguồn hay không, pin, màn hình hiển thị.
     - Tình trạng ngoại quan: Vết trầy xước, nứt vỏ, móp góc, vỡ kính (đối chiếu trách nhiệm khi bàn giao).
     - Phụ kiện gửi kèm: Củ sạc, dây cáp, chuột, túi chống sốc, thẻ nhớ...
     - Mật khẩu mở máy / BIOS (nếu cần kỹ thuật kiểm tra - được mã hóa an toàn).
     - Ghi chú nội bộ của lễ tân.
     - Thời gian tiếp nhận (mặc định giờ hệ thống hiện tại).
     - Hẹn ngày dự kiến hoàn thành.
  5. Tải ảnh chụp ngoại quan máy lúc nhận (lưu trữ tệp đính kèm).
  6. Lưu phiếu thành công, tự động khởi tạo lịch sử trạng thái: `Received` (Đã tiếp nhận).
  7. Lập tức mở modal in Phiếu Tiếp Nhận (A5/A4) có mã QR tra cứu.
- **API tương ứng:** `POST /api/repair-tickets`, `GET /api/repair-tickets/:id`.

---

### UC-09: In phiếu tiếp nhận
- **Actor:** Receptionist.
- **Đặc tả in ấn:**
  - Hỗ trợ xem trước bản in (Print Preview) và nút In tức thì.
  - Khổ giấy tối ưu: A5 (dọc/ngang) và A4.
  - Nội dung phiếu: Logo + Tên + Hotline + Địa chỉ cửa hàng; Mã phiếu (Font to rõ + Barcode/QR Code tra cứu); Thông tin khách hàng; Thông tin thiết bị (Hãng, Model, Serial/IMEI); Tình trạng lúc nhận & Phụ kiện đi kèm; Lỗi khách mô tả; Điều khoản tiếp nhận sửa chữa (Cam kết bảo mật dữ liệu, thời hạn nhận máy); Chữ ký của Khách hàng và Người nhận máy.
  - Style CSS chuẩn `@media print` loại bỏ header, menu, background thừa.
- **API tương ứng:** `GET /api/repair-tickets/:id/print-data`.

---

### UC-10: Phân công kỹ thuật viên
- **Actor:** Manager, Receptionist.
- **Chức năng:**
  - Chọn một hoặc nhiều kỹ thuật viên phụ trách xử lý phiếu sửa chữa.
  - Chỉ định rõ Kỹ thuật viên chính (Primary Technician) chịu trách nhiệm chính.
  - Kỹ thuật viên nhận thông báo trong ứng dụng khi có phiếu mới được giao.
  - Cho phép Quản lý điều chuyển phiếu sang kỹ thuật viên khác khi cần thiết và ghi lại lịch sử phân công.
- **API tương ứng:** `POST /api/repair-tickets/:id/assign`, `GET /api/technicians/workload`.

---

### UC-11: Kiểm tra và chẩn đoán thiết bị
- **Actor:** Technician.
- **Chức năng:**
  - Kỹ thuật viên mở danh sách phiếu của mình, chuyển trạng thái sang `Diagnosing` (Đang kiểm tra).
  - Ghi nhận chi tiết kết quả kiểm tra phần cứng & phần mềm: Nguyên nhân gốc rễ gây ra lỗi (Root Cause).
  - Đề xuất phương án xử lý: Sửa chữa board mạch / Thay thế linh kiện / Vệ sinh bảo dưỡng.
  - Đề xuất danh sách linh kiện cần dùng từ kho hoặc đặt hàng bên ngoài.
  - Ước tính chi phí và thời gian hoàn thành dự kiến.
  - Đính kèm hình ảnh chụp linh kiện hỏng hóc hoặc video kiểm tra.
- **API tương ứng:** `POST /api/repair-tickets/:id/diagnostics`, `GET /api/repair-tickets/:id/diagnostics`.

---

### UC-12: Lập báo giá sửa chữa
- **Actor:** Technician, Manager.
- **Chức năng:**
  - Tạo báo giá chi tiết gồm các dòng mục (Quote Items): Tiền công sửa chữa (Labor fee), Linh kiện thay thế (chọn từ danh mục kho hoặc nhập tay), Số lượng, Đơn giá niêm yết, Chiết khấu/Giảm giá.
  - Backend tự động tính toán tổng thành tiền chính xác.
  - Báo giá có phiên bản (`version 1, 2, 3...`) để theo dõi khi phát sinh lỗi mới.
  - Thiết lập thời hạn hiệu lực của báo giá (ví dụ 3 ngày).
  - Trạng thái báo giá: `Draft` (Nháp) → `Sent` (Đã gửi khách) → `Approved` (Khách đồng ý) / `Rejected` (Khách từ chối) / `Expired` (Hết hạn).
- **API tương ứng:** `POST /api/repair-tickets/:id/quotes`, `GET /api/repair-tickets/:id/quotes`, `PUT /api/quotes/:id`.

---

### UC-13: Khách hàng xác nhận báo giá
- **Actor:** Receptionist, Customer (qua cổng tra cứu).
- **Chức năng:**
  - Tiếp nhận phản hồi của khách hàng qua điện thoại hoặc khách trực tiếp xác nhận trên cổng trực tuyến.
  - Nếu khách Đồng ý: Cập nhật báo giá sang `Approved`, tự động chuyển trạng thái phiếu sang `In_Progress` (Đang sửa chữa) hoặc `Waiting_Parts` (nếu thiếu linh kiện).
  - Nếu khách Từ chối: Ghi nhận lý do từ chối (giá cao, không muốn sửa, mua máy mới...), chuyển trạng thái phiếu sang `Cancelled` hoặc `Ready_For_Pickup` (trả máy không sửa).
  - **Quy tắc bắt buộc:** Kỹ thuật viên không được phép tiến hành sửa chữa nếu báo giá chưa được xác nhận `Approved` (trừ khi có xác nhận ngoại lệ của Manager và ghi rõ lý do).
- **API tương ứng:** `POST /api/repair-tickets/:id/approve-quote`, `POST /api/repair-tickets/:id/reject-quote`.

---

### UC-14: Quản lý trạng thái sửa chữa
- **Actor:** Technician, Manager, Receptionist.
- **11 Trạng thái chuẩn:**
  1. `Received` — Đã tiếp nhận
  2. `Diagnosing` — Đang kiểm tra
  3. `Waiting_Approval` — Chờ khách xác nhận báo giá
  4. `Waiting_Parts` — Chờ linh kiện
  5. `In_Progress` — Đang sửa chữa
  6. `Quality_Check` — Đang kiểm tra chất lượng sau sửa
  7. `Completed` — Đã sửa xong
  8. `Ready_For_Pickup` — Chờ khách đến nhận
  9. `Delivered` — Đã bàn giao
  10. `Warranty` — Đang xử lý bảo hành
  11. `Cancelled` — Đã hủy
- **Giao diện:** Cung cấp cả chế độ Danh sách lọc và Bảng Kanban trực quan kéo thả theo từng cột trạng thái.
- **Quy tắc chuyển đổi:** Bắt buộc tuân thủ điều kiện (ví dụ: không thể chuyển sang `Delivered` nếu chưa qua `Completed` hoặc chưa được duyệt thanh toán/công nợ). Lưu nhật ký lịch sử mọi lần đổi trạng thái.
- **API tương ứng:** `PATCH /api/repair-tickets/:id/status`, `GET /api/repair-tickets/:id/status-history`.

---

### UC-15: Quản lý linh kiện và vật tư
- **Actor:** Manager, Technician (chỉ xem).
- **Chức năng:**
  - Danh mục linh kiện: Mã SKU duy nhất, Tên linh kiện, Danh mục (Màn hình, Pin, Bàn phím, RAM, Ổ cứng, IC, Mainboard...), Hãng/Model tương thích, Giá nhập vốn, Giá bán niêm yết cho khách, Số lượng tồn kho hiện tại, Định mức tồn kho tối thiểu (Min Stock).
  - Cảnh báo trực quan các linh kiện sắp hết hàng (`stock <= min_stock`).
- **API tương ứng:** `GET /api/parts`, `POST /api/parts`, `GET /api/parts/:id`, `PUT /api/parts/:id`.

---

### UC-16: Nhập kho linh kiện
- **Actor:** Manager, Inventory Staff.
- **Chức năng:**
  - Tạo phiếu nhập kho: Chọn nhà cung cấp, ngày nhập, mã phiếu `PN-YYYYMMDD-XXXX`.
  - Thêm các dòng linh kiện nhập, số lượng, đơn giá nhập vốn.
  - Khi xác nhận nhập kho (trong Transaction): Tự động cộng số lượng tồn kho tương ứng, cập nhật giá nhập bình quân hoặc giá nhập mới nhất, ghi nhận giao dịch nhập vào lịch sử kho (`inventory_transactions`).
- **API tương ứng:** `POST /api/inventory/receipts`, `GET /api/inventory/receipts/:id`.

---

### UC-17: Xuất kho linh kiện cho phiếu sửa chữa
- **Actor:** Technician, Manager.
- **Chức năng:**
  - Kỹ thuật viên chọn phiếu sửa chữa cần thay thế linh kiện.
  - Chọn linh kiện từ kho, nhập số lượng cần dùng.
  - Hệ thống kiểm tra số lượng tồn kho: Không cho xuất kho nếu số lượng tồn không đủ.
  - Khi xác nhận xuất kho: Trừ số lượng tồn kho thực tế, lưu giá vốn và giá bán tại thời điểm xuất vào phiếu sửa chữa (`repair_part_usages`), ghi nhận mã phiếu xuất kho `PX-...`.
  - Hỗ trợ chức năng "Hoàn kho" (Return to Stock) nếu linh kiện chưa sử dụng hoặc khách đổi ý.
- **API tương ứng:** `POST /api/inventory/issues`, `POST /api/inventory/returns`.

---

### UC-18: Quản lý nhà cung cấp
- **Actor:** Manager, Admin.
- **Chức năng:** Quản lý danh bạ nhà phân phối / nhà cung cấp linh kiện: Mã NCC, Tên công ty, Người liên hệ, SĐT, Email, Địa chỉ, Ghi chú uy tín, Lịch sử các lần nhập hàng.
- **API tương ứng:** `GET /api/suppliers`, `POST /api/suppliers`, `PUT /api/suppliers/:id`.

---

### UC-19: Quản lý chi phí sửa chữa
- **Actor:** Manager, Technician.
- **Chức năng:**
  - Tách bạch rõ ràng giữa Giá bán tính cho khách hàng và Chi phí thực tế của cửa hàng:
    - Chi phí linh kiện (tính theo giá vốn lúc xuất kho).
    - Chi phí tiền công kỹ thuật.
    - Chi phí thuê ngoài (Outsource gia công, đóng chip, phục hồi dữ liệu chuyên sâu).
    - Chi phí vận chuyển/shipper gửi thiết bị.
  - Tính toán tự động Doanh thu, Chi phí và Lợi nhuận gộp trên từng phiếu sửa chữa.
- **API tương ứng:** `GET /api/repair-tickets/:id/costs`, `POST /api/repair-tickets/:id/expenses`.

---

### UC-20: Kiểm tra chất lượng sau sửa chữa (QC Checklist)
- **Actor:** Technician, Manager.
- **Chức năng:**
  - Sau khi sửa xong, kỹ thuật viên thực hiện kiểm tra theo bảng Checklist tiêu chuẩn:
    1. Khởi động nguồn ổn định.
    2. Màn hình & cảm ứng hiển thị sắc nét, không sọc, không điểm chết.
    3. Bàn phím & Touchpad hoạt động tốt mọi phím.
    4. Âm thanh loa ngoài & Microphone rõ ràng, không rè.
    5. Kết nối Wi-Fi & Bluetooth bắt sóng tốt.
    6. Camera trước/sau hoạt động bình thường.
    7. Cổng sạc và các cổng kết nối ngoại vi (USB, Type-C, HDMI...).
    8. Kiểm tra triệt để lỗi khách hàng mô tả ban đầu đã được giải quyết dứt điểm.
  - Đánh dấu trạng thái Từng mục (Đạt / Không đạt / Không áp dụng), kèm ghi chú và ảnh chụp minh chứng.
  - Chỉ khi toàn bộ các mục bắt buộc đạt yêu cầu thì hệ thống mới cho phép chuyển sang trạng thái `Completed`.
- **API tương ứng:** `GET /api/repair-tickets/:id/checklist`, `POST /api/repair-tickets/:id/checklist`.

---

### UC-21: Quản lý thanh toán
- **Actor:** Cashier, Manager.
- **Chức năng:**
  - Xem tổng số tiền khách phải thanh toán (dựa trên báo giá đã duyệt hoặc tổng chi phí dịch vụ/linh kiện).
  - Hỗ trợ thanh toán nhiều lần: Khách đặt cọc khi nhận máy, thanh toán đợt 2, thanh toán dứt điểm khi nhận máy.
  - Hình thức thanh toán: Tiền mặt, Chuyển khoản ngân hàng (hỗ trợ hiển thị QR VietQR động đúng số tiền và mã phiếu), Thẻ POS.
  - Ghi nhận mã giao dịch ngân hàng đối soát.
  - Hệ thống lưu lại toàn bộ lịch sử các lần thanh toán (không chỉ ghi đè một trường số tiền duy nhất).
  - In Hóa đơn thanh toán / Phiếu thu tiền cho khách.
- **Quy tắc:** Không cho phép thu số tiền vượt quá giá trị còn lại của phiếu sửa chữa trừ khi có nghiệp vụ làm tròn đặc biệt.
- **API tương ứng:** `POST /api/repair-tickets/:id/payments`, `GET /api/repair-tickets/:id/payments`.

---

### UC-22: Quản lý công nợ
- **Actor:** Manager, Cashier.
- **Chức năng:**
  - Theo dõi danh sách các phiếu sửa chữa đã hoàn thành nhưng chưa thanh toán đủ.
  - Thống kê chi tiết: Tổng tiền dịch vụ, Đã thanh toán, Còn nợ lại, Ngày đến hạn thanh toán.
  - Quản lý công nợ theo từng khách hàng (đặc biệt là khách hàng doanh nghiệp thanh toán theo tháng).
  - Thu nợ bổ sung và in phiếu thu nợ.
- **API tương ứng:** `GET /api/debts`, `GET /api/customers/:id/debts`, `POST /api/debts/settle`.

---

### UC-23: Bàn giao thiết bị
- **Actor:** Receptionist, Cashier.
- **Điều kiện bàn giao:**
  - Thiết bị đã hoàn thành sửa chữa (`Completed` hoặc `Ready_For_Pickup`) hoặc phiếu bị hủy (`Cancelled`).
  - Phiếu đã thanh toán đủ 100% HOẶC khách hàng được Manager duyệt chính sách cho nợ (Debt Allowed).
- **Quy trình:**
  - Kiểm tra và bàn giao lại đầy đủ phụ kiện gửi kèm ban đầu (đối chiếu danh sách phụ kiện lúc tiếp nhận).
  - Cho khách kiểm tra ngoại quan và tính năng máy tại chỗ.
  - Ghi nhận họ tên người nhận máy, số điện thoại, ghi chú bàn giao.
  - Ký nhận biên bản bàn giao (hoặc xác nhận điện tử).
  - Tự động chuyển trạng thái phiếu sang `Delivered` (Đã bàn giao).
  - Tự động kích hoạt gói bảo hành sửa chữa cho thiết bị.
  - In Biên bản bàn giao thiết bị & Phiếu bảo hành.
- **API tương ứng:** `POST /api/repair-tickets/:id/deliver`.

---

### UC-24: Quản lý bảo hành sửa chữa
- **Actor:** Receptionist, Technician, Manager.
- **Chức năng:**
  - Hệ thống tự động tạo mã bảo hành `BH-YYYYMMDD-XXXX` gắn liền với phiếu sửa chữa gốc.
  - Tính toán ngày bắt đầu và ngày kết thúc bảo hành (dựa theo cấu hình mặc định ví dụ 30 ngày, 90 ngày hoặc 180 ngày tùy từng linh kiện/dịch vụ).
  - Tra cứu nhanh bảo hành theo: Mã phiếu gốc, Số điện thoại khách hàng, hoặc Serial/IMEI thiết bị.
  - Kiểm tra xem thiết bị mang đến có còn nằm trong thời hạn bảo hành hay không.
  - Khi phát sinh bảo hành: Tạo Phiếu tiếp nhận bảo hành mới (Warranty Claim Ticket), liên kết trực tiếp với phiếu sửa chữa gốc, xác định bảo hành Miễn phí hay Tính phí (do lỗi người dùng như rơi vỡ, vào nước).
- **API tương ứng:** `GET /api/warranties`, `GET /api/warranties/check?serial=...`, `POST /api/warranties/claims`.

---

### UC-25: Tra cứu tình trạng sửa chữa công khai (Public Lookup Portal)
- **Actor:** Khách hàng (Customer - Không cần đăng nhập tài khoản nhân viên).
- **Chức năng:**
  - Khách hàng quét mã QR trên phiếu tiếp nhận hoặc truy cập đường dẫn `/lookup`.
  - Nhập Mã phiếu sửa chữa (ví dụ `SC-20261103-0001`) và 4 số cuối SĐT để xác thực bảo mật.
  - Xem thông tin công khai:
    - Thông tin cửa hàng tiếp nhận.
    - Tên thiết bị, model.
    - Lỗi tiếp nhận ban đầu.
    - Tiến trình xử lý theo thời gian thực (Timeline từ Tiếp nhận → Đang sửa → Hoàn tất).
    - Xem bảng báo giá chi tiết và có nút Bấm Xác Nhận / Từ chối trực tuyến.
    - Trạng thái thanh toán (Đã thanh toán / Còn lại).
    - Thông tin bảo hành sau khi nhận máy.
  - **Bảo mật tuyệt đối:** Không bao giờ để lộ ghi chú nội bộ, chi phí vốn, thông tin tài khoản kỹ thuật viên hay mật khẩu thiết bị trên giao diện này.
- **API tương ứng:** `POST /api/public/tickets/lookup`, `POST /api/public/tickets/:code/confirm-quote`.

---

### UC-26: Gửi thông báo cho khách hàng
- **Actor:** System, Receptionist, Manager.
- **Chức năng:**
  - Hệ thống tích hợp Notification Service kiến trúc Module mở rộng.
  - Tự động hoặc thủ công kích hoạt thông báo vào các thời điểm quan trọng:
    - Khi vừa tạo phiếu tiếp nhận thành công (kèm link tra cứu).
    - Khi có báo giá sửa chữa cần duyệt.
    - Khi sửa xong, mời khách đến nhận máy.
    - Khi gần hết hạn bảo hành.
  - Hỗ trợ các kênh: Thông báo giao diện nội bộ (In-app notification), Mẫu tin nhắn SMS/Zalo/Email sẵn sàng tích hợp webhook/API.
- **API tương ứng:** `GET /api/notifications`, `POST /api/notifications/send`.

---

### UC-27: Quản lý lịch sử hoạt động (Audit Log)
- **Actor:** Admin, Manager.
- **Chức năng:**
  - Tự động ghi vết mọi hành động trọng yếu: Ai tạo phiếu, Ai sửa đổi thông tin, Ai chuyển trạng thái, Ai thay đổi báo giá, Ai thực hiện thu tiền, Ai duyệt hủy phiếu.
  - Lưu trữ giá trị trước khi sửa (`old_values`) và giá trị sau khi sửa (`new_values`) dưới dạng JSON.
  - Ghi nhận IP người dùng và thời gian chính xác.
  - Tìm kiếm và lọc theo nhân viên, loại hành động, khoảng thời gian.
  - Nhân viên thông thường không có quyền xóa hoặc sửa đổi Audit Log.
- **API tương ứng:** `GET /api/audit-logs`.

---

### UC-28: Dashboard tổng quan
- **Actor:** Admin, Manager, Technician.
- **Chỉ số thời gian thực (Real-time Metrics):**
  - Số phiếu tiếp nhận trong ngày.
  - Số phiếu đang chẩn đoán & đang sửa chữa.
  - Số phiếu đang chờ khách duyệt báo giá.
  - Số phiếu đang chờ linh kiện.
  - Số phiếu đã sửa xong chờ bàn giao.
  - Doanh thu hôm nay, Doanh thu tuần & Doanh thu tháng.
  - Tổng công nợ khách hàng còn phải thu.
  - Số lượng máy đang xử lý bảo hành.
  - Danh sách công việc cá nhân của kỹ thuật viên đăng nhập.
  - Danh sách cảnh báo phiếu quá hạn dự kiến (Overdue tickets).
  - Biểu đồ phân bổ trạng thái phiếu và xu hướng doanh thu.
- **API tương ứng:** `GET /api/dashboard/stats`, `GET /api/dashboard/charts`.

---

### UC-29: Báo cáo và thống kê
- **Actor:** Admin, Manager.
- **Các báo cáo nghiệp vụ:**
  - Báo cáo doanh thu theo ngày / tháng / năm / khoảng ngày tùy chọn.
  - Báo cáo lợi nhuận ước tính (Doanh thu trừ Chi phí linh kiện và Chi phí phát sinh).
  - Báo cáo số lượng phiếu sửa chữa theo Loại thiết bị và theo Hãng sản xuất.
  - Báo cáo hiệu suất kỹ thuật viên (Số phiếu hoàn thành, thời gian sửa trung bình, tỷ lệ bảo hành lại).
  - Báo cáo kho: Xuất - Nhập - Tồn kho linh kiện, cảnh báo linh kiện tồn lâu.
  - Báo cáo tổng hợp công nợ khách hàng.
  - Hỗ trợ xuất dữ liệu ra file Excel / CSV và nút In báo cáo tối ưu trình duyệt.
- **API tương ứng:** `GET /api/reports/revenue`, `GET /api/reports/technicians`, `GET /api/reports/inventory`.

---

### UC-30: Tìm kiếm toàn hệ thống (Global Search)
- **Actor:** Toàn bộ nhân viên có quyền truy cập.
- **Chức năng:**
  - Thanh tìm kiếm thông minh tại Header ứng dụng.
  - Hỗ trợ tìm nhanh tức thì bằng 1 từ khóa: Mã phiếu (`SC-...`), Tên khách hàng, Số điện thoại, Mã thiết bị, Serial Number / IMEI máy, Tên linh kiện.
  - Trả về kết quả phân nhóm rõ ràng (Phiếu sửa chữa, Khách hàng, Thiết bị, Linh kiện).
- **API tương ứng:** `GET /api/search?q=...`.

---

### UC-31: Quản lý tệp đính kèm
- **Actor:** Receptionist, Technician, Manager.
- **Chức năng:**
  - Cho phép tải lên hình ảnh chụp thiết bị lúc tiếp nhận, ảnh chụp linh kiện hỏng, ảnh chụp màn hình kiểm tra, biên bản kỹ thuật.
  - Hỗ trợ định dạng an toàn: JPG, PNG, WEBP, PDF (giới hạn dung lượng tối đa 10MB/file).
  - Xem trước (Lightbox Preview) ảnh trực tiếp trên trình duyệt.
  - Phân loại giai đoạn ảnh: `Intake` (Tiếp nhận), `Diagnostics` (Chẩn đoán), `QC` (Kiểm tra chất lượng), `Delivery` (Bàn giao).
- **API tương ứng:** `POST /api/repair-tickets/:id/attachments`, `GET /api/repair-tickets/:id/attachments`, `DELETE /api/attachments/:id`.

---

### UC-32: Quản lý hủy phiếu sửa chữa
- **Actor:** Manager, Admin.
- **Quy trình:**
  - Khi khách không đồng ý sửa hoặc thiết bị không thể sửa được, người dùng yêu cầu Hủy phiếu.
  - Bắt buộc nhập lý do hủy chi tiết.
  - Hệ thống tự động kiểm tra:
    - Nếu đã xuất kho linh kiện cho phiếu: Bắt buộc tự động hoàn kho (Rollback kho) để bảo toàn số lượng tồn.
    - Nếu khách đã đặt cọc tiền: Cảnh báo hiển thị số tiền cọc cần hoàn trả cho khách hàng hoặc thu phí kiểm tra (nếu có chính sách).
  - Chuyển trạng thái phiếu sang `Cancelled`, không xóa vật lý bản ghi dữ liệu.
- **API tương ứng:** `POST /api/repair-tickets/:id/cancel`.

---

### UC-33: Cấu hình hệ thống
- **Actor:** Admin.
- **Chức năng:**
  - Tiền tố mã phiếu sửa chữa (mặc định: `SC`).
  - Thời hạn bảo hành mặc định theo từng loại dịch vụ (ngày).
  - Cấu hình phí kiểm tra thiết bị mặc định (nếu khách từ chối sửa).
  - Cấu hình thông tin tài khoản VietQR nhận chuyển khoản ngân hàng.
  - Tùy chỉnh điều khoản & chính sách in trên phiếu tiếp nhận / bàn giao.
  - Tùy biến mẫu checklist kiểm tra chất lượng theo loại thiết bị.
- **API tương ứng:** `GET /api/settings`, `PUT /api/settings`.
