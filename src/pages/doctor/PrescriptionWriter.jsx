import React, { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import MedicineSafetyCheck from '../../components/MedicineSafetyCheck';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  Send,
  Pill,
  User,
  ShieldCheck,
  Calendar,
  Utensils,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import { mockPatients, mockPrescriptions } from '../../data/mockData';
import {
  mockPatientAllergies,
  runPrescriptionSafetyCheck,
} from '../../data/medicineSafetyData';

/**
 * Doctor PrescriptionWriter (Phase 2 Enhanced)
 * Clinical Workflow:
 * 1. Select patient from registry
 * 2. Select medicine, enter dosage, frequency, duration, food instruction, instructions, follow-up date
 * 3. Automated Pre-submission Pharmacovigilance Review:
 *    - Allergy Check
 *    - Duplicate Molecule Check
 *    - Drug-Drug Interaction Check
 * 4. Doctor Explicit Authority & Confirmation Checkbox
 * 5. Sign & Issue Prescription into patient electronic health record
 */
export default function PrescriptionWriter() {
  const [selectedPatientId, setSelectedPatientId] = useState('PID-2026-089');

  const patientList = [
    {
      id: 'PID-2026-089',
      name: 'Rahul Sharma',
      age: 42,
      gender: 'Male',
      diagnosis: 'Stage 1 Essential Hypertension & Impaired Fasting Glucose',
      currentMeds: ['Telmisartan 40mg', 'Atorvastatin 10mg'],
    },
    {
      id: 'PID-2026-094',
      name: 'Meera Iyer',
      age: 58,
      gender: 'Female',
      diagnosis: 'Post-PCI Stenting / CAD',
      currentMeds: ['Aspirin 75mg', 'Atorvastatin 20mg'],
    },
    {
      id: 'PID-2026-102',
      name: 'Amit Patel',
      age: 36,
      gender: 'Male',
      diagnosis: 'Exertional Tachycardia Evaluation',
      currentMeds: ['Metoprolol 25mg'],
    },
  ];

  const currentPatient =
    patientList.find((p) => p.id === selectedPatientId) || patientList[0];

  const patientAllergyData =
    mockPatientAllergies[selectedPatientId] || { knownAllergies: [] };

  const medicineCatalog = [
    {
      id: 'med_1',
      name: 'Telmisartan',
      defaultDosage: '40 mg',
      defaultFreq: 'Once daily (1-0-0)',
      defaultDuration: '30 days',
      defaultFood: 'After breakfast',
    },
    {
      id: 'med_3',
      name: 'Atorvastatin',
      defaultDosage: '10 mg',
      defaultFreq: 'Once daily (0-0-1)',
      defaultDuration: '30 days',
      defaultFood: 'After dinner',
    },
    {
      id: 'med_2',
      name: 'Metformin Hydrochloride',
      defaultDosage: '500 mg',
      defaultFreq: 'Twice daily (1-0-1)',
      defaultDuration: '60 days',
      defaultFood: 'With meals',
    },
    {
      id: 'med_4',
      name: 'Amlodipine',
      defaultDosage: '5 mg',
      defaultFreq: 'Once daily (1-0-0)',
      defaultDuration: '30 days',
      defaultFood: 'After breakfast',
    },
    {
      id: 'med_5',
      name: 'Amoxicillin', // Tests Allergy Warning (Patient allergic to Penicillin)
      defaultDosage: '500 mg',
      defaultFreq: 'Three times daily (1-1-1)',
      defaultDuration: '5 days',
      defaultFood: 'After food',
    },
    {
      id: 'med_6',
      name: 'Enalapril', // Tests Interaction Warning (ACE + ARB Dual Blockade)
      defaultDosage: '5 mg',
      defaultFreq: 'Once daily (1-0-0)',
      defaultDuration: '30 days',
      defaultFood: 'After food',
    },
  ];

  const [selectedMedName, setSelectedMedName] = useState(medicineCatalog[0].name);
  const [dosage, setDosage] = useState(medicineCatalog[0].defaultDosage);
  const [frequency, setFrequency] = useState(medicineCatalog[0].defaultFreq);
  const [duration, setDuration] = useState(medicineCatalog[0].defaultDuration);
  const [foodInstruction, setFoodInstruction] = useState(medicineCatalog[0].defaultFood);
  const [instructions, setInstructions] = useState('Take with a glass of water after food');
  const [followUpDate, setFollowUpDate] = useState('2026-10-25');

  const [prescriptionItems, setPrescriptionItems] = useState([
    {
      id: 'med_1',
      name: 'Telmisartan',
      dosage: '40 mg',
      frequency: 'Once daily (1-0-0)',
      duration: '30 days',
      mealRelation: 'After breakfast',
      instructions: 'Take after morning breakfast with water. Monitor BP weekly.',
    },
    {
      id: 'med_3',
      name: 'Atorvastatin',
      dosage: '10 mg',
      frequency: 'Once daily (0-0-1)',
      duration: '30 days',
      mealRelation: 'After dinner',
      instructions: 'Take at night after dinner. Avoid grapefruit juice.',
    },
  ]);

  const [doctorConfirmed, setDoctorConfirmed] = useState(false);
  const [issuedSuccess, setIssuedSuccess] = useState(false);

  // Handle medicine dropdown selection
  const handleMedicineChange = (e) => {
    const med = medicineCatalog.find((m) => m.name === e.target.value);
    if (med) {
      setSelectedMedName(med.name);
      setDosage(med.defaultDosage);
      setFrequency(med.defaultFreq);
      setDuration(med.defaultDuration);
      setFoodInstruction(med.defaultFood);
    }
  };

  // Add medicine to prescription order list
  const handleAddItem = (e) => {
    e.preventDefault();
    const newItem = {
      name: selectedMedName,
      dosage,
      frequency,
      duration,
      mealRelation: foodInstruction,
      instructions,
    };
    setPrescriptionItems([...prescriptionItems, newItem]);
    setDoctorConfirmed(false); // require re-confirmation on change
  };

  // Remove item
  const handleRemoveItem = (index) => {
    setPrescriptionItems(prescriptionItems.filter((_, idx) => idx !== index));
    setDoctorConfirmed(false);
  };

  // Real-time Pharmacovigilance Safety Engine Execution
  const safetyResult = runPrescriptionSafetyCheck({
    medicines: prescriptionItems,
    patientId: selectedPatientId,
  });

  // Issue prescription
  const handleIssuePrescription = () => {
    if (!doctorConfirmed) return;
    setIssuedSuccess(true);
    setTimeout(() => setIssuedSuccess(false), 5000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* 1. Page Header */}
      <PageHeader
        badge="Pharmacovigilance Suite"
        badgeStatus="Doctor Authority Enforced"
        title="Electronic Prescription Writer"
        subtitle="Clinical prescription authoring with real-time allergy cross-screening, duplicate detection, and drug interaction safety checks"
      />

      {/* 2. Patient Selector & Clinical Context Header Banner */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold shrink-0 border border-teal-200">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <label className="font-extrabold text-slate-700">Select Patient:</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => {
                    setSelectedPatientId(e.target.value);
                    setDoctorConfirmed(false);
                  }}
                  className="px-2.5 py-1 border border-slate-300 rounded-lg font-bold text-slate-900 bg-slate-50 cursor-pointer text-xs"
                >
                  {patientList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id} • {p.age}y/{p.gender})
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-slate-600 mt-1">
                Primary Condition: <strong>{currentPatient.diagnosis}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-950 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <div>
                <span className="font-bold block text-[10px] uppercase">Documented Allergies:</span>
                <span className="font-extrabold text-amber-900">
                  {patientAllergyData.knownAllergies.map((a) => a.allergen).join(', ') || 'None Documented'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form to Add Medicines (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card title="Add Molecule to Prescription" icon={Pill}>
            <form onSubmit={handleAddItem} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Select Pharmaceutical Molecule
                </label>
                <select
                  value={selectedMedName}
                  onChange={handleMedicineChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs font-semibold focus:border-teal-500 cursor-pointer"
                >
                  {medicineCatalog.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name} (Suggested: {m.defaultDosage})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-500 mt-0.5 block italic">
                  Tip: Select "Amoxicillin" to test allergy warning, or "Enalapril" to test ACE+ARB interaction.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Dosage</label>
                  <input
                    type="text"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="e.g. 40 mg"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Frequency</label>
                  <input
                    type="text"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    placeholder="e.g. Once daily (1-0-0)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Duration</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 30 days"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Food Timing</label>
                  <input
                    type="text"
                    value={foodInstruction}
                    onChange={(e) => setFoodInstruction(e.target.value)}
                    placeholder="e.g. After breakfast"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Patient Instructions</label>
                <input
                  type="text"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Take with a glass of water after food. Check BP weekly."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Recommended Follow-up Date</label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-medium cursor-pointer"
                />
              </div>

              <Button
                type="submit"
                variant="outline"
                size="sm"
                icon={Plus}
                className="w-full font-bold"
              >
                Add Molecule to Prescription
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Column: Pre-submission Safety Check & Confirmation (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card title="Prescription Order & Pre-submission Safety Review" icon={FileText}>
            <div className="space-y-4 text-xs">
              {/* Order Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">
                    Prescribed Items ({prescriptionItems.length})
                  </h4>
                  <span className="text-[11px] text-slate-500">Scheduled for e-signature</span>
                </div>

                {prescriptionItems.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-500 italic">
                    No medications added yet. Select a molecule from the left form to add to the order list.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {prescriptionItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-3 shadow-2xs"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded bg-teal-100 text-teal-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <h4 className="font-extrabold text-slate-950 text-sm">{item.name}</h4>
                            <span className="font-bold text-teal-900 bg-white px-2 py-0.2 rounded text-[11px] border border-teal-200">
                              {item.dosage}
                            </span>
                          </div>
                          <p className="text-slate-600 text-xs">
                            {item.frequency} • {item.duration} • <strong className="text-slate-800">{item.mealRelation}</strong>
                          </p>
                          <p className="text-slate-500 text-[11px] italic">{item.instructions}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors shrink-0"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* AUTOMATED PRE-SUBMISSION SAFETY REVIEW (Requirement 7 & 8) */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Automated Pharmacovigilance Screening:
                </span>
                <MedicineSafetyCheck safetyResult={safetyResult} showDetailedAlerts={true} />
              </div>

              {/* Doctor Authority Confirmation & E-Signature Checkbox (Requirement 7 & 8) */}
              <div className="p-4 bg-teal-50/70 border border-teal-300 rounded-2xl space-y-2.5 shadow-2xs">
                <div className="flex items-center gap-2 text-teal-900 font-extrabold text-xs">
                  <ShieldCheck className="w-4 h-4 text-teal-700" />
                  <span>Clinical Authority & Final Confirmation</span>
                </div>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={doctorConfirmed}
                    onChange={(e) => setDoctorConfirmed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-teal-600 rounded focus:ring-teal-500 cursor-pointer"
                  />
                  <div>
                    <p className="font-bold text-slate-900 text-xs">
                      I explicitly confirm and authorize this medication regimen.
                    </p>
                    <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                      I, Dr. Ananya Sen (MCI-45291), confirm that I have evaluated the clinical context, reviewed automated allergy and drug interaction warnings, and determined this prescription to be clinically indicated for this patient.
                    </p>
                  </div>
                </label>
              </div>

              {issuedSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-950 text-xs font-bold flex items-center gap-2 shadow-2xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>
                    ✓ Prescription successfully authenticated and committed to patient electronic health record (PID-2026-089).
                  </span>
                </div>
              )}

              {/* Confirmation / Submit Button */}
              <Button
                type="button"
                variant="primary"
                size="md"
                icon={Send}
                className="w-full font-extrabold text-sm py-3 cursor-pointer shadow-xs"
                disabled={!doctorConfirmed || prescriptionItems.length === 0}
                onClick={handleIssuePrescription}
              >
                Sign & Issue Prescription
              </Button>

              <p className="text-[10px] text-slate-400 text-center leading-relaxed italic">
                AI-assisted safety review — Doctor confirmation required. Doctor remains the final clinical authority.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
