'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { formatCOP, formatDate, getStatusColor, getStatusLabel } from '@/lib/format';
import { CreditCard, CheckCircle, Trash2, TrendingUp, Building2, FileText, Save, Edit2, MessageCircle, X } from 'lucide-react';
import { toast } from 'sonner';

interface Payment {
  id: string;
  date: string;
  type: string;
  interestAmount: number;
  capitalAmount: number;
  interestPayment: number;
  previousBalance: number;
  newBalance: number;
  notes: string | null;
  receipt: string | null;
}

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
  payments: Payment[];
}

export default function LoanDetailPage() {
  const { selectedLoanId, setCurrentPage, refreshKey, triggerRefresh } = useAppStore();
  const [loan, setLoan] = useState<LoanDetail | null>(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [editForm, setEditForm] = useState({
    date: '',
    type: 'interes',
    capitalAmount: '',
    interestPaymentAmount: '',
    notes: '',
    receipt: '',
  });

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

  const handleEditPayment = (payment: Payment) => {
    setEditingPayment(payment);
    setEditForm({
      date: payment.date.split('T')[0],
      type: payment.type,
      capitalAmount: payment.capitalAmount.toString(),
      interestPaymentAmount: payment.interestPayment.toString(),
      notes: payment.notes || '',
      receipt: payment.receipt || '',
    });
  };

  const handleSavePaymentEdit = async () => {
    if (!editingPayment) return;
    try {
      const res = await fetch(`/api/payments/${editingPayment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: editForm.date,
          type: editForm.type,
          capitalAmount: parseFloat(editForm.capitalAmount) || 0,
          interestPaymentAmount: parseFloat(editForm.interestPaymentAmount) || 0,
          notes: editForm.notes || undefined,
          receipt: editForm.receipt || undefined,
        }),
      });
      if (res.ok) {
        toast.success('Pago actualizado');
        setEditingPayment(null);
        loadLoan();
        triggerRefresh();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Error al actualizar');
      }
    } catch { toast.error('Error de conexión'); }
  };

  const handleWhatsApp = (payment: Payment) => {
    if (!loan) return;
    const phone = loan.client.phone.replace(/[^0-9]/g, '');
    const message = `*PAGO REGISTRADO - PRESTAAEA*\n\n` +
      `*Cliente:* ${loan.client.name}\n` +
      `*Cédula:* ${loan.client.cedula}\n\n` +
      `*DETALLES DEL PAGO:*\n` +
      `Fecha: ${formatDate(payment.date)}\n` +
      `Tipo: ${payment.type === 'interes' ? 'Solo Intereses' : payment.type === 'interes_capital' ? 'Intereses + Capital' : payment.type === 'capital' ? 'Solo Capital' : payment.type === 'abono_intereses' ? 'Abono a Intereses' : payment.type}\n` +
      `Intereses: ${formatCOP(payment.interestAmount)}\n` +
      `${payment.interestPayment > 0 ? `Abono a Intereses: ${formatCOP(payment.interestPayment)}\n` : ''}` +
      `${payment.capitalAmount > 0 ? `Abono a Capital: ${formatCOP(payment.capitalAmount)}\n` : ''}` +
      `Total Pagado: ${formatCOP(payment.interestAmount + payment.capitalAmount + payment.interestPayment)}\n\n` +
      `Saldo Anterior: ${formatCOP(payment.previousBalance)}\n` +
      `Nuevo Saldo: ${formatCOP(payment.newBalance)}\n` +
      `${payment.receipt ? `Recibo: ${payment.receipt}\n` : ''}` +
      `${payment.notes ? `Notas: ${payment.notes}` : ''}`;
    
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
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
                  <div key={p.id} className="flex items-center gap-3 p-3 bg-[#0B1120] rounded-xl">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium">{formatDate(p.date)}</p>
                      <p className="text-xs text-slate-500">
                        Intereses: {formatCOP(p.interestAmount)}
                        {p.capitalAmount > 0 && ` | Capital: ${formatCOP(p.capitalAmount)}`}
                        {p.interestPayment > 0 && ` | Abono Int: ${formatCOP(p.interestPayment)}`}
                        <span className="ml-2">Saldo: {formatCOP(p.previousBalance)} → {formatCOP(p.newBalance)}</span>
                      </p>
                      {p.receipt && <p className="text-xs text-slate-400 mt-1">Recibo: {p.receipt}</p>}
                      {p.notes && <p className="text-xs text-slate-400">Notas: {p.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-bold text-emerald-400">
                        {formatCOP(p.interestAmount + p.capitalAmount + p.interestPayment)}
                      </span>
                      <button
                        onClick={() => handleWhatsApp(p)}
                        className="p-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 transition-colors"
                        title="Enviar por WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditPayment(p)}
                        className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors"
                        title="Editar pago"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Edit Payment Modal */}
          {editingPayment && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-white">Editar Pago</h3>
                  <button onClick={() => setEditingPayment(null)} className="text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Fecha</label>
                    <input
                      type="date"
                      value={editForm.date}
                      onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                      className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Tipo de pago</label>
                    <select
                      value={editForm.type}
                      onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                      className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    >
                      <option value="interes">Solo Intereses</option>
                      <option value="interes_capital">Intereses + Capital</option>
                      <option value="capital">Solo Capital</option>
                      <option value="abono_intereses">Abono a Intereses</option>
                    </select>
                  </div>
                  {(editForm.type === 'interes_capital' || editForm.type === 'capital') && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">Abono a Capital</label>
                      <input
                        type="number"
                        value={editForm.capitalAmount}
                        onChange={(e) => setEditForm({ ...editForm, capitalAmount: e.target.value })}
                        className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                  )}
                  {editForm.type === 'abono_intereses' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">Abono a Intereses</label>
                      <input
                        type="number"
                        value={editForm.interestPaymentAmount}
                        onChange={(e) => setEditForm({ ...editForm, interestPaymentAmount: e.target.value })}
                        className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Recibo</label>
                    <input
                      value={editForm.receipt}
                      onChange={(e) => setEditForm({ ...editForm, receipt: e.target.value })}
                      placeholder="Número de recibo"
                      className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Notas</label>
                    <textarea
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      rows={2}
                      className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 resize-none"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-[#1E293B]">
                    <button
                      onClick={() => setEditingPayment(null)}
                      className="px-4 py-2.5 text-sm text-slate-300 hover:text-white"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSavePaymentEdit}
                      className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium"
                    >
                      <Save className="w-4 h-4" /> Guardar Cambios
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

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