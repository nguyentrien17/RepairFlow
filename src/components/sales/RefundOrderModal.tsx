import React, { useState } from 'react';
import { RetailSaleOrder } from '../../types';
import { StorageService } from '../../services/mockStorage';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { CurrencyInput } from '../common/CurrencyInput';
import { formatVND, formatDateTime } from '../../utils/formatters';
import { Undo2, X, AlertTriangle, Boxes, ShieldAlert, Clock, CheckCircle2 } from 'lucide-react';

interface RefundOrderModalProps {
  order: RetailSaleOrder;
  onClose: () => void;
  onRefundSuccess: (updatedOrder: RetailSaleOrder) => void;
}

export const RefundOrderModal: React.FC<RefundOrderModalProps> = ({
  order,
  onClose,
  onRefundSuccess,
}) => {
  const { showToast } = useToast();
  const { currentUser, hasRole } = useAuth();
  const settings = StorageService.getSettings();

  // Store return window policy timeframe from frozen order snapshot (or settings fallback)
  const returnPolicyDays = order.return_days ?? settings.default_return_days ?? 15;

  // Calculate elapsed days since invoice issuance
  const createdTime = new Date(order.created_at).getTime();
  const nowTime = Date.now();
  const elapsedMs = Math.max(0, nowTime - createdTime);
  const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
  const isOverdueReturn = elapsedDays > returnPolicyDays;

  // Maximum allowed refund amount (cannot exceed actual paid amount or order final amount)
  const maxRefundAllowed = Math.max(0, order.paid_amount || order.final_amount);

  const [refundReasonType, setRefundReasonType] = useState<string>('Khách thay đổi nhu cầu');
  const [customReason, setCustomReason] = useState<string>('');
  const [refundAmount, setRefundAmount] = useState<number>(maxRefundAllowed);
  const [returnStock, setReturnStock] = useState<boolean>(true);
  const [managerApproved, setManagerApproved] = useState<boolean>(hasRole(['admin', 'manager']));

  const finalReason = refundReasonType === 'Khác' ? customReason.trim() : refundReasonType;
  const isExceedingMax = refundAmount > maxRefundAllowed;
  const isBlockedDueToOverdue = isOverdueReturn && !managerApproved;

  const handleAmountChange = (val: number) => {
    if (val > maxRefundAllowed) {
      showToast(`Số tiền hoàn trả tối đa không được vượt quá thực thu (${formatVND(maxRefundAllowed)})!`, 'error');
      setRefundAmount(maxRefundAllowed);
    } else {
      setRefundAmount(Math.max(0, val));
    }
  };

  const handleProcessRefund = (e: React.FormEvent) => {
    e.preventDefault();

    if (isBlockedDueToOverdue) {
      showToast(`Hóa đơn đã xuất cách đây ${elapsedDays} ngày (vượt quá ${returnPolicyDays} ngày quy định). Cần sự phê duyệt từ Quản lý!`, 'error');
      return;
    }

    if (!finalReason) {
      showToast('Vui lòng nhập lý do trả hàng / hoàn tiền!', 'error');
      return;
    }

    if (refundAmount < 0) {
      showToast('Số tiền hoàn trả không hợp lệ (phải >= 0 đ)!', 'error');
      return;
    }

    if (refundAmount > maxRefundAllowed) {
      showToast(`Số tiền hoàn trả (${formatVND(refundAmount)}) không được vượt quá số tiền thực thu của hóa đơn (${formatVND(maxRefundAllowed)})!`, 'error');
      setRefundAmount(maxRefundAllowed);
      return;
    }

    try {
      const fullReasonWithTimeframe = isOverdueReturn
        ? `${finalReason} (Duyệt đổi trả quá hạn ${elapsedDays}/${returnPolicyDays} ngày bởi ${currentUser?.full_name})`
        : finalReason;

      const updated = StorageService.refundRetailOrder(order.id, {
        refundReason: fullReasonWithTimeframe,
        refundAmount: refundAmount,
        returnStockToInventory: returnStock,
        refundedByName: currentUser?.full_name || 'Lễ tân / Thu ngân',
      });

      showToast(`Đã xử lý hoàn trả hóa đơn ${order.order_code} thành công!`, 'success');
      onRefundSuccess(updated);
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xử lý hoàn trả hóa đơn', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-rose-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-600/30 text-rose-300 rounded-xl border border-rose-500/30">
              <Undo2 className="w-5 h-5 text-rose-300" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Trả Hàng & Hoàn Tiền Hóa Đơn</h3>
              <p className="text-xs text-rose-200 font-mono">Mã HD: {order.order_code}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-rose-300 hover:text-white p-1 rounded-lg hover:bg-rose-900/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleProcessRefund} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          {/* Order Brief Box */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Khách hàng mua:</span>
              <span className="font-bold text-slate-900">{order.customer_name} ({order.customer_phone})</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Ngày xuất hóa đơn:</span>
              <span className="text-slate-700">{formatDateTime(order.created_at)}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-200 font-bold">
              <span className="text-slate-700">Tổng hóa đơn:</span>
              <span className="text-indigo-700 font-mono text-sm">{formatVND(order.final_amount)}</span>
            </div>
            <div className="flex justify-between items-center text-emerald-700 font-bold">
              <span>Đã thu thực tế (Mức hoàn tối đa):</span>
              <span className="font-mono text-sm">{formatVND(maxRefundAllowed)}</span>
            </div>
          </div>

          {/* Timeframe Policy Constraint Status Banner */}
          <div className={`p-3 rounded-xl border space-y-1 ${
            isOverdueReturn
              ? 'bg-amber-50 border-amber-300 text-amber-900'
              : 'bg-emerald-50 border-emerald-300 text-emerald-900'
          }`}>
            <div className="flex items-center justify-between font-bold">
              <div className="flex items-center gap-1.5">
                <Clock className={`w-4 h-4 ${isOverdueReturn ? 'text-amber-600' : 'text-emerald-600'}`} />
                <span>Thời hạn đổi trả quy định cửa hàng: {returnPolicyDays} ngày</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                isOverdueReturn ? 'bg-amber-200 text-amber-900' : 'bg-emerald-200 text-emerald-900'
              }`}>
                {isOverdueReturn ? 'Đã quá hạn' : 'Trong thời hạn'}
              </span>
            </div>

            <p className="text-[11px] leading-relaxed">
              {isOverdueReturn ? (
                <>
                  Hóa đơn này được tạo cách đây <strong className="text-amber-950 font-mono">{elapsedDays} ngày</strong> (vượt quá {returnPolicyDays} ngày quy định đổi trả). Cần sự đồng ý/phê duyệt của Quản lý cửa hàng.
                </>
              ) : (
                <>
                  Hóa đơn mới tạo cách đây <strong className="text-emerald-950 font-mono">{elapsedDays === 0 ? 'hôm nay (dưới 24h)' : `${elapsedDays} ngày`}</strong>, nằm hoàn toàn trong thời hạn cho phép đổi trả ({returnPolicyDays} ngày).
                </>
              )}
            </p>

            {/* Overdue Manager Approval Override Checkbox */}
            {isOverdueReturn && (
              <div className="pt-2 border-t border-amber-200">
                <label className="flex items-center gap-2 cursor-pointer select-none font-bold text-amber-950">
                  <input
                    type="checkbox"
                    checked={managerApproved}
                    onChange={(e) => setManagerApproved(e.target.checked)}
                    className="rounded border-amber-400 text-amber-700 focus:ring-amber-500"
                  />
                  <span>Xác nhận đã được Quản lý / Chủ cửa hàng duyệt ngoại lệ</span>
                </label>
              </div>
            )}
          </div>

          {/* Refund Reason Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Lý do trả hàng / Hoàn tiền <span className="text-rose-500">*</span>
            </label>
            <select
              value={refundReasonType}
              onChange={(e) => setRefundReasonType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs focus:bg-white focus:border-rose-500 focus:outline-hidden"
            >
              <option value="Khách thay đổi nhu cầu">Khách thay đổi nhu cầu / Đổi ý không mua nữa</option>
              <option value="Sản phẩm lỗi kỹ thuật / Bảo hành">Sản phẩm bị lỗi kỹ thuật / Bảo hành đổi mới</option>
              <option value="Giao sai mã linh kiện / Sai thông số">Giao sai mã linh kiện / Sai thông số máy</option>
              <option value="Không còn hàng thay thế">Không còn linh kiện thay thế phù hợp</option>
              <option value="Khác">Lý do khác (Tự nhập chi tiết)...</option>
            </select>

            {refundReasonType === 'Khác' && (
              <input
                type="text"
                required
                placeholder="Nhập lý do cụ thể..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full mt-2 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white focus:border-rose-500 focus:outline-hidden"
              />
            )}
          </div>

          {/* Refund Amount Input & Strict Constraints */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-slate-800">
                Số tiền hoàn trả cho khách (đ) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] font-bold text-rose-700 font-mono">
                Tối đa: {formatVND(maxRefundAllowed)}
              </span>
            </div>

            <CurrencyInput
              value={refundAmount}
              onChange={(val) => handleAmountChange(val)}
              min={0}
              max={maxRefundAllowed}
              clampToMax={true}
              placeholder={`Tối đa ${formatVND(maxRefundAllowed)}`}
              className="font-extrabold text-sm text-rose-700 font-mono"
            />

            {/* Quick Percentage Presets */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-500 font-bold shrink-0">Chọn nhanh:</span>
              <button
                type="button"
                onClick={() => setRefundAmount(maxRefundAllowed)}
                className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 cursor-pointer transition-colors"
              >
                Hoàn 100% ({formatVND(maxRefundAllowed)})
              </button>
              <button
                type="button"
                onClick={() => setRefundAmount(Math.round(maxRefundAllowed * 0.9))}
                className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 cursor-pointer transition-colors"
              >
                Hoàn 90% (-10% phí)
              </button>
              <button
                type="button"
                onClick={() => setRefundAmount(Math.round(maxRefundAllowed * 0.8))}
                className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 cursor-pointer transition-colors"
              >
                Hoàn 80% (-20% phí)
              </button>
            </div>
          </div>

          {/* Revert Inventory Option */}
          <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 space-y-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={returnStock}
                onChange={(e) => setReturnStock(e.target.checked)}
                className="rounded border-amber-400 text-amber-600 focus:ring-amber-500"
              />
              <span className="font-bold text-amber-950 flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-amber-600" />
                <span>Cộng trả lại tồn kho linh kiện / lô nhập</span>
              </span>
            </label>
            <p className="text-[10px] text-amber-800 pl-6">
              Khi chọn mục này, hệ thống sẽ tự động tăng số lượng tồn kho của các linh kiện/mặt hàng trong đơn trả lại ban đầu.
            </p>
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isBlockedDueToOverdue || isExceedingMax}
              className={`px-5 py-2 text-white text-xs font-extrabold rounded-xl shadow-md flex items-center gap-1.5 transition-all ${
                isBlockedDueToOverdue || isExceedingMax
                  ? 'bg-slate-300 opacity-60 cursor-not-allowed shadow-none'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30 cursor-pointer active:scale-98'
              }`}
            >
              <Undo2 className="w-4 h-4" />
              <span>Xác Nhận Hoàn Trả & Thu Lại Hàng</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
