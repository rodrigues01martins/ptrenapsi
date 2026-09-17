import React from 'react';

// Card genérico do lado "nativo" — consolida o container
// "bg-white border-slate-100 rounded-2xl shadow-sm" repetido em pelo
// menos 14 lugares (resumos, tabelas, formulários).
//
// Props próprias e explícitas (sem extends de React.HTMLAttributes):
// o projeto não tem @types/react instalado, então esse tipo não
// carregaria membros reais aqui.

interface CardProps {
  padded?: boolean;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

export function Card({ padded = true, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`bg-white border border-slate-100 rounded-2xl shadow-sm ${padded ? 'p-6' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

type KpiTone = 'neutral' | 'muted' | 'primary' | 'success' | 'warning' | 'danger';

const toneClass: Record<KpiTone, string> = {
  neutral: 'text-slate-800',
  muted: 'text-slate-400',
  primary: 'text-[var(--native-primary)]',
  success: 'text-[var(--native-success)]',
  warning: 'text-[var(--native-warning-text)]',
  danger: 'text-[var(--native-danger)]',
};

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  description?: React.ReactNode;
  tone?: KpiTone;
  compact?: boolean;
  [key: string]: any;
}

// Card numérico padrão — consolida SummaryCards, os cards de resumo de
// UserManagement/BudgetItems e similares, que reimplementavam a mesma
// estrutura label/valor com pequenas variações de padding e tamanho.
export function KpiCard({ label, value, description, tone = 'neutral', compact = false }: KpiCardProps) {
  return (
    <div className={`bg-white border border-slate-100 rounded-2xl shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${compact ? 'p-4' : 'p-6'}`}>
      <p className="text-xs font-semibold text-slate-500 mb-1">{label}</p>
      <p className={`font-bold ${compact ? 'text-2xl' : 'text-xl'} ${toneClass[tone]}`}>{value}</p>
      {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
    </div>
  );
}
