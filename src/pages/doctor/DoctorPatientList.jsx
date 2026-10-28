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
} from 'lucide-react';

export default function DoctorPatientList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    doctorService.getDoctorPatients()
      .then((data) => setPatients(data || []))
      .catch((err) => console.error('Failed to fetch doctor patients:', err))
      .finally(() => setLoading(false));
  }, []);

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
    </div>
  );
}
