import React, { useState } from 'react';
import { StorageService } from '../../services/mockStorage';
import { RepairTicket, RepairStatus } from '../../types';
import { formatVND, formatDateTime, STATUS_CONFIG, PRIORITY_CONFIG } from '../../utils/formatters';
import { Search, Filter, Printer, ChevronRight, Eye } from 'lucide-react';
import { PrintModal } from '../../components/print/PrintTemplates';

interface TicketListPageProps {
  onSelectTicket: (ticketId: number) => void;
  initialFilter?: RepairStatus | 'ALL';
}

export const TicketListPage: React.FC<TicketListPageProps> = ({ onSelectTicket, initialFilter = 'ALL' }) => {
  const [tickets, setTickets] = useState<RepairTicket[]>(() => StorageService.getTickets());
  const settings = StorageService.getSettings();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter);
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  // Print Modal
  const [printingTicket, setPrintingTicket] = useState<RepairTicket | null>(null);

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.ticket_code.toLowerCase().includes(search.toLowerCase()) ||
      t.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      t.customer_phone.includes(search) ||
      (t.device_serial && t.device_serial.toLowerCase().includes(search.toLowerCase())) ||
      t.device_model.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Danh sách phiếu sửa chữa ({filteredTickets.length})</h2>
          <p className="text-xs text-slate-500 mt-0.5">Quản lý vòng đời sửa chữa, theo dõi tiến độ, chi phí và thanh toán.</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã SC-..., tên khách, SĐT, máy..."
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 text-sm rounded-xl border border-slate-200 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 text-xs font-medium rounded-xl border border-slate-200 focus:bg-white focus:outline-hidden"
            >
              <option value="ALL">Tất cả trạng thái</option>
              {Object.entries(STATUS_CONFIG).map(([k, cfg]) => (
                <option key={k} value={k}>
                  {cfg.label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Ưu tiên:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 text-xs font-medium rounded-xl border border-slate-200 focus:bg-white focus:outline-hidden"
            >
              <option value="ALL">Tất cả mức độ</option>
              <option value="Urgent">Khẩn cấp (Lấy ngay)</option>
              <option value="High">Ưu tiên cao</option>
              <option value="Normal">Bình thường</option>
              <option value="Low">Thấp</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ticket List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredTickets.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="text-sm font-semibold">Không tìm thấy phiếu sửa chữa phù hợp.</p>
            <p className="text-xs text-slate-400 mt-1">Thử thay đổi bộ lọc tìm kiếm hoặc tạo phiếu mới.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Mã phiếu</th>
                  <th className="py-3 px-4">Khách hàng</th>
                  <th className="py-3 px-4">Thiết bị</th>
                  <th className="py-3 px-4">Lỗi mô tả</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4">Kỹ thuật viên</th>
                  <th className="py-3 px-4 text-right">Tổng tiền / Đã thu</th>
                  <th className="py-3 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTickets.map((t) => {
                  const statusConf = STATUS_CONFIG[t.status];
                  const priorityConf = PRIORITY_CONFIG[t.priority];

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-indigo-50/30 transition-colors group cursor-pointer"
                      onClick={() => onSelectTicket(t.id)}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{t.ticket_code}</span>
                          {t.priority !== 'Normal' && (
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold border ${priorityConf.badgeClass}`}>
                              {priorityConf.label}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block font-sans font-normal">
                          {formatDateTime(t.created_at)}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{t.customer_name}</div>
                        <div className="text-slate-500 font-mono text-[11px]">{t.customer_phone}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">
                          {t.device_brand} {t.device_model}
                        </div>
                        <div className="text-slate-400 text-[11px]">
                          {t.device_serial ? `S/N: ${t.device_serial}` : t.device_category}
                        </div>
                      </td>

                      <td className="py-3 px-4 max-w-xs truncate text-slate-600" title={t.defect_description}>
                        {t.defect_description}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}>
                          {statusConf.label}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {t.primary_technician_name || <span className="text-slate-400 italic">Chưa giao</span>}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="font-bold text-slate-900">
                          {t.final_amount > 0 ? formatVND(t.final_amount) : <span className="text-slate-400 font-normal">Chờ báo giá</span>}
                        </div>
                        {t.debt_amount > 0 ? (
                          <div className="text-rose-600 font-semibold text-[11px]">Còn nợ: {formatVND(t.debt_amount)}</div>
                        ) : t.paid_amount > 0 ? (
                          <div className="text-emerald-600 font-semibold text-[11px]">Đã đủ</div>
                        ) : null}
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onSelectTicket(t.id)}
                            title="Xem chi tiết"
                            className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setPrintingTicket(t)}
                            title="In phiếu tiếp nhận"
                            className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Print modal */}
      {printingTicket && (
        <PrintModal
          ticket={printingTicket}
          settings={settings}
          type="intake"
          onClose={() => setPrintingTicket(null)}
        />
      )}
    </div>
  );
};
