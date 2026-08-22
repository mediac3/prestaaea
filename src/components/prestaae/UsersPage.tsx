'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { UserPlus, Search, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

interface UserItem {
  id: string;
  email: string;
  name: string;
  role: string;
  twoFactorEnabled: boolean;
  twoFactorEmail: string | null;
  createdAt: string;
  updatedAt: string;
}

const roleMap: Record<string, string> = {
  admin: 'Administrador',
  cliente: 'Cliente',
};

const emptyForm = { nombre: '', email: '', password: '', role: 'cliente', twoFactorEnabled: false, twoFactorEmail: '' };

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function UsersPage() {
  const { user, refreshKey } = useAppStore();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const auditCtx = {
    _audit: {
      userId: user?.id || '',
      userName: user?.name || '',
      userEmail: user?.email || '',
    },
  };

  const loadUsers = useCallback(() => {
    fetch('/api/users')
      .then((r) => r.json())
      .then((data) => {
        setUsers(Array.isArray(data) ? data : []);
      });
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers, refreshKey]);

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const openNewModal = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (u: UserItem) => {
    setEditingUser(u);
    setForm({
      nombre: u.name,
      email: u.email,
      password: '',
      role: u.role,
      twoFactorEnabled: u.twoFactorEnabled,
      twoFactorEmail: u.twoFactorEmail || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre || !form.email) {
      toast.error('Nombre y email son requeridos');
      return;
    }
    if (!editingUser && !form.password) {
      toast.error('La contraseña es requerida para crear un usuario');
      return;
    }
    setSubmitting(true);
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';
      const body: Record<string, unknown> = {
        name: form.nombre,
        email: form.email,
        role: form.role,
        twoFactorEnabled: form.twoFactorEnabled,
        twoFactorEmail: form.twoFactorEmail || null,
        ...auditCtx,
      };
      if (form.password) {
        body.password = form.password;
      }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Error al guardar usuario');
        return;
      }
      toast.success(editingUser ? 'Usuario actualizado' : 'Usuario creado exitosamente');
      setModalOpen(false);
      loadUsers();
    } catch {
      toast.error('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(auditCtx),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Error al eliminar usuario');
        return;
      }
      toast.success('Usuario eliminado correctamente');
      setDeleteConfirm(null);
      loadUsers();
    } catch {
      toast.error('Error de conexión');
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="lg:hidden">
          <p className="text-xs text-slate-400">Administra los usuarios del sistema</p>
        </div>
        <button
          onClick={openNewModal}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-emerald-500/20 self-start"
        >
          <UserPlus className="w-4 h-4" /> Agregar Usuario
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o email..."
          className="w-full bg-[#111827] border border-[#1E293B] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all"
        />
      </div>

      {/* Count */}
      <span className="text-sm text-slate-400">{filteredUsers.length} usuario{filteredUsers.length !== 1 ? 's' : ''}</span>

      {/* Table */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1E293B]">
                <th className="text-left text-[11px] font-medium text-slate-500 tracking-wider px-5 py-3">NOMBRE</th>
                <th className="text-left text-[11px] font-medium text-slate-500 tracking-wider px-4 py-3 hidden sm:table-cell">EMAIL</th>
                <th className="text-left text-[11px] font-medium text-slate-500 tracking-wider px-4 py-3">ROL</th>
                <th className="text-left text-[11px] font-medium text-slate-500 tracking-wider px-4 py-3 hidden md:table-cell">FECHA CREACIÓN</th>
                <th className="text-right text-[11px] font-medium text-slate-500 tracking-wider px-5 py-3">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id} className="border-b border-[#1E293B]/50 hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3">
                    <span className="text-sm text-white font-medium">{u.name}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300 hidden sm:table-cell">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${
                        u.role === 'admin'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                      }`}
                    >
                      {roleMap[u.role] || u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400 hidden md:table-cell">
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditModal(u)}
                        className="p-1.5 text-slate-400 hover:text-amber-400 transition-colors rounded-lg hover:bg-amber-500/10"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(u.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-500 text-sm">
                    No se encontraron usuarios
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl w-full max-w-lg p-6 space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {editingUser ? 'Editar Usuario' : 'Agregar Usuario'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Nombre <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Nombre completo"
                  className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="correo@ejemplo.com"
                  className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Contraseña {editingUser ? <span className="text-slate-500">(dejar vacío para no cambiar)</span> : <span className="text-red-400">*</span>}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={editingUser ? 'Nueva contraseña (opcional)' : 'Contraseña'}
                  className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Rol <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all appearance-none"
                >
                  <option value="cliente" className="bg-[#0B1120]">Cliente</option>
                  <option value="admin" className="bg-[#0B1120]">Administrador</option>
                </select>
              </div>

              {editingUser && (
                <>
                  <div className="border-t border-[#1E293B] pt-4">
                    <h4 className="text-sm font-semibold text-white mb-3">Autenticación de Dos Factores</h4>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <label className="text-sm text-slate-300">Habilitar 2FA</label>
                        <p className="text-xs text-slate-500">Requiere código por email al iniciar sesión</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, twoFactorEnabled: !form.twoFactorEnabled })}
                        className={`relative w-12 h-6 rounded-full transition-colors ${form.twoFactorEnabled ? 'bg-emerald-500' : 'bg-slate-600'}`}
                      >
                        <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${form.twoFactorEnabled ? 'translate-x-6' : ''}`} />
                      </button>
                    </div>

                    {form.twoFactorEnabled && (
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                          Email para 2FA <span className="text-slate-500">(opcional, usa el principal si vacío)</span>
                        </label>
                        <input
                          type="email"
                          value={form.twoFactorEmail || ''}
                          onChange={(e) => setForm({ ...form, twoFactorEmail: e.target.value })}
                          placeholder="correo2fa@ejemplo.com"
                          className="w-full bg-[#0B1120] border border-[#1E293B] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 text-sm text-slate-300 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  {editingUser ? 'Actualizar' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl w-full max-w-sm p-6 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Eliminar Usuario</h3>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="p-1.5 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-400">
              ¿Estás seguro de eliminar este usuario?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2.5 text-sm text-slate-300 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
              >
                <Trash2 className="w-4 h-4" /> Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
