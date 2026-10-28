import React, { useState } from 'react';
import {
  Pill,
  Clock,
  Utensils,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  ShieldAlert,
  Info,
} from 'lucide-react';
import SideEffects from './SideEffects';
import VoiceExplanation from './VoiceExplanation';
import { getVerifiedMedicine } from '../data/verifiedMedicineDatabase';
import { getTranslation } from '../utils/languageRegistry';

/**
 * MedicineDetails
 * Expandable clinical details drawer for complete medicine information:
 * - Medicine Name, Drug Class & Purpose ("Why am I taking this?")
 * - Prescribed Dose, Frequency, Duration
 * - Before / After Food & "How do I take it?"
 * - Dedicated Side Effects Section (Common vs Important vs Emergency)
 * - Missed Dose Guidance (Specific clinical rule - NOT universal)
 * - Known Allergy Warnings & Drug Interaction Warnings
 * - Language selection & Voice Explanation
 */
export default function MedicineDetails({
  medicine,
  onClose,
  easyLanguage = false,
  language = 'en',
}) {
  const clinicalData = getVerifiedMedicine(medicine.id);

  // Spoken text summary
  const speechSummary = `${medicine.name}, ${medicine.dosage}. ${clinicalData.purpose}. ${clinicalData.howToTake}`;

  const whyLabel = getTranslation(language, 'whyTaking');
  const howLabel = getTranslation(language, 'howToTake');
  const whenLabel = getTranslation(language, 'whenToTake');
  const missedLabel = getTranslation(language, 'missedDoseTitle');
  const allergyLabel = getTranslation(language, 'allergyWarning');
  const interactionLabel = getTranslation(language, 'drugInteractionWarning');
  const sideEffectsLabel = getTranslation(language, 'possibleSideEffects');
  const listenLabel = getTranslation(language, 'listen');
  const disclaimerText = getTranslation(language, 'disclaimer');

  return (
    <div className="space-y-5 text-slate-800 text-xs">
      {/* Top Header & Speech Button */}
      <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                {medicine.name}
              </h3>
              <span className="font-bold text-teal-900 bg-white px-2 py-0.5 rounded text-xs border border-teal-200">
                {medicine.dosage}
              </span>
            </div>
            <p className="text-slate-600 text-xs mt-0.5">
              {clinicalData.drugClass}
              {easyLanguage && (
                <span className="block text-teal-800 text-[11px] font-medium mt-0.5">
                  ({clinicalData.drugClassEasy})
                </span>
              )}
            </p>
          </div>
        </div>

        <VoiceExplanation
          text={speechSummary}
          language={language}
          label={listenLabel}
        />
      </div>

      {/* 1. WHY AM I TAKING THIS? (Purpose / Use) */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-2xs">
        <div className="flex items-center gap-2 text-teal-800 font-bold text-xs uppercase tracking-wider">
          <Info className="w-4 h-4 text-teal-600" />
          <span>{whyLabel}</span>
        </div>
        <p className="text-slate-900 text-sm font-semibold leading-relaxed">
          {language === 'ta' && clinicalData.purposeTamil
            ? clinicalData.purposeTamil
            : clinicalData.purpose}
        </p>
        <p className="text-[11px] text-slate-500">
          Prescribed by: <strong>{medicine.prescribedBy}</strong>
        </p>
      </div>

      {/* 2. HOW DO I TAKE IT? & WHEN? */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
          <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Utensils className="w-4 h-4 text-slate-500" />
            {howLabel}
          </span>
          <p className="text-slate-700 leading-relaxed">
            {language === 'ta' && clinicalData.howToTakeTamil
              ? clinicalData.howToTakeTamil
              : clinicalData.howToTake}
          </p>
          <div className="text-[11px] text-teal-800 font-medium pt-1 border-t border-slate-200/70">
            {medicine.instructions}
          </div>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
          <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-500" />
            {whenLabel}
          </span>
          <div className="space-y-1 text-slate-700">
            <p>
              • Timing: <strong className="text-slate-900">{medicine.timing} ({medicine.reminderTime})</strong>
            </p>
            <p>
              • Food Relation: <strong className="text-slate-900">{medicine.mealRelation}</strong>
            </p>
            <p>
              • Frequency & Duration: <strong className="text-slate-900">{medicine.frequency} for {medicine.duration}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* 3. DEDICATED SIDE EFFECTS (Categorized: Common vs Important vs Emergency) */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>{sideEffectsLabel}</span>
          </h4>
          <span className="text-[11px] text-slate-500">Categorized by Clinical Severity</span>
        </div>

        <SideEffects
          sideEffects={clinicalData.sideEffects}
          easyLanguage={easyLanguage}
          language={language}
        />
      </div>

      {/* 4. MISSED DOSE GUIDANCE (Strictly drug-specific, never universal) */}
      <div className="p-4 bg-teal-50/50 border border-teal-200 rounded-xl space-y-2">
        <div className="flex items-center gap-2 text-teal-900 font-bold text-xs">
          <HelpCircle className="w-4 h-4 text-teal-700" />
          <span>{missedLabel}</span>
        </div>
        <p className="text-slate-800 leading-relaxed font-medium">
          {language === 'ta' && clinicalData.missedDose.ruleTamil
            ? clinicalData.missedDose.ruleTamil
            : clinicalData.missedDose.rule}
        </p>
        <p className="text-[11px] text-teal-800 italic">
          Example information — consult your doctor or pharmacist for medicine-specific instructions.
        </p>
      </div>

      {/* 5. ALLERGY WARNING & DRUG INTERACTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div className="p-3.5 bg-amber-50/70 border border-amber-300 rounded-xl space-y-1">
          <span className="font-bold text-amber-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-700" />
            {allergyLabel}
          </span>
          <p className="text-amber-900 text-xs leading-relaxed">
            {language === 'ta' && clinicalData.allergyWarningTamil
              ? clinicalData.allergyWarningTamil
              : clinicalData.allergyWarning}
          </p>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
          <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-slate-500" />
            {interactionLabel}
          </span>
          <p className="text-slate-700 text-xs leading-relaxed">
            {language === 'ta' && clinicalData.drugInteractionWarningTamil
              ? clinicalData.drugInteractionWarningTamil
              : clinicalData.drugInteractionWarning}
          </p>
        </div>
      </div>

      {/* 6. SUPPLY / REFILL STATUS */}
      {medicine.refillRemainingDays && (
        <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <span className="text-slate-700 font-medium">
            Estimated remaining supply: <strong>~{medicine.refillRemainingDays} days remaining</strong>
          </span>
          {medicine.refillRemainingDays <= 7 ? (
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                ⚠️ Your medicine supply may be running low.
              </span>
              <a
                href="#prescriptions"
                className="text-teal-700 font-bold hover:underline"
              >
                [Contact Doctor/Pharmacy]
              </a>
            </div>
          ) : (
            <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              ✓ Supply Adequate
            </span>
          )}
        </div>
      )}

      {/* Clinical Disclaimer */}
      <p className="text-[11px] text-slate-400 text-center leading-relaxed italic">
        {disclaimerText}
      </p>
    </div>
  );
}
