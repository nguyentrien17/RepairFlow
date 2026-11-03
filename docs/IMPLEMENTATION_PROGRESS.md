# TIẾN ĐỘ TRIỂN KHAI HỆ THỐNG REPAIRFLOW (IMPLEMENTATION PROGRESS)

---

### TỔNG QUAN TIẾN ĐỘ

- **Tên dự án:** RepairFlow — Quản lý tiếp nhận & sửa chữa thiết bị điện tử
- **Trạng thái:** Hoàn thành triển khai và kiểm thử toàn diện
- **Kiến trúc:** React 19 + TypeScript + Tailwind CSS v4 + Express RESTful Schema + LocalStorage ACID Mock Engine
- **Bản địa hóa:** 100% Tiếng Việt, Tiền tệ VND (`###.### đ`), Múi giờ `Asia/Ho_Chi_Minh` (GMT+7), In ấn A5/A4, QR VietQR động & QR tra cứu công khai

---

### DANH SÁCH 33 USE CASES ĐÃ TRIỂN KHAI & KIỂM THỬ

| Mã UC | Tên Use Case | Trạng thái | Module phụ trách | Ghi chú nghiệm thu |
|:---:|---|:---:|---|---|
| **UC-01** | Đăng nhập hệ thống & Phiên làm việc | ✅ Hoàn thành | `AuthContext` | Đăng nhập an toàn, chuyển đổi nhanh 5 vai trò kiểm thử |
| **UC-02** | Quản lý tài khoản nhân viên | ✅ Hoàn thành | `StaffPage` | Thêm, sửa, đổi trạng thái, đặt lại mật khẩu |
| **UC-03** | Quản lý vai trò và phân quyền (RBAC) | ✅ Hoàn thành | `AuthContext`, `Sidebar` | 5 vai trò chuẩn: Admin, Manager, Receptionist, Technician, Cashier |
| **UC-04** | Quản lý thông tin cửa hàng | ✅ Hoàn thành | `SettingsPage` | Tên cửa hàng, Slogan, Hotline, Địa chỉ, STK VietQR |
| **UC-05** | Quản lý khách hàng | ✅ Hoàn thành | `CustomerListPage` | Cá nhân & Doanh nghiệp, theo dõi công nợ, tìm kiếm SĐT |
| **UC-06** | Quản lý thiết bị khách hàng | ✅ Hoàn thành | `DeviceListPage` | Liên kết thiết bị với khách hàng, tra cứu Serial/IMEI |
| **UC-07** | Quản lý danh mục thiết bị | ✅ Hoàn thành | `DeviceListPage` | Phân loại Laptop, PC, Điện thoại, Tablet, Máy in, Màn hình |
| **UC-08** | Tiếp nhận thiết bị sửa chữa (Core Intake) | ✅ Hoàn thành | `IntakePage` | Tạo mã `SC-YYYYMMDD-XXXX`, ghi ngoại quan, phụ kiện, pass máy |
| **UC-09** | In phiếu tiếp nhận (A5/A4) | ✅ Hoàn thành | `PrintModal` | Tối ưu in A5/A4, mã QR tra cứu, điều khoản cam kết, 2 chữ ký |
| **UC-10** | Phân công kỹ thuật viên | ✅ Hoàn thành | `TicketDetailPage` | Giao việc cho KTV trưởng / KTV phụ trách chính |
| **UC-11** | Kiểm tra và chẩn đoán thiết bị | ✅ Hoàn thành | `TicketDetailPage` | Ghi nguyên nhân gốc rễ, phương án xử lý, thời gian, dự toán |
| **UC-12** | Lập báo giá sửa chữa | ✅ Hoàn thành | `TicketDetailPage` | Chi tiết tiền công + linh kiện, chiết khấu, tính tổng tiền |
| **UC-13** | Khách hàng xác nhận báo giá | ✅ Hoàn thành | `TicketDetailPage`, `PublicLookup` | Duyệt / Từ chối tại quầy hoặc khách duyệt trực tuyến qua cổng QR |
| **UC-14** | Quản lý 11 trạng thái & Bảng Kanban | ✅ Hoàn thành | `KanbanPage`, `TicketDetailPage` | Dòng chảy 8 cột Kanban trực quan, chuyển trạng thái linh hoạt |
| **UC-15** | Quản lý linh kiện và vật tư | ✅ Hoàn thành | `InventoryPage` | Quản lý SKU, giá vốn, giá bán, cảnh báo sắp hết hàng |
| **UC-16** | Nhập kho linh kiện | ✅ Hoàn thành | `InventoryPage` | Tăng số lượng tồn kho, ghi nhận lịch sử giao dịch kho |
| **UC-17** | Xuất kho linh kiện cho phiếu sửa chữa | ✅ Hoàn thành | `TicketDetailPage` | Trừ tồn kho tự động, hoàn kho, không cho xuất âm kho |
| **UC-18** | Quản lý nhà cung cấp | ✅ Hoàn thành | `InventoryPage` | Danh bạ NCC phân phối màn hình, pin, linh kiện vi mạch |
| **UC-19** | Quản lý chi phí sửa chữa | ✅ Hoàn thành | `TicketDetailPage`, `ReportsPage` | Phân tách giá vốn linh kiện, tiền công và lợi nhuận gộp |
| **UC-20** | Kiểm tra chất lượng sau sửa (QC Checklist) | ✅ Hoàn thành | `TicketDetailPage` | 8 tiêu chí kiểm tra phần cứng/phần mềm chuẩn Đạt/Không đạt |
| **UC-21** | Quản lý thanh toán | ✅ Hoàn thành | `TicketDetailPage`, `PaymentListPage` | Thu tiền mặt, mã VietQR động theo mã phiếu, in hóa đơn thu tiền |
| **UC-22** | Quản lý công nợ | ✅ Hoàn thành | `PaymentListPage`, `CustomerListPage` | Lọc danh sách phiếu còn nợ, đối soát công nợ khách hàng |
| **UC-23** | Bàn giao thiết bị | ✅ Hoàn thành | `TicketDetailPage` | Kiểm tra điều kiện bàn giao, xác nhận trả phụ kiện, in biên bản |
| **UC-24** | Quản lý bảo hành sửa chữa | ✅ Hoàn thành | `WarrantyListPage` | Kích hoạt bảo hành điện tử (30-365 ngày), tra cứu hạn BH |
| **UC-25** | Tra cứu tình trạng công khai (Public Portal) | ✅ Hoàn thành | `PublicLookupPortal` | Cổng tra cứu không cần login, hiển thị tiến độ, duyệt báo giá online |
| **UC-26** | Gửi thông báo cho khách hàng | ✅ Hoàn thành | `PublicLookupPortal`, `ToastContext` | Thông báo tiến độ qua link tra cứu và popup hệ thống |
| **UC-27** | Quản lý lịch sử hoạt động (Audit Log) | ✅ Hoàn thành | `AuditLogPage` | Ghi vết tạo phiếu, lập báo giá, thu tiền, hủy phiếu kèm thời gian |
| **UC-28** | Dashboard tổng quan | ✅ Hoàn thành | `DashboardPage` | KPI doanh thu, số phiếu theo trạng thái, cảnh báo gấp |
| **UC-29** | Báo cáo và thống kê | ✅ Hoàn thành | `ReportsPage` | Biểu đồ phân bổ loại máy, doanh thu, xuất file CSV |
| **UC-30** | Tìm kiếm toàn hệ thống (Global Search) | ✅ Hoàn thành | `Navbar` | Tìm nhanh tức thì mã SC-..., Tên khách, SĐT, Serial thiết bị |
| **UC-31** | Quản lý tệp đính kèm | ✅ Hoàn thành | `TicketDetailPage` | Hiển thị mã QR và liên kết tài liệu theo giai đoạn |
| **UC-32** | Quản lý hủy phiếu sửa chữa an toàn | ✅ Hoàn thành | `TicketDetailPage` | Nhập lý do hủy, chuyển trạng thái `Cancelled`, lưu audit log |
| **UC-33** | Cấu hình hệ thống | ✅ Hoàn thành | `SettingsPage` | Tiền tố mã phiếu, thời gian BH mặc định, mẫu in, thông tin VietQR |
