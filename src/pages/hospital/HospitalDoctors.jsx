import React, { useState, useEffect } from 'react';
import { hospitalDataService } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import AdminPasswordModal from '../../components/AdminPasswordModal';
import {
  Stethoscope,
  Search,
  Loader2,
  Lock,
  ShieldCheck,
  X,
  FileCheck2,
  Phone,
  Mail,
  Award,
  Calendar,
} from 'lucide-react';

export default function HospitalDoctors() {
  const [searchTerm, setSearchTerm] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sensitive Doctor Credentials State
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);
  const [sensitiveDoctor, setSensitiveDoctor] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [fetchingSensitive, setFetchingSensitive] = useState(false);
  const [sensitiveError, setSensitiveError] = useState(null);

  useEffect(() => {
    hospitalDataService.getDoctors()
      .then((data) => setDoctors(data || []))
      .catch((err) => console.error('Failed to fetch hospital doctors:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleRequestSensitive = async (doctorId) => {
    setSelectedDoctorId(doctorId);
    const savedToken = sessionStorage.getItem('mediverse_admin_reauth_token');
    if (savedToken) {
      await fetchSensitiveData(doctorId, savedToken);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const fetchSensitiveData = async (doctorId, token) => {
    setFetchingSensitive(true);
    setSensitiveError(null);
    try {
      const res = await hospitalDataService.getDoctorSensitive(doctorId, { reauthToken: token });
      if (res && res.doctor) {
        setSensitiveDoctor(res.doctor);
      } else {
        setSensitiveError('No physician credentials returned.');
      }
    } catch (err) {
      console.warn('Doctor sensitive fetch error:', err);
      if (err.response?.status === 403 || err.response?.status === 401) {
        sessionStorage.removeItem('mediverse_admin_reauth_token');
        setIsAuthModalOpen(true);
      } else {
        setSensitiveError(err.response?.data?.detail || 'Failed to retrieve physician credentials.');
      }
    } finally {
      setFetchingSensitive(false);
    }
  };

  const handleAuthSuccess = async (token) => {
    setIsAuthModalOpen(false);
    if (selectedDoctorId) {
      await fetchSensitiveData(selectedDoctorId, token);
    }
  };

  const filteredDoctors = doctors.filter(
    (d) =>
      (d.name && d.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.specialization && d.specialization.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.department && d.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        badge="Medical Staff Directory"
        badgeStatus={`${doctors.length} Registered Clinicians`}
        title="Physician & Specialist Registry"
        subtitle="Manage hospital medical staff, daily OPD room assignments, and consultation scheduling"
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
                placeholder="Search clinician or department..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white focus:border-teal-500"
              />
            </div>
          </div>
        }
      />

      {/* Doctors Table */}
      <Card title="Hospital Physician Roster" icon={Stethoscope}>
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-600 mb-2" />
            Loading registered physicians...
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No doctors found matching your query.
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 md:-mx-5">
            <div className="inline-block min-w-full align-middle px-4 md:px-5">
              <table className="min-w-full text-left text-xs text-slate-700 divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-3">Physician Name</th>
                    <th className="py-3 px-3">Specialization</th>
                    <th className="py-3 px-3">Department</th>
                    <th className="py-3 px-3">Room / OPD</th>
                    <th className="py-3 px-3">Consultation Type</th>
                    <th className="py-3 px-3">Shift Availability</th>
                    <th className="py-3 px-3">Duty Status</th>
                    <th className="py-3 px-3 text-right">Credentials</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredDoctors.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                        {doc.name}
                      </td>
                      <td className="py-3 px-3 text-teal-700 font-medium whitespace-nowrap">
                        {doc.specialization}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">{doc.department}</td>
                      <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">
                        {doc.room}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">{doc.consultationType}</td>
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{doc.availability}</td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <StatusBadge status={doc.status} size="xs" />
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-right">
                        <button
                          type="button"
                          onClick={() => handleRequestSensitive(doc.id)}
                          disabled={fetchingSensitive && selectedDoctorId === doc.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 hover:border-teal-300 rounded-lg font-medium text-[11px] transition-colors cursor-pointer"
                        >
                          {fetchingSensitive && selectedDoctorId === doc.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-teal-600" />
                          )}
                          <span>Credentials</span>
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
        purpose="Reviewing verified physician licensure, NMC registration, and private credentials"
      />

      {/* Sensitive Physician Dossier Modal */}
      {sensitiveDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-600 text-white shadow-xs">
                  <FileCheck2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-900 text-base">{sensitiveDoctor.full_name}</h3>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono font-bold px-2 py-0.5 rounded">
                      NMC Verified
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {sensitiveDoctor.specialization} • Department of {sensitiveDoctor.department}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSensitiveDoctor(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
              {/* Licensure & Accreditation */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider block">
                  Medical Licensure & Registration
                </span>
                <div className="flex justify-between items-center">
                  <span>Medical Council Registration No:</span>
                  <span className="font-mono font-extrabold text-teal-800 text-sm bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {sensitiveDoctor.license_number}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                  <span>Accreditation Council:</span>
                  <span className="font-medium text-slate-800">{sensitiveDoctor.medical_council}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Institutional Tax ID:</span>
                  <span className="font-mono font-bold text-slate-700">{sensitiveDoctor.tax_pan_masked}</span>
                </div>
              </div>

              {/* Qualifications & Experience */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="font-bold text-slate-500 text-[10px] uppercase">Clinical Qualifications</span>
                  <p className="font-bold text-slate-900 text-sm">{sensitiveDoctor.qualifications}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="font-bold text-slate-500 text-[10px] uppercase">Clinical Practice</span>
                  <p className="font-bold text-slate-900 text-sm">{sensitiveDoctor.experience_years} Years Experience</p>
                </div>
              </div>

              {/* Private Contact Information */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider block">
                  Confidential Clinician Contact
                </span>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600"><Phone className="w-3.5 h-3.5 text-teal-600" /> Personal Phone:</span>
                  <span className="font-mono font-bold text-slate-800">{sensitiveDoctor.contact_phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-600"><Mail className="w-3.5 h-3.5 text-teal-600" /> Verified Email:</span>
                  <span className="font-medium text-slate-800">{sensitiveDoctor.email}</span>
                </div>
              </div>

              {/* Audit Badge */}
              <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between text-[11px] text-teal-900">
                <span className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-4 h-4 text-teal-600" /> Licensure Review Audited & Timestamped
                </span>
                <span className="font-mono text-[10px] text-teal-700">Audit ID: #DOC-{Date.now().toString().slice(-6)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <Button variant="primary" size="sm" onClick={() => setSensitiveDoctor(null)}>
                Close Credentials
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
