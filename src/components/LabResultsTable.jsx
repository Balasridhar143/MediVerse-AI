import React from 'react';
import { ArrowDown, ArrowUp, Check, Sparkles, Info, HelpCircle } from 'lucide-react';
import Button from './Button';
import { getUiText, getParameterTranslation } from '../data/medicalTranslations';

/**
 * LabResultsTable
 * Displays the structured laboratory parameters with visual indicators:
 * - ↓ Below displayed range
 * - ✓ Within displayed range
 * - ↑ Above displayed range
 * 
 * Safety constraint:
 * Never uses "Normal patient" or "Abnormal patient".
 * Emphasizes: "Reference ranges can vary by laboratory, age, sex, and clinical context."
 * 
 * Multi-language support:
 * Localizes parameter names, easy meanings, status badges, and caveats.
 */
export default function LabResultsTable({
  parameters = [],
  onSelectParameter,
  isEasyMode = false,
  language = 'en',
  className = '',
}) {
  const getStatusBadge = (indicator, customStatus) => {
    switch (indicator) {
      case 'below':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300 whitespace-nowrap">
            <ArrowDown className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>{getUiText('belowRange', language) || 'Below displayed range'}</span>
          </span>
        );
      case 'above':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300 whitespace-nowrap">
            <ArrowUp className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>{getUiText('aboveRange', language) || 'Above displayed range'}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-900 border border-emerald-300 whitespace-nowrap">
            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{getUiText('withinRange', language) || 'Within displayed range'}</span>
          </span>
        );
    }
  };

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Table Container */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3.5">{getUiText('testParameter', language) || 'Test Parameter'}</th>
                <th className="py-3 px-3.5">{getUiText('result', language) || 'Result'}</th>
                <th className="py-3 px-3.5">{getUiText('referenceRange', language) || 'Reference Range'}</th>
                <th className="py-3 px-3.5">{getUiText('status', language) || 'Status (Displayed Range)'}</th>
                <th className="py-3 px-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {parameters.map((param) => {
                const isAbnormal = param.indicator === 'below' || param.indicator === 'above';
                const translated = getParameterTranslation(param, language);
                const displayName = translated?.name || param.name;
                const displayEasyMeaning = translated?.easyMeaning || param.easyMeaning;

                return (
                  <tr
                    key={param.id || param.name}
                    className={`transition-colors hover:bg-slate-50/80 cursor-pointer ${
                      isAbnormal ? 'bg-amber-50/15' : ''
                    }`}
                    onClick={() => onSelectParameter && onSelectParameter(param)}
                  >
                    {/* Test Name */}
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">
                        {displayName !== param.name ? `${displayName} (${param.name})` : param.name}
                      </div>
                      {isEasyMode ? (
                        <div className="text-[11px] text-teal-800 font-medium mt-0.5 leading-snug">
                          {displayEasyMeaning}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400">
                          {param.testName !== param.name ? param.testName : param.purpose}
                        </div>
                      )}
                    </td>

                    {/* Result (Numerical value preserved) */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="font-extrabold text-slate-900 text-sm tabular-nums">
                        {param.value}
                      </span>
                      <span className="text-xs text-slate-500 ml-1 font-medium">
                        {param.unit}
                      </span>
                    </td>

                    {/* Reference Range */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="font-semibold text-slate-700 tabular-nums">
                        {param.referenceRange}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      {getStatusBadge(param.indicator, param.status)}
                    </td>

                    {/* Action: Explain This Result */}
                    <td className="py-3 px-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onSelectParameter && onSelectParameter(param)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 transition-colors cursor-pointer"
                        title={`Explain ${param.name} in plain language`}
                      >
                        <Sparkles className="w-3 h-3 text-teal-600" />
                        <span>{getUiText('explainResult', language) || 'Explain Result'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mandatory Reference Range Caveat (Localized) */}
      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2 text-[11px] text-slate-600">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>
          <strong>Notice: </strong>
          {getUiText('referenceRangeNotice', language)}
        </span>
      </div>
    </div>
  );
}
