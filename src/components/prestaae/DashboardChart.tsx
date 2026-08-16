'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatCOP } from '@/lib/format';

interface ChartData {
  month: string;
  intereses: number;
  desembolsos: number;
}

export default function DashboardChart({ data }: { data: ChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} barCategoryGap="20%">
        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
        <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={{ stroke: '#1E293B' }} tickLine={false} />
        <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={{ stroke: '#1E293B' }} tickLine={false} tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
        <Tooltip
          contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '12px', color: '#F1F5F9', fontSize: 13 }}
          formatter={(value: number) => [formatCOP(value), 'Intereses']}
          labelStyle={{ color: '#94A3B8' }}
        />
        <Bar dataKey="intereses" radius={[6, 6, 0, 0]}>
          {data.map((_, idx) => (
            <Cell key={idx} fill={idx === data.length - 2 ? '#10B981' : '#064E3B'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
