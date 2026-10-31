import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { hospitalDataService } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import { Calendar, Search, Filter, Loader2, AlertCircle } from 'lucide-react';

export default function HospitalAppointments() {
  const [searchParams, setSearchParams] = useSearchParams();
  const targetAptId = searchParams.get('id') || searchParams.get('appointmentId');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [appointments, setAppointments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      hospitalDataService.getAppointments().catch(() => []),
      hospitalDataService.getDepartments().catch(() => []),
    ]).then(([apts, depts]) => {
      setAppointments(apts || []);
      if (Array.isArray(depts)) setDepartments(depts);
    }).finally(() => setLoading(false));
  }, []);

  const filteredAppointments = appointments.filter((apt) => {
    const s = searchTerm.toLowerCase();
    const matchesSearch =
      !s ||
      (apt.patientName && apt.patientName.toLowerCase().includes(s)) ||
      (apt.doctorName && apt.doctorName.toLowerCase().includes(s)) ||
      (apt.id && apt.id.toLowerCase().includes(s));
    const matchesDept = selectedDept === 'All' || apt.department === selectedDept;
    const matchesStatus = selectedStatus === 'All' || (apt.status || '').toUpperCase() === selectedStatus.toUpperCase();
    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        badge="Central Registry"
        badgeStatus="Hospital Master Ledger"
        title="Hospital Master Appointments Ledger"
        subtitle="Centralized operational schedule across all clinical departments, wards, and tele-suites"
        action={
          <div className="w-full sm:w-72 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ID, patient, doctor..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white focus:border-teal-500"
            />
          </div>
        }
      />

      {/* Target Appointment Missing / Unauthorized Alert Banner */}
      {targetAptId && !loading && !appointments.some((apt) => apt.id === targetAptId) && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Master Appointments Ledger Notice</p>
              <p className="mt-0.5 text-amber-800">
                Appointment #{targetAptId} was not found in the hospital master ledger or you may not have access.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const newParams = new URLSearchParams(searchParams);
              newParams.delete('id');
              newParams.delete('appointmentId');
              setSearchParams(newParams, { replace: true });
            }}
            className="text-amber-700 hover:text-amber-900 font-bold text-xs p-1 cursor-pointer"
            title="Dismiss notice"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 text-xs bg-white p-3 border border-slate-200 rounded-xl">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-medium">Department:</span>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs"
          >
            <option value="All">All Departments</option>
            {departments.map((d) => (
              <option key={d.id || d.name} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-medium">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs"
          >
            <option value="All">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        <div className="ml-auto text-slate-500 font-medium">
          Showing <strong>{filteredAppointments.length}</strong> matching entries
        </div>
      </div>

      {/* Master Appointments Table */}
      <Card title="Appointment Ledger Entries" icon={Calendar}>
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-600 mb-2" />
            Loading master appointments ledger...
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No appointments found matching your query.
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 md:-mx-5">
            <div className="inline-block min-w-full align-middle px-4 md:px-5">
              <table className="min-w-full text-left text-xs text-slate-700 divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-3">Appointment ID</th>
                    <th className="py-3 px-3">Patient Name</th>
                    <th className="py-3 px-3">Physician</th>
                    <th className="py-3 px-3">Department</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Time Slot</th>
                    <th className="py-3 px-3">Mode</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredAppointments.map((apt) => {
                    const isTargeted = targetAptId === apt.id;
                    return (
                      <tr
                        key={apt.id}
                        id={`hosp-apt-${apt.id}`}
                        className={`transition-colors ${
                          isTargeted
                            ? 'bg-teal-50/80 font-semibold border-l-4 border-l-teal-600'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="py-3 px-3 font-semibold text-teal-700 whitespace-nowrap">
                          {apt.id}
                          {isTargeted && (
                            <span className="ml-1.5 text-[9px] bg-teal-600 text-white font-bold px-1.5 py-0.5 rounded">
                              Target
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">{apt.patientName}</td>
                        <td className="py-3 px-3 whitespace-nowrap">{apt.doctorName}</td>
                        <td className="py-3 px-3 whitespace-nowrap">{apt.department}</td>
                        <td className="py-3 px-3 whitespace-nowrap">{apt.date}</td>
                        <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-800">{apt.time}</td>
                        <td className="py-3 px-3 whitespace-nowrap">{apt.type}</td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <StatusBadge status={apt.status} size="xs" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
