import React, { useState } from 'react';
import { StorageService } from '../../services/mockStorage';
import { User, UserRole } from '../../types';
import { formatDateTime } from '../../utils/formatters';
import { UserCog, Plus, ShieldCheck, Key, Lock, Check, X } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

export const StaffPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>(() => StorageService.getUsers());
  const [showAddModal, setShowAddModal] = useState(false);
  const { showToast } = useToast();

  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('technician');

  const reload = () => setUsers(StorageService.getUsers());

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !fullName.trim() || !email.trim()) {
      showToast('Vui lòng điền đủ thông tin!', 'error');
      return;
    }
    const currentList = StorageService.getUsers();
    const newId = currentList.length > 0 ? Math.max(...currentList.map((u) => u.id)) + 1 : 1;
    const newUser: User = {
      id: newId,
      username: username.trim().toLowerCase(),
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      role,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    currentList.push(newUser);
    StorageService.saveUsers(currentList);
    showToast(`Đã thêm nhân viên ${newUser.full_name} (${newUser.role})!`, 'success');
    setShowAddModal(false);
    setUsername('');
    setFullName('');
    setEmail('');
    setPhone('');
    reload();
  };

  const handleToggleStatus = (userId: number) => {
    const list = StorageService.getUsers();
    const idx = list.findIndex((u) => u.id === userId);
    if (idx !== -1) {
      if (list[idx].role === 'admin') {
        showToast('Không thể khóa tài khoản Quản trị viên tối cao!', 'error');
        return;
      }
      list[idx].is_active = !list[idx].is_active;
      StorageService.saveUsers(list);
      showToast(`Đã ${list[idx].is_active ? 'kích hoạt' : 'tạm khóa'} tài khoản ${list[idx].full_name}!`, 'info');
      reload();
    }
  };

  const handleResetPassword = (fullName: string) => {
    showToast(`Đã đặt lại mật khẩu mặc định (123456) cho nhân viên ${fullName}!`, 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Quản lý nhân viên & Phân quyền (UC-02, UC-03)</h2>
          <p className="text-xs text-slate-500 mt-0.5">Quản lý tài khoản, gán vai trò RBAC và kiểm soát quyền truy cập hệ thống.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Thêm tài khoản nhân viên
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
            <tr>
              <th className="py-3 px-4">Tên đăng nhập</th>
              <th className="py-3 px-4">Họ và tên</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Số điện thoại</th>
              <th className="py-3 px-4">Vai trò (Role)</th>
              <th className="py-3 px-4 text-center">Trạng thái</th>
              <th className="py-3 px-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="py-3 px-4 font-mono font-bold text-indigo-700">@{u.username}</td>
                <td className="py-3 px-4 font-bold text-slate-900">{u.full_name}</td>
                <td className="py-3 px-4 text-slate-600 font-mono">{u.email}</td>
                <td className="py-3 px-4 font-mono">{u.phone}</td>
                <td className="py-3 px-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    u.role === 'admin'
                      ? 'bg-purple-100 text-purple-800'
                      : u.role === 'manager'
                      ? 'bg-blue-100 text-blue-800'
                      : u.role === 'technician'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-800'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    u.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {u.is_active ? 'Đang hoạt động' : 'Tạm khóa'}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => handleResetPassword(u.full_name)}
                      title="Đặt lại mật khẩu"
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg"
                    >
                      <Key className="w-4 h-4" />
                    </button>
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => handleToggleStatus(u.id)}
                        title={u.is_active ? 'Tạm khóa tài khoản' : 'Mở khóa tài khoản'}
                        className={`p-1.5 rounded-lg ${
                          u.is_active ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {u.is_active ? <Lock className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">Thêm nhân viên mới</h3>
            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Lê Văn Kỹ Thuật"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tên đăng nhập <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="kythuat2"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Vai trò <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="receptionist">Lễ tân & Thu ngân (Tiếp nhận / Thu tiền)</option>
                    <option value="technician">Kỹ thuật viên</option>
                    <option value="manager">Quản lý (Manager)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@repairflow.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Số điện thoại</label>
                <input
                  type="tel"
                  placeholder="0901234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
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
                  Tạo tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
