import React, { useState } from 'react';
import { StorageService } from '../../services/mockStorage';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  RepairTicket,
  RepairStatus,
  RepairDiagnostic,
  RepairQuote,
  QCChecklist,
  QCItem,
  Payment,
  PaymentMethod,
  PaymentType,
} from '../../types';
import {
  formatVND,
  formatDateTime,
  formatDate,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  getVietQRUrl,
  getTicketQrUrl,
} from '../../utils/formatters';
import {
  ArrowLeft,
  Printer,
  Wrench,
  CheckCircle2,
  Clock,
  DollarSign,
  ShieldCheck,
  FileText,
  Boxes,
  Plus,
  Send,
  AlertTriangle,
  QrCode,
  Check,
  X,
  CreditCard,
  UserCheck,
} from 'lucide-react';
import { PrintModal } from '../../components/print/PrintTemplates';

interface TicketDetailPageProps {
  ticketId: number;
  onBack: () => void;
}

export const TicketDetailPage: React.FC<TicketDetailPageProps> = ({ ticketId, onBack }) => {
  const { currentUser, hasRole } = useAuth();
  const { showToast } = useToast();

  const [ticket, setTicket] = useState<RepairTicket | undefined>(() => StorageService.getTicketById(ticketId));
  const settings = StorageService.getSettings();
  const technicians = StorageService.getUsers().filter((u) => u.role === 'technician' || u.role === 'manager' || u.role === 'admin');

  const [activeTab, setActiveTab] = useState<'overview' | 'diagnostics' | 'quotes' | 'parts' | 'qc' | 'payments' | 'delivery'>('overview');

  // Status Change State
  const [selectedNextStatus, setSelectedNextStatus] = useState<RepairStatus>('Diagnosing');
  const [statusNote, setStatusNote] = useState('');

  // Diagnostics State (UC-11)
  const diagnostics = StorageService.getDiagnostics(ticketId);
  const [rootCause, setRootCause] = useState('');
  const [solution, setSolution] = useState('');
  const [estCost, setEstCost] = useState<number>(500000);
  const [estHours, setEstHours] = useState<number>(2);

  // Quote State (UC-12, UC-13)
  const quotes = StorageService.getQuotes(ticketId);
  const parts = StorageService.getParts();
  const [quoteItems, setQuoteItems] = useState<{ type: 'labor' | 'part'; name: string; part_id?: number; qty: number; price: number; warranty: number }[]>([
    { type: 'labor', name: 'Công sửa chữa & vệ sinh mạch', qty: 1, price: 350000, warranty: 3 },
  ]);
  const [quoteDiscount, setQuoteDiscount] = useState<number>(0);

  // QC Checklist State (UC-20)
  const existingChecklist = StorageService.getChecklist(ticketId);
  const [qcItems, setQcItems] = useState<QCItem[]>(() => {
    if (existingChecklist) return existingChecklist.items;
    return [
      { id: 1, item_name: 'Khởi động nguồn ổn định', status: 'Pass' },
      { id: 2, item_name: 'Màn hình hiển thị sắc nét, không sọc/điểm chết', status: 'Pass' },
      { id: 3, item_name: 'Bàn phím & Touchpad hoạt động mượt mà', status: 'Pass' },
      { id: 4, item_name: 'Loa & Microphone thu phát rõ ràng', status: 'Pass' },
      { id: 5, item_name: 'Kết nối Wi-Fi & Bluetooth bắt sóng tốt', status: 'Pass' },
      { id: 6, item_name: 'Camera FaceTime/Webcam hoạt động tốt', status: 'Pass' },
      { id: 7, item_name: 'Cổng sạc & các cổng kết nối ngoại vi tốt', status: 'Pass' },
      { id: 8, item_name: 'Lỗi khách mô tả ban đầu đã giải quyết dứt điểm', status: 'Pass' },
    ];
  });

  // Payment State (UC-21)
  const payments = StorageService.getPayments(ticketId);
  const [payAmount, setPayAmount] = useState<number>(ticket?.debt_amount || 0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Bank_Transfer');
  const [payType, setPayType] = useState<PaymentType>('Final');
  const [payRef, setPayRef] = useState('');
  const [payNote, setPayNote] = useState('');

  // Handover State (UC-23, UC-24)
  const [receiverName, setReceiverName] = useState(ticket?.customer_name || '');
  const [receiverPhone, setReceiverPhone] = useState(ticket?.customer_phone || '');
  const [accessoriesReturned, setAccessoriesReturned] = useState(ticket?.accessories_included || 'Đã bàn giao đầy đủ phụ kiện');
  const [warrantyDays, setWarrantyDays] = useState(settings.default_warranty_days || 90);

  // Print Modal
  const [printType, setPrintType] = useState<'intake' | 'quote' | 'invoice' | 'handover' | null>(null);

  if (!ticket) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-sm font-semibold text-slate-700">Không tìm thấy phiếu sửa chữa!</p>
        <button onClick={onBack} className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold">
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const reloadTicket = () => {
    const updated = StorageService.getTicketById(ticketId);
    setTicket(updated);
    if (updated) setPayAmount(updated.debt_amount);
  };

  // Status Change (UC-14)
  const handleStatusChange = (newStatus: RepairStatus) => {
    StorageService.updateTicket(ticket.id, {
      status: newStatus,
      primary_technician_name: currentUser?.full_name,
    });
    showToast(`Đã chuyển trạng thái sang: ${STATUS_CONFIG[newStatus].label}`, 'success');
    reloadTicket();
  };

  // Assign Technician (UC-10)
  const handleAssignTech = (techId: number) => {
    const tech = technicians.find((t) => t.id === techId);
    if (tech) {
      StorageService.updateTicket(ticket.id, {
        primary_technician_id: tech.id,
        primary_technician_name: tech.full_name,
      });
      showToast(`Đã phân công cho kỹ thuật viên: ${tech.full_name}`, 'success');
      reloadTicket();
    }
  };

  // Save Diagnostic (UC-11)
  const handleSaveDiagnostic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rootCause.trim() || !solution.trim()) {
      showToast('Vui lòng điền nguyên nhân lỗi và phương án xử lý!', 'error');
      return;
    }
    StorageService.addDiagnostic({
      ticket_id: ticket.id,
      technician_id: currentUser?.id || 4,
      technician_name: currentUser?.full_name || 'Kỹ thuật viên',
      root_cause: rootCause.trim(),
      proposed_solution: solution.trim(),
      estimated_cost: Number(estCost),
      estimated_hours: Number(estHours),
    });
    // Advance status to Waiting_Approval
    StorageService.updateTicket(ticket.id, { status: 'Waiting_Approval' });
    showToast('Đã lưu kết quả chẩn đoán và chuyển sang Chờ duyệt báo giá!', 'success');
    reloadTicket();
  };

  // Create Quote (UC-12)
  const handleCreateQuote = (e: React.FormEvent) => {
    e.preventDefault();
    const subtotal = quoteItems.reduce((acc, it) => acc + (it.price * it.qty), 0);
    const total = Math.max(0, subtotal - Number(quoteDiscount));

    const newQuote = StorageService.addQuote({
      ticket_id: ticket.id,
      version: quotes.length + 1,
      subtotal,
      discount: Number(quoteDiscount),
      total_amount: total,
      status: 'Sent',
      created_by_name: currentUser?.full_name || 'Kỹ thuật viên',
      items: quoteItems.map((it, idx) => ({
        id: idx + 1,
        quote_id: 0,
        item_type: it.type,
        name: it.name,
        quantity: it.qty,
        unit_price: it.price,
        labor_fee: 0,
        subtotal: it.price * it.qty,
        warranty_months: it.warranty,
      })),
    });

    StorageService.updateTicket(ticket.id, {
      subtotal_amount: subtotal,
      discount_amount: Number(quoteDiscount),
      final_amount: total,
      debt_amount: Math.max(0, total - ticket.paid_amount),
      status: 'Waiting_Approval',
    });

    showToast(`Đã tạo báo giá ${newQuote.quote_code} (${formatVND(total)})!`, 'success');
    reloadTicket();
  };

  // Approve Quote (UC-13)
  const handleApproveQuote = (quoteId: number) => {
    StorageService.updateQuoteStatus(quoteId, 'Approved', `Được duyệt bởi ${currentUser?.full_name}`);
    StorageService.updateTicket(ticket.id, { status: 'In_Progress' });
    showToast('Khách hàng đã duyệt báo giá. Chuyển sang Đang sửa chữa!', 'success');
    reloadTicket();
  };

  // Save QC Checklist (UC-20)
  const handleSaveQC = () => {
    const allPassed = qcItems.every((it) => it.status === 'Pass' || it.status === 'NA');
    StorageService.saveChecklist({
      ticket_id: ticket.id,
      checked_by_name: currentUser?.full_name || 'QC Inspector',
      is_passed: allPassed,
      items: qcItems,
    });

    if (allPassed) {
      StorageService.updateTicket(ticket.id, { status: 'Ready_For_Pickup' });
      showToast('Kiểm tra chất lượng ĐẠT 100%! Phiếu đã sẵn sàng giao khách.', 'success');
    } else {
      showToast('Có mục chưa đạt yêu cầu kiểm tra! Vui lòng hoàn thiện kỹ thuật.', 'error');
    }
    reloadTicket();
  };

  // Payment (UC-21)
  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmount <= 0) {
      showToast('Vui lòng nhập số tiền thanh toán hợp lệ!', 'error');
      return;
    }
    const payment = StorageService.addPayment({
      ticket_id: ticket.id,
      ticket_code: ticket.ticket_code,
      customer_name: ticket.customer_name,
      amount: Number(payAmount),
      payment_method: payMethod,
      payment_type: payType,
      transaction_ref: payRef.trim() || undefined,
      cashier_name: currentUser?.full_name || 'Thu ngân',
      notes: payNote.trim() || undefined,
    });

    showToast(`Đã thu ${formatVND(payment.amount)} thành công! Mã phiếu thu: ${payment.payment_code}`, 'success');
    reloadTicket();
  };

  // Handover & Warranty (UC-23, UC-24)
  const handleDeliverAndWarranty = () => {
    if (ticket.debt_amount > 0) {
      if (!window.confirm(`Thiết bị vẫn còn công nợ ${formatVND(ticket.debt_amount)}. Bạn có chắc chắn muốn bàn giao máy cho khách nợ?`)) {
        return;
      }
    }

    // Update ticket to Delivered
    StorageService.updateTicket(ticket.id, { status: 'Delivered' });

    // Activate warranty
    const warranty = StorageService.addWarranty(ticket, Number(warrantyDays));

    showToast(`Bàn giao máy thành công! Kích hoạt bảo hành: ${warranty.warranty_code} (${warrantyDays} ngày)`, 'success');
    reloadTicket();
    setPrintType('handover');
  };

  const statusConf = STATUS_CONFIG[ticket.status];
  const priorityConf = PRIORITY_CONFIG[ticket.priority];
  const vietQrUrl = getVietQRUrl(settings.bank_name, settings.bank_account_no, settings.bank_account_name, ticket.debt_amount || ticket.final_amount, ticket.ticket_code);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono font-bold text-lg text-indigo-700">{ticket.ticket_code}</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-lg font-bold border ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}>
                {statusConf.label}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${priorityConf.badgeClass}`}>
                {priorityConf.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Khách hàng: <strong className="text-slate-800">{ticket.customer_name}</strong> ({ticket.customer_phone}) — Nhận ngày: {formatDateTime(ticket.created_at)}
            </p>
          </div>
        </div>

        {/* Print Buttons Quick Action */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setPrintType('intake')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Phiếu tiếp nhận
          </button>
          <button
            onClick={() => setPrintType('invoice')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
          >
            <DollarSign className="w-3.5 h-3.5" />
            Hóa đơn thu tiền
          </button>
          <button
            onClick={() => setPrintType('handover')}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-xs flex items-center gap-1.5 border border-indigo-200 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Biên bản bàn giao
          </button>
        </div>
      </div>

      {/* Status Progress Flow Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between overflow-x-auto gap-2">
        <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Chuyển nhanh trạng thái:</span>
        <div className="flex items-center gap-1.5 flex-nowrap">
          {(['Received', 'Diagnosing', 'Waiting_Approval', 'In_Progress', 'Quality_Check', 'Ready_For_Pickup', 'Delivered'] as RepairStatus[]).map((st) => {
            const isCurrent = ticket.status === st;
            const cfg = STATUS_CONFIG[st];
            return (
              <button
                key={st}
                onClick={() => handleStatusChange(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isCurrent
                    ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {cfg.label}
              </button>
            );
          })}
          <button
            onClick={() => {
              const reason = window.prompt('Nhập lý do hủy phiếu sửa chữa:');
              if (reason) {
                StorageService.updateTicket(ticket.id, { status: 'Cancelled', cancellation_reason: reason });
                showToast('Đã hủy phiếu sửa chữa.', 'info');
                reloadTicket();
              }
            }}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 whitespace-nowrap"
          >
            Hủy phiếu
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-1 overflow-x-auto text-xs font-bold">
        {[
          { id: 'overview', label: '1. Tổng quan & Tiếp nhận', icon: FileText },
          { id: 'diagnostics', label: '2. Chẩn đoán lỗi', icon: Wrench },
          { id: 'quotes', label: '3. Báo giá & Khách duyệt', icon: DollarSign },
          { id: 'parts', label: '4. Linh kiện dùng', icon: Boxes },
          { id: 'qc', label: '5. QC Kiểm tra chất lượng', icon: CheckCircle2 },
          { id: 'payments', label: '6. Thanh toán & Công nợ', icon: CreditCard },
          { id: 'delivery', label: '7. Bàn giao & Bảo hành', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-4 rounded-t-xl transition-all whitespace-nowrap border-b-2 ${
                isActive
                  ? 'border-indigo-600 text-indigo-700 bg-white shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Device & Symptoms Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">Chi tiết thiết bị & Lỗi ban đầu</h3>
              
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-slate-500">Thiết bị:</p>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{ticket.device_brand} {ticket.device_model}</p>
                </div>
                <div>
                  <p className="text-slate-500">Loại máy:</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{ticket.device_category}</p>
                </div>
                <div>
                  <p className="text-slate-500">Serial / IMEI:</p>
                  <p className="font-mono font-semibold text-slate-800 mt-0.5">{ticket.device_serial || 'Không có'}</p>
                </div>
                <div>
                  <p className="text-slate-500">Màu sắc:</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{ticket.device_color || '---'}</p>
                </div>
              </div>

              <div className="p-3 bg-red-50/60 border border-red-200 rounded-xl text-xs space-y-1">
                <p className="font-bold text-red-900">Lỗi khách hàng mô tả:</p>
                <p className="text-red-800 italic">{ticket.defect_description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="font-semibold text-slate-600">Tình trạng lúc nhận:</p>
                  <p className="text-slate-800 mt-0.5">{ticket.initial_condition || 'Bình thường'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="font-semibold text-slate-600">Ngoại quan:</p>
                  <p className="text-slate-800 mt-0.5">{ticket.cosmetic_condition || 'Không trầy xước'}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <p className="font-semibold text-slate-600">Phụ kiện đi kèm:</p>
                <p className="text-slate-800 mt-0.5 font-medium">{ticket.accessories_included || 'Chỉ nhận thân máy'}</p>
              </div>

              {ticket.device_password_hint && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs flex items-center justify-between">
                  <span className="font-semibold text-amber-900">Mật khẩu màn hình / BIOS:</span>
                  <span className="font-mono font-bold text-amber-950 px-2 py-0.5 bg-amber-100 rounded">{ticket.device_password_hint}</span>
                </div>
              )}
            </div>

            {/* Status Timeline History */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">Lịch sử tiến độ xử lý</h3>
              <div className="space-y-3">
                {StorageService.getStatusHistories(ticket.id).map((h, i) => (
                  <div key={h.id} className="flex gap-3 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 mt-1 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{h.to_status}</span>
                        <span className="text-slate-400 text-[10px]">{formatDateTime(h.created_at)}</span>
                      </div>
                      <p className="text-slate-600 mt-0.5">{h.notes || 'Cập nhật tiến trình'}</p>
                      <span className="text-[10px] text-slate-400">Thực hiện bởi: {h.changed_by_name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Assignment & Quick Summary */}
          <div className="space-y-6">
            {/* Technician Assignment (UC-10) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Phân công kỹ thuật</h3>
              </div>
              <p className="text-xs text-slate-500">Kỹ thuật viên phụ trách chính thiết bị này:</p>
              <select
                value={ticket.primary_technician_id || ''}
                onChange={(e) => handleAssignTech(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:outline-hidden"
              >
                <option value="">-- Chưa chọn kỹ thuật viên --</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name} ({t.phone})
                  </option>
                ))}
              </select>
            </div>

            {/* Financial Summary */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">Tổng quan tài chính</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tổng tiền dịch vụ:</span>
                  <span className="font-bold text-slate-800">{formatVND(ticket.final_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Đã thanh toán:</span>
                  <span className="font-bold text-emerald-600">{formatVND(ticket.paid_amount)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-100 font-bold text-sm">
                  <span className="text-rose-600">Còn lại (Công nợ):</span>
                  <span className="text-rose-600">{formatVND(ticket.debt_amount)}</span>
                </div>
              </div>
            </div>

            {/* Public Lookup QR Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center space-y-2">
              <p className="text-xs font-bold text-slate-800">QR Tra cứu khách hàng</p>
              <img src={getTicketQrUrl(ticket.ticket_code)} alt="QR Tra cứu" className="w-28 h-28 mx-auto border border-slate-200 p-1.5 rounded-xl shadow-xs" />
              <p className="text-[11px] text-slate-400">Khách có thể quét để xem trạng thái trên điện thoại</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Diagnostics (UC-11) */}
      {activeTab === 'diagnostics' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Kiểm tra & Chẩn đoán thiết bị (UC-11)</h3>
              <p className="text-xs text-slate-500">Kỹ thuật viên ghi nhận nguyên nhân gốc rễ và đề xuất phương án kỹ thuật.</p>
            </div>
          </div>

          {diagnostics.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase">Lịch sử chẩn đoán đã lưu:</h4>
              {diagnostics.map((d) => (
                <div key={d.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between text-slate-500">
                    <span className="font-bold text-slate-800">KTV: {d.technician_name}</span>
                    <span>{formatDateTime(d.created_at)}</span>
                  </div>
                  <div>
                    <strong className="text-indigo-900">Nguyên nhân hư hỏng:</strong>
                    <p className="text-slate-700 mt-0.5">{d.root_cause}</p>
                  </div>
                  <div>
                    <strong className="text-emerald-900">Phương án khắc phục:</strong>
                    <p className="text-slate-700 mt-0.5">{d.proposed_solution}</p>
                  </div>
                  <div className="flex gap-4 pt-1 font-semibold text-slate-800">
                    <span>Dự toán: {formatVND(d.estimated_cost)}</span>
                    <span>Thời gian làm: {d.estimated_hours} giờ</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSaveDiagnostic} className="p-4 bg-indigo-50/40 rounded-xl border border-indigo-100 space-y-4">
            <h4 className="text-xs font-bold text-indigo-950 uppercase">+ Thêm chẩn đoán kỹ thuật mới</h4>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nguyên nhân gốc rễ (Root Cause) *</label>
              <textarea
                required
                rows={2}
                placeholder="VD: Chập IC nguồn TPS51225, hoặc chết bóng LED màn hình..."
                value={rootCause}
                onChange={(e) => setRootCause(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phương án khắc phục đề xuất *</label>
              <textarea
                required
                rows={2}
                placeholder="VD: Thay thế IC nguồn, vệ sinh oxy hóa chân socket..."
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Chi phí ước tính sơ bộ (VND)</label>
                <input
                  type="number"
                  value={estCost}
                  onChange={(e) => setEstCost(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Thời gian dự kiến (giờ)</label>
                <input
                  type="number"
                  step="0.5"
                  value={estHours}
                  onChange={(e) => setEstHours(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              Lưu chẩn đoán & Chuyển sang chờ duyệt báo giá
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Quotes (UC-12, UC-13) */}
      {activeTab === 'quotes' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Báo giá sửa chữa & Khách duyệt (UC-12, UC-13)</h3>
              <p className="text-xs text-slate-500">Tạo bảng báo giá chi tiết, gửi khách hàng xác nhận trước khi sửa.</p>
            </div>
          </div>

          {quotes.map((q) => (
            <div key={q.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-indigo-900">{q.quote_code} (v{q.version})</span>
                  <span className={`px-2 py-0.5 rounded font-bold ${
                    q.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {q.status === 'Approved' ? 'Khách đã duyệt' : 'Chờ khách duyệt'}
                  </span>
                </div>
                <span className="font-bold text-base text-slate-900">{formatVND(q.total_amount)}</span>
              </div>

              <table className="w-full text-left border-collapse border border-slate-200 bg-white">
                <thead>
                  <tr className="bg-slate-100 text-slate-600">
                    <th className="p-2">Hạng mục</th>
                    <th className="p-2 text-center">SL</th>
                    <th className="p-2 text-right">Đơn giá</th>
                    <th className="p-2 text-right">Thành tiền</th>
                    <th className="p-2 text-center">Bảo hành</th>
                  </tr>
                </thead>
                <tbody>
                  {q.items.map((it) => (
                    <tr key={it.id} className="border-t border-slate-200">
                      <td className="p-2 font-medium">{it.name}</td>
                      <td className="p-2 text-center">{it.quantity}</td>
                      <td className="p-2 text-right">{formatVND(it.unit_price)}</td>
                      <td className="p-2 text-right font-semibold">{formatVND(it.subtotal)}</td>
                      <td className="p-2 text-center text-slate-500">{it.warranty_months} tháng</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {q.status !== 'Approved' && (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleApproveQuote(q.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Khách đồng ý sửa (Duyệt báo giá)
                  </button>
                  <button
                    onClick={() => {
                      const reason = window.prompt('Lý do khách từ chối:');
                      if (reason) StorageService.updateQuoteStatus(q.id, 'Rejected', undefined, reason);
                      reloadTicket();
                    }}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    Khách từ chối
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Create new Quote Form */}
          <form onSubmit={handleCreateQuote} className="p-4 bg-indigo-50/40 rounded-xl border border-indigo-100 space-y-4">
            <h4 className="text-xs font-bold text-indigo-950 uppercase">+ Lập bảng báo giá mới</h4>
            
            <div className="space-y-3">
              {quoteItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <input
                      type="text"
                      placeholder="Tên công việc hoặc linh kiện..."
                      value={item.name}
                      onChange={(e) => {
                        const copy = [...quoteItems];
                        copy[idx].name = e.target.value;
                        setQuoteItems(copy);
                      }}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="SL"
                      min={1}
                      value={item.qty}
                      onChange={(e) => {
                        const copy = [...quoteItems];
                        copy[idx].qty = Number(e.target.value);
                        setQuoteItems(copy);
                      }}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-center"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      placeholder="Đơn giá"
                      value={item.price}
                      onChange={(e) => {
                        const copy = [...quoteItems];
                        copy[idx].price = Number(e.target.value);
                        setQuoteItems(copy);
                      }}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-right"
                    />
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setQuoteItems(quoteItems.filter((_, i) => i !== idx))}
                      className="text-rose-500 hover:text-rose-700 text-xs p-1"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setQuoteItems([...quoteItems, { type: 'part', name: 'Linh kiện thay thế', qty: 1, price: 500000, warranty: 6 }])}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm dòng linh kiện / tiền công
            </button>

            <div className="flex justify-between items-center pt-3 border-t border-indigo-100">
              <div className="flex items-center gap-2 text-xs">
                <span>Giảm giá (VND):</span>
                <input
                  type="number"
                  value={quoteDiscount}
                  onChange={(e) => setQuoteDiscount(Number(e.target.value))}
                  className="w-32 px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/30"
              >
                Gửi báo giá cho khách
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 4: Parts Usage (UC-17) */}
      {activeTab === 'parts' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Linh kiện & Vật tư sử dụng (UC-17)</h3>
              <p className="text-xs text-slate-500">Xuất kho linh kiện cho phiếu sửa chữa và trừ tồn kho tự động.</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3">
            <h4 className="font-bold text-slate-800">Xuất linh kiện từ kho vào phiếu này:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {parts.map((p) => (
                <div key={p.id} className="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-800">{p.name}</p>
                    <p className="text-slate-500 text-[11px]">Tồn: <strong className={p.stock_quantity <= p.min_stock_alert ? 'text-rose-600' : 'text-emerald-600'}>{p.stock_quantity}</strong> — Giá: {formatVND(p.selling_price)}</p>
                  </div>
                  <button
                    onClick={() => {
                      if (p.stock_quantity <= 0) {
                        showToast('Linh kiện này đã hết hàng trong kho!', 'error');
                        return;
                      }
                      StorageService.updatePartStock(p.id, -1);
                      showToast(`Đã xuất 1 ${p.name} vào phiếu sửa chữa!`, 'success');
                      reloadTicket();
                    }}
                    className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shrink-0 ml-2"
                  >
                    Xuất 1 cái
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: QC Checklist (UC-20) */}
      {activeTab === 'qc' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Kiểm tra chất lượng sau sửa chữa (UC-20)</h3>
              <p className="text-xs text-slate-500">Bắt buộc toàn bộ tiêu chí đạt yêu cầu trước khi chuyển sang Đã sửa xong / Sẵn sàng giao.</p>
            </div>
            <button
              onClick={handleSaveQC}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Lưu & Xác nhận ĐẠT QC
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {qcItems.map((item, idx) => (
              <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-800">{item.item_name}</span>
                <div className="flex gap-1.5">
                  {(['Pass', 'Fail', 'NA'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        const copy = [...qcItems];
                        copy[idx].status = st;
                        setQcItems(copy);
                      }}
                      className={`px-3 py-1 rounded-lg font-bold transition-all ${
                        item.status === st
                          ? st === 'Pass'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : st === 'Fail'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-slate-500 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st === 'Pass' ? 'Đạt' : st === 'Fail' ? 'Không đạt' : 'K/A'}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Payments & Debt (UC-21, UC-22) */}
      {activeTab === 'payments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Add Payment Form & Payment History */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">Lịch sử thu tiền</h3>
              
              {payments.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center">Chưa có lượt thanh toán nào.</p>
              ) : (
                <div className="space-y-2">
                  {payments.map((p) => (
                    <div key={p.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-indigo-700">{p.payment_code}</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                            {p.payment_method === 'Cash' ? 'Tiền mặt' : 'Chuyển khoản'}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">Thu ngân: {p.cashier_name} — {formatDateTime(p.created_at)}</p>
                      </div>
                      <span className="font-bold text-slate-900 text-sm">{formatVND(p.amount)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Payment Form */}
              <form onSubmit={handleAddPayment} className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-4 text-xs">
                <h4 className="font-bold text-emerald-950 uppercase">+ Lập phiếu thu tiền mới</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Số tiền thu (VND) *</label>
                    <input
                      type="number"
                      required
                      value={payAmount}
                      onChange={(e) => setPayAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-sm text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Hình thức thanh toán</label>
                    <select
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold"
                    >
                      <option value="Cash">Tiền mặt tại quầy</option>
                      <option value="Bank_Transfer">Chuyển khoản VietQR</option>
                      <option value="POS_Card">Quẹt thẻ POS</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Loại thu</label>
                    <select
                      value={payType}
                      onChange={(e) => setPayType(e.target.value as PaymentType)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl"
                    >
                      <option value="Final">Thanh toán hoàn tất</option>
                      <option value="Deposit">Tiền đặt cọc</option>
                      <option value="Installment">Thu theo đợt</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Mã tham chiếu ngân hàng</label>
                    <input
                      type="text"
                      placeholder="VD: FT261103001"
                      value={payRef}
                      onChange={(e) => setPayRef(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-all"
                >
                  <DollarSign className="w-4 h-4" />
                  Xác nhận thu tiền & In phiếu thu
                </button>
              </form>
            </div>
          </div>

          {/* Right: VietQR Dynamic Bank Transfer */}
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center space-y-3">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-900">
                <QrCode className="w-4 h-4 text-indigo-600" />
                <span>MÃ VIETQR CHUYỂN KHOẢN TỰ ĐỘNG</span>
              </div>
              <p className="text-[11px] text-slate-500">Quét bằng ứng dụng ngân hàng bất kỳ để tự điền số tiền và mã phiếu</p>
              
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 inline-block shadow-inner">
                <img src={vietQrUrl} alt="VietQR" className="w-44 h-44 mx-auto rounded" />
              </div>

              <div className="text-left bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <p><span className="text-slate-500">Ngân hàng:</span> <strong>{settings.bank_name}</strong></p>
                <p><span className="text-slate-500">Số TK:</span> <strong className="font-mono text-indigo-700">{settings.bank_account_no}</strong></p>
                <p><span className="text-slate-500">Chủ TK:</span> <strong>{settings.bank_account_name}</strong></p>
                <p><span className="text-slate-500">Số tiền:</span> <strong className="text-rose-600">{formatVND(ticket.debt_amount || ticket.final_amount)}</strong></p>
                <p><span className="text-slate-500">Nội dung CK:</span> <strong className="font-mono">{ticket.ticket_code}</strong></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: Handover & Warranty (UC-23, UC-24) */}
      {activeTab === 'delivery' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Bàn giao thiết bị & Kích hoạt bảo hành (UC-23, UC-24)</h3>
              <p className="text-xs text-slate-500">Xác nhận hoàn trả phụ kiện, người nhận máy và kích hoạt thời hạn bảo hành điện tử.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Họ tên người nhận máy *</label>
              <input
                type="text"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Số điện thoại người nhận *</label>
              <input
                type="tel"
                value={receiverPhone}
                onChange={(e) => setReceiverPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Xác nhận hoàn trả phụ kiện gửi kèm</label>
              <input
                type="text"
                value={accessoriesReturned}
                onChange={(e) => setAccessoriesReturned(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Thời hạn bảo hành sửa chữa (ngày)</label>
              <select
                value={warrantyDays}
                onChange={(e) => setWarrantyDays(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
              >
                <option value={30}>30 ngày (1 tháng)</option>
                <option value={90}>90 ngày (3 tháng - Tiêu chuẩn)</option>
                <option value={180}>180 ngày (6 tháng)</option>
                <option value={365}>365 ngày (1 năm)</option>
              </select>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
            <p className="font-bold">Điều kiện bàn giao:</p>
            <p>1. Thiết bị đã được kiểm tra chất lượng QC đạt yêu cầu.</p>
            <p>2. Khách hàng đã thanh toán đủ hoặc được duyệt nợ.</p>
            <p>3. Khi bấm xác nhận: Hệ thống tự động kích hoạt bảo hành điện tử và mở biên bản bàn giao A5/A4.</p>
          </div>

          <button
            onClick={handleDeliverAndWarranty}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all cursor-pointer text-xs"
          >
            <CheckCircle2 className="w-4 h-4" />
            Xác nhận Bàn giao máy & Kích hoạt bảo hành điện tử
          </button>
        </div>
      )}

      {/* Print Modal Component */}
      {printType && (
        <PrintModal
          ticket={ticket}
          settings={settings}
          type={printType}
          onClose={() => setPrintType(null)}
        />
      )}
    </div>
  );
};
