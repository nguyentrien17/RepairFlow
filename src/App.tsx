import React, { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, TabType } from './components/layout/Sidebar';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { IntakePage } from './pages/intake/IntakePage';
import { TicketListPage } from './pages/tickets/TicketListPage';
import { TicketDetailPage } from './pages/tickets/TicketDetailPage';
import { KanbanPage } from './pages/kanban/KanbanPage';
import { CustomerListPage } from './pages/customers/CustomerListPage';
import { DeviceListPage } from './pages/devices/DeviceListPage';
import { InventoryPage } from './pages/inventory/InventoryPage';
import { PaymentListPage } from './pages/payments/PaymentListPage';
import { WarrantyListPage } from './pages/warranties/WarrantyListPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { StaffPage } from './pages/staff/StaffPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { AuditLogPage } from './pages/audit/AuditLogPage';
import { PublicLookupPortal } from './pages/lookup/PublicLookupPortal';
import { StorageService } from './services/mockStorage';

function MainApp() {
  const [currentTab, setCurrentTab] = useState<TabType>(() => {
    // If opened with ?ticket=... or /lookup in URL, open lookup portal directly
    if (window.location.search.includes('ticket=') || window.location.pathname.includes('/lookup')) {
      return 'lookup';
    }
    return 'dashboard';
  });

  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const tickets = StorageService.getTickets();
  const openCount = tickets.filter((t) => t.status !== 'Delivered' && t.status !== 'Cancelled').length;

  const handleSelectTicket = (id: number) => {
    setSelectedTicketId(id);
    setCurrentTab('tickets');
  };

  const handleTabChange = (tab: TabType) => {
    setCurrentTab(tab);
    if (tab !== 'tickets') {
      setSelectedTicketId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Top Navbar */}
      <Navbar
        onSearchSelect={(ticketId) => {
          setSelectedTicketId(ticketId);
          setCurrentTab('tickets');
        }}
        onOpenLookup={() => {
          setSelectedTicketId(null);
          setCurrentTab('lookup');
        }}
      />

      {/* Main Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar (hidden in public lookup or print) */}
        {currentTab !== 'lookup' && (
          <Sidebar
            currentTab={currentTab}
            onTabChange={handleTabChange}
            openCount={openCount}
          />
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {currentTab === 'lookup' && (
            <div>
              {/* Back button to staff portal if wanted */}
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

          {currentTab === 'dashboard' && (
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

          {currentTab === 'intake' && (
            <IntakePage
              onTicketCreated={(newId) => {
                setSelectedTicketId(newId);
                setCurrentTab('tickets');
              }}
            />
          )}

          {currentTab === 'tickets' && (
            selectedTicketId ? (
              <TicketDetailPage
                ticketId={selectedTicketId}
                onBack={() => setSelectedTicketId(null)}
              />
            ) : (
              <TicketListPage onSelectTicket={(id) => setSelectedTicketId(id)} />
            )
          )}

          {currentTab === 'kanban' && (
            <KanbanPage
              onSelectTicket={(id) => {
                setSelectedTicketId(id);
                setCurrentTab('tickets');
              }}
            />
          )}

          {currentTab === 'customers' && <CustomerListPage />}
          {currentTab === 'devices' && <DeviceListPage />}
          {currentTab === 'inventory' && <InventoryPage />}
          {currentTab === 'payments' && (
            <PaymentListPage
              onSelectTicket={(id) => {
                setSelectedTicketId(id);
                setCurrentTab('tickets');
              }}
            />
          )}
          {currentTab === 'warranties' && <WarrantyListPage />}
          {currentTab === 'reports' && <ReportsPage />}
          {currentTab === 'staff' && <StaffPage />}
          {currentTab === 'settings' && <SettingsPage />}
          {currentTab === 'audit' && <AuditLogPage />}
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
