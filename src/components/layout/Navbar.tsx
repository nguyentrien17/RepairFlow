import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import {
  Wrench,
  Search,
  UserCheck,
  RotateCcw,
  ExternalLink,
  ChevronDown,
  User,
  Key,
  LogOut,
  Database,
} from 'lucide-react';
import { StorageService } from '../../services/mockStorage';
import { ApiClient, SqlBackendStatus } from '../../services/apiClient';
import { useToast } from '../../contexts/ToastContext';
import { LogoutConfirmModal } from '../common/LogoutConfirmModal';

interface NavbarProps {
  onSearchSelect?: (ticketId: number) => void;
  onOpenLookup?: () => void;
  onOpenProfile?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSearchSelect, onOpenLookup, onOpenProfile }) => {
  const { currentUser, switchRole, logout } = useAuth();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [dbStatus, setDbStatus] = useState<SqlBackendStatus>(() => ApiClient.getStatus());

  useEffect(() => {
    const onStatusChange = (e: Event) => {
      const custom = e as CustomEvent<SqlBackendStatus>;
      if (custom.detail) setDbStatus(custom.detail);
    };
    window.addEventListener('repairflow_db_status', onStatusChange);
    return () => window.removeEventListener('repairflow_db_status', onStatusChange);
  }, []);

  const handleReconnectMySQL = async () => {
    // Reconnect + DB connection details are admin-only on the server; other roles just re-sync data
    if (currentUser?.role !== 'admin') {
      await StorageService.syncFromBackend();
      showToast('Đã đồng bộ dữ liệu mới nhất từ máy chủ.', 'success');
      return;
    }
    const status = await ApiClient.reconnectMySQL();
    await StorageService.syncFromBackend();
    if (status.connected) {
      showToast(`Đã kết nối trực tiếp tới MySQL (${status.host}:${status.port}/${status.database}) qua Drizzle ORM!`, 'success');
    } else {
      showToast(
        `Không thể kết nối tới MySQL (${status.host || '127.0.0.1'}:${status.port || 3306}). Vui lòng kiểm tra dịch vụ MySQL.`,
        'error'
      );
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const tickets = StorageService.getTickets();
    const queryLower = q.toLowerCase();
    const matches = tickets.filter(
      (t) =>
        t.ticket_code.toLowerCase().includes(queryLower) ||
        t.customer_name.toLowerCase().includes(queryLower) ||
        t.customer_phone.includes(queryLower) ||
        (t.device_serial && t.device_serial.toLowerCase().includes(queryLower)) ||
        t.device_model.toLowerCase().includes(queryLower)
    );
    setSearchResults(matches.slice(0, 5));
  };

  const handleConfirmReset = () => {
    StorageService.resetToSampleData();
    showToast('Đã khôi phục dữ liệu mẫu thành công!', 'info');
    setShowResetConfirm(false);
    setTimeout(() => {
      window.location.reload();
    }, 400);
  };

  const handleConfirmLogout = () => {
    logout();
    showToast('Đã đăng xuất khỏi hệ thống thành công!', 'info');
  };

  return (
    <header className="h-16 bg-gradient-to-r from-indigo-700 via-blue-600 to-sky-600 text-white border-b border-blue-700/50 shadow-md px-4 lg:px-6 flex items-center justify-between shrink-0 z-30 no-print select-none">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white text-indigo-700 flex items-center justify-center shadow-md ring-2 ring-white/30">
          <Wrench className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-extrabold text-white tracking-tight text-lg drop-shadow-2xs">
              RepairFlow
            </h1>
            <span className="text-[11px] font-extrabold bg-amber-300 text-slate-950 px-2 py-0.5 rounded-md shadow-2xs">
              v2.5
            </span>
          </div>
          <p className="text-xs text-sky-100 font-medium hidden sm:block">Quản lý tiếp nhận & sửa chữa thiết bị điện tử</p>
        </div>
      </div>

      {/* Global Search Bar (UC-30) */}
      <div className="relative max-w-md w-full mx-4 hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 text-indigo-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Tìm theo mã SC-..., Tên khách, SĐT, Serial thiết bị..."
            className="w-full pl-10 pr-4 py-2 bg-white/95 hover:bg-white focus:bg-white text-sm rounded-xl border border-white/40 focus:border-amber-300 focus:ring-2 focus:ring-amber-300/30 focus:outline-hidden transition-all text-slate-800 placeholder-slate-400 shadow-inner"
          />
        </div>

        {/* Search Results Dropdown */}
        {isSearching && searchResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 text-slate-800">
            <div className="p-2 text-xs font-semibold text-slate-500 uppercase border-b border-slate-100 bg-slate-50">
              Kết quả tìm kiếm ({searchResults.length})
            </div>
            {searchResults.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  onSearchSelect?.(t.id);
                  setSearchQuery('');
                  setIsSearching(false);
                }}
                className="w-full text-left p-3 hover:bg-indigo-50/50 transition-colors border-b border-slate-100 last:border-b-0 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono text-xs text-indigo-700">{t.ticket_code}</span>
                    <span className="font-medium text-slate-800 text-sm">{t.device_brand} {t.device_model}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Khách: {t.customer_name} ({t.customer_phone})</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                  {t.status}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Controls: Role Switcher & Action Tools */}
      <div className="flex items-center gap-2">
        {/* MySQL + Drizzle ORM Status Badge */}
        <button
          onClick={handleReconnectMySQL}
          title={
            dbStatus.connected
              ? `Đang kết nối MySQL (${dbStatus.host}:${dbStatus.port}/${dbStatus.database}) qua Drizzle ORM - Nhấn để đồng bộ`
              : `Chưa kết nối MySQL (${dbStatus.host || '127.0.0.1'}:${dbStatus.port || 3306}) - Nhấn để kết nối lại`
          }
          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 border transition-colors cursor-pointer ${
            dbStatus.connected
              ? 'bg-white/20 text-white border-white/35 hover:bg-white/30'
              : 'bg-amber-400/25 text-amber-100 border-amber-300/40 hover:bg-amber-400/35'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">
            {dbStatus.connected ? 'MySQL (Drizzle): Connected' : 'MySQL: Connecting...'}
          </span>
        </button>

        {/* Reset to sample data button */}
        <button
          onClick={() => setShowResetConfirm(true)}
          title="Khôi phục dữ liệu mẫu ban đầu"
          className="p-2 text-white/90 hover:text-white hover:bg-white/15 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden xl:inline">Reset mẫu</span>
        </button>

        {/* Public Lookup Link */}
        {onOpenLookup && (
          <button
            onClick={onOpenLookup}
            className="px-3 py-1.5 text-xs font-extrabold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Tra cứu khách</span>
          </button>
        )}

        {/* Role Switcher Selector */}
        <div className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 p-1 rounded-xl border border-white/30 transition-colors">
          <UserCheck className="w-4 h-4 text-amber-300 ml-1.5" />
          <select
            value={currentUser?.role || 'admin'}
            onChange={(e) => switchRole(e.target.value as UserRole)}
            className="bg-transparent text-xs font-bold text-white py-1 pr-6 pl-1 focus:outline-hidden cursor-pointer [&>option]:text-slate-900"
          >
            <option value="admin">Admin (Toàn quyền)</option>
            <option value="manager">Quản lý (Manager)</option>
            <option value="receptionist">Lễ tân & Thu ngân (Tiếp nhận / Thu tiền)</option>
            <option value="technician">Kỹ thuật viên</option>
          </select>
        </div>

        {/* Direct Quick Logout Button */}
        <button
          onClick={() => setShowLogoutModal(true)}
          title="Đăng xuất khỏi hệ thống"
          className="px-2.5 py-1.5 text-xs font-bold text-white bg-rose-500 hover:bg-rose-400 border border-rose-300/40 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Đăng xuất</span>
        </button>

        {/* User Avatar & Name with Dropdown Menu */}
        <div className="relative pl-1.5 border-l border-white/25">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/15 transition-colors text-left cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-amber-300 text-slate-950 font-extrabold flex items-center justify-center text-xs shadow-sm">
              {currentUser?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-white leading-none">{currentUser?.full_name}</p>
              <p className="text-[10px] text-sky-100 mt-0.5 capitalize">{currentUser?.role}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-sky-100" />
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-fadeIn">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900 leading-tight">{currentUser?.full_name}</p>
                <p className="text-[11px] text-slate-500 truncate">{currentUser?.email}</p>
                <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                  {currentUser?.role}
                </span>
              </div>

              <div className="p-1 space-y-0.5">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenProfile?.();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Thông tin tài khoản</span>
                </button>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenProfile?.();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Key className="w-4 h-4 text-slate-400" />
                  <span>Đổi mật khẩu</span>
                </button>
              </div>

              <div className="p-1 pt-1.5 border-t border-slate-100">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    setShowLogoutModal(true);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Đăng xuất tài khoản</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
      />

      {/* Reset Sample Data Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Khôi phục dữ liệu mẫu?</h4>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Thao tác này sẽ đặt lại toàn bộ danh sách phiếu sửa chữa, khách hàng, và linh kiện về trạng thái ban đầu.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200 cursor-pointer"
              >
                Xác nhận khôi phục
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
