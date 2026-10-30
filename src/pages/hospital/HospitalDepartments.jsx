import React, { useState, useEffect } from 'react';
import { hospitalDataService } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import { Building2, Plus, Users, Calendar, Loader2, Bed, Stethoscope } from 'lucide-react';

export default function HospitalDepartments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hospitalDataService.getDepartments()
      .then((data) => {
        if (Array.isArray(data)) setDepartments(data);
      })
      .catch((err) => console.error('Failed to load departments:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        badge="Clinical Divisions"
        badgeStatus={`${departments.length} Verified Units`}
        title="Hospital Departments & Clinical Divisions"
        subtitle="Manage hospital wards, outpatient divisions, specialist staffing allocations, and daily patient load"
        action={
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => alert('New clinical unit provisioning is managed by Hospital Administrative Board.')}
          >
            Add Department
          </Button>
        }
      />

      {loading ? (
        <Card className="p-12 text-center text-slate-500">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
          <p className="font-semibold text-slate-700">Loading Clinical Department Registry...</p>
        </Card>
      ) : departments.length === 0 ? (
        <Card className="p-10 text-center text-slate-500">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="font-semibold text-slate-700">No departments found.</p>
        </Card>
      ) : (
        /* Departments Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <Card key={dept.id || dept.name} className="flex flex-col justify-between hover:border-teal-400 transition-colors">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-teal-50 text-teal-700 rounded-lg border border-teal-200 shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm md:text-base">{dept.name}</h3>
                      <p className="text-[11px] text-slate-400 font-mono">Code: {dept.code || 'DEPT'}</p>
                    </div>
                  </div>
                  <StatusBadge status={dept.status || 'ACTIVE'} size="xs" />
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Stethoscope className="w-3.5 h-3.5 text-teal-600" /> Registered Doctors:
                    </span>
                    <strong className="text-slate-900">
                      {dept.registeredDoctors || 0} Clinicians
                      {dept.activeDoctors > 0 && (
                        <span className="ml-1 text-[11px] text-emerald-700 font-normal">
                          ({dept.activeDoctors} On Duty)
                        </span>
                      )}
                    </strong>
                  </div>

                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Verified Specialists:</span>
                    <span className={`font-semibold ${dept.verifiedDoctors > 0 ? 'text-teal-700' : 'text-slate-400'}`}>
                      {dept.verifiedDoctors || 0} Verified
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-teal-600" /> Registered Patients:
                    </span>
                    <strong className="text-slate-800">{dept.registeredPatients || 0} Patients</strong>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-teal-600" /> Total Consultations:
                    </span>
                    <strong className="text-teal-700">{dept.totalAppointments || 0} Bookings</strong>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-200/60 text-[11px]">
                    <div className="bg-white p-1.5 rounded border border-slate-200 text-center">
                      <span className="text-slate-400 block text-[10px]">Completed</span>
                      <strong className="text-emerald-700">{dept.completedAppointments || 0}</strong>
                    </div>
                    <div className="bg-white p-1.5 rounded border border-slate-200 text-center">
                      <span className="text-slate-400 block text-[10px]">Pending</span>
                      <strong className="text-amber-700">{dept.pendingAppointments || 0}</strong>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Bed className="w-3.5 h-3.5 text-teal-600" /> Ward Capacity:
                    </span>
                    <strong className="text-slate-800">{dept.bedCount || 0} Beds</strong>
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500">Department Head:</span>
                    <span className="text-slate-800 font-semibold truncate max-w-[150px]">{dept.headDoctor || 'Attending Head'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">NABH Clinical Standard</span>
                <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  24x7 Active
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
