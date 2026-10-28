import React from 'react';
import {
  FileText,
  Building2,
  Calendar,
  User,
  Sparkles,
  Volume2,
  X,
  Download,
  AlertCircle,
  FileCheck2,
  Stethoscope,
} from 'lucide-react';
import Button from './Button';
import StatusBadge from './StatusBadge';
import VoiceExplanation from './VoiceExplanation';

/**
 * ReportDetails
 * Displays comprehensive original medical report data.
 * 
 * Safety constraint:
 * Does NOT hide or replace the original medical information.
 * Shows original clinical parameters, reference ranges, specimen, laboratory, and notes.
 * 
 * Actions:
 * - [EXPLAIN SIMPLY]
 * - [LISTEN]
 * - [CLOSE]
 */
export default function ReportDetails({
  report,
  isOpen,
  onClose,
  onExplainSimply,
}) {
  if (!isOpen || !report) return null;

  // Text summary for speech synthesis
  const speechSummary = `${report.reportName}. Date: ${report.date}. Conducted at ${report.hospital}. Status: ${report.status}. Key findings: ${report.shortPreview || report.detailedFindings}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/70 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {report.reportType}
              </span>
              <StatusBadge status={report.status} size="xs" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              {report.reportName}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <span className="text-slate-400 block text-[11px]">Report Date:</span>
              <strong className="text-slate-900 font-semibold">{report.date}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Hospital / Diagnostic Lab:</span>
              <strong className="text-slate-900 font-semibold truncate block" title={report.hospital}>
                {report.hospital}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Attending Doctor:</span>
              <strong className="text-slate-900 font-semibold">{report.doctor || 'Dr. Arun Kumar'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Specimen / Modality:</span>
              <strong className="text-slate-900 font-semibold">{report.specimen || 'Diagnostic Record'}</strong>
            </div>
          </div>

          {/* Important Findings (Detailed Clinical Narrative) */}
          <div className="space-y-1.5">
            <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider text-slate-600">
              Important Findings & Laboratory Interpretation:
            </span>
            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 text-slate-800 leading-relaxed font-medium">
              {report.detailedFindings || report.shortPreview}
            </div>
          </div>

          {/* Original Report Information Table */}
          {report.parameters && report.parameters.length > 0 && (
            <div className="space-y-1.5">
              <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider text-slate-600">
                Original Laboratory Parameters:
              </span>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs divide-y divide-slate-200">
                    <thead className="bg-slate-100 text-slate-700 font-bold text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3">Test Parameter</th>
                        <th className="py-2.5 px-3">Result / Value</th>
                        <th className="py-2.5 px-3">Unit</th>
                        <th className="py-2.5 px-3">Reference Range</th>
                        <th className="py-2.5 px-3 text-right">Indicator</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {report.parameters.map((param, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {param.name}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-800 tabular-nums">
                            {param.value}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">
                            {param.unit}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 tabular-nums">
                            {param.referenceRange}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                param.flag === 'Normal'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : param.flag === 'Low' || param.flag === 'Elevated' || param.flag === 'Borderline High'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {param.flag}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Doctor Clinical Notes (if available) */}
          {report.doctorNotes && (
            <div className="p-3 bg-teal-50/50 border border-teal-200/80 rounded-xl space-y-1">
              <span className="font-bold text-teal-900 text-[11px] uppercase tracking-wider block">
                Doctor's Clinical Note:
              </span>
              <p className="text-slate-800 font-medium">{report.doctorNotes}</p>
            </div>
          )}

          {/* Safety Notice */}
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-500 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              Sample data for frontend demonstration. Original report values are preserved without automated diagnostic modifications.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <VoiceExplanation
              text={speechSummary}
              language="en"
              label="Listen"
            />
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={onClose}>
              CLOSE
            </Button>

            <Button
              variant="primary"
              size="sm"
              icon={Sparkles}
              onClick={() => {
                onClose();
                if (onExplainSimply) onExplainSimply(report);
              }}
              className="bg-teal-700 hover:bg-teal-800"
            >
              EXPLAIN SIMPLY
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
