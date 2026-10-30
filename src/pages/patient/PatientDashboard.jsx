import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/api';
import { reportService } from '../../services/reportService';
import {
  mockMedicines,
  mockVitalsHistory,
  mockFollowUps,
} from '../../data/mockData';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import DailyCareSummary from '../../components/DailyCareSummary';
import {
  Calendar,
  Clock,
  Video,
  Pill,
  FileCheck2,
  Activity,
  Heart,
  Droplets,
  Scale,
  CheckCircle2,
  AlertCircle,
  Siren,
  ChevronRight,
  Stethoscope,
  Building,
  Upload,
  FileText,
  Users,
  Plus,
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

export default function PatientDashboard() {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState(mockMedicines);
  const [vitalsModal, setVitalsModal] = useState(false);
  const [realAppointments, setRealAppointments] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(true);

  const [recentReport, setRecentReport] = useState(null);

  useEffect(() => {
    appointmentService.getMyAppointments()
      .then((data) => setRealAppointments(data || []))
      .catch((err) => console.error('Failed to fetch patient appointments:', err))
      .finally(() => setLoadingAppts(false));

    reportService.getReports()
      .then((reps) => {
        if (reps && reps.length > 0) {
          const r = reps[0];
          setRecentReport({
            name: r.reportName,
            status: r.status,
            date: r.date,
            type: r.reportType,
            lab: r.hospital,
            findings: r.shortPreview || r.detailedFindings || 'Laboratory analysis ready.'
          });
        }
      })
      .catch((err) => console.error('Failed to fetch recent report:', err));
  }, []);
  const [latestVitals, setLatestVitals] = useState({
    bp: '124/80',
    heartRate: 72,
    glucose: 108,
    weight: 73.5,
  });
  const [vitalInput, setVitalInput] = useState({
    systolic: '124',
    diastolic: '80',
    heartRate: '72',
    glucose: '108',
  });

  const nextAppointment = realAppointments.find(
    (a) => (a.status || '').toUpperCase() === 'CONFIRMED' || (a.status || '').toUpperCase() === 'PENDING'
  ) || null;
  const upcomingFollowUp = mockFollowUps && mockFollowUps.length > 0 ? mockFollowUps[0] : null;

  const toggleMedicineStatus = (medId) => {
    setMedicines((prev) =>
      prev.map((med) => {
        if (med.id === medId) {
          const nextStatus = med.status === 'Taken' ? 'Pending' : 'Taken';
          return { ...med, status: nextStatus };
        }
        return med;
      })
    );
  };

  const handleSaveVitals = (e) => {
    e.preventDefault();
    setLatestVitals({
      bp: `${vitalInput.systolic}/${vitalInput.diastolic}`,
      heartRate: Number(vitalInput.heartRate),
      glucose: Number(vitalInput.glucose),
      weight: latestVitals.weight,
    });
    setVitalsModal(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* 1. Welcome Message & Header */}
      <PageHeader
        badge="Patient Health Record"
        badgeStatus="Active Monitoring"
        title={`Welcome back, ${user?.name || 'Gokul Sankar'}`}
        subtitle="Patient ID: PID-2026-089 • Blood Group: B+ • Primary Clinician: Dr. Arun Kumar"
        action={
          <>
            <Button
              variant="outline"
              size="sm"
              icon={Activity}
              onClick={() => setVitalsModal(true)}
            >
              Log Daily Vitals
            </Button>
            <Link to="/patient/find-doctor">
              <Button variant="primary" size="sm" icon={Calendar}>
                Book Appointment
              </Button>
            </Link>
          </>
        }
      />

      {/* TODAY'S CARE DAILY SUMMARY (Requirement 7 & 13) */}
      <DailyCareSummary onOpenDailyCheck={() => setVitalsModal(true)} />

      {/* 2. Quick Actions: 7 Essential Clinical Shortcuts */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-600"></span>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Quick Actions
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Frequently used shortcuts</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <Link
            to="/patient/find-doctor"
            className="p-3 bg-slate-50 hover:bg-teal-50/70 border border-slate-200 hover:border-teal-200 rounded-xl flex flex-col items-center justify-center text-center transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-teal-700 flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-105 transition-transform">
              <Stethoscope className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-800 group-hover:text-teal-900">
              Find Doctor
            </span>
          </Link>

          <Link
            to="/patient/find-hospital"
            className="p-3 bg-slate-50 hover:bg-teal-50/70 border border-slate-200 hover:border-teal-200 rounded-xl flex flex-col items-center justify-center text-center transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-teal-700 flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-105 transition-transform">
              <Building className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-800 group-hover:text-teal-900">
              Find Hospital
            </span>
          </Link>

          <Link
            to="/patient/find-doctor"
            className="p-3 bg-slate-50 hover:bg-teal-50/70 border border-slate-200 hover:border-teal-200 rounded-xl flex flex-col items-center justify-center text-center transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-teal-700 flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-105 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-800 group-hover:text-teal-900">
              Book Appointment
            </span>
          </Link>

          <Link
            to="/patient/consultations"
            className="p-3 bg-slate-50 hover:bg-teal-50/70 border border-slate-200 hover:border-teal-200 rounded-xl flex flex-col items-center justify-center text-center transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-teal-700 flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-105 transition-transform">
              <Video className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-800 group-hover:text-teal-900">
              Join Consultation
            </span>
          </Link>

          <Link
            to="/patient/prescriptions"
            className="p-3 bg-slate-50 hover:bg-teal-50/70 border border-slate-200 hover:border-teal-200 rounded-xl flex flex-col items-center justify-center text-center transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-teal-700 flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-800 group-hover:text-teal-900">
              Prescription
            </span>
          </Link>

          <Link
            to="/patient/reports"
            className="p-3 bg-slate-50 hover:bg-teal-50/70 border border-slate-200 hover:border-teal-200 rounded-xl flex flex-col items-center justify-center text-center transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-teal-700 flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-105 transition-transform">
              <Upload className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-800 group-hover:text-teal-900">
              Upload Report
            </span>
          </Link>

          <Link
            to="/patient/caregiver"
            className="p-3 bg-slate-50 hover:bg-teal-50/70 border border-slate-200 hover:border-teal-200 rounded-xl flex flex-col items-center justify-center text-center transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-teal-700 flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-800 group-hover:text-teal-900">
              Caregiver
            </span>
          </Link>
        </div>
      </div>

      {/* 3. Upcoming Appointment */}
      {nextAppointment ? (
        <Card
          title="Upcoming Appointment"
          subtitle="Your next confirmed clinical consultation"
          icon={Calendar}
          action={
            <Link
              to="/patient/appointments"
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline flex items-center gap-1"
            >
              All Appointments <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                <Video className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-slate-900 text-sm">{nextAppointment.doctorName}</h4>
                  <span className="text-xs text-teal-700 font-medium bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {nextAppointment.specialization}
                  </span>
                  <StatusBadge status={nextAppointment.status} size="xs" />
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>{nextAppointment.hospital}</span>
                </p>
                <p className="text-xs text-slate-600 italic">
                  Note: {nextAppointment.notes}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-t md:border-t-0 border-slate-200 pt-3 md:pt-0">
              <div className="text-left sm:text-right text-xs">
                <p className="font-semibold text-slate-900">{nextAppointment.date}</p>
                <p className="text-slate-500">{nextAppointment.time} ({nextAppointment.type})</p>
              </div>

              <Link to="/patient/consultations">
                <Button variant="primary" size="sm" icon={Video}>
                  Join Consultation Room
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        <Card title="Upcoming Appointment" icon={Calendar}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 py-2">
            <span>No upcoming consultations scheduled with your doctors.</span>
            <Link to="/patient/find-doctor">
              <Button variant="primary" size="sm" icon={Calendar}>
                Book Consultation
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* 4. Daily Medicine Reminders & Recent Medical Report */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Medicine Reminder */}
        <Card
          title="Daily Medicine Reminders"
          subtitle="Track and mark scheduled doses"
          icon={Pill}
          action={
            <Link
              to="/patient/medicines"
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline flex items-center gap-1"
            >
              All Medicines <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <div className="space-y-2.5">
            {medicines.slice(0, 3).map((med) => (
              <div
                key={med.id}
                className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{med.name}</h4>
                  <p className="text-slate-500 text-[11px]">
                    {med.dosage} • {med.frequency} ({med.mealRelation})
                  </p>
                  <span className="text-[11px] text-teal-700 font-medium flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> Scheduled: {med.reminderTime}
                  </span>
                </div>

                <button
                  onClick={() => toggleMedicineStatus(med.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer ${
                    med.status === 'Taken'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {med.status === 'Taken' ? 'Taken' : 'Mark Taken'}
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Medical Report */}
        <Card
          title="Recent Medical Report"
          subtitle="Latest verified laboratory investigation"
          icon={FileCheck2}
          action={
            <Link
              to="/patient/reports"
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline flex items-center gap-1"
            >
              All Reports <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          {recentReport ? (
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">{recentReport.name}</h4>
                  <StatusBadge status={recentReport.status} size="xs" />
                </div>
                <p className="text-[11px] text-slate-500">
                  {recentReport.date} • {recentReport.type} • {recentReport.lab}
                </p>
                <p className="p-2 bg-white rounded border border-slate-200 text-slate-700 font-medium">
                  {recentReport.findings}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <Link to="/patient/reports" className="text-teal-700 hover:underline font-medium flex items-center gap-1">
                  View Diagnostic Vault <ChevronRight className="w-3.5 h-3.5" />
                </Link>
                <Link to="/patient/prescriptions">
                  <Button variant="outline" size="sm">
                    View Active Prescriptions
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">No recent reports found.</p>
          )}
        </Card>
      </div>

      {/* 5. Health Summary */}
      <Card
        title="Health Summary"
        subtitle="Longitudinal vitals and cardiovascular response trajectory"
        icon={Activity}
        action={
          <Link
            to="/patient/health-twin"
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline flex items-center gap-1"
          >
            Longitudinal Profile <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[11px] text-slate-500 block mb-1">Blood Pressure</span>
            <span className="text-lg font-bold text-slate-900">{latestVitals.bp}</span>
            <span className="text-[10px] text-emerald-700 font-medium block">mmHg • Stable</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[11px] text-slate-500 block mb-1">Heart Rate</span>
            <span className="text-lg font-bold text-slate-900">{latestVitals.heartRate}</span>
            <span className="text-[10px] text-slate-500 font-medium block">bpm • Normal Sinus</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[11px] text-slate-500 block mb-1">Fasting Glucose</span>
            <span className="text-lg font-bold text-slate-900">{latestVitals.glucose}</span>
            <span className="text-[10px] text-amber-700 font-medium block">mg/dL • Borderline</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[11px] text-slate-500 block mb-1">Body Weight</span>
            <span className="text-lg font-bold text-slate-900">{latestVitals.weight}</span>
            <span className="text-[10px] text-emerald-700 font-medium block">kg • -1.5 kg goal</span>
          </div>
        </div>

        {/* BP Trend Graph */}
        <div className="h-56 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockVitalsHistory} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis domain={[60, 150]} tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Line type="monotone" dataKey="systolic" name="Systolic BP" stroke="#0d9488" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="diastolic" name="Diastolic BP" stroke="#0284c7" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 6. Follow-up Clinical Target */}
      {upcomingFollowUp && (
        <Card
          title="Clinical Follow-up Target"
          subtitle="Upcoming scheduled clinical review with attending clinician"
          icon={Clock}
          action={
            <Link
              to="/patient/follow-ups"
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline flex items-center gap-1"
            >
              All Follow-ups <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 text-sm">{upcomingFollowUp.reason}</h4>
                <StatusBadge status={upcomingFollowUp.status} size="xs" />
              </div>
              <p className="text-slate-500 text-xs mt-0.5">
                Target Date: <strong className="text-slate-700">{upcomingFollowUp.targetDate}</strong> • Doctor: {upcomingFollowUp.doctorName}
              </p>
              <p className="text-slate-600 mt-1 italic">
                Clinical Focus: {upcomingFollowUp.clinicalFocus || 'Blood pressure monitoring & medication efficacy assessment'}
              </p>
            </div>

            <Link to="/patient/find-doctor">
              <Button variant="outline" size="sm">
                Schedule Review
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Log Daily Vitals Modal */}
      <Modal
        isOpen={vitalsModal}
        onClose={() => setVitalsModal(false)}
        title="Log Today's Health Vitals"
        description="Enter morning biometric readings to update your longitudinal profile"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setVitalsModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveVitals}>
              Save Vitals
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveVitals} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1 text-xs">
                Systolic BP (mmHg)
              </label>
              <input
                type="number"
                value={vitalInput.systolic}
                onChange={(e) => setVitalInput({ ...vitalInput, systolic: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                required
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1 text-xs">
                Diastolic BP (mmHg)
              </label>
              <input
                type="number"
                value={vitalInput.diastolic}
                onChange={(e) => setVitalInput({ ...vitalInput, diastolic: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1 text-xs">
                Heart Rate (bpm)
              </label>
              <input
                type="number"
                value={vitalInput.heartRate}
                onChange={(e) => setVitalInput({ ...vitalInput, heartRate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                required
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1 text-xs">
                Fasting Glucose (mg/dL)
              </label>
              <input
                type="number"
                value={vitalInput.glucose}
                onChange={(e) => setVitalInput({ ...vitalInput, glucose: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                required
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
