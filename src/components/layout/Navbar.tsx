import React, { useState } from 'react';
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
} from 'lucide-react';
import { StorageService } from '../../services/mockStorage';
import { useToast } from '../../contexts/ToastContext';

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

  const handleResetData = () => {
    if (window.confirm('Khôi phục toàn bộ dữ liệu mẫu (Khách hàng, phiếu sửa chữa, kho linh kiện)?')) {
      StorageService.resetToSampleData();
      showToast('Đã khôi phục dữ liệu mẫu thành công!', 'info');
      window.location.reload();
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 lg:px-6 flex items-center justify-between shrink-0 z-30 no-print select-none">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
          <Wrench className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-slate-900 tracking-tight text-lg">RepairFlow</h1>
            <span className="text-[11px] font-semibold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">
              v2.5
            </span>
          </div>
          <p className="text-xs text-slate-500 hidden sm:block">Quản lý tiếp nhận & sửa chữa thiết bị điện tử</p>
        </div>
      </div>

      {/* Global Search Bar (UC-30) */}
      <div className="relative max-w-md w-full mx-4 hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Tìm theo mã SC-..., Tên khách, SĐT, Serial thiết bị..."
            className="w-full pl-10 pr-4 py-2 bg-slate-100 hover:bg-slate-50 focus:bg-white text-sm rounded-xl border border-transparent focus:border-indigo-400 focus:outline-hidden transition-all text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Search Results Dropdown */}
        {isSearching && searchResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
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
      <div className="flex items-center gap-2.5">
        {/* Reset to sample data button */}
        <button
          onClick={handleResetData}
          title="Khôi phục dữ liệu mẫu ban đầu"
          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden xl:inline">Reset mẫu</span>
        </button>

        {/* Public Lookup Link */}
        {onOpenLookup && (
          <button
            onClick={onOpenLookup}
            className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg flex items-center gap-1.5 transition-colors border border-emerald-200"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Tra cứu khách</span>
          </button>
        )}

        {/* Role Switcher Selector */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <UserCheck className="w-4 h-4 text-slate-500 ml-1.5" />
          <select
            value={currentUser?.role || 'admin'}
            onChange={(e) => switchRole(e.target.value as UserRole)}
            className="bg-transparent text-xs font-semibold text-slate-800 py-1 pr-6 pl-1 focus:outline-hidden cursor-pointer"
          >
            <option value="admin">Admin (Toàn quyền)</option>
            <option value="manager">Quản lý (Manager)</option>
            <option value="receptionist">Lễ tân & Thu ngân (Tiếp nhận / Thu tiền)</option>
            <option value="technician">Kỹ thuật viên</option>
          </select>
        </div>

        {/* User Avatar & Name with Dropdown Menu */}
        <div className="relative pl-2 border-l border-slate-200">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors text-left cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
              {currentUser?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-none">{currentUser?.full_name}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 capitalize">{currentUser?.role}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
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
                    if (window.confirm('Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?')) {
                      logout();
                    }
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
    </header>
  );
};
