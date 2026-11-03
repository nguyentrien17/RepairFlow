import React from 'react';
import { RepairTicket, StoreSettings, Payment } from '../../types';
import { formatVND, formatDateTime, formatDate, getTicketQrUrl } from '../../utils/formatters';
import { Printer, X } from 'lucide-react';

interface PrintProps {
  ticket: RepairTicket;
  settings: StoreSettings;
  payment?: Payment;
  type: 'intake' | 'quote' | 'invoice' | 'handover';
  onClose: () => void;
}

export const PrintModal: React.FC<PrintProps> = ({ ticket, settings, payment, type, onClose }) => {
  const qrUrl = getTicketQrUrl(ticket.ticket_code);

  const getTitle = () => {
    switch (type) {
      case 'intake':
        return 'PHIẾU TIẾP NHẬN THIẾT BỊ';
      case 'quote':
        return 'BẢNG BÁO GIÁ DỊCH VỤ SỬA CHỮA';
      case 'invoice':
        return 'HÓA ĐƠN THANH TOÁN DỊCH VỤ';
      case 'handover':
        return 'BIÊN BẢN BÀN GIAO THIẾT BỊ & BẢO HÀNH';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header bar (hidden when printed) */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 no-print">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800">Xem trước bản in: {getTitle()}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              In ngay (A5/A4)
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Area (optimized for A5 / A4) */}
        <div className="p-8 overflow-y-auto print:p-0 print:m-0 font-sans text-slate-800 leading-relaxed text-sm bg-white" id="printable-area">
          {/* Header Store Info */}
          <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-4">
            <div>
              <h1 className="text-lg font-bold uppercase tracking-tight text-slate-900">{settings.store_name}</h1>
              <p className="text-xs text-slate-600 mt-0.5">{settings.store_slogan}</p>
              <p className="text-xs text-slate-700 mt-1">Đ/c: {settings.address}</p>
              <p className="text-xs text-slate-700 font-semibold">Hotline: {settings.phone}</p>
            </div>
            <div className="text-right shrink-0 ml-4 flex flex-col items-center">
              <img src={qrUrl} alt="QR Tra cứu" className="w-20 h-20 border border-slate-300 p-1 rounded" />
              <span className="text-[10px] text-slate-500 font-medium mt-1">Quét QR tra cứu</span>
            </div>
          </div>

          {/* Title and Code */}
          <div className="text-center my-4">
            <h2 className="text-xl font-extrabold uppercase text-indigo-950 tracking-wider">{getTitle()}</h2>
            <div className="mt-1 flex items-center justify-center gap-3">
              <span className="font-mono font-bold text-base px-2.5 py-0.5 bg-slate-100 rounded border border-slate-300">
                {ticket.ticket_code}
              </span>
              <span className="text-xs text-slate-500">Ngày tạo: {formatDateTime(ticket.created_at)}</span>
            </div>
          </div>

          {/* Customer & Device Information Table */}
          <div className="grid grid-cols-2 gap-4 my-4 p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <div>
              <p className="font-bold text-slate-900 text-sm mb-1.5 uppercase text-indigo-900">Thông tin khách hàng</p>
              <p><span className="text-slate-500">Họ và tên:</span> <strong className="text-slate-800">{ticket.customer_name}</strong></p>
              <p><span className="text-slate-500">Số điện thoại:</span> <strong className="text-slate-800">{ticket.customer_phone}</strong></p>
              {ticket.customer_address && <p><span className="text-slate-500">Địa chỉ:</span> {ticket.customer_address}</p>}
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm mb-1.5 uppercase text-indigo-900">Thông tin thiết bị</p>
              <p><span className="text-slate-500">Thiết bị:</span> <strong>{ticket.device_brand} {ticket.device_model}</strong></p>
              <p><span className="text-slate-500">Loại máy:</span> {ticket.device_category}</p>
              {ticket.device_serial && <p><span className="text-slate-500">Serial/IMEI:</span> {ticket.device_serial}</p>}
              {ticket.device_color && <p><span className="text-slate-500">Màu sắc:</span> {ticket.device_color}</p>}
            </div>
          </div>

          {/* Specific Body Content */}
          {type === 'intake' && (
            <div className="space-y-3 my-4 text-xs">
              <div className="border border-slate-200 p-3 rounded">
                <p className="font-bold text-slate-800 mb-1">Lỗi khách hàng mô tả:</p>
                <p className="text-slate-700 italic">{ticket.defect_description}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-slate-200 p-2.5 rounded">
                  <p className="font-semibold text-slate-700">Tình trạng lúc nhận:</p>
                  <p className="text-slate-600 mt-0.5">{ticket.initial_condition || 'Bình thường'}</p>
                </div>
                <div className="border border-slate-200 p-2.5 rounded">
                  <p className="font-semibold text-slate-700">Ngoại quan thiết bị:</p>
                  <p className="text-slate-600 mt-0.5">{ticket.cosmetic_condition || 'Không trầy xước'}</p>
                </div>
              </div>
              <div className="border border-slate-200 p-2.5 rounded bg-slate-50/50">
                <p className="font-semibold text-slate-700">Phụ kiện kèm theo:</p>
                <p className="text-slate-600">{ticket.accessories_included || 'Không có'}</p>
              </div>
              {ticket.estimated_completion && (
                <p className="text-xs font-semibold text-indigo-900">
                  Hẹn ngày trả máy dự kiến: {formatDateTime(ticket.estimated_completion)}
                </p>
              )}
            </div>
          )}

          {type === 'invoice' && (
            <div className="my-4 text-xs">
              <table className="w-full border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-semibold">
                    <th className="border border-slate-300 p-2 text-left">Nội dung sửa chữa / Dịch vụ</th>
                    <th className="border border-slate-300 p-2 text-right">Số tiền</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 p-2">
                      Chi phí sửa chữa & thay thế linh kiện {ticket.device_brand} {ticket.device_model}
                    </td>
                    <td className="border border-slate-300 p-2 text-right font-semibold">
                      {formatVND(ticket.subtotal_amount)}
                    </td>
                  </tr>
                  {ticket.discount_amount > 0 && (
                    <tr>
                      <td className="border border-slate-300 p-2 text-slate-600">
                        Giảm giá / Ưu đãi {ticket.promotion_code ? `(Mã: ${ticket.promotion_code})` : ''}
                      </td>
                      <td className="border border-slate-300 p-2 text-right text-emerald-600 font-semibold">
                        -{formatVND(ticket.discount_amount)}
                      </td>
                    </tr>
                  )}
                  <tr className="bg-slate-50 font-bold text-sm">
                    <td className="border border-slate-300 p-2 text-right">TỔNG CỘNG PHẢI THU:</td>
                    <td className="border border-slate-300 p-2 text-right text-indigo-900">
                      {formatVND(ticket.final_amount)}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 text-right font-semibold">Đã thanh toán:</td>
                    <td className="border border-slate-300 p-2 text-right font-semibold text-emerald-700">
                      {formatVND(ticket.paid_amount)}
                    </td>
                  </tr>
                  <tr className="font-bold">
                    <td className="border border-slate-300 p-2 text-right text-rose-700">Còn lại (Công nợ):</td>
                    <td className="border border-slate-300 p-2 text-right text-rose-700">
                      {formatVND(ticket.debt_amount)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {payment && (
                <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded text-emerald-900">
                  <p className="font-semibold">Đợt thu: {payment.payment_code} — {formatDateTime(payment.created_at)}</p>
                  <p>Số tiền thu: <strong>{formatVND(payment.amount)}</strong> (Hình thức: {payment.payment_method === 'Cash' ? 'Tiền mặt' : 'Chuyển khoản'})</p>
                </div>
              )}
            </div>
          )}

          {type === 'handover' && (
            <div className="my-4 text-xs space-y-3">
              <div className="p-3 border border-emerald-200 bg-emerald-50/50 rounded">
                <p className="font-bold text-emerald-950 mb-1">Xác nhận tình trạng khi bàn giao:</p>
                <p className="text-emerald-900">Khách hàng đã kiểm tra thực tế, thiết bị hoạt động hoàn toàn ổn định và nhận lại đầy đủ phụ kiện gửi kèm: <strong>{ticket.accessories_included || 'Không có'}</strong>.</p>
              </div>
              <div className="p-3 border border-slate-200 bg-slate-50 rounded">
                <p className="font-bold text-slate-800 mb-1">Cam kết bảo hành:</p>
                <p className="text-slate-700">Thiết bị được kích hoạt bảo hành điện tử chính hãng trong thời gian quy định. Quý khách có thể tra cứu lịch sử bảo hành bằng cách quét mã QR trên phiếu này.</p>
              </div>
            </div>
          )}

          {/* Terms & Conditions */}
          <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-600">
            <p className="font-bold text-slate-700 mb-1">ĐIỀU KHOẢN TIẾP NHẬN & BẢO HÀNH:</p>
            <p className="whitespace-pre-line leading-relaxed">{type === 'handover' ? settings.terms_warranty : settings.terms_intake}</p>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 text-center mt-6 pt-4 text-xs">
            <div>
              <p className="font-bold uppercase text-slate-800">KHÁCH HÀNG</p>
              <p className="text-[11px] text-slate-500 italic">(Ký và ghi rõ họ tên)</p>
              <div className="h-16"></div>
              <p className="font-semibold text-slate-800">{ticket.customer_name}</p>
            </div>
            <div>
              <p className="font-bold uppercase text-slate-800">ĐẠI DIỆN CỬA HÀNG</p>
              <p className="text-[11px] text-slate-500 italic">(Nhân viên phụ trách)</p>
              <div className="h-16"></div>
              <p className="font-semibold text-slate-800">{ticket.created_by_name}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
