import React, { useState, useEffect } from 'react';
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
  UserRole,
} from '../../types';
import {
  formatVND,
  formatDateTime,
  formatDate,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  getVietQRUrl,
  getTicketQrUrl,
  translateStatus,
  localizeText,
} from '../../utils/formatters';
import {
  getAllowedTransitions,
  getRoleAwaitingNotice,
  ROLE_DISPLAY_NAMES,
  StatusTransitionOption,
} from '../../utils/statusTransitions';
import {
  ArrowLeft,
  ArrowRight,
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
  Eye,
  EyeOff,
  Lock,
  Zap,
  Radio,
  Smartphone,
  CheckCheck,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  Tag,
  BadgePercent,
  Gift,
} from 'lucide-react';
import { PrintModal } from '../../components/print/PrintTemplates';
import { decryptPassword } from '../../utils/crypto';
import { StatusTransitionModal } from '../../components/tickets/StatusTransitionModal';
import { SearchableSelect, SearchableOption } from '../../components/common/SearchableSelect';
import { CurrencyInput } from '../../components/common/CurrencyInput';
import { NumberInput } from '../../components/common/NumberInput';

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
  const [showSecretPassword, setShowSecretPassword] = useState(false);

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
  const activePromotions = StorageService.getPromotions().filter((p) => p.is_active);
  const [selectedPromoCode, setSelectedPromoCode] = useState<string>('');
  const [customPromoInput, setCustomPromoInput] = useState<string>('');
  const [promoMessage, setPromoMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Quick Discount Modal for Tab 6 (Thanh toán & Công nợ)
  const [showDiscountModal, setShowDiscountModal] = useState<boolean>(false);
  const [modalDiscountType, setModalDiscountType] = useState<'voucher' | 'custom'>('voucher');
  const [modalPromoCode, setModalPromoCode] = useState<string>(ticket?.promotion_code || '');
  const [modalCustomDiscount, setModalCustomDiscount] = useState<number>(ticket?.discount_amount || 0);
  const [modalPromoMessage, setModalPromoMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  // Automated Payment & POS States
  const [autoPayTab, setAutoPayTab] = useState<'vietqr' | 'smartpos'>('vietqr');
  const [isSimulatingWebhook, setIsSimulatingWebhook] = useState(false);
  const [showSmartPosModal, setShowSmartPosModal] = useState(false);
  const [smartPosStep, setSmartPosStep] = useState<'idle' | 'pushing' | 'waiting_card' | 'processing' | 'success'>('idle');
  const [smartPosCardType, setSmartPosCardType] = useState<'visa' | 'napas' | 'apple_pay'>('visa');

  // Real-time listener for automated payment events
  useEffect(() => {
    const handleAutoPayment = (e: any) => {
      const detail = e.detail;
      if (detail?.ticket?.id === ticketId || detail?.payment?.ticket_id === ticketId) {
        reloadTicket();
      }
    };
    window.addEventListener('repairflow_auto_payment', handleAutoPayment);
    return () => window.removeEventListener('repairflow_auto_payment', handleAutoPayment);
  }, [ticketId]);

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

  // Status Change State & Accountability Modal
  const [pendingStatus, setPendingStatus] = useState<RepairStatus | null>(null);
  const [isAdminOverride, setIsAdminOverride] = useState(false);

  // Role-Based Status Transitions Context
  const userRole = (currentUser?.role || 'receptionist').toLowerCase() as UserRole;
  const isAdminOrManager = userRole === 'admin' || userRole === 'manager';
  const allowedTransitions = getAllowedTransitions(ticket.status, userRole, isAdminOverride);
  const awaitingNotice = getRoleAwaitingNotice(ticket.status, userRole);

  // Searchable Part State for Tab 4
  const [selectedPartId, setSelectedPartId] = useState<number | ''>('');
  const [partExportQty, setPartExportQty] = useState<number>(1);

  // Technician Searchable Options
  const techOptions: SearchableOption[] = technicians.map((t) => ({
    value: t.id,
    label: t.full_name,
    sublabel: `SĐT: ${t.phone} • ${t.role}`,
    badge: t.is_active ? 'Sẵn sàng' : 'Vắng',
    badgeColor: t.is_active
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-slate-100 text-slate-500',
  }));

  // Part Searchable Options
  const partOptions: SearchableOption[] = parts.map((p) => ({
    value: p.id,
    label: p.name,
    sublabel: `Mã: ${p.sku} • Giá: ${formatVND(p.selling_price)} • Tồn: ${p.stock_quantity}`,
    badge:
      p.stock_quantity <= 0
        ? 'Hết hàng'
        : p.stock_quantity <= p.min_stock_alert
        ? `Sắp hết (${p.stock_quantity})`
        : `Còn ${p.stock_quantity}`,
    badgeColor:
      p.stock_quantity <= 0
        ? 'bg-rose-50 text-rose-700 border-rose-200'
        : p.stock_quantity <= p.min_stock_alert
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-emerald-50 text-emerald-700 border-emerald-200',
    disabled: p.stock_quantity <= 0,
  }));

  // Trigger Accountability & Constraints Modal
  const handleRequestStatusChange = (newStatus: RepairStatus) => {
    if (newStatus === ticket.status) return;
    setPendingStatus(newStatus);
  };

  // Confirmed by User with Responsibility Sign-Off
  const handleConfirmStatusChange = (data: {
    targetStatus: RepairStatus;
    notes: string;
    assignedTechId?: number;
    debtApproved?: boolean;
    cancellationReason?: string;
    returnCondition?: string;
  }) => {
    const updates: Partial<RepairTicket> = {
      status: data.targetStatus,
    };

    if (data.assignedTechId) {
      const tech = technicians.find((t) => t.id === data.assignedTechId);
      if (tech) {
        updates.primary_technician_id = tech.id;
        updates.primary_technician_name = tech.full_name;
      }
    }

    if (data.cancellationReason) {
      updates.cancellation_reason = data.cancellationReason;
    }

    // Save ticket update
    StorageService.updateTicket(ticket.id, updates);

    const roleStr = currentUser?.role || 'Nhân viên';
    const nameStr = currentUser?.full_name || 'Người dùng';
    const noteDetails = `[Cam kết trách nhiệm] ${data.notes}${
      data.debtApproved ? ' • Phê duyệt cho khách nợ' : ''
    }${data.returnCondition ? ` • Tình trạng hoàn trả: ${data.returnCondition}` : ''}`;

    // Add explicit status history log
    StorageService.addStatusHistory(
      ticket.id,
      ticket.status,
      data.targetStatus,
      `${nameStr} (${roleStr})`,
      noteDetails,
      roleStr,
      `Cam kết trách nhiệm bởi ${nameStr}`
    );

    // Add system audit log
    StorageService.addAuditLog(
      'STATUS_TRANSITION',
      'repair_tickets',
      ticket.ticket_code,
      `Chuyển trạng thái từ [${STATUS_CONFIG[ticket.status].label}] sang [${STATUS_CONFIG[data.targetStatus].label}]. Người chịu trách nhiệm: ${nameStr} (${roleStr}). Ghi chú: ${data.notes}`,
      nameStr
    );

    showToast(
      `Đã xác nhận trách nhiệm & chuyển trạng thái sang: ${STATUS_CONFIG[data.targetStatus].label}`,
      'success'
    );
    setPendingStatus(null);
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
      StorageService.addAuditLog(
        'ASSIGN_TECHNICIAN',
        'repair_tickets',
        ticket.ticket_code,
        `Phân công kỹ thuật viên phụ trách: ${tech.full_name}`,
        currentUser?.full_name
      );
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

  // Quote Promotion Handlers
  const handleApplyPromoToQuote = (codeToApply: string) => {
    const clean = codeToApply.trim().toUpperCase();
    if (!clean) {
      setPromoMessage({ type: 'error', text: 'Vui lòng nhập hoặc chọn mã ưu đãi!' });
      return;
    }
    const subtotal = quoteItems.reduce((acc, it) => acc + it.price * it.qty, 0);
    if (subtotal <= 0) {
      setPromoMessage({ type: 'error', text: 'Vui lòng nhập các hạng mục sửa chữa có giá trị trước khi áp dụng mã!' });
      return;
    }
    const res = StorageService.validateAndCalculatePromotion(clean, subtotal);
    if (res.valid) {
      setSelectedPromoCode(res.promotion!.code);
      setCustomPromoInput(res.promotion!.code);
      setQuoteDiscount(res.discountAmount);
      setPromoMessage({ type: 'success', text: res.message || 'Áp dụng mã ưu đãi thành công!' });
      showToast(`Áp dụng mã "${res.promotion!.code}": Giảm ${formatVND(res.discountAmount)}`, 'success');
    } else {
      setPromoMessage({ type: 'error', text: res.message || 'Mã ưu đãi không hợp lệ.' });
      showToast(res.message || 'Mã ưu đãi không hợp lệ!', 'error');
    }
  };

  const handleClearQuotePromo = () => {
    setSelectedPromoCode('');
    setCustomPromoInput('');
    setQuoteDiscount(0);
    setPromoMessage(null);
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
      promotion_code: selectedPromoCode || undefined,
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

    if (selectedPromoCode) {
      StorageService.recordPromotionUsage(selectedPromoCode);
    }

    StorageService.updateTicket(ticket.id, {
      subtotal_amount: subtotal,
      discount_amount: Number(quoteDiscount),
      promotion_code: selectedPromoCode || undefined,
      final_amount: total,
      debt_amount: Math.max(0, total - ticket.paid_amount),
      status: 'Waiting_Approval',
    });

    showToast(`Đã tạo báo giá ${newQuote.quote_code} (${formatVND(total)})!`, 'success');
    reloadTicket();
  };

  // Apply / Change Discount Voucher at Checkout
  const handleApplyDiscountAtCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket) return;

    let appliedDiscount = 0;
    let appliedCode: string | undefined = undefined;

    if (modalDiscountType === 'voucher') {
      if (!modalPromoCode.trim()) {
        setModalPromoMessage({ type: 'error', text: 'Vui lòng chọn hoặc nhập mã ưu đãi!' });
        return;
      }
      const res = StorageService.validateAndCalculatePromotion(modalPromoCode, ticket.subtotal_amount);
      if (!res.valid) {
        setModalPromoMessage({ type: 'error', text: res.message || 'Mã ưu đãi không hợp lệ!' });
        return;
      }
      appliedDiscount = res.discountAmount;
      appliedCode = res.promotion!.code;
      StorageService.recordPromotionUsage(appliedCode);
    } else {
      appliedDiscount = Math.max(0, modalCustomDiscount);
      if (ticket.subtotal_amount > 0 && appliedDiscount > ticket.subtotal_amount) {
        setModalPromoMessage({ type: 'error', text: 'Số tiền giảm không được vượt quá chi phí gốc!' });
        return;
      }
    }

    const newFinal = Math.max(0, ticket.subtotal_amount - appliedDiscount);
    const newDebt = Math.max(0, newFinal - ticket.paid_amount);

    StorageService.updateTicket(ticket.id, {
      discount_amount: appliedDiscount,
      promotion_code: appliedCode,
      final_amount: newFinal,
      debt_amount: newDebt,
    });

    StorageService.addAuditLog(
      'APPLY_DISCOUNT',
      'repair_tickets',
      ticket.ticket_code,
      `Cập nhật ưu đãi cho phiếu: Giảm ${formatVND(appliedDiscount)} ${appliedCode ? `(Mã: ${appliedCode})` : '(Giảm trực tiếp)'}`,
      currentUser?.full_name
    );

    showToast(`Đã áp dụng mức ưu đãi ${formatVND(appliedDiscount)} thành công!`, 'success');
    setShowDiscountModal(false);
    reloadTicket();
  };

  const handleRemoveDiscountAtCheckout = () => {
    if (!ticket) return;
    const newFinal = ticket.subtotal_amount;
    const newDebt = Math.max(0, newFinal - ticket.paid_amount);

    StorageService.updateTicket(ticket.id, {
      discount_amount: 0,
      promotion_code: undefined,
      final_amount: newFinal,
      debt_amount: newDebt,
    });

    StorageService.addAuditLog(
      'REMOVE_DISCOUNT',
      'repair_tickets',
      ticket.ticket_code,
      `Hủy bỏ ưu đãi giảm giá của phiếu sửa chữa`,
      currentUser?.full_name
    );

    showToast('Đã hủy ưu đãi giảm giá trên phiếu!', 'info');
    setShowDiscountModal(false);
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
      showToast('Vui lòng nhập số tiền thanh toán lớn hơn 0!', 'error');
      return;
    }

    if (ticket.final_amount > 0 && ticket.debt_amount <= 0) {
      showToast('Phiếu sửa chữa này đã thanh toán 100%, không còn dư nợ để thu thêm!', 'error');
      return;
    }

    if (ticket.final_amount > 0 && payAmount > ticket.debt_amount) {
      showToast(
        `Số tiền thu (${formatVND(payAmount)}) không được vượt quá số tiền nợ còn lại (${formatVND(ticket.debt_amount)})!`,
        'error'
      );
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
      cashier_name: currentUser?.full_name || 'Lễ tân / Thu ngân',
      notes: payNote.trim() || undefined,
    });

    showToast(`Đã thu ${formatVND(payment.amount)} thành công! Mã phiếu thu: ${payment.payment_code}`, 'success');
    reloadTicket();
  };

  // Simulate Bank Webhook Auto-Payment (SePAY / Casso / Bank)
  const handleSimulateWebhook = () => {
    if (!ticket) return;
    const amountToPay = ticket.debt_amount > 0 ? ticket.debt_amount : (ticket.final_amount || 850000);
    setIsSimulatingWebhook(true);
    setTimeout(() => {
      setIsSimulatingWebhook(false);
      const res = StorageService.processPaymentWebhook({
        amount: amountToPay,
        content: `${ticket.ticket_code} CK DICH VU`,
        transaction_id: `MBFT${Date.now().toString().slice(-6)}`,
        bank_brand: settings.bank_name || 'MB Bank',
        gateway_provider: settings.payment_gateway_provider?.toUpperCase() || 'SEPAY',
        payment_method: 'Bank_Transfer',
      });
      if (res.success) {
        reloadTicket();
        showToast(
          `🔔 TING TING! Nhận tự động ${formatVND(amountToPay)} từ MB Bank qua Webhook. Đã cập nhật phiếu thu & xóa công nợ!`,
          'success'
        );
      } else {
        showToast(res.message, 'error');
      }
    }, 1200);
  };

  // Push command to SmartPOS & Simulate Customer Card Tap
  const handleOpenSmartPos = () => {
    setSmartPosStep('pushing');
    setShowSmartPosModal(true);
    setTimeout(() => {
      setSmartPosStep('waiting_card');
    }, 1000);
  };

  const handleSimulateCardPayment = (cardType: 'visa' | 'napas' | 'apple_pay') => {
    if (!ticket) return;
    setSmartPosCardType(cardType);
    setSmartPosStep('processing');
    setTimeout(() => {
      const cardLabel =
        cardType === 'visa'
          ? 'Visa Contactless **** 6886'
          : cardType === 'napas'
          ? 'Napas Chip ATM **** 3102'
          : 'Apple Pay (Techcombank)';
      const amountToPay = ticket.debt_amount > 0 ? ticket.debt_amount : (ticket.final_amount || 850000);
      StorageService.processPaymentWebhook({
        amount: amountToPay,
        content: `${ticket.ticket_code} SMARTPOS`,
        transaction_id: `POS_${Date.now().toString().slice(-6)}`,
        payment_method: 'POS_Card',
        card_brand: cardLabel,
        pos_terminal: settings.pos_terminal_id || 'VNPAY_POS_Q1_01',
      });
      setSmartPosStep('success');
      setTimeout(() => {
        setShowSmartPosModal(false);
        setSmartPosStep('idle');
        reloadTicket();
        showToast(
          `💳 Giao dịch SmartPOS thành công! Đã tự động thu ${formatVND(amountToPay)} [${cardLabel}].`,
          'success'
        );
      }, 1300);
    }, 1400);
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

      {/* Role-Based Status Transition & Workflow Action Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Top Header: Current Stage & User Authority Context */}
        <div className="p-3.5 sm:px-4 bg-slate-50/80 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0" />
              Giai đoạn hiện tại:
            </span>
            <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border shadow-2xs ${STATUS_CONFIG[ticket.status].bg} ${STATUS_CONFIG[ticket.status].text} ${STATUS_CONFIG[ticket.status].border}`}>
              {STATUS_CONFIG[ticket.status].label}
            </span>

            {/* Account / Role Badge */}
            <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-200 text-xs">
              <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-slate-500">Tài khoản:</span>
              <strong className="text-slate-800">{currentUser?.full_name || 'Nhân viên'}</strong>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                {ROLE_DISPLAY_NAMES[userRole] || userRole}
              </span>
            </div>
          </div>

          {/* Admin Override Toggle (Visible only for Admin & Manager) */}
          {isAdminOrManager && (
            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                type="button"
                onClick={() => setIsAdminOverride(!isAdminOverride)}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isAdminOverride
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs font-bold'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
                title="Bật/tắt chế độ quản trị để can thiệp chuyển đến bất kỳ trạng thái nào"
              >
                <Zap className={`w-3.5 h-3.5 ${isAdminOverride ? 'text-amber-600 fill-amber-500' : 'text-slate-400'}`} />
                <span>Chế độ Quản trị {isAdminOverride ? '(Đang bật toàn quyền)' : '(Toàn quyền chuyển)'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons corresponding strictly to user's account & role */}
        <div className="p-3.5 sm:p-4">
          {allowedTransitions.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Trạng thái bạn được quyền chuyển ({allowedTransitions.length}):
                </span>
                {isAdminOverride && (
                  <span className="text-[11px] text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    ⚠️ Đang ở chế độ Quản trị: Cho phép can thiệp mọi trạng thái
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {allowedTransitions.map((opt) => {
                  const isCancel = opt.targetStatus === 'Cancelled';
                  const isReverse = opt.isReverse;

                  let btnStyle = 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs';
                  if (opt.variant === 'success') {
                    btnStyle = 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs';
                  } else if (opt.variant === 'warning') {
                    btnStyle = 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs';
                  } else if (opt.variant === 'purple') {
                    btnStyle = 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs';
                  } else if (opt.variant === 'danger') {
                    btnStyle = 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200';
                  }

                  return (
                    <button
                      key={opt.targetStatus}
                      type="button"
                      onClick={() => handleRequestStatusChange(opt.targetStatus)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-98 ${btnStyle}`}
                      title={opt.description}
                    >
                      {isCancel ? (
                        <X className="w-3.5 h-3.5" />
                      ) : isReverse ? (
                        <RefreshCw className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5" />
                      )}
                      <span>{opt.label}</span>
                      {opt.badge && !isAdminOverride && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/15 font-normal">
                          {opt.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-start sm:items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    {awaitingNotice?.title || 'Không có thao tác chuyển trạng thái ở bước này'}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {awaitingNotice?.message || `Giai đoạn hiện tại (${STATUS_CONFIG[ticket.status].label}) không có thao tác cho tài khoản ${ROLE_DISPLAY_NAMES[userRole] || userRole}.`}
                  </p>
                </div>
              </div>
              {awaitingNotice?.responsibleRole && (
                <div className="text-left sm:text-right shrink-0">
                  <span className="text-[10px] text-slate-400 block font-medium">Bộ phận chịu trách nhiệm</span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 inline-block">
                    {awaitingNotice.responsibleRole}
                  </span>
                </div>
              )}
            </div>
          )}
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
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-700" />
                    <div>
                      <span className="font-semibold text-amber-900 block">Mật khẩu màn hình / BIOS (Bảo mật):</span>
                      <span className="text-[10px] text-amber-700">Chỉ Kỹ thuật viên & Quản lý được phép xem</span>
                    </div>
                  </div>
                  {hasRole(['technician', 'manager', 'admin']) ? (
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-950 px-2.5 py-1 bg-amber-100/80 rounded border border-amber-300">
                        {showSecretPassword
                          ? decryptPassword(ticket.device_password_hint)
                          : '••••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowSecretPassword(!showSecretPassword)}
                        className="p-1.5 text-amber-800 hover:bg-amber-200/60 rounded-lg transition-colors cursor-pointer"
                        title={showSecretPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showSecretPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-400 italic">
                      [Không có quyền xem]
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Status Timeline History */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">Lịch sử tiến độ xử lý</h3>
              <div className="space-y-3">
                {StorageService.getStatusHistories(ticket.id).map((h) => {
                  const toCfg = STATUS_CONFIG[h.to_status];
                  const fromCfg = h.from_status ? STATUS_CONFIG[h.from_status] : null;
                  return (
                    <div key={h.id} className="flex gap-3 text-xs">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${toCfg ? 'bg-indigo-600' : 'bg-slate-400'}`} />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {fromCfg && (
                            <>
                              <span className="font-semibold text-slate-500">
                                {fromCfg.label}
                              </span>
                              <span className="text-slate-400">→</span>
                            </>
                          )}
                          <span className={`font-bold px-2 py-0.5 rounded-lg border ${toCfg ? `${toCfg.bg} ${toCfg.text} ${toCfg.border}` : 'bg-slate-100 text-slate-800 border-slate-300'}`}>
                            {toCfg?.label || translateStatus(h.to_status)}
                          </span>
                          <span className="text-slate-400 text-[10px]">{formatDateTime(h.created_at)}</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed font-medium">
                          {localizeText(h.notes) || 'Cập nhật tiến trình'}
                        </p>
                        <span className="text-[10px] text-slate-400 block">Thực hiện bởi: {h.changed_by_name}</span>
                      </div>
                    </div>
                  );
                })}
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
              <SearchableSelect
                options={techOptions}
                value={ticket.primary_technician_id || ''}
                onChange={(val) => handleAssignTech(Number(val))}
                placeholder="-- Chọn hoặc tìm kiếm KTV --"
                searchPlaceholder="Tìm theo tên hoặc SĐT..."
              />
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
                <CurrencyInput
                  value={estCost}
                  onChange={(val) => setEstCost(val)}
                  min={0}
                  placeholder="VD: 500.000"
                  showInWords={false}
                  quickPresets={[200000, 350000, 500000, 800000, 1200000]}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Thời gian dự kiến (giờ)</label>
                <NumberInput
                  min={0.5}
                  step={0.5}
                  value={estHours}
                  onChange={(val) => setEstHours(val)}
                  unit="giờ"
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

              <div className="pt-2 border-t border-slate-200 flex flex-col items-end gap-1 text-xs">
                <div className="flex justify-between w-64 text-slate-600">
                  <span>Chi phí tạm tính:</span>
                  <span className="font-semibold">{formatVND(q.subtotal)}</span>
                </div>
                {q.discount > 0 && (
                  <div className="flex justify-between w-64 text-emerald-700 font-semibold">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3 text-emerald-600" />
                      Ưu đãi {q.promotion_code ? `(${q.promotion_code})` : ''}:
                    </span>
                    <span>-{formatVND(q.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between w-64 text-slate-900 font-bold border-t border-slate-200 pt-1">
                  <span>Tổng duyệt báo giá:</span>
                  <span className="text-sm text-indigo-700">{formatVND(q.total_amount)}</span>
                </div>
              </div>

              {q.status !== 'Approved' && (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleApproveQuote(q.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
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
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
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
                    <NumberInput
                      placeholder="SL"
                      min={1}
                      value={item.qty}
                      onChange={(val) => {
                        const copy = [...quoteItems];
                        copy[idx].qty = Math.max(1, val);
                        setQuoteItems(copy);
                      }}
                      className="text-center"
                    />
                  </div>
                  <div className="col-span-3">
                    <CurrencyInput
                      placeholder="Đơn giá"
                      value={item.price}
                      min={0}
                      onChange={(val) => {
                        const copy = [...quoteItems];
                        copy[idx].price = Math.max(0, val);
                        setQuoteItems(copy);
                      }}
                      showInWords={false}
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
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm dòng linh kiện / tiền công
            </button>

            {/* Promotion & Voucher Section */}
            <div className="p-3.5 bg-white rounded-xl border border-indigo-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-950 flex items-center gap-1.5 text-xs">
                  <BadgePercent className="w-4 h-4 text-indigo-600" />
                  Áp dụng chương trình Ưu đãi & Voucher giảm giá
                </span>
                {selectedPromoCode && (
                  <button
                    type="button"
                    onClick={handleClearQuotePromo}
                    className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3 h-3" /> Hủy mã ({selectedPromoCode})
                  </button>
                )}
              </div>

              {/* Quick Select Active Promotion Chips */}
              {activePromotions.length > 0 && (
                <div>
                  <p className="text-[11px] text-slate-500 mb-1.5 font-medium">Bấm để áp dụng nhanh mã ưu đãi sẵn có:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {activePromotions.map((p) => {
                      const isSelected = selectedPromoCode === p.code;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleApplyPromoToQuote(p.code)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-indigo-50/70 hover:bg-indigo-100 text-indigo-800 border-indigo-200'
                          }`}
                        >
                          <Tag className="w-3 h-3" />
                          <span>{p.code}</span>
                          <span className={`text-[10px] px-1 rounded font-bold ${isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-white text-indigo-700'}`}>
                            {p.discount_type === 'percentage' ? `-${p.discount_value}%` : `-${formatVND(p.discount_value)}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Enter Custom Promo Code */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Hoặc nhập mã voucher khác (VD: KHACHMOI30K)..."
                    value={customPromoInput}
                    onChange={(e) => setCustomPromoInput(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold uppercase text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleApplyPromoToQuote(customPromoInput)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-colors shrink-0 cursor-pointer"
                >
                  Áp dụng mã
                </button>
              </div>

              {/* Promo Validation Feedback */}
              {promoMessage && (
                <div
                  className={`p-2 rounded-lg text-xs flex items-center gap-2 ${
                    promoMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {promoMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{promoMessage.text}</span>
                </div>
              )}

              {/* Manual adjustment */}
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500">Hoặc tự nhập số tiền giảm giá trực tiếp (VNĐ):</span>
                <div className="w-48">
                  <CurrencyInput
                    value={quoteDiscount}
                    onChange={(val) => {
                      setQuoteDiscount(val);
                      if (val === 0) setSelectedPromoCode('');
                    }}
                    min={0}
                    max={quoteItems.reduce((acc, it) => acc + (it.price * it.qty), 0)}
                    placeholder="0"
                    showInWords={false}
                  />
                </div>
              </div>
            </div>

            {/* Total Summary */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-3 border-t border-indigo-100">
              <div className="text-xs space-y-0.5">
                <p className="text-slate-600">
                  Tạm tính: <strong>{formatVND(quoteItems.reduce((acc, it) => acc + (it.price * it.qty), 0))}</strong>
                  {quoteDiscount > 0 && (
                    <span className="text-emerald-700 font-bold ml-2">
                      (Đã giảm: -{formatVND(quoteDiscount)})
                    </span>
                  )}
                </p>
                <p className="text-slate-900 font-bold text-sm">
                  Tổng báo giá: <span className="text-indigo-700 font-extrabold">{formatVND(Math.max(0, quoteItems.reduce((acc, it) => acc + (it.price * it.qty), 0) - quoteDiscount))}</span>
                </p>
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/30 cursor-pointer"
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

          {/* Fast Searchable Part Picker Bar */}
          <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-200 text-xs space-y-3">
            <h4 className="font-bold text-indigo-950 flex items-center gap-1.5 uppercase tracking-wide">
              <Boxes className="w-4 h-4 text-indigo-600" />
              Tìm kiếm linh kiện xuất kho nhanh:
            </h4>
            <div className="flex flex-col md:flex-row items-end gap-3">
              <div className="flex-1 w-full">
                <SearchableSelect
                  options={partOptions}
                  value={selectedPartId}
                  onChange={(val) => setSelectedPartId(val ? Number(val) : '')}
                  placeholder="-- Gõ tên linh kiện hoặc mã SKU để tìm nhanh --"
                  searchPlaceholder="Tìm linh kiện, pin, màn hình, quạt, sạc..."
                  emptyMessage="Không tìm thấy linh kiện phù hợp"
                />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-24">
                  <NumberInput
                    min={1}
                    value={partExportQty}
                    onChange={(val) => setPartExportQty(Math.max(1, val))}
                    placeholder="SL"
                    className="text-center"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedPartId) {
                      showToast('Vui lòng chọn linh kiện cần xuất!', 'error');
                      return;
                    }
                    const part = parts.find((p) => p.id === Number(selectedPartId));
                    if (!part) return;
                    if (part.stock_quantity < partExportQty) {
                      showToast(`Không đủ tồn kho (Hiện có: ${part.stock_quantity})!`, 'error');
                      return;
                    }
                    StorageService.updatePartStock(part.id, -partExportQty);
                    StorageService.addAuditLog(
                      'EXPORT_PART',
                      'parts',
                      part.sku,
                      `Xuất ${partExportQty} cái [${part.name}] cho phiếu ${ticket.ticket_code}`,
                      currentUser?.full_name
                    );
                    showToast(`Đã xuất ${partExportQty} ${part.name} vào phiếu sửa chữa!`, 'success');
                    setSelectedPartId('');
                    setPartExportQty(1);
                    reloadTicket();
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Xuất kho vào phiếu
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3">
            <h4 className="font-bold text-slate-800">Danh sách linh kiện phổ biến:</h4>
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
            {/* Order Financial Summary & Promo Bar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                    <BadgePercent className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Chi phí & Ưu đãi phiếu sửa chữa</h3>
                    <p className="text-[11px] text-slate-500">Chi tiết đối soát giữa chi phí gốc, giảm giá khuyến mãi và công nợ</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setModalPromoCode(ticket.promotion_code || '');
                    setModalCustomDiscount(ticket.discount_amount || 0);
                    setModalPromoMessage(null);
                    setShowDiscountModal(true);
                  }}
                  className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs border border-indigo-200 flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <Gift className="w-3.5 h-3.5" />
                  <span>{ticket.discount_amount > 0 ? 'Đổi ưu đãi / Voucher' : 'Áp dụng mã ưu đãi'}</span>
                </button>
              </div>

              {/* Grid of amounts */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-medium block">Chi phí gốc:</span>
                  <span className="text-sm font-bold text-slate-800">{formatVND(ticket.subtotal_amount)}</span>
                </div>

                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
                  <span className="text-[11px] text-emerald-800 font-medium block flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    Ưu đãi đã giảm:
                  </span>
                  <span className="text-sm font-bold text-emerald-700">
                    {ticket.discount_amount > 0 ? `-${formatVND(ticket.discount_amount)}` : '0 đ'}
                  </span>
                  {ticket.promotion_code && (
                    <span className="text-[10px] font-mono font-bold text-emerald-800 block mt-0.5">
                      Mã: {ticket.promotion_code}
                    </span>
                  )}
                </div>

                <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200">
                  <span className="text-[11px] text-indigo-800 font-medium block">Phải thanh toán:</span>
                  <span className="text-sm font-extrabold text-indigo-900">{formatVND(ticket.final_amount)}</span>
                </div>

                <div className={`p-3 rounded-xl border ${ticket.debt_amount > 0 ? 'bg-rose-50/70 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
                  <span className={`text-[11px] font-medium block ${ticket.debt_amount > 0 ? 'text-rose-700' : 'text-slate-500'}`}>
                    {ticket.debt_amount > 0 ? 'Còn lại cần thu:' : 'Công nợ:'}
                  </span>
                  <span className={`text-sm font-bold ${ticket.debt_amount > 0 ? 'text-rose-700 font-mono font-extrabold' : 'text-emerald-700'}`}>
                    {ticket.debt_amount > 0 ? formatVND(ticket.debt_amount) : '0 đ (Đã thu đủ)'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">Lịch sử thu tiền</h3>
              
              {payments.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center">Chưa có lượt thanh toán nào.</p>
              ) : (
                <div className="space-y-2">
                  {payments.map((p) => (
                    <div key={p.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-indigo-700">{p.payment_code}</span>
                          {p.is_auto_verified ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1 text-[11px] border border-emerald-300">
                              <Zap className="w-3 h-3 text-emerald-600" />
                              {p.payment_method === 'POS_Card'
                                ? `SmartPOS: ${p.card_brand || 'Thẻ'}`
                                : `Auto Webhook: ${p.gateway_provider || 'Ngân hàng'}`}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-bold">
                              {p.payment_method === 'Cash' ? 'Tiền mặt' : p.payment_method === 'POS_Card' ? 'Quẹt thẻ POS' : 'Chuyển khoản'}
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {p.payment_type === 'Deposit' ? 'Tiền cọc' : p.payment_type === 'Installment' ? 'Thu theo đợt' : 'Tất toán'}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-1">
                          Nguồn: <strong className="text-slate-700">{p.cashier_name}</strong> — {formatDateTime(p.created_at)}
                          {p.transaction_ref && <span className="ml-1.5 font-mono text-indigo-600">(Ref: {p.transaction_ref})</span>}
                        </p>
                        {p.notes && <p className="text-[11px] text-slate-600 italic mt-0.5">{p.notes}</p>}
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <span className="font-bold text-slate-900 text-sm block">{formatVND(p.amount)}</span>
                        {p.is_auto_verified && (
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center justify-end gap-0.5 mt-0.5">
                            <CheckCheck className="w-3 h-3" /> Tự động duyệt
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Payment Form */}
              {ticket.final_amount > 0 && ticket.debt_amount <= 0 ? (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="text-sm">Phiếu sửa chữa đã thanh toán đủ 100%</span>
                  </div>
                  <p className="text-emerald-700">
                    Tổng chi phí <strong>{formatVND(ticket.final_amount)}</strong> đã được thu đủ. Hiện không còn công nợ cần thu thêm.
                  </p>
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPrintType('invoice')}
                      className="px-3 py-1.5 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      In hóa đơn thanh toán
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleAddPayment} className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-emerald-950 uppercase flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      Lập phiếu thu tiền mới
                    </h4>
                    {ticket.debt_amount > 0 && (
                      <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                        Số tiền cần thu: {formatVND(ticket.debt_amount)}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Số tiền thu (VND) *
                      </label>
                      <CurrencyInput
                        value={payAmount}
                        onChange={(val) => setPayAmount(val)}
                        max={ticket.debt_amount > 0 ? ticket.debt_amount : undefined}
                        min={0}
                        quickMaxButtonLabel="Thu đúng số còn nợ"
                        quickPresets={[50000, 100000, 200000, 500000, 1000000].filter(
                          (p) => !ticket.debt_amount || p < ticket.debt_amount
                        )}
                        placeholder="Nhập số tiền..."
                        showInWords={true}
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Hình thức thanh toán</label>
                      <select
                        value={payMethod}
                        onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                        className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl font-semibold text-sm text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                      >
                        <option value="Cash">Tiền mặt tại quầy</option>
                        <option value="Bank_Transfer">Chuyển khoản VietQR</option>
                        <option value="POS_Card">Quẹt thẻ POS</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Loại thu</label>
                      <select
                        value={payType}
                        onChange={(e) => setPayType(e.target.value as PaymentType)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium"
                      >
                        <option value="Final">Thanh toán hoàn tất</option>
                        <option value="Deposit">Tiền đặt cọc</option>
                        <option value="Installment">Thu theo đợt</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Mã tham chiếu / Ghi chú thu</label>
                      <input
                        type="text"
                        placeholder="VD: FT261103001 hoặc Ghi chú tiền mặt..."
                        value={payRef}
                        onChange={(e) => setPayRef(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={
                      payAmount <= 0 ||
                      (ticket.debt_amount > 0 && payAmount > ticket.debt_amount)
                    }
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <DollarSign className="w-4 h-4" />
                    Xác nhận thu tiền & In phiếu thu
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Right: Automated Payment Hub (Auto VietQR Webhook & SmartPOS) */}
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              {/* Payment Channel Selector Tabs */}
              <div className="flex bg-slate-100 p-1 rounded-xl gap-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setAutoPayTab('vietqr')}
                  className={`flex-1 py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    autoPayTab === 'vietqr'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>VietQR Webhook</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAutoPayTab('smartpos')}
                  className={`flex-1 py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    autoPayTab === 'smartpos'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Máy SmartPOS</span>
                </button>
              </div>

              {/* View 1: Auto VietQR Webhook */}
              {autoPayTab === 'vietqr' && (
                <div className="space-y-3.5 text-center">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 pb-1">
                    <span className="flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-indigo-600" />
                      <span>VIETQR TỰ ĐỘNG NHẬN DIỆN</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Đang lắng nghe
                    </span>
                  </div>

                  {ticket.debt_amount === 0 ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-1">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                      <p className="font-bold text-emerald-900 text-xs">Phiếu đã hoàn tất thanh toán 100%</p>
                      <p className="text-[11px] text-emerald-700">Công nợ hiện tại: 0 đ</p>
                    </div>
                  ) : (
                    <>
                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 inline-block shadow-inner">
                        <img src={vietQrUrl} alt="VietQR" className="w-44 h-44 mx-auto rounded" />
                      </div>

                      <div className="text-left bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                        <p><span className="text-slate-500">Ngân hàng:</span> <strong>{settings.bank_name}</strong></p>
                        <p><span className="text-slate-500">Số TK:</span> <strong className="font-mono text-indigo-700">{settings.bank_account_no}</strong></p>
                        <p><span className="text-slate-500">Chủ TK:</span> <strong>{settings.bank_account_name}</strong></p>
                        <p><span className="text-slate-500">Số tiền:</span> <strong className="text-rose-600 font-bold">{formatVND(ticket.debt_amount || ticket.final_amount)}</strong></p>
                        <p><span className="text-slate-500">Nội dung CK:</span> <strong className="font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">{ticket.ticket_code}</strong></p>
                      </div>

                      {/* Test Webhook simulation button */}
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={handleSimulateWebhook}
                          disabled={isSimulatingWebhook}
                          className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl font-bold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          {isSimulatingWebhook ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Ngân hàng đang bắn Webhook về...</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-3.5 h-3.5 fill-current" />
                              <span>Mô phỏng Khách vừa chuyển khoản (Test Webhook)</span>
                            </>
                          )}
                        </button>
                        <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed text-left">
                          💡 <em>Khi khách quét mã trên điện thoại và chuyển tiền thật, cổng SePAY/Ngân hàng sẽ bắn Webhook tự động tạo phiếu thu và xóa nợ đúng như khi bấm nút trên.</em>
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* View 2: SmartPOS Integration */}
              {autoPayTab === 'smartpos' && (
                <div className="space-y-3.5 text-center">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 pb-1">
                    <span className="flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-indigo-600" />
                      <span>KẾT NỐI MÁY QUẸT THẺ SMARTPOS</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      POS Online
                    </span>
                  </div>

                  {ticket.debt_amount === 0 ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-1">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                      <p className="font-bold text-emerald-900 text-xs">Phiếu đã hoàn tất thanh toán 100%</p>
                      <p className="text-[11px] text-emerald-700">Không còn công nợ cần quẹt thẻ</p>
                    </div>
                  ) : (
                    <>
                      <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-inner text-left space-y-2.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                          <span>Thiết bị: <strong className="text-white font-mono">{settings.pos_terminal_id || 'VNPAY_POS_Q1_01'}</strong></span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">LAN Socket Ready</span>
                        </div>

                        <div>
                          <p className="text-[11px] text-slate-400">Số tiền đẩy sang POS:</p>
                          <p className="text-xl font-bold font-mono text-emerald-400">{formatVND(ticket.debt_amount || ticket.final_amount)}</p>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                          <span>Phiếu: {ticket.ticket_code}</span>
                          <span>Hỗ trợ: Visa, NAPAS, Apple Pay</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleOpenSmartPos}
                        className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>📲 Bắn lệnh thanh toán sang Máy SmartPOS</span>
                      </button>

                      <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed text-left">
                        💡 <em>Lệnh sẽ truyền trực tiếp sang màn hình máy POS tại quầy. Sau khi khách quẹt/chạm thẻ, máy POS tự động xác nhận và in hóa đơn cà thẻ.</em>
                      </p>
                    </>
                  )}
                </div>
              )}
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

      {/* Interactive SmartPOS Terminal Simulation Modal */}
      {showSmartPosModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-3xl border border-slate-700 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* POS Top Terminal Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="font-mono text-xs font-bold text-slate-300">
                  {settings.pos_terminal_id || 'VNPAY_POS_Q1_01'}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">SmartPOS Android Terminal</span>
              <button
                type="button"
                onClick={() => {
                  setShowSmartPosModal(false);
                  setSmartPosStep('idle');
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Simulated POS Screen */}
            <div className="p-6 text-center space-y-4">
              {smartPosStep === 'pushing' && (
                <div className="py-8 space-y-3">
                  <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin mx-auto" />
                  <p className="font-bold text-sm text-slate-200">Đang đẩy lệnh sang máy POS...</p>
                  <p className="text-xs text-slate-400">Kết nối Socket LAN: {settings.pos_ip_address || '192.168.1.188:8080'}</p>
                </div>
              )}

              {smartPosStep === 'waiting_card' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700">
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Số tiền thanh toán</p>
                    <p className="text-3xl font-extrabold text-emerald-400 font-mono my-1">
                      {formatVND(ticket.debt_amount || ticket.final_amount)}
                    </p>
                    <p className="text-xs text-slate-400">Phiếu: <strong className="text-white font-mono">{ticket.ticket_code}</strong></p>
                  </div>

                  <div className="py-2">
                    <p className="text-xs font-bold text-slate-300 animate-pulse uppercase tracking-wider">
                      ▼ XIN MỜI CHẠM HOẶC QUẸT THẺ ▼
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">Chọn loại thẻ khách thanh toán để mô phỏng:</p>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 text-xs">
                    <button
                      type="button"
                      onClick={() => handleSimulateCardPayment('visa')}
                      className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-600 flex items-center justify-between transition-all cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-amber-400" />
                        <span>Chạm thẻ Visa / MasterCard Contactless</span>
                      </span>
                      <span className="text-[10px] text-slate-400">Chạm sóng NFC</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSimulateCardPayment('napas')}
                      className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-600 flex items-center justify-between transition-all cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-emerald-400" />
                        <span>Cắm thẻ ATM NAPAS chip nội địa</span>
                      </span>
                      <span className="text-[10px] text-slate-400">Cắm khe chip</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSimulateCardPayment('apple_pay')}
                      className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-600 flex items-center justify-between transition-all cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-indigo-400" />
                        <span>Chạm Apple Pay / Google Wallet</span>
                      </span>
                      <span className="text-[10px] text-slate-400">Chạm điện thoại</span>
                    </button>
                  </div>
                </div>
              )}

              {smartPosStep === 'processing' && (
                <div className="py-8 space-y-3">
                  <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin mx-auto" />
                  <p className="font-bold text-sm text-slate-200">Đang xử lý giao dịch thẻ...</p>
                  <p className="text-xs text-slate-400 font-mono">Đọc chip EMV & Xác thực trung tâm chuyển mạch</p>
                </div>
              )}

              {smartPosStep === 'success' && (
                <div className="py-6 space-y-2">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
                    <Check className="w-8 h-8" />
                  </div>
                  <p className="font-bold text-base text-emerald-400">GIAO DỊCH THÀNH CÔNG!</p>
                  <p className="text-xs text-slate-300">Máy POS đã in hóa đơn & tự động đồng bộ về RepairFlow</p>
                </div>
              )}
            </div>

            {/* POS Footer Cancel */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 text-center">
              <button
                type="button"
                onClick={() => {
                  setShowSmartPosModal(false);
                  setSmartPosStep('idle');
                }}
                className="text-xs text-slate-400 hover:text-slate-200 font-semibold"
              >
                Hủy phiên giao dịch POS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Discount & Promotion Modal */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <BadgePercent className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Ưu đãi giảm giá & Voucher</h3>
                  <p className="text-[11px] text-slate-500">Áp dụng trực tiếp cho phiếu {ticket.ticket_code}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDiscountModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplyDiscountAtCheckout} className="p-6 space-y-4 text-xs">
              {/* Current Cost Notice */}
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 block">Tổng chi phí dịch vụ gốc:</span>
                  <span className="text-sm font-extrabold text-indigo-900">{formatVND(ticket.subtotal_amount)}</span>
                </div>
                {ticket.discount_amount > 0 && (
                  <div className="text-right">
                    <span className="text-[11px] text-emerald-700 font-medium block">Hiện đang giảm:</span>
                    <span className="text-xs font-bold text-emerald-800">-{formatVND(ticket.discount_amount)} {ticket.promotion_code ? `(${ticket.promotion_code})` : ''}</span>
                  </div>
                )}
              </div>

              {/* Mode Selection */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Cách thức áp dụng ưu đãi</label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                      modalDiscountType === 'voucher'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="modalDiscountType"
                      checked={modalDiscountType === 'voucher'}
                      onChange={() => setModalDiscountType('voucher')}
                      className="text-indigo-600"
                    />
                    <Tag className="w-4 h-4 text-indigo-600" />
                    <span>Mã ưu đãi / Voucher</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                      modalDiscountType === 'custom'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="modalDiscountType"
                      checked={modalDiscountType === 'custom'}
                      onChange={() => setModalDiscountType('custom')}
                      className="text-indigo-600"
                    />
                    <DollarSign className="w-4 h-4 text-indigo-600" />
                    <span>Giảm tiền tùy chỉnh</span>
                  </label>
                </div>
              </div>

              {/* Voucher Mode Form */}
              {modalDiscountType === 'voucher' ? (
                <div className="space-y-3">
                  {activePromotions.length > 0 && (
                    <div>
                      <p className="text-[11px] text-slate-500 mb-1.5 font-medium">Bấm vào mã có sẵn để chọn nhanh:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {activePromotions.map((p) => {
                          const isSelected = modalPromoCode.toUpperCase() === p.code.toUpperCase();
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setModalPromoCode(p.code);
                                setModalPromoMessage(null);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                                isSelected
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                  : 'bg-indigo-50/60 hover:bg-indigo-100 text-indigo-800 border-indigo-200'
                              }`}
                            >
                              <Tag className="w-3 h-3" />
                              <span>{p.code}</span>
                              <span className={`text-[10px] px-1 rounded font-bold ${isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-white text-indigo-700'}`}>
                                {p.discount_type === 'percentage' ? `-${p.discount_value}%` : `-${formatVND(p.discount_value)}`}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Mã ưu đãi / Coupon</label>
                    <input
                      type="text"
                      placeholder="VD: KHACHQUEN10, HSSV50K..."
                      value={modalPromoCode}
                      onChange={(e) => {
                        setModalPromoCode(e.target.value.toUpperCase().replace(/\s+/g, ''));
                        setModalPromoMessage(null);
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold uppercase text-slate-800 text-sm focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  {modalPromoCode && (() => {
                    const check = StorageService.validateAndCalculatePromotion(modalPromoCode, ticket.subtotal_amount);
                    return (
                      <div
                        className={`p-3 rounded-xl border flex items-start gap-2 ${
                          check.valid
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                            : 'bg-rose-50 text-rose-900 border-rose-200'
                        }`}
                      >
                        {check.valid ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        )}
                        <div className="space-y-0.5">
                          <p className="font-bold">{check.message}</p>
                          {check.valid && (
                            <p className="text-[11px] text-emerald-700">
                              Sau giảm giá, số tiền còn lại cần thu: <strong>{formatVND(Math.max(0, ticket.subtotal_amount - check.discountAmount - ticket.paid_amount))}</strong>
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Số tiền giảm giá trực tiếp (VNĐ)
                    </label>
                    <CurrencyInput
                      value={modalCustomDiscount}
                      onChange={(val) => {
                        setModalCustomDiscount(val);
                        setModalPromoMessage(null);
                      }}
                      min={0}
                      max={ticket.subtotal_amount}
                      placeholder="Nhập số tiền..."
                      showInWords={false}
                      quickPresets={[20000, 50000, 100000, 200000]}
                    />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex justify-between text-slate-600">
                      <span>Chi phí gốc:</span>
                      <span>{formatVND(ticket.subtotal_amount)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Giảm giá:</span>
                      <span>-{formatVND(modalCustomDiscount)}</span>
                    </div>
                    <div className="flex justify-between text-indigo-950 font-bold pt-1 border-t border-slate-200">
                      <span>Tổng phải thanh toán:</span>
                      <span className="text-sm">{formatVND(Math.max(0, ticket.subtotal_amount - modalCustomDiscount))}</span>
                    </div>
                  </div>
                </div>
              )}

              {modalPromoMessage && (
                <div
                  className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                    modalPromoMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{modalPromoMessage.text}</span>
                </div>
              )}

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                {ticket.discount_amount > 0 ? (
                  <button
                    type="button"
                    onClick={handleRemoveDiscountAtCheckout}
                    className="text-rose-600 hover:text-rose-800 text-xs font-semibold cursor-pointer"
                  >
                    Hủy bỏ ưu đãi hiện có
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDiscountModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                  >
                    Xác nhận áp dụng
                  </button>
                </div>
              </div>
            </form>
          </div>
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

      {/* Status Transition & Accountability Modal */}
      {pendingStatus && (
        <StatusTransitionModal
          isOpen={Boolean(pendingStatus)}
          onClose={() => setPendingStatus(null)}
          ticket={ticket}
          targetStatus={pendingStatus}
          currentUser={currentUser}
          technicians={technicians}
          isOverrideMode={isAdminOverride}
          onConfirm={handleConfirmStatusChange}
        />
      )}
    </div>
  );
};
