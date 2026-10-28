import React from 'react';

/**
 * Standardized Card component for clinical dashboards
 * Simple light background, subtle border, rounded corners, clean spacing.
 */
export default function Card({
  title,
  subtitle,
  action,
  icon: Icon,
  children,
  className = '',
  bodyClassName = '',
  footer,
}) {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden transition-colors ${className}`}
    >
      {(title || subtitle || action || Icon) && (
        <div className="px-4 md:px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {Icon && (
              <div className="p-1.5 bg-teal-50 text-teal-700 rounded-lg border border-teal-100 shrink-0">
                <Icon className="w-4 h-4" />
              </div>
            )}
            <div className="min-w-0">
              {title && (
                <h3 className="font-semibold text-slate-900 text-xs md:text-sm truncate">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-[11px] md:text-xs text-slate-500 mt-0.5 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={`p-4 md:p-5 ${bodyClassName}`}>{children}</div>
      {footer && (
        <div className="px-4 md:px-5 py-2.5 bg-slate-50 border-t border-slate-100 text-xs text-slate-600">
          {footer}
        </div>
      )}
    </div>
  );
}
