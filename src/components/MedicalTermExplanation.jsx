import React, { useState } from 'react';
import { BookOpen, Search, Sparkles, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { MEDICAL_GLOSSARY } from '../data/reports';
import { getTermTranslation, getUiText } from '../data/medicalTranslations';

/**
 * MedicalTermExplanation
 * Reusable UI for clinical terms with multi-language translation support.
 * Can be used in:
 * 1. Inline single-term card (term prop passed)
 * 2. Full interactive glossary modal / drawer / widget
 * 
 * Multi-language:
 * Renders translated term names and easy meanings in the selected language.
 */
export default function MedicalTermExplanation({
  term,
  initialSearch = '',
  language = 'en',
  className = '',
  compact = false,
}) {
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedTerm, setExpandedTerm] = useState(term || null);

  // If a specific term is requested in compact mode
  if (term && compact) {
    const rawData = MEDICAL_GLOSSARY[term] || {
      term,
      easyMeaning: 'Medical term description provided by clinician or lab reference.',
      description: 'Discuss with your doctor for clinical context.',
      category: 'General',
    };

    const translated = getTermTranslation(term, language);

    return (
      <div className={`p-2.5 bg-teal-50/60 border border-teal-200/80 rounded-lg text-xs ${className}`}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <span className="text-teal-800 text-[11px] uppercase tracking-wider font-semibold">
                {getUiText('testParameter', language) || 'Medical Term'}:
              </span>
              <span className="text-slate-900 underline decoration-teal-400 underline-offset-2">
                {translated.name !== term ? `${translated.name} (${term})` : term}
              </span>
            </div>
            <div className="mt-1 text-slate-700">
              <span className="font-semibold text-teal-900">
                {getUiText('easyExplanation', language) || 'Easy Meaning'}:{' '}
              </span>
              <span className="font-medium text-slate-800 leading-relaxed">
                {translated.easyMeaning || rawData.easyMeaning}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full glossary mode
  const allTerms = Object.values(MEDICAL_GLOSSARY);
  const categories = ['All', ...new Set(allTerms.map((t) => t.category))];

  const filtered = allTerms.filter((item) => {
    const translated = getTermTranslation(item.term, language);
    const matchesSearch =
      item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      translated.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      translated.easyMeaning.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.easyMeaning.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className={`space-y-3 bg-white border border-slate-200 rounded-xl p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-teal-50 text-teal-700 rounded-lg border border-teal-100">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Medical Term Glossary</h4>
            <p className="text-[11px] text-slate-500">
              Everyday explanations for clinical terms found in lab reports (supports 14 Indian languages)
            </p>
          </div>
        </div>
        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
          Multilingual explanations
        </span>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search medical terms (e.g. Hemoglobin, Glucose, Cholesterol)..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-slate-50/50 focus:bg-white focus:border-teal-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto py-0.5 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Terms List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
        {filtered.map((item) => {
          const isExpanded = expandedTerm === item.term;
          const translated = getTermTranslation(item.term, language);
          return (
            <div
              key={item.term}
              className="p-3 bg-slate-50/70 border border-slate-200 rounded-lg hover:border-teal-300 transition-colors"
            >
              <div
                className="flex items-start justify-between gap-2 cursor-pointer"
                onClick={() => setExpandedTerm(isExpanded ? null : item.term)}
              >
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      Medical Term
                    </span>
                    <span className="text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-100">
                      {item.category}
                    </span>
                  </div>
                  <h5 className="font-bold text-slate-900 text-sm mt-0.5">
                    {translated.name !== item.term ? `${translated.name} (${item.term})` : item.term}
                  </h5>
                </div>
                <button
                  type="button"
                  className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                  aria-label="Expand term details"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {/* Easy Meaning - always visible */}
              <div className="mt-2 pt-2 border-t border-slate-200/60">
                <span className="font-bold text-teal-900 text-xs">Easy Meaning: </span>
                <span className="text-slate-800 text-xs font-medium leading-relaxed">
                  {translated.easyMeaning || item.easyMeaning}
                </span>
              </div>

              {/* Expanded Description */}
              {isExpanded && (
                <div className="mt-2 pt-2 border-t border-slate-200 text-[11px] text-slate-600 leading-relaxed bg-white p-2 rounded border border-slate-100 animate-in fade-in">
                  <p>{item.description}</p>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full py-6 text-center text-xs text-slate-500">
            No medical terms found matching "{searchTerm}".
          </div>
        )}
      </div>

      {/* Safety Notice */}
      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-2 text-[11px] text-slate-500">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>Predefined example explanations for frontend prototype. Laboratory numerical values remain unchanged.</span>
      </div>
    </div>
  );
}
