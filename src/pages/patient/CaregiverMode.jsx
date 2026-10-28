import React, { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import CaregiverAlertCard from '../../components/CaregiverAlertCard';
import Modal from '../../components/Modal';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  PhoneCall,
  Calendar,
  Clock,
  Pill,
  Heart,
  Siren,
  CheckCircle2,
  AlertCircle,
  Lock,
  Eye,
  FileText,
  UserCheck,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { mockMedicines, mockAppointments, mockFollowUps } from '../../data/mockData';

export default function CaregiverMode() {
  // Consent-based authorization state (Requirement 19: Privacy & Consent)
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [simulatedCallStatus, setSimulatedCallStatus] = useState('');

  // Primary Caregiver Profile
  const caregiverInfo = {
    name: 'Pooja Sharma',
    relationship: 'Spouse / Primary Proxy',
    phone: '+91 98765 43210',
    email: 'pooja.sharma@example.com',
    patientName: 'Gokul Sankar',
    patientId: 'PID-2026-089',
    authorizationDate: '15 Jan 2026',
    consentScope: 'Emergency Triage, Medication Adherence Oversight, Appointment Alerts',
  };

  // Live Caregiver Alerts
  const [alertsList, setAlertsList] = useState([
    {
      id: 'alt_1',
      title: '🟡 Medication not acknowledged',
      description: 'Morning medication (Telmisartan 40 mg) has not been acknowledged past the scheduled 08:00 AM window.',
      time: '08:30 AM Today',
      severity: 'high',
      tag: 'MEDICATION ESCALATION',
      patientNote: 'Expected dose after breakfast. Re-prompt at 08:15 AM unconfirmed.',
    },
    {
      id: 'alt_2',
      title: '📅 Upcoming Clinical Follow-up Review',
      description: 'Dr. Ananya Sen scheduled a hypertension review target for 05 Oct 2026.',
      time: 'Yesterday',
      severity: 'medium',
      tag: 'FOLLOW-UP TARGET',
      patientNote: 'Evaluation of blood pressure response after 4 weeks of Telmisartan.',
    },
  ]);

  // Derived Medication status for today
  const morningMed = mockMedicines.find((m) => m.timing.includes('Morning')) || mockMedicines[0];
  const afternoonMed = mockMedicines.find((m) => m.timing.includes('Noon')) || {
    id: 'med_noon',
    name: 'Atorvastatin (Simulated)',
    dosage: '10 mg',
    slotName: 'Afternoon Medicine',
    status: 'Not Acknowledged',
    reminderTime: '01:30 PM',
  };
  const nightMed = mockMedicines.find((m) => m.timing.includes('Night')) || mockMedicines[2];

  const handleResolveAlert = (id) => {
    setAlertsList((prev) => prev.filter((a) => a.id !== id));
  };

  const handleTriggerContact = (alert) => {
    setSelectedAlert(alert);
    setContactModalOpen(true);
    setSimulatedCallStatus('');
  };

  const handleSimulateCall = () => {
    setSimulatedCallStatus('Connecting call to Gokul Sankar (+91 98765 43210)... [Prototype Action: Simulated Direct Call]');
    setTimeout(() => {
      setSimulatedCallStatus('Call connected. Caregiver in direct contact with patient.');
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* 1. Header with Consent Status */}
      <PageHeader
        badge="Caregiver Mode & Oversight"
        badgeStatus={isAuthorized ? 'Consent Granted' : 'Access Restricted'}
        title="Authorized Caregiver Dashboard"
        subtitle={`Viewing clinical safety oversight for ${caregiverInfo.patientName} (${caregiverInfo.patientId})`}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAuthorized(!isAuthorized)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                isAuthorized
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Consent: {isAuthorized ? 'Authorized ✓' : 'Revoked ✕'}</span>
            </button>
            <Link to="/patient/emergency">
              <Button variant="danger" size="sm" icon={Siren}>
                Emergency Portal
              </Button>
            </Link>
          </div>
        }
      />

      {/* 2. Consent Notice (Requirement 19: Privacy & Consent) */}
      {!isAuthorized ? (
        <Card title="Caregiver Access Restricted" icon={Lock}>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs text-slate-700">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>Patient Consent Not Active</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              In compliance with patient privacy and healthcare data protection policies, caregiver oversight access must be explicitly authorized by the patient. Full electronic health records, diagnostic laboratory reports, and prescription histories are not exposed.
            </p>
            <Button
              variant="primary"
              size="sm"
              icon={ShieldCheck}
              onClick={() => setIsAuthorized(true)}
            >
              Re-authorize Caregiver Consent (Prototype Toggle)
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Caregiver Identity & Verification Banner */}
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs shrink-0">
                PS
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-slate-900 text-sm">{caregiverInfo.name}</h3>
                  <span className="text-[10px] text-teal-800 bg-teal-50 px-2 py-0.5 rounded font-bold border border-teal-200">
                    {caregiverInfo.relationship}
                  </span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                    ● Authorized Proxy
                  </span>
                </div>
                <p className="text-slate-500 text-xs">
                  Direct Phone: <strong className="text-slate-700">{caregiverInfo.phone}</strong> • Patient ID:{' '}
                  <strong className="text-slate-700 font-mono">{caregiverInfo.patientId}</strong>
                </p>
                <p className="text-[11px] text-slate-400">
                  Authorized Scope: {caregiverInfo.consentScope}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <a
                href={`tel:${caregiverInfo.phone}`}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 flex items-center gap-1.5 transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call Patient</span>
              </a>
            </div>
          </div>

          {/* 3. Section 7: Caregiver Alerts Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
                  Caregiver Alerts & Safety Notifications
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                {alertsList.length} Active Safety Items
              </span>
            </div>

            {alertsList.length > 0 ? (
              <div className="space-y-3">
                {alertsList.map((alert) => (
                  <CaregiverAlertCard
                    key={alert.id}
                    alert={alert}
                    onView={(a) => setSelectedAlert(a)}
                    onContactPatient={handleTriggerContact}
                    onResolve={handleResolveAlert}
                  />
                ))}
              </div>
            ) : (
              <div className="p-6 bg-white border border-slate-200 rounded-xl text-center text-xs text-slate-500 space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                <strong className="block text-slate-800">All Reminders Acknowledged</strong>
                <span>No active escalation alerts for your review at this time.</span>
              </div>
            )}
          </div>

          {/* 4. Section 6: Caregiver Dashboard Grid (Today's Medication Status & Upcoming Appointments) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Today's Medication Status */}
            <Card
              title="Today's Medication Status"
              subtitle="Real-time adherence logging & acknowledgment state"
              icon={Pill}
              action={
                <Link
                  to="/patient/medicines"
                  className="text-xs font-semibold text-teal-700 hover:underline flex items-center gap-1"
                >
                  Manage Doses <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              }
            >
              <div className="space-y-3 text-xs">
                {/* Morning Medication */}
                <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      AM
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">
                          MORNING MEDICATION
                        </span>
                        <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100/70 px-2 py-0.5 rounded">
                          ✓ Acknowledged
                        </span>
                      </div>
                      <p className="text-slate-700 font-semibold mt-0.5">
                        {morningMed.name} ({morningMed.dosage})
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Scheduled: 08:00 AM • Logged taken at 08:04 AM
                      </p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                </div>

                {/* Afternoon Medication */}
                <div className="p-3 bg-amber-50/60 border border-amber-300 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      NOON
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">
                          AFTERNOON MEDICATION
                        </span>
                        <span className="text-[10px] text-amber-900 font-bold bg-amber-100 px-2 py-0.5 rounded">
                          ⚠ Not acknowledged
                        </span>
                      </div>
                      <p className="text-slate-700 font-semibold mt-0.5">
                        {afternoonMed.name} ({afternoonMed.dosage})
                      </p>
                      <p className="text-[11px] text-amber-800 font-medium">
                        Scheduled: {afternoonMed.reminderTime} • Caregiver prompt active
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTriggerContact(alertsList[0])}
                    className="px-2.5 py-1 text-xs font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-300 rounded-lg cursor-pointer transition-colors"
                  >
                    Check In
                  </button>
                </div>

                {/* Night Medication */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      PM
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">
                          NIGHT MEDICATION
                        </span>
                        <span className="text-[10px] text-slate-600 font-bold bg-slate-200 px-2 py-0.5 rounded">
                          Scheduled Later
                        </span>
                      </div>
                      <p className="text-slate-700 font-semibold mt-0.5">
                        {nightMed.name} ({nightMed.dosage})
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Scheduled: 09:00 PM (After dinner)
                      </p>
                    </div>
                  </div>
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
              </div>
            </Card>

            {/* Upcoming Appointments & Follow-up Targets */}
            <Card
              title="Appointments & Follow-ups"
              subtitle="Confirmed clinical visits and scheduled doctor reviews"
              icon={Calendar}
              action={
                <Link
                  to="/patient/appointments"
                  className="text-xs font-semibold text-teal-700 hover:underline flex items-center gap-1"
                >
                  All Visits <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              }
            >
              <div className="space-y-3 text-xs">
                {/* Next Appointment */}
                {mockAppointments[0] && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">
                        Next Consultation Visit
                      </span>
                      <StatusBadge status={mockAppointments[0].status} size="xs" />
                    </div>
                    <p className="font-semibold text-slate-800 text-sm">
                      {mockAppointments[0].doctorName} ({mockAppointments[0].specialization})
                    </p>
                    <p className="text-slate-600 text-xs flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {mockAppointments[0].date} at {mockAppointments[0].time} • {mockAppointments[0].type}
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-500 italic">
                      Hospital: {mockAppointments[0].hospital}
                    </p>
                  </div>
                )}

                {/* Follow-up Target */}
                {mockFollowUps[0] && (
                  <div className="p-3 bg-teal-50/40 border border-teal-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-teal-900 text-xs">
                        RECOMMENDED FOLLOW-UP
                      </span>
                      <span className="text-[10px] font-bold text-teal-800 bg-white px-2 py-0.5 rounded border border-teal-200">
                        {mockFollowUps[0].followUpDate}
                      </span>
                    </div>
                    <p className="text-slate-800 font-semibold">
                      Dr. Ananya Sen (Cardiology Review)
                    </p>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {mockFollowUps[0].reason}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* 5. Emergency Contact Information Card */}
          <Card
            title="Emergency Contact & Rapid Response Directory"
            subtitle="Immediate healthcare escalation points in case of sudden distress"
            icon={Siren}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                <span className="text-rose-700 font-bold uppercase text-[10px] tracking-wider block">
                  National Ambulance
                </span>
                <strong className="text-lg font-extrabold text-rose-900 block">
                  108 / 112
                </strong>
                <span className="text-rose-700 text-[11px] block">
                  24x7 Emergency Medical Response
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider block">
                  Registered Hospital
                </span>
                <strong className="text-sm font-bold text-slate-900 block">
                  City Care Multispeciality Hospital
                </strong>
                <span className="text-slate-600 text-[11px] block">
                  Emergency ER: +91 11 2345 6789
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider block">
                  Attending Primary Clinician
                </span>
                <strong className="text-sm font-bold text-slate-900 block">
                  Dr. Arun Kumar (General Medicine)
                </strong>
                <span className="text-slate-600 text-[11px] block">
                  OPD Hotline: +91 98765 12345
                </span>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Simulated Contact Patient Modal */}
      <Modal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        title="Contact Patient: Gokul Sankar"
        description="Caregiver check-in regarding medication or scheduled appointment reminder"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] text-slate-400 italic">
              Prototype action: Telecommunication simulated
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setContactModalOpen(false)}>
                Close
              </Button>
              <Button variant="primary" size="sm" icon={PhoneCall} onClick={handleSimulateCall}>
                Simulate Call
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4 text-xs text-slate-700">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-slate-500 block text-[11px]">Subject / Trigger:</span>
            <strong className="text-slate-900 text-sm block">
              {selectedAlert?.title || 'Medication Check-in'}
            </strong>
            <p className="text-slate-600 text-xs">
              {selectedAlert?.description || 'Morning medication has not been acknowledged.'}
            </p>
          </div>

          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-900">
            <p className="font-semibold">Patient Phone: +91 98765 43210</p>
            <p className="text-[11px] text-teal-700 mt-0.5">
              Clicking "Simulate Call" triggers a simulated direct telephony connection. No SMS/Push is claimed without an active SMS gateway.
            </p>
          </div>

          {simulatedCallStatus && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 font-medium text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{simulatedCallStatus}</span>
            </div>
          )}
        </div>
      </Modal>

      {/* Alert View Details Modal */}
      <Modal
        isOpen={!!selectedAlert && !contactModalOpen}
        onClose={() => setSelectedAlert(null)}
        title={selectedAlert?.title || 'Alert Details'}
        description={selectedAlert?.time}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setSelectedAlert(null)}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={PhoneCall}
              onClick={() => {
                setContactModalOpen(true);
              }}
            >
              Contact Patient
            </Button>
          </>
        }
      >
        {selectedAlert && (
          <div className="space-y-3 text-xs text-slate-700">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-slate-400 block text-[11px]">Severity / Tag:</span>
              <strong className="text-amber-800">{selectedAlert.tag}</strong>
              <p className="text-slate-900 text-sm font-semibold mt-1">
                {selectedAlert.description}
              </p>
            </div>
            <p className="text-slate-600 italic leading-relaxed">
              Note: {selectedAlert.patientNote}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
