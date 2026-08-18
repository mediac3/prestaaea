'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { formatCOP } from '@/lib/format';
import { CreditCard, Calendar, AlignLeft } from 'lucide-react';
import { toast } from 'sonner';

interface LoanOption {
  id: string;
  client: { name: string };
  amount: number;
  rate: number;
  status: string;
  payments: { newBalance: number }[];
}

export default function RegisterPaymentPage() {
  const { selectedLoanId, setCurrentPage, refreshKey, triggerRefresh, setSelectedLoanId } = useAppStore();
  const [loans, setLoans] = useState<LoanOption[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<LoanOption | null>(null);
  const [paymentType, setPaymentType] = useState<'interes' | 'interes_capital' | 'capital' | 'abono_intereses'>('interes');
  const [capitalAmount, setCapitalAmount] = useState('');
  const [interestPaymentAmount, setInterestPaymentAmount] = useState(''); // Abono a intereses
  const [receipt, setReceipt] = useState(''); // Número de recibo
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/loans?status=activo')
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setLoans(list);
        // Auto-select if coming from loan detail
        if (selectedLoanId) {
          const found = list.find((l: LoanOption) => l.id === selectedLoanId);
          if (found) setSelectedLoan(found);
        }
      });
  }, [refreshKey, selectedLoanId]);

  const currentBalance = selectedLoan
    ? (selectedLoan.payments.length > 0 ? selectedLoan.payments[0].newBalance : selectedLoan.amount)
    : 0;
  const monthlyInterest = selectedLoan ? currentBalance * (selectedLoan.rate / 100) : 0;
  const capital = paymentType === 'capital' ? (parseFloat(capitalAmount) || 0) : (paymentType === 'interes_capital' ? (parseFloat(capitalAmount) || 0) : 0);
  const interestPayment = parseFloat(interestPaymentAmount) || 0; // Abono a intereses
  const totalPayment = (paymentType === 'capital' || paymentType === 'abono_intereses' ? 0 : monthlyInterest) + capital + interestPayment;
  const newBalance = currentBalance - capital;

  const handleSubmit = async () => {
    if (!selectedLoan) { toast.error('Selecciona un préstamo'); return; }
    if (paymentType === 'abono_intereses' && !interestPaymentAmount) {
      toast.error('El abono a intereses es obligatorio para este tipo de pago');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loanId: selectedLoan.id,
          date,
          type: paymentType,
          interestAmount: paymentType === 'capital' || paymentType === 'abono_intereses' ? 0 : monthlyInterest,
          capitalAmount: capital,
          interestPaymentAmount: interestPayment, // Abono a intereses
          receipt: receipt || null,
          notes: notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Error al registrar pago'); return; }
      toast.success('Pago registrado exitosamente');
      triggerRefresh();
      setSelectedLoanId(selectedLoan.id);
      setCurrentPage('loan-detail');
    } catch { toast.error('Error de conexión'); } finally { setLoading(false); }
  };

  const paymentTypes = [
    { value: 'interes' as const, label: 'Solo Intereses', desc: 'Pago mensual regular de intereses' },
    { value: 'interes_capital' as const, label: 'Intereses + Abono a Capital', desc: 'Pago de intereses más un abono para reducir el saldo' },
    { value: 'capital' as const, label: 'Solo Abono a Capital', desc: 'Abono para reducir el saldo, sin cobro de intereses' },
    { value: 'abono_intereses' as const, label: 'Abono a Intereses', desc: 'Pago adicional directamente a intereses, sin afectar capital' },
  ];

  return (
    <div className="p-4 md:p-6 animate-fade-in">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Form */}
        <div className="xl:col-span-2">
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6 space-y-5">
            {/* Loan Selector */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Préstamo <span className="text-red-400">*</span></label>
              <select
                value={selectedLoan?.id || ''}
                onChange={(e) => {
                  const found = loans.find((l) => l.id === e.target.value);
                  setSelectedLoan(found || null);
                }}
                className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all appearance-none"
              >
                <option value="">Seleccionar préstamo...</option>
                {loans.map((l) => {
                  const bal = l.payments.length > 0 ? l.payments[0].newBalance : l.amount;
                  return (
                    <option key={l.id} value={l.id}>
                      {l.client.name} — Saldo: {formatCOP(bal)}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Loan Summary */}
            {selectedLoan && (
              <div className="grid grid-cols-3 gap-4 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 tracking-wider">SALDO ACTUAL</p>
                  <p className="text-lg font-bold text-white mt-1">{formatCOP(currentBalance)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 tracking-wider">TASA</p>
                  <p className="text-lg font-bold text-violet-400 mt-1">{selectedLoan.rate}%</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 tracking-wider">INTERÉS DEL MES</p>
                  <p className="text-lg font-bold text-emerald-400 mt-1">{formatCOP(monthlyInterest)}</p>
                </div>
              </div>
            )}

            {/* Payment Type */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">Tipo de pago</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {paymentTypes.map((pt) => (
                  <button
                    key={pt.value}
                    onClick={() => setPaymentType(pt.value)}
                    className={`text-left p-4 rounded-xl border transition-all ${
                      paymentType === pt.value
                        ? 'border-emerald-500/50 bg-emerald-500/5'
                        : 'border-[#1E293B] hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        paymentType === pt.value ? 'border-emerald-500' : 'border-slate-600'
                      }`}>
                        {paymentType === pt.value && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                      </div>
                      <span className="text-sm font-medium text-white">{pt.label}</span>
                    </div>
                    <p className="text-xs text-slate-500 ml-6">{pt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Capital Amount (conditional) */}
            {(paymentType === 'interes_capital' || paymentType === 'capital') && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Monto de abono a capital <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                  <input
                    type="number"
                    value={capitalAmount}
                    onChange={(e) => setCapitalAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl pl-8 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Interest Payment Amount (Abono a intereses) */}
            {paymentType !== 'capital' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Abono a Intereses {paymentType === 'abono_intereses' ? '(obligatorio)' : '(opcional)'} <span className={paymentType === 'abono_intereses' ? 'text-red-400' : 'text-slate-500'}>*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                  <input
                    type="number"
                    value={interestPaymentAmount}
                    onChange={(e) => setInterestPaymentAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl pl-8 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Receipt Number */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Número de Recibo (opcional)
              </label>
              <input
                type="text"
                value={receipt}
                onChange={(e) => setReceipt(e.target.value)}
                placeholder="Ej: REC-001234"
                className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all"
              />
            </div>

            {/* Date & Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  <Calendar className="w-3.5 h-3.5 inline mr-1.5" />Fecha del pago <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  <AlignLeft className="w-3.5 h-3.5 inline mr-1.5" />Notas (opcional)
                </label>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas del pago..."
                  className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1E293B]">
              <button onClick={() => setCurrentPage('loans')} className="px-4 py-2.5 text-sm text-slate-300 hover:text-white transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !selectedLoan}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
              >
                <CreditCard className="w-4 h-4" /> Registrar Pago
              </button>
            </div>
          </div>
        </div>

        {/* Summary Sidebar */}
        <div className="xl:col-span-1">
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 sticky top-20 space-y-4">
            <h3 className="text-base font-bold text-white">Resumen del Pago</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Intereses</span>
                <span className="text-sm text-white">{paymentType === 'capital' || paymentType === 'abono_intereses' ? formatCOP(0) : formatCOP(monthlyInterest)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Abono a Intereses</span>
                <span className="text-sm text-white">{formatCOP(interestPayment)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Abono a Capital</span>
                <span className="text-sm text-white">{formatCOP(capital)}</span>
              </div>
              {receipt && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Recibo</span>
                  <span className="text-sm text-emerald-400 font-medium">{receipt}</span>
                </div>
              )}
              <div className="border-t border-[#1E293B] pt-3 flex justify-between">
                <span className="text-sm text-white font-medium">Total a Pagar</span>
                <span className="text-base text-emerald-400 font-bold">{formatCOP(totalPayment)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Saldo Anterior</span>
                <span className="text-sm text-white">{formatCOP(currentBalance)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Nuevo Saldo</span>
                <span className="text-sm text-white font-medium">{formatCOP(Math.max(0, newBalance))}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
