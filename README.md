# RepairFlow — Hệ thống Quản lý Tiếp nhận, Sửa chữa Thiết bị & Bán lẻ

## 1. Kiến trúc hệ thống
- **Frontend:** React 19 + TypeScript + Tailwind CSS v4 + Vite (Code-splitting theo từng trang).
- **Backend:** Node.js + Express + TypeScript.
- **Cơ sở dữ liệu:** MySQL 8.x + Drizzle ORM (`drizzle-orm/mysql2` & `drizzle-kit`).

## 2. Cấu hình môi trường (`.env`)
Sao chép `.env.example` thành `.env` và cập nhật thông tin kết nối MySQL cùng các khóa bảo mật:
- `NODE_ENV=production` (mặc định).
- `ENABLE_DEV_TOOLS=false` (chỉ bật `true` ở môi trường phát triển nội bộ khi cần seed mẫu hoặc chuyển nhanh role).
- `JWT_SECRET` & `DEVICE_SECRET_KEY`: bắt buộc thay bằng chuỗi ngẫu nhiên bảo mật trước khi chạy production (tối thiểu 32 ký tự).

## 3. Quy trình Quản lý Schema & Migration (Drizzle ORM)
1. **Nguồn schema duy nhất:** Toàn bộ bảng và ràng buộc được khai báo tại [`server/db/schema.ts`](server/db/schema.ts).
2. **Khi phát triển (Development):**
   - Sau khi chỉnh sửa `server/db/schema.ts`, chạy lệnh sinh file SQL migration:
     ```bash
     npm run db:generate
     ```
   - Kiểm tra file SQL sinh ra trong `server/db/migrations/` và commit cả file `.sql` lẫn `server/db/migrations/meta/` vào Git.
3. **Khi triển khai (Deploy / Production):**
   - Khi khởi động (`npm start` hoặc `npm run server`), backend tự động gọi `migrate()` từ `server/db/migrations/`.
   - Nếu bất kỳ migration nào gặp lỗi, tiến trình server sẽ dừng ngay lập tức (`exit 1`) để bảo vệ toàn vẹn dữ liệu.
   - **Tuyệt đối không dùng `npm run db:push` trên môi trường production.**
4. **Baseline cho DB cũ đã có sẵn bảng (trước khi dùng Drizzle Migrator):**
   - Nếu DB MySQL đã có sẵn 23 bảng khớp với `0000_freezing_sally_floyd.sql` nhưng bảng `__drizzle_migrations` chưa có bản ghi `0000`, chạy một lần:
     ```bash
     npm run db:baseline
     ```
   - Sau khi baseline xong, các migration tiếp theo (`0001`, `0002`...) sẽ chạy tự động khi khởi động server.

## 4. Các lệnh thông dụng
```bash
# Kiểm tra kiểu TypeScript
npm run lint

# Chạy bộ kiểm thử tự động (unit test; phần integration MySQL tự skip nếu không phải DB test)
npm test

# Chạy cả integration test với MySQL — CHỈ trên DB riêng có tên kết thúc bằng "_test"
# (bộ test XÓA TOÀN BỘ dữ liệu của DB đó rồi seed lại)
# PowerShell:
$env:NODE_ENV='test'; $env:DB_NAME='repairflow_test'; npm test
# bash:
NODE_ENV=test DB_NAME=repairflow_test npm test

# Build frontend & backend cho production
npm run build
npm run build:server

# Khởi chạy production server
npm start
```

