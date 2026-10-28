import React, { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  FileText,
  Send,
  User,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DoctorConsultations() {
  const [inCall, setInCall] = useState(false);
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [sessionNotes, setSessionNotes] = useState([
    'Patient logged morning BP: 126/82 mmHg.',
    'Reviewing 4-week Telmisartan 40mg response.',
  ]);

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!doctorNotes.trim()) return;
    setSessionNotes([...sessionNotes, doctorNotes]);
    setDoctorNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        badge="Telemedicine Suite"
        badgeStatus={inCall ? 'Session Live' : 'Room Ready'}
        title="Clinician Tele-Consultation Room"
        subtitle="Connecting with Rahul Sharma (PID-2026-089) • Session #APT-101 (Demo consultation room)"
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Area */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 rounded-xl overflow-hidden aspect-video flex flex-col items-center justify-center relative border border-slate-800 shadow-md">
            {inCall ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-white relative">
                <div className="w-20 h-20 rounded-full bg-teal-700 flex items-center justify-center text-2xl font-bold mb-3 border-2 border-teal-400">
                  RS
                </div>
                <h3 className="text-base font-semibold">Rahul Sharma</h3>
                <p className="text-xs text-slate-400">42y / Male • PID-2026-089</p>
                <span className="absolute top-4 left-4 bg-emerald-600/90 text-white text-[11px] px-2.5 py-1 rounded flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span> Patient Connected (Demo Live 04:12)
                </span>

                <div className="absolute bottom-4 right-4 w-32 aspect-video bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-center text-[10px] text-slate-300">
                  Dr. Ananya Sen (You)
                </div>
              </div>
            ) : (
              <div className="text-center p-6 text-slate-400 space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-teal-400 border border-slate-700">
                  <Video className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Telemedicine Session Waiting Room</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Patient <strong>Rahul Sharma</strong> is in the waiting queue.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="md"
                  icon={Video}
                  onClick={() => setInCall(true)}
                  className="mt-2"
                >
                  Connect Tele-Consultation
                </Button>
              </div>
            )}

            {inCall && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-800/90 backdrop-blur-xs px-4 py-2 rounded-xl flex items-center gap-3 border border-slate-700">
                <button
                  onClick={() => setMicActive(!micActive)}
                  className={`p-2 rounded-lg cursor-pointer transition-colors ${
                    micActive ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-rose-600 text-white'
                  }`}
                  title="Toggle Mic"
                >
                  {micActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setVideoActive(!videoActive)}
                  className={`p-2 rounded-lg cursor-pointer transition-colors ${
                    videoActive ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-rose-600 text-white'
                  }`}
                  title="Toggle Camera"
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

        {/* Session Clinical Notes */}
        <div className="space-y-4">
          <Card title="Session Clinical Notes" icon={FileText}>
            <div className="space-y-3 text-xs">
              <div className="h-44 overflow-y-auto space-y-2 pr-1">
                {sessionNotes.map((note, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 leading-relaxed">
                    {note}
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddNote} className="flex gap-2 pt-2 border-t border-slate-100">
                <input
                  type="text"
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  placeholder="Record clinical finding..."
                  className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:border-teal-500"
                />
                <Button type="submit" variant="primary" size="sm" icon={Send}>
                  Save
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
