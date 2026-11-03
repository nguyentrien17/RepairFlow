import { RepairStatus, RepairPriority } from '../types';

export function formatVND(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '0 đ';
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '---';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '---';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export const STATUS_CONFIG: Record<
  RepairStatus,
  { label: string; bg: string; text: string; border: string; step: number }
> = {
  Received: {
    label: 'Đã tiếp nhận',
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-800 dark:text-slate-200',
    border: 'border-slate-300',
    step: 1,
  },
  Diagnosing: {
    label: 'Đang kiểm tra',
    bg: 'bg-blue-50 dark:bg-blue-950/60',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300',
    step: 2,
  },
  Waiting_Approval: {
    label: 'Chờ khách duyệt',
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-300',
    step: 3,
  },
  Waiting_Parts: {
    label: 'Chờ linh kiện',
    bg: 'bg-purple-50 dark:bg-purple-950/60',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-300',
    step: 4,
  },
  In_Progress: {
    label: 'Đang sửa chữa',
    bg: 'bg-indigo-50 dark:bg-indigo-950/60',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-300',
    step: 5,
  },
  Quality_Check: {
    label: 'Kiểm tra chất lượng',
    bg: 'bg-cyan-50 dark:bg-cyan-950/60',
    text: 'text-cyan-800 dark:text-cyan-300',
    border: 'border-cyan-300',
    step: 6,
  },
  Completed: {
    label: 'Đã sửa xong',
    bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-300',
    step: 7,
  },
  Ready_For_Pickup: {
    label: 'Chờ khách nhận',
    bg: 'bg-teal-50 dark:bg-teal-950/60',
    text: 'text-teal-800 dark:text-teal-300',
    border: 'border-teal-300',
    step: 8,
  },
  Delivered: {
    label: 'Đã bàn giao',
    bg: 'bg-green-100 dark:bg-green-950/70',
    text: 'text-green-800 dark:text-green-200',
    border: 'border-green-400',
    step: 9,
  },
  Warranty: {
    label: 'Đang bảo hành',
    bg: 'bg-orange-50 dark:bg-orange-950/60',
    text: 'text-orange-800 dark:text-orange-300',
    border: 'border-orange-300',
    step: 10,
  },
  Cancelled: {
    label: 'Đã hủy',
    bg: 'bg-rose-50 dark:bg-rose-950/60',
    text: 'text-rose-700 dark:text-rose-300',
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

export function getVietQRUrl(bankName: string, accountNo: string, accountName: string, amount: number, memo: string): string {
  // VietQR quick chart URL or qr generator
  const encodedMemo = encodeURIComponent(memo);
  const encodedName = encodeURIComponent(accountName);
  return `https://api.vietqr.io/image/970422-${accountNo}-compact2.png?amount=${amount}&addInfo=${encodedMemo}&accountName=${encodedName}`;
}

export function getTicketQrUrl(ticketCode: string): string {
  const url = `${window.location.origin}/lookup?ticket=${ticketCode}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(url)}`;
}
