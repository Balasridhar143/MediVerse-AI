import React from 'react';
import { mockDepartments } from '../../data/mockData';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import { Building2, Plus, Users, Calendar } from 'lucide-react';

export default function HospitalDepartments() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        badge="Clinical Divisions"
        badgeStatus="6 Active Units"
        title="Hospital Departments & Clinical Divisions"
        subtitle="Manage hospital wards, outpatient divisions, specialist staffing allocations, and daily patient load"
        action={
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => alert('Prototype action: Add Department modal')}
          >
            Add Department
          </Button>
        }
      />

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockDepartments.map((dept) => (
          <Card key={dept.name} className="flex flex-col justify-between hover:border-teal-400 transition-colors">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-teal-50 text-teal-700 rounded-lg border border-teal-200 shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm md:text-base">{dept.name}</h3>
                </div>
                <StatusBadge status={dept.availability} size="xs" />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs text-slate-600">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Clinicians Assigned:</span>
                  <strong className="text-slate-900">{dept.doctorsCount} Specialists</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Appointments Today:</span>
                  <strong className="text-teal-700">{dept.appointmentsToday} Bookings</strong>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500">Emergency Readiness:</span>
                  <span className="text-emerald-700 font-semibold">Active Standby</span>
                </div>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">NABH Standards Verified</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => alert(`Prototype action: Managing schedule for ${dept.name}`)}
              >
                Manage Staff
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
