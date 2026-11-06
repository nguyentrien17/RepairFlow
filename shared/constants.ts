import { RepairStatus, RepairPriority, StoreSettings } from './types/index.js';

export const STATUS_CONFIG: Record<
  RepairStatus,
  { label: string; bg: string; text: string; border: string; step: number }
> = {
  Received: {
    label: 'Đã tiếp nhận',
    bg: 'bg-slate-100',
    text: 'text-slate-800',
    border: 'border-slate-300',
    step: 1,
  },
  Diagnosing: {
    label: 'Đang kiểm tra',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-300',
    step: 2,
  },
  Waiting_Approval: {
    label: 'Chờ khách duyệt',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-300',
    step: 3,
  },
  Waiting_Parts: {
    label: 'Chờ linh kiện',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-300',
    step: 4,
  },
  In_Progress: {
    label: 'Đang sửa chữa',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-300',
    step: 5,
  },
  Quality_Check: {
    label: 'Kiểm tra chất lượng',
    bg: 'bg-cyan-50',
    text: 'text-cyan-800',
    border: 'border-cyan-300',
    step: 6,
  },
  Completed: {
    label: 'Đã sửa xong',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-300',
    step: 7,
  },
  Ready_For_Pickup: {
    label: 'Chờ khách nhận',
    bg: 'bg-teal-50',
    text: 'text-teal-800',
    border: 'border-teal-300',
    step: 8,
  },
  Delivered: {
    label: 'Đã bàn giao',
    bg: 'bg-green-50',
    text: 'text-green-800',
    border: 'border-green-300',
    step: 9,
  },
  Warranty: {
    label: 'Đang bảo hành',
    bg: 'bg-orange-50',
    text: 'text-orange-800',
    border: 'border-orange-300',
    step: 10,
  },
  Cancelled: {
    label: 'Đã hủy',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-300',
    step: 0,
  },
};

export const PRIORITY_CONFIG: Record<
  RepairPriority,
  { label: string; badgeClass: string }
> = {
  Low: {
    label: 'Thấp',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
  },
  Normal: {
    label: 'Bình thường',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  High: {
    label: 'Cao',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  Urgent: {
    label: 'Khẩn cấp',
    badgeClass: 'bg-red-100 text-red-800 border-red-300 font-bold animate-pulse',
  },
};

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
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
  default_return_days: 15,
  terms_intake:
    '1. Quý khách vui lòng sao lưu dữ liệu cá nhân trước khi bàn giao. Cửa hàng không chịu trách nhiệm về dữ liệu phần mềm.\n2. Thiết bị sau khi thông báo hoàn tất, quý khách vui lòng đến nhận trong vòng 30 ngày.\n3. Vui lòng giữ phiếu tiếp nhận để đối chiếu khi nhận máy.',
  terms_warranty:
    '1. Bảo hành miễn phí các lỗi kỹ thuật và linh kiện đã thay thế trong thời hạn cam kết.\n2. Không bảo hành các trường hợp: Rơi vỡ, nứt cấn, ngấm nước, chập cháy do nguồn điện không ổn định hoặc tự ý tháo dỡ tem niêm phong.',
  auto_payment_enabled: true,
  payment_gateway_provider: 'sepay',
  pos_terminal_id: 'VNPAY_POS_Q1_01',
  pos_ip_address: '192.168.1.188:8080',
};
