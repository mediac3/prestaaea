'use client';

import { useAppStore } from '@/store/useAppStore';
import LoginPage from '@/components/prestaae/LoginPage';
import DashboardPage from '@/components/prestaae/DashboardPage';
import ClientsPage from '@/components/prestaae/ClientsPage';
import LoansPage from '@/components/prestaae/LoansPage';
import NewLoanPage from '@/components/prestaae/NewLoanPage';
import LoanDetailPage from '@/components/prestaae/LoanDetailPage';
import RegisterPaymentPage from '@/components/prestaae/RegisterPaymentPage';
import NotificationsPage from '@/components/prestaae/NotificationsPage';
import Sidebar, { TopBar } from '@/components/prestaae/Sidebar';

function PageRouter() {
  const currentPage = useAppStore((s) => s.currentPage);
  switch (currentPage) {
    case 'dashboard': return <DashboardPage />;
    case 'clients': case 'new-client': return <ClientsPage />;
    case 'loans': return <LoansPage />;
    case 'new-loan': return <NewLoanPage />;
    case 'loan-detail': return <LoanDetailPage />;
    case 'register-payment': return <RegisterPaymentPage />;
    case 'notifications': return <NotificationsPage />;
    default: return <DashboardPage />;
  }
}

export default function Home() {
  const { isAuthenticated, sidebarOpen } = useAppStore();
  if (!isAuthenticated) return <LoginPage />;
  return (
    <div className="min-h-screen bg-grid-pattern">
      <Sidebar />
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
        <TopBar />
        <main className="min-h-[calc(100vh-4rem)]"><PageRouter /></main>
      </div>
    </div>
  );
}