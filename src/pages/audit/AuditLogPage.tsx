import React, { useState } from 'react';
import { StorageService } from '../../services/mockStorage';
import { AuditLog } from '../../types';
import { formatDateTime } from '../../utils/formatters';
import { History, Search, ShieldAlert } from 'lucide-react';

export const AuditLogPage: React.FC = () => {
  const [logs] = useState<AuditLog[]>(() => StorageService.getAuditLogs());
  const [search, setSearch] = useState('');

  const filtered = logs.filter(
    (l) =>
      l.user_name.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.entity_id.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Nhật ký hoạt động hệ thống — Audit Log (UC-27)</h2>
          <p className="text-xs text-slate-500 mt-0.5">Lưu vết toàn bộ thao tác quan trọng: tạo phiếu, sửa báo giá, thu tiền, hủy phiếu và đổi trạng thái.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo nhân viên, hành động, mã phiếu..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 text-xs rounded-xl border border-slate-200 focus:bg-white focus:outline-hidden"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
            <tr>
              <th className="py-3 px-4">Thời gian</th>
              <th className="py-3 px-4">Nhân viên</th>
              <th className="py-3 px-4">Hành động</th>
              <th className="py-3 px-4">Đối tượng</th>
              <th className="py-3 px-4">Chi tiết thao tác</th>
              <th className="py-3 px-4">Địa chỉ IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                  {formatDateTime(log.created_at)}
                </td>
                <td className="py-3 px-4 font-bold text-slate-800">{log.user_name}</td>
                <td className="py-3 px-4">
                  <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded bg-slate-100 text-indigo-800">
                    {log.action}
                  </span>
                </td>
                <td className="py-3 px-4 font-mono font-semibold text-slate-700">{log.entity_id}</td>
                <td className="py-3 px-4 text-slate-700 max-w-md">{log.details}</td>
                <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{log.ip_address || '127.0.0.1'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
