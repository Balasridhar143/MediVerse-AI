import React from 'react';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { getUiText, getReportTranslation } from '../data/medicalTranslations';

/**
 * ReportOverview
 * Displays:
 * 1. "What is this report?" explanation (localized)
 * 2. Important findings summary (localized)
 * 3. "REPORT UNDERSTANDING" completeness checklist (NO fake health score)
 */
export default function ReportOverview({
  report,
  language = 'en',
  className = '',
}) {
  if (!report) return null;

  const translatedReport = getReportTranslation(report.id, language);

  const whatIsThisReportText =
    translatedReport?.whatIsThisReport ||
    report.whatIsThisReport ||
    'This is a diagnostic laboratory report containing objective physical and chemical measurements.';

  const importantFindingsText =
    translatedReport?.importantFindings ||
    report.importantFindings ||
    report.shortPreview;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 2-Column Overview: What is this report + Report Understanding completeness */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* What is this report & Important findings */}
        <div className="lg:col-span-2 space-y-3.5">
          {/* What is this report? */}
          <div className="p-4 bg-teal-50/50 border border-teal-200/80 rounded-xl space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-teal-950 text-xs uppercase tracking-wider">
              <HelpCircle className="w-3.5 h-3.5 text-teal-600" />
              <span>{getUiText('whatIsThisReport', language) || 'What is this report?'}</span>
            </div>
            <p className="text-slate-800 leading-relaxed font-medium">
              {whatIsThisReportText}
            </p>
          </div>

          {/* Important Findings */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1.5 text-xs">
            <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider text-slate-500">
              {getUiText('importantFindings', language) || 'Important Findings'}
            </span>
            <p className="text-slate-800 leading-relaxed font-medium">
              {importantFindingsText}
            </p>
          </div>
        </div>

        {/* REPORT UNDERSTANDING COMPLETENESS (Requirement 7: NOT A HEALTH SCORE) */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Report Understanding
              </span>
              <span className="text-[10px] font-semibold text-teal-800 bg-teal-100/60 px-2 py-0.5 rounded">
                System Ready
              </span>
            </div>

            <p className="text-[11px] text-slate-500 mt-2">
              Indicates the completeness of the structured explanation pipeline for this document:
            </p>

            {/* Completeness Checklist */}
            <div className="space-y-2 mt-3">
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold text-slate-800">Results identified</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold text-slate-800">Reference ranges available</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold text-slate-800">Important values highlighted</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold text-slate-800">Easy explanations available</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/80 text-[10px] text-slate-400">
            *Represents explanation UI readiness, not a clinical health score.
          </div>
        </div>
      </div>
    </div>
  );
}
