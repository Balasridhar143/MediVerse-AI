import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';

/**
 * MedicineSafetyCheck
 * Reusable clinical safety check summary:
 * - Allergy Check (✓ No known conflict / ⚠ Potential allergy concern)
 * - Duplicate Check (✓ No duplicate detected / ⚠ Possible duplicate flagged)
 * - Interaction Check (✓ No major interaction / ⚠ Review required)
 * - Overall Doctor Review Status badge
 * - Simple patient-friendly explanations alongside clinical terms
 */
export default function MedicineSafetyCheck({
  safetyResult,
  showDetailedAlerts = true,
  className = '',
}) {
  const [expanded, setExpanded] = useState(false);

  if (!safetyResult) return null;

  const {
    allergyStatus,
    duplicateStatus,
    interactionStatus,
    overallStatus,
    overallSeverity,
    allergyWarnings = [],
    duplicateWarnings = [],
    interactionWarnings = [],
  } = safetyResult;

  const hasWarnings =
    allergyWarnings.length > 0 ||
    duplicateWarnings.length > 0 ||
    interactionWarnings.length > 0;

  return (
    <div
      className={`rounded-2xl border transition-all overflow-hidden ${
        hasWarnings
          ? 'bg-amber-50/60 border-amber-300'
          : 'bg-emerald-50/40 border-emerald-300'
      } ${className}`}
    >
      {/* Top Banner: Status Overview */}
      <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs ${
              hasWarnings ? 'bg-amber-600' : 'bg-emerald-600'
            }`}
          >
            {hasWarnings ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-extrabold text-slate-900 text-sm">
                Medicine Safety & Compatibility Summary
              </h4>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                  hasWarnings
                    ? 'bg-amber-100 text-amber-950 border-amber-300'
                    : 'bg-emerald-100 text-emerald-950 border-emerald-300'
                }`}
              >
                {overallStatus}
              </span>
            </div>
            <p className="text-slate-600 text-xs mt-0.5">
              Verified clinical safety check against allergies, duplicates, and drug-drug interactions.
            </p>
          </div>
        </div>

        {hasWarnings && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-bold text-amber-900 hover:text-amber-950 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <span>{expanded ? 'Hide Safety Details' : 'View Safety Details'}</span>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* 3 Pillar Verification Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 px-3 sm:px-4 pb-3 text-xs">
        {/* Allergy Check */}
        <div
          className={`p-2.5 rounded-xl border flex items-center gap-2 ${
            allergyWarnings.length > 0
              ? 'bg-white border-amber-300 text-amber-950'
              : 'bg-white/80 border-slate-200 text-slate-800'
          }`}
        >
          {allergyWarnings.length > 0 ? (
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <div className="min-w-0">
            <span className="font-bold text-[11px] block uppercase text-slate-600">Allergy Check</span>
            <span className="font-semibold truncate block">{allergyStatus}</span>
          </div>
        </div>

        {/* Duplicate Check */}
        <div
          className={`p-2.5 rounded-xl border flex items-center gap-2 ${
            duplicateWarnings.length > 0
              ? 'bg-white border-amber-300 text-amber-950'
              : 'bg-white/80 border-slate-200 text-slate-800'
          }`}
        >
          {duplicateWarnings.length > 0 ? (
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <div className="min-w-0">
            <span className="font-bold text-[11px] block uppercase text-slate-600">Duplicate Check</span>
            <span className="font-semibold truncate block">{duplicateStatus}</span>
          </div>
        </div>

        {/* Interaction Check */}
        <div
          className={`p-2.5 rounded-xl border flex items-center gap-2 ${
            interactionWarnings.length > 0
              ? 'bg-white border-amber-300 text-amber-950'
              : 'bg-white/80 border-slate-200 text-slate-800'
          }`}
        >
          {interactionWarnings.length > 0 ? (
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <div className="min-w-0">
            <span className="font-bold text-[11px] block uppercase text-slate-600">Interaction Check</span>
            <span className="font-semibold truncate block">{interactionStatus}</span>
          </div>
        </div>
      </div>

      {/* Expanded Clinical Warnings & Patient-Friendly Explanations */}
      {(expanded || showDetailedAlerts) && hasWarnings && (
        <div className="p-3 sm:p-4 bg-white border-t border-amber-200 space-y-3 text-xs">
          {/* 1. Allergy Warnings */}
          {allergyWarnings.length > 0 && (
            <div className="p-3 bg-amber-50/80 border border-amber-300 rounded-xl space-y-1.5">
              <span className="font-bold text-amber-950 flex items-center gap-1.5 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>⚠ Allergy Safety Warning</span>
              </span>
              {allergyWarnings.map((w, idx) => (
                <div key={idx} className="space-y-1 text-slate-800">
                  <p className="font-semibold text-amber-950">
                    {w.clinicalMessage}
                  </p>
                  <div className="p-2 bg-white rounded-lg border border-amber-200 text-[11px] text-slate-700">
                    <strong className="text-amber-900 font-bold">Patient explanation: </strong>
                    {w.simpleExplanation}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 2. Duplicate Medicine Warnings */}
          {duplicateWarnings.length > 0 && (
            <div className="p-3 bg-amber-50/80 border border-amber-300 rounded-xl space-y-1.5">
              <span className="font-bold text-amber-950 flex items-center gap-1.5 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>⚠ Potential Duplicate Medicine Detected</span>
              </span>
              {duplicateWarnings.map((w, idx) => (
                <div key={idx} className="space-y-1 text-slate-800">
                  <p className="font-semibold text-amber-950">
                    {w.clinicalMessage}
                  </p>
                  <div className="p-2 bg-white rounded-lg border border-amber-200 text-[11px] text-slate-700">
                    <strong className="text-amber-900 font-bold">Patient explanation: </strong>
                    {w.simpleExplanation}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 3. Drug-Drug Interactions */}
          {interactionWarnings.length > 0 && (
            <div className="p-3 bg-amber-50/80 border border-amber-300 rounded-xl space-y-1.5">
              <span className="font-bold text-amber-950 flex items-center gap-1.5 text-xs">
                <ShieldAlert className="w-4 h-4 text-amber-700" />
                <span>⚠ Potential Drug Interaction Detected</span>
              </span>
              {interactionWarnings.map((w, idx) => (
                <div key={idx} className="space-y-1 text-slate-800">
                  <div className="flex items-center gap-2">
                    <strong className="text-amber-950">
                      {w.drugA} + {w.drugB}
                    </strong>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                      Severity: {w.severity}
                    </span>
                  </div>
                  <p className="text-slate-700 text-xs">{w.clinicalReason}</p>
                  <div className="p-2 bg-white rounded-lg border border-amber-200 text-[11px] text-slate-700">
                    <strong className="text-amber-900 font-bold">Simple explanation: </strong>
                    {w.simpleExplanation}
                  </div>
                  <p className="text-[11px] text-slate-500 italic">
                    Recommended action: {w.recommendedAction}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200/80">
            AI-assisted safety review — Doctor review and confirmation required. Clinical decisions must not be based solely on automated screening.
          </div>
        </div>
      )}
    </div>
  );
}
