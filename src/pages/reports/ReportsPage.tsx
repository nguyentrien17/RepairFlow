import React, { useState } from 'react';
import { StorageService } from '../../services/mockStorage';
import { formatVND, STATUS_CONFIG } from '../../utils/formatters';
import { BarChart3, Download, Printer, DollarSign, Wrench, Package } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

export const ReportsPage: React.FC = () => {
  const tickets = StorageService.getTickets();
  const payments = StorageService.getPayments();
  const parts = StorageService.getParts();
  const { showToast } = useToast();

  const [dateRange, setDateRange] = useState('month');

  const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalTickets = tickets.length;
  const completedTickets = tickets.filter((t) => ['Completed', 'Ready_For_Pickup', 'Delivered'].includes(t.status)).length;
  const totalDebt = tickets.reduce((acc, t) => acc + t.debt_amount, 0);

  // Group tickets by device category
  const categoryStats: Record<string, number> = {};
  tickets.forEach((t) => {
    categoryStats[t.device_category] = (categoryStats[t.device_category] || 0) + 1;
  });

  const exportCSV = () => {
    let csv = 'Mã phiếu,Khách hàng,SĐT,Thiết bị,Trạng thái,Tổng tiền,Đã thu,Còn nợ,Ngày tạo\n';
    tickets.forEach((t) => {
      csv += `"${t.ticket_code}","${t.customer_name}","${t.customer_phone}","${t.device_brand} ${t.device_model}","${t.status}",${t.final_amount},${t.paid_amount},${t.debt_amount},"${t.created_at}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bao_cao_RepairFlow_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    showToast('Đã xuất file báo cáo CSV thành công!', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Báo cáo & Thống kê kinh doanh (UC-29)</h2>
          <p className="text-xs text-slate-500 mt-0.5">Phân tích doanh thu, hiệu suất kỹ thuật, linh kiện xuất kho và công nợ.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" /> Xuất file CSV / Excel
          </button>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" /> In báo cáo
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Tổng doanh thu thu vào</span>
          <p className="text-2xl font-bold text-indigo-700 mt-1">{formatVND(totalRevenue)}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">{payments.length} lượt thanh toán</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Tổng số phiếu sửa chữa</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalTickets}</p>
          <span className="text-[11px] text-emerald-600 font-bold mt-0.5 block">{completedTickets} hoàn tất ({totalTickets > 0 ? Math.round((completedTickets / totalTickets) * 100) : 0}%)</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Tổng công nợ còn lại</span>
          <p className="text-2xl font-bold text-rose-600 mt-1">{formatVND(totalDebt)}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Cần đối soát thu hồi</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Giá trị kho linh kiện</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {formatVND(parts.reduce((acc, p) => acc + (p.cost_price * p.stock_quantity), 0))}
          </p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">{parts.length} mã SKU đang lưu kho</span>
        </div>
      </div>

      {/* Breakdown by Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">Số lượng thiết bị theo chủng loại</h3>
          <div className="space-y-3">
            {Object.entries(categoryStats).map(([cat, count]) => {
              const pct = Math.round((count / totalTickets) * 100);
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">{cat}</span>
                    <span className="text-slate-900">{count} máy ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Breakdown by Status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">Phân bố theo trạng thái quy trình</h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {Object.entries(STATUS_CONFIG).map(([st, cfg]) => {
              const count = tickets.filter((t) => t.status === st).length;
              return (
                <div key={st} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-600 font-medium">{cfg.label}</span>
                  <strong className="text-slate-900 text-sm">{count}</strong>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
