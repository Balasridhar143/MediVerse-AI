import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { appointmentService, doctorService } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import {
  Calendar,
  Users,
  Video,
  Clock,
  FileText,
  Activity,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ShieldAlert,
  BrainCircuit,
  Loader2,
  AlertCircle,
  Check,
  X,
} from 'lucide-react';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({
    today_consultations: 0,
    pending_requests: 0,
    upcoming_consultations: 0,
    active_patients: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Rejection modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingAptId, setRejectingAptId] = useState(null);
  const [rejectReason, setRejectReason] = useState('Clinician schedule conflict');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchDoctorData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [aptsData, statsData] = await Promise.all([
        appointmentService.getDoctorAppointments(),
        doctorService.getDoctorStats().catch(() => ({})),
      ]);
      setAppointments(aptsData || []);
      if (statsData) {
        setStats({
          today_consultations: statsData.today_consultations || 0,
          pending_requests: statsData.pending_requests || 0,
          upcoming_consultations: statsData.upcoming_consultations || 0,
          active_patients: statsData.active_patients || 0,
        });
      }
    } catch (err) {
      console.error('Error fetching doctor dashboard data:', err);
      setError(err.response?.data?.detail || 'Failed to load clinician schedule.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorData();
  }, []);

  const handleAccept = async (id) => {
    setActionLoadingId(id);
    try {
      await appointmentService.acceptAppointment(id);
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === id ? { ...apt, status: 'CONFIRMED' } : apt))
      );
      // Refresh stats
      doctorService.getDoctorStats().then((res) => {
        if (res) setStats((prev) => ({ ...prev, ...res }));
      }).catch(() => {});
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to accept appointment.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenReject = (id) => {
    setRejectingAptId(id);
    setRejectReason('Clinician schedule conflict');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectingAptId) return;
    setActionLoadingId(rejectingAptId);
    try {
      await appointmentService.rejectAppointment(rejectingAptId, rejectReason);
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === rejectingAptId ? { ...apt, status: 'REJECTED', rejection_reason: rejectReason } : apt
        )
      );
      setRejectModalOpen(false);
      setRejectingAptId(null);
      // Refresh stats
      doctorService.getDoctorStats().then((res) => {
        if (res) setStats((prev) => ({ ...prev, ...res }));
      }).catch(() => {});
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to reject appointment.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const pendingRequests = appointments.filter(
    (a) => (a.status || '').toUpperCase() === 'PENDING'
  );

  const confirmedOrUpcoming = appointments.filter(
    (a) => (a.status || '').toUpperCase() === 'CONFIRMED' || (a.status || '').toUpperCase() === 'UPCOMING'
  );

  return (
    <div className="space-y-6">
      {/* 1. Clinician Header */}
      <PageHeader
        badge="Clinician Workspace"
        badgeStatus="Active Duty"
        title={user?.name || user?.full_name || 'Dr. Practitioner'}
        subtitle={`Specialization: ${user?.specialization || 'Clinical Specialist'} • ${user?.hospital_name || 'City Care Multispeciality Hospital'} • Registered Session`}
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

      {/* 2. Real Calculated Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-xs text-slate-500 block mb-1">Today's Consultations</span>
          <p className="text-2xl font-bold text-slate-900">{stats.today_consultations}</p>
          <span className="text-[11px] text-teal-700 font-medium">Scheduled for Today</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-xs text-slate-500 block mb-1">Pending Patient Requests</span>
          <p className={`text-2xl font-bold ${pendingRequests.length > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
            {pendingRequests.length}
          </p>
          <span className="text-[11px] text-amber-700 font-medium">Requires Clinician Action</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-xs text-slate-500 block mb-1">Upcoming Consultations</span>
          <p className="text-2xl font-bold text-slate-900">{confirmedOrUpcoming.length}</p>
          <span className="text-[11px] text-emerald-700 font-medium">Confirmed & Active</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-xs text-slate-500 block mb-1">Registered Patients</span>
          <p className="text-2xl font-bold text-slate-900">{stats.active_patients}</p>
          <span className="text-[11px] text-teal-700 font-medium">In Clinical Panel</span>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-xl space-y-3">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Retrieving appointments and patient roster from database...</p>
        </div>
      )}

      {error && !loading && (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Failed to load clinician workspace</p>
            <p className="mt-0.5 text-rose-700">{error}</p>
            <button
              onClick={fetchDoctorData}
              className="mt-2 text-xs font-semibold text-rose-900 underline cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* 3. Pending Appointment Requests (Separately Highlighted with Accept / Reject) */}
          <Card
            title="Pending Patient Requests"
            subtitle="New consultation requests submitted by patients requiring your approval"
            icon={Clock}
            action={
              <span className={`text-xs font-semibold px-2.5 py-1 rounded border ${
                pendingRequests.length > 0
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}>
                {pendingRequests.length} Pending Approval
              </span>
            }
          >
            {pendingRequests.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl">
                No pending requests. New patient appointment requests will appear here for your review and approval.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-4 bg-amber-50/40 border border-amber-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0 border border-amber-200">
                        {apt.type === 'Video Consultation' ? (
                          <Video className="w-5 h-5" />
                        ) : (
                          <Users className="w-5 h-5" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-sm">{apt.patientName}</h4>
                          <span className="text-xs text-slate-500 font-mono">
                            {apt.patient_phone || apt.patient_email || apt.patientId}
                          </span>
                          <StatusBadge status="PENDING" size="xs" />
                        </div>
                        <p className="text-xs text-slate-600">
                          <strong>Chief Complaint / Notes:</strong> {apt.chiefComplaint || 'Consultation and clinical assessment'}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Requested for: <strong>{apt.date}</strong> at <strong>{apt.time}</strong> • Mode: <strong>{apt.type}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 border-amber-200 pt-3 md:pt-0">
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={actionLoadingId === apt.id}
                        icon={Check}
                        onClick={() => handleAccept(apt.id)}
                      >
                        {actionLoadingId === apt.id ? 'Confirming...' : 'Accept Request'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={actionLoadingId === apt.id}
                        icon={X}
                        onClick={() => handleOpenReject(apt.id)}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* 4. Confirmed / Upcoming Consultations Schedule */}
          <Card
            title="Confirmed Consultation Schedule"
            subtitle="Approved active patient roster and scheduled telemedicine consultations"
            icon={Calendar}
            action={
              <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded border border-teal-200">
                {confirmedOrUpcoming.length} Confirmed
              </span>
            }
          >
            {confirmedOrUpcoming.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl">
                No confirmed consultations currently scheduled. Once you accept patient requests, they will populate your active roster.
              </div>
            ) : (
              <div className="space-y-3">
                {confirmedOrUpcoming.map((apt) => (
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
                            ({apt.patientId || 'Registered Patient'})
                          </span>
                          <StatusBadge status="CONFIRMED" size="xs" />
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          <strong>Chief Complaint:</strong> {apt.chiefComplaint || 'Clinical evaluation'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 border-t md:border-t-0 border-slate-200 pt-2 md:pt-0">
                      <div className="text-left md:text-right text-xs">
                        <span className="font-bold text-slate-900 block">{apt.date} • {apt.time}</span>
                        <span className="text-slate-500">{apt.type}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link to="/doctor/clinical-context">
                          <Button variant="outline" size="sm">
                            Clinical Context
                          </Button>
                        </Link>

                        <Link to={`/doctor/consultations?appointmentId=${apt.id}`}>
                          <Button variant="primary" size="sm" icon={Video}>
                            Join Room
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      {/* Reject Reason Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Decline Appointment Request"
        description="Provide a brief reason for declining this request. The patient will receive a notification."
      >
        <form onSubmit={handleConfirmReject} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Reason for Declining</label>
            <select
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
            >
              <option value="Clinician schedule conflict">Clinician schedule conflict</option>
              <option value="Emergency clinical duty / Surgery">Emergency clinical duty / Surgery</option>
              <option value="Outside clinician specialization">Outside clinician specialization</option>
              <option value="Please reschedule to an alternate slot">Please reschedule to an alternate slot</option>
            </select>
          </div>

          <div className="pt-2 flex justify-between">
            <Button variant="outline" size="sm" onClick={() => setRejectModalOpen(false)}>
              Back
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              disabled={actionLoadingId === rejectingAptId}
            >
              {actionLoadingId === rejectingAptId ? 'Declining...' : 'Confirm Decline'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
