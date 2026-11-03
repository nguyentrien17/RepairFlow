import React, { useState } from 'react';
import { StorageService } from '../../services/mockStorage';
import { CustomerDevice, DeviceCategory, DeviceBrand } from '../../types';
import { Laptop, Search, Plus, Tag } from 'lucide-react';

export const DeviceListPage: React.FC = () => {
  const [devices] = useState<CustomerDevice[]>(() => StorageService.getDevices());
  const [categories] = useState<DeviceCategory[]>(() => StorageService.getCategories());
  const [brands] = useState<DeviceBrand[]>(() => StorageService.getBrands());
  const [search, setSearch] = useState('');

  const filtered = devices.filter(
    (d) =>
      d.model_name.toLowerCase().includes(search.toLowerCase()) ||
      (d.serial_number && d.serial_number.toLowerCase().includes(search.toLowerCase())) ||
      (d.customer_name && d.customer_name.toLowerCase().includes(search.toLowerCase())) ||
      (d.customer_phone && d.customer_phone.includes(search))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Quản lý thiết bị & Danh mục (UC-06, UC-07)</h2>
          <p className="text-xs text-slate-500 mt-0.5">Hồ sơ thiết bị liên kết với khách hàng, tra cứu Serial/IMEI và quản lý hãng/model.</p>
        </div>
      </div>

      {/* Categories & Brands quick chips */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="font-bold text-slate-500">Loại thiết bị:</span>
          {categories.map((c) => (
            <span key={c.id} className="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700 font-medium">
              {c.name}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap text-xs pt-2 border-t border-slate-100">
          <span className="font-bold text-slate-500">Hãng sản xuất:</span>
          {brands.map((b) => (
            <span key={b.id} className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-md font-semibold text-[11px]">
              {b.name}
            </span>
          ))}
        </div>
      </div>

      {/* Devices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo Model, Serial/IMEI, tên khách..."
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 text-xs rounded-xl border border-slate-200 focus:bg-white focus:outline-hidden"
            />
          </div>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
            <tr>
              <th className="py-3 px-4">Tên dòng máy (Model)</th>
              <th className="py-3 px-4">Loại máy</th>
              <th className="py-3 px-4">Hãng</th>
              <th className="py-3 px-4">Số Serial / IMEI</th>
              <th className="py-3 px-4">Khách hàng sở hữu</th>
              <th className="py-3 px-4">Màu sắc</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50">
                <td className="py-3 px-4 font-bold text-slate-900">{d.model_name}</td>
                <td className="py-3 px-4 text-slate-600">{d.category_name}</td>
                <td className="py-3 px-4">
                  <span className="font-semibold text-indigo-700">{d.brand_name}</span>
                </td>
                <td className="py-3 px-4 font-mono font-medium text-slate-700">{d.serial_number || d.imei || '---'}</td>
                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-800">{d.customer_name}</div>
                  <div className="text-[11px] font-mono text-slate-500">{d.customer_phone}</div>
                </td>
                <td className="py-3 px-4 text-slate-500">{d.color || '---'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
