import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const TWENTY_FOUR_HOURLY_SLOTS = [
  "12:00 AM – 1:00 AM",
  "1:00 AM – 2:00 AM",
  "2:00 AM – 3:00 AM",
  "3:00 AM – 4:00 AM",
  "4:00 AM – 5:00 AM",
  "5:00 AM – 6:00 AM",
  "6:00 AM – 7:00 AM",
  "7:00 AM – 8:00 AM",
  "8:00 AM – 9:00 AM",
  "9:00 AM – 10:00 AM",
  "10:00 AM – 11:00 AM",
  "11:00 AM – 12:00 PM",
  "12:00 PM – 1:00 PM",
  "1:00 PM – 2:00 PM",
  "2:00 PM – 3:00 PM",
  "3:00 PM – 4:00 PM",
  "4:00 PM – 5:00 PM",
  "5:00 PM – 6:00 PM",
  "6:00 PM – 7:00 PM",
  "7:00 PM – 8:00 PM",
  "8:00 PM – 9:00 PM",
  "9:00 PM – 10:00 PM",
  "10:00 PM – 11:00 PM",
  "11:00 PM – 12:00 AM"
];


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
  const [searchParams, setSearchParams] = useSearchParams();
  const targetAptId = searchParams.get('id') || searchParams.get('appointmentId');

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

  // Acceptance & Scheduling modal state (60-minute consultation slot)
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [acceptingApt, setAcceptingApt] = useState(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('10:00 AM – 11:00 AM');
  const [bookedSlots, setBookedSlots] = useState([]);

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

  // When navigated from notification with a specific appointment ID:
  // smoothly scroll into view
  useEffect(() => {
    if (targetAptId && appointments.length > 0) {
      const matched = appointments.find((a) => a.id === targetAptId);
      if (matched) {
        setTimeout(() => {
          const el = document.getElementById(`doc-apt-${targetAptId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 150);
      }
    }
  }, [targetAptId, appointments]);

  const fetchBookedSlots = async (targetDate, doctorId) => {
    try {
      const res = await appointmentService.getBookedSlots(targetDate, doctorId);
      const booked = res?.booked_slots || [];
      setBookedSlots(booked);
      return booked;
    } catch (e) {
      const localBooked = appointments
        .filter((a) => (a.date === targetDate || a.appointment_date === targetDate) && a.status === 'CONFIRMED')
        .map((a) => a.time || a.time_slot)
        .filter(Boolean);
      setBookedSlots(localBooked);
      return localBooked;
    }
  };

  const isSlotBooked = (slotLabel) => {
    if (bookedSlots && (bookedSlots.includes(slotLabel) || bookedSlots.some(b => b && (b === slotLabel || slotLabel.startsWith(b) || b.startsWith(slotLabel))))) {
      return true;
    }
    return appointments.some((a) => {
      if (a.id === acceptingApt?.id) return false;
      if (a.status !== 'CONFIRMED' && a.status !== 'SCHEDULED') return false;
      const aptDate = a.date || a.appointment_date;
      const aptTime = a.time || a.time_slot;
      return aptDate === scheduledDate && (aptTime === slotLabel || slotLabel.startsWith(aptTime) || (aptTime && aptTime.startsWith(slotLabel)));
    });
  };

  const handleOpenAccept = async (apt) => {
    setAcceptingApt(apt);
    const initialDate = apt.date || new Date().toISOString().split('T')[0];
    setScheduledDate(initialDate);
    const booked = await fetchBookedSlots(initialDate, apt.doctorId || apt.doctor_id);
    
    // Pick first unbooked slot
    const requestedSlot = apt.time || '10:00 AM – 11:00 AM';
    const matchingSlot = TWENTY_FOUR_HOURLY_SLOTS.find(s => s === requestedSlot || s.startsWith(requestedSlot));
    if (matchingSlot && !booked.includes(matchingSlot)) {
      setScheduledTime(matchingSlot);
    } else {
      const firstAvailable = TWENTY_FOUR_HOURLY_SLOTS.find(s => !booked.includes(s));
      setScheduledTime(firstAvailable || TWENTY_FOUR_HOURLY_SLOTS[9]);
    }
    setAcceptModalOpen(true);
  };

  const handleDateChange = async (newDate) => {
    setScheduledDate(newDate);
    const booked = await fetchBookedSlots(newDate, acceptingApt?.doctorId || acceptingApt?.doctor_id);
    if (booked.includes(scheduledTime)) {
      const firstAvailable = TWENTY_FOUR_HOURLY_SLOTS.find(s => !booked.includes(s));
      if (firstAvailable) setScheduledTime(firstAvailable);
    }
  };

  const handleConfirmAccept = async (e) => {
    e.preventDefault();
    if (!acceptingApt) return;
    const aptId = acceptingApt.id;
    setActionLoadingId(aptId);
    try {
      await appointmentService.acceptAppointment(aptId, {
        appointment_date: scheduledDate,
        time_slot: scheduledTime,
      });
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === aptId
            ? { ...apt, status: 'CONFIRMED', date: scheduledDate, time: scheduledTime }
            : apt
        )
      );
      setAcceptModalOpen(false);
      setAcceptingApt(null);
      // Refresh stats
      doctorService.getDoctorStats().then((res) => {
        if (res) setStats((prev) => ({ ...prev, ...res }));
      }).catch(() => {});
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to confirm and schedule appointment.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAccept = async (id) => {
    const apt = appointments.find((a) => a.id === id);
    if (apt) {
      handleOpenAccept(apt);
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
        subtitle={`Specialization: ${user?.specialization || 'Clinical Specialist'}${user?.department ? ` • Department: ${user.department}` : ''} • ${user?.hospital_name || 'City Care Multispeciality Hospital'} • Registered Session`}
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

      {/* Target Appointment Missing / Completed Alert Banner */}
      {targetAptId && !loading && !appointments.some((apt) => apt.id === targetAptId) && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Consultation Appointment Notice</p>
              <p className="mt-0.5 text-amber-800">
                Appointment #{targetAptId} is no longer pending or you may not be authorized to access this patient record.
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
                {pendingRequests.map((apt) => {
                  const isTargeted = targetAptId === apt.id;
                  return (
                    <div
                      key={apt.id}
                      id={`doc-apt-${apt.id}`}
                      className={`p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 ${
                        isTargeted
                          ? 'bg-amber-100/60 border-2 border-amber-500 shadow-md ring-2 ring-amber-400'
                          : 'bg-amber-50/40 border border-amber-200'
                      }`}
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
                            {isTargeted && (
                              <span className="text-[10px] bg-amber-700 text-white font-bold px-2 py-0.5 rounded-full animate-pulse shadow-2xs">
                                Targeted Request
                              </span>
                            )}
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
                        onClick={() => handleOpenAccept(apt)}
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
                );
              })}
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
                {confirmedOrUpcoming.map((apt) => {
                  const isTargeted = targetAptId === apt.id;
                  return (
                    <div
                      key={apt.id}
                      id={`doc-apt-${apt.id}`}
                      className={`p-3.5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all duration-300 ${
                        isTargeted
                          ? 'bg-teal-50/70 border-2 border-teal-500 shadow-md ring-2 ring-teal-400'
                          : 'bg-slate-50 border border-slate-200 hover:border-teal-400'
                      }`}
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
                            {isTargeted && (
                              <span className="text-[10px] bg-teal-700 text-white font-bold px-2 py-0.5 rounded-full animate-pulse shadow-2xs">
                                Targeted Session
                              </span>
                            )}
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
                );
              })}
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

      {/* Accept & Schedule 60-Minute Consultation Modal */}
      <Modal
        isOpen={acceptModalOpen}
        onClose={() => setAcceptModalOpen(false)}
        title="Accept & Schedule 1-Hour Consultation"
        description="Verify or adjust the scheduled consultation date and start time. Video consultation will be allotted for a 60-minute window."
      >
        <form onSubmit={handleConfirmAccept} className="space-y-4 text-xs">
          {acceptingApt && (
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg space-y-1">
              <div className="flex justify-between">
                <span className="font-bold text-teal-900">Patient:</span>
                <span className="font-semibold text-slate-800">{acceptingApt.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-teal-900">Chief Complaint:</span>
                <span className="text-slate-700 truncate max-w-xs">{acceptingApt.chiefComplaint || 'Consultation assessment'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-teal-900">Mode:</span>
                <span className="text-teal-700 font-semibold">{acceptingApt.type}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block font-medium text-slate-700 mb-1">Appointment Date</label>
            <input
              type="date"
              required
              value={scheduledDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-medium text-slate-700">24-Hour Consultation Time Slot (60-minute duration)</label>
              <span className="text-[11px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                24 slots available / day
              </span>
            </div>
            <select
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-mono"
            >
              {TWENTY_FOUR_HOURLY_SLOTS.map((slot, index) => {
                const booked = isSlotBooked(slot);
                return (
                  <option key={slot} value={slot} disabled={booked} className={booked ? 'text-slate-400 bg-slate-100' : 'text-slate-900 font-medium'}>
                    Slot {String(index + 1).padStart(2, '0')}: {slot} {booked ? '— [Already Booked]' : '— [Available - 60 min]'}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-[11px] flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-teal-600 shrink-0" />
            <span>Consultation window: 60 minutes. System validates against schedule conflicts before confirmation.</span>
          </div>

          <div className="pt-2 flex justify-between">
            <Button variant="outline" size="sm" onClick={() => setAcceptModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={actionLoadingId === acceptingApt?.id}
            >
              {actionLoadingId === acceptingApt?.id ? 'Scheduling...' : 'Confirm & Schedule 1-Hour Consultation'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
