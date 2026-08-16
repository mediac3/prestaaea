export function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-CO').format(value);
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateShort(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
  });
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'activo': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    case 'vencido': return 'text-red-400 bg-red-400/10 border-red-400/20';
    case 'pagado': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    case 'cerrado': return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    case 'moroso': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
    case 'inactivo': return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'activo': return 'ACTIVO';
    case 'vencido': return 'VENCIDO';
    case 'pagado': return 'PAGADO';
    case 'cerrado': return 'CERRADO';
    case 'moroso': return 'MOROSO';
    case 'inactivo': return 'INACTIVO';
    default: return status.toUpperCase();
  }
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function getAvatarColor(name: string): string {
  const colors = [
    'bg-emerald-500/20 text-emerald-400',
    'bg-blue-500/20 text-blue-400',
    'bg-violet-500/20 text-violet-400',
    'bg-amber-500/20 text-amber-400',
    'bg-rose-500/20 text-rose-400',
    'bg-cyan-500/20 text-cyan-400',
    'bg-pink-500/20 text-pink-400',
    'bg-teal-500/20 text-teal-400',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
