import React from 'react';
import {
  AlertTriangle,
  Clock,
  PhoneCall,
  Eye,
  CheckCircle2,
  Calendar,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';

/**
 * CaregiverAlertCard
 * Reusable alert card for authorized caregivers displaying:
 * - Alert severity (High, Medium, Low)
 * - Clear factual alert description
 * - Immediate clinical action shortcuts: [ View Details ] & [ Contact Patient ]
 * - Simulated communication badge for prototype fidelity
 */
export default function CaregiverAlertCard({
  alert,
  onView,
  onContactPatient,
  onResolve,
}) {
  const isHigh = alert.severity === 'high' || alert.type === 'missed_medication';

  return (
    <div
      className={`p-4 rounded-xl border transition-all ${
        isHigh
          ? 'bg-amber-50/70 border-amber-300 shadow-2xs'
          : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              isHigh
                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            <AlertCircle className="w-5 h-5" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  isHigh
                    ? 'bg-amber-200/80 text-amber-950 border border-amber-300'
                    : 'bg-slate-200 text-slate-800'
                }`}
              >
                {alert.tag || 'Attention Needed'}
              </span>
              <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                <Clock className="w-3 h-3 text-slate-400" />
                {alert.time}
              </span>
            </div>

            <h4 className="font-bold text-slate-900 text-sm">{alert.title}</h4>
            <p className="text-xs text-slate-700 leading-relaxed max-w-xl">
              {alert.description}
            </p>

            {alert.patientNote && (
              <p className="text-[11px] text-slate-500 italic">
                Patient Context: {alert.patientNote}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 w-full sm:w-auto justify-end">
          {onView && (
            <button
              onClick={() => onView(alert)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 cursor-pointer flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>View</span>
            </button>
          )}

          {onContactPatient && (
            <button
              onClick={() => onContactPatient(alert)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 cursor-pointer flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Contact Patient</span>
            </button>
          )}

          {onResolve && (
            <button
              onClick={() => onResolve(alert.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer transition-colors"
              title="Acknowledge & clear alert"
              aria-label="Acknowledge alert"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
