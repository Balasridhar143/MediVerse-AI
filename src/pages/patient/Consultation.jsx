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
  Calendar,
  Clock,
  Building,
  ShieldCheck,
  Stethoscope,
  AlertCircle,
  Loader2,
  Plus,
} from 'lucide-react';

export default function Consultation() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlAppointmentId = searchParams.get('appointmentId') || searchParams.get('id');

  const [appointments, setAppointments] = useState([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(urlAppointmentId || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await appointmentService.getMyAppointments();
        const list = Array.isArray(data) ? data : [];
        setAppointments(list);

        // If no appointmentId in URL, default to first confirmed or upcoming video appointment
        if (!urlAppointmentId) {
          if (list.length > 0) {
            const active = list.find(
              (a) => (a.status === 'CONFIRMED' || a.status === 'UPCOMING') && (a.type === 'Video Consultation' || a.type === 'Telemedicine')
            ) || list.find((a) => a.type === 'Video Consultation' || a.type === 'Telemedicine') || list[0];
            if (active) {
              setSelectedAppointmentId(active.id);
              setSearchParams({ appointmentId: active.id }, { replace: true });
            }
          }
        } else {
          setSelectedAppointmentId(urlAppointmentId);
        }
      } catch (err) {
        console.warn('Could not fetch patient appointments:', err);
        setError(err.response?.data?.detail || 'Failed to load consultation appointments.');
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
        badgeStatus="Verified WebRTC P2P"
        title="Remote Video Consultation"
        subtitle="Peer-to-peer encrypted telemedicine room with your attending physician"
        action={
          <Link to="/patient/find-doctor">
            <Button variant="outline" size="sm" icon={Plus}>
              Book New Consultation
            </Button>
          </Link>
        }
      />

      {/* Target Consultation Notice Banner */}
      {urlAppointmentId && !loading && appointments.length > 0 && !appointments.some((a) => a.id === urlAppointmentId) && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Consultation #{urlAppointmentId} could not be found or you may not be authorized. Connected to your primary scheduled consultation room.</span>
          </div>
          <button
            onClick={() => {
              const newParams = new URLSearchParams(searchParams);
              newParams.delete('id');
              setSearchParams(newParams, { replace: true });
            }}
            className="text-amber-700 hover:text-amber-900 font-bold text-xs p-1 cursor-pointer"
            title="Dismiss notice"
          >
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <Card className="p-12 text-center text-slate-500">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
          <p className="font-semibold text-slate-700">Loading Telemedicine Roster...</p>
        </Card>
      ) : appointments.length === 0 && !selectedAppointmentId ? (
        <Card className="p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3 border border-teal-100">
            <Video className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">No Video Consultations Scheduled</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            You do not currently have any scheduled telemedicine consultations. Tele-consultations are only accessible during your allotted appointment slot.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <Link to="/patient/find-doctor">
              <Button variant="primary" size="md" icon={Stethoscope}>
                Find Doctor & Book Consultation
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Appointment Switcher (if user has multiple appointments) */}
          {appointments.length > 1 && (
            <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-2 overflow-x-auto text-xs">
              <span className="font-semibold text-slate-600 shrink-0">Select Session:</span>
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
                    <span>{apt.doctorName || 'Doctor'}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                      isSelected ? 'bg-teal-700 text-teal-100' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {apt.date}
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
              userRole="patient"
            />
          )}
        </div>
      )}
    </div>
  );
}
