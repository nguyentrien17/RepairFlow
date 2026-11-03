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
  | 'warranties'
  | 'reports'
  | 'staff'
  | 'audit'
  | 'settings'
  | 'lookup';

interface SidebarProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  openCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange, openCount = 0 }) => {
  const { hasRole } = useAuth();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Tổng quan',
      icon: LayoutDashboard,
      roles: ['admin', 'manager', 'technician', 'receptionist', 'cashier'],
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
      roles: ['admin', 'manager', 'receptionist', 'technician', 'cashier'],
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
      roles: ['admin', 'manager', 'receptionist', 'cashier'],
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
      roles: ['admin', 'manager', 'cashier'],
    },
    {
      id: 'warranties',
      label: 'Sổ Bảo hành',
      icon: ShieldCheck,
      roles: ['admin', 'manager', 'receptionist', 'technician', 'cashier'],
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
      roles: ['admin', 'manager', 'receptionist', 'technician', 'cashier'],
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 no-print select-none border-r border-slate-800">
      <div className="p-4 border-b border-slate-800">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Điều hướng hệ thống</p>
      </div>

      <nav className="p-3 space-y-1 overflow-y-auto flex-1 text-sm font-medium">
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

      {/* Footer Store Tag */}
      <div className="p-3.5 border-t border-slate-800 text-xs text-slate-500 flex items-center justify-between">
        <span>RepairFlow ERP</span>
        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
      </div>
    </aside>
  );
};
