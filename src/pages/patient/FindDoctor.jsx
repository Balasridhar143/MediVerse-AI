import React, { useState } from 'react';
import { mockDoctors } from '../../data/mockData';
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
  Stethoscope,
} from 'lucide-react';

export default function FindDoctor() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [bookingDoctor, setBookingDoctor] = useState(null);

  // Step-by-step booking state
  const [bookingStep, setBookingStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    hospital: '',
    department: '',
    doctor: '',
    date: '2026-09-30',
    time: '',
    type: 'Video Consultation',
  });
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  const filteredDoctors = mockDoctors.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.hospital.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'All' || doc.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const handleStartBooking = (doctor) => {
    setBookingDoctor(doctor);
    setBookingData({
      hospital: doctor.hospital,
      department: doctor.department,
      doctor: doctor.name,
      date: '2026-09-30',
      time: doctor.availableSlots[0] || '10:00 AM',
      type: 'Video Consultation',
    });
    setBookingStep(1);
    setBookingConfirmed(false);
  };

  const handleConfirmBooking = (e) => {
    e.preventDefault();
    setBookingConfirmed(true);
  };

  return (
    <div className="space-y-6">
      {/* 1. Standard Page Header */}
      <PageHeader
        badge="Doctor Directory"
        badgeStatus="Telemedicine Active"
        title="Find a Clinical Specialist"
        subtitle="Schedule in-person hospital visits or remote telemedicine consultations"
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
        {['All', 'Cardiology', 'Neurology', 'General Medicine', 'Pediatrics', 'Emergency & Trauma'].map((dept) => (
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

      {/* Doctor Cards Grid (Scannable: Doctor, Specialization, Hospital, Location, Availability, Consultation Type, Book Button) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDoctors.map((doc) => (
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

              <p className="text-[11px] text-slate-400 italic">{doc.qualifications}</p>

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

      {filteredDoctors.length === 0 && (
        <div className="p-8 text-center bg-white border border-slate-200 rounded-xl text-slate-500 text-sm">
          No specialists found matching your search. Please clear filters or try a different specialty.
        </div>
      )}

      {/* Step-by-Step Appointment Booking Modal using Reusable Modal */}
      <Modal
        isOpen={!!bookingDoctor}
        onClose={() => setBookingDoctor(null)}
        title={bookingConfirmed ? 'Appointment Confirmed' : `Book Consultation with ${bookingDoctor?.name}`}
        description={
          bookingConfirmed
            ? 'Your consultation details have been recorded'
            : 'Step-by-step: Hospital → Department → Mode → Date & Slot → Confirmation'
        }
      >
        {bookingConfirmed ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
              Your consultation with <strong>{bookingData.doctor}</strong> ({bookingData.department}) has been successfully confirmed for <strong>{bookingData.date}</strong> at <strong>{bookingData.time}</strong>.
            </p>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 text-left space-y-1">
              <p><strong>Hospital:</strong> {bookingData.hospital}</p>
              <p><strong>Consultation Mode:</strong> {bookingData.type}</p>
              <p><strong>Status:</strong> Tele-Room link registered in your appointments ledger</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              className="w-full mt-2"
              onClick={() => setBookingDoctor(null)}
            >
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
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
                  <label className="block font-medium text-slate-700 mb-1">Department</label>
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
                    value={bookingData.date}
                    onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Available Time Slots</label>
                  <div className="grid grid-cols-2 gap-2">
                    {bookingDoctor?.availableSlots?.map((slot) => (
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
                </div>

                <div className="pt-2 flex justify-between">
                  <Button variant="outline" size="sm" onClick={() => setBookingStep(2)}>
                    Back
                  </Button>
                  <Button type="submit" variant="primary" size="sm">
                    Confirm & Reserve Slot
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
