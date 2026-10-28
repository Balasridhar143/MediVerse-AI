import React, { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Calendar,
  Clock,
  Building,
  Send,
  ShieldCheck,
  Stethoscope,
  Info,
} from 'lucide-react';

export default function Consultation() {
  const [inCall, setInCall] = useState(false);
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [notesList, setNotesList] = useState([
    {
      sender: 'Patient',
      text: 'Recorded morning BP: 126/82 mmHg. Experiencing mild dizziness when standing quickly.',
      time: '10:14 AM',
    },
    {
      sender: 'Dr. Ananya Sen',
      text: 'Good morning Rahul. We will review your 4-week Telmisartan response and lipid test now.',
      time: '10:15 AM',
    },
  ]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!clinicalNotes.trim()) return;
    setNotesList([
      ...notesList,
      {
        sender: 'Patient',
        text: clinicalNotes,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setClinicalNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        badge="Telemedicine Suite"
        badgeStatus={inCall ? 'Call In Progress' : 'Room Ready'}
        title="Video Consultation"
        subtitle="Encrypted clinician-patient telemedicine room for remote clinical evaluations (Demo consultation room)"
        action={
          <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Encrypted Session: #APT-101</span>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Video Area */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 rounded-xl overflow-hidden aspect-video flex flex-col items-center justify-center relative border border-slate-800 shadow-md">
            {inCall ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-white relative">
                <div className="w-20 h-20 rounded-full bg-teal-700 flex items-center justify-center text-2xl font-bold mb-3 border-2 border-teal-400">
                  Dr
                </div>
                <h3 className="text-base font-semibold">Dr. Ananya Sen, MD</h3>
                <p className="text-xs text-slate-400">Cardiology & Internal Medicine</p>
                <span className="absolute top-4 left-4 bg-emerald-600/90 text-white text-[11px] px-2.5 py-1 rounded flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span> Live 03:42 (Demo Session)
                </span>

                {/* Self View Box */}
                <div className="absolute bottom-4 right-4 w-32 aspect-video bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-center text-[10px] text-slate-300">
                  Patient Camera (You)
                </div>
              </div>
            ) : (
              <div className="text-center p-6 text-slate-400 space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-teal-400 border border-slate-700">
                  <Video className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Telemedicine Waiting Room</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Click <strong>"Start Video Consultation"</strong> below to connect with Dr. Ananya Sen.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="md"
                  icon={Video}
                  onClick={() => setInCall(true)}
                  className="mt-2"
                >
                  Start Video Consultation
                </Button>
              </div>
            )}

            {/* In-Call Controls */}
            {inCall && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-800/90 backdrop-blur-xs px-4 py-2 rounded-xl flex items-center gap-3 border border-slate-700">
                <button
                  onClick={() => setMicActive(!micActive)}
                  className={`p-2 rounded-lg cursor-pointer transition-colors ${
                    micActive ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-rose-600 text-white'
                  }`}
                  title={micActive ? 'Mute Mic' : 'Unmute Mic'}
                >
                  {micActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setVideoActive(!videoActive)}
                  className={`p-2 rounded-lg cursor-pointer transition-colors ${
                    videoActive ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-rose-600 text-white'
                  }`}
                  title={videoActive ? 'Turn Off Camera' : 'Turn On Camera'}
                >
                  {videoActive ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setInCall(false)}
                  className="p-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white cursor-pointer transition-colors"
                  title="End Consultation"
                >
                  <PhoneOff className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Doctor & Appointment Details + Clinical Notes */}
        <div className="space-y-4">
          <Card
            title="Attending Clinician"
            subtitle="Scheduled Physician Details"
            icon={Stethoscope}
          >
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <h4 className="font-bold text-slate-900 text-sm">Dr. Ananya Sen</h4>
                <p className="text-teal-700 font-medium">Cardiology & Internal Medicine</p>
                <p className="text-[11px] text-slate-500 mt-0.5">City Care Multispeciality Hospital</p>
              </div>

              <div className="space-y-1.5 text-slate-600 pt-1">
                <p className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Date: <strong>Today, Sep 28, 2026</strong></span>
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Slot: <strong>10:15 AM - 10:45 AM</strong></span>
                </p>
                <p className="flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>OPD Reference: #APT-101</span>
                </p>
              </div>
            </div>
          </Card>

          {/* Clinical Session Notes & Messages */}
          <Card
            title="Consultation Notes & Symptoms"
            subtitle="Record symptoms or query logs during session"
          >
            <div className="space-y-3">
              <div className="h-44 overflow-y-auto space-y-2 pr-1 text-xs">
                {notesList.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg border ${
                      msg.sender === 'Patient'
                        ? 'bg-teal-50/70 border-teal-200 text-teal-900 ml-3'
                        : 'bg-slate-50 border-slate-200 text-slate-800 mr-3'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1 text-[10px] text-slate-500 font-semibold">
                      <span>{msg.sender}</span>
                      <span>{msg.time}</span>
                    </div>
                    <p>{msg.text}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-slate-100">
                <input
                  type="text"
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Share a clinical note or vital reading..."
                  className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:border-teal-500"
                />
                <Button type="submit" variant="primary" size="sm" icon={Send}>
                  Send
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
