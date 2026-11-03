import React from 'react';
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
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export type TabType =
  | 'dashboard'
  | 'tickets'
  | 'kanban'
  | 'intake'
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
  const { hasRole, currentUser } = useAuth();

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
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 no-print select-none border-r border-slate-800 h-full overflow-hidden">
      <div className="p-4 border-b border-slate-800 shrink-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Điều hướng hệ thống</p>
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
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                item.highlight
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-900/40 hover:from-indigo-500 hover:to-indigo-600 font-semibold mb-2'
                  : isActive
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${item.highlight ? 'text-white' : isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-indigo-500 text-white">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer User Profile & Store Tag */}
      <div className="p-3 border-t border-slate-800 shrink-0 space-y-2">
        {currentUser && (
          <button
            onClick={() => onTabChange('profile')}
            className={`w-full p-2 rounded-xl flex items-center justify-between text-left transition-all ${
              currentTab === 'profile'
                ? 'bg-indigo-600/30 text-white border border-indigo-500/40'
                : 'hover:bg-slate-800/80 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                {currentUser.full_name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{currentUser.full_name}</p>
                <p className="text-[10px] text-slate-400 capitalize">{currentUser.role}</p>
              </div>
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 ml-1" />
          </button>
        )}

        <div className="px-1 text-[11px] text-slate-500 flex items-center justify-between">
          <span>RepairFlow ERP</span>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">v2.5</span>
        </div>
      </div>
    </aside>
  );
};
