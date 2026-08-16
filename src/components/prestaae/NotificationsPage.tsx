'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { formatCOP, formatDate, getInitials, getAvatarColor } from '@/lib/format';
import { RefreshCw, CreditCard, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface Notification {
  loanId: string;
  clientName: string;
  balance: number;
  expectedInterest: number;
  paymentDay: number;
  nextPaymentDate: string;
  daysUntil: number;
}

export default function NotificationsPage() {
  const { setCurrentPage, setSelectedLoanId, refreshKey } = useAppStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/notifications?days=${days}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setNotifications(Array.isArray(data) ? data : []);
        }
      });
    return () => { cancelled = true; };
  }, [days, refreshKey]);

  const loadNotifications = () => {
    setLoading(true);
    fetch(`/api/notifications?days=${days}`)
      .then((r) => r.json())
      .then((data) => {
        setNotifications(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  };

  const goPayment = (loanId: string) => {
    setSelectedLoanId(loanId);
    setCurrentPage('register-payment');
  };

  const goDetail = (loanId: string) => {
    setSelectedLoanId(loanId);
    setCurrentPage('loan-detail');
  };

  return (
    <div className="p-4 md:p-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="lg:hidden">
          <p className="text-xs text-slate-400">Clientes con pagos próximos a vencer</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[3, 7, 15].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                  days === d ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 border border-[#1E293B] hover:border-slate-600'
                }`}
              >
                {d} días
              </button>
            ))}
          </div>
          <button
            onClick={loadNotifications}
            disabled={loading}
            className="flex items-center gap-1.5 text-sm text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 px-3 py-1.5 rounded-lg transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Actualizar
          </button>
        </div>
      </div>

      {/* Notification Cards */}
      {notifications.length === 0 ? (
        <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-12 text-center">
          <p className="text-slate-500 text-sm">No hay notificaciones para los próximos {days} días</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notifications.map((n) => (
            <div key={n.loanId} className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${getAvatarColor(n.clientName)}`}>
                  {getInitials(n.clientName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{n.clientName}</p>
                  <p className="text-xs text-slate-500">Próximo pago: {formatDate(n.nextPaymentDate)}</p>
                </div>
                {n.daysUntil <= 2 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-medium">
                    {n.daysUntil === 0 ? 'HOY' : `${n.daysUntil}d`}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-slate-500 tracking-wider">SALDO</p>
                  <p className="text-sm font-bold text-amber-400 mt-0.5">{formatCOP(n.balance)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 tracking-wider">INTERÉS ESPERADO</p>
                  <p className="text-sm font-bold text-emerald-400 mt-0.5">{formatCOP(n.expectedInterest)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 tracking-wider">DÍA DE PAGO</p>
                  <span className="inline-flex text-sm font-medium text-white bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 rounded-full mt-0.5">
                    {n.paymentDay}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 tracking-wider">PRÓXIMA FECHA</p>
                  <p className="text-sm font-medium text-white mt-0.5">{formatDate(n.nextPaymentDate)}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => goPayment(n.loanId)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
                >
                  <CreditCard className="w-3.5 h-3.5" /> Registrar pago
                </button>
                <button
                  onClick={() => goDetail(n.loanId)}
                  className="flex-1 flex items-center justify-center gap-1.5 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                >
                  <Eye className="w-3.5 h-3.5" /> Ver préstamo
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
