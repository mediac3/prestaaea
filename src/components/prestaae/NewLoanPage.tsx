'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { formatCOP } from '@/lib/format';
import { FileText, User, DollarSign, Percent, Calendar, AlignLeft, Info, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface ClientOption { id: string; name: string; cedula: string; }
interface Product { id: string; name: string; baseRate: number; maxTerm: number; maxAmount: number | null; requirements: string; }

export default function NewLoanPage() {
  const { setCurrentPage, setSelectedLoanId, refreshKey, triggerRefresh } = useAppStore();
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [clientSearch, setClientSearch] = useState('');

  const [form, setForm] = useState({
    clientId: '',
    amount: '',
    rate: '10',
    term: '',
    startDate: new Date().toISOString().split('T')[0],
    paymentDay: '15',
    amortization: 'interes_fijo',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/clients').then((r) => r.json()).then((data) => setClients(Array.isArray(data) ? data : []));
    fetch('/api/products').then((r) => r.json()).then((data) => setProducts(Array.isArray(data) ? data : []));
  }, []);

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.cedula.includes(clientSearch)
  );

  const selectedClient = clients.find((c) => c.id === form.clientId);
  const amount = parseFloat(form.amount) || 0;
  const rate = parseFloat(form.rate) || 0;
  const monthlyInterest = amount * (rate / 100);

  const handleSubmit = async () => {
    if (!form.clientId || !form.amount || !form.term || !form.startDate || !form.paymentDay) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: form.clientId,
          amount: parseFloat(form.amount),
          rate: parseFloat(form.rate),
          term: parseInt(form.term),
          startDate: form.startDate,
          paymentDay: parseInt(form.paymentDay),
          amortization: form.amortization,
          notes: form.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Error al crear'); return; }
      toast.success('Préstamo creado exitosamente');
      triggerRefresh();
      setSelectedLoanId(data.id);
      setCurrentPage('loan-detail');
    } catch { toast.error('Error de conexión'); } finally { setLoading(false); }
  };

  return (
    <div className="p-4 md:p-6 animate-fade-in">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Form */}
        <div className="xl:col-span-2">
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Client */}
              <div className="md:col-span-2 relative">
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  <User className="w-3.5 h-3.5 inline mr-1.5" />Cliente <span className="text-red-400">*</span>
                </label>
                <div
                  onClick={() => setShowClientDropdown(true)}
                  className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-4 py-2.5 text-sm text-white cursor-pointer flex items-center justify-between hover:border-emerald-500/30 transition-all"
                >
                  <span className={selectedClient ? '' : 'text-slate-500'}>
                    {selectedClient ? `${selectedClient.name} — ${selectedClient.cedula}` : 'Seleccionar cliente...'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
                {showClientDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#1E293B] border border-[#334155] rounded-xl shadow-2xl z-50 max-h-60 overflow-hidden">
                    <div className="p-2 border-b border-[#334155]">
                      <input
                        autoFocus
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        placeholder="Buscar cliente..."
                        className="w-full bg-[#0B1120] border border-[#1E293B] rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none"
                      />
                    </div>
                    <div className="max-h-44 overflow-y-auto">
                      {filteredClients.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => { setForm({ ...form, clientId: c.id }); setShowClientDropdown(false); setClientSearch(''); }}
                          className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all"
                        >
                          {c.name} <span className="text-slate-500">— {c.cedula}</span>
                        </button>
                      ))}
                      {filteredClients.length === 0 && (
                        <p className="text-center py-4 text-slate-500 text-sm">No se encontró el cliente</p>
                      )}
                    </div>
                    <button onClick={() => { setShowClientDropdown(false); setClientSearch(''); }} className="w-full text-left px-4 py-2 text-sm text-slate-500 border-t border-[#334155]">
                      Cerrar
                    </button>
                  </div>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  <DollarSign className="w-3.5 h-3.5 inline mr-1.5" />Monto del préstamo <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0"
                    className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl pl-8 pr-12 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">COP</span>
                </div>
              </div>

              {/* Rate */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  <Percent className="w-3.5 h-3.5 inline mr-1.5" />Tasa de interés mensual <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={form.rate}
                    onChange={(e) => setForm({ ...form, rate: e.target.value })}
                    className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-4 pr-12 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">%</span>
                </div>
                {/* Quick rate buttons from products */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {products.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setForm({ ...form, rate: String(p.baseRate) })}
                      className={`text-[10px] px-2 py-1 rounded-lg border transition-all ${
                        form.rate === String(p.baseRate)
                          ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                          : 'border-[#1E293B] text-slate-500 hover:border-slate-600'
                      }`}
                      title={p.requirements}
                    >
                      {p.name} {p.baseRate}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Term */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  <Calendar className="w-3.5 h-3.5 inline mr-1.5" />Plazo en meses <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={form.term}
                    onChange={(e) => setForm({ ...form, term: e.target.value })}
                    placeholder="0"
                    className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-4 pr-16 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">meses</span>
                </div>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  <Calendar className="w-3.5 h-3.5 inline mr-1.5" />Fecha de inicio <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                />
              </div>

              {/* Payment Day */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Día de pago (1-31) <span className="text-red-400">*</span></label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={form.paymentDay}
                  onChange={(e) => setForm({ ...form, paymentDay: e.target.value })}
                  className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                />
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  <AlignLeft className="w-3.5 h-3.5 inline mr-1.5" />Notas (opcional)
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  placeholder="Observaciones sobre el préstamo..."
                  className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-[#1E293B]">
              <button onClick={() => setCurrentPage('loans')} className="px-4 py-2.5 text-sm text-slate-300 hover:text-white transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
              >
                <FileText className="w-4 h-4" /> Crear Préstamo
              </button>
            </div>
          </div>
        </div>

        {/* Preview Sidebar */}
        <div className="xl:col-span-1">
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 sticky top-20 space-y-5">
            <h3 className="text-base font-bold text-white">Vista Previa</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Monto del préstamo</span>
                <span className="text-sm text-white font-medium">{formatCOP(amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Tasa de interés</span>
                <span className="text-sm text-violet-400 font-medium">{rate}% mensual</span>
              </div>
              <div className="border-t border-[#1E293B] pt-4">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">Interés mensual esperado</span>
                  <span className="text-base text-emerald-400 font-bold">{formatCOP(monthlyInterest)}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl">
              <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-400/80 leading-relaxed">
                El interés mensual se calcula sobre el saldo pendiente del capital.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}