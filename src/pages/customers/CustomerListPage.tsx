import React, { useState } from 'react';
import { StorageService } from '../../services/mockStorage';
import { Customer } from '../../types';
import { formatVND, formatDate } from '../../utils/formatters';
import { Search, Plus, UserPlus, Phone, MapPin, Building, User } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

export const CustomerListPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>(() => StorageService.getCustomers());
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const { showToast } = useToast();

  // Add form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [type, setType] = useState<'individual' | 'company'>('individual');
  const [tax, setTax] = useState('');

  const reload = () => setCustomers(StorageService.getCustomers());

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      showToast('Vui lòng điền họ tên và số điện thoại!', 'error');
      return;
    }
    const newCust = StorageService.addCustomer({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      customer_type: type,
      tax_number: type === 'company' ? tax.trim() : undefined,
      current_debt: 0,
    });
    showToast(`Đã thêm khách hàng ${newCust.name} (${newCust.code})!`, 'success');
    setShowAddModal(false);
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    reload();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Quản lý khách hàng ({customers.length})</h2>
          <p className="text-xs text-slate-500 mt-0.5">Hồ sơ khách hàng cá nhân và doanh nghiệp, lịch sử sửa chữa và quản lý công nợ.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all self-start sm:self-auto cursor-pointer"
        >
          <UserPlus className="w-4 h-4" /> Thêm khách hàng mới
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên khách, SĐT, mã KH..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 text-xs rounded-xl border border-slate-200 focus:bg-white focus:outline-hidden"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
            <tr>
              <th className="py-3 px-4">Mã KH</th>
              <th className="py-3 px-4">Họ tên khách hàng</th>
              <th className="py-3 px-4">Loại KH</th>
              <th className="py-3 px-4">Số điện thoại</th>
              <th className="py-3 px-4">Địa chỉ</th>
              <th className="py-3 px-4 text-right">Công nợ hiện tại</th>
              <th className="py-3 px-4 text-center">Ngày tạo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-3 px-4 font-mono font-bold text-indigo-700">{c.code}</td>
                <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 w-max ${
                    c.customer_type === 'company' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {c.customer_type === 'company' ? <Building className="w-3 h-3" /> : <User className="w-3 h-3" />}
                    {c.customer_type === 'company' ? 'Doanh nghiệp' : 'Cá nhân'}
                  </span>
                </td>
                <td className="py-3 px-4 font-mono font-semibold text-slate-700">{c.phone}</td>
                <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{c.address || '---'}</td>
                <td className="py-3 px-4 text-right font-bold">
                  {c.current_debt > 0 ? (
                    <span className="text-rose-600">{formatVND(c.current_debt)}</span>
                  ) : (
                    <span className="text-slate-400">0 đ</span>
                  )}
                </td>
                <td className="py-3 px-4 text-center text-slate-400">{formatDate(c.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">Thêm khách hàng mới</h3>
            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Họ tên / Tên Doanh nghiệp <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Số điện thoại <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Địa chỉ</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    checked={type === 'individual'}
                    onChange={() => setType('individual')}
                  />
                  <span>Cá nhân</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    checked={type === 'company'}
                    onChange={() => setType('company')}
                  />
                  <span>Doanh nghiệp</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-md shadow-indigo-600/30"
                >
                  Lưu khách hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
