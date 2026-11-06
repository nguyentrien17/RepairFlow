import React, { useState } from 'react';
import { StorageService } from '../../services/mockStorage';
import { RepairTicket, RepairStatus } from '../../types';
import { formatVND, STATUS_CONFIG, PRIORITY_CONFIG } from '../../utils/formatters';
import { ChevronLeft, ChevronRight, Wrench, Eye } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface KanbanPageProps {
  onSelectTicket: (ticketId: number) => void;
}

const KANBAN_COLUMNS: { status: RepairStatus; label: string }[] = [
  { status: 'Received', label: '1. Tiếp nhận' },
  { status: 'Diagnosing', label: '2. Đang kiểm tra' },
  { status: 'Waiting_Approval', label: '3. Chờ khách duyệt' },
  { status: 'Waiting_Parts', label: '4. Chờ linh kiện' },
  { status: 'In_Progress', label: '5. Đang sửa chữa' },
  { status: 'Quality_Check', label: '6. Kiểm tra QC' },
  { status: 'Ready_For_Pickup', label: '7. Chờ khách nhận' },
  { status: 'Delivered', label: '8. Đã bàn giao' },
];

export const KanbanPage: React.FC<KanbanPageProps> = ({ onSelectTicket }) => {
  const [tickets, setTickets] = useState<RepairTicket[]>(() => StorageService.getTickets());
  const [movingTicketId, setMovingTicketId] = useState<number | null>(null);
  const { showToast } = useToast();

  const reload = () => setTickets(StorageService.getTickets());

  const handleMoveStatus = async (ticketId: number, currentStatus: RepairStatus, direction: 'next' | 'prev') => {
    const colIndex = KANBAN_COLUMNS.findIndex((c) => c.status === currentStatus);
    if (colIndex === -1) return;

    const newIndex = direction === 'next' ? colIndex + 1 : colIndex - 1;
    if (newIndex < 0 || newIndex >= KANBAN_COLUMNS.length) return;

    const targetStatus = KANBAN_COLUMNS[newIndex].status;
    setMovingTicketId(ticketId);
    try {
      await StorageService.transitionTicketAsync(ticketId, targetStatus);
      showToast(`Đã chuyển sang ${STATUS_CONFIG[targetStatus].label}`, 'success');
      reload();
    } catch (err: any) {
      showToast(err?.message || 'Không thể chuyển trạng thái phiếu sửa chữa!', 'error');
    } finally {
      setMovingTicketId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Bảng Kanban tiến độ sửa chữa (UC-14)</h2>
        <p className="text-xs text-slate-500 mt-0.5">Theo dõi trực quan dòng chảy công việc qua 8 giai đoạn cốt lõi.</p>
      </div>

      {/* Horizontal Scroll Columns */}
      <div className="flex gap-3 overflow-x-auto pb-4 pt-1 items-start min-h-[calc(100vh-210px)]">
        {KANBAN_COLUMNS.map((col, idx) => {
          const colTickets = tickets.filter((t) => t.status === col.status);
          const cfg = STATUS_CONFIG[col.status];

          return (
            <div
              key={col.status}
              className="w-72 shrink-0 bg-slate-100 rounded-2xl border border-slate-200/80 p-3 flex flex-col max-h-[80vh] shadow-xs"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                <span className="font-bold text-xs text-slate-800">{col.label}</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-700 shadow-xs">
                  {colTickets.length}
                </span>
              </div>

              {/* Column Cards */}
              <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
                {colTickets.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs italic">
                    Không có phiếu
                  </div>
                ) : (
                  colTickets.map((t) => {
                    const priorityConf = PRIORITY_CONFIG[t.priority];
                    return (
                      <div
                        key={t.id}
                        className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-2 group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-indigo-700">{t.ticket_code}</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold border ${priorityConf.badgeClass}`}>
                            {priorityConf.label}
                          </span>
                        </div>

                        <div>
                          <p className="font-bold text-xs text-slate-900 line-clamp-1">
                            {t.device_brand} {t.device_model}
                          </p>
                          <p className="text-[11px] text-slate-500">Khách: {t.customer_name}</p>
                        </div>

                        <p className="text-[11px] text-slate-600 line-clamp-2 italic bg-slate-50 p-1.5 rounded border border-slate-100">
                          "{t.defect_description}"
                        </p>

                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                          <span className="font-bold text-slate-800">
                            {t.final_amount > 0 ? formatVND(t.final_amount) : '---'}
                          </span>
                          <span className="text-slate-400 truncate max-w-[100px] text-right">
                            {t.primary_technician_name ? t.primary_technician_name.split(' ')[0] : 'Chưa giao'}
                          </span>
                        </div>

                        {/* Move Actions */}
                        <div className="flex items-center justify-between pt-1">
                          <button
                            disabled={idx === 0 || movingTicketId === t.id}
                            onClick={() => handleMoveStatus(t.id, t.status, 'prev')}
                            title="Lùi trạng thái"
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onSelectTicket(t.id)}
                            className="px-2.5 py-1 text-[11px] font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg flex items-center gap-1 transition-colors"
                          >
                            <Eye className="w-3 h-3" /> Chi tiết
                          </button>

                          <button
                            disabled={idx === KANBAN_COLUMNS.length - 1 || movingTicketId === t.id}
                            onClick={() => handleMoveStatus(t.id, t.status, 'next')}
                            title="Tiến trạng thái"
                            className="p-1 text-indigo-600 hover:text-indigo-800 disabled:opacity-30 rounded hover:bg-indigo-50"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
