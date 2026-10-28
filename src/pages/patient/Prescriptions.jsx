import React, { useState } from 'react';
import { mockPrescriptions } from '../../data/mockData';
import { mockPatientAllergies, runPrescriptionSafetyCheck } from '../../data/medicineSafetyData';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import PrescriptionDetailModal from '../../components/PrescriptionDetailModal';
import MedicineSafetyCheck from '../../components/MedicineSafetyCheck';
import {
  FileText,
  Download,
  CheckCircle2,
  Pill,
  Calendar,
  Building,
  User,
  ShieldCheck,
  AlertTriangle,
  Info,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Prescriptions Page (Phase 2 Enhanced)
 * - Clear prescription cards showing ID, doctor, specialization, hospital, date, validity, medicines list
 * - [VIEW PRESCRIPTION] full details modal with PDF download/print action
 * - [VIEW MEDICINE INFORMATION] direct clinical deep-dive
 * - Real-time Allergy, Duplicate, and Drug-Drug interaction safety evaluation
 * - Documented patient known allergies banner
 */
export default function Prescriptions() {
  const [prescriptionsList, setPrescriptionsList] = useState(mockPrescriptions);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  // Active patient known allergies
  const patientAllergyInfo = mockPatientAllergies['PID-2026-089'] || { knownAllergies: [] };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* 1. Page Header */}
      <PageHeader
        badge="Prescription Records"
        badgeStatus="Doctor Certified"
        title="Official Medical Prescriptions & Safety Checks"
        subtitle="Access verified digital prescriptions, active safety screenings, and verified medicine information"
        action={
          <div className="flex items-center gap-2">
            <Link to="/patient/medicines">
              <Button variant="primary" size="sm" icon={Pill}>
                Open Daily Medicines
              </Button>
            </Link>
          </div>
        }
      />

      {/* 2. Patient Recorded Allergies Safety Banner (Requirement 3 & 10) */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                Documented Patient Known Allergies ({patientAllergyInfo.knownAllergies.length})
              </h4>
              <p className="text-[11px] text-slate-500">
                Prescriptions are continuously screened against these recorded clinical sensitivities.
              </p>
            </div>
          </div>

          <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 self-start sm:self-auto">
            Patient ID: PID-2026-089
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap pt-1">
          {patientAllergyInfo.knownAllergies.map((allergy, idx) => (
            <div
              key={idx}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-300 text-xs font-bold text-amber-950 shadow-2xs"
            >
              <span className="w-2 h-2 rounded-full bg-amber-600"></span>
              <span>{allergy.allergen}</span>
              <span className="text-[10px] text-amber-800 font-medium">({allergy.reaction})</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Prescriptions List */}
      <div className="space-y-6">
        {prescriptionsList.map((rx) => {
          // Run safety screening on this prescription
          const safetyResult = runPrescriptionSafetyCheck({
            medicines: rx.medicines,
            patientId: rx.patientId || 'PID-2026-089',
          });

          return (
            <Card key={rx.id} className="space-y-4">
              {/* Header / Doctor & Hospital Information */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black text-base shrink-0 shadow-2xs">
                    Rx
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-slate-950 text-base sm:text-lg">
                        {rx.doctorName}
                      </h3>
                      <span className="text-xs text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {rx.doctorSpecialization}
                      </span>
                      <StatusBadge status={rx.status || 'Active'} size="xs" />
                    </div>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      {rx.hospital} • {rx.department}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 flex-wrap">
                      <span>Prescription: <strong className="font-mono text-slate-800">{rx.id}</strong></span>
                      <span>•</span>
                      <span>Issued: <strong>{rx.date}</strong></span>
                      <span>•</span>
                      <span>Follow-up: <strong>{rx.followUpDate}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={FileText}
                    onClick={() => setSelectedPrescription(rx)}
                  >
                    View Prescription
                  </Button>
                </div>
              </div>

              {/* Diagnosis Box */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-0.5">
                <span className="text-slate-500 font-bold text-[10px] uppercase tracking-wider block">
                  Clinical Diagnosis:
                </span>
                <strong className="text-slate-900 text-sm">{rx.diagnosis}</strong>
              </div>

              {/* Medicine Safety Screening Summary Bar */}
              <MedicineSafetyCheck safetyResult={safetyResult} showDetailedAlerts={false} />

              {/* Medicines Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-teal-600" /> Prescribed Medications ({rx.medicines.length})
                  </h4>
                  <Link
                    to="/patient/medicines"
                    className="text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline"
                  >
                    View in Daily Reminders →
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 border border-slate-200 rounded-xl overflow-hidden">
                    <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold">
                      <tr>
                        <th className="py-2.5 px-3">Medicine</th>
                        <th className="py-2.5 px-3">Dosage</th>
                        <th className="py-2.5 px-3">Frequency</th>
                        <th className="py-2.5 px-3">Duration</th>
                        <th className="py-2.5 px-3">Food Timing</th>
                        <th className="py-2.5 px-3">Instructions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {rx.medicines.map((med, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 font-extrabold text-slate-950">{med.name}</td>
                          <td className="py-2.5 px-3 font-semibold text-teal-900">{med.dosage}</td>
                          <td className="py-2.5 px-3">{med.frequency}</td>
                          <td className="py-2.5 px-3">{med.duration}</td>
                          <td className="py-2.5 px-3 text-slate-700 font-medium">
                            {med.mealRelation || 'After food'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">{med.instructions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Doctor Signature & Quick Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-slate-200 text-xs text-slate-500 gap-2">
                <span className="font-semibold text-teal-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  {rx.doctorSignature}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPrescription(rx)}
                    className="text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline cursor-pointer"
                  >
                    View Complete Details & PDF Certificate
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Prescription Detail Modal */}
      <PrescriptionDetailModal
        isOpen={!!selectedPrescription}
        onClose={() => setSelectedPrescription(null)}
        prescription={selectedPrescription}
      />
    </div>
  );
}
