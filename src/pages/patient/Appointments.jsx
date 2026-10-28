import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { mockAppointments } from '../../data/mockData';
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
} from 'lucide-react';

export default function Appointments() {
  const [activeTab, setActiveTab] = useState('All');
  const [appointmentsList, setAppointmentsList] = useState(mockAppointments);

  const filteredAppointments = appointmentsList.filter((apt) => {
    if (activeTab === 'All') return true;
    return apt.status.toLowerCase() === activeTab.toLowerCase();
  });

  const handleCancelAppointment = (id) => {
    setAppointmentsList((prev) =>
      prev.map((apt) => (apt.id === id ? { ...apt, status: 'Cancelled' } : apt))
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        badge="Patient Care"
        badgeStatus="Appointments Ledger"
        title="Consultation Appointments"
        subtitle="Manage upcoming clinical sessions, review completed visits, or reschedule"
        action={
          <Link to="/patient/find-doctor">
            <Button variant="primary" size="sm" icon={Plus}>
              Book New Appointment
            </Button>
          </Link>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 text-xs">
        {['All', 'Upcoming', 'Completed', 'Cancelled'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTab === tab
                ? 'bg-teal-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      <div className="space-y-3">
        {filteredAppointments.map((apt) => (
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
                      {apt.specialization}
                    </span>
                    <StatusBadge status={apt.status} size="xs" />
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{apt.hospital}</span>
                  </p>
                  <p className="text-xs text-slate-600 italic">
                    Clinical Note: {apt.notes}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                <div className="text-left sm:text-right text-xs">
                  <p className="font-semibold text-slate-900">{apt.date}</p>
                  <p className="text-slate-500">{apt.time} ({apt.type})</p>
                </div>

                <div className="flex items-center gap-2">
                  {apt.status === 'Upcoming' && (
                    <>
                      <Link to="/patient/consultations">
                        <Button variant="primary" size="sm" icon={Video}>
                          Join Tele-Room
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelAppointment(apt.id)}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                  {apt.status === 'Completed' && (
                    <Link to="/patient/prescriptions">
                      <Button variant="outline" size="sm">
                        View Prescription
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}

        {filteredAppointments.length === 0 && (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-xl text-slate-500 text-xs sm:text-sm">
            No appointments found in this category.
          </div>
        )}
      </div>
    </div>
  );
}
