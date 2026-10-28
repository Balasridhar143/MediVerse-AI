import React, { useState } from 'react';
import { mockDoctors } from '../../data/mockData';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import { Stethoscope, Search, Plus, Calendar } from 'lucide-react';

export default function HospitalDoctors() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDoctors = mockDoctors.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        badge="Medical Staff Directory"
        badgeStatus="Hospital Medical Board"
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
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => alert('Prototype action: Onboard Physician')}
            >
              Onboard Doctor
            </Button>
          </div>
        }
      />

      {/* Doctors Table */}
      <Card title="Hospital Physician Roster" icon={Stethoscope}>
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
                  <th className="py-3 px-3 text-right">Action</th>
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
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => alert(`Prototype action: Viewing shift schedule for ${doc.name}`)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors cursor-pointer"
                      >
                        Schedule
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
