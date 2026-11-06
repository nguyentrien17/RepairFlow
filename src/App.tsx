import React, { useState, useEffect, Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, TabType } from './components/layout/Sidebar';
import { LoginPage } from './pages/auth/LoginPage';
import { StorageService } from './services/mockStorage';

// Route-level code splitting for page modules
const DashboardPage = lazy(() =>
  import('./pages/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const IntakePage = lazy(() =>
  import('./pages/intake/IntakePage').then((m) => ({ default: m.IntakePage }))
);
const TicketListPage = lazy(() =>
  import('./pages/tickets/TicketListPage').then((m) => ({ default: m.TicketListPage }))
);
const TicketDetailPage = lazy(() =>
  import('./pages/tickets/TicketDetailPage').then((m) => ({ default: m.TicketDetailPage }))
);
const KanbanPage = lazy(() =>
  import('./pages/kanban/KanbanPage').then((m) => ({ default: m.KanbanPage }))
);
const CustomerListPage = lazy(() =>
  import('./pages/customers/CustomerListPage').then((m) => ({ default: m.CustomerListPage }))
);
const DeviceListPage = lazy(() =>
  import('./pages/devices/DeviceListPage').then((m) => ({ default: m.DeviceListPage }))
);
const InventoryPage = lazy(() =>
  import('./pages/inventory/InventoryPage').then((m) => ({ default: m.InventoryPage }))
);
const PaymentListPage = lazy(() =>
  import('./pages/payments/PaymentListPage').then((m) => ({ default: m.PaymentListPage }))
);
const PromotionsPage = lazy(() =>
  import('./pages/promotions/PromotionsPage').then((m) => ({ default: m.PromotionsPage }))
);
const WarrantyListPage = lazy(() =>
  import('./pages/warranties/WarrantyListPage').then((m) => ({ default: m.WarrantyListPage }))
);
const ReportsPage = lazy(() =>
  import('./pages/reports/ReportsPage').then((m) => ({ default: m.ReportsPage }))
);
const StaffPage = lazy(() =>
  import('./pages/staff/StaffPage').then((m) => ({ default: m.StaffPage }))
);
const SettingsPage = lazy(() =>
  import('./pages/settings/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);
const AuditLogPage = lazy(() =>
  import('./pages/audit/AuditLogPage').then((m) => ({ default: m.AuditLogPage }))
);
const PublicLookupPortal = lazy(() =>
  import('./pages/lookup/PublicLookupPortal').then((m) => ({ default: m.PublicLookupPortal }))
);
const ProfilePage = lazy(() =>
  import('./pages/auth/ProfilePage').then((m) => ({ default: m.ProfilePage }))
);
const RetailSalesPage = lazy(() =>
  import('./pages/sales/RetailSalesPage').then((m) => ({ default: m.RetailSalesPage }))
);

function MainApp() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [currentTab, setCurrentTab] = useState<TabType>(() => {
    if (window.location.search.includes('ticket=') || window.location.pathname.includes('/lookup')) {
      return 'lookup';
    }
    return 'dashboard';
  });

  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [sqlHydratedVersion, setSqlHydratedVersion] = useState(0);

  useEffect(() => {
    if (currentUser && !currentUser.must_change_password) {
      StorageService.syncFromBackend().then((ok) => {
        if (ok) {
          setSqlHydratedVersion((v) => v + 1);
        }
      });
    }
    const onHydrated = () => setSqlHydratedVersion((v) => v + 1);
    const onApiError = (e: any) => {
      const msg = e.detail?.message;
      if (msg) showToast(msg, 'error');
    };
    const onMustChangePassword = (e: any) => {
      setCurrentTab('profile');
      const msg = e.detail?.message || 'Vui lòng đổi mật khẩu tạm thời trước khi tiếp tục sử dụng hệ thống';
      showToast(msg, 'error');
    };
    window.addEventListener('repairflow_sql_hydrated', onHydrated);
    window.addEventListener('repairflow_api_error', onApiError);
    window.addEventListener('repairflow_must_change_password', onMustChangePassword);
    return () => {
      window.removeEventListener('repairflow_sql_hydrated', onHydrated);
      window.removeEventListener('repairflow_api_error', onApiError);
      window.removeEventListener('repairflow_must_change_password', onMustChangePassword);
    };
  }, [currentUser, showToast]);

  // Enforce password change if must_change_password is active
  const mustChangePassword = Boolean(currentUser?.must_change_password);
  const effectiveTab: TabType = mustChangePassword && currentTab !== 'lookup' ? 'profile' : currentTab;

  const tickets = StorageService.getTickets();
  const openCount = tickets.filter((t) => t.status !== 'Delivered' && t.status !== 'Cancelled').length;

  const handleTabChange = (tab: TabType) => {
    if (mustChangePassword && tab !== 'profile' && tab !== 'lookup') {
      showToast('Bạn cần đổi mật khẩu tạm thời trước khi truy cập tính năng khác!', 'error');
      setCurrentTab('profile');
      return;
    }
    setCurrentTab(tab);
    if (tab !== 'tickets') {
      setSelectedTicketId(null);
    }
  };

  if (!currentUser && currentTab !== 'lookup') {
    return (
      <LoginPage
        onOpenLookup={() => {
          setSelectedTicketId(null);
          setCurrentTab('lookup');
        }}
        onLoginSuccess={() => setCurrentTab('dashboard')}
      />
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#eef2f7] flex flex-col font-sans text-slate-800 select-auto">
      <Navbar
        onSearchSelect={(ticketId) => {
          if (mustChangePassword) return;
          setSelectedTicketId(ticketId);
          setCurrentTab('tickets');
        }}
        onOpenLookup={() => {
          setSelectedTicketId(null);
          setCurrentTab('lookup');
        }}
        onOpenProfile={() => {
          setSelectedTicketId(null);
          setCurrentTab('profile');
        }}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden w-full">
        {effectiveTab !== 'lookup' && (
          <Sidebar
            currentTab={effectiveTab}
            onTabChange={handleTabChange}
            openCount={openCount}
          />
        )}

        <main
          key={sqlHydratedVersion}
          className="flex-1 min-h-0 overflow-y-auto p-4 lg:p-6 bg-gradient-to-br from-[#eef2f7] via-[#f1f5f9] to-[#e8eef7]"
        >
          {mustChangePassword && effectiveTab === 'profile' && (
            <div className="w-full mb-4 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold">
              Tài khoản của bạn đang sử dụng mật khẩu tạm thời. Vui lòng đổi mật khẩu mới để kích hoạt đầy đủ quyền truy cập hệ thống.
            </div>
          )}

          <Suspense
            fallback={
              <div className="flex items-center justify-center py-16 text-xs font-semibold text-slate-500">
                Đang tải trang...
              </div>
            }
          >
            {effectiveTab === 'lookup' && (
              <div>
                <div className="max-w-3xl mx-auto mb-4 flex justify-between items-center no-print">
                  <button
                    onClick={() => setCurrentTab('dashboard')}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 p-2 rounded-lg hover:bg-slate-200/60"
                  >
                    ← Trở về Hệ thống Quản trị Nội bộ
                  </button>
                </div>
                <PublicLookupPortal />
              </div>
            )}

            {effectiveTab === 'dashboard' && (
              <DashboardPage
                onNavigate={(tab, ticketId) => {
                  if (ticketId) {
                    setSelectedTicketId(ticketId);
                    setCurrentTab('tickets');
                  } else {
                    setCurrentTab(tab);
                  }
                }}
              />
            )}

            {effectiveTab === 'intake' && (
              <IntakePage
                onTicketCreated={(newId) => {
                  setSelectedTicketId(newId);
                  setCurrentTab('tickets');
                }}
              />
            )}

            {effectiveTab === 'sales' && <RetailSalesPage />}

            {effectiveTab === 'tickets' && (
              selectedTicketId ? (
                <TicketDetailPage
                  ticketId={selectedTicketId}
                  onBack={() => setSelectedTicketId(null)}
                />
              ) : (
                <TicketListPage onSelectTicket={(id) => setSelectedTicketId(id)} />
              )
            )}

            {effectiveTab === 'kanban' && (
              <KanbanPage
                onSelectTicket={(id) => {
                  setSelectedTicketId(id);
                  setCurrentTab('tickets');
                }}
              />
            )}

            {effectiveTab === 'customers' && <CustomerListPage />}
            {effectiveTab === 'devices' && <DeviceListPage />}
            {effectiveTab === 'inventory' && <InventoryPage />}
            {effectiveTab === 'payments' && (
              <PaymentListPage
                onSelectTicket={(id) => {
                  setSelectedTicketId(id);
                  setCurrentTab('tickets');
                }}
              />
            )}
            {effectiveTab === 'promotions' && <PromotionsPage />}
            {effectiveTab === 'warranties' && <WarrantyListPage />}
            {effectiveTab === 'reports' && <ReportsPage />}
            {effectiveTab === 'staff' && <StaffPage />}
            {effectiveTab === 'settings' && <SettingsPage />}
            {effectiveTab === 'audit' && <AuditLogPage />}
            {effectiveTab === 'profile' && <ProfilePage />}
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ToastProvider>
  );
}
