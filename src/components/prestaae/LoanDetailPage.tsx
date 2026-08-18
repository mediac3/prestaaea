'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { formatCOP, formatDate, getStatusColor, getStatusLabel } from '@/lib/format';
import { CreditCard, CheckCircle, Trash2, TrendingUp, Building2, FileText, Save } from 'lucide-react';
import { toast } from 'sonner';

interface LoanDetail {
  id: string;
  amount: number;
  rate: number;
  term: number;
  startDate: string;
  paymentDay: number;
  status: string;
  notes: string | null;
  client: { id: string; name: string; cedula: string; phone: string };
  payments: {
    id: string;
    date: string;
    type: string;
    interestAmount: number;
    capitalAmount: number;
    previousBalance: number;
    newBalance: number;
    notes: string | null;
  }[];
}

export default function LoanDetailPage() {
  const { selectedLoanId, setCurrentPage, refreshKey, triggerRefresh } = useAppStore();
  const [loan, setLoan] = useState<LoanDetail | null>(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');

  const loadLoan = useCallback(() => {
    if (!selectedLoanId) return;
    fetch(`/api/loans/${selectedLoanId}`)
      .then((r) => r.json())
      .then((data) => {
        setLoan(data);
        setNotes(data.notes || '');
      });
  }, [selectedLoanId, refreshKey]);

  useEffect(() => { loadLoan(); }, [loadLoan]);

  if (!loan) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  const currentBalance = loan.payments.length > 0 ? loan.payments[0].newBalance : loan.amount;
  const totalInterestPaid = loan.payments.reduce((sum, p) => sum + p.interestAmount, 0);
  const totalCapitalPaid = loan.payments.reduce((sum, p) => sum + p.capitalAmount, 0);
  const progressPercent = loan.amount > 0 ? Math.round(((loan.amount - currentBalance) / loan.amount) * 100) : 0;
  const monthlyInterest = currentBalance * (loan.rate / 100);

  const handleSaveNotes = async () => {
    try {
      const res = await fetch(`/api/loans/${loan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      if (res.ok) {
        toast.success('Notas actualizadas');
        setEditingNotes(false);
        loadLoan();
      }
    } catch { toast.error('Error al guardar'); }
  };

  const handleCloseLoan = async () => {
    if (!confirm('¿Marcar este préstamo como pagado?')) return;
    try {
      const res = await fetch(`/api/loans/${loan.id}/close`, { method: 'POST' });
      if (res.ok) {
        toast.success('Préstamo marcado como pagado');
        triggerRefresh();
        loadLoan();
      }
    } catch { toast.error('Error al cerrar'); }
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar este préstamo?')) return;
    try {
      const res = await fetch(`/api/loans/${loan.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Error al eliminar'); return; }
      toast.success('Préstamo eliminado');
      triggerRefresh();
      setCurrentPage('loans');
    } catch { toast.error('Error de conexión'); }
  };

  return (
    <div className="p-4 md:p-6 space-y-5 animate-fade-in">
      {/* Header Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { useAppStore.getState().setSelectedLoanId(loan.id); setCurrentPage('register-payment'); }}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
        >
          <CreditCard className="w-4 h-4" /> Registrar Pago
        </button>
        <button
          onClick={handleCloseLoan}
          className="flex items-center gap-2 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 px-4 py-2 rounded-xl text-sm font-medium transition-all"
        >
          <CheckCircle className="w-4 h-4" /> Marcar Pagado
        </button>
        <button
          onClick={handleDelete}
          className="flex items-center gap-2 border border-slate-600 text-slate-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 px-4 py-2 rounded-xl text-sm font-medium transition-all"
        >
          <Trash2 className="w-4 h-4" /> Eliminar
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Main Content */}
        <div className="xl:col-span-2 space-y-5">
          {/* Summary Card */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-bold text-white">Préstamo — {loan.client.name}</h2>
              <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${getStatusColor(loan.status)}`}>
                {getStatusLabel(loan.status)}
              </span>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
              <div>
                <p className="text-[11px] text-slate-500 tracking-wider">MONTO ORIGINAL</p>
                <p className="text-xl font-bold text-white mt-1">{formatCOP(loan.amount)}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500 tracking-wider">SALDO ACTUAL</p>
                <p className="text-xl font-bold text-amber-400 mt-1">{formatCOP(currentBalance)}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500 tracking-wider">ESTADO</p>
                <p className={`text-sm font-medium mt-2 ${getStatusColor(loan.status).split(' ')[0]}`}>
                  {getStatusLabel(loan.status)}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-400">Progreso de pago</span>
                <span className="text-xs text-white font-medium">{progressPercent}%</span>
              </div>
              <div className="h-2.5 bg-[#0B1120] rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-[#0B1120] rounded-xl">
              <div>
                <p className="text-[10px] text-slate-500 tracking-wider">TASA DE INTERÉS</p>
                <p className="text-sm text-white font-medium mt-1">{loan.rate}% mensual</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 tracking-wider">PLAZO</p>
                <p className="text-sm text-white font-medium mt-1">{loan.term} meses</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 tracking-wider">FECHA INICIO</p>
                <p className="text-sm text-white font-medium mt-1">{formatDate(loan.startDate)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 tracking-wider">INTERÉS MENSUAL ESPERADO</p>
                <p className="text-sm text-emerald-400 font-bold mt-1">{formatCOP(monthlyInterest)}</p>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-4">Historial de Pagos</h3>
            {loan.payments.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No hay pagos registrados</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {loan.payments.map((p) => (
                  <div key={p.id} className="flex items-center gap-4 p-3 bg-[#0B1120] rounded-xl">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium">{formatDate(p.date)}</p>
                      <p className="text-xs text-slate-500">
                        Intereses: {formatCOP(p.interestAmount)}
                        {p.capitalAmount > 0 && ` | Capital: ${formatCOP(p.capitalAmount)}`}
                        <span className="ml-2">Saldo: {formatCOP(p.previousBalance)} → {formatCOP(p.newBalance)}</span>
                      </p>
                    </div>
                    <span className="text-sm font-bold text-emerald-400 flex-shrink-0">
                      {formatCOP(p.interestAmount + p.capitalAmount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-white">Notas del Préstamo</h3>
              {!editingNotes ? (
                <button onClick={() => setEditingNotes(true)} className="text-xs text-emerald-400 hover:text-emerald-300">Editar</button>
              ) : (
                <button onClick={handleSaveNotes} className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300">
                  <Save className="w-3 h-3" /> Guardar
                </button>
              )}
            </div>
            {editingNotes ? (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all resize-none"
              />
            ) : (
              <p className="text-sm text-slate-400">{loan.notes || 'Sin notas'}</p>
            )}
          </div>
        </div>

        {/* Right Sidebar Stats */}
        <div className="space-y-4">
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-xs text-slate-500">Total Intereses Pagados</span>
            </div>
            <p className="text-xl font-bold text-white">{formatCOP(totalInterestPaid)}</p>
          </div>
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-xs text-slate-500">Capital Abonado</span>
            </div>
            <p className="text-xl font-bold text-white">{formatCOP(totalCapitalPaid)}</p>
          </div>
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-xs text-slate-500">Total de Pagos</span>
            </div>
            <p className="text-xl font-bold text-white">{loan.payments.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}