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
  RepairPartUsage,
  Part,
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
  RotateCcw,
  PackageCheck,
  Building2,
  History,
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
  const [decryptedDevicePass, setDecryptedDevicePass] = useState<string>('');
  const [isLoadingDevicePass, setIsLoadingDevicePass] = useState(false);

  const handleToggleDevicePassword = async () => {
    if (!ticket) return;
    if (showSecretPassword) {
      setShowSecretPassword(false);
      return;
    }
    setIsLoadingDevicePass(true);
    try {
      const pass = await StorageService.getTicketDevicePassword(ticket.id);
      setDecryptedDevicePass(pass || decryptPassword(ticket.device_password_hint || '') || '');
      setShowSecretPassword(true);
    } catch (err: any) {
      showToast(err?.message || 'Không có quyền hoặc không thể giải mã mật khẩu thiết bị!', 'error');
    } finally {
      setIsLoadingDevicePass(false);
    }
  };

  // Diagnostics State (UC-11)
  const diagnostics = StorageService.getDiagnostics(ticketId);
  const [rootCause, setRootCause] = useState('');
  const [solution, setSolution] = useState('');
  const [estCost, setEstCost] = useState<number>(500000);
  const [estHours, setEstHours] = useState<number>(2);

  // Quote State (UC-12, UC-13)
  const quotes = StorageService.getQuotes(ticketId);
  const [parts, setParts] = useState<Part[]>(() => StorageService.getParts());
  const [partUsages, setPartUsages] = useState<RepairPartUsage[]>(() => StorageService.getPartUsages(ticketId));
  
  // Part Usage Export/Return Modals State (UC-17)
  const [exportingPart, setExportingPart] = useState<Part | null>(null);
  const [exportModalQty, setExportModalQty] = useState<number>(1);
  const [exportModalTech, setExportModalTech] = useState<string>(currentUser?.full_name || 'Lê Hoàng Nam (KTV Trưởng)');
  const [exportModalBatchId, setExportModalBatchId] = useState<number | ''>('');
  const [returningUsage, setReturningUsage] = useState<RepairPartUsage | null>(null);

  const reloadPartUsages = () => {
    setPartUsages(StorageService.getPartUsages(ticketId));
    setParts(StorageService.getParts());
    reloadTicket();
  };
  const [quoteItems, setQuoteItems] = useState<{ type: 'labor' | 'part'; name: string; part_id?: number; batch_id?: number; batch_code?: string; qty: number; price: number; warranty: number }[]>([
    { type: 'labor', name: 'Công sửa chữa & vệ sinh mạch', qty: 1, price: 350000, warranty: 3 },
  ]);
  const [quoteDiscount, setQuoteDiscount] = useState<number>(0);
  const [quickQuotePartId, setQuickQuotePartId] = useState<number | ''>('');
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

  // Role-Based Status Transitions & Permission Context
  const userRole = (currentUser?.role || 'receptionist').toLowerCase() as UserRole;
  const isAdminOrManager = userRole === 'admin' || userRole === 'manager';
  const allowedTransitions = getAllowedTransitions(ticket.status, userRole, isAdminOverride);
  const awaitingNotice = getRoleAwaitingNotice(ticket.status, userRole);

  // Permission flags per tab
  const canEditDiagnostics = isAdminOrManager || userRole === 'technician' || isAdminOverride;
  const canManageQuotes = isAdminOrManager || userRole === 'receptionist' || userRole === 'technician' || isAdminOverride;
  const canExportParts = isAdminOrManager || userRole === 'technician' || isAdminOverride;
  const canPerformQC = isAdminOrManager || userRole === 'technician' || isAdminOverride;
  const canProcessPayments = isAdminOrManager || userRole === 'receptionist' || isAdminOverride;
  const canCompleteDelivery = isAdminOrManager || userRole === 'receptionist' || isAdminOverride;

  // Filter mode state: 'my_role' (default for non-admin) vs 'all'
  const [showAllTabs, setShowAllTabs] = useState<boolean>(false);

  // Master tab definitions with role badges & access scope
  const ALL_TABS = React.useMemo(() => [
    {
      id: 'overview',
      label: '1. Tổng quan & Tiếp nhận',
      icon: FileText,
      badge: 'Tất cả',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
      allowedRoles: ['admin', 'manager', 'receptionist', 'technician'],
    },
    {
      id: 'diagnostics',
      label: '2. Chẩn đoán lỗi',
      icon: Wrench,
      badge: 'KTV',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      allowedRoles: ['admin', 'manager', 'technician'],
    },
    {
      id: 'quotes',
      label: '3. Báo giá & Khách duyệt',
      icon: DollarSign,
      badge: 'Lễ tân & KTV',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
      allowedRoles: ['admin', 'manager', 'receptionist', 'technician'],
    },
    {
      id: 'parts',
      label: '4. Linh kiện dùng',
      icon: Boxes,
      badge: 'KTV & Kho',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
      allowedRoles: ['admin', 'manager', 'technician'],
    },
    {
      id: 'qc',
      label: '5. QC Kiểm tra chất lượng',
      icon: CheckCircle2,
      badge: 'KTV QC',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      allowedRoles: ['admin', 'manager', 'technician'],
    },
    {
      id: 'payments',
      label: '6. Thanh toán & Công nợ',
      icon: CreditCard,
      badge: 'Thu ngân',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      allowedRoles: ['admin', 'manager', 'receptionist'],
    },
    {
      id: 'delivery',
      label: '7. Bàn giao & Bảo hành',
      icon: ShieldCheck,
      badge: 'Lễ tân',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      allowedRoles: ['admin', 'manager', 'receptionist'],
    },
  ], []);

  // Compute visible tabs based on user role & showAllTabs toggle
  const visibleTabs = React.useMemo(() => {
    if (showAllTabs || isAdminOrManager) {
      return ALL_TABS;
    }
    return ALL_TABS.filter((tab) => tab.allowedRoles.includes(userRole));
  }, [ALL_TABS, showAllTabs, isAdminOrManager, userRole]);

  // Keep active tab safe if activeTab is not in visibleTabs
  useEffect(() => {
    if (!visibleTabs.some((t) => t.id === activeTab)) {
      setActiveTab(visibleTabs[0]?.id as any || 'overview');
    }
  }, [visibleTabs, activeTab]);

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
  const handleConfirmStatusChange = async (data: {
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

    const roleStr = currentUser?.role || 'Nhân viên';
    const nameStr = currentUser?.full_name || 'Người dùng';
    const noteDetails = `[Cam kết trách nhiệm] ${data.notes}${
      data.debtApproved ? ' • Phê duyệt cho khách nợ' : ''
    }${data.returnCondition ? ` • Tình trạng hoàn trả: ${data.returnCondition}` : ''}`;

    try {
      await StorageService.updateTicketAsync(ticket.id, updates, isAdminOverride, {
        note: noteDetails,
      });

      showToast(
        `Đã xác nhận trách nhiệm & chuyển trạng thái sang: ${STATUS_CONFIG[data.targetStatus].label}`,
        'success'
      );
      setPendingStatus(null);
      reloadTicket();
    } catch (err: any) {
      showToast(err?.message || 'Không thể chuyển trạng thái phiếu sửa chữa!', 'error');
    }
  };

  // Assign Technician (UC-10)
  const handleAssignTech = async (techId: number) => {
    const tech = technicians.find((t) => t.id === techId);
    if (tech) {
      try {
        await StorageService.updateTicketAsync(ticket.id, {
          primary_technician_id: tech.id,
          primary_technician_name: tech.full_name,
        });
        showToast(`Đã phân công cho kỹ thuật viên: ${tech.full_name}`, 'success');
        reloadTicket();
      } catch (err: any) {
        showToast(err?.message || 'Không thể phân công kỹ thuật viên!', 'error');
      }
    }
  };

  // Save Diagnostic (UC-11)
  const handleSaveDiagnostic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rootCause.trim() || !solution.trim()) {
      showToast('Vui lòng điền nguyên nhân lỗi và phương án xử lý!', 'error');
      return;
    }
    try {
      await StorageService.addDiagnosticAsync({
        ticket_id: ticket.id,
        technician_id: currentUser?.id || 4,
        technician_name: currentUser?.full_name || 'Kỹ thuật viên',
        root_cause: rootCause.trim(),
        proposed_solution: solution.trim(),
        estimated_cost: Number(estCost),
        estimated_hours: Number(estHours),
      });
      if (ticket.status === 'Received' || ticket.status === 'Diagnosing') {
        await StorageService.transitionTicketAsync(ticket.id, 'Waiting_Approval', {
          note: 'Đã lưu kết quả chẩn đoán kỹ thuật, chờ lập/duyệt báo giá',
          is_override: isAdminOverride,
        });
      }
      showToast('Đã lưu kết quả chẩn đoán và chuyển sang Chờ duyệt báo giá!', 'success');
      reloadTicket();
    } catch (err: any) {
      showToast(err?.message || 'Không thể lưu kết quả chẩn đoán!', 'error');
    }
  };

  // Quote Promotion Handlers
  const handleApplyPromoToQuote = async (codeToApply: string) => {
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
    const res = await StorageService.validatePromotionAsync(clean, subtotal);
    if (res.valid && res.promotion) {
      setSelectedPromoCode(res.promotion.code);
      setCustomPromoInput(res.promotion.code);
      setQuoteDiscount(res.discountAmount);
      setPromoMessage({ type: 'success', text: res.message || 'Áp dụng mã ưu đãi thành công!' });
      showToast(`Áp dụng mã "${res.promotion.code}": Giảm ${formatVND(res.discountAmount)}`, 'success');
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
  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    const subtotal = quoteItems.reduce((acc, it) => acc + it.price * it.qty, 0);
    const total = Math.max(0, subtotal - Number(quoteDiscount));

    try {
      const newQuote = await StorageService.addQuoteAsync({
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
          part_id: it.part_id,
          batch_id: it.batch_id,
          batch_code: it.batch_code,
          name: it.name,
          quantity: it.qty,
          unit_price: it.price,
          labor_fee: 0,
          subtotal: it.price * it.qty,
          warranty_months: it.warranty,
        })),
      });

      showToast(
        `Đã tạo báo giá ${newQuote.quote_code} v${newQuote.version} (${formatVND(newQuote.total_amount)})!`,
        'success'
      );
      reloadTicket();
    } catch (err: any) {
      showToast(err?.message || 'Không thể tạo báo giá!', 'error');
    }
  };

  // Apply / Change Discount Voucher at Checkout
  const handleApplyDiscountAtCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket) return;

    let appliedDiscount = 0;
    let appliedCode: string | undefined = undefined;

    if (modalDiscountType === 'voucher') {
      if (!modalPromoCode.trim()) {
        setModalPromoMessage({ type: 'error', text: 'Vui lòng chọn hoặc nhập mã ưu đãi!' });
        return;
      }
      const res = await StorageService.validatePromotionAsync(modalPromoCode, ticket.subtotal_amount);
      if (!res.valid || !res.promotion) {
        setModalPromoMessage({ type: 'error', text: res.message || 'Mã ưu đãi không hợp lệ!' });
        return;
      }
      appliedDiscount = res.discountAmount;
      appliedCode = res.promotion.code;
    } else {
      appliedDiscount = Math.max(0, modalCustomDiscount);
      if (ticket.subtotal_amount > 0 && appliedDiscount > ticket.subtotal_amount) {
        setModalPromoMessage({ type: 'error', text: 'Số tiền giảm không được vượt quá chi phí gốc!' });
        return;
      }
    }

    try {
      await StorageService.updateTicketAsync(ticket.id, {
        discount_amount: appliedDiscount,
        promotion_code: appliedCode || ('' as any),
      });

      showToast(`Đã áp dụng mức ưu đãi ${formatVND(appliedDiscount)} thành công!`, 'success');
      setShowDiscountModal(false);
      reloadTicket();
    } catch (err: any) {
      showToast(err?.message || 'Không thể áp dụng ưu đãi!', 'error');
    }
  };

  const handleRemoveDiscountAtCheckout = async () => {
    if (!ticket) return;
    try {
      await StorageService.updateTicketAsync(ticket.id, {
        discount_amount: 0,
        promotion_code: '' as any,
      });

      showToast('Đã hủy ưu đãi giảm giá trên phiếu!', 'info');
      setShowDiscountModal(false);
      reloadTicket();
    } catch (err: any) {
      showToast(err?.message || 'Không thể hủy ưu đãi giảm giá!', 'error');
    }
  };

  // Approve Quote (UC-13)
  const handleApproveQuote = async (quoteId: number) => {
    try {
      await StorageService.updateQuoteStatusAsync(
        quoteId,
        'Approved',
        `Được duyệt bởi ${currentUser?.full_name}`
      );
      showToast('Khách hàng đã duyệt báo giá. Chuyển sang Đang sửa chữa!', 'success');
      reloadTicket();
    } catch (err: any) {
      showToast(err?.message || 'Không thể duyệt báo giá!', 'error');
    }
  };

  // Save QC Checklist (UC-20) — Item F.4: Strictly await saveChecklistAsync before transitioning to Ready_For_Pickup
  const handleSaveQC = async () => {
    const allPassed = qcItems.every((it) => it.status === 'Pass' || it.status === 'NA');
    try {
      const savedChecklist = await StorageService.saveChecklistAsync({
        ticket_id: ticket.id,
        checked_by_name: currentUser?.full_name || 'QC Inspector',
        is_passed: allPassed,
        items: qcItems,
      });

      if (savedChecklist.is_passed) {
        if (ticket.status !== 'Ready_For_Pickup' && ticket.status !== 'Delivered') {
          await StorageService.transitionTicketAsync(ticket.id, 'Ready_For_Pickup', {
            note: 'Kiểm tra chất lượng QC đạt 100%, sẵn sàng bàn giao máy',
            is_override: isAdminOverride,
          });
        }
        showToast('Kiểm tra chất lượng ĐẠT 100%! Phiếu đã sẵn sàng giao khách.', 'success');
      } else {
        showToast('Đã lưu biên bản QC. Có mục chưa đạt yêu cầu kiểm tra!', 'error');
      }
      reloadTicket();
    } catch (err: any) {
      showToast(err?.message || 'Không thể lưu biên bản kiểm tra chất lượng QC!', 'error');
    }
  };

  // Payment (UC-21)
  const handleAddPayment = async (e: React.FormEvent) => {
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

    try {
      const payment = await StorageService.addPaymentAsync({
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

      showToast(
        `Đã thu ${formatVND(payment.amount)} thành công! Mã phiếu thu: ${payment.payment_code}`,
        'success'
      );
      reloadTicket();
    } catch (err: any) {
      showToast(err?.message || 'Không thể ghi nhận thanh toán!', 'error');
    }
  };

  // Item D.3: Simulate Bank Webhook Auto-Payment via Server Endpoint (/api/dev/simulate-webhook)
  const handleSimulateWebhook = async () => {
    if (!ticket) return;
    const amountToPay = ticket.debt_amount > 0 ? ticket.debt_amount : ticket.final_amount || 850000;
    setIsSimulatingWebhook(true);
    try {
      const res = await StorageService.simulateWebhookAsync({
        amount: amountToPay,
        content: `${ticket.ticket_code} CK DICH VU`,
        transaction_ref: `MBFT${Date.now().toString().slice(-8)}`,
        gateway_provider: settings.payment_gateway_provider || 'sepay',
        payment_method: 'Bank_Transfer',
      });
      if (res.processed && res.matched) {
        reloadTicket();
        showToast(
          `🔔 TING TING! Nhận tự động ${formatVND(amountToPay)} qua Webhook. Đã cập nhật phiếu thu & xóa công nợ!`,
          'success'
        );
      } else {
        showToast(res.reason || 'Không tìm thấy phiếu khớp với nội dung Webhook.', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Không thể giả lập Webhook thanh toán!', 'error');
    } finally {
      setIsSimulatingWebhook(false);
    }
  };

  // Push command to SmartPOS & Simulate Customer Card Tap
  const handleOpenSmartPos = () => {
    setSmartPosStep('pushing');
    setShowSmartPosModal(true);
    setTimeout(() => {
      setSmartPosStep('waiting_card');
    }, 800);
  };

  const handleSimulateCardPayment = async (cardType: 'visa' | 'napas' | 'apple_pay') => {
    if (!ticket) return;
    setSmartPosCardType(cardType);
    setSmartPosStep('processing');
    const cardLabel =
      cardType === 'visa'
        ? 'Visa Contactless **** 6886'
        : cardType === 'napas'
        ? 'Napas Chip ATM **** 3102'
        : 'Apple Pay (Techcombank)';
    const amountToPay = ticket.debt_amount > 0 ? ticket.debt_amount : ticket.final_amount || 850000;
    try {
      const res = await StorageService.simulateWebhookAsync({
        amount: amountToPay,
        content: `${ticket.ticket_code} SMARTPOS`,
        transaction_ref: `POS_${Date.now().toString().slice(-8)}`,
        gateway_provider: 'vnpay_pos',
        payment_method: 'POS_Card',
        card_brand: cardLabel,
      });
      if (res.processed && res.matched) {
        setSmartPosStep('success');
        setTimeout(() => {
          setShowSmartPosModal(false);
          setSmartPosStep('idle');
          reloadTicket();
          showToast(
            `💳 Giao dịch SmartPOS thành công! Đã tự động thu ${formatVND(amountToPay)} [${cardLabel}].`,
            'success'
          );
        }, 900);
      } else {
        setSmartPosStep('waiting_card');
        showToast(res.reason || 'Không thể xử lý giao dịch SmartPOS!', 'error');
      }
    } catch (err: any) {
      setSmartPosStep('waiting_card');
      showToast(err?.message || 'Không thể giả lập giao dịch SmartPOS!', 'error');
    }
  };

  // Handover & Warranty (UC-23, UC-24) — Item C.4: Atomic transition + warranty creation on server
  const handleDeliverAndWarranty = async () => {
    if (ticket.debt_amount > 0) {
      if (
        !window.confirm(
          `Thiết bị vẫn còn công nợ ${formatVND(ticket.debt_amount)}. Bạn có chắc chắn muốn bàn giao máy cho khách nợ?`
        )
      ) {
        return;
      }
    }

    try {
      const result = await StorageService.transitionTicketAsync(ticket.id, 'Delivered', {
        note: `Bàn giao thiết bị cho ${receiverName || ticket.customer_name}. Phụ kiện: ${accessoriesReturned}`,
        warranty_days: Number(warrantyDays),
        is_override: isAdminOverride,
      });

      const warrantyCode = result.warranty?.warranty_code || 'BH-MỚI';
      showToast(
        `Bàn giao máy thành công! Kích hoạt bảo hành: ${warrantyCode} (${warrantyDays} ngày)`,
        'success'
      );
      reloadTicket();
      setPrintType('handover');
    } catch (err: any) {
      showToast(err?.message || 'Không đủ điều kiện bàn giao máy hoặc kích hoạt bảo hành!', 'error');
    }
  };

  const statusConf = STATUS_CONFIG[ticket.status];
  const priorityConf = PRIORITY_CONFIG[ticket.priority];
  const vietQrUrl = getVietQRUrl(settings.bank_name, settings.bank_account_no, settings.bank_account_name, ticket.debt_amount || ticket.final_amount, ticket.ticket_code);

  return (
    <div className="space-y-5 w-full pb-12">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 text-white p-5 rounded-2xl border border-indigo-800/70 shadow-lg shadow-indigo-950/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button
            onClick={onBack}
            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white border border-white/15 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono font-extrabold text-lg text-white bg-indigo-500/30 border border-indigo-400/40 px-3 py-0.5 rounded-xl tracking-wide shadow-2xs">
                {ticket.ticket_code}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-lg font-bold border shadow-2xs ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}>
                {statusConf.label}
              </span>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border shadow-2xs ${priorityConf.badgeClass}`}>
                {priorityConf.label}
              </span>
            </div>
            <p className="text-xs text-indigo-200/90 mt-1.5">
              Khách hàng: <strong className="text-white font-bold">{ticket.customer_name}</strong> ({ticket.customer_phone}) — Nhận ngày: <span className="text-indigo-100">{formatDateTime(ticket.created_at)}</span>
            </p>
          </div>
        </div>

        {/* Print Buttons Quick Action */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setPrintType('intake')}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 border border-white/20 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-indigo-300" />
            Phiếu tiếp nhận
          </button>
          <button
            onClick={() => setPrintType('invoice')}
            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm shadow-emerald-950/30 transition-colors cursor-pointer"
          >
            <DollarSign className="w-3.5 h-3.5" />
            Hóa đơn thu tiền
          </button>
          <button
            onClick={() => setPrintType('handover')}
            className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm shadow-amber-950/30 transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Biên bản bàn giao
          </button>
        </div>
      </div>

      {/* Role-Based Status Transition & Workflow Action Panel */}
      <div className="bg-white rounded-2xl border border-slate-300/90 shadow-sm overflow-hidden">
        {/* Top Header: Current Stage & User Authority Context */}
        <div className="p-3.5 sm:px-5 bg-gradient-to-r from-indigo-50/90 via-slate-50 to-violet-50/80 border-b border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0" />
              Giai đoạn hiện tại:
            </span>
            <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border shadow-2xs ${STATUS_CONFIG[ticket.status].bg} ${STATUS_CONFIG[ticket.status].text} ${STATUS_CONFIG[ticket.status].border}`}>
              {STATUS_CONFIG[ticket.status].label}
            </span>

            {/* Account / Role Badge */}
            <div className="h-4 w-px bg-indigo-200/70 mx-1 hidden sm:block" />
            <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-xl border border-indigo-200/80 shadow-2xs text-xs">
              <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-slate-500">Tài khoản:</span>
              <strong className="text-slate-900">{currentUser?.full_name || 'Nhân viên'}</strong>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-600 text-white">
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
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isAdminOverride
                    ? 'bg-amber-500 text-white border border-amber-600 shadow-sm font-bold'
                    : 'bg-white text-indigo-900 border border-indigo-200 hover:bg-indigo-50 shadow-2xs'
                }`}
                title="Bật/tắt chế độ quản trị để can thiệp chuyển đến bất kỳ trạng thái nào"
              >
                <Zap className={`w-3.5 h-3.5 ${isAdminOverride ? 'text-white fill-white' : 'text-amber-500'}`} />
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

      {/* Tab Filter & Permission Control Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 bg-indigo-50/90 rounded-xl text-xs border border-indigo-200/80 shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-indigo-950 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            Đang truy cập với vai trò: <span className="text-indigo-700 underline font-extrabold">{ROLE_DISPLAY_NAMES[userRole] || userRole}</span>
          </span>
          <span className="text-indigo-300">|</span>
          <span className="text-indigo-900/80 text-[11px] font-medium">
            Đang hiển thị <strong className="text-indigo-950 font-extrabold">{visibleTabs.length}/7 tab</strong> {showAllTabs ? '(Đã mở tất cả tab quy trình)' : `(Lọc theo nhiệm vụ ${ROLE_DISPLAY_NAMES[userRole]})`}
          </span>
        </div>

        {!isAdminOrManager && (
          <button
            type="button"
            onClick={() => setShowAllTabs(!showAllTabs)}
            className="px-3 py-1 bg-white hover:bg-indigo-100 text-indigo-900 font-bold rounded-lg border border-indigo-300 text-[11px] shadow-2xs transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            {showAllTabs ? '🔒 Chỉ xem tab thuộc vai trò tôi' : '🔓 Hiển thị tất cả 7 tab quy trình'}
          </button>
        )}
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-300/90 shadow-sm flex gap-1.5 overflow-x-auto text-xs font-bold">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-2.5 px-4 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-600 hover:text-indigo-700 hover:bg-indigo-50/70'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-indigo-500'}`} />
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold border ${
                  isActive ? 'bg-white/20 text-white border-white/30' : tab.badgeColor
                }`}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Device & Symptoms Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-300/90 shadow-sm space-y-4 border-t-4 border-t-indigo-600">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Wrench className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Chi tiết thiết bị & Lỗi ban đầu</h3>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100">
                  <p className="text-indigo-600/80 font-semibold text-[11px] uppercase tracking-wider">Thiết bị</p>
                  <p className="font-extrabold text-slate-900 text-sm mt-1">{ticket.device_brand} {ticket.device_model}</p>
                </div>
                <div className="p-3 rounded-xl bg-violet-50/60 border border-violet-100">
                  <p className="text-violet-600/80 font-semibold text-[11px] uppercase tracking-wider">Loại máy</p>
                  <p className="font-bold text-slate-900 text-sm mt-1">{ticket.device_category}</p>
                </div>
                <div className="p-3 rounded-xl bg-sky-50/60 border border-sky-100">
                  <p className="text-sky-700/80 font-semibold text-[11px] uppercase tracking-wider">Serial / IMEI</p>
                  <p className="font-mono font-bold text-slate-900 text-xs mt-1">{ticket.device_serial || 'Không có'}</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <p className="text-emerald-700/80 font-semibold text-[11px] uppercase tracking-wider">Màu sắc</p>
                  <p className="font-bold text-slate-900 text-sm mt-1">{ticket.device_color || '---'}</p>
                </div>
              </div>

              <div className="p-3.5 bg-rose-50/90 border border-rose-200 border-l-4 border-l-rose-500 rounded-xl text-xs space-y-1">
                <p className="font-bold text-rose-900">Lỗi khách hàng mô tả:</p>
                <p className="text-rose-800 italic font-medium">{ticket.defect_description}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200 border-l-4 border-l-indigo-500">
                  <p className="font-bold text-indigo-950">Tình trạng lúc nhận:</p>
                  <p className="text-slate-700 mt-1 font-medium">{ticket.initial_condition || 'Bình thường'}</p>
                </div>
                <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200 border-l-4 border-l-violet-500">
                  <p className="font-bold text-violet-950">Ngoại quan:</p>
                  <p className="text-slate-700 mt-1 font-medium">{ticket.cosmetic_condition || 'Không trầy xước'}</p>
                </div>
              </div>

              <div className="p-3.5 bg-sky-50/50 rounded-xl border border-sky-200/80 border-l-4 border-l-sky-500 text-xs">
                <p className="font-bold text-sky-950">Phụ kiện đi kèm:</p>
                <p className="text-slate-800 mt-1 font-semibold">{ticket.accessories_included || 'Chỉ nhận thân máy'}</p>
              </div>

              {(ticket.has_device_password || ticket.device_password_hint) && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-700" />
                    <div>
                      <span className="font-semibold text-amber-900 block">Mật khẩu màn hình / BIOS (Bảo mật AES-256-GCM):</span>
                      <span className="text-[10px] text-amber-700">Chỉ Kỹ thuật viên & Quản lý được phép xem (Có lưu nhật ký Audit)</span>
                    </div>
                  </div>
                  {hasRole(['technician', 'manager', 'admin']) ? (
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-950 px-2.5 py-1 bg-amber-100/80 rounded border border-amber-300">
                        {isLoadingDevicePass
                          ? 'Đang giải mã...'
                          : showSecretPassword
                          ? decryptedDevicePass
                          : '••••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={handleToggleDevicePassword}
                        disabled={isLoadingDevicePass}
                        className="p-1.5 text-amber-800 hover:bg-amber-200/60 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
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
            <div className="bg-white p-6 rounded-2xl border border-slate-300/90 shadow-sm space-y-4 border-t-4 border-t-violet-600">
              <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-200">Lịch sử tiến độ xử lý</h3>
              <div className="space-y-3">
                {StorageService.getStatusHistories(ticket.id).map((h) => {
                  const toCfg = STATUS_CONFIG[h.to_status];
                  const fromCfg = h.from_status ? STATUS_CONFIG[h.from_status] : null;
                  return (
                    <div key={h.id} className="flex gap-3 text-xs p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/70">
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
                        <span className="text-[10px] text-slate-500 block">Thực hiện bởi: <strong className="text-slate-700">{h.changed_by_name}</strong></span>
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
            <div className="bg-white p-5 rounded-2xl border border-slate-300/90 shadow-sm space-y-3 border-t-4 border-t-indigo-500">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Phân công kỹ thuật</h3>
              </div>
              <p className="text-xs text-slate-600 font-medium">Kỹ thuật viên phụ trách chính thiết bị này:</p>
              <SearchableSelect
                options={techOptions}
                value={ticket.primary_technician_id || ''}
                onChange={(val) => handleAssignTech(Number(val))}
                placeholder="-- Chọn hoặc tìm kiếm KTV --"
                searchPlaceholder="Tìm theo tên hoặc SĐT..."
              />
            </div>

            {/* Financial Summary */}
            <div className="bg-white p-5 rounded-2xl border border-slate-300/90 shadow-sm space-y-3 border-t-4 border-t-emerald-500">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Tổng quan tài chính</h3>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100">
                  <span className="text-indigo-900 font-semibold">Tổng tiền dịch vụ:</span>
                  <span className="font-extrabold text-indigo-950 text-sm">{formatVND(ticket.final_amount)}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/70">
                  <span className="text-emerald-900 font-semibold">Đã thanh toán:</span>
                  <span className="font-extrabold text-emerald-700 text-sm">{formatVND(ticket.paid_amount)}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-rose-50 border border-rose-200 font-bold text-sm">
                  <span className="text-rose-700">Còn lại (Công nợ):</span>
                  <span className="text-rose-700 font-extrabold text-base">{formatVND(ticket.debt_amount)}</span>
                </div>
              </div>
            </div>

            {/* Public Lookup QR Card */}
            <div className="bg-gradient-to-b from-white to-indigo-50/60 p-5 rounded-2xl border border-indigo-200/80 shadow-sm text-center space-y-2.5">
              <p className="text-xs font-extrabold text-indigo-950 uppercase tracking-wide">QR Tra cứu khách hàng</p>
              <img src={getTicketQrUrl(ticket.ticket_code)} alt="QR Tra cứu" className="w-28 h-28 mx-auto bg-white border-2 border-indigo-200 p-1.5 rounded-xl shadow-sm" />
              <p className="text-[11px] text-indigo-700/80 font-medium">Khách có thể quét để xem trạng thái trên điện thoại</p>
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

          {!canEditDiagnostics && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs flex items-center justify-between text-amber-900 shadow-2xs">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Giới hạn quyền vai trò:</strong> Chức năng chẩn đoán hỏng hóc & giải pháp kỹ thuật do <strong>Kỹ thuật viên (KTV)</strong> hoặc <strong>Quản lý</strong> thực hiện. Tài khoản <strong className="underline">{ROLE_DISPLAY_NAMES[userRole]}</strong> đang xem ở chế độ Đọc.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsAdminOverride(true)}
                className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 text-[11px] font-bold rounded-lg shrink-0 cursor-pointer transition-colors"
              >
                Mở quyền tạm thời
              </button>
            </div>
          )}

          <form onSubmit={handleSaveDiagnostic} className={`p-4 bg-indigo-50/40 rounded-xl border border-indigo-100 space-y-4 ${!canEditDiagnostics ? 'opacity-70 pointer-events-none' : ''}`}>
            <h4 className="text-xs font-bold text-indigo-950 uppercase">+ Thêm chẩn đoán kỹ thuật mới</h4>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nguyên nhân gốc rễ (Root Cause) <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                disabled={!canEditDiagnostics}
                rows={2}
                placeholder="VD: Chập IC nguồn TPS51225, hoặc chết bóng LED màn hình..."
                value={rootCause}
                onChange={(e) => setRootCause(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phương án khắc phục đề xuất <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                disabled={!canEditDiagnostics}
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
              disabled={!canEditDiagnostics}
              className={`px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5 ${!canEditDiagnostics ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700 cursor-pointer'}`}
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
                    q.status === 'Approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : q.status === 'Rejected'
                      ? 'bg-rose-100 text-rose-800'
                      : q.status === 'Superseded'
                      ? 'bg-slate-200 text-slate-600'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {q.status === 'Approved'
                      ? 'Khách đã duyệt'
                      : q.status === 'Rejected'
                      ? 'Khách từ chối'
                      : q.status === 'Superseded'
                      ? 'Đã thay thế'
                      : 'Chờ khách duyệt'}
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
                      <td className="p-2 font-medium">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {it.item_type === 'part' ? (
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-bold text-[10px] uppercase border border-indigo-100 shrink-0 inline-flex items-center gap-1">
                              <Boxes className="w-3 h-3 text-indigo-500" /> Linh kiện
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded-md font-bold text-[10px] uppercase border border-amber-100 shrink-0 inline-flex items-center gap-1">
                              <Wrench className="w-3 h-3 text-amber-600" /> Công / Khác
                            </span>
                          )}
                          <span className="font-semibold text-slate-900">{it.name}</span>
                          {it.batch_code && (
                            <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded font-mono text-[10px] font-bold">
                              Lô: {it.batch_code}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-2 text-center font-bold text-slate-800">{it.quantity}</td>
                      <td className="p-2 text-right font-mono text-slate-600">{formatVND(it.unit_price)}</td>
                      <td className="p-2 text-right font-bold text-slate-900 font-mono">{formatVND(it.subtotal)}</td>
                      <td className="p-2 text-center text-slate-500 font-medium">{it.warranty_months} tháng</td>
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

              {q.status === 'Sent' && (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleApproveQuote(q.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Khách đồng ý sửa (Duyệt báo giá)
                  </button>
                  <button
                    onClick={async () => {
                      const reason = window.prompt('Lý do khách từ chối:');
                      if (!reason) return;
                      try {
                        await StorageService.updateQuoteStatusAsync(q.id, 'Rejected', undefined, reason);
                        reloadTicket();
                        showToast('Đã ghi nhận khách từ chối báo giá', 'success');
                      } catch (err: any) {
                        showToast(err.message || 'Lỗi khi từ chối báo giá', 'error');
                      }
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
          <form onSubmit={handleCreateQuote} className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-200/80 space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-indigo-200/60">
              <div>
                <h4 className="text-xs font-bold text-indigo-950 uppercase flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  + Lập bảng báo giá mới (Phiên bản {quotes.length + 1})
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Chọn linh kiện thực tế có sẵn từ kho hoặc tự nhập các chi phí sửa chữa / tiền công tùy chỉnh.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const firstPart = parts[0];
                    if (firstPart) {
                      const bList = StorageService.getBatches(firstPart.id);
                      const defaultB = bList.find((b) => b.remaining_quantity > 0) || bList[0];
                      setQuoteItems([
                        ...quoteItems,
                        {
                          type: 'part',
                          part_id: firstPart.id,
                          batch_id: defaultB?.id,
                          batch_code: defaultB?.batch_code,
                          name: firstPart.name,
                          qty: 1,
                          price: defaultB?.selling_price || firstPart.selling_price,
                          warranty: 6,
                        },
                      ]);
                    } else {
                      showToast('Không có linh kiện nào trong kho!', 'error');
                    }
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                >
                  <Boxes className="w-3.5 h-3.5" />
                  + Chọn LK từ Kho
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuoteItems([
                      ...quoteItems,
                      {
                        type: 'labor',
                        name: 'Công sửa chữa / Xử lý kỹ thuật',
                        qty: 1,
                        price: 250000,
                        warranty: 3,
                      },
                    ]);
                  }}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  + Thêm Tiền công / Khác
                </button>
              </div>
            </div>

            {/* Quick Part Insertion Dropdown */}
            <div className="p-3 bg-white rounded-xl border border-indigo-100 flex flex-col sm:flex-row items-end gap-2 text-xs">
              <div className="flex-1 w-full">
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                  Chọn nhanh linh kiện từ kho để chèn vào báo giá:
                </label>
                <SearchableSelect
                  options={partOptions}
                  value={quickQuotePartId}
                  onChange={(val) => setQuickQuotePartId(val ? Number(val) : '')}
                  placeholder="-- Chọn linh kiện kho sẵn có để thêm vào báo giá --"
                  searchPlaceholder="Tìm kiếm linh kiện theo tên, SKU..."
                  emptyMessage="Không có linh kiện phù hợp"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!quickQuotePartId) {
                    showToast('Vui lòng chọn linh kiện từ kho!', 'error');
                    return;
                  }
                  const part = parts.find((p) => p.id === Number(quickQuotePartId));
                  if (!part) return;
                  const bList = StorageService.getBatches(part.id);
                  const defaultB = bList.find((b) => b.remaining_quantity > 0) || bList[0];
                  setQuoteItems([
                    ...quoteItems,
                    {
                      type: 'part',
                      part_id: part.id,
                      batch_id: defaultB?.id,
                      batch_code: defaultB?.batch_code,
                      name: part.name,
                      qty: 1,
                      price: defaultB?.selling_price || part.selling_price,
                      warranty: 6,
                    },
                  ]);
                  showToast(`Đã chèn ${part.name} vào báo giá!`, 'success');
                  setQuickQuotePartId('');
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer shrink-0 transition-colors"
              >
                + Chèn vào báo giá
              </button>
            </div>

            {/* Items Builder Table */}
            <div className="space-y-2.5">
              <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-slate-500 uppercase px-2">
                <div className="col-span-2">Loại hạng mục</div>
                <div className="col-span-4">Nội dung chi tiết</div>
                <div className="col-span-1 text-center">SL</div>
                <div className="col-span-2 text-right">Đơn giá (VNĐ)</div>
                <div className="col-span-1 text-center">Bảo hành</div>
                <div className="col-span-2 text-right">Thành tiền / Xóa</div>
              </div>

              {quoteItems.map((item, idx) => {
                const isPart = item.type === 'part';
                const selectedPartObj = parts.find((p) => p.id === item.part_id);
                return (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-center p-2.5 bg-white rounded-xl border border-slate-200 text-xs shadow-2xs"
                  >
                    {/* Item Type Switcher */}
                    <div className="col-span-2">
                      <button
                        type="button"
                        onClick={() => {
                          const copy = [...quoteItems];
                          if (isPart) {
                            copy[idx].type = 'labor';
                            copy[idx].part_id = undefined;
                          } else {
                            copy[idx].type = 'part';
                            const firstPart = parts[0];
                            if (firstPart) {
                              copy[idx].part_id = firstPart.id;
                              copy[idx].name = firstPart.name;
                              copy[idx].price = firstPart.selling_price;
                            }
                          }
                          setQuoteItems(copy);
                        }}
                        className={`w-full py-1.5 px-2 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                          isPart
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                        title="Bấm để chuyển đổi giữa Linh kiện kho và Tiền công"
                      >
                        {isPart ? (
                          <>
                            <Boxes className="w-3 h-3 text-indigo-600" />
                            <span>LK Kho</span>
                          </>
                        ) : (
                          <>
                            <Wrench className="w-3 h-3 text-amber-600" />
                            <span>Công/Khác</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Item Details: Part Select OR Custom Text */}
                    <div className="col-span-4">
                      {isPart ? (
                        <div className="space-y-1">
                          <SearchableSelect
                            options={partOptions}
                            value={item.part_id || ''}
                            onChange={(val) => {
                              if (!val) return;
                              const pId = Number(val);
                              const targetPart = parts.find((p) => p.id === pId);
                              const copy = [...quoteItems];
                              if (targetPart) {
                                const bList = StorageService.getBatches(targetPart.id);
                                const defaultB = bList.find((b) => b.remaining_quantity > 0) || bList[0];
                                copy[idx].part_id = targetPart.id;
                                copy[idx].name = targetPart.name;
                                copy[idx].batch_id = defaultB?.id;
                                copy[idx].batch_code = defaultB?.batch_code;
                                copy[idx].price = defaultB?.selling_price || targetPart.selling_price;
                              }
                              setQuoteItems(copy);
                            }}
                            placeholder="-- Gõ SKU hoặc tên linh kiện kho --"
                            searchPlaceholder="Tìm tên, SKU, pin, màn hình..."
                            emptyMessage="Không tìm thấy linh kiện phù hợp"
                          />
                          {selectedPartObj && (() => {
                            const availableBatches = StorageService.getBatches(selectedPartObj.id);
                            return (
                              <div className="space-y-1 pt-0.5">
                                <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
                                  <span>SKU: <strong className="font-mono text-indigo-700">{selectedPartObj.sku}</strong></span>
                                  <span>Tồn: <strong className={selectedPartObj.stock_quantity <= selectedPartObj.min_stock_alert ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>{selectedPartObj.stock_quantity} cái</strong></span>
                                </div>

                                {availableBatches.length > 0 && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-bold text-purple-700 shrink-0">Đợt nhập:</span>
                                    <select
                                      value={item.batch_id || ''}
                                      onChange={(e) => {
                                        const bId = Number(e.target.value);
                                        const foundB = availableBatches.find((b) => b.id === bId);
                                        const copy = [...quoteItems];
                                        if (foundB) {
                                          copy[idx].batch_id = foundB.id;
                                          copy[idx].batch_code = foundB.batch_code;
                                          copy[idx].price = foundB.selling_price;
                                        } else {
                                          copy[idx].batch_id = undefined;
                                          copy[idx].batch_code = undefined;
                                        }
                                        setQuoteItems(copy);
                                      }}
                                      className="w-full text-[10px] font-mono font-semibold py-1 px-1.5 bg-purple-50/70 border border-purple-200 rounded-lg text-purple-900 focus:outline-hidden"
                                    >
                                      <option value="">-- Kho chung (Không chọn lô) --</option>
                                      {availableBatches.map((b) => (
                                        <option key={b.id} value={b.id}>
                                          [{b.batch_code}] Tồn: {b.remaining_quantity} | Giá: {formatVND(b.selling_price)} {b.supplier_name ? `| NCC: ${b.supplier_name}` : ''}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        <input
                          type="text"
                          placeholder="Nhập tên công việc / dịch vụ (VD: Sửa chập nguồn, Vệ sinh keo)..."
                          value={item.name}
                          onChange={(e) => {
                            const copy = [...quoteItems];
                            copy[idx].name = e.target.value;
                            setQuoteItems(copy);
                          }}
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:border-indigo-500 focus:outline-hidden"
                        />
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="col-span-1">
                      <NumberInput
                        placeholder="SL"
                        min={1}
                        value={item.qty}
                        onChange={(val) => {
                          const copy = [...quoteItems];
                          copy[idx].qty = Math.max(1, val);
                          setQuoteItems(copy);
                        }}
                        className="text-center font-bold"
                      />
                    </div>

                    {/* Price */}
                    <div className="col-span-2">
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

                    {/* Warranty Months */}
                    <div className="col-span-1">
                      <NumberInput
                        min={0}
                        max={36}
                        value={item.warranty}
                        onChange={(val) => {
                          const copy = [...quoteItems];
                          copy[idx].warranty = Math.max(0, val);
                          setQuoteItems(copy);
                        }}
                        className="text-center"
                        unit="th"
                      />
                    </div>

                    {/* Subtotal & Delete */}
                    <div className="col-span-2 flex items-center justify-between pl-2">
                      <span className="font-extrabold text-slate-900 text-xs font-mono">
                        {formatVND(item.price * item.qty)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuoteItems(quoteItems.filter((_, i) => i !== idx))}
                        className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        title="Xóa dòng này"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Boxes className="w-5 h-5 text-indigo-600" />
                Linh kiện & Vật tư sử dụng (UC-17)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Xuất kho linh kiện chính xác cho phiếu sửa chữa, ghi nhận KTV thực hiện, tự động trừ tồn kho & hỗ trợ hoàn trả kho.
              </p>
            </div>
            {/* Quick summary metrics */}
            <div className="flex items-center gap-4 text-xs">
              <div className="px-3 py-1.5 bg-indigo-50 rounded-xl border border-indigo-100">
                <span className="text-slate-500 font-medium">Linh kiện đã xuất: </span>
                <strong className="text-indigo-700 font-bold">
                  {partUsages.filter((u) => u.status === 'Used').reduce((acc, u) => acc + u.quantity, 0)} cái
                </strong>
              </div>
              <div className="px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="text-slate-500 font-medium">Tổng trị giá: </span>
                <strong className="text-emerald-700 font-extrabold">
                  {formatVND(
                    partUsages.filter((u) => u.status === 'Used').reduce((acc, u) => acc + u.selling_price * u.quantity, 0)
                  )}
                </strong>
              </div>
            </div>
          </div>

          {!canExportParts && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs flex items-center justify-between text-amber-900 shadow-2xs">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Giới hạn quyền vai trò:</strong> Thao tác chọn & xuất kho linh kiện do <strong>Kỹ thuật viên (KTV)</strong> hoặc <strong>Quản lý</strong> phụ trách. Bạn đang ở chế độ Đọc.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsAdminOverride(true)}
                className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 text-[11px] font-bold rounded-lg shrink-0 cursor-pointer transition-colors"
              >
                Mở quyền tạm thời
              </button>
            </div>
          )}

          {/* Fast Searchable Part Picker Bar */}
          <div className={`p-4 bg-indigo-50/60 rounded-2xl border border-indigo-200 text-xs space-y-3 ${!canExportParts ? 'opacity-60 pointer-events-none' : ''}`}>
            <h4 className="font-bold text-indigo-950 flex items-center gap-1.5 uppercase tracking-wide text-xs">
              <Boxes className="w-4 h-4 text-indigo-600" />
              Chọn linh kiện để xuất kho vào phiếu:
            </h4>
            <div className="flex flex-col md:flex-row items-end gap-3">
              <div className="flex-1 w-full">
                <SearchableSelect
                  options={partOptions}
                  value={selectedPartId}
                  disabled={!canExportParts}
                  onChange={(val) => setSelectedPartId(val ? Number(val) : '')}
                  placeholder="-- Gõ tên linh kiện hoặc mã SKU để tìm nhanh --"
                  searchPlaceholder="Tìm linh kiện, pin, màn hình, quạt, sạc, RAM, SSD..."
                  emptyMessage="Không tìm thấy linh kiện phù hợp trong kho"
                />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-28">
                  <NumberInput
                    min={1}
                    value={partExportQty}
                    onChange={(val) => setPartExportQty(Math.max(1, val))}
                    placeholder="Số lượng"
                    className="text-center font-bold"
                  />
                </div>
                <button
                  type="button"
                  disabled={!canExportParts}
                  onClick={() => {
                    if (!selectedPartId) {
                      showToast('Vui lòng chọn linh kiện cần xuất kho!', 'error');
                      return;
                    }
                    const part = parts.find((p) => p.id === Number(selectedPartId));
                    if (!part) return;
                    if (part.stock_quantity < partExportQty) {
                      showToast(`Không đủ tồn kho! Hiện tại chỉ còn ${part.stock_quantity} cái.`, 'error');
                      return;
                    }
                    const bList = StorageService.getBatches(part.id);
                    const defaultB = bList.find((b) => b.remaining_quantity > 0) || bList[0];
                    setExportModalBatchId(defaultB ? defaultB.id : '');
                    setExportingPart(part);
                    setExportModalQty(partExportQty);
                  }}
                  className={`px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5 whitespace-nowrap transition-all ${!canExportParts ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700 cursor-pointer'}`}
                >
                  <Plus className="w-4 h-4" />
                  Xác nhận xuất kho
                </button>
              </div>
            </div>
          </div>

          {/* Popular Fast Export Cards */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-3">
            <h4 className="font-bold text-slate-800 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Linh kiện kho sẵn có (Bấm để mở form xuất kho nhanh):
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {parts.map((p) => (
                <div
                  key={p.id}
                  className="p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition-all flex justify-between items-center"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-800 line-clamp-1">{p.name}</p>
                    <p className="text-slate-500 text-[11px]">
                      SKU: <span className="font-mono text-indigo-700 font-bold">{p.sku}</span>
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      Tồn:{' '}
                      <strong className={p.stock_quantity <= p.min_stock_alert ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                        {p.stock_quantity}
                      </strong>{' '}
                      — Giá: <span className="font-bold text-slate-900">{formatVND(p.selling_price)}</span>
                    </p>
                    {p.supplier_name && (
                      <p className="text-[10px] text-slate-400 truncate max-w-[180px]">
                        NCC: {p.supplier_name}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (p.stock_quantity <= 0) {
                        showToast(`Linh kiện ${p.name} hiện đã hết hàng trong kho!`, 'error');
                        return;
                      }
                      const bList = StorageService.getBatches(p.id);
                      const defaultB = bList.find((b) => b.remaining_quantity > 0) || bList[0];
                      setExportModalBatchId(defaultB ? defaultB.id : '');
                      setExportingPart(p);
                      setExportModalQty(1);
                    }}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shrink-0 ml-2 shadow-xs transition-colors cursor-pointer"
                  >
                    Xuất kho
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Table of Exported Parts attached to Ticket */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-emerald-600" />
                Danh sách linh kiện đã xuất cho phiếu sửa chữa này ({partUsages.length})
              </h4>
              {partUsages.length > 0 && (
                <span className="text-xs text-slate-500">
                  Tổng tiền linh kiện: <strong className="text-indigo-700 font-bold">{formatVND(partUsages.filter(u => u.status === 'Used').reduce((a, b) => a + (b.selling_price * b.quantity), 0))}</strong>
                </span>
              )}
            </div>

            {partUsages.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 space-y-2">
                <Boxes className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold">Chưa có linh kiện nào được xuất kho cho phiếu sửa chữa này.</p>
                <p className="text-[11px] text-slate-400">
                  Hãy chọn linh kiện từ bảng trên và nhấn nút "Xác nhận xuất kho" để ghi nhận.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                    <tr>
                      <th className="py-3 px-4">Mã SKU & Linh kiện</th>
                      <th className="py-3 px-4">Nhà cung cấp</th>
                      <th className="py-3 px-4 text-center">Số lượng</th>
                      <th className="py-3 px-4 text-right">Đơn giá xuất</th>
                      <th className="py-3 px-4 text-right">Thành tiền</th>
                      <th className="py-3 px-4">KTV thực hiện</th>
                      <th className="py-3 px-4">Thời gian xuất</th>
                      <th className="py-3 px-4 text-center">Trạng thái</th>
                      <th className="py-3 px-4 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {partUsages.map((usage) => {
                      const linkedPart = parts.find((p) => p.id === usage.part_id);
                      const suppName = linkedPart?.supplier_name || 'N/A';
                      const isReturned = usage.status === 'Returned';
                      return (
                        <tr key={usage.id} className={`hover:bg-slate-50 transition-colors ${isReturned ? 'bg-slate-50/60 opacity-70' : ''}`}>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono font-bold text-indigo-700">{usage.sku}</span>
                              {usage.batch_code && (
                                <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded font-mono text-[10px] font-bold">
                                  Lô: {usage.batch_code}
                                </span>
                              )}
                            </div>
                            <div className="font-semibold text-slate-800">{usage.part_name}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-600 text-[11px]">
                            <div className="flex items-center gap-1 font-medium">
                              <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[150px]">{suppName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center font-extrabold text-slate-900">{usage.quantity}</td>
                          <td className="py-3 px-4 text-right text-slate-600">{formatVND(usage.selling_price)}</td>
                          <td className={`py-3 px-4 text-right font-bold ${isReturned ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                            {formatVND(usage.selling_price * usage.quantity)}
                          </td>
                          <td className="py-3 px-4 text-slate-700 font-medium">{usage.technician_name}</td>
                          <td className="py-3 px-4 text-slate-500 text-[11px] font-mono">{formatDateTime(usage.created_at)}</td>
                          <td className="py-3 px-4 text-center">
                            {isReturned ? (
                              <span className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded-full font-bold text-[11px] inline-flex items-center gap-1">
                                <RotateCcw className="w-3 h-3" /> Đã hoàn trả kho
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[11px] inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đã xuất sử dụng
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {!isReturned && (
                              <button
                                type="button"
                                onClick={() => setReturningUsage(usage)}
                                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold rounded-xl text-xs flex items-center gap-1 mx-auto cursor-pointer transition-colors"
                                title="Hoàn trả linh kiện này về lại kho hàng"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                                Hoàn trả kho
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: Confirm Part Export (UC-17) */}
      {exportingPart && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Xác nhận Xuất kho Linh kiện</h3>
                  <p className="text-xs text-slate-500">Mã phiếu: {ticket.ticket_code}</p>
                </div>
              </div>
              <button
                onClick={() => setExportingPart(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Part Card Details */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-mono text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                    {exportingPart.sku}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-1">{exportingPart.name}</h4>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">
                  Tồn kho: {exportingPart.stock_quantity}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600 pt-2 border-t border-slate-200/60">
                <p>
                  Nhà cung cấp:{' '}
                  <strong className="text-slate-800 block truncate">{exportingPart.supplier_name || 'Công ty SG Parts'}</strong>
                </p>
                <p>
                  Đơn giá xuất:{' '}
                  <strong className="text-indigo-700 block text-sm">
                    {formatVND(
                      exportModalBatchId
                        ? StorageService.getBatches(exportingPart.id).find((b) => b.id === Number(exportModalBatchId))?.selling_price || exportingPart.selling_price
                        : exportingPart.selling_price
                    )}
                  </strong>
                </p>
              </div>
            </div>

            {/* Form controls */}
            <div className="space-y-3 text-xs">
              {/* Batch selection dropdown */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Chọn đợt nhập kho / lô hàng xuất <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] text-purple-700 font-semibold">Theo dõi lô đợt</span>
                </label>
                {(() => {
                  const partBatches = StorageService.getBatches(exportingPart.id);
                  if (partBatches.length === 0) {
                    return (
                      <div className="p-2 bg-slate-100 rounded-xl text-[11px] text-slate-500 italic">
                        Linh kiện này chưa phân đợt nhập riêng (Xuất trực tiếp từ kho chung).
                      </div>
                    );
                  }
                  return (
                    <select
                      value={exportModalBatchId}
                      onChange={(e) => {
                        const bId = Number(e.target.value);
                        setExportModalBatchId(bId || '');
                      }}
                      className="w-full px-3 py-2 bg-purple-50/70 border border-purple-200 font-mono text-xs font-semibold text-purple-950 rounded-xl focus:outline-hidden"
                    >
                      <option value="">-- Kho chung (Không chọn đợt) --</option>
                      {partBatches.map((b) => (
                        <option key={b.id} value={b.id} disabled={b.remaining_quantity <= 0}>
                          [{b.batch_code}] Còn: {b.remaining_quantity}/{b.import_quantity} cái | Giá: {formatVND(b.selling_price)} {b.supplier_name ? `| NCC: ${b.supplier_name}` : ''}
                        </option>
                      ))}
                    </select>
                  );
                })()}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Số lượng xuất <span className="text-rose-500">*</span>
                </label>
                <NumberInput
                  min={1}
                  max={exportingPart.stock_quantity}
                  value={exportModalQty}
                  onChange={(val) => setExportModalQty(Math.min(exportingPart.stock_quantity, Math.max(1, val)))}
                  unit="cái"
                  className="font-bold text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Kỹ thuật viên chịu trách nhiệm xuất <span className="text-rose-500">*</span>
                </label>
                <select
                  value={exportModalTech}
                  onChange={(e) => setExportModalTech(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:outline-hidden"
                >
                  {technicians.map((tech) => (
                    <option key={tech.id} value={tech.full_name}>
                      {tech.full_name} ({ROLE_DISPLAY_NAMES[tech.role] || tech.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Total Calculation */}
              <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Tổng thành tiền xuất kho:</span>
                <span className="font-extrabold text-indigo-700 text-base">
                  {formatVND(
                    (exportModalBatchId
                      ? StorageService.getBatches(exportingPart.id).find((b) => b.id === Number(exportModalBatchId))?.selling_price || exportingPart.selling_price
                      : exportingPart.selling_price) * exportModalQty
                  )}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setExportingPart(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (exportModalQty <= 0 || exportModalQty > exportingPart.stock_quantity) {
                    showToast(`Số lượng không hợp lệ! Tồn kho hiện có: ${exportingPart.stock_quantity}`, 'error');
                    return;
                  }
                  try {
                    const chosenBatch = exportModalBatchId
                      ? StorageService.getBatches(exportingPart.id).find((b) => b.id === Number(exportModalBatchId))
                      : undefined;

                    await StorageService.addPartUsageAsync({
                      ticket_id: ticketId,
                      part_id: exportingPart.id,
                      batch_id: chosenBatch?.id,
                      batch_code: chosenBatch?.batch_code,
                      part_name: exportingPart.name,
                      sku: exportingPart.sku,
                      quantity: exportModalQty,
                      cost_price: chosenBatch?.cost_price || exportingPart.cost_price,
                      selling_price: chosenBatch?.selling_price || exportingPart.selling_price,
                      technician_name: exportModalTech,
                    });
                    const bMsg = chosenBatch ? ` [Đợt ${chosenBatch.batch_code}]` : '';
                    showToast(`Đã xuất kho ${exportModalQty}x ${exportingPart.name}${bMsg} cho phiếu ${ticket.ticket_code}!`, 'success');
                    setExportingPart(null);
                    setExportModalBatchId('');
                    setExportModalQty(1);
                    setSelectedPartId('');
                    reloadPartUsages();
                  } catch (err: any) {
                    showToast(err.message || 'Lỗi khi xuất kho linh kiện', 'error');
                  }
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Xác nhận Xuất kho & Trừ tồn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Confirm Return Part to Stock (UC-17) */}
      {returningUsage && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Hoàn trả Linh kiện về Kho</h3>
                  <p className="text-xs text-slate-500">Khôi phục tồn kho tự động</p>
                </div>
              </div>
              <button
                onClick={() => setReturningUsage(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200 text-xs space-y-2">
              <p className="text-amber-950 font-semibold">
                Bạn có chắc chắn muốn hoàn trả linh kiện sau đây từ phiếu <strong className="font-mono">{ticket.ticket_code}</strong> về lại kho hàng?
              </p>
              <div className="pt-2 border-t border-amber-200/60 font-medium text-slate-800 space-y-1">
                <p>Mã SKU: <strong className="font-mono text-indigo-700">{returningUsage.sku}</strong></p>
                <p>Tên linh kiện: <strong>{returningUsage.part_name}</strong></p>
                <p>Số lượng hoàn trả: <strong className="text-amber-800 text-sm font-bold">+{returningUsage.quantity} cái</strong></p>
                <p>Giá trị hoàn trả: <strong>{formatVND(returningUsage.selling_price * returningUsage.quantity)}</strong></p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
              <p className="flex items-center gap-1.5 font-medium text-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                Tồn kho của linh kiện này sẽ được tự động cộng thêm +{returningUsage.quantity} cái.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setReturningUsage(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await StorageService.returnPartUsageAsync(returningUsage.id, currentUser?.full_name || 'KTV');
                    showToast(`Đã hoàn trả ${returningUsage.quantity}x ${returningUsage.part_name} về kho thành công!`, 'success');
                    setReturningUsage(null);
                    reloadPartUsages();
                  } catch (err: any) {
                    showToast(err.message || 'Lỗi khi hoàn trả linh kiện', 'error');
                  }
                }}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md shadow-amber-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Xác nhận Hoàn trả Kho
              </button>
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
              disabled={!canPerformQC}
              className={`px-4 py-2 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5 ${!canPerformQC ? 'bg-slate-300 opacity-60 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'}`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Lưu & Xác nhận ĐẠT QC
            </button>
          </div>

          {!canPerformQC && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs flex items-center justify-between text-amber-900 shadow-2xs">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Giới hạn quyền vai trò:</strong> Quy trình kiểm tra chất lượng QC 8 điểm do <strong>KTV Kiểm chuẩn</strong> hoặc <strong>Quản lý</strong> thực hiện. Bạn đang ở chế độ Đọc.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsAdminOverride(true)}
                className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 text-[11px] font-bold rounded-lg shrink-0 cursor-pointer transition-colors"
              >
                Mở quyền tạm thời
              </button>
            </div>
          )}

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
        <div className="space-y-4">
          {!canProcessPayments && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs flex items-center justify-between text-amber-900 shadow-2xs">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Giới hạn quyền vai trò:</strong> Thao tác ghi nhận thu tiền mặt, áp dụng Mã giảm giá/Voucher và quẹt thẻ SmartPOS do <strong>Bộ phận Lễ tân & Thu ngân</strong> phụ trách. Bạn đang ở chế độ Đọc.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsAdminOverride(true)}
                className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 text-[11px] font-bold rounded-lg shrink-0 cursor-pointer transition-colors"
              >
                Mở quyền tạm thời
              </button>
            </div>
          )}

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

          {!canCompleteDelivery && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs flex items-center justify-between text-amber-900 shadow-2xs">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Giới hạn quyền vai trò:</strong> Xác nhận hoàn tất bàn giao thiết bị & kích hoạt tem bảo hành do <strong>Bộ phận Lễ tân & Thu ngân</strong> thực hiện khi trả máy cho khách. Bạn đang ở chế độ Đọc.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsAdminOverride(true)}
                className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 text-[11px] font-bold rounded-lg shrink-0 cursor-pointer transition-colors"
              >
                Mở quyền tạm thời
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Họ tên người nhận máy <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Số điện thoại người nhận <span className="text-rose-500">*</span>
              </label>
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
            disabled={!canCompleteDelivery}
            className={`px-6 py-3 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 transition-all text-xs ${!canCompleteDelivery ? 'bg-slate-300 opacity-60 cursor-not-allowed shadow-none' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30 cursor-pointer'}`}
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
