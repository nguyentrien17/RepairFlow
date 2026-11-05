import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  CreditCard,
  FileText,
  Clock,
  ArrowRight,
  X,
  Lock,
} from 'lucide-react';
import { RepairTicket, RepairStatus, User } from '../../types';
import { STATUS_CONFIG } from '../../utils/formatters';
import { StorageService } from '../../services/mockStorage';
import { SearchableSelect } from '../common/SearchableSelect';

import {
  isTransitionAllowedForRole,
  ROLE_DISPLAY_NAMES,
} from '../../utils/statusTransitions';

interface StatusTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: RepairTicket;
  targetStatus: RepairStatus;
  currentUser: User | null;
  technicians: User[];
  isOverrideMode?: boolean;
  onConfirm: (data: {
    targetStatus: RepairStatus;
    notes: string;
    assignedTechId?: number;
    debtApproved?: boolean;
    cancellationReason?: string;
    returnCondition?: string;
  }) => void;
}

export const StatusTransitionModal: React.FC<StatusTransitionModalProps> = ({
  isOpen,
  onClose,
  ticket,
  targetStatus,
  currentUser,
  technicians,
  isOverrideMode = false,
  onConfirm,
}) => {
  // Local state
  const [notes, setNotes] = useState('');
  const [isCommitted, setIsCommitted] = useState(false);
  const [selectedTechId, setSelectedTechId] = useState<number | ''>(
    ticket.primary_technician_id || ''
  );
  const [debtApproved, setDebtApproved] = useState(false);
  const [debtApprovalReason, setDebtApprovalReason] = useState('');
  const [cancellationReason, setCancellationReason] = useState(
    ticket.cancellation_reason || ''
  );
  const [returnCondition, setReturnCondition] = useState('Đã lắp ráp hoàn chỉnh nguyên trạng lúc nhận');
  const [phoneApprovalConfirm, setPhoneApprovalConfirm] = useState(false);
  const [qcConfirmed, setQcConfirmed] = useState(false);

  // Sync ticket info when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedTechId(ticket.primary_technician_id || '');
      setNotes('');
      setIsCommitted(false);
      setDebtApproved(false);
      setDebtApprovalReason('');
      setPhoneApprovalConfirm(false);
      setQcConfirmed(false);
      setCancellationReason('');
    }
  }, [isOpen, ticket, targetStatus]);

  if (!isOpen) return null;

  const currentCfg = STATUS_CONFIG[ticket.status];
  const targetCfg = STATUS_CONFIG[targetStatus];

  // Fetch current ticket context
  const diagnostics = StorageService.getDiagnostics(ticket.id);
  const quotes = StorageService.getQuotes(ticket.id);
  const approvedQuotes = quotes.filter((q) => q.status === 'Approved');
  const existingChecklist = StorageService.getChecklist(ticket.id);
  const isQcPassed = Boolean(existingChecklist?.is_passed);

  // Role permissions check
  const userRole = (currentUser?.role || 'receptionist').toLowerCase();
  const isAdminOrManager = userRole === 'admin' || userRole === 'manager';
  const isTech = userRole === 'technician';
  const isReceptionist = userRole === 'receptionist';

  // Evaluate prerequisites for targetStatus
  const evaluation = useMemo(() => {
    const blockers: string[] = [];
    const warnings: string[] = [];
    const checks: { label: string; passed: boolean; detail?: string }[] = [];

    // 0. Role Permission Check
    const roleValidation = isTransitionAllowedForRole(
      ticket.status,
      targetStatus,
      userRole as any,
      isOverrideMode
    );
    checks.push({
      label: `Phân quyền nghiệp vụ (${ROLE_DISPLAY_NAMES[userRole as keyof typeof ROLE_DISPLAY_NAMES] || userRole})`,
      passed: roleValidation.allowed,
      detail: roleValidation.allowed
        ? isOverrideMode
          ? 'Quản trị viên đã bật chế độ can thiệp toàn quyền'
          : `Tài khoản ${currentUser?.full_name || ''} có thẩm quyền chuyển sang ${targetCfg.label}`
        : roleValidation.reason,
    });
    if (!roleValidation.allowed) {
      blockers.push(roleValidation.reason || 'Vai trò của bạn không có thẩm quyền chuyển sang trạng thái này');
    }

    // 1. Target: Diagnosing
    if (targetStatus === 'Diagnosing') {
      const hasTech = Boolean(selectedTechId || ticket.primary_technician_id);
      checks.push({
        label: 'Đã phân công Kỹ thuật viên phụ trách kiểm tra',
        passed: hasTech,
        detail: hasTech ? 'Kỹ thuật viên đã sẵn sàng' : 'Cần chọn kỹ thuật viên bên dưới',
      });
      if (!hasTech) blockers.push('Chưa phân công Kỹ thuật viên chịu trách nhiệm chẩn đoán');
    }

    // 2. Target: Waiting_Approval
    if (targetStatus === 'Waiting_Approval') {
      const hasDiagOrQuote = diagnostics.length > 0 || quotes.length > 0;
      checks.push({
        label: 'Có kết quả chẩn đoán kỹ thuật hoặc bảng báo giá sơ bộ',
        passed: hasDiagOrQuote,
        detail: hasDiagOrQuote
          ? `Đã có ${diagnostics.length} phiếu chẩn đoán & ${quotes.length} báo giá`
          : 'Cần có ít nhất 1 chẩn đoán kỹ thuật hoặc báo giá chi tiết',
      });
      if (!hasDiagOrQuote) {
        blockers.push('Thiếu biên bản chẩn đoán kỹ thuật hoặc bảng báo giá để gửi khách');
      }
    }

    // 3. Target: In_Progress (Đang sửa chữa)
    if (targetStatus === 'In_Progress') {
      const hasTech = Boolean(selectedTechId || ticket.primary_technician_id);
      checks.push({
        label: 'Kỹ thuật viên phụ trách sửa chữa',
        passed: hasTech,
        detail: hasTech ? 'KTV đã nhận bàn giao thiết bị' : 'Chưa có KTV phụ trách',
      });
      if (!hasTech) blockers.push('Cần chỉ định Kỹ thuật viên tiến hành sửa chữa');

      const isApproved = approvedQuotes.length > 0 || phoneApprovalConfirm;
      checks.push({
        label: 'Khách hàng chấp thuận sửa chữa & đồng ý chi phí',
        passed: isApproved,
        detail: approvedQuotes.length > 0
          ? `Báo giá ${approvedQuotes[0].quote_code} đã được duyệt`
          : phoneApprovalConfirm
          ? 'Xác nhận khách đã đồng ý qua điện thoại/Zalo'
          : 'Khách chưa duyệt báo giá chính thức trên hệ thống',
      });
      if (!isApproved) {
        blockers.push('Khách hàng chưa duyệt báo giá sửa chữa hoặc chưa có xác nhận chấp thuận');
      }
    }

    // 4. Target: Quality_Check (Kiểm tra chất lượng - QC)
    if (targetStatus === 'Quality_Check') {
      checks.push({
        label: 'Kỹ thuật viên hoàn tất sửa chữa và bàn giao sang bộ phận QC',
        passed: true,
        detail: 'Yêu cầu KTV ghi rõ linh kiện đã thay và kết quả xử lý trong phần ghi chú',
      });
    }

    // 5. Target: Ready_For_Pickup (Chờ khách nhận)
    if (targetStatus === 'Ready_For_Pickup') {
      const hasPassedQC = isQcPassed || qcConfirmed;
      checks.push({
        label: 'Kiểm định chất lượng QC (Quality Check) đạt chuẩn',
        passed: hasPassedQC,
        detail: isQcPassed
          ? 'Checklist kiểm tra 12 hạng mục đạt tiêu chuẩn (Passed)'
          : qcConfirmed
          ? 'Đã kiểm tra nhanh các chức năng hoạt động bình thường'
          : 'Chưa có checklist QC Passed',
      });
      if (!hasPassedQC) {
        blockers.push('Thiết bị chưa qua kiểm tra chất lượng đạt chuẩn (QC Passed)');
      }
    }

    // 6. Target: Delivered (Đã bàn giao)
    if (targetStatus === 'Delivered') {
      const isPaid = ticket.debt_amount <= 0;
      const isDebtValid = isPaid || debtApproved;

      checks.push({
        label: 'Tình trạng thanh toán & Công nợ',
        passed: isDebtValid,
        detail: isPaid
          ? 'Đã thanh toán 100% chi phí'
          : debtApproved
          ? `Đã duyệt cho nợ: ${ticket.debt_amount.toLocaleString()} đ (Lý do: ${debtApprovalReason || 'Khách quen/Hợp đồng'})`
          : `Còn nợ: ${ticket.debt_amount.toLocaleString()} đ. Cần thu đủ hoặc Quản lý duyệt công nợ`,
      });

      if (!isDebtValid) {
        blockers.push(`Còn nợ ${ticket.debt_amount.toLocaleString()} đ chưa được duyệt cho nợ`);
      }
    }

    // 7. Target: Cancelled (Hủy phiếu)
    if (targetStatus === 'Cancelled') {
      const hasReason = cancellationReason.trim().length >= 5;
      checks.push({
        label: 'Lý do hủy và phương án xử lý hoàn trả máy',
        passed: hasReason,
        detail: hasReason ? 'Đã nhập lý do hủy' : 'Bắt buộc nhập lý do hủy chi tiết (tối thiểu 5 ký tự)',
      });
      if (!hasReason) {
        blockers.push('Bắt buộc nhập rõ nguyên nhân hủy phiếu sửa chữa');
      }
    }

    return { blockers, warnings, checks };
  }, [
    targetStatus,
    ticket,
    selectedTechId,
    diagnostics,
    quotes,
    approvedQuotes,
    isQcPassed,
    phoneApprovalConfirm,
    qcConfirmed,
    debtApproved,
    debtApprovalReason,
    cancellationReason,
    userRole,
    currentUser,
    isOverrideMode,
    targetCfg.label,
  ]);

  const canSubmit =
    evaluation.blockers.length === 0 &&
    isCommitted &&
    notes.trim().length >= 5;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    onConfirm({
      targetStatus,
      notes: notes.trim(),
      assignedTechId: selectedTechId ? Number(selectedTechId) : undefined,
      debtApproved,
      cancellationReason: cancellationReason.trim() || undefined,
      returnCondition: targetStatus === 'Cancelled' ? returnCondition.trim() : undefined,
    });
  };

  const techOptions = technicians.map((t) => ({
    value: t.id,
    label: t.full_name,
    sublabel: `SĐT: ${t.phone} • ${t.role}`,
    badge: t.is_active ? 'Sẵn sàng' : 'Vắng',
    badgeColor: t.is_active
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-slate-100 text-slate-500',
  }));

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <ShieldCheck className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">Xác nhận trách nhiệm chuyển trạng thái</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/30 text-indigo-200 font-mono">
                  {ticket.ticket_code}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Thiết bị: <strong className="text-white">{ticket.device_model}</strong> — Khách hàng: {ticket.customer_name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Transition Visualizer */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
            <div className="flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Trạng thái hiện tại
              </span>
              <span className={`inline-flex text-xs px-2.5 py-1 rounded-xl font-bold border ${currentCfg.bg} ${currentCfg.text} ${currentCfg.border}`}>
                {currentCfg.label}
              </span>
            </div>

            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-200">
              <ArrowRight className="w-4 h-4" />
            </div>

            <div className="flex-1 text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Trạng thái chuyển đến
              </span>
              <span className={`inline-flex text-xs px-2.5 py-1 rounded-xl font-bold border ${targetCfg.bg} ${targetCfg.text} ${targetCfg.border}`}>
                {targetCfg.label}
              </span>
            </div>
          </div>

          {/* Section 1: Process Prerequisites & Constraints */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                1. Kiểm tra ràng buộc & Điều kiện tiên quyết
              </h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                evaluation.blockers.length === 0
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {evaluation.blockers.length === 0 ? 'Đủ điều kiện chuyển' : `Còn ${evaluation.blockers.length} ràng buộc`}
              </span>
            </div>

            <div className="space-y-2">
              {evaluation.checks.map((c, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                    c.passed
                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                      : 'bg-rose-50/50 border-rose-200 text-rose-950'
                  }`}
                >
                  {c.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">{c.label}</p>
                    {c.detail && <p className="text-[11px] opacity-80 mt-0.5">{c.detail}</p>}
                  </div>
                </div>
              ))}
            </div>

            {/* Dynamic Inline Resolvers for Missing Prerequisites */}
            {(targetStatus === 'Diagnosing' || targetStatus === 'In_Progress') && !ticket.primary_technician_id && (
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200 space-y-2">
                <label className="block text-xs font-bold text-indigo-950">
                  Chỉ định Kỹ thuật viên phụ trách ngay:
                </label>
                <SearchableSelect
                  options={techOptions}
                  value={selectedTechId}
                  onChange={(val) => setSelectedTechId(val ? Number(val) : '')}
                  placeholder="-- Tìm và chọn kỹ thuật viên --"
                  searchPlaceholder="Nhập tên kỹ thuật viên..."
                />
              </div>
            )}

            {targetStatus === 'In_Progress' && approvedQuotes.length === 0 && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-2">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  Chưa có báo giá được duyệt chính thức qua hệ thống.
                </p>
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                  <input
                    type="checkbox"
                    checked={phoneApprovalConfirm}
                    onChange={(e) => setPhoneApprovalConfirm(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Khách hàng đã xác nhận đồng ý chi phí qua Điện thoại / Zalo / Trực tiếp</span>
                </label>
              </div>
            )}

            {targetStatus === 'Ready_For_Pickup' && !isQcPassed && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-2">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  Chưa có phiếu QC Checklist chính thức đạt tiêu chuẩn.
                </p>
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                  <input
                    type="checkbox"
                    checked={qcConfirmed}
                    onChange={(e) => setQcConfirmed(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Tôi đã kiểm tra máy thực tế: nguồn, màn hình, cảm ứng, âm thanh, sạc pin đều tốt 100%</span>
                </label>
              </div>
            )}

            {targetStatus === 'Delivered' && ticket.debt_amount > 0 && (
              <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-950 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5 text-rose-800">
                    <CreditCard className="w-4 h-4" />
                    Thiết bị còn nợ tiền: {ticket.debt_amount.toLocaleString()} đ
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-200 text-rose-800 font-bold">
                    Chưa thanh toán đủ
                  </span>
                </div>
                <p className="text-[11px] text-rose-700">
                  Theo quy định, thiết bị phải được thu tiền 100% trước khi bàn giao, trừ khi có phê duyệt nợ của Quản lý.
                </p>

                <div className="pt-1 border-t border-rose-200/60 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={debtApproved}
                      onChange={(e) => setDebtApproved(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Quản lý / Người có thẩm quyền phê duyệt cho khách nợ và bàn giao máy</span>
                  </label>

                  {debtApproved && (
                    <input
                      type="text"
                      placeholder="Lý do duyệt nợ (VD: Khách hàng VinaTech thanh toán chuyển khoản theo tháng...)"
                      value={debtApprovalReason}
                      onChange={(e) => setDebtApprovalReason(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-rose-300 rounded-lg text-xs"
                      required
                    />
                  )}
                </div>
              </div>
            )}

            {targetStatus === 'Cancelled' && (
              <div className="p-3.5 bg-slate-100 rounded-xl border border-slate-200 space-y-2.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Lý do hủy phiếu sửa chữa <span className="text-rose-500">*</span> (Bắt buộc)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Khách chê giá cao, không có linh kiện thay thế, máy hỏng mainboard..."
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Tình trạng thiết bị khi hoàn trả cho khách
                  </label>
                  <input
                    type="text"
                    value={returnCondition}
                    onChange={(e) => setReturnCondition(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Accountability Sign-Off */}
          <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100 space-y-3.5">
            <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5 uppercase tracking-wide">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              2. Xác nhận trách nhiệm cá nhân & Ký duyệt
            </h4>

            <div className="grid grid-cols-2 gap-3 text-xs bg-white p-3 rounded-xl border border-indigo-100">
              <div>
                <span className="text-[10px] text-slate-400 block">Người thực hiện</span>
                <span className="font-bold text-slate-900">{currentUser?.full_name || 'Nhân viên'}</span>
                <span className="text-[11px] text-indigo-600 ml-1">({userRole})</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Thời gian xác nhận</span>
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {new Date().toLocaleString('vi-VN')}
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                <label className="block text-xs font-bold text-slate-800">
                  Ghi chú & Nội dung công việc thực hiện <span className="text-rose-500">*</span> (Tối thiểu 5 ký tự)
                </label>
                <button
                  type="button"
                  onClick={() => setNotes(`Xác nhận chuyển sang giai đoạn ${targetCfg.label}`)}
                  className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 cursor-pointer transition-colors"
                >
                  + Mẫu: Chuyển sang {targetCfg.label}
                </button>
              </div>
              <textarea
                required
                rows={2}
                placeholder={`VD: Xác nhận chuyển trạng thái sang "${targetCfg.label}", đã đối soát thông tin thiết bị...`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:bg-white focus:border-indigo-500 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-400 block text-right">
                {notes.trim().length}/5 ký tự tối thiểu
              </span>
            </div>

            {/* Responsibility Checkbox */}
            <label className="flex items-start gap-2.5 cursor-pointer p-3 bg-white rounded-xl border border-indigo-200/80 hover:bg-indigo-50/20 transition-colors">
              <input
                type="checkbox"
                required
                checked={isCommitted}
                onChange={(e) => setIsCommitted(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs font-semibold text-slate-800">
                Tôi ({currentUser?.full_name || 'Người dùng'}) cam kết chịu trách nhiệm cá nhân về tính xác thực của việc chuyển sang trạng thái "{targetCfg.label}" theo đúng quy chuẩn kỹ thuật và quy định của cửa hàng.
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all ${
                canSubmit
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/25 cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Xác nhận & Ký duyệt chuyển trạng thái
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
