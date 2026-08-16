'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  module: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const moduleOptions = [
  { value: '', label: 'Todos los módulos' },
  { value: 'auth', label: 'Autenticación' },
  { value: 'clients', label: 'Clientes' },
  { value: 'loans', label: 'Préstamos' },
  { value: 'payments', label: 'Pagos' },
  { value: 'users', label: 'Usuarios' },
  { value: 'ai', label: 'IA' },
];

const actionOptions = [
  { value: '', label: 'Todas las acciones' },
  { value: 'LOGIN', label: 'LOGIN' },
  { value: 'LOGOUT', label: 'LOGOUT' },
  { value: 'CREATE_CLIENT', label: 'CREATE_CLIENT' },
  { value: 'UPDATE_CLIENT', label: 'UPDATE_CLIENT' },
  { value: 'DELETE_CLIENT', label: 'DELETE_CLIENT' },
  { value: 'CREATE_LOAN', label: 'CREATE_LOAN' },
  { value: 'REGISTER_PAYMENT', label: 'REGISTER_PAYMENT' },
  { value: 'CLOSE_LOAN', label: 'CLOSE_LOAN' },
  { value: 'AI_CHAT', label: 'AI_CHAT' },
];

function getActionBadgeStyle(action: string): string {
  if (action === 'LOGIN' || action === 'LOGOUT') {
    return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
  }
  if (action.startsWith('CREATE_')) {
    return 'bg-green-500/15 text-green-400 border-green-500/30';
  }
  if (action.startsWith('UPDATE_')) {
    return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
  }
  if (action.startsWith('DELETE_')) {
    return 'bg-red-500/15 text-red-400 border-red-500/30';
  }
  if (action === 'REGISTER_PAYMENT') {
    return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  }
  if (action === 'CLOSE_LOAN') {
    return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
  }
  if (action === 'AI_CHAT') {
    return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
  }
  return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
}

function getModuleBadgeStyle(mod: string): string {
  const map: Record<string, string> = {
    auth: 'bg-blue-500/10 text-blue-400',
    clients: 'bg-emerald-500/10 text-emerald-400',
    loans: 'bg-amber-500/10 text-amber-400',
    payments: 'bg-green-500/10 text-green-400',
    users: 'bg-purple-500/10 text-purple-400',
    ai: 'bg-cyan-500/10 text-cyan-400',
  };
  return map[mod] || 'bg-slate-500/10 text-slate-400';
}

function getModuleLabel(mod: string): string {
  const map: Record<string, string> = {
    auth: 'Auth',
    clients: 'Clientes',
    loans: 'Préstamos',
    payments: 'Pagos',
    users: 'Usuarios',
    ai: 'IA',
  };
  return map[mod] || mod;
}

