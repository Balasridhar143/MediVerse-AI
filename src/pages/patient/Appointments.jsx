import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { appointmentService } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import {
  Calendar,
  Clock,
  Video,
  Building,
  Plus,
  Loader2,
  AlertCircle,
  FileText,
} from 'lucide-react';

export default function Appointments() {
  const [activeTab, setActiveTab] = useState('All');
  const [appointmentsList, setAppointmentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await appointmentService.getMyAppointments();
      setAppointmentsList(data || []);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError(err.response?.data?.detail || 'Failed to load appointments from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancelAppointment = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment request?')) {
      return;
    }
    setActionLoadingId(id);
    try {
      await appointmentService.cancelAppointment(id);
      setAppointmentsList((prev) =>
        prev.map((apt) => (apt.id === id ? { ...apt, status: 'CANCELLED' } : apt))
      );
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to cancel appointment.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredAppointments = appointmentsList.filter((apt) => {
    if (activeTab === 'All') return true;
    const s = (apt.status || '').toUpperCase();
    if (activeTab === 'Pending') return s === 'PENDING';
    if (activeTab === 'Confirmed') return s === 'CONFIRMED' || s === 'UPCOMING';
    if (activeTab === 'Cancelled') return s === 'CANCELLED' || s === 'REJECTED';
    if (activeTab === 'Completed') return s === 'COMPLETED';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        badge="Patient Care"
        badgeStatus="Database-Backed Ledger"
        title="Consultation Appointments"
        subtitle="Manage upcoming clinical sessions, track pending doctor requests, or cancel scheduled consultations"
        action={
          <Link to="/patient/find-doctor">
            <Button variant="primary" size="sm" icon={Plus}>
              Book New Appointment
            </Button>
          </Link>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 text-xs overflow-x-auto">
        {['All', 'Pending', 'Confirmed', 'Cancelled', 'Completed'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === tab
                ? 'bg-teal-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-xl space-y-3">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading clinical consultations ledger...</p>
        </div>
      )}

      {error && !loading && (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Failed to load appointments</p>
            <p className="mt-0.5 text-rose-700">{error}</p>
            <button
              onClick={fetchAppointments}
              className="mt-2 text-xs font-semibold text-rose-900 underline cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Appointments List */}
      {!loading && !error && (
        <div className="space-y-3">
          {filteredAppointments.map((apt) => {
            const isPending = (apt.status || '').toUpperCase() === 'PENDING';
            const isConfirmed = (apt.status || '').toUpperCase() === 'CONFIRMED' || (apt.status || '').toUpperCase() === 'UPCOMING';
            const isCancelled = (apt.status || '').toUpperCase() === 'CANCELLED';
            const isRejected = (apt.status || '').toUpperCase() === 'REJECTED';
            const isCompleted = (apt.status || '').toUpperCase() === 'COMPLETED';

            return (
              <Card key={apt.id} className="hover:border-teal-300 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm shrink-0 border border-teal-100">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-900 text-sm">{apt.doctorName}</h3>
                        <span className="text-xs text-teal-700 font-medium bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {apt.specialization || apt.department || 'General Medicine'}
                        </span>
                        <StatusBadge status={apt.status} size="xs" />
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-2">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{apt.hospital || 'City Care Multispeciality Hospital'}</span>
                      </p>
                      {apt.notes && (
                        <p className="text-xs text-slate-600 italic">
                          Clinical Note: {apt.notes}
                        </p>
                      )}
                      {isRejected && apt.rejection_reason && (
                        <p className="text-xs text-rose-600 font-medium">
                          Decline Reason: {apt.rejection_reason}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                    <div className="text-left sm:text-right text-xs">
                      <p className="font-semibold text-slate-900">{apt.date}</p>
                      <p className="text-slate-500">{apt.time} ({apt.type})</p>
                      <span className="text-[10px] text-slate-400 font-mono block">ID: {apt.id}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isConfirmed && (
                        <Link to={`/patient/consultation?appointmentId=${apt.id}`}>
                          <Button variant="primary" size="sm" icon={Video}>
                            Join Tele-Room
                          </Button>
                        </Link>
                      )}

                      {(isPending || isConfirmed) && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={actionLoadingId === apt.id}
                          onClick={() => handleCancelAppointment(apt.id)}
                        >
                          {actionLoadingId === apt.id ? 'Cancelling...' : 'Cancel'}
                        </Button>
                      )}

                      {isCompleted && (
                        <Link to="/patient/prescriptions">
                          <Button variant="outline" size="sm" icon={FileText}>
                            Prescription
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}

          {filteredAppointments.length === 0 && (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-xl space-y-2">
              <p className="font-semibold text-slate-700 text-sm">No Appointments in this Category</p>
              <p className="text-slate-500 text-xs max-w-sm mx-auto">
                You currently have no consultations matching '{activeTab}'. Use 'Book New Appointment' to schedule a consultation with a registered doctor.
              </p>
              <Link to="/patient/find-doctor" className="inline-block mt-3">
                <Button variant="primary" size="sm" icon={Plus}>
                  Find & Book a Specialist
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
