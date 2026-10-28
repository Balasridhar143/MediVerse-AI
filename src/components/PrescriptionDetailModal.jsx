import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import StatusBadge from './StatusBadge';
import MedicineDetails from './MedicineDetails';
import MedicineSafetyCheck from './MedicineSafetyCheck';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Building,
  User,
  Pill,
  CheckCircle2,
  Clock,
  Utensils,
  Info,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';
import { runPrescriptionSafetyCheck } from '../data/medicineSafetyData';

/**
 * PrescriptionDetailModal
 * Dedicated modal for comprehensive prescription review:
 * - Prescription Summary (ID, Date, Validity, Follow-up date)
 * - Doctor & Hospital Information (Name, Specialization, Dept, Signature)
 * - Medicine Details (Dose, Frequency, Duration, Meal Relation, Instructions)
 * - Embedded Medicine Safety Check (Allergy, Duplicate, Interaction)
 * - Expandable "View Medicine Information" per medicine
 * - [ Download / Print Prescription ] prototype action
 */
export default function PrescriptionDetailModal({
  isOpen,
  onClose,
  prescription,
}) {
  const [selectedMedForInfo, setSelectedMedForInfo] = useState(null);
  const [printNotice, setPrintNotice] = useState(false);

  if (!prescription) return null;

  // Run safety check for this prescription
  const safetyResult = runPrescriptionSafetyCheck({
    medicines: prescription.medicines,
    patientId: prescription.patientId || 'PID-2026-089',
  });

  const handlePrintDownload = () => {
    setPrintNotice(true);
    setTimeout(() => setPrintNotice(false), 5000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Official Prescription #${prescription.id}`}
      description={`Issued by ${prescription.doctorName} • ${prescription.hospital}`}
      size="xl"
      footer={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between w-full gap-2">
          <div className="text-xs text-slate-500">
            Digital Signature: <strong className="text-teal-800">{prescription.doctorSignature}</strong>
          </div>
          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              icon={Download}
              onClick={handlePrintDownload}
            >
              Download / Print PDF
            </Button>
            <Button variant="primary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5 text-slate-800 text-xs">
        {printNotice && (
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-800 text-xs flex items-center justify-between">
            <span>
              ✓ Prototype Action: Formatted PDF certificate for <strong>{prescription.id}</strong> generated. (Print dialog ready)
            </span>
            <button
              onClick={() => setPrintNotice(false)}
              className="text-xs text-teal-900 font-bold hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 1. Header Information Grid */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Prescription ID</span>
            <strong className="text-slate-900 font-mono text-sm block mt-0.5">{prescription.id}</strong>
            <span className="text-[11px] text-slate-500">Date: {prescription.date}</span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Prescribing Clinician</span>
            <strong className="text-slate-900 font-semibold block mt-0.5">{prescription.doctorName}</strong>
            <span className="text-[11px] text-teal-700">{prescription.doctorSpecialization}</span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Hospital / Center</span>
            <strong className="text-slate-900 font-semibold block mt-0.5">{prescription.hospital}</strong>
            <span className="text-[11px] text-slate-500">{prescription.department}</span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Validity & Status</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <StatusBadge status={prescription.status || 'Active'} size="xs" />
            </div>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Follow-up: <strong>{prescription.followUpDate || '12 Oct 2026'}</strong>
            </span>
          </div>
        </div>

        {/* 2. Diagnosis & Clinical Instructions */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Clinical Diagnosis
            </span>
            <span className="text-[10px] text-teal-700 font-semibold">ICD-10 Documented</span>
          </div>
          <p className="text-slate-900 text-sm font-bold">{prescription.diagnosis}</p>
          {prescription.instructions && (
            <p className="text-slate-600 text-xs pt-1 border-t border-slate-100">
              <strong className="text-slate-800">Doctor Instructions: </strong>
              {prescription.instructions}
            </p>
          )}
        </div>

        {/* 3. Embedded Medicine Safety Summary Check (Allergies + Duplicates + Interactions) */}
        <MedicineSafetyCheck safetyResult={safetyResult} showDetailedAlerts={true} />

        {/* 4. Prescribed Medicines List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Pill className="w-4 h-4 text-teal-600" />
              <span>Prescribed Medications ({prescription.medicines?.length || 0})</span>
            </h4>
            <span className="text-[11px] text-slate-400">Click medicine info for clinical guidance</span>
          </div>

          <div className="space-y-2.5">
            {prescription.medicines?.map((med, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-teal-50 text-teal-800 font-bold text-xs flex items-center justify-center border border-teal-200 shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-extrabold text-slate-900 text-sm">{med.name}</span>
                      <span className="text-slate-500 text-xs ml-2 font-medium">
                        Dose: <strong className="text-slate-800">{med.dosage}</strong>
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedMedForInfo(selectedMedForInfo === med.name ? null : med.name)
                    }
                    className="text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                  >
                    <span>{selectedMedForInfo === med.name ? 'Hide Medicine Info' : 'View Medicine Information'}</span>
                    {selectedMedForInfo === med.name ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div>
                    Frequency: <strong className="text-slate-900">{med.frequency}</strong>
                  </div>
                  <div>
                    Duration: <strong className="text-slate-900">{med.duration}</strong>
                  </div>
                  <div>
                    Timing: <strong className="text-slate-900">{med.mealRelation || 'After meals'}</strong>
                  </div>
                  {med.instructions && (
                    <div className="sm:col-span-3 text-slate-700 pt-1 border-t border-slate-200/60 mt-0.5">
                      Instructions: {med.instructions}
                    </div>
                  )}
                </div>

                {/* Inline Expandable Medicine Details if selected */}
                {selectedMedForInfo === med.name && (
                  <div className="pt-2 animate-in fade-in">
                    <MedicineDetails
                      medicine={{
                        id: med.id || (med.name.toLowerCase().includes('telm') ? 'med_1' : 'med_3'),
                        name: med.name,
                        dosage: med.dosage,
                        timing: med.timing || 'Daily',
                        mealRelation: med.mealRelation || 'After food',
                        frequency: med.frequency,
                        duration: med.duration,
                        instructions: med.instructions,
                        prescribedBy: prescription.doctorName,
                      }}
                      easyLanguage={true}
                      language="en"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
