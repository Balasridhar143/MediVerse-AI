import React, { useState, useEffect } from 'react';
import { hospitalDataService } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import AdminPasswordModal from '../../components/AdminPasswordModal';
import {
  Users,
  Search,
  Filter,
  Loader2,
  ShieldCheck,
  Lock,
  Eye,
  AlertCircle,
  X,
  Phone,
  Mail,
  MapPin,
  HeartPulse,
  Clock,
} from 'lucide-react';

export default function HospitalPatients() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sensitive Dossier State
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [sensitivePatient, setSensitivePatient] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [fetchingSensitive, setFetchingSensitive] = useState(false);
  const [sensitiveError, setSensitiveError] = useState(null);

  useEffect(() => {
    hospitalDataService.getPatients()
      .then((data) => setPatients(data || []))
      .catch((err) => console.error('Failed to fetch hospital patients:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleRequestSensitive = async (patientId) => {
    setSelectedPatientId(patientId);
    const savedToken = sessionStorage.getItem('mediverse_admin_reauth_token');
    if (savedToken) {
      await fetchSensitiveData(patientId, savedToken);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const fetchSensitiveData = async (patientId, token) => {
    setFetchingSensitive(true);
    setSensitiveError(null);
    try {
      const res = await hospitalDataService.getPatientSensitive(patientId, { reauthToken: token });
      if (res && res.patient) {
        setSensitivePatient(res.patient);
      } else {
        setSensitiveError('No patient record details returned.');
      }
    } catch (err) {
      console.warn('Sensitive fetch error:', err);
      if (err.response?.status === 403 || err.response?.status === 401) {
        sessionStorage.removeItem('mediverse_admin_reauth_token');
        setIsAuthModalOpen(true);
      } else {
        setSensitiveError(err.response?.data?.detail || 'Failed to retrieve sensitive dossier.');
      }
    } finally {
      setFetchingSensitive(false);
    }
  };

  const handleAuthSuccess = async (token) => {
    setIsAuthModalOpen(false);
    if (selectedPatientId) {
      await fetchSensitiveData(selectedPatientId, token);
    }
  };

  const filteredPatients = patients.filter((p) => {
    const s = searchTerm.toLowerCase();
    const matchesSearch =
      !s ||
      (p.patientName && p.patientName.toLowerCase().includes(s)) ||
      (p.patientId && p.patientId.toLowerCase().includes(s)) ||
      (p.primaryCondition && p.primaryCondition.toLowerCase().includes(s));
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        badge="Patient Registry"
        badgeStatus={`${patients.length} Live Database Records`}
        title="Central Hospital Patient Registry"
        subtitle="Master demographic and clinical admissions ledger for all registered patients"
        action={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="w-full sm:w-64 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search patient, ID, condition..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white focus:border-teal-500"
              />
            </div>
          </div>
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-500 font-medium shrink-0 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Status:
        </span>
        {['All', 'Active Care', 'Outpatient Care', 'Admitted'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-lg border font-medium whitespace-nowrap transition-colors cursor-pointer ${
              statusFilter === status
                ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Patients Table */}
      <Card title="Admitted & Registered Patient Directory" icon={Users}>
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-600 mb-2" />
            Loading registered patients...
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No registered patients found matching your query.
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
                    <th className="py-3 px-3">Blood Group</th>
                    <th className="py-3 px-3">Clinical Status</th>
                    <th className="py-3 px-3">Assigned Physician</th>
                    <th className="py-3 px-3">Admission Status</th>
                    <th className="py-3 px-3 text-right">Confidential File</th>
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
                      <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-700">
                        {p.bloodGroup}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800">
                        {p.primaryCondition}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                        {p.assignedDoctor}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <StatusBadge status={p.status} size="xs" />
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-right">
                        <button
                          type="button"
                          onClick={() => handleRequestSensitive(p.patientId)}
                          disabled={fetchingSensitive && selectedPatientId === p.patientId}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 hover:border-teal-300 rounded-lg font-medium text-[11px] transition-colors cursor-pointer"
                        >
                          {fetchingSensitive && selectedPatientId === p.patientId ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-teal-600" />
                          )}
                          <span>View Dossier</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

      {/* Admin Security Password Re-authentication Modal */}
      <AdminPasswordModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        title="Admin Authorization Required"
        purpose="Accessing confidential patient demographic, contact, and allergy dossier"
      />

      {/* Sensitive Patient Dossier Drawer / Modal */}
      {sensitivePatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-600 text-white shadow-xs">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-900 text-base">{sensitivePatient.full_name}</h3>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono font-bold px-2 py-0.5 rounded">
                      Audited Record
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Patient ID: #{sensitivePatient.id} • ABHA / National Health ID: {sensitivePatient.government_id_masked}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSensitivePatient(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dossier Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
              {/* Demographics & Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider block">Demographics</span>
                  <div className="flex justify-between"><span>Age / Gender:</span> <b>{sensitivePatient.age} years / {sensitivePatient.gender}</b></div>
                  <div className="flex justify-between"><span>Blood Group:</span> <b className="text-rose-700">{sensitivePatient.blood_group}</b></div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider block">Contact Details</span>
                  <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-teal-600" /> <span>{sensitivePatient.phone_number}</span></div>
                  <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-teal-600" /> <span>{sensitivePatient.email}</span></div>
                  <div className="flex items-center gap-1.5 text-slate-600"><MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" /> <span className="truncate">{sensitivePatient.full_address}</span></div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="p-3.5 bg-rose-50/60 border border-rose-200 rounded-xl">
                <span className="font-bold text-rose-950 uppercase text-[10px] tracking-wider block mb-1">
                  Designated Emergency Next of Kin
                </span>
                <div className="flex items-center justify-between text-rose-900">
                  <span className="font-semibold">{sensitivePatient.emergency_contact_name}</span>
                  <span className="font-mono font-bold">{sensitivePatient.emergency_contact_phone}</span>
                </div>
              </div>

              {/* Documented Allergies */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <HeartPulse className="w-4 h-4 text-teal-600" /> Verified Clinical Allergies
                  </span>
                  <span className="text-[10px] font-mono font-semibold text-slate-500">
                    Status: {sensitivePatient.allergy_status}
                  </span>
                </div>

                {sensitivePatient.documented_allergies && sensitivePatient.documented_allergies.length > 0 ? (
                  <div className="space-y-2">
                    {sensitivePatient.documented_allergies.map((alg, idx) => (
                      <div key={idx} className="p-3 bg-rose-50/80 border border-rose-200 rounded-xl flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-rose-950 text-xs">{alg.allergen}</strong>
                            <span className="px-2 py-0.5 bg-rose-200 text-rose-900 rounded text-[10px] font-bold">
                              {alg.severity}
                            </span>
                          </div>
                          <p className="text-[11px] text-rose-800 mt-0.5">Reaction: {alg.reaction || 'Anaphylaxis / Clinical reaction'}</p>
                          {alg.notes && <p className="text-[10px] text-slate-500 mt-1 italic">Note: {alg.notes}</p>}
                        </div>
                        <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold shrink-0">
                          {alg.verification_status || 'CONFIRMED'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-center">
                    {sensitivePatient.allergy_status === 'CONFIRMED_NKDA'
                      ? 'Patient confirmed No Known Drug Allergies (NKDA).'
                      : 'No structured drug allergies currently documented for this patient.'}
                  </div>
                )}
              </div>

              {/* Medical History & Chronic Conditions */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="font-bold text-slate-800 text-[11px] block">Chronic Conditions & Diagnostic History</span>
                <p className="text-slate-600 text-xs leading-relaxed">{sensitivePatient.chronic_conditions}</p>
                <p className="text-slate-500 text-[11px] pt-1">{sensitivePatient.medical_history}</p>
              </div>

              {/* Institutional Audit Stamp */}
              <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between text-[11px] text-teal-900">
                <span className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-4 h-4 text-teal-600" /> Institutionally Audited Privileged Access
                </span>
                <span className="font-mono text-[10px] text-teal-700">Audit ID: #LOG-{Date.now().toString().slice(-6)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <Button variant="primary" size="sm" onClick={() => setSensitivePatient(null)}>
                Close Dossier
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
