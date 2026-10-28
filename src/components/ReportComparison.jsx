import React, { useState } from 'react';
import { Columns, Calendar, ArrowRight, Info, AlertCircle, FileText } from 'lucide-react';
import Button from './Button';

/**
 * ReportComparison
 * Advanced comparison feature between two reports of the same category (e.g. August vs September).
 * 
 * Columns:
 * - Test
 * - Previous
 * - Latest
 * - Change (e.g. 11.0 → 11.2 g/dL)
 * - Clinical Reference Note
 * 
 * Safety constraint:
 * Never says "Your health improved" or "worsened".
 * States: "Value changed from X to Y. Discuss the clinical significance with your healthcare professional."
 */
export default function ReportComparison({
  reports = [],
  initialReport1Id = null,
  initialReport2Id = null,
  onClose,
  className = '',
}) {
  const [selectedType, setSelectedType] = useState('Blood Tests');
  const availableTypes = ['Blood Tests', 'All'];

  const candidateReports = reports.filter((r) =>
    selectedType === 'All' ? true : r.category === selectedType
  );

  const [report1Id, setReport1Id] = useState(
    initialReport1Id || (candidateReports.length > 1 ? candidateReports[1].id : candidateReports[0]?.id)
  );
  const [report2Id, setReport2Id] = useState(
    initialReport2Id || candidateReports[0]?.id
  );

  const report1 = reports.find((r) => r.id === report1Id);
  const report2 = reports.find((r) => r.id === report2Id);

  // Match parameters between both reports
  const allParams = [];
  const map2 = new Map((report2?.parameters || []).map((p) => [p.name.toLowerCase(), p]));

  (report1?.parameters || []).forEach((p1) => {
    const p2 = map2.get(p1.name.toLowerCase());
    const val1 = p1.value;
    const val2 = p2 ? p2.value : '—';
    const changeText = p2 ? `${val1} → ${val2} ${p1.unit}` : 'Not retested';
    allParams.push({
      name: p1.name,
      unit: p1.unit,
      referenceRange: p1.referenceRange,
      val1,
      val2,
      changeText,
      hasBoth: !!p2,
      note: p2
        ? `Value changed from ${val1} to ${val2} ${p1.unit}. Discuss the clinical significance with your healthcare professional.`
        : 'Value recorded in previous test only.',
    });
  });

  // Any parameters present only in report2
  const map1 = new Map((report1?.parameters || []).map((p) => [p.name.toLowerCase(), p]));
  (report2?.parameters || []).forEach((p2) => {
    if (!map1.has(p2.name.toLowerCase())) {
      allParams.push({
        name: p2.name,
        unit: p2.unit,
        referenceRange: p2.referenceRange,
        val1: '—',
        val2: p2.value,
        changeText: `New parameter (${p2.value} ${p2.unit})`,
        hasBoth: false,
        note: `New parameter recorded on ${report2.date}. Discuss with your doctor.`,
      });
    }
  });

  return (
    <div className={`bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-teal-800 font-semibold uppercase tracking-wider">
            <Columns className="w-3.5 h-3.5 text-teal-600" />
            <span>Longitudinal Report Comparison</span>
          </div>
          <h3 className="font-bold text-slate-900 text-base">Compare Reports (Same Category)</h3>
          <p className="text-xs text-slate-500">
            Compare values side-by-side to track changes over time with clinical neutral references
          </p>
        </div>

        {onClose && (
          <Button variant="outline" size="sm" onClick={onClose}>
            Back to Dashboard
          </Button>
        )}
      </div>

      {/* Selectors for Previous vs Latest */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
        {/* Previous Report Selector */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-700 block">
            Previous Report (Baseline):
          </label>
          <select
            value={report1Id || ''}
            onChange={(e) => setReport1Id(e.target.value)}
            className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:border-teal-500 focus:outline-hidden"
          >
            {candidateReports.map((r) => (
              <option key={r.id} value={r.id}>
                {r.date} — {r.reportName} ({r.hospital})
              </option>
            ))}
          </select>
          {report1 && (
            <div className="text-[11px] text-slate-500 pt-1">
              Date: <strong className="text-slate-800">{report1.date}</strong> • Doctor: {report1.doctor}
            </div>
          )}
        </div>

        {/* Latest Report Selector */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-700 block">
            Latest Report (Recent):
          </label>
          <select
            value={report2Id || ''}
            onChange={(e) => setReport2Id(e.target.value)}
            className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:border-teal-500 focus:outline-hidden"
          >
            {candidateReports.map((r) => (
              <option key={r.id} value={r.id}>
                {r.date} — {r.reportName} ({r.hospital})
              </option>
            ))}
          </select>
          {report2 && (
            <div className="text-[11px] text-slate-500 pt-1">
              Date: <strong className="text-slate-800">{report2.date}</strong> • Doctor: {report2.doctor}
            </div>
          )}
        </div>
      </div>

      {/* Comparison Table */}
      {report1 && report2 ? (
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-100/90 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-3.5">Test</th>
                  <th className="py-3 px-3.5 bg-slate-50">Previous ({report1.date})</th>
                  <th className="py-3 px-3.5 bg-teal-50/60 text-teal-950">Latest ({report2.date})</th>
                  <th className="py-3 px-3.5">Change</th>
                  <th className="py-3 px-3.5">Clinical Reference Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {allParams.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3.5 font-bold text-slate-900 whitespace-nowrap">
                      {row.name}
                    </td>
                    <td className="py-3 px-3.5 font-semibold text-slate-800 bg-slate-50/50 whitespace-nowrap tabular-nums">
                      {row.val1} {row.val1 !== '—' ? row.unit : ''}
                    </td>
                    <td className="py-3 px-3.5 font-bold text-teal-900 bg-teal-50/20 whitespace-nowrap tabular-nums">
                      {row.val2} {row.val2 !== '—' ? row.unit : ''}
                    </td>
                    <td className="py-3 px-3.5 font-bold text-slate-900 whitespace-nowrap tabular-nums">
                      {row.changeText}
                    </td>
                    <td className="py-3 px-3.5 text-xs text-slate-600 leading-relaxed min-w-[260px]">
                      {row.note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-xs text-slate-500">
          Please select two reports from the dropdowns above to compare parameters.
        </div>
      )}

      {/* Mandatory Clinical Neutrality Note (Requirement 13) */}
      <div className="p-3 bg-amber-50/80 border border-amber-300 rounded-xl flex items-start gap-2.5 text-xs text-amber-950">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <strong>Important Clinical Reminder:</strong>
          <p className="text-[11px] leading-relaxed">
            Values are displayed for chronological reference only. This comparison does not claim that a condition improved or worsened. Discuss the clinical significance with your healthcare professional.
          </p>
        </div>
      </div>
    </div>
  );
}
