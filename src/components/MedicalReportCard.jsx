import React from 'react';
import {
  FileCheck2,
  Calendar,
  Building2,
  Eye,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
} from 'lucide-react';
import Card from './Card';
import Button from './Button';
import StatusBadge from './StatusBadge';

/**
 * MedicalReportCard
 * Displays a single medical report record.
 * 
 * Fields shown:
 * - Report name
 * - Report type
 * - Report date
 * - Hospital/Lab
 * - Uploaded date
 * - Report status
 * - Short findings preview
 * 
 * Primary Actions:
 * - [VIEW REPORT]
 * - [EXPLAIN SIMPLY]
 */
export default function MedicalReportCard({
  report,
  onView,
  onExplain,
  onCompareSelect,
  isComparing = false,
  isSelectedForCompare = false,
  className = '',
}) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Doctor Reviewed':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Needs Review':
      case 'Doctor Review Recommended':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Ready':
        return 'bg-teal-50 text-teal-800 border-teal-200';
      case 'Processing':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'Uploaded':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <Card
      className={`flex flex-col justify-between transition-all hover:border-teal-400 group ${
        isSelectedForCompare ? 'ring-2 ring-teal-600 bg-teal-50/20' : ''
      } ${className}`}
    >
      <div className="space-y-3">
        {/* Top bar: Type + Status */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-50 text-teal-700 rounded-lg border border-teal-100 shrink-0 group-hover:scale-105 transition-transform">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-teal-700 uppercase tracking-wider block">
                {report.reportType}
              </span>
              <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1">
                {report.reportName}
              </h3>
            </div>
          </div>

          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border whitespace-nowrap shrink-0 ${getStatusColor(report.status)}`}>
            {report.status}
          </span>
        </div>

        {/* Unboxed Metadata with Typographic Separators */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 flex-wrap">
          <span className="font-medium text-slate-700">{report.hospital}</span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>Date: <strong className="text-slate-700 font-semibold">{report.date}</strong></span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>Uploaded: <strong className="text-slate-600 font-medium">{report.uploadedDate || report.date}</strong></span>
        </div>

        {/* Short findings preview */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
          <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider text-slate-500">
            Finding Preview:
          </span>
          <p className="text-slate-700 leading-relaxed line-clamp-2 font-medium">
            {report.shortPreview || report.findings}
          </p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-3.5 mt-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 text-xs">
        {/* Compare selection checkbox if in comparison mode */}
        {onCompareSelect && (
          <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-600 text-[11px] select-none">
            <input
              type="checkbox"
              checked={isSelectedForCompare}
              onChange={() => onCompareSelect(report.id)}
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
            />
            <span className="font-medium">Select to Compare</span>
          </label>
        )}

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2 justify-end ml-auto w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            icon={Eye}
            onClick={() => onView(report)}
            className="flex-1 sm:flex-none justify-center"
          >
            VIEW REPORT
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={Sparkles}
            onClick={() => onExplain(report)}
            className="flex-1 sm:flex-none justify-center whitespace-nowrap bg-teal-700 hover:bg-teal-800"
          >
            EXPLAIN SIMPLY
          </Button>
        </div>
      </div>
    </Card>
  );
}
