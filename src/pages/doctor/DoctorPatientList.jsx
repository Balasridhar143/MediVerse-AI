import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { doctorService } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import {
  Users,
  Search,
  BrainCircuit,
  FileText,
  Activity,
  Loader2,
  FileCheck2,
  AlertTriangle,
  X,
  ShieldCheck,
  Calendar,
  Pill,
  HeartPulse,
} from 'lucide-react';

export default function DoctorPatientList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Clinical Dossier Modal State (Doctor authorized access)
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [dossierLoading, setDossierLoading] = useState(false);
  const [dossierError, setDossierError] = useState(null);
  const [selectedDossier, setSelectedDossier] = useState(null);

  useEffect(() => {
    doctorService.getDoctorPatients()
      .then((data) => setPatients(data || []))
      .catch((err) => console.error('Failed to fetch doctor patients:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleOpenDossier = async (patientId) => {
    setIsDossierOpen(true);
    setDossierLoading(true);
    setDossierError(null);
    setSelectedDossier(null);

    try {
      const data = await doctorService.getPatientClinicalDossier(patientId);
      if (data && data.patient) {
        setSelectedDossier(data.patient);
      } else {
        setDossierError('Patient clinical records could not be retrieved.');
      }
    } catch (err) {
      console.warn('Dossier fetch error:', err);
      setDossierError(err.response?.data?.detail || 'Access denied: Physician does not have an active clinical relationship or appointment with this patient.');
    } finally {
      setDossierLoading(false);
    }
  };

  const filteredPatients = patients.filter(
    (p) =>
      (p.patientName && p.patientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.patientId && p.patientId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.primaryCondition && p.primaryCondition.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        badge="Clinician Panel"
        badgeStatus="Under Clinical Care"
        title="Assigned Patients Directory"
        subtitle="Active outpatients, chronic disease cohorts, and longitudinal records under your supervision"
        action={
          <div className="w-full sm:w-72 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, ID, condition..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white focus:border-teal-500"
            />
          </div>
        }
      />

      {/* Patient Table with Responsive Wrapper */}
      <Card title="Patient Roster" icon={Users}>
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-600 mb-2" />
            Loading assigned patient records...
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No patients found matching your query. Patients who book consultations with you will appear in this roster.
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 md:-mx-5">
            <div className="inline-block min-w-full align-middle px-4 md:px-5">
              <table className="min-w-full text-left text-xs text-slate-700 divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-3">Patient ID</th>
                    <th className="py-3 px-3">Patient Name</th>
                    <th className="py-3 px-3">Age / Gender</th>
                    <th className="py-3 px-3">Primary Diagnosis / Reason</th>
                    <th className="py-3 px-3">Last Consultation</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredPatients.map((p) => (
                    <tr key={p.patientId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-semibold text-teal-700 whitespace-nowrap">
                        {p.patientId}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                        {p.patientName}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {p.age}y / {p.gender}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800">
                        {p.primaryCondition}
                      </td>
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {p.lastConsultation}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <StatusBadge status={p.status} size="xs" />
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenDossier(p.patientId)}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-300 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                            title="View Complete Clinical File"
                          >
                            <FileCheck2 className="w-3.5 h-3.5" />
                            <span>Dossier</span>
                          </button>
                          <Link to="/doctor/clinical-context">
                            <button
                              className="px-2.5 py-1 text-xs font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 rounded border border-teal-200 transition-colors cursor-pointer"
                              title="Clinical Context"
                            >
                              Context
                            </button>
                          </Link>
                          <Link to="/doctor/prescriptions">
                            <button
                              className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors cursor-pointer"
                              title="Prescribe"
                            >
                              Prescribe
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

      {/* Physician Clinical Dossier Modal */}
      {isDossierOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[88vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Patient Clinical Dossier
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Verified Physician Authorization • HIPAA & NABH Audited Record Access
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDossierOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {dossierLoading ? (
                <div className="py-12 text-center text-slate-500">
                  <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">Verifying Clinical Relationship & Decrypting Records...</p>
                  <span className="text-[11px] text-slate-400">Verifying scheduled appointment or active care consent</span>
                </div>
              ) : dossierError ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-rose-800 font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Access Restricted</span>
                  </div>
                  <p className="text-rose-700 leading-relaxed">{dossierError}</p>
                </div>
              ) : selectedDossier ? (
                <div className="space-y-4">
                  {/* Demographics Summary */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-700">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Full Name</span>
                      <strong className="text-slate-900 text-sm">{selectedDossier.full_name}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Age / Gender</span>
                      <strong className="text-slate-900">{selectedDossier.age}y / {selectedDossier.gender}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Blood Group</span>
                      <span className="inline-block px-2 py-0.5 rounded bg-rose-50 text-rose-800 font-bold border border-rose-200 text-xs">
                        {selectedDossier.blood_group}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Emergency Contact</span>
                      <p className="text-slate-900 font-medium truncate">{selectedDossier.emergency_contact_name || 'Relative'}</p>
                      <p className="text-[11px] text-slate-500">{selectedDossier.emergency_contact_phone || 'Unlisted'}</p>
                    </div>
                  </div>

                  {/* Documented Allergies */}
                  <div className="border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        Documented Allergies
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        Status: {selectedDossier.allergy_status || 'DOCUMENTED'}
                      </span>
                    </div>

                    {!selectedDossier.documented_allergies || selectedDossier.documented_allergies.length === 0 ? (
                      <p className="text-slate-500 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        No known drug or environmental allergies recorded.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {selectedDossier.documented_allergies.map((al, idx) => (
                          <div
                            key={idx}
                            className="p-2 bg-rose-50/50 border border-rose-200 rounded-lg flex items-center justify-between text-xs"
                          >
                            <div>
                              <strong className="text-rose-950 font-bold">{al.allergen}</strong>
                              <span className="text-slate-500 ml-1.5">({al.category})</span>
                              {al.reaction && (
                                <p className="text-[11px] text-slate-600">Reaction: {al.reaction}</p>
                              )}
                            </div>
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-100 text-rose-800 uppercase">
                              {al.severity} Severity
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Chronic Conditions & Past History */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <span className="font-bold text-slate-900 text-xs block">Chronic Conditions</span>
                      <p className="text-slate-600 text-xs">{selectedDossier.chronic_conditions || 'None Documented'}</p>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <span className="font-bold text-slate-900 text-xs block">Medical History</span>
                      <p className="text-slate-600 text-xs">{selectedDossier.medical_history || 'No adverse surgical or chronic history recorded.'}</p>
                    </div>
                  </div>

                  {/* Medical Reports */}
                  <div className="border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-teal-600" />
                      Uploaded Diagnostic Reports ({selectedDossier.medical_reports?.length || 0})
                    </span>
                    {!selectedDossier.medical_reports || selectedDossier.medical_reports.length === 0 ? (
                      <p className="text-slate-500 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        No laboratory reports uploaded yet.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {selectedDossier.medical_reports.map((rep) => (
                          <div key={rep.id} className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                            <div>
                              <strong className="text-slate-900">{rep.title}</strong>
                              <p className="text-[11px] text-slate-500">{rep.report_type} • {rep.created_at ? new Date(rep.created_at).toLocaleDateString() : ''}</p>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                              Verified Lab
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Access logged to system audit trail
              </span>
              <Button variant="secondary" size="sm" onClick={() => setIsDossierOpen(false)}>
                Close Dossier
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
