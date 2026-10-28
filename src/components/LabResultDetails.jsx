import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Info,
  Layers,
  ArrowDown,
  ArrowUp,
  Check,
  AlertTriangle,
  Stethoscope,
  Volume2,
  HelpCircle,
} from 'lucide-react';
import Button from './Button';
import VoiceExplanation from './VoiceExplanation';
import { getUiText, getParameterTranslation } from '../data/medicalTranslations';

/**
 * LabResultDetails
 * Slide-over / modal displaying in-depth 4-level breakdown when user clicks any test parameter.
 * Supports all 14 Indian languages.
 * 
 * Safety constraint:
 * Explicitly states: "This result alone does not establish a diagnosis."
 * Status refers strictly to the displayed laboratory reference range.
 */
export default function LabResultDetails({
  parameter,
  report,
  isOpen,
  onClose,
  language = 'en',
}) {
  const [activeLevel, setActiveLevel] = useState(1);

  if (!isOpen || !parameter) return null;

  const translated = getParameterTranslation(parameter, language);
  const displayName = translated?.name || parameter.name;
  const displayMeaning = translated?.easyMeaning || parameter.easyMeaning;

  const getStatusBadge = () => {
    switch (parameter.indicator) {
      case 'below':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">
            <ArrowDown className="w-3.5 h-3.5 text-amber-600" />
            <span>{getUiText('belowRange', language) || 'Below displayed range'}</span>
          </span>
        );
      case 'above':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">
            <ArrowUp className="w-3.5 h-3.5 text-amber-600" />
            <span>{getUiText('aboveRange', language) || 'Above displayed range'}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-300">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>{getUiText('withinRange', language) || 'Within displayed range'}</span>
          </span>
        );
    }
  };

  const detailed = parameter.detailedExplanation || {};
  const levels = {
    level1:
      translated?.sampleResultExplanation ||
      `Your ${displayName} result is ${parameter.value} ${parameter.unit}. The reference range displayed in this report is ${parameter.referenceRange}, so this result is ${translated?.status || parameter.status}.`,
    level2: displayMeaning || parameter.purpose || 'Commonly measured to evaluate general metabolic and cellular health.',
    level3: 'Hydration, diet, physical activity, and laboratory-specific equipment can all affect results.',
    level4: getUiText('doctorDiscussionAdvisory', language) || 'Discuss this result with your healthcare professional during your scheduled consultation.',
  };

  const spokenText = `${displayName}: ${parameter.value} ${parameter.unit}. ${levels.level1} ${levels.level4} Note: This result alone does not establish a diagnosis.`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/70 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Detailed Test Understanding
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500 font-medium">
                {report?.reportName || 'Diagnostic Report'}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              {displayName !== parameter.name ? `${displayName} (${parameter.name})` : displayName}
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

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Key Metric Spotlight */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-center sm:text-left">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">
                {getUiText('testParameter', language) || 'Test Name'}
              </span>
              <strong className="text-slate-900 font-bold text-sm block truncate" title={displayName}>
                {displayName}
              </strong>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block font-medium">
                {getUiText('result', language) || 'Result Value'}
              </span>
              <strong className="text-teal-700 font-bold text-sm tabular-nums block">
                {parameter.value} {parameter.unit}
              </strong>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block font-medium">
                {getUiText('referenceRange', language) || 'Reference Range'}
              </span>
              <strong className="text-slate-800 font-semibold text-xs tabular-nums block">
                {parameter.referenceRange}
              </strong>
            </div>

            <div className="flex items-center sm:justify-end">
              {getStatusBadge()}
            </div>
          </div>

          {/* Voice explanation button */}
          <div className="flex items-center justify-between p-2.5 bg-teal-50/60 border border-teal-200 rounded-xl">
            <span className="text-[11px] text-teal-900 font-medium">
              Listen to the plain-language explanation of this test result:
            </span>
            <VoiceExplanation
              text={spokenText}
              language={language}
              label={getUiText('listen', language) || 'Listen'}
            />
          </div>

          {/* 4-LEVEL STRUCTURED EXPLANATION TABS (Requirement 5) */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-teal-600" />
                <span>Explain This Result (4-Level Understanding)</span>
              </span>
            </div>

            {/* Level Selector Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl text-xs">
              {[
                { lvl: 1, label: '1. Simple Meaning' },
                { lvl: 2, label: '2. Why It Matters' },
                { lvl: 3, label: '3. What Can Affect It' },
                { lvl: 4, label: '4. What Should I Do' },
              ].map((item) => (
                <button
                  key={item.lvl}
                  type="button"
                  onClick={() => setActiveLevel(item.lvl)}
                  className={`py-2 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    activeLevel === item.lvl
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Active Level Content */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 animate-in fade-in">
              {activeLevel === 1 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block">
                    Level 1: Simple Explanation ({language.toUpperCase()})
                  </span>
                  <p className="text-slate-800 leading-relaxed font-medium">
                    {levels.level1}
                  </p>
                </div>
              )}

              {activeLevel === 2 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block">
                    Level 2: Why This Test Matters
                  </span>
                  <p className="text-slate-800 leading-relaxed font-medium">
                    {levels.level2}
                  </p>
                </div>
              )}

              {activeLevel === 3 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block">
                    Level 3: What Can Affect This Value?
                  </span>
                  <p className="text-slate-800 leading-relaxed font-medium">
                    {levels.level3}
                  </p>
                </div>
              )}

              {activeLevel === 4 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block">
                    Level 4: What Should I Do?
                  </span>
                  <p className="text-slate-800 leading-relaxed font-medium">
                    {levels.level4}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Deep Question-and-Answer Breakdown */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-600">
              Detailed Questions & Answers:
            </h4>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <strong className="text-slate-900 block font-bold">
                  What is {displayName}?
                </strong>
                <p className="text-slate-700 leading-relaxed">
                  {displayMeaning || detailed.whatIs}
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <strong className="text-slate-900 block font-bold">
                  What does this result show?
                </strong>
                <p className="text-slate-700 leading-relaxed">
                  {detailed.whatResultShows || `The value of ${parameter.value} ${parameter.unit} compared against ${parameter.referenceRange} (${translated?.status || parameter.status}).`}
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <strong className="text-slate-900 block font-bold">
                  Why is it measured?
                </strong>
                <p className="text-slate-700 leading-relaxed">
                  {detailed.whyMeasured || parameter.purpose || 'Commonly evaluated to check metabolic equilibrium.'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <strong className="text-slate-900 block font-bold">
                  What can affect this value?
                </strong>
                <p className="text-slate-700 leading-relaxed">
                  {detailed.whatAffects || 'Many factors including hydration, recent meals, exercise, and lab methodology can influence this test.'}
                </p>
              </div>
            </div>
          </div>

          {/* Mandatory Patient Safety Guard */}
          <div className="p-3 bg-amber-50/80 border border-amber-300 rounded-xl flex items-start gap-2 text-[11px] text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block">Important Clinical Safety Reminder:</strong>
              <span>
                {getUiText('safetyDisclaimer', language)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400">
            PulseCare Lab Clarity Engine · Multilingual
          </span>
          <Button variant="primary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
