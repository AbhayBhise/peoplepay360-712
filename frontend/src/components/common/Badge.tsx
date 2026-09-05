import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | 'active'
    | 'inactive'
    | 'draft'
    | 'validate'
    | 'validated'
    | 'computed'
    | 'paid'
    | 'refused'
    | 'warning'
    | 'danger'
    | 'info'
    | 'secondary'
    | 'neutral';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  icon,
  className = '',
}) => {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  };

  const variantStyles: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    inactive: 'bg-slate-100 text-slate-600 border-slate-200',
    draft: 'bg-amber-50 text-amber-800 border-amber-200',
    validate: 'bg-blue-50 text-blue-800 border-blue-200',
    validated: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    computed: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    paid: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-semibold',
    refused: 'bg-rose-50 text-rose-800 border-rose-200',
    warning: 'bg-amber-100 text-amber-900 border-amber-300',
    danger: 'bg-rose-100 text-rose-900 border-rose-300',
    info: 'bg-sky-50 text-sky-800 border-sky-200',
    secondary: 'bg-teal-50 text-teal-800 border-teal-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border shadow-2xs ${
        sizeStyles[size]
      } ${variantStyles[variant] || variantStyles.neutral} ${className}`}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
};
