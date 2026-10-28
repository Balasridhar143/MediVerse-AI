import React from 'react';
import StatusBadge from './StatusBadge';

/**
 * Standardized PageHeader component
 * Consistently displays page title, category badge, subtitle, and action buttons.
 */
export default function PageHeader({
  title,
  subtitle,
  badge,
  badgeStatus,
  action,
  children,
  className = '',
}) {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-xl p-4 md:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${className}`}
    >
      <div className="min-w-0">
        {(badge || badgeStatus) && (
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {badge && (
              <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {badge}
              </span>
            )}
            {badgeStatus && <StatusBadge status={badgeStatus} size="xs" />}
          </div>
        )}
        <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs md:text-sm text-slate-500 mt-1 leading-relaxed">
            {subtitle}
          </p>
        )}
        {children}
      </div>

      {action && (
        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-auto">
          {action}
        </div>
      )}
    </div>
  );
}
