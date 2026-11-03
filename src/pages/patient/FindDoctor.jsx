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
  ExternalLink,
  Sparkles,
  Stethoscope,
  X,
  Compass
} from 'lucide-react';

// Clinical problem to specialist mapping chips
const SPECIALTY_HELPER_CHIPS = [
  { label: 'Heart & BP', specialty: 'Cardiology', desc: 'Chest pain, high blood pressure, palpitations', emoji: '❤️' },
  { label: 'Skin & Rash', specialty: 'Dermatology', desc: 'Acne, eczema, psoriasis, itching, hair loss', emoji: '🧴' },
  { label: 'Eye & Vision', specialty: 'Ophthalmology', desc: 'Cataract, blurry vision, eye pain, glaucoma', emoji: '👁️' },
  { label: 'Bone & Joint', specialty: 'Orthopedics', desc: 'Fractures, arthritis, knee pain, back pain, spine', emoji: '🦴' },
  { label: 'Stomach & Digestion', specialty: 'Gastroenterology', desc: 'Acidity, GERD, liver, gas, abdominal pain', emoji: '🩺' },
  { label: 'Ear, Nose & Throat', specialty: 'ENT', desc: 'Sinus, hearing loss, tonsils, throat pain, vertigo', emoji: '👂' },
  { label: 'Brain & Nerves', specialty: 'Neurology', desc: 'Headaches, migraines, stroke, seizures, numbness', emoji: '🧠' },
  { label: 'Kidney & Dialysis', specialty: 'Nephrology', desc: 'Creatinine, chronic kidney disease, proteinuria', emoji: '🧪' },
  { label: 'Urine & Bladder', specialty: 'Urology', desc: 'Kidney stones, prostate, urinary infections', emoji: '🚻' },
  { label: 'Child Healthcare', specialty: 'Pediatrics', desc: 'Infant growth, child fever, pediatric vaccination', emoji: '👶' },
  { label: "Women's Health", specialty: 'Gynecology', desc: 'Pregnancy, menstruation, PCOS, fertility', emoji: '🌸' },
  { label: 'General Health & Fever', specialty: 'General Medicine', desc: 'Fever, cold, cough, fatigue, diabetes, checkup', emoji: '🌡️' },
  { label: 'Lungs & Breathing', specialty: 'Pulmonology', desc: 'Asthma, chronic cough, COPD, breathlessness', emoji: '🫁' }
];

const ALL_DEPARTMENTS = [
  'All',
  'General Medicine',
  'Cardiology',
  'Dermatology',
  'Ophthalmology',
  'Orthopedics',
  'Gastroenterology',
  'ENT',
  'Neurology',
  'Nephrology',
  'Urology',
  'Pediatrics',
  'Gynecology',
  'Pulmonology'
];

