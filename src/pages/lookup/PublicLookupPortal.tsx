import React, { useState, useEffect } from 'react';
import { StorageService } from '../../services/mockStorage';
import { RepairTicket, RepairQuote } from '../../types';
import { formatVND, formatDateTime, formatDate, STATUS_CONFIG, getVietQRUrl } from '../../utils/formatters';
import {
  Search,
  Wrench,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Check,
  X,
  CreditCard,
  QrCode,
  ArrowRight,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

export const PublicLookupPortal: React.FC = () => {
  const [ticketCodeInput, setTicketCodeInput] = useState('');
  const [ticket, setTicket] = useState<RepairTicket | null>(null);
  const [quote, setQuote] = useState<RepairQuote | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const { showToast } = useToast();

  const settings = StorageService.getSettings();

  // Check URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('ticket');
    if (code) {
      setTicketCodeInput(code);
      doLookup(code);
    }
  }, []);

  const doLookup = (code: string) => {
    if (!code.trim()) return;
    setHasSearched(true);
    const found = StorageService.getTicketByCode(code.trim());
    if (found) {
      setTicket(found);
      const quotes = StorageService.getQuotes(found.id);
      setQuote(quotes[0] || null);
    } else {
      setTicket(null);
      setQuote(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    doLookup(ticketCodeInput);
  };

  // Online Quote Approval by Customer (UC-25)
  const handleCustomerApproveQuote = () => {
    if (!ticket || !quote) return;
    StorageService.updateQuoteStatus(quote.id, 'Approved', 'Khách hàng (Xác nhận trực tuyến qua QR Portal)');
    StorageService.updateTicket(ticket.id, { status: 'In_Progress' });
    showToast('Quý khách đã xác nhận duyệt báo giá thành công! Kỹ thuật viên sẽ tiến hành sửa chữa.', 'success');
    doLookup(ticket.ticket_code);
  };

  const statusConf = ticket ? STATUS_CONFIG[ticket.status] : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6 px-4">
      {/* Brand Header */}
      <div className="text-center space-y-1.5 pb-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200 mb-2">
          <Wrench className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">CỔNG TRA CỨU TIẾN ĐỘ SỬA CHỮA</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          {settings.store_name} — Nhập mã phiếu sửa chữa ghi trên phiếu nhận để kiểm tra tiến trình theo thời gian thực.
        </p>
      </div>

      {/* Lookup Search Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-md">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              placeholder="Nhập mã phiếu (Ví dụ: SC-20261102-0001)"
              value={ticketCodeInput}
              onChange={(e) => setTicketCodeInput(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold focus:bg-white focus:border-indigo-600 focus:outline-hidden"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer"
          >
            Tra cứu
          </button>
        </form>
      </div>

      {/* Result Display */}
      {hasSearched && !ticket && (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
          <p className="font-bold text-slate-800 text-sm">Không tìm thấy thông tin phiếu sửa chữa này!</p>
          <p className="text-xs text-slate-500 mt-1">Quý khách vui lòng kiểm tra lại mã số in trên phiếu hoặc liên hệ hotline: {settings.phone}</p>
        </div>
      )}

      {ticket && statusConf && (
        <div className="space-y-6">
          {/* Main Status & Device Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <span className="font-mono font-bold text-lg text-indigo-700">{ticket.ticket_code}</span>
                <p className="text-xs text-slate-500 mt-0.5">Tiếp nhận lúc: {formatDateTime(ticket.created_at)}</p>
              </div>
              <span className={`px-3 py-1 rounded-xl text-xs font-bold border self-start sm:self-auto ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}>
                {statusConf.label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500">Khách hàng:</span>
                <p className="font-bold text-slate-900 text-sm">{ticket.customer_name}</p>
              </div>
              <div>
                <span className="text-slate-500">Thiết bị:</span>
                <p className="font-bold text-slate-900 text-sm">{ticket.device_brand} {ticket.device_model}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-500 font-semibold block">Lỗi tiếp nhận:</span>
              <p className="text-slate-800 mt-0.5 italic">{ticket.defect_description}</p>
            </div>

            {ticket.estimated_completion && (
              <p className="text-xs font-semibold text-indigo-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                Dự kiến hoàn thành: {formatDateTime(ticket.estimated_completion)}
              </p>
            )}
          </div>

          {/* Quotation & Online Customer Confirmation (UC-25) */}
          {quote && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">BẢNG BÁO GIÁ DỊCH VỤ SỬA CHỮA</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  quote.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {quote.status === 'Approved' ? 'Quý khách đã đồng ý' : 'Đang chờ quý khách duyệt'}
                </span>
              </div>

              <div className="space-y-2">
                {quote.items.map((it) => (
                  <div key={it.id} className="flex justify-between items-center text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <p className="font-bold text-slate-800">{it.name}</p>
                      <span className="text-[10px] text-slate-500">Bảo hành: {it.warranty_months} tháng</span>
                    </div>
                    <span className="font-bold text-slate-900">{formatVND(it.subtotal)}</span>
                  </div>
                ))}

                <div className="pt-2 flex justify-between items-center text-sm font-bold border-t border-slate-200">
                  <span className="text-slate-700">TỔNG CHI PHÍ BÁO GIÁ:</span>
                  <span className="text-indigo-900 text-base">{formatVND(quote.total_amount)}</span>
                </div>
              </div>

              {quote.status !== 'Approved' && (
                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200 text-xs space-y-3">
                  <p className="text-indigo-900 font-semibold leading-relaxed">
                    Kính mời quý khách kiểm tra kỹ các hạng mục và chi phí trên. Bấm nút dưới đây để xác nhận đồng ý cho kỹ thuật viên tiến hành sửa chữa:
                  </p>
                  <button
                    onClick={handleCustomerApproveQuote}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    Tôi đồng ý báo giá — Tiến hành sửa chữa
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Payment & VietQR Remote Settlement */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4">
            <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">TÌNH TRẠNG THANH TOÁN</h3>
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block">Tổng tiền</span>
                <strong className="text-slate-800 text-sm mt-0.5 block">{formatVND(ticket.final_amount)}</strong>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-emerald-700 block">Đã thanh toán</span>
                <strong className="text-emerald-700 text-sm mt-0.5 block">{formatVND(ticket.paid_amount)}</strong>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                <span className="text-rose-700 block">Còn lại</span>
                <strong className="text-rose-700 text-sm mt-0.5 block">{formatVND(ticket.debt_amount)}</strong>
              </div>
            </div>

            {ticket.debt_amount > 0 && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4 text-xs">
                <img
                  src={getVietQRUrl(settings.bank_name, settings.bank_account_no, settings.bank_account_name, ticket.debt_amount, ticket.ticket_code)}
                  alt="VietQR"
                  className="w-32 h-32 rounded-lg border border-slate-200 p-1 bg-white"
                />
                <div className="space-y-1 text-slate-700 flex-1">
                  <p className="font-bold text-slate-900">Quét mã VietQR chuyển khoản thanh toán từ xa:</p>
                  <p>Ngân hàng: <strong>{settings.bank_name}</strong></p>
                  <p>Số tài khoản: <strong className="font-mono text-indigo-700">{settings.bank_account_no}</strong></p>
                  <p>Chủ TK: <strong>{settings.bank_account_name}</strong></p>
                  <p>Nội dung CK: <strong className="font-mono">{ticket.ticket_code}</strong></p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
