import React, { useState } from 'react';
import { mockMedicines } from '../../data/mockData';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import MedicineCard from '../../components/MedicineCard';
import ReminderModal from '../../components/ReminderModal';
import LanguageSelector from '../../components/LanguageSelector';
import EasyExplanation from '../../components/EasyExplanation';
import {
  Pill,
  Clock,
  CheckCircle2,
  AlertCircle,
  Bell,
  Volume2,
  ShieldAlert,
  RotateCcw,
  PhoneCall,
  Sparkles,
  HelpCircle,
  BookOpen,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  speakText,
  buildMedicationReminderMessage,
} from '../../utils/speechService';
import { medicalGlossary } from '../../data/verifiedMedicineDatabase';
import { getTranslation, getLanguageConfig } from '../../utils/languageRegistry';

/**
 * Medicines Page (Phase 1 Refined)
 * Enhanced medical-care features for patients of all ages:
 * - Simple high-contrast main cards: Medicine Name, Dosage, Frequency, Duration, Time, Food instruction
 * - [TAKEN], [REMIND LATER], [NOT TAKEN] primary actions
 * - [VIEW MEDICINE INFORMATION] expandable drawer with full verified clinical data
 * - Side Effects separated into Common vs Important/Serious Warning signs with simple explanations
 * - "Explain Simply" toggle (Medical term -> Easy meaning)
 * - Universal multi-language support (English, Tamil, Hindi, Malayalam, Telugu, Kannada, Bengali, Marathi, Gujarati, Punjabi, Urdu)
 * - Voice Medical Explanation with Play / Stop / multi-language speech synthesis
 * - Drug-specific missed dose guidance (no invented universal rules)
 * - Potentially missed dose reminder flow & safe caregiver escalation prototype
 * - Medicine Refill status ("Your medicine supply may be running low")
 * - Smart medication adherence counters (Today & This Week)
 */