function parseDetails(details: string): string {
  try {
    const parsed = JSON.parse(details);
    if (typeof parsed === 'string') return parsed;
    const entries = Object.entries(parsed as Record<string, unknown>);
    if (entries.length === 0) return '-';
    const summary = entries
      .slice(0, 3)
      .map(([k, v]) => {
        const val = typeof v === 'object' ? JSON.stringify(v) : String(v);
        const truncated = val.length > 30 ? val.slice(0, 30) + '...' : val;
        return `${k}: ${truncated}`;
      })
      .join(' | ');
    return entries.length > 3 ? summary + ' ...' : summary;
  } catch {
    if (!details) return '-';
    return details.length > 80 ? details.slice(0, 80) + '...' : details;
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  const loadLogs = useCallback((p: number, searchVal: string, mod: string, act: string, start: string, end: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(p));
    params.set('limit', '50');
    if (searchVal) params.set('search', searchVal);
    if (mod) params.set('module', mod);
    if (act) params.set('action', act);
    if (start) params.set('startDate', start);
    if (end) params.set('endDate', end);

    fetch(`/api/audit?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setLogs(Array.isArray(data.logs) ? data.logs : []);
        setPagination(data.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 });
      })
      .catch(() => {
        setLogs([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadLogs(page, search, moduleFilter, actionFilter, startDate, endDate);
    }, 300);
    return () => clearTimeout(timer);
  }, [page, search, moduleFilter, actionFilter, startDate, endDate, loadLogs]);

  const goToPage = (newPage: number) => {
    setPage(newPage);
  };

  const updateSearch = (val: string) => { setSearch(val); setPage(1); };
  const updateModule = (val: string) => { setModuleFilter(val); setPage(1); };
  const updateAction = (val: string) => { setActionFilter(val); setPage(1); };
  const updateStartDate = (val: string) => { setStartDate(val); setPage(1); };
  const updateEndDate = (val: string) => { setEndDate(val); setPage(1); };

  const resetFilters = () => {
    setSearch('');
    setModuleFilter('');
    setActionFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  return (
    <div className="p-4 md:p-6 space-y-5 animate-fade-in">
      {/* Filters */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Filtros</h3>
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Limpiar
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={search}
              onChange={(e) => updateSearch(e.target.value)}
              placeholder="Buscar..."
              className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>
          <select
            value={moduleFilter}
            onChange={(e) => updateModule(e.target.value)}
            className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all appearance-none"
          >
            {moduleOptions.map((o) => (
              <option key={o.value} value={o.value} className="bg-[#0B1120]">{o.label}</option>
            ))}
          </select>
          <select
            value={actionFilter}
            onChange={(e) => updateAction(e.target.value)}
            className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all appearance-none"
          >
            {actionOptions.map((o) => (
              <option key={o.value} value={o.value} className="bg-[#0B1120]">{o.label}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => updateStartDate(e.target.value)}
              className="flex-1 bg-[#0B1120] border border-[#1E293B] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => updateEndDate(e.target.value)}
              className="flex-1 bg-[#0B1120] border border-[#1E293B] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Count */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">
          {loading ? 'Cargando...' : `${pagination.total} registro${pagination.total !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Table */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1E293B]">
                <th className="text-left text-[11px] font-medium text-slate-500 tracking-wider px-4 py-3">FECHA</th>
                <th className="text-left text-[11px] font-medium text-slate-500 tracking-wider px-4 py-3">USUARIO</th>
                <th className="text-left text-[11px] font-medium text-slate-500 tracking-wider px-4 py-3">ACCIÓN</th>
                <th className="text-left text-[11px] font-medium text-slate-500 tracking-wider px-4 py-3 hidden md:table-cell">MÓDULO</th>
                <th className="text-left text-[11px] font-medium text-slate-500 tracking-wider px-4 py-3 hidden lg:table-cell">DETALLES</th>
                <th className="text-left text-[11px] font-medium text-slate-500 tracking-wider px-4 py-3 hidden xl:table-cell">IP</th>
              </tr>
            </thead>
            <tbody>
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500 text-sm">
                    <div className="w-5 h-5 border-2 border-slate-600 border-t-emerald-500 rounded-full animate-spin mx-auto mb-2" />
                    Cargando registros...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500 text-sm">
                    No se encontraron registros de auditoría
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-[#1E293B]/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-300 whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="min-w-0">
                        <span className="text-sm text-white font-medium truncate block max-w-[150px]">{log.userName}</span>
                        <span className="text-xs text-slate-500 block truncate max-w-[150px]">{log.userEmail}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full border whitespace-nowrap ${getActionBadgeStyle(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${getModuleBadgeStyle(log.module)}`}>
                        {getModuleLabel(log.module)}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-slate-400 block max-w-[250px] truncate" title={log.details}>
                        {parseDetails(log.details)}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-xs text-slate-500 font-mono">{log.ipAddress}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            disabled={pagination.page <= 1}
            onClick={() => goToPage(pagination.page - 1)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-400 hover:text-white border border-[#1E293B] rounded-xl hover:bg-slate-800/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" /> Anterior
          </button>
          <span className="text-sm text-slate-400">
            Página {pagination.page} de {pagination.totalPages}
          </span>
          <button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => goToPage(pagination.page + 1)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-400 hover:text-white border border-[#1E293B] rounded-xl hover:bg-slate-800/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Siguiente <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