export default function FindDoctor() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const initialHospital = searchParams.get('hospital') || '';
  const initialDept = searchParams.get('specialty') || searchParams.get('department') || 'All';

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedDept, setSelectedDept] = useState(initialDept);
  const [activeHospital, setActiveHospital] = useState(initialHospital);
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

  // Sync with searchParams on navigation
  useEffect(() => {
    const hosp = searchParams.get('hospital');
    const dept = searchParams.get('specialty') || searchParams.get('department');
    const q = searchParams.get('search');
    if (hosp !== null) setActiveHospital(hosp);
    if (dept) setSelectedDept(dept);
    if (q) setSearchTerm(q);
  }, [searchParams]);

  // Fetch doctors dynamically from backend
  const fetchDoctors = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (selectedDept !== 'All') params.department = selectedDept;
      if (activeHospital.trim()) params.hospital = activeHospital.trim();
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
  }, [selectedDept, activeHospital]);

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
        badgeStatus="Verified Specialists"
        title="Find a Clinical Specialist"
        subtitle="Schedule in-person hospital visits or remote telemedicine consultations with certified medical specialists"
        action={
          <div className="w-full sm:w-72 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search doctor, symptom, specialty, hospital..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white focus:border-teal-500 focus:outline-hidden"
            />
          </div>
        }
      />

      {/* Active Hospital Affiliation Banner (from Find Hospital integration) */}
      {activeHospital && (
        <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between text-xs text-teal-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-teal-700 shrink-0" />
            <span>
              Showing certified doctors affiliated with: <strong className="text-teal-950 font-bold">{activeHospital}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveHospital('')}
            className="text-xs font-bold text-teal-800 hover:text-teal-950 inline-flex items-center gap-1 cursor-pointer bg-white px-2.5 py-1 rounded-md border border-teal-200"
          >
            <X className="w-3 h-3" /> Clear Hospital Filter
          </button>
        </div>
      )}

      {/* Patient Symptom-to-Specialist Quick Helper */}
      <div className="p-4 bg-gradient-to-r from-blue-50/60 to-teal-50/60 border border-slate-200 rounded-2xl shadow-2xs space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
          <Sparkles className="w-4 h-4 text-teal-600" />
          <span>Need help choosing a specialist? Select your primary health concern:</span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {SPECIALTY_HELPER_CHIPS.map((chip) => {
            const isSelected = selectedDept.toLowerCase() === chip.specialty.toLowerCase();
            return (
              <button
                key={chip.specialty}
                type="button"
                onClick={() => {
                  if (isSelected) {
                    setSelectedDept('All');
                  } else {
                    setSelectedDept(chip.specialty);
                    setSearchTerm('');
                  }
                }}
                className={`px-3 py-1.5 rounded-lg border font-medium inline-flex items-center gap-1.5 transition-all cursor-pointer text-xs ${
                  isSelected
                    ? 'bg-teal-700 text-white border-teal-700 shadow-2xs scale-102'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                }`}
                title={chip.desc}
              >
                <span>{chip.emoji}</span>
                <span>{chip.label}</span>
                <span className="text-[10px] opacity-75 font-mono">({chip.specialty})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Specialty Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-500 font-medium shrink-0 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Department:
        </span>
        {ALL_DEPARTMENTS.map((dept) => (
          <button
            key={dept}
            onClick={() => setSelectedDept(dept)}
            className={`px-3 py-1.5 rounded-lg border font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedDept.toLowerCase() === dept.toLowerCase()
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
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-slate-900 text-sm">{doc.name}</h3>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" title="Verified Practitioner" />
                      </div>
                      <p className="text-xs text-teal-700 font-semibold">{doc.specialization}</p>
                      <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.2 rounded inline-block mt-0.5">
                        {doc.department}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={doc.status || 'Available'} size="xs" />
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                  <span className="italic font-medium text-slate-700">{doc.qualifications || 'MBBS, MD'}</span>
                  <span>•</span>
                  <span>{doc.experienceYears || 5}y Exp</span>
                  <span>•</span>
                  <span className="text-amber-600 font-semibold">★ {doc.rating || 4.8}</span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 truncate">
                      <Building className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <strong className="text-slate-800 truncate">{doc.hospital}</strong>
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate(`/patient/find-hospital?search=${encodeURIComponent(doc.hospital)}`)}
                      className="text-[10px] text-teal-700 hover:text-teal-900 font-bold shrink-0 underline cursor-pointer inline-flex items-center gap-0.5"
                      title="View hospital location on map"
                    >
                      Hospital Map <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{doc.location}</span>
                  </p>

                  <p className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{doc.availability}</span>
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-50 text-[11px]">
                    <span className="flex items-center gap-1 text-slate-700 font-medium">
                      <Video className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      {doc.consultationType}
                    </span>
                    <span className="font-bold text-slate-900">
                      ₹{doc.consultationFee || 500} / visit
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full font-bold"
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
          <Stethoscope className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="font-semibold text-slate-700 text-sm">No Registered Specialists Found</p>
          <p className="text-slate-500 text-xs max-w-sm mx-auto">
            No clinicians matched your filter query. When doctors register and publish availability, they will appear live in this directory.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedDept('All');
              setActiveHospital('');
            }}
            className="mt-3 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 cursor-pointer"
          >
            Clear All Filters
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

            {confirmedApt && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5 text-left max-w-sm mx-auto">
                <p><strong>Appointment ID:</strong> {confirmedApt.id}</p>
                <p><strong>Hospital:</strong> {confirmedApt.hospital_name || bookingData.hospital}</p>
                <p><strong>Date & Time:</strong> {confirmedApt.appointment_date} at {confirmedApt.time_slot}</p>
                <p><strong>Mode:</strong> {confirmedApt.type}</p>
                <p><strong>Status:</strong> <span className="text-emerald-700 font-semibold">{confirmedApt.status || 'SCHEDULED'}</span></p>
              </div>
            )}

            <div className="pt-2 flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setBookingDoctor(null);
                  setBookingConfirmed(false);
                }}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setBookingDoctor(null);
                  navigate('/patient/appointments');
                }}
              >
                Go to My Appointments
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleConfirmBooking} className="space-y-4 text-xs">
            {bookingError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
                {bookingError}
              </div>
            )}

            {/* Doctor Info Header */}
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg flex items-center justify-between">
              <div>
                <strong className="text-teal-900 block font-bold">{bookingDoctor?.name}</strong>
                <span className="text-teal-700 text-[11px]">{bookingDoctor?.specialization} • {bookingDoctor?.qualifications}</span>
              </div>
              <span className="text-sm font-bold text-teal-950">₹{bookingDoctor?.consultationFee || 500}</span>
            </div>

            {/* Step 1: Hospital Facility Confirmation */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">Hospital Facility</label>
              <input
                type="text"
                value={bookingData.hospital}
                disabled
                className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 text-xs cursor-not-allowed"
              />
            </div>

            {/* Step 2: Consultation Mode */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">Consultation Type</label>
              <div className="grid grid-cols-2 gap-2">
                {['Video Consultation', 'In-Person Hospital Visit'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setBookingData({ ...bookingData, type })}
                    className={`p-2.5 rounded-lg border text-left font-medium transition-colors cursor-pointer ${
                      bookingData.type === type
                        ? 'border-teal-600 bg-teal-50 text-teal-900 font-semibold'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block">{type}</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      {type === 'Video Consultation' ? 'Telemedicine via browser WebRTC' : 'Physical OPD clinic visit'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Date & Slot Selection */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 block">Preferred Date</label>
                <input
                  type="date"
                  min={defaultDateStr}
                  value={bookingData.date}
                  onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs focus:border-teal-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 block">Time Slot</label>
                <select
                  value={bookingData.time}
                  onChange={(e) => setBookingData({ ...bookingData, time: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs focus:border-teal-500"
                  required
                >
                  <option value="">Select an available slot</option>
                  {(bookingDoctor?.availableSlots || ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM']).map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes / Reason */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">Clinical Symptoms / Reason for Visit</label>
              <textarea
                rows="2"
                value={bookingData.notes}
                onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                placeholder="Briefly describe your symptoms or reason for this appointment..."
                className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:border-teal-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setBookingDoctor(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={bookingLoading || !bookingData.time}
                className="font-bold"
              >
                {bookingLoading ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Reserving Slot...
                  </span>
                ) : (
                  'Confirm & Reserve Appointment'
                )}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
