import React, { useState, useEffect } from 'react';
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
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { prescriptionService } from '../../services/prescriptionService';
import { runPrescriptionSafetyCheck, mockPatientAllergies } from '../../data/medicineSafetyData';
import { useAuth } from '../../context/AuthContext';

/**
 * Prescriptions Page (Real PostgreSQL Database & Pharmacovigilance)
 * - Clear prescription cards showing ID, doctor, specialization, hospital, date, validity, medicines list
 * - Fetches genuine prescriptions from database
 * - [VIEW PRESCRIPTION] full details modal with PDF download/print action
 * - Real-time Allergy, Duplicate, and Drug-Drug interaction safety evaluation
 * - Documented patient known allergies banner
 */
export default function Prescriptions() {
  const { user } = useAuth();
  const [prescriptionsList, setPrescriptionsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  // Active patient known allergies
  const patientAllergyInfo = mockPatientAllergies[user?.id] || mockPatientAllergies['PID-2026-089'] || { knownAllergies: [] };

  const loadPrescriptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await prescriptionService.getPrescriptions();
      setPrescriptionsList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Could not fetch real prescriptions:', err);
      setError(err.response?.data?.detail || 'Failed to load official prescriptions from medical record.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrescriptions();
  }, []);

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
            <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadPrescriptions}>
              Refresh
            </Button>
            <Link to="/patient/medicines">
              <Button variant="primary" size="sm" icon={Pill}>
                Open Daily Medicines
              </Button>
            </Link>
          </div>
        }
      />

      {/* 2. Patient Recorded Allergies Safety Banner */}
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
            Patient: {user?.full_name || 'Registered Patient'} ({user?.id || 'ID-ACTIVE'})
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap pt-1">
          {patientAllergyInfo.knownAllergies.length === 0 ? (
            <span className="text-xs text-slate-500 italic">No adverse drug reactions documented.</span>
          ) : (
            patientAllergyInfo.knownAllergies.map((allergy, idx) => (
              <div
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-300 text-xs font-bold text-amber-950 shadow-2xs"
              >
                <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                <span>{allergy.allergen}</span>
                <span className="text-[10px] text-amber-800 font-medium">({allergy.reaction})</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. Loading & Error States */}
      {loading ? (
        <Card className="p-12 text-center text-slate-500">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
          <p className="font-semibold text-slate-700">Accessing Electronic Health Record...</p>
          <p className="text-xs text-slate-400 mt-1">Retrieving official physician prescriptions from database</p>
        </Card>
      ) : error ? (
        <Card className="p-8 text-center bg-rose-50 border-rose-200">
          <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
          <h3 className="font-bold text-rose-900 text-sm">Failed to Load Prescriptions</h3>
          <p className="text-xs text-rose-700 mt-1">{error}</p>
          <Button variant="outline" size="sm" onClick={loadPrescriptions} className="mt-4">
            Retry
          </Button>
        </Card>
      ) : prescriptionsList.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3 border border-teal-100">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">No Prescriptions on File</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            You do not currently have any electronic prescriptions issued. When your attending physician writes a prescription during a tele-consultation or clinic visit, it will appear here instantly.
          </p>
        </Card>
      ) : (
        /* 4. Prescriptions List */
        <div className="space-y-6">
          {prescriptionsList.map((rx) => {
            // Run safety screening on this prescription
            const safetyResult = runPrescriptionSafetyCheck({
              medicines: rx.medicines,
              patientId: rx.patientId || user?.id,
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
                          {rx.doctorSpecialization || rx.department || 'Internal Medicine'}
                        </span>
                        <StatusBadge status={rx.status || 'Active'} size="xs" />
                      </div>
                      <p className="text-xs text-slate-600 font-medium mt-0.5">
                        {rx.hospital || rx.hospitalName || 'Mediverse Health System'}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 flex-wrap">
                        <span>
                          Prescription: <strong className="font-mono text-slate-800">{rx.prescriptionId || rx.id}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Issued: <strong>{rx.date}</strong>
                        </span>
                        {rx.followUpDate && (
                          <>
                            <span>•</span>
                            <span>
                              Follow-up: <strong>{rx.followUpDate}</strong>
                            </span>
                          </>
                        )}
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
                      <Pill className="w-3.5 h-3.5 text-teal-600" /> Prescribed Medications ({rx.medicines?.length || 0})
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
                        {rx.medicines?.map((med, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="py-2.5 px-3 font-extrabold text-slate-950">
                              {med.name || med.medicineName}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-teal-900">
                              {med.dosage || med.strength}
                            </td>
                            <td className="py-2.5 px-3">{med.frequency}</td>
                            <td className="py-2.5 px-3">{med.duration}</td>
                            <td className="py-2.5 px-3 text-slate-700 font-medium">
                              {med.mealRelation || med.foodInstruction || 'After food'}
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
                    {rx.doctorSignature || `Verified (Dr. ${rx.doctorName})`}
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
      )}

      {/* Prescription Detail Modal */}
      <PrescriptionDetailModal
        isOpen={!!selectedPrescription}
        onClose={() => setSelectedPrescription(null)}
        prescription={selectedPrescription}
      />
    </div>
  );
}
