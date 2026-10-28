import React from 'react';

/**
 * Reusable StatusBadge component
 * Follows a strict semantic color system:
 * - Green (Emerald): Completed, Active, Available, Taken, Normal, Stabilized, On Duty, Active Care
 * - Amber (Yellow): Pending, Review Required, Moderate, Under Evaluation, High Demand, Warning
 * - Red (Rose): Emergency, Critical, Cancelled, Skipped, Allergy Flag, Contraindicated
 * - Blue (Sky/Teal): Scheduled, Upcoming, Telemedicine, In Consultation, In-Person
 */
export default function StatusBadge({ status = 'Active', size = 'sm', className = '' }) {
  const normalized = (status || '').toLowerCase().trim();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';

  // Green / Emerald: Completed / Active / Available / Normal
  if (
    [
      'completed',
      'active',
      'active monitoring',
      'available',
      'taken',
      'normal',
      'stabilized',
      'on duty',
      'active care',
      'active outpatient',
      'verified patient',
      'saved',
      'active duty',
      'nabh accredited',
      'digital records',
      'telemedicine active',
      'daily adherence active',
      'doctor authority enforced',
      '6 active units',
      'purposeful analytics',
      'optimal',
      'stable',
      'reviewed',
      'acknowledged by clinician',
      '24x7 open',
    ].includes(normalized)
  ) {
    styles = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  }
  // Amber / Yellow: Pending / Attention / Moderate
  else if (
    [
      'pending',
      'moderate',
      'review required',
      'under evaluation',
      'high demand',
      'pre-diabetic',
      'warning',
      'advisory',
      'borderline',
      'doctor review required',
      'reported',
      'triage alert engine',
      'triage synthesis',
      'review scheduled',
    ].includes(normalized)
  ) {
    styles = 'bg-amber-50 text-amber-800 border-amber-200';
  }
  // Red / Rose: Emergency / Critical / Cancelled / Contraindicated
  else if (
    [
      'cancelled',
      'skipped',
      'critical',
      'emergency',
      'contraindicated',
      'strict contraindication',
      'allergy flag',
      'critical allergy flag',
      '24x7 red alert line',
      'admitted (icu)',
    ].includes(normalized)
  ) {
    styles = 'bg-rose-50 text-rose-800 border-rose-200';
  }
  // Blue / Sky / Teal: Scheduled / Upcoming / Info / Consultation
  else if (
    [
      'scheduled',
      'upcoming',
      'telemedicine',
      'in-person',
      'in consultation',
      'room ready',
      'session live',
      'call in progress',
      'doctor certified',
      'automated follow-ups',
      'digital health profile',
      'chronological record',
      'affiliates',
      'affiliated centers',
      'hospital master ledger',
      'under clinical care',
      'staff management',
      'hospital medical board',
      'central registry',
      '1,248 records',
      'operations center',
      'operational intelligence',
      'active safety checks',
      'clinician workspace',
      'hospital administration',
      'patient care',
      'appointments ledger',
    ].includes(normalized)
  ) {
    styles = 'bg-sky-50 text-sky-800 border-sky-200';
  }

  const sizeClasses =
    size === 'xs'
      ? 'text-[11px] px-2 py-0.5 leading-tight'
      : size === 'lg'
      ? 'text-xs px-3 py-1.5'
      : 'text-xs px-2.5 py-1 leading-tight';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border ${styles} ${sizeClasses} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-75 shrink-0"></span>
      <span className="truncate">{status}</span>
    </span>
  );
}
