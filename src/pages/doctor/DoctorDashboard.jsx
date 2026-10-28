import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  mockEarlyWarnings,
  mockFollowUps,
  mockVitalsHistory,
} from '../../data/mockData';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import {
  Calendar,
  Users,
  Video,
  Clock,
  FileText,
  Activity,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
  BrainCircuit,
  Stethoscope,
  Building,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [warnings, setWarnings] = useState(mockEarlyWarnings);

  const todayAppointments = [
    {
      id: 'apt_101',
      patientName: 'Rahul Sharma',
      patientId: 'PID-2026-089',
      age: 42,
      gender: 'M',
      time: '10:15 AM',
      type: 'Video Consultation',
      status: 'Upcoming',
      chiefComplaint: 'Hypertension follow-up & BP review',
    },
    {
      id: 'apt_102',
      patientName: 'Meera Iyer',
      patientId: 'PID-2026-094',
      age: 58,
      gender: 'F',
      time: '11:00 AM',
      type: 'In-Person',
      status: 'Upcoming',
      chiefComplaint: 'Post-angioplasty 6-month checkup',
    },
    {
      id: 'apt_103',
      patientName: 'Amit Patel',
      patientId: 'PID-2026-102',
      age: 36,
      gender: 'M',
      time: '11:45 AM',
      type: 'Video Consultation',
      status: 'Completed',
      chiefComplaint: 'Palpitations during exercise',
    },
    {
      id: 'apt_104',
      patientName: 'Kavita Nair',
      patientId: 'PID-2026-110',
      age: 64,
      gender: 'F',
      time: '01:30 PM',
      type: 'Video Consultation',
      status: 'Upcoming',
      chiefComplaint: 'Chest tightness & dyspnea on exertion',
    },
  ];

  const handleAcknowledgeWarning = (warningId) => {
    setWarnings((prev) =>
      prev.map((w) =>
        w.id === warningId ? { ...w, status: 'Reviewed by Clinician' } : w
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Welcome / Header */}
      <PageHeader
        badge="Clinician Workspace"
        badgeStatus="Active Duty"
        title={user?.name || 'Dr. Ananya Sen, MD'}
        subtitle="Specialization: Cardiology & Internal Medicine • City Care Multispeciality Hospital • Reg: MCI-45291"
        action={
          <>
            <Link to="/doctor/clinical-context">
              <Button variant="outline" size="sm" icon={BrainCircuit}>
                Review Clinical Context
              </Button>
            </Link>
            <Link to="/doctor/prescriptions">
              <Button variant="primary" size="sm" icon={FileText}>
                Write Prescription
              </Button>
            </Link>
          </>
        }
      />

      {/* 2. Today's Appointments */}
      <Card
        title="Today's Appointment Schedule"
        subtitle="Active patient roster and scheduled telemedicine consultations"
        icon={Calendar}
        action={
          <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded border border-teal-200">
            {todayAppointments.filter((a) => a.status === 'Upcoming').length} Upcoming Consultations
          </span>
        }
      >
        <div className="space-y-3">
          {todayAppointments.map((apt) => (
            <div
              key={apt.id}
              className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-teal-400 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0 border border-teal-200">
                  {apt.type === 'Video Consultation' ? (
                    <Video className="w-4 h-4" />
                  ) : (
                    <Users className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-slate-900 text-sm">{apt.patientName}</h4>
                    <span className="text-xs text-slate-500 font-medium">
                      ({apt.patientId} • {apt.age}y/{apt.gender})
                    </span>
                    <StatusBadge status={apt.status} size="xs" />
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    <strong>Chief Complaint:</strong> {apt.chiefComplaint}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 border-t md:border-t-0 border-slate-200 pt-2 md:pt-0">
                <div className="text-left md:text-right text-xs">
                  <span className="font-bold text-slate-900 block">{apt.time}</span>
                  <span className="text-slate-500">{apt.type}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Link to="/doctor/clinical-context">
                    <Button variant="outline" size="sm">
                      Clinical Context
                    </Button>
                  </Link>

                  {apt.status === 'Upcoming' && (
                    <Link to="/doctor/consultations">
                      <Button variant="primary" size="sm" icon={Video}>
                        Join Room
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 3. Patient Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-xs text-slate-500 block mb-1">Total Consultations Today</span>
          <p className="text-2xl font-bold text-slate-900">4</p>
          <span className="text-[11px] text-teal-700 font-medium">3 Video • 1 In-Person</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-xs text-slate-500 block mb-1">Active Outpatients</span>
          <p className="text-2xl font-bold text-slate-900">28</p>
          <span className="text-[11px] text-emerald-700 font-medium">Under Long-term Care</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-xs text-slate-500 block mb-1">Early Warnings</span>
          <p className="text-2xl font-bold text-amber-700">1</p>
          <span className="text-[11px] text-amber-700 font-medium">Requires Review</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-xs text-slate-500 block mb-1">Prescriptions Issued</span>
          <p className="text-2xl font-bold text-slate-900">12</p>
          <span className="text-[11px] text-teal-700 font-medium">This Week</span>
        </div>
      </div>

      {/* 4. Follow-ups & 5. Early Warning Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Follow-ups */}
        <Card
          title="Scheduled Patient Follow-ups"
          subtitle="Longitudinal chronic evaluations for your assigned patients"
          icon={Clock}
          action={
            <Link
              to="/doctor/follow-ups"
              className="text-xs font-semibold text-teal-700 hover:underline flex items-center gap-1"
            >
              All Follow-ups <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <div className="space-y-3 text-xs">
            {mockFollowUps.map((fu) => (
              <div key={fu.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                <div className="flex items-center justify-between">
                  <strong className="text-slate-900 text-sm">{fu.patientName} ({fu.patientId})</strong>
                  <StatusBadge status={fu.status} size="xs" />
                </div>
                <p className="text-slate-700 font-medium">Objective: {fu.reason}</p>
                <div className="flex justify-between text-slate-500 pt-1 text-[11px]">
                  <span>Target Date: <strong className="text-slate-800">{fu.followUpDate}</strong></span>
                  <span className="text-emerald-700">Reminder Active</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Early Warning Alerts */}
        <Card
          title="Early Clinical Warning Alerts"
          subtitle="Longitudinal trend deviations flagged for doctor review"
          icon={ShieldAlert}
          action={
            <Link
              to="/doctor/early-warnings"
              className="text-xs font-semibold text-teal-700 hover:underline flex items-center gap-1"
            >
              Review Center <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <div className="space-y-3 text-xs">
            {warnings.map((w) => (
              <div
                key={w.id}
                className="p-3 bg-amber-50/60 border border-amber-300 rounded-lg space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>{w.title}</span>
                  </div>
                  <StatusBadge status={w.status} size="xs" />
                </div>

                <p className="text-slate-800 leading-relaxed font-medium">
                  {w.patientName}: {w.whatChanged}
                </p>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500 italic">
                    *{w.aiDisclaimer}
                  </span>
                  {w.status !== 'Reviewed by Clinician' && (
                    <button
                      onClick={() => handleAcknowledgeWarning(w.id)}
                      className="px-2.5 py-1 text-xs font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 rounded-md cursor-pointer transition-colors"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 6. Recent Activity & Longitudinal Trajectory */}
      <Card
        title="Recent Patient Activity & Vitals Response"
        subtitle="Systolic and diastolic blood pressure trajectory for primary patient Rahul Sharma (PID-2026-089)"
        icon={Activity}
      >
        <div className="h-56 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockVitalsHistory} margin={{ top: 5, right: 15, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis domain={[60, 150]} tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip contentStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="systolic" name="Systolic BP" stroke="#0d9488" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="diastolic" name="Diastolic BP" stroke="#0284c7" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
