import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { appointmentService } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import WebRTCConsultationRoom from '../../components/WebRTCConsultationRoom';
import {
  Video,
  FileText,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  Stethoscope,
  Loader2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export default function DoctorConsultations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlAppointmentId = searchParams.get('appointmentId');

  const [appointments, setAppointments] = useState([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(urlAppointmentId || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await appointmentService.getDoctorAppointments();
        const list = Array.isArray(data) ? data : [];
        // Prioritize confirmed/upcoming appointments
        const activeList = list.filter(
          (a) => a.status === 'CONFIRMED' || a.status === 'UPCOMING' || a.status === 'IN_PROGRESS'
        );
        const fullList = activeList.length > 0 ? activeList : list;
        setAppointments(fullList);

        if (!urlAppointmentId && fullList.length > 0) {
          const first = fullList[0];
          setSelectedAppointmentId(first.id);
          setSearchParams({ appointmentId: first.id }, { replace: true });
        }
      } catch (err) {
        console.warn('Could not fetch doctor appointments:', err);
        setError(err.response?.data?.detail || 'Failed to load clinician appointments.');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [urlAppointmentId]);

  const handleSelectAppointment = (id) => {
    setSelectedAppointmentId(id);
    setSearchParams({ appointmentId: id });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Page Header */}
      <PageHeader
        badge="Telemedicine Suite"
        badgeStatus="Live Clinical Room"
        title="Clinician Tele-Consultation Room"
        subtitle="End-to-end WebRTC peer-to-peer telemedicine session with your patient"
        action={
          <div className="flex items-center gap-2">
            <Link to="/doctor/clinical-context">
              <Button variant="outline" size="sm">
                Clinical Context
              </Button>
            </Link>
            <Link to="/doctor/prescriptions">
              <Button variant="primary" size="sm" icon={FileText}>
                Write Prescription
              </Button>
            </Link>
          </div>
        }
      />

      {loading ? (
        <Card className="p-12 text-center text-slate-500">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
          <p className="font-semibold text-slate-700">Connecting to Clinician Telemedicine Gateway...</p>
        </Card>
      ) : appointments.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3 border border-teal-100">
            <Video className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">No Confirmed Tele-Consultations</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            You do not currently have any confirmed video consultations scheduled on your roster. New patient bookings will appear on your dashboard.
          </p>
          <div className="mt-4">
            <Link to="/doctor/dashboard">
              <Button variant="primary" size="sm">
                View Doctor Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Patient Switcher */}
          {appointments.length > 1 && (
            <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-2 overflow-x-auto text-xs">
              <span className="font-semibold text-slate-600 shrink-0">Consultation Roster:</span>
              {appointments.map((apt) => {
                const isSelected = apt.id === selectedAppointmentId;
                return (
                  <button
                    key={apt.id}
                    onClick={() => handleSelectAppointment(apt.id)}
                    className={`px-3 py-1.5 rounded-lg border font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center gap-2 ${
                      isSelected
                        ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>{apt.patientName || 'Patient'}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                      isSelected ? 'bg-teal-700 text-teal-100' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {apt.date} {apt.time}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* WebRTC Video Consultation Room */}
          {selectedAppointmentId && (
            <WebRTCConsultationRoom
              appointmentId={selectedAppointmentId}
              userRole="doctor"
            />
          )}
        </div>
      )}
    </div>
  );
}
