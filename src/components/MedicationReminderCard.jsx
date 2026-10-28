import React, { useState } from 'react';
import Card from './Card';
import StatusBadge from './StatusBadge';
import { useElderMode } from '../context/ElderModeContext';
import {
  Pill,
  Clock,
  Utensils,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Bell,
} from 'lucide-react';

/**
 * MedicationReminderCard
 * Elder-friendly medication card:
 * When elderMode is ACTIVE:
 * - High-contrast styling
 * - Even larger fonts (text-xl for drug names, text-base for instructions)
 * - Ultra-large touch buttons with minimum 52px height
 * - English or Tamil labels
 */
export default function MedicationReminderCard({
  medicine,
  onTake,
  onSkip,
  onSnooze,
}) {
  const { elderMode, language } = useElderMode();
  const [showQuickSnooze, setShowQuickSnooze] = useState(false);

  const isTaken = medicine.status === 'Taken';
  const isSkipped = medicine.status === 'Skipped';
  const isNotAck = medicine.status === 'Not Acknowledged';
  const isSnoozed = !!medicine.snoozeUntil;

  // Localized Labels
  const labels = {
    takeMedicine: language === 'ta' ? 'மருந்து உட்கொள்ளப்பட்டது' : 'TAKE MEDICINE',
    taken: language === 'ta' ? 'உட்கொள்ளப்பட்டது ✓' : 'TAKEN ✓',
    remindLater: language === 'ta' ? 'ஒத்திவை' : 'Remind Later',
    skip: language === 'ta' ? 'தவிர்' : 'Skip Dose',
    skipped: language === 'ta' ? 'தவிர்க்கப்பட்டது' : 'SKIPPED',
    dose: language === 'ta' ? 'அளவு' : 'Dose',
    food: language === 'ta' ? 'உணவு நேரம்' : 'Food timing',
    duration: language === 'ta' ? 'கால அளவு' : 'Duration',
    instructions: language === 'ta' ? 'அறிவுரை' : 'Instructions',
    notAckTitle: language === 'ta' ? 'மருந்து நினைவூட்டல் உறுதிப்படுத்தப்படவில்லை' : 'Medication reminder not acknowledged',
    caregiverRec: language === 'ta' ? 'பராமரிப்பாளர் கவனம் பரிந்துரைக்கப்படுகிறது.' : 'Caregiver attention recommended.',
  };

  return (
    <div
      className={`rounded-2xl border transition-all overflow-hidden ${
        elderMode ? 'ring-2 ring-slate-800 shadow-md' : 'shadow-2xs'
      } ${
        isTaken
          ? 'bg-emerald-50/50 border-emerald-400'
          : isSkipped
          ? 'bg-rose-50/50 border-rose-400'
          : isNotAck
          ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-300'
          : isSnoozed
          ? 'bg-teal-50/40 border-teal-300'
          : elderMode
          ? 'bg-white border-slate-400'
          : 'bg-white border-slate-200 hover:border-teal-400'
      }`}
    >
      {/* Top Banner: Scheduled Slot, Scheduled Time & Status */}
      <div
        className={`px-4 py-3 flex items-center justify-between flex-wrap gap-2 border-b ${
          elderMode ? 'bg-slate-100 border-slate-300' : 'bg-slate-50 border-slate-100'
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full ${elderMode ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5'} ${
              isNotAck ? 'bg-amber-600 animate-pulse' : isTaken ? 'bg-emerald-600' : 'bg-teal-700'
            }`}
          ></span>
          <span
            className={`font-black uppercase tracking-wider ${
              elderMode ? 'text-sm text-slate-900' : 'text-xs text-slate-800'
            }`}
          >
            {medicine.slotName || 'Scheduled Medicine'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 font-black text-slate-900 bg-white rounded-lg border shadow-2xs ${
              elderMode ? 'px-3 py-1.5 text-sm border-slate-400' : 'px-2.5 py-1 text-xs border-slate-200'
            }`}
          >
            <Clock className={elderMode ? 'w-4 h-4 text-teal-700' : 'w-3.5 h-3.5 text-teal-600'} />
            <span>{medicine.reminderTime}</span>
          </div>
          <StatusBadge status={medicine.status} size={elderMode ? 'sm' : 'xs'} />
        </div>
      </div>

      <div className={`space-y-4 ${elderMode ? 'p-5 sm:p-6' : 'p-4 sm:p-5'}`}>
        {/* Medicine Name & Dose */}
        <div className="flex items-start gap-3.5">
          <div
            className={`rounded-xl text-white flex items-center justify-center shrink-0 shadow-2xs ${
              elderMode ? 'w-14 h-14' : 'w-12 h-12'
            } ${isNotAck ? 'bg-amber-600' : isTaken ? 'bg-emerald-600' : 'bg-teal-700'}`}
          >
            <Pill className={elderMode ? 'w-7 h-7' : 'w-6 h-6'} />
          </div>
          <div className="min-w-0">
            <h3
              className={`font-black text-slate-950 tracking-tight leading-tight ${
                elderMode ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg'
              }`}
            >
              {medicine.name}
            </h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span
                className={`inline-block font-extrabold text-teal-950 bg-teal-50 rounded border border-teal-300 ${
                  elderMode ? 'text-sm px-2.5 py-1' : 'text-xs px-2 py-0.5'
                }`}
              >
                {labels.dose}: {medicine.dosage}
              </span>
              <span className={`text-slate-600 font-medium ${elderMode ? 'text-sm' : 'text-xs'}`}>
                • {medicine.frequency}
              </span>
            </div>
          </div>
        </div>

        {/* Clinical Instruction Details Box */}
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-xl border ${
            elderMode
              ? 'p-4 bg-slate-100/80 border-slate-300 text-sm'
              : 'p-3 bg-slate-50 border-slate-200/70 text-xs'
          }`}
        >
          <div className="flex items-center gap-2 text-slate-800 font-medium">
            <Utensils className="w-4 h-4 text-slate-500 shrink-0" />
            <span>
              {labels.food}: <strong className="text-slate-950 font-bold">{medicine.mealRelation}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-800 font-medium">
            <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
            <span>
              {labels.duration}: <strong className="text-slate-950 font-bold">{medicine.duration}</strong>
            </span>
          </div>

          {medicine.instructions && (
            <div
              className={`sm:col-span-2 text-slate-700 pt-1.5 border-t border-slate-300/60 mt-1 leading-relaxed ${
                elderMode ? 'text-xs sm:text-sm font-medium' : 'text-[11px]'
              }`}
            >
              <strong className="font-bold text-slate-900">{labels.instructions}: </strong>
              {medicine.instructions}
            </div>
          )}
        </div>

        {/* SNOOZE ACTIVE INDICATOR */}
        {isSnoozed && (
          <div
            className={`p-3 bg-teal-50 border border-teal-300 rounded-xl text-teal-950 flex items-center justify-between ${
              elderMode ? 'text-sm font-semibold' : 'text-xs'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-700 shrink-0" />
              <span>
                Snoozed until <strong>{medicine.snoozeUntil}</strong> ({medicine.snoozeMinutes || 15} mins)
              </span>
            </div>
            <span className="text-xs text-teal-900 font-bold uppercase bg-white px-2 py-0.5 rounded border border-teal-300">
              Pending
            </span>
          </div>
        )}

        {/* MISSED DOSE ESCALATION WARNING BOX */}
        {isNotAck && (
          <div
            className={`p-3.5 bg-amber-100 border-2 border-amber-400 rounded-xl text-amber-950 space-y-1 ${
              elderMode ? 'text-sm' : 'text-xs'
            }`}
          >
            <div className="flex items-center gap-1.5 font-extrabold">
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
              <span>{labels.notAckTitle}</span>
            </div>
            <p className="text-xs leading-relaxed text-amber-900">
              Scheduled at {medicine.reminderTime}. System waited past threshold without confirmation.
              <strong className="block text-amber-950 font-bold mt-0.5">{labels.caregiverRec}</strong>
            </p>
          </div>
        )}

        {/* Doctor & Refill Info */}
        <div
          className={`flex items-center justify-between text-slate-500 pt-1 ${
            elderMode ? 'text-xs' : 'text-[11px]'
          }`}
        >
          <span>
            Prescribed by: <strong className="text-slate-800">{medicine.prescribedBy}</strong>
          </span>
          {medicine.refillRemainingDays && (
            <span className={medicine.refillRemainingDays <= 7 ? 'text-amber-800 font-bold' : 'text-slate-600'}>
              Refill in ~{medicine.refillRemainingDays} days
            </span>
          )}
        </div>

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
                  className={`py-2.5 px-2 bg-white hover:bg-teal-50 border border-slate-300 hover:border-teal-500 rounded-lg font-bold text-slate-900 text-center cursor-pointer transition-colors ${
                    elderMode ? 'text-sm' : 'text-xs'
                  }`}
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

        {/* VERY LARGE ACCESSIBLE BUTTONS FOR ELDERLY USERS (Requirement 1 & 8) */}
        <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* 1. LARGE TAKE MEDICINE / TAKEN BUTTON */}
          <button
            onClick={() => onTake(medicine.id)}
            className={`flex-1 rounded-xl font-black flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-sm active:scale-[0.98] ${
              elderMode ? 'py-4 px-6 text-base sm:text-lg min-h-[56px]' : 'py-3 px-4 text-sm sm:text-base'
            } ${
              isTaken
                ? 'bg-emerald-700 text-white border-2 border-emerald-800 ring-2 ring-emerald-300'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700'
            }`}
          >
            <CheckCircle2 className={elderMode ? 'w-6 h-6' : 'w-5 h-5'} />
            <span>{isTaken ? labels.taken : labels.takeMedicine}</span>
          </button>

          {/* 2. SNOOZE / REMIND LATER */}
          {!isTaken && !isSkipped && (
            <button
              onClick={() => setShowQuickSnooze(!showQuickSnooze)}
              className={`rounded-xl font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                elderMode ? 'py-4 px-4 text-sm sm:text-base min-h-[56px]' : 'py-3 px-3.5 text-xs sm:text-sm'
              }`}
              title="Snooze reminder"
            >
              <Bell className={elderMode ? 'w-5 h-5 text-slate-600' : 'w-4 h-4 text-slate-500'} />
              <span>{labels.remindLater}</span>
            </button>
          )}

          {/* 3. SKIPPED BUTTON */}
          <button
            onClick={() => onSkip(medicine.id)}
            className={`rounded-xl font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer border ${
              elderMode ? 'py-4 px-4 text-sm sm:text-base min-h-[56px]' : 'py-3 px-4 text-xs sm:text-sm'
            } ${
              isSkipped
                ? 'bg-rose-700 text-white border-rose-800 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-rose-50 hover:text-rose-800 hover:border-rose-300'
            }`}
          >
            <XCircle className={elderMode ? 'w-5 h-5' : 'w-4 h-4'} />
            <span>{isSkipped ? labels.skipped : labels.skip}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
