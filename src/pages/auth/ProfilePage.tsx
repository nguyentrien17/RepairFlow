import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  Key,
  Lock,
  Mail,
  Phone,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  LogOut,
  Save,
  Eye,
  EyeOff,
  History,
  Shield,
  BadgeCheck,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { StorageService } from '../../services/mockStorage';
import { formatDateTime, localizeText } from '../../utils/formatters';
import { LogoutConfirmModal } from '../../components/common/LogoutConfirmModal';

const ROLE_DISPLAY_CONFIG: Record<
  string,
  { label: string; badgeClass: string; desc: string }
> = {
  admin: {
    label: 'Quản trị viên tối cao (Admin)',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
    desc: 'Toàn quyền kiểm soát toàn bộ hệ thống, phân quyền, cấu hình và tài chính',
  },
  manager: {
    label: 'Quản lý cửa hàng (Manager)',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    desc: 'Điều phối quy trình sửa chữa, giám sát tiến độ KTV, duyệt báo cáo và kho',
  },
  receptionist: {
    label: 'Lễ tân & Thu ngân (Front Desk / Cashier)',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    desc: 'Tiếp nhận máy mới, in phiếu biên nhận, thu tiền, thanh toán VietQR và bàn giao',
  },
  technician: {
    label: 'Kỹ thuật viên sửa chữa (Technician)',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-300',
    desc: 'Đo kiểm chẩn đoán lỗi, lập báo giá linh kiện, xử lý kỹ thuật và QC chất lượng',
  },
};

const PERMISSIONS_LIST = [
  {
    module: 'Tiếp nhận thiết bị (Intake)',
    desc: 'Tạo phiếu sửa chữa mới, in phiếu biên nhận cho khách',
    roles: ['admin', 'manager', 'receptionist'],
  },
  {
    module: 'Chẩn đoán & Đo kiểm lỗi',
    desc: 'Kiểm tra phần cứng, đo nguồn, xác định linh kiện hư hỏng',
    roles: ['admin', 'manager', 'technician'],
  },
  {
    module: 'Lập báo giá & Duyệt phương án',
    desc: 'Lập danh mục linh kiện, tiền công và cập nhật phản hồi khách',
    roles: ['admin', 'manager', 'technician'],
  },
  {
    module: 'Chuyển trạng thái sửa chữa',
    desc: 'Cập nhật tiến trình qua 11 giai đoạn sửa chữa',
    roles: ['admin', 'manager', 'technician', 'receptionist'],
  },
  {
    module: 'Quản lý kho linh kiện (Inventory)',
    desc: 'Nhập xuất tồn kho, cảnh báo linh kiện sắp hết',
    roles: ['admin', 'manager'],
  },
  {
    module: 'Thu tiền & Tạo mã VietQR (Payment)',
    desc: 'Xác nhận thu tiền, quét mã VietQR, thanh toán nợ',
    roles: ['admin', 'manager', 'receptionist'],
  },
  {
    module: 'Báo cáo doanh thu & Lợi nhuận',
    desc: 'Xem biểu đồ tài chính, tổng doanh số và công nợ',
    roles: ['admin', 'manager'],
  },
  {
    module: 'Quản lý nhân viên & Phân quyền',
    desc: 'Thêm mới nhân viên, cấp tài khoản và khóa truy cập',
    roles: ['admin'],
  },
  {
    module: 'Cấu hình hệ thống & Khuyến mãi',
    desc: 'Sửa thông tin cửa hàng, ngân hàng VietQR, điều khoản phiếu',
    roles: ['admin'],
  },
];

