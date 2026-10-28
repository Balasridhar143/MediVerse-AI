import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Sparkles, HelpCircle } from 'lucide-react';
import { MEDICAL_GLOSSARY } from '../data/reports';
import { getTermTranslation, getUiText } from '../data/medicalTranslations';

/**
 * MedicalTermCard
 * Displays a beginner-friendly explanation of a medical term with [Explain More] toggle
 * and multilingual translation support.
 */
export default function MedicalTermCard({
  termKey,
  customTerm,
  language = 'en',
  className = '',
}) {
  const [expanded, setExpanded] = useState(false);

  const rawTermData = MEDICAL_GLOSSARY[termKey] || customTerm || {
    term: termKey,
    category: 'General Clinical',
    easyMeaning: 'A medical test measurement or clinical term.',
    description: 'Discuss with your healthcare provider for individualized clinical context.',
    beginnerTip: 'A routine clinical term found in diagnostic tests.',
  };

  const translated = getTermTranslation(termKey, language);

  return (
    <div
      className={`p-3.5 bg-white border border-slate-200 rounded-xl transition-all hover:border-teal-300 space-y-2 text-xs ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {getUiText('testParameter', language) || 'Medical Term'}
            </span>
            <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-100">
              {rawTermData.category}
            </span>
          </div>
          <h4 className="font-bold text-slate-900 text-sm mt-0.5">
            {translated.name !== termKey ? `${translated.name} (${termKey})` : termKey}
          </h4>
        </div>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="px-2 py-1 rounded text-[11px] font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
          aria-expanded={expanded}
        >
          <span>{expanded ? 'Less' : 'Explain More'}</span>
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      <div className="pt-1 border-t border-slate-100">
        <span className="font-bold text-teal-900 block mb-0.5">
          {getUiText('easyExplanation', language) || 'Easy Meaning'}:
        </span>
        <p className="text-slate-700 font-medium leading-relaxed">
          {translated.easyMeaning || rawTermData.easyMeaning}
        </p>
      </div>

      {expanded && (
        <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg animate-in fade-in">
          <p className="leading-relaxed">{rawTermData.description}</p>
          {rawTermData.beginnerTip && (
            <div className="flex items-center gap-1 text-teal-800 font-semibold pt-0.5">
              <Sparkles className="w-3 h-3 text-teal-600 shrink-0" />
              <span>{rawTermData.beginnerTip}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
