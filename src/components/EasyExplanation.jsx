import React from 'react';
import { Languages, HelpCircle } from 'lucide-react';

/**
 * EasyExplanation
 * Displays original medical term alongside an easy-to-understand explanation.
 * Does not replace the clinical term; clarifies it for the patient.
 */
export default function EasyExplanation({
  medicalTerm,
  easyMeaning,
  tamilMeaning,
  language = 'en',
  className = '',
}) {
  return (
    <div
      className={`inline-flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 px-2.5 py-1.5 rounded-lg bg-teal-50/70 border border-teal-200 text-xs ${className}`}
    >
      <div className="flex items-center gap-1 font-bold text-slate-900">
        <span className="text-teal-800">Medical:</span>
        <span className="underline decoration-teal-400 underline-offset-2">{medicalTerm}</span>
      </div>

      <span className="hidden sm:inline text-teal-300">→</span>

      <div className="flex items-center gap-1 text-slate-700">
        <span className="font-semibold text-teal-900">Easy meaning:</span>
        <span className="font-medium text-slate-900">
          {language === 'ta' && tamilMeaning ? tamilMeaning : easyMeaning}
        </span>
      </div>
    </div>
  );
}
