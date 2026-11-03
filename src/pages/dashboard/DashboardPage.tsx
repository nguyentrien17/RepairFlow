import React from 'react';
import {
  Wrench,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Package,
  PlusCircle,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { StorageService } from '../../services/mockStorage';
import { formatVND, formatDateTime, STATUS_CONFIG, PRIORITY_CONFIG } from '../../utils/formatters';
import { TabType } from '../../components/layout/Sidebar';
import { RepairTicket } from '../../types';

interface DashboardPageProps {
  onNavigate: (tab: TabType, ticketId?: number) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const tickets = StorageService.getTickets();
  const settings = StorageService.getSettings();
  const warranties = StorageService.getWarranties();
  const auditLogs = StorageService.getAuditLogs();
  const parts = StorageService.getParts();

  // Metrics
  const todayStr = new Date().toISOString().slice(0, 10);
  const ticketsToday = tickets.filter((t) => t.created_at.startsWith(todayStr)).length;
  const inProgressCount = tickets.filter((t) => ['In_Progress', 'Diagnosing'].includes(t.status)).length;
  const waitingApprovalCount = tickets.filter((t) => t.status === 'Waiting_Approval').length;
  const readyPickupCount = tickets.filter((t) => ['Ready_For_Pickup', 'Completed'].includes(t.status)).length;
  const deliveredCount = tickets.filter((t) => t.status === 'Delivered').length;

  const totalRevenue = tickets.reduce((acc, t) => acc + (t.paid_amount || 0), 0);
  const totalDebt = tickets.reduce((acc, t) => acc + (t.debt_amount || 0), 0);

  const lowStockParts = parts.filter((p) => p.stock_quantity <= p.min_stock_alert);
  const urgentTickets = tickets.filter((t) => ['Urgent', 'High'].includes(t.priority) && t.status !== 'Delivered' && t.status !== 'Cancelled');

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
              TRUNG TÂM ĐIỀU HÀNH
            </span>
            <span className="text-xs text-slate-400">Hôm nay: {formatDateTime(new Date().toISOString())}</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold mt-1 text-white">{settings.store_name}</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">{settings.store_slogan}</p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => onNavigate('intake')}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Tiếp nhận máy mới
          </button>
          <button
            onClick={() => onNavigate('kanban')}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl text-sm flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            Bảng tiến độ Kanban
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tiếp nhận hôm nay */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Tiếp nhận hôm nay</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{ticketsToday}</h3>
            <span className="text-[11px] text-slate-500 mt-0.5 inline-block">Tổng {tickets.length} phiếu</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Wrench className="w-6 h-6" />
          </div>
        </div>

        {/* Đang sửa chữa */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Đang xử lý kỹ thuật</p>
            <h3 className="text-2xl font-bold text-indigo-600 mt-1">{inProgressCount}</h3>
            <span className="text-[11px] text-amber-600 font-medium mt-0.5 inline-block">{waitingApprovalCount} phiếu chờ duyệt</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Chờ bàn giao */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Chờ khách nhận</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{readyPickupCount}</h3>
            <span className="text-[11px] text-slate-500 mt-0.5 inline-block">{deliveredCount} đã bàn giao</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Doanh thu & Công nợ */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Tổng tiền đã thu</p>
            <h3 className="text-xl font-bold text-slate-900 mt-1">{formatVND(totalRevenue)}</h3>
            <span className="text-[11px] text-rose-600 font-semibold mt-0.5 inline-block">Nợ: {formatVND(totalDebt)}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Urgent tickets & Status breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Urgent / Priority Tickets */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <h3 className="font-bold text-slate-900 text-sm">Phiếu sửa chữa cần ưu tiên ({urgentTickets.length})</h3>
              </div>
              <button
                onClick={() => onNavigate('tickets')}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
              >
                Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {urgentTickets.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">Không có phiếu gấp cần xử lý.</p>
            ) : (
              <div className="space-y-2.5">
                {urgentTickets.map((t) => {
                  const statusConf = STATUS_CONFIG[t.status];
                  const priorityConf = PRIORITY_CONFIG[t.priority];
                  return (
                    <div
                      key={t.id}
                      onClick={() => onNavigate('tickets', t.id)}
                      className="p-3.5 bg-slate-50 hover:bg-indigo-50/40 rounded-xl border border-slate-200 transition-all flex items-center justify-between cursor-pointer group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-indigo-700">{t.ticket_code}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityConf.badgeClass}`}>
                            {priorityConf.label}
                          </span>
                          <span className="font-bold text-slate-900 text-sm">{t.device_brand} {t.device_model}</span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-1">Khách: <strong>{t.customer_name}</strong> — Lỗi: {t.defect_description}</p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold border ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}>
                          {statusConf.label}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Status Breakdown Progress Overview */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-4">Phân bổ trạng thái toàn bộ phiếu</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(STATUS_CONFIG).map(([st, cfg]) => {
                const count = tickets.filter((t) => t.status === st).length;
                return (
                  <div
                    key={st}
                    onClick={() => onNavigate('tickets')}
                    className={`p-3 rounded-xl border ${cfg.border} ${cfg.bg} cursor-pointer hover:opacity-90 transition-opacity`}
                  >
                    <p className={`text-xs font-semibold ${cfg.text}`}>{cfg.label}</p>
                    <p className="text-xl font-bold text-slate-900 mt-1">{count}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (1 span): Inventory Alerts & Audit Logs */}
        <div className="space-y-6">
          {/* Low Stock Alerts */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-sm">Cảnh báo linh kiện sắp hết ({lowStockParts.length})</h3>
              </div>
              <button
                onClick={() => onNavigate('inventory')}
                className="text-xs text-indigo-600 font-semibold"
              >
                Vào kho
              </button>
            </div>

            {lowStockParts.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">Tồn kho linh kiện đều an toàn.</p>
            ) : (
              <div className="space-y-2">
                {lowStockParts.map((p) => (
                  <div key={p.id} className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-200 text-xs flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-900">{p.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">SKU: {p.sku}</p>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <span className="font-bold text-rose-600 text-sm">{p.stock_quantity}</span>
                      <span className="text-[10px] text-slate-500 block">Min: {p.min_stock_alert}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Audit Activities (UC-27) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Hoạt động gần đây (Audit)</h3>
              <button onClick={() => onNavigate('audit')} className="text-xs text-indigo-600 font-semibold">
                Xem chi tiết
              </button>
            </div>

            <div className="space-y-3">
              {auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="text-xs space-y-0.5 border-l-2 border-indigo-500 pl-2.5 py-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{log.user_name}</span>
                    <span className="text-[10px] text-slate-400">{formatDateTime(log.created_at)}</span>
                  </div>
                  <p className="text-slate-600 leading-snug">{log.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
