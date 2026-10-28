import React from 'react';
import {
  FileCheck2,
  Calendar,
  Building2,
  User,
  Eye,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import Card from './Card';
import Button from './Button';

/**
 * ReportCard
 * Modern card displaying:
 * - Report Name
 * - Report Type
 * - Date
 * - Hospital/Lab
 * - Doctor
 * - Status
 * 
 * Buttons:
 * - [Open Report]
 * - [Understand Report]
 */
export default function ReportCard({
  report,
  onOpenReport,
  onUnderstandReport,
  className = '',
}) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Doctor Reviewed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Doctor Reviewed</span>
          </span>
        );
      case 'Needs Review':
      case 'Doctor Review Recommended':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            <span>Needs Review</span>
          </span>
        );
      case 'Awaiting Doctor Review':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
            <Clock className="w-3 h-3 text-sky-600" />
            <span>Awaiting Review</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <Card
      className={`flex flex-col justify-between transition-all hover:border-teal-400 group ${className}`}
    >
      <div className="space-y-3">
        {/* Header: Type + Status */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5">
            <div className="p-2 bg-teal-50 text-teal-700 rounded-lg border border-teal-100 shrink-0 group-hover:scale-105 transition-transform mt-0.5">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block">
                {report.reportType}
              </span>
              <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1">
                {report.reportName}
              </h3>
            </div>
          </div>

          <div className="shrink-0">
            {getStatusBadge(report.status)}
          </div>
        </div>

        {/* Clean unboxed metadata with separators */}
        <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
          <span className="font-semibold text-slate-700">{report.hospital}</span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>Date: <strong className="text-slate-700 font-semibold">{report.date}</strong></span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>Doctor: <strong className="text-slate-700 font-semibold">{report.doctor || 'Dr. Arun Kumar'}</strong></span>
        </div>

        {/* Structured findings preview */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
          <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider text-slate-500">
            Findings Summary:
          </span>
          <p className="text-slate-700 font-medium leading-relaxed line-clamp-2">
            {report.shortPreview || report.importantFindings}
          </p>
        </div>
      </div>

      {/* Primary Actions: [Open Report], [Understand Report] */}
      <div className="pt-3.5 mt-3.5 border-t border-slate-100 flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          icon={Eye}
          onClick={() => onOpenReport(report)}
          className="flex-1 sm:flex-none justify-center"
        >
          Open Report
        </Button>

        <Button
          variant="primary"
          size="sm"
          icon={Sparkles}
          onClick={() => onUnderstandReport(report)}
          className="flex-1 sm:flex-none justify-center whitespace-nowrap bg-teal-700 hover:bg-teal-800"
        >
          Explain Simply
        </Button>
      </div>
    </Card>
  );
}
