import React, { useState, useEffect } from 'react';
import { StorageService } from '../../services/mockStorage';
import { Payment, RepairTicket } from '../../types';
import { formatVND, formatDateTime } from '../../utils/formatters';
import { DollarSign, Search, CreditCard, AlertCircle, Zap } from 'lucide-react';

interface PaymentListPageProps {
  onSelectTicket?: (ticketId: number) => void;
}

export const PaymentListPage: React.FC<PaymentListPageProps> = ({ onSelectTicket }) => {
  const [payments, setPayments] = useState<Payment[]>(() => StorageService.getPayments());
  const [tickets, setTickets] = useState<RepairTicket[]>(() => StorageService.getTickets());
  const [activeTab, setActiveTab] = useState<'payments' | 'debts'>('payments');
  const [search, setSearch] = useState('');

  const reloadData = () => {
    setPayments(StorageService.getPayments());
    setTickets(StorageService.getTickets());
  };

  useEffect(() => {
    const handleAutoPayment = () => {
      reloadData();
    };
    window.addEventListener('repairflow_auto_payment', handleAutoPayment);
    return () => window.removeEventListener('repairflow_auto_payment', handleAutoPayment);
  }, []);

  // Tickets with debt > 0
  const debtTickets = tickets.filter((t) => t.debt_amount > 0 && t.status !== 'Cancelled');
  const totalDebt = debtTickets.reduce((acc, t) => acc + t.debt_amount, 0);
  const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);

  const filteredPayments = payments.filter(
    (p) =>
      p.payment_code.toLowerCase().includes(search.toLowerCase()) ||
      p.ticket_code.toLowerCase().includes(search.toLowerCase()) ||
      p.customer_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Quản lý thanh toán & Công nợ (UC-21, UC-22)</h2>
          <p className="text-xs text-slate-500 mt-0.5">Theo dõi dòng tiền thu, phiếu đặt cọc và công nợ khách hàng.</p>
        </div>

        <div className="flex gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs text-xs">
          <div>
            <span className="text-slate-500 block">Đã thu:</span>
            <strong className="text-emerald-600 text-sm">{formatVND(totalCollected)}</strong>
          </div>
          <div className="border-l border-slate-200 pl-4">
            <span className="text-slate-500 block">Tổng công nợ:</span>
            <strong className="text-rose-600 text-sm">{formatVND(totalDebt)}</strong>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-2.5 transition-colors border-b-2 ${
            activeTab === 'payments' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Lịch sử phiếu thu ({payments.length})
        </button>
        <button
          onClick={() => setActiveTab('debts')}
          className={`pb-2.5 transition-colors border-b-2 ${
            activeTab === 'debts' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Danh sách công nợ cần thu ({debtTickets.length})
        </button>
      </div>

      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
              <tr>
                <th className="py-3 px-4">Mã phiếu thu</th>
                <th className="py-3 px-4">Mã phiếu sửa</th>
                <th className="py-3 px-4">Khách hàng</th>
                <th className="py-3 px-4">Hình thức</th>
                <th className="py-3 px-4">Loại thu</th>
                <th className="py-3 px-4 text-right">Số tiền thu</th>
                <th className="py-3 px-4">Thu ngân</th>
                <th className="py-3 px-4 text-center">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-700">{p.payment_code}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                    <button
                      onClick={() => onSelectTicket?.(p.ticket_id)}
                      className="hover:underline text-indigo-600"
                    >
                      {p.ticket_code}
                    </button>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{p.customer_name}</td>
                  <td className="py-3 px-4">
                    {p.is_auto_verified ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <Zap className="w-3 h-3 text-emerald-600" />
                        {p.payment_method === 'POS_Card' ? 'SmartPOS' : 'Auto Webhook'}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {p.payment_method === 'Cash' ? 'Tiền mặt' : p.payment_method === 'POS_Card' ? 'Quẹt thẻ POS' : 'Chuyển khoản'}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {p.payment_type === 'Deposit' ? 'Đặt cọc' : 'Hoàn tất'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 text-sm">{formatVND(p.amount)}</td>
                  <td className="py-3 px-4 text-slate-600">{p.cashier_name}</td>
                  <td className="py-3 px-4 text-center text-slate-400">{formatDateTime(p.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'debts' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
              <tr>
                <th className="py-3 px-4">Mã phiếu</th>
                <th className="py-3 px-4">Khách hàng & SĐT</th>
                <th className="py-3 px-4">Thiết bị</th>
                <th className="py-3 px-4 text-right">Tổng chi phí</th>
                <th className="py-3 px-4 text-right">Đã thanh toán</th>
                <th className="py-3 px-4 text-right text-rose-600">Số tiền còn nợ</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {debtTickets.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-700">{t.ticket_code}</td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{t.customer_name}</div>
                    <div className="font-mono text-slate-500 text-[11px]">{t.customer_phone}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-800 font-medium">{t.device_brand} {t.device_model}</td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-700">{formatVND(t.final_amount)}</td>
                  <td className="py-3 px-4 text-right font-semibold text-emerald-600">{formatVND(t.paid_amount)}</td>
                  <td className="py-3 px-4 text-right font-bold text-rose-600 text-sm">{formatVND(t.debt_amount)}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => onSelectTicket?.(t.id)}
                      className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs"
                    >
                      Thu tiền
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
