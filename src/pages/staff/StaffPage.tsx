import React, { useState } from 'react';
import { StorageService } from '../../services/mockStorage';
import { ApiClient } from '../../services/apiClient';
import { User, UserRole } from '../../types';
import { Plus, Key, Lock, Check, Copy } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

export const StaffPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>(() => StorageService.getUsers());
  const [showAddModal, setShowAddModal] = useState(false);
  const [tempPasswordModal, setTempPasswordModal] = useState<{ fullName: string; username: string; password: string } | null>(null);
  const { showToast } = useToast();

  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('technician');

  const reload = () => setUsers(StorageService.getUsers());

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !fullName.trim() || !email.trim()) {
      showToast('Vui lòng điền đủ thông tin!', 'error');
      return;
    }

    try {
      const res = await ApiClient.requestStrict<{ user: User; temporaryPassword?: string }>('/users', {
        method: 'POST',
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          role,
        }),
      });

      const currentList = StorageService.getUsers();
      currentList.push(res.user);
      StorageService.saveUsersLocalOnly(currentList);

      showToast(`Đã thêm nhân viên ${res.user.full_name} (${res.user.role})!`, 'success');
      setShowAddModal(false);
      setUsername('');
      setFullName('');
      setEmail('');
      setPhone('');
      reload();

      if (res.temporaryPassword) {
        setTempPasswordModal({
          fullName: res.user.full_name,
          username: res.user.username,
          password: res.temporaryPassword,
        });
      }
    } catch (err: any) {
      showToast(err?.message || 'Không thể tạo tài khoản nhân viên!', 'error');
    }
  };

  const handleToggleStatus = async (userId: number) => {
    const list = StorageService.getUsers();
    const idx = list.findIndex((u) => u.id === userId);
    if (idx === -1) return;

    const target = list[idx];
    if (target.role === 'admin' && target.username === 'admin') {
      showToast('Không thể khóa tài khoản Quản trị viên tối cao!', 'error');
      return;
    }

    try {
      const res = await ApiClient.requestStrict<{ user: User }>(`/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: !target.is_active }),
      });
      StorageService.updateUserLocalOnly(res.user);
      showToast(`Đã ${res.user.is_active ? 'kích hoạt' : 'tạm khóa'} tài khoản ${res.user.full_name}!`, 'info');
      reload();
    } catch (err: any) {
      showToast(err?.message || 'Không thể cập nhật trạng thái tài khoản!', 'error');
    }
  };

  // P0-2: Server generates temporary password and sets must_change_password = 1
  const handleResetPassword = async (u: User) => {
    try {
      const res = await ApiClient.requestStrict<{ ok: boolean; temporaryPassword: string; message: string }>(
        `/users/${u.id}/reset-password`,
        { method: 'POST', body: JSON.stringify({}) }
      );
      setTempPasswordModal({
        fullName: u.full_name,
        username: u.username,
        password: res.temporaryPassword,
      });
      showToast(res.message || `Đã cấp mật khẩu tạm thời mới cho ${u.full_name}!`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Không thể đặt lại mật khẩu!', 'error');
    }
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
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      u.role === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : u.role === 'manager'
                        ? 'bg-blue-100 text-blue-800'
                        : u.role === 'technician'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      u.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {u.is_active ? 'Đang hoạt động' : 'Tạm khóa'}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => handleResetPassword(u)}
                      title="Cấp lại mật khẩu tạm thời (Sinh ngẫu nhiên trên Server)"
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                    >
                      <Key className="w-4 h-4" />
                    </button>
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => handleToggleStatus(u.id)}
                        title={u.is_active ? 'Tạm khóa tài khoản' : 'Mở khóa tài khoản'}
                        className={`p-1.5 rounded-lg cursor-pointer ${
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
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-md shadow-indigo-600/30 cursor-pointer"
                >
                  Tạo tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Server-generated Temporary Password Display Modal */}
      {tempPasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
              Mật khẩu tạm thời một lần
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Hệ thống đã tạo mật khẩu tạm thời cho nhân viên <strong>{tempPasswordModal.fullName}</strong> (@
              {tempPasswordModal.username}). Vui lòng sao chép và gửi cho nhân viên:
            </p>
            <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between">
              <span className="font-mono font-bold text-base text-indigo-900 select-all">
                {tempPasswordModal.password}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(tempPasswordModal.password);
                  showToast('Đã sao chép mật khẩu tạm thời!', 'info');
                }}
                className="px-3 py-1.5 bg-white hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-200 flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" /> Sao chép
              </button>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setTempPasswordModal(null)}
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Đã lưu lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
