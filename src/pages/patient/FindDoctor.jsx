import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { doctorService, appointmentService } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import {
  Search,
  Calendar,
  Clock,
  MapPin,
  Building,
  Video,
  CheckCircle2,
  Filter,
  AlertCircle,
  Loader2,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';

export default function FindDoctor() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedDept, setSelectedDept] = useState('All');
  const [bookingDoctor, setBookingDoctor] = useState(null);

  // Step-by-step booking state
  const [bookingStep, setBookingStep] = useState(1);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [bookingData, setBookingData] = useState({
    hospital: '',
    department: '',
    doctor: '',
    date: defaultDateStr,
    time: '',
    type: 'Video Consultation',
    notes: '',
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [confirmedApt, setConfirmedApt] = useState(null);

  // Fetch doctors dynamically from backend
  const fetchDoctors = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (selectedDept !== 'All') params.department = selectedDept;
      const data = await doctorService.getDoctors(params);
      setDoctors(data || []);
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setError(err.response?.data?.detail || 'Unable to connect to clinical specialist registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [selectedDept]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDoctors();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleStartBooking = (doctor) => {
    setBookingDoctor(doctor);
    setBookingError(null);
    setBookingData({
      hospital: doctor.hospital || 'City Care Multispeciality Hospital',
      department: doctor.department || doctor.specialization || 'General Medicine',
      doctor: doctor.name,
      date: defaultDateStr,
      time: doctor.availableSlots?.[0] || '10:00 AM',
      type: 'Video Consultation',
      notes: '',
    });
    setBookingStep(1);
    setBookingConfirmed(false);
    setConfirmedApt(null);
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    setBookingLoading(true);
    setBookingError(null);
    try {
      const payload = {
        doctor_id: bookingDoctor.userId || bookingDoctor.id,
        doctor_name: bookingDoctor.name,
        hospital_name: bookingData.hospital,
        department: bookingData.department,
        specialization: bookingDoctor.specialization,
        appointment_date: bookingData.date,
        time_slot: bookingData.time,
        type: bookingData.type,
        notes: bookingData.notes || 'Routine consultation and clinical review',
      };
      const res = await appointmentService.bookAppointment(payload);
      setConfirmedApt(res);
      setBookingConfirmed(true);
    } catch (err) {
      console.error('Booking failed:', err);
      const msg = err.response?.data?.detail || err.message || 'Slot reservation failed.';
      setBookingError(msg);
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        badge="Doctor Directory"
        badgeStatus="Live Clinical Registry"
        title="Find a Clinical Specialist"
        subtitle="Schedule in-person hospital visits or remote telemedicine consultations with registered practitioners"
        action={
          <div className="w-full sm:w-72 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search doctor, specialty, hospital..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white focus:border-teal-500"
            />
          </div>
        }
      />

      {/* Specialty Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-500 font-medium shrink-0 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Department:
        </span>
        {['All', 'Cardiology', 'Neurology', 'General Medicine', 'Pulmonology', 'Pediatrics', 'Emergency & Trauma'].map((dept) => (
          <button
            key={dept}
            onClick={() => setSelectedDept(dept)}
            className={`px-3 py-1.5 rounded-lg border font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedDept === dept
                ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {dept}
          </button>
        ))}
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-xl space-y-3">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Querying verified clinical specialists from database...</p>
        </div>
      )}

      {error && !loading && (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Database Query Error</p>
            <p className="mt-0.5 text-rose-700">{error}</p>
            <button
              onClick={fetchDoctors}
              className="mt-2 text-xs font-semibold text-rose-900 underline hover:no-underline cursor-pointer"
            >
              Retry Database Connection
            </button>
          </div>
        </div>
      )}

      {/* Doctor Cards Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map((doc) => (
            <Card key={doc.id} className="flex flex-col justify-between hover:border-teal-400 transition-colors">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center font-bold text-sm shrink-0">
                      Dr
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{doc.name}</h3>
                      <p className="text-xs text-teal-700 font-medium">{doc.specialization}</p>
                    </div>
                  </div>
                  <StatusBadge status={doc.status || 'Available'} size="xs" />
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="italic">{doc.qualifications || 'MBBS, MD'}</span>
                  <span>•</span>
                  <span>{doc.experienceYears || 5}y Exp</span>
                  <span>•</span>
                  <span className="text-amber-600 font-semibold">★ {doc.rating || 4.8}</span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <p className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{doc.hospital}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{doc.location}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{doc.availability}</span>
                  </p>
                  <p className="flex items-center gap-2 text-slate-700 font-medium">
                    <Video className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>Mode: {doc.consultationType}</span>
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  icon={Calendar}
                  onClick={() => handleStartBooking(doc)}
                >
                  Book Appointment
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!loading && !error && doctors.length === 0 && (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-xl space-y-2">
          <p className="font-semibold text-slate-700 text-sm">No Registered Specialists Found</p>
          <p className="text-slate-500 text-xs max-w-sm mx-auto">
            No clinicians matched your filter query. When doctors register and publish availability, they will appear live in this directory.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedDept('All');
            }}
            className="mt-3 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 cursor-pointer"
          >
            Clear Search Filters
          </button>
        </div>
      )}

      {/* Step-by-Step Appointment Booking Modal */}
      <Modal
        isOpen={!!bookingDoctor}
        onClose={() => setBookingDoctor(null)}
        title={bookingConfirmed ? 'Appointment Reserved' : `Book Consultation with ${bookingDoctor?.name}`}
        description={
          bookingConfirmed
            ? 'Your consultation has been submitted for clinician confirmation'
            : 'Step-by-step: Facility → Date & Time Slot → Review & Submit'
        }
      >
        {bookingConfirmed ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 text-sm">Appointment Request Submitted!</h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                Your consultation request with <strong>{bookingData.doctor}</strong> ({bookingData.department}) has been recorded in the database.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 text-left space-y-1.5">
              <p><strong>Appointment ID:</strong> <span className="font-mono text-teal-700 font-bold">{confirmedApt?.id}</span></p>
              <p><strong>Scheduled Slot:</strong> {bookingData.date} at {bookingData.time}</p>
              <p><strong>Hospital / Facility:</strong> {bookingData.hospital}</p>
              <p><strong>Consultation Mode:</strong> {bookingData.type}</p>
              <p><strong>Status:</strong> <span className="font-semibold text-amber-700">Pending Clinician Confirmation</span></p>
            </div>

            <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-lg text-[11px] text-teal-800 text-left flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <span>
                A persistent notification has been dispatched to Dr. {bookingDoctor?.name}. The status will update to <strong>CONFIRMED</strong> once accepted.
              </span>
            </div>

            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setBookingDoctor(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={() => navigate('/patient/appointments')}
              >
                View in Appointments
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {bookingError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{bookingError}</span>
              </div>
            )}

            {/* Step Indicators */}
            <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
              <span className={`font-semibold ${bookingStep >= 1 ? 'text-teal-700' : ''}`}>1. Facility</span>
              <span>→</span>
              <span className={`font-semibold ${bookingStep >= 2 ? 'text-teal-700' : ''}`}>2. Slot</span>
              <span>→</span>
              <span className={`font-semibold ${bookingStep === 3 ? 'text-teal-700' : ''}`}>3. Confirm</span>
            </div>

            {bookingStep === 1 && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Selected Hospital</label>
                  <input
                    type="text"
                    disabled
                    value={bookingData.hospital}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Department / Specialty</label>
                  <input
                    type="text"
                    disabled
                    value={bookingData.department}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Consultation Mode</label>
                  <select
                    value={bookingData.type}
                    onChange={(e) => setBookingData({ ...bookingData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                  >
                    <option value="Video Consultation">Video Consultation (Telemedicine)</option>
                    <option value="In-Person">In-Person Hospital Visit</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Reason for Visit / Symptoms</label>
                  <textarea
                    rows={2}
                    value={bookingData.notes}
                    onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                    placeholder="Briefly describe your symptoms or reason for consulting..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                  />
                </div>
                <div className="pt-2 flex justify-end">
                  <Button variant="primary" size="sm" onClick={() => setBookingStep(2)}>
                    Next: Choose Date & Slot
                  </Button>
                </div>
              </div>
            )}

            {bookingStep === 2 && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Appointment Date</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={bookingData.date}
                    onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Available Time Slots</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(bookingDoctor?.availableSlots || ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM']).map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setBookingData({ ...bookingData, time: slot })}
                        className={`p-2 rounded-lg border text-center font-medium cursor-pointer transition-colors ${
                          bookingData.time === slot
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-between">
                  <Button variant="outline" size="sm" onClick={() => setBookingStep(1)}>
                    Back
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => setBookingStep(3)}>
                    Next: Review
                  </Button>
                </div>
              </div>
            )}

            {bookingStep === 3 && (
              <form onSubmit={handleConfirmBooking} className="space-y-3 text-xs">
                <div className="p-3 bg-teal-50/50 border border-teal-200 rounded-lg space-y-1.5 text-slate-700">
                  <p><strong>Doctor:</strong> {bookingData.doctor}</p>
                  <p><strong>Hospital:</strong> {bookingData.hospital}</p>
                  <p><strong>Scheduled Slot:</strong> {bookingData.date} at {bookingData.time}</p>
                  <p><strong>Mode:</strong> {bookingData.type}</p>
                  {bookingData.notes && <p><strong>Notes:</strong> {bookingData.notes}</p>}
                </div>

                <div className="pt-2 flex justify-between">
                  <Button variant="outline" size="sm" disabled={bookingLoading} onClick={() => setBookingStep(2)}>
                    Back
                  </Button>
                  <Button type="submit" variant="primary" size="sm" disabled={bookingLoading}>
                    {bookingLoading ? (
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Reserving Slot...
                      </span>
                    ) : (
                      'Submit Appointment Request'
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
