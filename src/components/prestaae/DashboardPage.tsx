'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { formatCOP, getInitials, getAvatarColor } from '@/lib/format';
import { TrendingUp, Wallet, Users, AlertTriangle, Plus, FileText, CreditCard, UserPlus } from 'lucide-react';

interface DashboardData {
  totalPrestado: number;
  interesesCobrados: number;
  clientesActivos: number;
  prestamosVencidos: { count: number; totalAmount: number };
  chartData: { month: string; intereses: number; desembolsos: number }[];
  recentLoans: { id: string; clientName: string; amount: number; currentBalance: number; paymentDay: number; status: string }[];
  alerts: { loanId: string; clientName: string; balance: number; expectedInterest: number; paymentDay: number; daysUntil: number }[];
}

function AnimatedNumber({ value, delay = 0 }: { value: number; delay?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      const end = value;
      const duration = 1200;
      const startTime = performance.now();
      function animate(currentTime: number) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(Math.floor(eased * end));
        if (progress < 1) requestAnimationFrame(animate);
      }
      requestAnimationFrame(animate);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return <span>{display.toLocaleString('es-CO')}</span>;
}

export default function DashboardPage() {
  const { setCurrentPage, setSelectedLoanId, refreshKey } = useAppStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => {
        if (!r.ok) throw new Error('Error al cargar datos');
        return r.json();
      })
      .then((result) => {
        if (result.error) {
          setError(result.error);
          setData(null);
        } else {
          setError(null);
          setData(result);
        }
      })
      .catch((err) => {
        console.error('Error fetching dashboard:', err);
        setError('No se pudo cargar el dashboard. Recarga la página.');
        setData(null);
      });
  }, [refreshKey]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertTriangle className="w-12 h-12 text-red-400" />
        <p className="text-red-400 font-medium">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-all"
        >
          Recargar
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Validación segura de prestamosVencidos
  const vencidosCount = data.prestamosVencidos?.count ?? 0;

  const kpis = [
    { label: 'TOTAL PRESTADO', value: data.totalPrestado, icon: Wallet, color: 'text-cyan-400', iconBg: 'bg-cyan-500/10' },
    { label: 'INTERESES COBRADOS', value: data.interesesCobrados, icon: TrendingUp, color: 'text-amber-400', iconBg: 'bg-amber-500/10' },
    { label: 'CLIENTES ACTIVOS', value: data.clientesActivos, icon: Users, color: 'text-violet-400', iconBg: 'bg-violet-500/10' },
    { label: 'PRÉSTAMOS VENCIDOS', value: vencidosCount, icon: AlertTriangle, color: 'text-red-400', iconBg: 'bg-red-500/10' },
  ];

  const maxInterest = Math.max(...data.chartData.map(c => c.intereses), 1);

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={kpi.label} className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 animate-slide-in-right" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${kpi.iconBg} rounded-xl flex items-center justify-center`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium tracking-wider mb-1">{kpi.label}</p>
            <p className="text-2xl font-bold text-white">
              ${kpi.label === 'CLIENTES ACTIVOS' ? <AnimatedNumber value={kpi.value} delay={i * 150} /> : <><span>$</span><AnimatedNumber value={kpi.value} delay={i * 150} /></>}
            </p>
          </div>
        ))}
      </div>

      {/* Chart + Active Loans */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Chart */}
        <div className="xl:col-span-2 bg-[#111827] border border-[#1E293B] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white">Intereses Cobrados</h3>
              <p className="text-xs text-slate-400 mt-0.5">Últimos 6 meses</p>
            </div>
          </div>
          <div className="h-64 flex items-end gap-2 px-2">
            {data.chartData.map((d, idx) => {
              const height = (d.intereses / maxInterest) * 100;
              return (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-slate-500">{formatCOP(d.intereses)}</span>
                  <div className="w-full rounded-t-md transition-all duration-700" style={{ height: `${Math.max(height, 2)}%`, backgroundColor: idx >= data.chartData.length - 2 ? '#10B981' : '#064E3B' }} />
                  <span className="text-[10px] text-slate-500">{d.month.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Loans List */}
        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white">Préstamos Activos</h3>
            <button onClick={() => setCurrentPage('loans')} className="text-xs text-emerald-400 hover:text-emerald-300 font-medium">Ver todos</button>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {data.recentLoans.map((loan) => (
              <button key={loan.id} onClick={() => { setSelectedLoanId(loan.id); setCurrentPage('loan-detail'); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/50 transition-all text-left">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${getAvatarColor(loan.clientName)}`}>{getInitials(loan.clientName)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{loan.clientName}</p>
                  <p className="text-xs text-slate-500">Día {loan.paymentDay}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-emerald-400">{formatCOP(loan.currentBalance)}</p>
                  <p className="text-[10px] text-slate-500">Saldo</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button onClick={() => setCurrentPage('new-client')} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-emerald-500/20"><UserPlus className="w-4 h-4" /> Nuevo Cliente</button>
        <button onClick={() => setCurrentPage('new-loan')} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-emerald-500/20"><FileText className="w-4 h-4" /> Nuevo Préstamo</button>
        <button onClick={() => setCurrentPage('register-payment')} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-emerald-500/20"><CreditCard className="w-4 h-4" /> Registrar Pago</button>
      </div>

      {/* Early Alerts */}
      {data.alerts.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Alertas Tempranas</h3>
          <div className="space-y-2">
            {data.alerts.map((alert) => (
              <button key={alert.loanId} onClick={() => { setSelectedLoanId(alert.loanId); setCurrentPage('loan-detail'); }} className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-500/5 hover:bg-amber-500/10 transition-all text-left">
                <div>
                  <p className="text-sm text-white font-medium">{alert.clientName}</p>
                  <p className="text-xs text-amber-400/70">Vence en {alert.daysUntil} día(s) — Interés: {formatCOP(alert.expectedInterest)}</p>
                </div>
                <p className="text-sm font-bold text-white">{formatCOP(alert.balance)}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
