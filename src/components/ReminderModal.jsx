import React, { useState } from 'react';
import Modal from './Modal';
import {
  Bell,
  Clock,
  Utensils,
  Pill,
  CheckCircle2,
  XCircle,
  Volume2,
} from 'lucide-react';
import { speakText, buildMedicationReminderMessage } from '../utils/speechService';
import { getTranslation } from '../utils/languageRegistry';

/**
 * ReminderModal
 * Clinical medication reminder modal:
 * - Medicine name, prescribed dose, instructions, food instruction
 * - Audible speech playback button in selected language
 * - Distinct, honest action buttons:
 *   [ TAKEN ], [ REMIND LATER ], [ NOT TAKEN ]
 * - Snooze options: 10 mins, 30 mins, 1 hour
 */
export default function ReminderModal({
  isOpen,
  onClose,
  medicine,
  onTake,
  onSkip,
  onSnooze,
  voiceEnabled = true,
  voiceLang = 'en',
}) {
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  if (!medicine) return null;

  const takeLabel = getTranslation(voiceLang, 'takeMedicine');
  const remindLaterLabel = getTranslation(voiceLang, 'remindLater');
  const notTakenLabel = getTranslation(voiceLang, 'skipDose');

  const handleSpeakModalPrompt = () => {
    if (isSpeaking) return;
    const msg = buildMedicationReminderMessage(medicine, voiceLang);
    setIsSpeaking(true);
    speakText({
      text: msg,
      lang: voiceLang,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🔔 Scheduled Medicine Reminder"
      description="It is time for your prescribed dose."
      footer={null}
    >
      <div className="space-y-5 text-slate-800">
        {/* Medicine Highlight Box */}
        <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl flex items-start justify-between gap-3.5">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Pill className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block">
                {medicine.slotName || 'Scheduled Dose'} • {medicine.reminderTime}
              </span>
              <h3 className="font-extrabold text-slate-900 text-lg leading-tight mt-0.5">
                {medicine.name}
              </h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="font-bold text-teal-900 bg-white px-2 py-0.5 rounded text-xs border border-teal-200">
                  Prescribed Dose: {medicine.dosage}
                </span>
                <span className="text-xs text-slate-600 font-medium">
                  ({medicine.mealRelation})
                </span>
              </div>
            </div>
          </div>

          {/* Voice Prompt Playback Button */}
          {voiceEnabled && (
            <button
              type="button"
              onClick={handleSpeakModalPrompt}
              className={`p-2.5 rounded-xl border transition-colors cursor-pointer shrink-0 ${
                isSpeaking
                  ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                  : 'bg-white hover:bg-slate-100 text-teal-700 border-teal-200'
              }`}
              title="Hear voice reminder aloud"
              aria-label="Play audible voice reminder"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Doctor Instructions */}
        {medicine.instructions && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
            <strong className="text-slate-800 block">Doctor's Instructions:</strong>
            <p className="text-slate-600 leading-relaxed">{medicine.instructions}</p>
          </div>
        )}

        {/* Snooze Sub-options (when clicked REMIND LATER) */}
        {snoozeOpen ? (
          <div className="p-3.5 bg-slate-100 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-900 text-xs block">
              Select snooze duration:
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[10, 30, 60].map((mins) => (
                <button
                  key={mins}
                  onClick={() => {
                    onSnooze(medicine.id, mins);
                    setSnoozeOpen(false);
                    onClose();
                  }}
                  className="py-2.5 px-2 bg-white hover:bg-teal-50 border border-slate-300 hover:border-teal-400 rounded-lg text-xs font-bold text-slate-800 cursor-pointer text-center transition-colors"
                >
                  {mins === 60 ? '1 hour' : `${mins} mins`}
                </button>
              ))}
            </div>
            <button
              onClick={() => setSnoozeOpen(false)}
              className="text-[11px] text-slate-500 hover:text-slate-800 underline block pt-1 text-center w-full"
            >
              Cancel snooze
            </button>
          </div>
        ) : null}

        {/* Large Accessible Primary Actions (Requirement 6: TAKEN / REMIND LATER / NOT TAKEN) */}
        <div className="space-y-2.5 pt-1">
          {/* 1. TAKEN BUTTON */}
          <button
            onClick={() => {
              onTake(medicine.id);
              onClose();
            }}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all active:scale-[0.99]"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{takeLabel}</span>
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            {/* 2. REMIND LATER */}
            <button
              onClick={() => setSnoozeOpen(!snoozeOpen)}
              className="py-3 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Clock className="w-4 h-4 text-slate-600" />
              <span>{remindLaterLabel}</span>
            </button>

            {/* 3. NOT TAKEN BUTTON */}
            <button
              onClick={() => {
                onSkip(medicine.id);
                onClose();
              }}
              className="py-3 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>{notTakenLabel}</span>
            </button>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 text-center leading-relaxed">
          Logged adherence is recorded in your longitudinal health record for clinical follow-up review.
        </p>
      </div>
    </Modal>
  );
}
