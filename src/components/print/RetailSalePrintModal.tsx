import React from 'react';
import { RetailSaleOrder, StoreSettings } from '../../types';
import { formatVND, formatDateTime } from '../../utils/formatters';
import { Printer, X } from 'lucide-react';

interface RetailSalePrintModalProps {
  order: RetailSaleOrder;
  settings: StoreSettings;
  onClose: () => void;
  isPending?: boolean;
  onConfirm?: () => void;
}

export const RetailSalePrintModal: React.FC<RetailSalePrintModalProps> = ({
  order,
  settings,
  onClose,
  isPending = false,
  onConfirm,
}) => {
  const handlePrintOrConfirm = () => {
    window.print();
    if (isPending && onConfirm) {
      onConfirm();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header bar (hidden when printed) */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 no-print">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="font-bold text-slate-800">
                {isPending ? 'Xem trước & Xác nhận đơn bán hàng' : 'Xem trước bản in: HÓA ĐƠN BÁN HÀNG'}
              </h3>
              {isPending && (
                <p className="text-[11px] text-amber-600 font-semibold">
                  * Vui lòng kiểm tra thông tin. Bấm "Xác nhận & In hóa đơn" để chính thức hoàn tất đơn và trừ kho.
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isPending && (
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg text-sm transition-colors cursor-pointer"
              >
                Quay lại chỉnh sửa
              </button>
            )}
            <button
              onClick={handlePrintOrConfirm}
              className={`px-4 py-2 text-white font-bold rounded-lg text-sm flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer ${
                isPending
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30 ring-2 ring-emerald-500/30'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>{isPending ? 'Xác nhận & In hóa đơn' : 'In hóa đơn'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer"
              title="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Area (A5 / A4) */}
        <div className="p-8 overflow-y-auto print:p-0 print:m-0 font-sans text-slate-800 leading-relaxed text-sm bg-white" id="printable-area">
          {/* Header Store Info */}
          <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-4">
            <div>
              <h1 className="font-extrabold text-base uppercase text-slate-900 tracking-tight">{settings.store_name}</h1>
              <p className="text-xs text-slate-600">{settings.address}</p>
              <p className="text-xs text-slate-600">Hotline: {settings.phone}</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                {order.order_code}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">{formatDateTime(order.created_at)}</p>
            </div>
          </div>

          {/* Title */}
          <div className="text-center my-4">
            {order.order_status === 'Refunded' ? (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl mb-2">
                <h2 className="text-xl font-extrabold text-rose-700 tracking-wide uppercase">PHIẾU XÁC NHẬN HOÀN TRẢ HÀNG & HOÀN TIỀN</h2>
                <p className="text-xs text-rose-600 font-bold mt-1">
                  Đã hoàn trả {formatVND(order.refund_amount || order.final_amount)} cho khách hàng • Lý do: {order.refund_reason || 'Đổi ý không mua'}
                </p>
                {order.refunded_at && (
                  <p className="text-[10px] text-rose-500 font-mono mt-0.5">
                    Thời gian hoàn trả: {formatDateTime(order.refunded_at)} (Thực hiện bởi: {order.refunded_by_name})
                  </p>
                )}
              </div>
            ) : (
              <>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-wide uppercase">HÓA ĐƠN BÁN HÀNG BÁN LẺ & THIẾT BỊ</h2>
                <p className="text-xs text-slate-500 mt-0.5">Cảm ơn Quý khách đã mua sắm tại {settings.store_name}</p>
              </>
            )}
          </div>

          {/* Customer Info */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs mb-4 grid grid-cols-2 gap-2">
            <div>
              <span className="text-slate-500">Khách hàng: </span>
              <strong className="text-slate-900">{order.customer_name}</strong>
            </div>
            <div>
              <span className="text-slate-500">Số điện thoại: </span>
              <strong className="font-mono text-slate-900">{order.customer_phone}</strong>
            </div>
            <div>
              <span className="text-slate-500">Nhân viên bán hàng: </span>
              <strong className="text-slate-800">{order.created_by_name}</strong>
            </div>
            <div>
              <span className="text-slate-500">Hình thức thanh toán: </span>
              <strong className="text-indigo-700 font-bold">
                {order.payment_method === 'Cash' ? 'Tiền mặt' : order.payment_method === 'Bank_Transfer' ? 'Chuyển khoản VietQR' : 'Quẹt thẻ SmartPOS'}
              </strong>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-left text-xs mb-4 border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-800 bg-slate-100 text-slate-700 font-bold">
                <th className="py-2 px-2">STT</th>
                <th className="py-2 px-2">Tên sản phẩm / Thiết bị</th>
                <th className="py-2 px-2 text-center">SL</th>
                <th className="py-2 px-2 text-right">Đơn giá</th>
                <th className="py-2 px-2 text-right">Thành tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {order.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-2 px-2 text-center text-slate-500">{idx + 1}</td>
                  <td className="py-2 px-2 font-semibold text-slate-900">
                    {item.product_name}
                    {item.batch_code && <span className="text-[10px] text-purple-700 block font-mono">Lô: {item.batch_code}</span>}
                    {item.serial_number && <span className="text-[10px] text-slate-500 block font-mono">Serial/IMEI: {item.serial_number}</span>}
                    <span className="text-[10px] text-slate-500 block">
                      Cam kết: Bảo hành {item.warranty_months} tháng • Đổi trả: {item.return_days ?? order.return_days ?? settings.default_return_days ?? 15} ngày
                    </span>
                  </td>
                  <td className="py-2 px-2 text-center font-bold">{item.quantity}</td>
                  <td className="py-2 px-2 text-right font-mono">{formatVND(item.unit_price)}</td>
                  <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">{formatVND(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Total Calculation */}
          <div className="flex justify-end mb-6 text-xs">
            <div className="w-64 space-y-1.5 border-t border-slate-300 pt-2">
              <div className="flex justify-between text-slate-600">
                <span>Tổng tiền hàng:</span>
                <span className="font-mono font-semibold">{formatVND(order.subtotal_amount)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Chiết khấu / Voucher:</span>
                  <span className="font-mono">-{formatVND(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-slate-900 border-t border-slate-200 pt-1">
                <span>Khách phải trả:</span>
                <span className="font-mono font-extrabold text-indigo-700">{formatVND(order.final_amount)}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Đã thanh toán:</span>
                <span className="font-mono font-bold text-emerald-700">{formatVND(order.paid_amount)}</span>
              </div>
              {order.debt_amount > 0 && (
                <div className="flex justify-between text-rose-700 font-bold">
                  <span>Còn nợ lại:</span>
                  <span className="font-mono">{formatVND(order.debt_amount)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Terms & Signatures */}
          <div className="border-t border-slate-200 pt-4 text-[11px] text-slate-500 space-y-1">
            <p className="font-bold text-slate-700">Chính sách bảo hành & Đổi trả sản phẩm:</p>
            <p>1. Sản phẩm/thiết bị bán ra được bảo hành {order.warranty_months} tháng. Thời hạn áp dụng đổi trả trong vòng {order.return_days ?? settings.default_return_days ?? 15} ngày kể từ ngày xuất hóa đơn này (theo tem niêm phong còn nguyên vẹn).</p>
            <p>2. Quý khách vui lòng kiểm tra kỹ ngoại quan, linh kiện và chạy thử thiết bị trước khi rời khỏi quầy.</p>
          </div>

          <div className="grid grid-cols-2 gap-8 text-center text-xs mt-8 pt-4">
            <div>
              <p className="font-bold text-slate-800">Khách hàng nhận máy</p>
              <p className="text-[10px] text-slate-400 italic mb-12">(Ký & ghi rõ họ tên)</p>
            </div>
            <div>
              <p className="font-bold text-slate-800">Đại diện cửa hàng</p>
              <p className="text-[10px] text-slate-400 italic mb-12">(Ký & đóng dấu)</p>
              <p className="font-semibold text-slate-900">{order.created_by_name}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
