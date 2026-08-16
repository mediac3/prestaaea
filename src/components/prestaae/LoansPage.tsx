'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { formatCOP, getInitials, getAvatarColor } from '@/lib/format';
import { Plus, Search, Eye, Trash2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

interface Loan {
  id: string;
  amount: number;
  rate: number;
  term: number;
  startDate: string;
  paymentDay: number;
  status: string;
  notes: string | null;
  client: { id: string; name: string };
  payments: { id: string; capitalAmount: number; interestAmount: number; previousBalance: number; newBalance: number }[];
}

export default function LoansPage() {
  const { setCurrentPage, setSelectedLoanId, refreshKey } = useAppStore();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'activo' | 'vencido' | 'pagado'>('activo');
  const [counts, setCounts] = useState({ activo: 0, vencido: 0, pagado: 0 });

  const loadLoans = useCallback(() => {
    const params = new URLSearchParams({ status: tab });
    if (search) params.set('search', search);
    fetch(`/api/loans?${params}`).then((r) => r.json()).then((data) => {
      setLoans(Array.isArray(data) ? data : []);
    });
    // Get counts
    Promise.all([
      fetch('/api/loans?status=activo').then((r) => r.json()),
      fetch('/api/loans?status=vencido').then((r) => r.json()),
      fetch('/api/loans?status=pagado').then((r) => r.json()),
    ]).then(([a, v, p]) => {
      setCounts({
        activo: Array.isArray(a) ? a.length : 0,
        vencido: Array.isArray(v) ? v.length : 0,
        pagado: Array.isArray(p) ? p.length : 0,
      });
    });
  }, [tab, search, refreshKey]);

  useEffect(() => { loadLoans(); }, [loadLoans]);

  const getCurrentBalance = (loan: Loan) => {
    if (loan.payments.length === 0) return loan.amount;
    return loan.payments[0]?.newBalance ?? loan.amount;
  };

  const handleDelete = async (loan: Loan) => {
    if (!confirm(`¿Eliminar préstamo de ${loan.client.name}?`)) return;
    try {
      const res = await fetch(`/api/loans/${loan.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Error al eliminar'); return; }
      toast.success('Préstamo eliminado');
      loadLoans();
    } catch { toast.error('Error de conexión'); }
  };

  const goToDetail = (id: string) => {
    setSelectedLoanId(id);
    setCurrentPage('loan-detail');
  };

  const goToPayment = (id: string) => {
    setSelectedLoanId(id);
    setCurrentPage('register-payment');
  };

  const tabs = [
    { key: 'activo' as const, label: 'Activos', count: counts.activo, color: 'text-emerald-400' },
    { key: 'vencido' as const, label: 'Vencidos', count: counts.vencido, color: 'text-red-400' },
    { key: 'pagado' as const, label: 'Pagados', count: counts.pagado, color: 'text-slate-400' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="lg:hidden">
          <p className="text-xs text-slate-400">Administra todos los préstamos otorgados</p>
        </div>
        <button
          onClick={() => setCurrentPage('new-loan')}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-emerald-500/20 self-start"
        >
          <Plus className="w-4 h-4" /> Nuevo Préstamo
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre de cliente..."
          className="w-full bg-[#111827] border border-[#1E293B] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#1E293B]">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
              tab === t.key
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              tab === t.key ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1E293B]">
                <th className="text-left text-[11px] font-medium text-slate-500 tracking-wider px-5 py-3">CLIENTE</th>
                <th className="text-left text-[11px] font-medium text-slate-500 tracking-wider px-4 py-3 hidden sm:table-cell">MONTO ORIGINAL</th>
                <th className="text-left text-[11px] font-medium text-slate-500 tracking-wider px-4 py-3 hidden md:table-cell">INTERÉS</th>
                <th className="text-left text-[11px] font-medium text-slate-500 tracking-wider px-4 py-3">SALDO ACTUAL</th>
                <th className="text-left text-[11px] font-medium text-slate-500 tracking-wider px-4 py-3 hidden lg:table-cell">DÍA DE PAGO</th>
                <th className="text-right text-[11px] font-medium text-slate-500 tracking-wider px-5 py-3">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => {
                const balance = getCurrentBalance(loan);
                return (
                  <tr key={loan.id} className="border-b border-[#1E293B]/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${getAvatarColor(loan.client.name)}`}>
                          {getInitials(loan.client.name)}
                        </div>
                        <span className="text-sm text-white font-medium truncate max-w-[160px]">{loan.client.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300 hidden sm:table-cell">{formatCOP(loan.amount)}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-violet-400 font-medium">{loan.rate}%</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-emerald-400 font-bold">{formatCOP(balance)}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-300 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-full">
                        {loan.paymentDay} <span className="text-slate-500">de cada mes</span>
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => goToDetail(loan.id)} className="p-1.5 text-slate-400 hover:text-emerald-400 transition-colors rounded-lg hover:bg-emerald-500/10" title="Ver detalle">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => goToPayment(loan.id)} className="p-1.5 text-slate-400 hover:text-amber-400 transition-colors rounded-lg hover:bg-amber-500/10" title="Registrar pago">
                          <CreditCard className="w-4 h-4" />
                        </button>
                        {tab !== 'pagado' && (
                          <button onClick={() => handleDelete(loan)} className="p-1.5 text-slate-400 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10" title="Eliminar">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {loans.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-slate-500 text-sm">No se encontraron préstamos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
