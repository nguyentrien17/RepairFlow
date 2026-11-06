import React, { useState } from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  KanbanSquare,
  PlusCircle,
  Users,
  Laptop,
  Boxes,
  CreditCard,
  ShieldCheck,
  BarChart3,
  UserCog,
  History,
  Settings,
  SearchCode,
  BadgePercent,
  Store,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { LogoutConfirmModal } from '../common/LogoutConfirmModal';

export type TabType =
  | 'dashboard'
  | 'tickets'
  | 'kanban'
  | 'intake'
  | 'sales'
  | 'customers'
  | 'devices'
  | 'inventory'
  | 'payments'
  | 'promotions'
  | 'warranties'
  | 'reports'
  | 'staff'
  | 'audit'
  | 'settings'
  | 'lookup'
  | 'profile';

interface SidebarProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  openCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange, openCount = 0 }) => {
  const { hasRole, currentUser, logout } = useAuth();
  const { showToast } = useToast();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleConfirmLogout = () => {
    logout();
    showToast('Đã đăng xuất khỏi hệ thống thành công!', 'info');
  };

  const navItems = [
    {
      id: 'dashboard',
      label: 'Tổng quan',
      icon: LayoutDashboard,
      roles: ['admin', 'manager', 'technician', 'receptionist'],
    },
    {
      id: 'intake',
      label: 'Tiếp nhận mới',
      icon: PlusCircle,
      highlight: true,
      roles: ['admin', 'manager', 'receptionist'],
    },
    {
      id: 'sales',
      label: 'Bán hàng tại quầy',
      icon: Store,
      roles: ['admin', 'manager', 'receptionist'],
    },
    {
      id: 'tickets',
      label: 'Phiếu sửa chữa',
      icon: ClipboardList,
      badge: openCount,
      roles: ['admin', 'manager', 'receptionist', 'technician'],
    },
    {
      id: 'kanban',
      label: 'Bảng Kanban',
      icon: KanbanSquare,
      roles: ['admin', 'manager', 'technician', 'receptionist'],
    },
    {
      id: 'customers',
      label: 'Khách hàng',
      icon: Users,
      roles: ['admin', 'manager', 'receptionist'],
    },
    {
      id: 'devices',
      label: 'Thiết bị & Model',
      icon: Laptop,
      roles: ['admin', 'manager', 'receptionist', 'technician'],
    },
    {
      id: 'inventory',
      label: 'Linh kiện & Kho',
      icon: Boxes,
      roles: ['admin', 'manager', 'technician'],
    },
    {
      id: 'payments',
      label: 'Thanh toán & Thu tiền',
      icon: CreditCard,
      roles: ['admin', 'manager', 'receptionist'],
    },
    {
      id: 'promotions',
      label: 'Ưu đãi & Khuyến mãi',
      icon: BadgePercent,
      roles: ['admin', 'manager', 'receptionist'],
    },
    {
      id: 'warranties',
      label: 'Sổ Bảo hành',
      icon: ShieldCheck,
      roles: ['admin', 'manager', 'receptionist', 'technician'],
    },
    {
      id: 'reports',
      label: 'Báo cáo & Thống kê',
      icon: BarChart3,
      roles: ['admin', 'manager'],
    },
    {
      id: 'staff',
      label: 'Nhân viên & Vai trò',
      icon: UserCog,
      roles: ['admin'],
    },
    {
      id: 'audit',
      label: 'Nhật ký Audit Log',
      icon: History,
      roles: ['admin', 'manager'],
    },
    {
      id: 'settings',
      label: 'Cấu hình cửa hàng',
      icon: Settings,
      roles: ['admin', 'manager'],
    },
    {
      id: 'lookup',
      label: 'Cổng tra cứu online',
      icon: SearchCode,
      roles: ['admin', 'manager', 'receptionist', 'technician'],
    },
  ];

  return (
    <aside className="w-64 bg-gradient-to-b from-indigo-800 via-indigo-900 to-blue-950 text-white flex flex-col shrink-0 no-print select-none border-r border-indigo-700/60 shadow-lg h-full overflow-hidden">
      <div className="p-4 border-b border-white/15 shrink-0 bg-white/5">
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-sky-200">Điều hướng hệ thống</p>
      </div>

      <nav className="p-3 space-y-1 overflow-y-auto min-h-0 flex-1 text-sm font-medium custom-dark-scrollbar">
        {navItems.map((item) => {
          // Check role permission
          if (!hasRole(item.roles as any)) return null;

          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id as TabType)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                item.highlight
                  ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 shadow-md shadow-emerald-950/25 hover:from-emerald-300 hover:to-cyan-300 font-extrabold mb-2.5'
                  : isActive
                  ? 'bg-white text-indigo-900 font-extrabold shadow-md'
                  : 'text-indigo-100 hover:text-white hover:bg-white/15'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    item.highlight ? 'text-slate-950' : isActive ? 'text-indigo-600' : 'text-sky-300'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`px-2 py-0.5 text-[11px] font-extrabold rounded-full ${
                    isActive ? 'bg-indigo-600 text-white' : 'bg-amber-300 text-slate-950'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer User Profile & Store Tag */}
      <div className="p-3 border-t border-white/15 bg-indigo-950/50 shrink-0 space-y-2">
        {currentUser && (
          <div className="space-y-1.5">
            <button
              onClick={() => onTabChange('profile')}
              className={`w-full p-2 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer ${
                currentTab === 'profile'
                  ? 'bg-white text-indigo-900 shadow-sm'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-amber-300 text-slate-950 font-extrabold flex items-center justify-center text-xs shrink-0 shadow-xs">
                  {currentUser.full_name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-bold truncate ${currentTab === 'profile' ? 'text-indigo-950' : 'text-white'}`}>
                    {currentUser.full_name}
                  </p>
                  <p className={`text-[10px] capitalize ${currentTab === 'profile' ? 'text-indigo-600' : 'text-sky-200'}`}>
                    {currentUser.role}
                  </p>
                </div>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 ml-1" />
            </button>

            {/* Direct Logout Button */}
            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              className="w-full px-2.5 py-1.5 rounded-lg text-rose-200 hover:text-white hover:bg-rose-500/30 text-xs font-semibold flex items-center justify-between transition-colors group cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <LogOut className="w-3.5 h-3.5 text-rose-300 group-hover:text-white transition-colors" />
                <span>Đăng xuất</span>
              </span>
              <span className="text-[10px] text-rose-300 group-hover:text-white font-mono">Thoát</span>
            </button>
          </div>
        )}

        <div className="px-1 text-[11px] text-sky-200/80 flex items-center justify-between">
          <span className="font-semibold">RepairFlow ERP</span>
          <span className="text-[10px] bg-white/15 text-white font-bold px-1.5 py-0.5 rounded">v2.5</span>
        </div>
      </div>

      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
      />
    </aside>
  );
};
