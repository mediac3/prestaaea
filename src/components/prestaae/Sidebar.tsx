'use client';

import { useAppStore, type Page } from '@/store/useAppStore';
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  Bell,
  Landmark,
  Menu,
  Info,
  X,
} from 'lucide-react';

const navItems: { page: Page; label: string; icon: React.ElementType }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'clients', label: 'Clientes', icon: Users },
  { page: 'loans', label: 'Préstamos', icon: FileText },
  { page: 'notifications', label: 'Notificaciones', icon: Bell },
];

export default function Sidebar() {
  const { currentPage, setCurrentPage, sidebarOpen, setSidebarOpen, logout, user } = useAppStore();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-[#0F172A] border-r border-[#1E293B] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-[#1E293B]">
          <div className="w-9 h-9 bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Landmark className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-white tracking-tight">PrestaAEA</h1>
            <p className="text-[10px] text-slate-500">Gestión de Créditos</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = currentPage === item.page ||
              (item.page === 'clients' && currentPage === 'new-client') ||
              (item.page === 'loans' && (currentPage === 'new-loan' || currentPage === 'loan-detail' || currentPage === 'register-payment'));
            return (
              <button
                key={item.page}
                onClick={() => {
                  setCurrentPage(item.page);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <item.icon className={`w-[18px] h-[18px] ${isActive ? 'text-emerald-500' : ''}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-4 space-y-2">
          <div className="flex items-center gap-2 px-3 py-2 text-slate-500 text-xs">
            <Info className="w-3.5 h-3.5" />
            <span>v1.0.0</span>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
}

export function TopBar() {
  const { toggleSidebar, setCurrentPage, currentPage, user } = useAppStore();

  const pageTitles: Record<string, string> = {
    login: '',
    dashboard: 'Dashboard',
    clients: 'Clientes',
    'new-client': 'Nuevo Cliente',
    loans: 'Préstamos',
    'new-loan': 'Nuevo Préstamo',
    'loan-detail': 'Detalle de Préstamo',
    'register-payment': 'Registrar Pago',
    notifications: 'Notificaciones',
  };

  const pageSubtitles: Record<string, string> = {
    login: '',
    dashboard: 'Resumen general de tu negocio de préstamos',
    clients: 'Gestiona la información de tus clientes',
    'new-client': 'Registra un nuevo cliente en el sistema',
    loans: 'Administra todos los préstamos otorgados',
    'new-loan': 'Registra un nuevo préstamo a un cliente',
    'loan-detail': 'Detalle del préstamo y historial de pagos',
    'register-payment': 'Registra un pago de intereses y/o abono a capital',
    notifications: 'Clientes con pagos próximos a vencer',
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0F172A] border-b border-[#1E293B]">
      <div className="flex items-center justify-between px-4 md:px-6 h-16">
        <div className="flex items-center gap-3">
          <button onClick={toggleSidebar} className="lg:hidden text-slate-400 hover:text-white transition-colors p-1">
            <Menu className="w-6 h-6" />
          </button>
          <div className="hidden lg:block">
            <h2 className="text-lg font-bold text-white">{pageTitles[currentPage] || ''}</h2>
            <p className="text-xs text-slate-400">{pageSubtitles[currentPage] || ''}</p>
          </div>
          <div className="lg:hidden">
            <h2 className="text-base font-bold text-white">{pageTitles[currentPage] || ''}</h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrentPage('notifications')} className="relative p-2 text-slate-400 hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <div className="flex items-center gap-2 bg-[#1E293B] rounded-full px-3 py-1.5">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <span className="text-xs font-bold text-emerald-400">{user?.name?.[0] || 'A'}</span>
            </div>
            <span className="text-sm text-white font-medium hidden sm:inline">{user?.name || 'Admin'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
