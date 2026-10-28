import React, { useState } from 'react';
import {
  Sparkles,
  Volume2,
  Languages,
  AlertTriangle,
  Info,
  X,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import Button from './Button';
import VoiceExplanation from './VoiceExplanation';
import MedicalTermExplanation from './MedicalTermExplanation';
import { SUPPORTED_LANGUAGES, getLanguageConfig } from '../utils/languageRegistry';
import { getUiText, getReportTranslation } from '../data/medicalTranslations';

/**
 * ReportExplanation
 * AI-Assisted Medical Report Explanation Dialog.
 * 
 * Strict Clinical Safety Standards:
 * - Does NOT diagnose disease or predict outcomes.
 * - Does NOT recommend treatment, medicine changes, or emergency actions.
 * - Displays mandatory safety banner in selected language:
 *   "AI-assisted explanation — not a diagnosis. Discuss medical decisions with your healthcare professional."
 * - Two clearly visible sections:
 *   1. Original Medical Information (original numeric values preserved)
 *   2. Easy Explanation (plain-language translated explanation)
 * - Multi-language Selector supporting all 14 Indian languages with actual translated text:
 *   English, Tamil, Hindi, Malayalam, Telugu, Kannada, Bengali, Marathi, Gujarati, Punjabi, Urdu, Odia, Assamese, Nepali.
 * - Voice audio playback using Web Speech API with Stop toggle in the selected language.
 */
export default function ReportExplanation({
  report,
  isOpen,
  onClose,
  initialLanguage = 'en',
}) {
  const [selectedLanguage, setSelectedLanguage] = useState(initialLanguage);
  const [showGlossary, setShowGlossary] = useState(false);

  if (!isOpen || !report) return null;

  const currentLangConfig = getLanguageConfig(selectedLanguage);
  const isEnglish = selectedLanguage === 'en';

  // Extract structured translations from medicalTranslations
  const reportTranslated = getReportTranslation(report.id, selectedLanguage);

  const displayExplanation = {
    originalFinding: report.shortPreview || report.importantFindings || 'Diagnostic laboratory findings available.',
    simpleExplanation:
      reportTranslated?.simpleExplanation ||
      report.aiExplanation?.simpleExplanation ||
      report.shortPreview ||
      'This laboratory value is within or near expected parameters shown on this report.',
    whatThisMeans:
      reportTranslated?.whatThisMeans ||
      report.aiExplanation?.whatThisMeans ||
      'The result may require discussion with a healthcare professional during routine consultation.',
    importantNote: getUiText('importantNote', selectedLanguage),
  };

  // Text vocalized by browser Web Speech API
  const spokenText = `${displayExplanation.simpleExplanation} ${displayExplanation.whatThisMeans}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-teal-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-600 text-white rounded-xl shadow-2xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block">
                PulseCare Clarity Engine
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                AI-ASSISTED EXPLANATION
              </h2>
            </div>
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
          {/* Mandatory Clinical Safety Banner (Localized) */}
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="block">
                AI-assisted explanation — not a diagnosis.
              </strong>
              <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                {getUiText('safetyDisclaimer', selectedLanguage)}
              </p>
              <p className="text-[10px] text-amber-700 pt-0.5">
                Discuss medical decisions with your healthcare professional. This software does not predict diseases, prescribe medicines, or provide emergency decisions. Sample data for frontend demonstration.
              </p>
            </div>
          </div>

          {/* Language Selection & Audio Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            {/* Multi-language Selector */}
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-teal-700 shrink-0" />
              <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                Language:
              </span>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-teal-500 cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.nativeName} ({lang.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Voice explanation trigger with localized speech text */}
            <div className="flex items-center gap-2 justify-end">
              <VoiceExplanation
                text={spokenText}
                language={selectedLanguage}
                label={getUiText('listen', selectedLanguage) || 'Listen'}
              />
            </div>
          </div>

          {/* Multilingual Notice */}
          {!isEnglish && (
            <div className="p-2.5 bg-teal-50/70 border border-teal-200 rounded-lg text-[11px] text-teal-900 flex items-center gap-2 animate-in fade-in font-medium">
              <Info className="w-4 h-4 text-teal-600 shrink-0" />
              <span>
                <strong>{currentLangConfig.nativeName} ({currentLangConfig.name}): </strong>
                {getUiText('multilingualNotice', selectedLanguage)}
              </span>
            </div>
          )}

          {/* Translation Flow Breadcrumb */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500 px-1">
            <span className="font-medium text-slate-700">Original Lab Report</span>
            <ArrowRight className="w-3 h-3 text-slate-400" />
            <span className="font-medium text-teal-700">{getUiText('easyExplanation', selectedLanguage)}</span>
            <ArrowRight className="w-3 h-3 text-slate-400" />
            <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              {currentLangConfig.nativeName}
            </span>
          </div>

          {/* DUAL VIEW: Original Medical Information vs Easy Explanation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* 1. Original Medical Information */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {getUiText('originalMedicalInformation', selectedLanguage)}
              </span>
              <div className="p-3 bg-white border border-slate-200 rounded-lg font-mono text-xs text-slate-900 leading-relaxed font-semibold">
                {displayExplanation.originalFinding}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                As recorded by {report.hospital} on {report.date}.
              </p>
            </div>

            {/* 2. Easy Explanation (Actual Multilingual Content) */}
            <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-xl space-y-2">
              <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block">
                {getUiText('easyExplanation', selectedLanguage)}
              </span>
              <div className="p-3 bg-white border border-teal-200 rounded-lg text-xs text-slate-800 leading-relaxed font-medium">
                {displayExplanation.simpleExplanation}
              </div>
              <div className="space-y-1 pt-1 text-xs">
                <strong className="text-teal-950 font-bold block">
                  {getUiText('whatThisMeans', selectedLanguage)}
                </strong>
                <p className="text-slate-700 leading-relaxed">
                  {displayExplanation.whatThisMeans}
                </p>
              </div>
            </div>
          </div>

          {/* Prototype disclaimer note in selected language */}
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600">
            <strong>Notice: </strong>
            {displayExplanation.importantNote}
          </div>

          {/* Medical Terms Glossary for this Report */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-600">
                Medical Terms in this Report:
              </span>
              <button
                type="button"
                onClick={() => setShowGlossary(!showGlossary)}
                className="text-xs text-teal-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{showGlossary ? 'Hide Term Glossary' : 'Browse Medical Glossary'}</span>
              </button>
            </div>

            {/* Inline cards for terms present in this report with language passed */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(report.terms && report.terms.length > 0 ? report.terms : ['Hemoglobin', 'Reference Range']).map((t) => (
                <MedicalTermExplanation key={t} term={t} language={selectedLanguage} compact />
              ))}
            </div>

            {/* Full interactive glossary toggle */}
            {showGlossary && (
              <div className="pt-2 animate-in fade-in">
                <MedicalTermExplanation language={selectedLanguage} />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2 shrink-0 text-xs">
          <span className="text-[11px] text-slate-400">
            PulseCare Health Intelligence · Multilingual Prototype
          </span>
          <Button variant="primary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
