import React, { useState } from 'react';
import { StorageService } from '../../services/mockStorage';
import { Warranty } from '../../types';
import { formatDate } from '../../utils/formatters';
import { ShieldCheck, Search, CheckCircle2, Clock } from 'lucide-react';

export const WarrantyListPage: React.FC = () => {
  const [warranties] = useState<Warranty[]>(() => StorageService.getWarranties());
  const [search, setSearch] = useState('');

  const filtered = warranties.filter(
    (w) =>
      w.warranty_code.toLowerCase().includes(search.toLowerCase()) ||
      w.ticket_code.toLowerCase().includes(search.toLowerCase()) ||
      w.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      w.customer_phone.includes(search) ||
      w.device_summary.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Sổ quản lý bảo hành thiết bị (UC-24)</h2>
          <p className="text-xs text-slate-500 mt-0.5">Tra cứu thời hạn bảo hành điện tử theo số điện thoại, Serial máy hoặc mã phiếu sửa gốc.</p>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tra cứu bảo hành theo mã BH, mã phiếu SC-..., SĐT khách..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 text-xs rounded-xl border border-slate-200 focus:bg-white focus:outline-hidden"
          />
        </div>
      </div>

      {/* Warranty Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
            <tr>
              <th className="py-3 px-4">Mã bảo hành</th>
              <th className="py-3 px-4">Phiếu gốc</th>
              <th className="py-3 px-4">Khách hàng & SĐT</th>
              <th className="py-3 px-4">Thiết bị bảo hành</th>
              <th className="py-3 px-4">Ngày bắt đầu</th>
              <th className="py-3 px-4">Ngày hết hạn</th>
              <th className="py-3 px-4 text-center">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((w) => {
              const isExpired = new Date(w.end_date).getTime() < new Date().getTime();
              return (
                <tr key={w.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-700">{w.warranty_code}</td>
                  <td className="py-3 px-4 font-mono text-slate-800 font-semibold">{w.ticket_code}</td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{w.customer_name}</div>
                    <div className="text-slate-500 font-mono text-[11px]">{w.customer_phone}</div>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">{w.device_summary}</td>
                  <td className="py-3 px-4 text-slate-600">{formatDate(w.start_date)}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{formatDate(w.end_date)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                      isExpired ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {isExpired ? <Clock className="w-3 h-3 text-slate-500" /> : <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                      {isExpired ? 'Hết hạn' : 'Còn hiệu lực'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
