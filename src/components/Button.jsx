import React from 'react';

/**
 * Standardized Button Component
 * Provides clean, consistent healthcare buttons with stable heights and paddings.
 */
export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  icon: Icon,
  className = '',
  title,
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none focus:outline-hidden';

  const variants = {
    primary:
      'bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white shadow-2xs border border-teal-600',
    secondary:
      'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 border border-slate-200',
    outline:
      'bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs',
    danger:
      'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-2xs border border-rose-600',
    dangerOutline:
      'bg-white hover:bg-rose-50 active:bg-rose-100 text-rose-700 border border-rose-200 shadow-2xs',
    ghost:
      'hover:bg-slate-100 active:bg-slate-200 text-slate-600 hover:text-slate-900 border border-transparent',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 min-h-[32px] sm:min-h-[30px] gap-1.5',
    md: 'text-xs sm:text-sm px-3.5 py-2 min-h-[38px] sm:min-h-[36px] gap-2',
    lg: 'text-sm px-4 py-2.5 min-h-[44px] sm:min-h-[42px] gap-2.5',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      {children}
    </button>
  );
}