export default function Medicines() {
  const [medicinesList, setMedicinesList] = useState(mockMedicines);
  const [activeModalMed, setActiveModalMed] = useState(null);
  const [snoozeNotice, setSnoozeNotice] = useState('');
  const [escalationNotice, setEscalationNotice] = useState('');

  // Explain Simply toggle (Requirement 3)
  const [explainSimply, setExplainSimply] = useState(true);

  // Universal Language Selection (Requirement 4)
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  // Adherence counters (Today)
  const takenCount = medicinesList.filter((m) => m.status === 'Taken').length;
  const notTakenCount = medicinesList.filter((m) => m.status === 'Skipped').length;
  const pendingCount = medicinesList.filter((m) => m.status === 'Pending').length;
  const notAckCount = medicinesList.filter((m) => m.status === 'Not Acknowledged').length;

  // Speak reminder aloud
  const triggerVoiceSpeech = (text) => {
    speakText({
      text,
      lang: selectedLanguage,
      rate: 0.92,
    });
  };

  // TAKEN Action
  const handleTakeMedicine = (id) => {
    setMedicinesList((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              status: 'Taken',
              snoozeUntil: null,
              snoozeMinutes: null,
              acknowledgedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
          : m
      )
    );
    const med = medicinesList.find((m) => m.id === id);
    if (med) {
      const confirmationMsg = `${med.name} recorded as taken.`;
      triggerVoiceSpeech(confirmationMsg);
    }
  };

  // NOT TAKEN Action
  const handleSkipMedicine = (id) => {
    setMedicinesList((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              status: 'Skipped',
              snoozeUntil: null,
              snoozeMinutes: null,
              skippedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }
          : m
      )
    );
  };

  // REMIND LATER (Snooze - status remains Pending)
  const handleSnoozeMedicine = (id, minutes = 15) => {
    const targetDate = new Date();
    targetDate.setMinutes(targetDate.getMinutes() + minutes);
    const formattedSnoozeTime = targetDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    setMedicinesList((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              status: 'Pending',
              snoozeUntil: formattedSnoozeTime,
              snoozeMinutes: minutes,
            }
          : m
      )
    );

    const med = medicinesList.find((m) => m.id === id);
    setSnoozeNotice(
      `Reminder for ${med?.name || 'medicine'} snoozed for ${minutes} mins (rescheduled to ${formattedSnoozeTime}). Status remains pending.`
    );
    setTimeout(() => setSnoozeNotice(''), 6000);
  };

  // POTENTIALLY MISSED ESCALATION (Requirement 6 & 8: Safe phrasing)
  const simulateEscalationSequence = (id) => {
    const med = medicinesList.find((m) => m.id === id);
    if (!med) return;

    setMedicinesList((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              status: 'Not Acknowledged',
              escalationTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              caregiverAlerted: true,
            }
          : m
      )
    );

    setEscalationNotice(
      `Medication reminder for ${med.name} scheduled at ${med.reminderTime} has not been acknowledged. System re-prompted at ${med.reminderTime.replace(
        ':00',
        ':15'
      )} with no response. Caregiver attention recommended.`
    );
  };

  // Reset demo dose
  const resetDose = (id) => {
    setMedicinesList((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              status: 'Pending',
              snoozeUntil: null,
              snoozeMinutes: null,
            }
          : m
      )
    );
  };

  // Trigger alarm simulation
  const triggerAlarmSimulation = (med) => {
    setActiveModalMed(med);
    const msg = buildMedicationReminderMessage(med, selectedLanguage);
    triggerVoiceSpeech(msg);
  };

  // Localized UI strings
  const pageTitle = getTranslation(selectedLanguage, 'pageTitle');
  const pageSubtitle = getTranslation(selectedLanguage, 'pageSubtitle');
  const prescribedMedsTitle = getTranslation(selectedLanguage, 'prescribedMeds');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* 1. Page Header */}
      <PageHeader
        badge="Medical Care & Safety"
        badgeStatus="Verified Clinical Reference"
        title={pageTitle}
        subtitle={pageSubtitle}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              icon={Bell}
              onClick={() => triggerAlarmSimulation(medicinesList[0])}
            >
              Test Reminder Alarm
            </Button>
            <Link to="/patient/prescriptions">
              <Button variant="primary" size="sm" icon={Pill}>
                View Prescriptions
              </Button>
            </Link>
          </div>
        }
      />

      {/* 2. Medical Care Controls Bar: Explain Simply + Universal Language Selector */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold shrink-0 shadow-2xs">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-slate-900 text-sm">
                Medical Comprehension Settings
              </h4>
              <span className="text-[10px] text-teal-800 bg-teal-50 px-2 py-0.5 rounded font-bold border border-teal-200">
                Patient Decision Support
              </span>
            </div>
            <p className="text-slate-500 text-xs mt-0.5">
              Explains medical terms simply without changing clinical meaning. Preserves doctor terminology.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
          {/* Explain Simply Toggle (Requirement 3) */}
          <button
            type="button"
            onClick={() => setExplainSimply(!explainSimply)}
            className={`px-3 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer border shadow-2xs ${
              explainSimply
                ? 'bg-amber-100 text-amber-950 border-amber-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
            title="Toggle Explain Simply (Plain-language explanations of medical terms)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Explain Simply: {explainSimply ? 'ON' : 'OFF'}</span>
          </button>

          {/* Universal Multi-Language Selector (Requirement 4: 14 languages) */}
          <LanguageSelector
            language={selectedLanguage}
            onChangeLanguage={(lang) => setSelectedLanguage(lang)}
          />
        </div>
      </div>

      {/* 3. AI Easy Medical Explanation Banner (when Explain Simply is ON) */}
      {explainSimply && (
        <div className="p-3.5 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-teal-950 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-teal-700" />
              <span>Medical Terminology: Original Medical Term → Easy Meaning</span>
            </span>
            <span className="text-[10px] text-teal-800 italic">
              Original clinical terms preserved
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
            <EasyExplanation
              medicalTerm={medicalGlossary.hypertension.term}
              easyMeaning={medicalGlossary.hypertension.simple}
              tamilMeaning={medicalGlossary.hypertension.tamil}
              language={selectedLanguage}
            />
            <EasyExplanation
              medicalTerm={medicalGlossary.edema.term}
              easyMeaning={medicalGlossary.edema.simple}
              tamilMeaning={medicalGlossary.edema.tamil}
              language={selectedLanguage}
            />
            <EasyExplanation
              medicalTerm={medicalGlossary.adherence.term}
              easyMeaning={medicalGlossary.adherence.simple}
              tamilMeaning={medicalGlossary.adherence.tamil}
              language={selectedLanguage}
            />
          </div>
        </div>
      )}

      {/* 4. Smart Medication Adherence Summary (Requirement 7) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today's Schedule */}
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-700" />
              <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                Today's Medication Adherence
              </h4>
            </div>
            <span className="text-[11px] text-slate-400">Scheduled Daily Slots</span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-xs">
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-[10px] font-bold text-emerald-800 uppercase block">Morning</span>
              <span className="text-sm font-black text-emerald-900 block mt-0.5">
                ✓ {takenCount > 0 ? 'Taken' : 'Pending'}
              </span>
              <span className="text-[10px] text-emerald-700">08:00 AM & 08:30 AM</span>
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold text-slate-600 uppercase block">Afternoon</span>
              <span className="text-sm font-black text-slate-800 block mt-0.5">
                ○ Upcoming
              </span>
              <span className="text-[10px] text-slate-500">No scheduled dose</span>
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold text-slate-600 uppercase block">Night</span>
              <span className="text-sm font-black text-slate-800 block mt-0.5">
                ○ Upcoming
              </span>
              <span className="text-[10px] text-slate-500">09:00 PM (After dinner)</span>
            </div>
          </div>
        </div>

        {/* This Week's Adherence Metric */}
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                This Week's Recorded Doses
              </h4>
            </div>
            <span className="text-[10px] text-slate-400 italic">Self-reported tracking</span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-xs">
            <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-center">
              <span className="text-slate-500 text-[10px] font-bold block uppercase">Taken</span>
              <span className="text-lg font-black text-emerald-700 block mt-0.5">16</span>
              <span className="text-[10px] text-emerald-600 font-semibold">91% recorded</span>
            </div>

            <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-center">
              <span className="text-slate-500 text-[10px] font-bold block uppercase">Not Acknowledged</span>
              <span className="text-lg font-black text-amber-700 block mt-0.5">{notAckCount + 1}</span>
              <span className="text-[10px] text-amber-600 font-semibold">Re-prompted</span>
            </div>

            <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-center">
              <span className="text-slate-500 text-[10px] font-bold block uppercase">Reminded Later</span>
              <span className="text-lg font-black text-slate-800 block mt-0.5">1</span>
              <span className="text-[10px] text-slate-500 font-semibold">Snoozed</span>
            </div>
          </div>
        </div>
      </div>

      {/* SNOOZE FEEDBACK BANNER */}
      {snoozeNotice && (
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-600 shrink-0" />
            <span>{snoozeNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setSnoozeNotice('')}
            className="text-[11px] font-semibold text-teal-700 hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* POTENTIALLY MISSED DOSE / CAREGIVER ATTENTION BANNER (Requirement 8) */}
      {escalationNotice && (
        <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-200/70 text-amber-900 rounded-xl shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <strong className="block text-sm font-extrabold text-amber-950">
                🟡 Medication has not been acknowledged — Caregiver attention notification
              </strong>
              <p className="text-amber-900 text-xs mt-0.5 leading-relaxed">
                {escalationNotice}
              </p>
              <div className="flex items-center gap-2 mt-1.5 text-[11px] text-amber-800">
                <span>Authorized Caregiver: <strong>Pooja Sharma (Spouse)</strong></span>
                <span>•</span>
                <span>Consent Status: <strong>Authorized Proxy (Medication Alerts)</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <a
              href="tel:+919876543210"
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Contact Caregiver</span>
            </a>
            <button
              type="button"
              onClick={() => setEscalationNotice('')}
              className="text-xs font-semibold text-amber-800 hover:underline px-2 py-1 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* 5. Prescribed Medications Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 text-sm">
            {prescribedMedsTitle} ({medicinesList.length})
          </h3>
          <span className="text-xs text-slate-500">
            Click <strong className="text-teal-700 font-bold">View Medicine Information</strong> for full verified clinical guidance
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {medicinesList.map((med) => (
            <MedicineCard
              key={med.id}
              medicine={med}
              onTake={handleTakeMedicine}
              onSkip={handleSkipMedicine}
              onSnooze={handleSnoozeMedicine}
              easyLanguage={explainSimply}
              language={selectedLanguage}
            />
          ))}
        </div>
      </div>

      {/* Phase 1 Testing Lab: Simulation Protocol */}
      <Card
        title="Medication Safety & Adherence Testing Lab"
        subtitle="Simulate voice alarm announcements, snooze intervals, and safe caregiver attention notifications"
        icon={ShieldAlert}
      >
        <div className="space-y-3 text-xs text-slate-700">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-600">
            <div className="space-y-1">
              <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
                1. Expandable Information
              </span>
              <p className="text-[11px] text-slate-500">
                Click "View Medicine Information" on any card to reveal verified purpose, side effects, missed-dose instructions, and drug interactions.
              </p>
            </div>
            <div className="space-y-1 sm:border-l sm:border-slate-200 sm:pl-3">
              <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
                2. Side Effects Severity Tiers
              </span>
              <p className="text-[11px] text-slate-500">
                Common (Mild), Important (Warning signs), and Emergency (Immediate care 108/112).
              </p>
            </div>
            <div className="space-y-1 sm:border-l sm:border-slate-200 sm:pl-3">
              <span className="font-bold text-amber-800 block text-[11px] uppercase tracking-wider">
                3. Safe Escalation Language
              </span>
              <p className="text-[11px] text-slate-500">
                Uses honest phrasing: "Not acknowledged" rather than assuming a missed dose.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => triggerAlarmSimulation(medicinesList[0])}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Volume2 className="w-4 h-4" />
              <span>Hear Sample Dose Alarm ({medicinesList[0].name})</span>
            </button>

            <button
              type="button"
              onClick={() => simulateEscalationSequence(medicinesList[0].id)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition-colors cursor-pointer"
            >
              Simulate Unacknowledged Dose Escalation
            </button>

            <button
              type="button"
              onClick={() => handleSnoozeMedicine(medicinesList[0].id, 10)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-colors cursor-pointer"
            >
              Simulate 10 Min Snooze
            </button>

            <button
              type="button"
              onClick={() => resetDose(medicinesList[0].id)}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset Sample Dose</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Interactive Reminder Modal */}
      <ReminderModal
        isOpen={!!activeModalMed}
        onClose={() => setActiveModalMed(null)}
        medicine={activeModalMed}
        onTake={handleTakeMedicine}
        onSkip={handleSkipMedicine}
        onSnooze={handleSnoozeMedicine}
        voiceEnabled={true}
        voiceLang={selectedLanguage}
      />
    </div>
  );
}
