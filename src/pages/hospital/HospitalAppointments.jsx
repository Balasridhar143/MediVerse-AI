import React, { useState } from 'react';
import { mockHospitalAppointments, mockDepartments } from '../../data/mockData';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import { Calendar, Search, Filter } from 'lucide-react';

export default function HospitalAppointments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const filteredAppointments = mockHospitalAppointments.filter((apt) => {
    const matchesSearch =
      apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'All' || apt.department === selectedDept;
    const matchesStatus = selectedStatus === 'All' || apt.status === selectedStatus;
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
            {mockDepartments.map((d) => (
              <option key={d.name} value={d.name}>
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
            <option value="Upcoming">Upcoming</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <div className="ml-auto text-slate-500 font-medium">
          Showing <strong>{filteredAppointments.length}</strong> matching entries
        </div>
      </div>

      {/* Master Appointments Table */}
      <Card title="Appointment Ledger Entries" icon={Calendar}>
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
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredAppointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-semibold text-teal-700 whitespace-nowrap">{apt.id}</td>
                    <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">{apt.patientName}</td>
                    <td className="py-3 px-3 whitespace-nowrap">{apt.doctorName}</td>
                    <td className="py-3 px-3 whitespace-nowrap">{apt.department}</td>
                    <td className="py-3 px-3 whitespace-nowrap">{apt.date}</td>
                    <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-800">{apt.time}</td>
                    <td className="py-3 px-3 whitespace-nowrap">{apt.type}</td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <StatusBadge status={apt.status} size="xs" />
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => alert(`Prototype action: Managing schedule entry ${apt.id}`)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors cursor-pointer"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}
