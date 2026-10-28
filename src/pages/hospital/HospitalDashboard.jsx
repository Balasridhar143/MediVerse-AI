import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { hospitalDataService } from '../../services/api';
import { mockDepartments, mockEmergencyCases } from '../../data/mockData';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import {
  Building2,
  Users,
  Calendar,
  Siren,
  ChevronRight,
  Stethoscope,
  Bed,
  Plus,
  Loader2,
} from 'lucide-react';

export default function HospitalDashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    doctors_count: 0,
    appointments_count: 0,
    registrations_count: 0,
    recent_appointments: [],
  });
  const [doctorsList, setDoctorsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      hospitalDataService.getDashboardData().catch(() => null),
      hospitalDataService.getDoctors().catch(() => []),
    ]).then(([dash, docs]) => {
      if (dash) setDashboardData(dash);
      if (docs) setDoctorsList(docs);
    }).finally(() => setLoading(false));
  }, []);

  const hospitalTitle = user?.hospital_name || user?.hospitalName || 'City Care Multispeciality Hospital';
  const facilityCode = user?.facility_id || user?.facilityId || 'NABH-2026-09';

  return (
    <div className="space-y-6">
      {/* 1. Hospital Overview Header */}
      <PageHeader
        badge="Hospital Administration"
        badgeStatus="NABH Accredited"
        title={hospitalTitle}
        subtitle={`Facility ID: ${facilityCode} • Central Campus, Sector 4, Tech Zone • 24x7 Emergency Active`}
        action={
          <>
            <Link to="/hospital/emergency-cases">
              <Button variant="dangerOutline" size="sm" icon={Siren}>
                Emergency Trauma Unit
              </Button>
            </Link>
            <Link to="/hospital/appointments">
              <Button variant="primary" size="sm" icon={Calendar}>
                Master Appointments
              </Button>
            </Link>
          </>
        }
      />

      {/* 2. Department Summary */}
      <Card
        title="Clinical Department Summary"
        subtitle="Current staffing, patient capacity, and active appointments across clinical units"
        icon={Building2}
        action={
          <Link
            to="/hospital/departments"
            className="text-xs font-semibold text-teal-700 hover:underline flex items-center gap-1"
          >
            All Departments <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {mockDepartments.map((dept) => (
            <div
              key={dept.name}
              className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-xs"
            >
              <h4 className="font-bold text-slate-900 truncate">{dept.name}</h4>
              <p className="text-slate-500 text-[11px]">{dept.doctorsCount} Clinicians</p>
              <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-teal-700">{dept.appointmentsToday} Today</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 3. Today's Appointments Overview */}
      <Card
        title="Recent Appointments Ledger"
        subtitle="Centralized patient consultation schedule recorded in facility registry"
        icon={Calendar}
        action={
          <Link
            to="/hospital/appointments"
            className="text-xs font-semibold text-teal-700 hover:underline flex items-center gap-1"
          >
            Master Ledger <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        }
      >
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-6 h-6 text-teal-600 animate-spin mx-auto" />
            <span className="text-xs text-slate-500 mt-2 block">Loading appointments...</span>
          </div>
        ) : dashboardData.recent_appointments.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg">
            No consultations recorded yet. Patient bookings will populate the master ledger automatically.
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 md:-mx-5">
            <div className="inline-block min-w-full align-middle px-4 md:px-5">
              <table className="min-w-full text-left text-xs text-slate-700 divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Appointment ID</th>
                    <th className="py-2.5 px-3">Patient</th>
                    <th className="py-2.5 px-3">Doctor</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Scheduled Time</th>
                    <th className="py-2.5 px-3">Mode</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {dashboardData.recent_appointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-semibold text-teal-700 whitespace-nowrap">{apt.id}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">{apt.patientName}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">{apt.doctorName}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">{apt.department}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">{apt.date} • {apt.time}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">{apt.type}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <StatusBadge status={apt.status} size="xs" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

      {/* 4. Doctor Availability & 5. Emergency Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 4. Doctor Availability */}
        <Card
          title="Physician On-Duty Roster"
          subtitle="Real-time clinical presence and active consultation status"
          icon={Stethoscope}
          action={
            <Link
              to="/hospital/doctors"
              className="text-xs font-semibold text-teal-700 hover:underline flex items-center gap-1"
            >
              Doctor Directory <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          {loading ? (
            <div className="p-6 text-center text-xs text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-teal-600 mb-1" />
              Loading medical staff...
            </div>
          ) : doctorsList.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg">
              No registered physicians found in hospital scope.
            </div>
          ) : (
            <div className="space-y-2.5 text-xs">
              {doctorsList.slice(0, 4).map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="font-bold text-slate-900">{doc.name}</h4>
                    <p className="text-slate-500 text-[11px]">
                      {doc.specialization} • {doc.department} • Room: <strong>{doc.room}</strong>
                    </p>
                  </div>
                  <StatusBadge status={doc.status} size="xs" />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 5. Emergency Status */}
        <Card
          title="Emergency Trauma Care Status"
          subtitle="Real-time admissions and critical unit assignments"
          icon={Siren}
          action={
            <Link
              to="/hospital/emergency-cases"
              className="text-xs font-semibold text-rose-700 hover:underline flex items-center gap-1"
            >
              Active Trauma Bay <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <div className="space-y-2.5 text-xs">
            {mockEmergencyCases.map((emg) => (
              <div
                key={emg.id}
                className="p-3 bg-rose-50/50 border border-rose-200 rounded-lg space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-rose-900">{emg.patientName}</span>
                    <span className="text-[11px] text-slate-500">({emg.age}y/{emg.gender})</span>
                  </div>
                  <StatusBadge status={emg.triageLevel} size="xs" />
                </div>
                <p className="text-slate-700 font-medium">{emg.condition}</p>
                <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1 border-t border-rose-200/60">
                  <span>Unit: <strong className="text-slate-900">{emg.unit}</strong></span>
                  <span>Attending: <strong>{emg.attendingDoctor}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 6. Key Hospital Operational Metrics */}
      <Card title="Key Hospital Operations Metrics" icon={Bed}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <span className="text-slate-500 block mb-1">Total Inpatient Beds</span>
            <p className="text-xl font-bold text-slate-900">250</p>
            <span className="text-[11px] text-teal-700 font-medium">84% Occupancy</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <span className="text-slate-500 block mb-1">ICU Capacity</span>
            <p className="text-xl font-bold text-slate-900">28 / 32</p>
            <span className="text-[11px] text-amber-700 font-medium">4 Critical Beds Free</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <span className="text-slate-500 block mb-1">Doctors Registered</span>
            <p className="text-xl font-bold text-slate-900">{dashboardData.doctors_count || doctorsList.length}</p>
            <span className="text-[11px] text-emerald-700 font-medium">Verified Medical Staff</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <span className="text-slate-500 block mb-1">Total Consultations</span>
            <p className="text-xl font-bold text-slate-900">{dashboardData.appointments_count}</p>
            <span className="text-[11px] text-teal-700 font-medium">Recorded in DB</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <span className="text-slate-500 block mb-1">Walk-in Registrations</span>
            <p className="text-xl font-bold text-teal-700">{dashboardData.registrations_count}</p>
            <span className="text-[11px] text-teal-700 font-medium">Active OP Visits</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
