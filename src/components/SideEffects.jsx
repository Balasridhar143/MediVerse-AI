import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Siren,
  Info,
} from 'lucide-react';
import { getTranslation } from '../utils/languageRegistry';

/**
 * SideEffects
 * Dedicated clinical side effects display with 3 distinct severity categories:
 * - Common: Monitor and inform your doctor if needed.
 * - Important: Contact your doctor if it continues or becomes severe.
 * - Emergency: Seek immediate medical attention (Call 108/112).
 * 
 * Safety & Clinical Accuracy Constraints:
 * - Uses neutral phrasing: "Possible side effects" (never "You will experience these").
 * - Shows easy-language explanations alongside medical terms.
 * - Multi-language support with graceful fallback.
 */
export default function SideEffects({
  sideEffects,
  easyLanguage = false,
  language = 'en',
  className = '',
}) {
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'common', 'important', 'emergency'

  if (!sideEffects) {
    return (
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 italic">
        Verified side effect information is currently being reviewed. Please consult your physician.
      </div>
    );
  }

  const { common = [], important = [], emergency = [] } = sideEffects;

  const disclaimerText = getTranslation(language, 'sideEffectsDesc');
  const commonCatLabel = getTranslation(language, 'commonCategory');
  const commonCatDesc = getTranslation(language, 'commonDesc');
  const importantCatLabel = getTranslation(language, 'importantCategory');
  const importantCatDesc = getTranslation(language, 'importantDesc');
  const emergencyCatLabel = getTranslation(language, 'emergencyCategory');
  const emergencyCatDesc = getTranslation(language, 'emergencyDesc');

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Category Header & Clinical Note */}
      <div className="p-2.5 bg-slate-100/80 rounded-xl border border-slate-200/90 text-slate-700 text-xs flex items-start gap-2">
        <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed text-slate-600">{disclaimerText}</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          All ({common.length + important.length + emergency.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('common')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
            activeTab === 'common'
              ? 'bg-teal-700 text-white'
              : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200'
          }`}
        >
          Common ({common.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('important')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
            activeTab === 'important'
              ? 'bg-amber-700 text-white'
              : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300'
          }`}
        >
          Important ({important.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('emergency')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
            activeTab === 'emergency'
              ? 'bg-rose-700 text-white'
              : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300'
          }`}
        >
          Emergency ({emergency.length})
        </button>
      </div>

      <div className="space-y-3 pt-1">
        {/* 1. Common Side Effects */}
        {(activeTab === 'all' || activeTab === 'common') && common.length > 0 && (
          <div className="p-3 bg-white border border-teal-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between border-b border-teal-100 pb-1.5 flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                <span className="font-bold text-xs text-teal-950 uppercase tracking-wide">
                  {commonCatLabel}
                </span>
              </div>
              <span className="text-[10px] text-teal-800 font-medium">{commonCatDesc}</span>
            </div>
            <ul className="space-y-2 divide-y divide-slate-100">
              {common.map((effect, idx) => (
                <li key={idx} className="pt-1.5 first:pt-0 text-xs">
                  <div className="font-semibold text-slate-900">
                    • {effect.name}
                    {language === 'ta' && effect.tamil && (
                      <span className="block text-teal-900 font-bold text-[11px] mt-0.5">
                        {effect.tamil}
                      </span>
                    )}
                  </div>
                  {easyLanguage && effect.easyExplanation && (
                    <div className="text-[11px] text-slate-600 mt-0.5 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60 inline-block">
                      <strong className="text-teal-800">Easy meaning:</strong> {effect.easyExplanation}
                    </div>
                  )}
                  {effect.guidance && (
                    <p className="text-[11px] text-slate-500 mt-0.5 italic">
                      Action: {effect.guidance}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 2. Important / Serious Warnings */}
        {(activeTab === 'all' || activeTab === 'important') && important.length > 0 && (
          <div className="p-3 bg-amber-50/70 border border-amber-300 rounded-xl space-y-2">
            <div className="flex items-center justify-between border-b border-amber-200 pb-1.5 flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                <span className="font-bold text-xs text-amber-950 uppercase tracking-wide">
                  {importantCatLabel}
                </span>
              </div>
              <span className="text-[10px] text-amber-800 font-semibold">{importantCatDesc}</span>
            </div>
            <ul className="space-y-2 divide-y divide-amber-200/50">
              {important.map((effect, idx) => (
                <li key={idx} className="pt-1.5 first:pt-0 text-xs">
                  <div className="font-bold text-amber-950">
                    ⚠ {effect.name}
                    {language === 'ta' && effect.tamil && (
                      <span className="block text-amber-900 font-bold text-[11px] mt-0.5">
                        {effect.tamil}
                      </span>
                    )}
                  </div>
                  {easyLanguage && effect.easyExplanation && (
                    <div className="text-[11px] text-amber-900 mt-0.5 bg-white/80 px-2 py-0.5 rounded border border-amber-200 inline-block">
                      <strong className="text-amber-800">Easy meaning:</strong> {effect.easyExplanation}
                    </div>
                  )}
                  {effect.guidance && (
                    <p className="text-[11px] text-amber-800 mt-0.5 font-medium">
                      Action: {effect.guidance}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 3. Emergency Signs */}
        {(activeTab === 'all' || activeTab === 'emergency') && emergency.length > 0 && (
          <div className="p-3 bg-rose-50 border-2 border-rose-300 rounded-xl space-y-2">
            <div className="flex items-center justify-between border-b border-rose-200 pb-1.5 flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <Siren className="w-3.5 h-3.5 text-rose-700" />
                <span className="font-extrabold text-xs text-rose-950 uppercase tracking-wide">
                  {emergencyCatLabel}
                </span>
              </div>
              <span className="text-[10px] text-rose-800 font-bold">{emergencyCatDesc}</span>
            </div>
            <ul className="space-y-2 divide-y divide-rose-200">
              {emergency.map((effect, idx) => (
                <li key={idx} className="pt-1.5 first:pt-0 text-xs">
                  <div className="font-extrabold text-rose-950">
                    🚨 {effect.name}
                    {language === 'ta' && effect.tamil && (
                      <span className="block text-rose-900 font-black text-[11px] mt-0.5">
                        {effect.tamil}
                      </span>
                    )}
                  </div>
                  {easyLanguage && effect.easyExplanation && (
                    <div className="text-[11px] text-rose-950 mt-0.5 bg-white px-2 py-0.5 rounded border border-rose-200 inline-block">
                      <strong className="text-rose-900">Easy meaning:</strong> {effect.easyExplanation}
                    </div>
                  )}
                  {effect.guidance && (
                    <p className="text-[11px] text-rose-800 mt-0.5 font-bold">
                      Emergency Protocol: {effect.guidance}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