export const ProfilePage: React.FC = () => {
  const { currentUser, updateProfile, changePassword, logout } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'info' | 'password' | 'permissions' | 'activity'>('info');

  // Form states
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [isSavingInfo, setIsSavingInfo] = useState(false);

  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  if (!currentUser) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-600">Bạn chưa đăng nhập vào hệ thống.</p>
      </div>
    );
  }

  const roleInfo = ROLE_DISPLAY_CONFIG[currentUser.role] || {
    label: currentUser.role,
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
    desc: 'Tài khoản nhân viên',
  };

  const handleUpdateInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast('Vui lòng nhập họ và tên!', 'error');
      return;
    }
    if (!email.trim()) {
      showToast('Vui lòng nhập địa chỉ email!', 'error');
      return;
    }

    setIsSavingInfo(true);
    setTimeout(() => {
      const res = updateProfile({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });
      setIsSavingInfo(false);

      if (res.success) {
        showToast('Cập nhật hồ sơ thành công!', 'success');
      } else {
        showToast(res.message || 'Cập nhật thất bại', 'error');
      }
    }, 200);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      showToast('Vui lòng nhập mật khẩu hiện tại!', 'error');
      return;
    }

    if (newPassword.length < 3) {
      showToast('Mật khẩu mới phải có ít nhất 3 ký tự!', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('Mật khẩu xác nhận không khớp với mật khẩu mới!', 'error');
      return;
    }

    setIsSavingPassword(true);
    setTimeout(() => {
      const res = changePassword(currentPassword, newPassword);
      setIsSavingPassword(false);

      if (res.success) {
        showToast('Đổi mật khẩu thành công!', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast(res.message || 'Không thể đổi mật khẩu', 'error');
      }
    }, 250);
  };

  // Get user's activity audit logs
  const allLogs = StorageService.getAuditLogs();
  const userLogs = allLogs.filter(
    (l) =>
      l.user_id === currentUser.id ||
      l.details?.toLowerCase().includes(currentUser.full_name.toLowerCase()) ||
      l.details?.toLowerCase().includes(currentUser.username.toLowerCase())
  ).slice(0, 15);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Profile Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 relative p-6 flex justify-between items-start">
          <div className="flex items-center gap-2 text-indigo-100 text-xs font-semibold">
            <UserCheck className="w-4 h-4 text-indigo-200" />
            <span>HỒ SƠ TÀI KHOẢN NGƯỜI DÙNG</span>
          </div>

          <button
            onClick={() => setShowLogoutModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-xs border border-white/20 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Đăng xuất</span>
          </button>
        </div>

        {/* Profile Card Body */}
        <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
            {/* Avatar Circle */}
            <div className="w-24 h-24 rounded-2xl bg-white p-1.5 shadow-lg shrink-0">
              <div className="w-full h-full rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white font-black text-2xl flex items-center justify-center shadow-inner">
                {currentUser.full_name.charAt(0)}
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl font-black text-slate-900">{currentUser.full_name}</h2>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${roleInfo.badgeClass}`}>
                  {roleInfo.label}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Đang hoạt động
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Tên đăng nhập: <span className="font-mono font-bold text-indigo-700">{currentUser.username}</span> • {roleInfo.desc}
              </p>
            </div>
          </div>

          <div className="text-right text-xs text-slate-400 shrink-0 self-center sm:self-end">
            <p>Đăng nhập lần cuối: <span className="font-semibold text-slate-700">{formatDateTime(currentUser.last_login_at)}</span></p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-t border-slate-100 px-6 overflow-x-auto bg-slate-50/50">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-3.5 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'info'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Thông tin cá nhân</span>
          </button>

          <button
            onClick={() => setActiveTab('password')}
            className={`py-3.5 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'password'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Đổi mật khẩu & Bảo mật</span>
          </button>

          <button
            onClick={() => setActiveTab('permissions')}
            className={`py-3.5 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'permissions'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Phân quyền vai trò (RBAC)</span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`py-3.5 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'activity'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Nhật ký hoạt động</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Personal Information Form */}
      {activeTab === 'info' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <div className="max-w-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-1">Cập nhật thông tin tài khoản</h3>
            <p className="text-xs text-slate-500 mb-6">
              Thông tin hiển thị khi lập phiếu, chuyển trạng thái sửa chữa và đối soát thu tiền.
            </p>

            <form onSubmit={handleUpdateInfo} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Họ và tên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-hidden focus:border-indigo-500 bg-slate-50 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tên đăng nhập (Username)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={currentUser.username}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold text-slate-500 bg-slate-100 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Địa chỉ Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-hidden focus:border-indigo-500 bg-slate-50 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Số điện thoại liên hệ
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-hidden focus:border-indigo-500 bg-slate-50 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Vai trò hiện tại
                  </label>
                  <div className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>{roleInfo.label}</span>
                    <Shield className="w-4 h-4 text-indigo-600" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Ngày khởi tạo tài khoản
                  </label>
                  <div className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>{formatDateTime(currentUser.created_at)}</span>
                    <Calendar className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingInfo}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingInfo ? 'Đang lưu...' : 'Lưu thay đổi hồ sơ'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 2: Change Password Form */}
      {activeTab === 'password' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <div className="max-w-xl">
            <h3 className="text-base font-bold text-slate-900 mb-1">Bảo mật & Đổi mật khẩu</h3>
            <p className="text-xs text-slate-500 mb-6">
              Khuyến nghị đặt mật khẩu có độ dài tối thiểu từ 6 ký tự để bảo vệ tài khoản khỏi truy cập trái phép.
            </p>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mật khẩu hiện tại <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu đang dùng..."
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-hidden focus:border-indigo-500 bg-slate-50 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mật khẩu mới <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới..."
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-hidden focus:border-indigo-500 bg-slate-50 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Xác nhận lại mật khẩu mới <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-hidden focus:border-indigo-500 bg-slate-50 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isSavingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu mới'}</span>
                </button>
              </div>
            </form>

            {/* Session & Logout Section */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-rose-50/50 border border-rose-100">
              <div>
                <h4 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>Kết thúc phiên làm việc</span>
                </h4>
                <p className="text-[11px] text-rose-600/80 mt-0.5">
                  Đăng xuất khỏi thiết bị này để đảm bảo an toàn dữ liệu và quyền truy cập ca làm việc.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowLogoutModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm shadow-rose-200 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất tài khoản</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: RBAC Role Permissions */}
      {activeTab === 'permissions' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-slate-100 gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">Phân quyền tài khoản theo vai trò (RBAC)</h3>
              <p className="text-xs text-slate-500 mt-1">
                Các quyền hạn thực thi chức năng tương ứng với chức danh: <span className="font-bold text-indigo-700">{roleInfo.label}</span>
              </p>
            </div>
            <span className="text-xs px-3 py-1 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {currentUser.role === 'admin' ? 'Quyền tối cao: 100%' : 'Quyền theo phân công'}
            </span>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
            {PERMISSIONS_LIST.map((p, idx) => {
              const isAllowed = currentUser.role === 'admin' || p.roles.includes(currentUser.role);

              return (
                <div
                  key={idx}
                  className={`p-4 flex items-center justify-between transition-colors ${
                    isAllowed ? 'bg-white' : 'bg-slate-50/70'
                  }`}
                >
                  <div className="pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{p.module}</span>
                      {isAllowed && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
                          Cho phép
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{p.desc}</p>
                  </div>

                  <div className="shrink-0">
                    {isAllowed ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Được cấp quyền</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
                        <XCircle className="w-4 h-4 text-slate-400" />
                        <span>Không có quyền</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: User's Activity Log */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Nhật ký hoạt động của tài khoản</h3>
              <p className="text-xs text-slate-500 mt-1">
                Lịch sử các thao tác nghiệp vụ, đổi trạng thái phiếu và thu chi được ghi nhận bởi tài khoản này.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              {userLogs.length} thao tác gần nhất
            </span>
          </div>

          {userLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Chưa có nhật ký hoạt động nào được ghi nhận cho tài khoản này.
            </div>
          ) : (
            <div className="space-y-3">
              {userLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-700 font-mono">
                        {log.action}
                      </span>
                      {log.entity_id && (
                        <span className="text-[11px] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700">
                          {log.entity_id}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 mt-1">{localizeText(log.details)}</p>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0 font-medium whitespace-nowrap">
                    {formatDateTime(log.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={() => {
          logout();
          showToast('Đã đăng xuất tài khoản thành công!', 'info');
        }}
      />
    </div>
  );
};
