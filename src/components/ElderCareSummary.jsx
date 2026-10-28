import React from 'react';
import { useElderMode } from '../context/ElderModeContext';
import {
  Pill,
  Calendar,
  Heart,
  Clock,
  CheckCircle2,
  AlertCircle,
  Siren,
  PhoneCall,
  Volume2,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { mockMedicines, mockAppointments, mockFollowUps } from '../data/mockData';

/**
 * ElderCareSummary
 * High-contrast, large-button daily care summary for elderly patients & caregivers.
 * Integrates:
 * - Today's Medication (Acknowledged vs unacknowledged)
 * - Upcoming Consultations
 * - Health Check status
 * - Recommended Follow-up
 * - Prominent 🚨 EMERGENCY HELP action with immediate contacts
 */
export default function ElderCareSummary({ onOpenDailyCheck }) {
  const { elderMode, language } = useElderMode();

  // Counts from medicines
  const takenCount = mockMedicines.filter((m) => m.status === 'Taken').length;
  const pendingCount = mockMedicines.filter((m) => m.status === 'Pending').length;
  const notAckCount = mockMedicines.filter((m) => m.status === 'Not Acknowledged').length;

  const nextAppt = mockAppointments.find((a) => a.status === 'Upcoming');
  const nextFollowUp = mockFollowUps[0];

  const labels = {
    title: language === 'ta' ? "இன்றைய பராமரிப்புச் சுருக்கம் (TODAY'S CARE)" : "TODAY'S CARE SUMMARY",
    medication: language === 'ta' ? 'மருந்துகள்' : 'Medication Schedule',
    appointments: language === 'ta' ? 'மருத்துவர் சந்திப்பு' : 'Appointments',
    healthCheck: language === 'ta' ? 'தினசரி உடல்நல ஆய்வு' : 'Daily Health Check',
    followUp: language === 'ta' ? 'அடுத்த பரிசோதனை' : 'Follow-up Target',
    emergencyBtn: language === 'ta' ? '🚨 அவசர உதவி (EMERGENCY)' : '🚨 EMERGENCY HELP',
    manageMeds: language === 'ta' ? 'மருந்துகளை பார்க்க' : 'Open Medicines',
    viewAppts: language === 'ta' ? 'சந்திப்புகளை பார்க்க' : 'View Schedule',
  };

  return (
    <div
      className={`rounded-2xl border transition-all ${
        elderMode
          ? 'bg-amber-50/70 border-amber-300 p-5 sm:p-6 ring-2 ring-amber-300 shadow-md'
          : 'bg-white border-slate-200 p-4 sm:p-5 shadow-2xs'
      }`}
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div
            className={`rounded-xl flex items-center justify-center font-bold text-white shadow-2xs ${
              elderMode ? 'w-12 h-12 bg-amber-600' : 'w-10 h-10 bg-teal-600'
            }`}
          >
            <Heart className={elderMode ? 'w-6 h-6' : 'w-5 h-5'} />
          </div>
          <div>
            <h3
              className={`font-black tracking-tight text-slate-950 ${
                elderMode ? 'text-lg sm:text-xl' : 'text-sm sm:text-base'
              }`}
            >
              {labels.title}
            </h3>
            <p className="text-slate-600 text-xs mt-0.5">
              Longitudinal daily safety, scheduled adherence, and prompt emergency access
            </p>
          </div>
        </div>

        {/* LARGE EMERGENCY HELP ACTION (Requirement 14) */}
        <Link
          to="/patient/emergency"
          className={`flex items-center justify-center gap-2 font-black rounded-xl cursor-pointer transition-all shadow-xs active:scale-[0.98] ${
            elderMode
              ? 'py-3.5 px-6 bg-rose-600 hover:bg-rose-700 text-white text-base min-h-[50px] ring-2 ring-rose-300'
              : 'py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs'
          }`}
        >
          <Siren className={elderMode ? 'w-5 h-5' : 'w-4 h-4'} />
          <span>{labels.emergencyBtn}</span>
        </Link>
      </div>

      {/* 4 Pillars Grid: Medication, Appointments, Health Check, Follow-up (Requirement 13) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4">
        {/* 1. Medication Summary */}
        <div
          className={`p-4 rounded-xl border flex flex-col justify-between ${
            elderMode ? 'bg-white border-slate-300' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="font-extrabold text-[11px] uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-teal-600" />
                {labels.medication}
              </span>
              <span className="text-[10px] font-bold text-slate-500">TODAY</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>✓ {takenCount} acknowledged</span>
              </div>

              {notAckCount > 0 ? (
                <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>⚠ {notAckCount} not acknowledged</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{pendingCount} upcoming doses</span>
                </div>
              )}
            </div>
          </div>

          <Link
            to="/patient/medicines"
            className="text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline pt-3 mt-2 border-t border-slate-200/70 flex items-center justify-between"
          >
            <span>{labels.manageMeds}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 2. Appointments Summary */}
        <div
          className={`p-4 rounded-xl border flex flex-col justify-between ${
            elderMode ? 'bg-white border-slate-300' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="font-extrabold text-[11px] uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-teal-600" />
                {labels.appointments}
              </span>
              <span className="text-[10px] font-bold text-slate-500">SCHEDULE</span>
            </div>

            {nextAppt ? (
              <div className="space-y-1">
                <span className="text-xs font-extrabold text-slate-900 block truncate">
                  {nextAppt.doctorName}
                </span>
                <span className="text-[11px] text-slate-600 block">
                  {nextAppt.date} at {nextAppt.time}
                </span>
                <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 inline-block">
                  {nextAppt.type}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-600 py-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>✓ No appointment today</span>
              </div>
            )}
          </div>

          <Link
            to="/patient/appointments"
            className="text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline pt-3 mt-2 border-t border-slate-200/70 flex items-center justify-between"
          >
            <span>{labels.viewAppts}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 3. Daily Health Check */}
        <div
          className={`p-4 rounded-xl border flex flex-col justify-between ${
            elderMode ? 'bg-white border-slate-300' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="font-extrabold text-[11px] uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-500" />
                {labels.healthCheck}
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                ACTIVE
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span className="text-base">🙂</span>
                <span>Feeling well logged</span>
              </span>
              <span className="text-[11px] text-slate-500 block">
                BP: 120/80 mmHg • HR: 72 bpm
              </span>
            </div>
          </div>

          {onOpenDailyCheck ? (
            <button
              onClick={onOpenDailyCheck}
              className="text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline pt-3 mt-2 border-t border-slate-200/70 text-left flex items-center justify-between cursor-pointer"
            >
              <span>Update Check-in</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <Link
              to="/patient/timeline"
              className="text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline pt-3 mt-2 border-t border-slate-200/70 flex items-center justify-between"
            >
              <span>View Timeline</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {/* 4. Follow-up Target */}
        <div
          className={`p-4 rounded-xl border flex flex-col justify-between ${
            elderMode ? 'bg-white border-slate-300' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="font-extrabold text-[11px] uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-teal-600" />
                {labels.followUp}
              </span>
              <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                TARGET
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-sm font-black text-slate-950 block">
                {nextFollowUp?.followUpDate || '12 Oct 2026'}
              </span>
              <span className="text-[11px] text-slate-600 block line-clamp-2">
                {nextFollowUp?.doctorName || 'Dr. Ananya Sen'} (Cardiology evaluation)
              </span>
            </div>
          </div>

          <Link
            to="/patient/follow-ups"
            className="text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline pt-3 mt-2 border-t border-slate-200/70 flex items-center justify-between"
          >
            <span>View Follow-up</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
