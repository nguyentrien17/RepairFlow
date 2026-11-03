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
  BadgePercent,
  Inbox,
  Boxes,
  ClipboardCheck,
  Bell,
  CheckCheck,
  ShieldAlert,
  XCircle,
  ArrowUpRight,
  KanbanSquare,
  Activity,
} from 'lucide-react';
import { StorageService } from '../../services/mockStorage';
import { formatVND, formatDateTime, STATUS_CONFIG, PRIORITY_CONFIG, localizeText } from '../../utils/formatters';
import { TabType } from '../../components/layout/Sidebar';
import { RepairTicket, RepairStatus } from '../../types';

const STATUS_PIPELINE: {
  key: RepairStatus;
  label: string;
  stepTag: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  cardBg: string;
  borderColor: string;
  leftBar: string;
  iconWrap: string;
  titleColor: string;
  badgeActive: string;
  dotColor: string;
}[] = [
  {
    key: 'Received',
    label: 'Đã tiếp nhận',
    stepTag: 'B1',
    desc: 'Thiết bị vào trung tâm',
    icon: Inbox,
    cardBg: 'bg-gradient-to-br from-slate-50 to-slate-100/90',
    borderColor: 'border-slate-200 hover:border-slate-400',
    leftBar: 'border-l-slate-400',
    iconWrap: 'bg-slate-200 text-slate-700',
    titleColor: 'text-slate-800',
    badgeActive: 'bg-slate-800 text-white shadow-xs',
    dotColor: 'bg-slate-400',
  },
  {
    key: 'Diagnosing',
    label: 'Đang kiểm tra',
    stepTag: 'B2',
    desc: 'KTV đo đạc & chẩn đoán',
    icon: Search,
    cardBg: 'bg-gradient-to-br from-sky-50 to-blue-50/70',
    borderColor: 'border-sky-200 hover:border-sky-400',
    leftBar: 'border-l-sky-500',
    iconWrap: 'bg-sky-100 text-sky-600',
    titleColor: 'text-sky-950',
    badgeActive: 'bg-sky-600 text-white shadow-xs',
    dotColor: 'bg-sky-300',
  },
  {
    key: 'Waiting_Approval',
    label: 'Chờ khách duyệt',
    stepTag: 'B3',
    desc: 'Chờ khách chốt giá sửa',
    icon: Clock,
    cardBg: 'bg-gradient-to-br from-amber-50 to-orange-50/70',
    borderColor: 'border-amber-200 hover:border-amber-400',
    leftBar: 'border-l-amber-500',
    iconWrap: 'bg-amber-100 text-amber-700',
    titleColor: 'text-amber-950',
    badgeActive: 'bg-amber-500 text-white shadow-xs font-black',
    dotColor: 'bg-amber-200',
  },
  {
    key: 'Waiting_Parts',
    label: 'Chờ linh kiện',
    stepTag: 'B4',
    desc: 'Đợi phụ tùng về kho',
    icon: Boxes,
    cardBg: 'bg-gradient-to-br from-purple-50 to-fuchsia-50/70',
    borderColor: 'border-purple-200 hover:border-purple-400',
    leftBar: 'border-l-purple-500',
    iconWrap: 'bg-purple-100 text-purple-700',
    titleColor: 'text-purple-950',
    badgeActive: 'bg-purple-600 text-white shadow-xs font-black',
    dotColor: 'bg-purple-200',
  },
  {
    key: 'In_Progress',
    label: 'Đang sửa chữa',
    stepTag: 'B5',
    desc: 'KTV đang trực tiếp sửa',
    icon: Wrench,
    cardBg: 'bg-gradient-to-br from-indigo-50 to-blue-50/80',
    borderColor: 'border-indigo-200 hover:border-indigo-400',
    leftBar: 'border-l-indigo-600',
    iconWrap: 'bg-indigo-100 text-indigo-700',
    titleColor: 'text-indigo-950',
    badgeActive: 'bg-indigo-600 text-white shadow-xs font-black',
    dotColor: 'bg-indigo-200',
  },
  {
    key: 'Quality_Check',
    label: 'Kiểm tra chất lượng',
    stepTag: 'B6',
    desc: 'Test chức năng sau sửa',
    icon: ClipboardCheck,
    cardBg: 'bg-gradient-to-br from-cyan-50 to-teal-50/70',
    borderColor: 'border-cyan-200 hover:border-cyan-400',
    leftBar: 'border-l-cyan-500',
    iconWrap: 'bg-cyan-100 text-cyan-700',
    titleColor: 'text-cyan-950',
    badgeActive: 'bg-cyan-600 text-white shadow-xs font-black',
    dotColor: 'bg-cyan-200',
  },
  {
    key: 'Completed',
    label: 'Đã sửa xong',
    stepTag: 'B7',
    desc: 'Máy hoàn tất chuẩn 100%',
    icon: CheckCircle2,
    cardBg: 'bg-gradient-to-br from-emerald-50 to-teal-50/70',
    borderColor: 'border-emerald-200 hover:border-emerald-400',
    leftBar: 'border-l-emerald-500',
    iconWrap: 'bg-emerald-100 text-emerald-700',
    titleColor: 'text-emerald-950',
    badgeActive: 'bg-emerald-600 text-white shadow-xs font-black',
    dotColor: 'bg-emerald-200',
  },
  {
    key: 'Ready_For_Pickup',
    label: 'Chờ khách nhận',
    stepTag: 'B8',
    desc: 'Đã báo khách qua lấy máy',
    icon: Bell,
    cardBg: 'bg-gradient-to-br from-teal-50 to-emerald-50/70',
    borderColor: 'border-teal-200 hover:border-teal-400',
    leftBar: 'border-l-teal-600',
    iconWrap: 'bg-teal-100 text-teal-700',
    titleColor: 'text-teal-950',
    badgeActive: 'bg-teal-600 text-white shadow-xs font-black',
    dotColor: 'bg-teal-200',
  },
  {
    key: 'Delivered',
    label: 'Đã bàn giao',
    stepTag: 'B9',
    desc: 'Khách nhận & tất toán',
    icon: CheckCheck,
    cardBg: 'bg-gradient-to-br from-green-50 to-emerald-50/70',
    borderColor: 'border-green-200 hover:border-green-400',
    leftBar: 'border-l-green-600',
    iconWrap: 'bg-green-100 text-green-700',
    titleColor: 'text-green-950',
    badgeActive: 'bg-green-600 text-white shadow-xs font-black',
    dotColor: 'bg-green-200',
  },
  {
    key: 'Warranty',
    label: 'Đang bảo hành',
    stepTag: 'Hậu mãi',
    desc: 'Xử lý bảo hành miễn phí',
    icon: ShieldAlert,
    cardBg: 'bg-gradient-to-br from-orange-50 to-amber-50/70',
    borderColor: 'border-orange-200 hover:border-orange-400',
    leftBar: 'border-l-orange-500',
    iconWrap: 'bg-orange-100 text-orange-700',
    titleColor: 'text-orange-950',
    badgeActive: 'bg-orange-600 text-white shadow-xs font-black',
    dotColor: 'bg-orange-200',
  },
  {
    key: 'Cancelled',
    label: 'Đã hủy',
    stepTag: 'Đã hủy',
    desc: 'Khách không sửa / hoàn máy',
    icon: XCircle,
    cardBg: 'bg-gradient-to-br from-rose-50 to-pink-50/60',
    borderColor: 'border-rose-200 hover:border-rose-400',
    leftBar: 'border-l-rose-400',
    iconWrap: 'bg-rose-100 text-rose-600',
    titleColor: 'text-rose-950',
    badgeActive: 'bg-rose-600 text-white shadow-xs font-black',
    dotColor: 'bg-rose-200',
  },
];

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
          <button
            onClick={() => onNavigate('promotions')}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-indigo-200 font-medium rounded-xl text-sm flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            <BadgePercent className="w-4 h-4 text-indigo-400" />
            Ưu đãi & Voucher
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
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
                    <Activity className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">Tiến độ & Phân bổ trạng thái toàn bộ phiếu</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Quy trình 11 giai đoạn sửa chữa từ tiếp nhận đến bàn giao. Nhấp vào thẻ để xem danh sách phiếu.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onNavigate('kanban')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors"
                >
                  <KanbanSquare className="w-3.5 h-3.5" />
                  <span>Bảng Kanban</span>
                </button>
                <button
                  onClick={() => onNavigate('tickets')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors"
                >
                  <span>Tất cả phiếu</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 11 Status Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {STATUS_PIPELINE.map((pipe) => {
                const count = tickets.filter((t) => t.status === pipe.key).length;
                const hasTickets = count > 0;
                const IconComponent = pipe.icon;

                return (
                  <div
                    key={pipe.key}
                    onClick={() => onNavigate('tickets')}
                    className={`relative group rounded-xl border border-l-4 ${pipe.borderColor} ${pipe.leftBar} ${pipe.cardBg} p-3.5 cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between`}
                  >
                    <div>
                      {/* Card Top: Icon & Step Tag & Arrow */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-xs ${pipe.iconWrap}`}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/80 text-slate-600 border border-slate-200/60 uppercase tracking-tight">
                            {pipe.stepTag}
                          </span>
                        </div>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>

                      {/* Card Title & Desc */}
                      <h4 className={`text-xs font-bold ${pipe.titleColor} leading-tight line-clamp-1`}>
                        {pipe.label}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                        {pipe.desc}
                      </p>
                    </div>

                    {/* Card Bottom: Count Badge */}
                    <div className="mt-3 pt-2 border-t border-slate-200/50 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 font-medium">
                        {hasTickets ? 'Đang có:' : 'Hiện có:'}
                      </span>
                      {hasTickets ? (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-black ${pipe.badgeActive}`}>
                          <span className="relative flex h-2 w-2">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pipe.dotColor}`} />
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${pipe.dotColor}`} />
                          </span>
                          <span>{count} phiếu</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-400 bg-white/70 px-2 py-0.5 rounded border border-slate-200/60">
                          0
                        </span>
                      )}
                    </div>
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
                  <p className="text-slate-600 leading-snug">{localizeText(log.details)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
