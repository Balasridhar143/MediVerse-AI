import React, { useState } from 'react';
import StatusBadge from './StatusBadge';
import {
  Pill,
  Clock,
  Utensils,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Bell,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import MedicineDetails from './MedicineDetails';
import VoiceExplanation from './VoiceExplanation';
import { getVerifiedMedicine } from '../data/verifiedMedicineDatabase';
import { getTranslation } from '../utils/languageRegistry';

/**
 * MedicineCard
 * Clean, standard, universally accessible medication card.
 * No separate "Elder Mode" or childish design.
 * High-contrast, clear readable text, simple buttons, and expandable clinical information.
 */
export default function MedicineCard({
  medicine,
  onTake,
  onSkip,
  onSnooze,
  easyLanguage = false,
  language = 'en',
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [showQuickSnooze, setShowQuickSnooze] = useState(false);

  const clinicalData = getVerifiedMedicine(medicine.id);

  const isTaken = medicine.status === 'Taken';
  const isSkipped = medicine.status === 'Skipped';
  const isNotAck = medicine.status === 'Not Acknowledged';
  const isSnoozed = !!medicine.snoozeUntil;

  // Localized UI Labels from universal language registry
  const takeLabel = getTranslation(language, 'takeMedicine');
  const takenConfirmedLabel = getTranslation(language, 'takenConfirmed');
  const remindLaterLabel = getTranslation(language, 'remindLater');
  const skipLabel = getTranslation(language, 'skipDose');
  const skippedConfirmedLabel = getTranslation(language, 'skippedConfirmed');
  const viewDetailsLabel = getTranslation(language, 'viewDetails');
  const hideDetailsLabel = getTranslation(language, 'hideDetails');
  const doseLabel = getTranslation(language, 'dose');
  const foodLabel = getTranslation(language, 'foodTiming');
  const durationLabel = getTranslation(language, 'duration');
  const listenLabel = getTranslation(language, 'listen');
  const notAckLabel = getTranslation(language, 'notAcknowledged');

  return (
    <div
      className={`rounded-2xl border transition-all overflow-hidden shadow-2xs ${
        isTaken
          ? 'bg-emerald-50/50 border-emerald-400'
          : isSkipped
          ? 'bg-rose-50/50 border-rose-300'
          : isNotAck
          ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-300'
          : isSnoozed
          ? 'bg-teal-50/40 border-teal-300'
          : 'bg-white border-slate-300 hover:border-teal-500'
      }`}
    >
      {/* Top Banner: Scheduled Slot, Scheduled Time & Status */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isNotAck ? 'bg-amber-600 animate-pulse' : isTaken ? 'bg-emerald-600' : 'bg-teal-700'
            }`}
          ></span>
          <span className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
            {medicine.slotName || 'Scheduled Dose'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs bg-white px-2.5 py-1 rounded-lg border border-slate-300 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-teal-700" />
            <span>{medicine.reminderTime}</span>
          </div>
          <StatusBadge status={medicine.status} size="xs" />
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Medicine Name & Dose */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={`w-11 h-11 rounded-xl text-white flex items-center justify-center shrink-0 shadow-2xs ${
                isNotAck ? 'bg-amber-600' : isTaken ? 'bg-emerald-600' : 'bg-teal-700'
              }`}
            >
              <Pill className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-slate-950 text-base sm:text-lg tracking-tight leading-tight">
                {medicine.name}
              </h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="inline-block font-extrabold text-teal-950 bg-teal-50 rounded border border-teal-300 text-xs px-2 py-0.5">
                  {doseLabel}: {medicine.dosage}
                </span>
                <span className="text-slate-600 text-xs font-semibold">
                  • {medicine.frequency}
                </span>
              </div>
            </div>
          </div>

          <VoiceExplanation
            text={`${medicine.name}, ${medicine.dosage}. Take ${medicine.mealRelation}.`}
            language={language}
            label={listenLabel}
            className="shrink-0"
          />
        </div>

        {/* Why am I taking this? (One-line preview) */}
        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-0.5">
          <span className="font-bold text-teal-900 text-[10px] uppercase tracking-wider block">
            Why prescribed:
          </span>
          <p className="text-slate-800 text-xs font-medium leading-relaxed">
            {language === 'ta' && clinicalData.purposeTamil
              ? clinicalData.purposeTamil
              : clinicalData.purpose}
          </p>
        </div>

        {/* Essential Clinical Timing (Clean, strong contrast) */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-slate-800 font-semibold">
            <Utensils className="w-4 h-4 text-slate-500 shrink-0" />
            <span>{medicine.mealRelation}</span>
          </div>
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-slate-800 font-semibold">
            <Clock className="w-4 h-4 text-slate-500 shrink-0" />
            <span>{medicine.timing}</span>
          </div>
        </div>

        {/* SNOOZE ACTIVE INDICATOR */}
        {isSnoozed && (
          <div className="p-2.5 bg-teal-50 border border-teal-300 rounded-xl text-teal-950 flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-700 shrink-0" />
              <span>Snoozed until {medicine.snoozeUntil}</span>
            </div>
            <span className="text-[10px] font-bold uppercase bg-white px-2 py-0.5 rounded border border-teal-300">
              Pending
            </span>
          </div>
        )}

        {/* MISSED DOSE ESCALATION WARNING BOX */}
        {isNotAck && (
          <div className="p-3 bg-amber-100 border border-amber-400 rounded-xl text-amber-950 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-extrabold">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>{notAckLabel}</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-900">
              Scheduled dose at {medicine.reminderTime} has not been acknowledged. Reminder re-prompted.
            </p>
          </div>
        )}

        {/* EXPANDABLE "VIEW MEDICINE INFORMATION" BUTTON (Requirement 1) */}
        <div>
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl font-bold text-xs flex items-center justify-between transition-colors border border-slate-300 cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Info className="w-4 h-4 text-teal-700" />
              <span>{showDetails ? hideDetailsLabel : viewDetailsLabel}</span>
            </span>
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* EXPANDED COMPLETE MEDICINE INFORMATION */}
        {showDetails && (
          <div className="pt-2 animate-in fade-in">
            <MedicineDetails
              medicine={medicine}
              easyLanguage={easyLanguage}
              language={language}
              onClose={() => setShowDetails(false)}
            />
          </div>
        )}

        {/* Quick Snooze Selector */}
        {showQuickSnooze && !isTaken && !isSkipped && (
          <div className="p-3 bg-slate-100 rounded-xl border border-slate-300 space-y-2 text-xs">
            <span className="font-bold text-slate-900 block">Select snooze interval:</span>
            <div className="grid grid-cols-3 gap-2">
              {[10, 30, 60].map((mins) => (
                <button
                  key={mins}
                  onClick={() => {
                    onSnooze(medicine.id, mins);
                    setShowQuickSnooze(false);
                  }}
                  className="py-2 px-1 bg-white hover:bg-teal-50 border border-slate-300 hover:border-teal-500 rounded-lg font-bold text-slate-900 text-center cursor-pointer text-xs"
                >
                  {mins === 60 ? '1 hour' : `${mins} mins`}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowQuickSnooze(false)}
              className="text-xs text-slate-500 hover:underline pt-0.5 text-center w-full block cursor-pointer"
            >
              Cancel snooze
            </button>
          </div>
        )}

        {/* ACCESSIBLE ACTION BUTTONS (Requirement 1 & 6: TAKEN / REMIND LATER / NOT TAKEN) */}
        <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* 1. TAKEN BUTTON */}
          <button
            onClick={() => onTake(medicine.id)}
            className={`flex-1 py-3 px-4 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.98] ${
              isTaken
                ? 'bg-emerald-700 text-white border-2 border-emerald-800 ring-2 ring-emerald-300'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700'
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{isTaken ? takenConfirmedLabel : takeLabel}</span>
          </button>

          {/* 2. REMIND LATER BUTTON */}
          {!isTaken && !isSkipped && (
            <button
              onClick={() => setShowQuickSnooze(!showQuickSnooze)}
              className="py-3 px-3.5 rounded-xl font-bold text-xs text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Snooze reminder"
            >
              <Bell className="w-4 h-4 text-slate-600" />
              <span>{remindLaterLabel}</span>
            </button>
          )}

          {/* 3. NOT TAKEN BUTTON */}
          <button
            onClick={() => onSkip(medicine.id)}
            className={`py-3 px-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border ${
              isSkipped
                ? 'bg-rose-700 text-white border-rose-800 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-rose-50 hover:text-rose-800 hover:border-rose-300'
            }`}
          >
            <XCircle className="w-4 h-4" />
            <span>{isSkipped ? skippedConfirmedLabel : skipLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
