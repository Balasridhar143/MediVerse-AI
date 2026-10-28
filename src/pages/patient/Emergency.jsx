import React from 'react';
import { mockHospitals } from '../../data/mockData';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import {
  Siren,
  Phone,
  AlertTriangle,
  Building,
  MapPin,
} from 'lucide-react';

export default function Emergency() {
  const emergencyContacts = [
    { name: 'National Central Ambulance Dispatch', number: '108', type: 'Immediate Response' },
    { name: 'City Care Hospital Trauma Unit', number: '+91 11 2345 9999', type: 'Direct Trauma Bay' },
    { name: 'Metro General Trauma Hotline', number: '+91 11 3456 9999', type: '24x7 Ambulance' },
    { name: 'Primary Caregiver / Family (Pooja Sharma)', number: '+91 98765 43210', type: 'Emergency Contact' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. Clear Emergency Warning Section */}
      <div className="p-5 bg-rose-50 border-2 border-rose-300 rounded-xl space-y-2">
        <div className="flex items-center gap-2 text-rose-800">
          <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
          <h1 className="text-lg md:text-xl font-bold">
            Medical Emergency Notice
          </h1>
        </div>
        <p className="text-xs md:text-sm text-rose-900 leading-relaxed font-medium">
          If you or someone around you is experiencing severe chest pain, shortness of breath, loss of consciousness, uncontrolled bleeding, or sudden paralysis/stroke symptoms: <strong>Do NOT wait for telemedicine consultations or text messages. Call Emergency Services immediately.</strong>
        </p>
        <p className="text-[11px] text-rose-700 italic">
          *Notice: AI algorithms and telemedicine chat are NEVER used for acute emergency diagnosis or triage dispatch. Immediate human clinical intervention is mandatory.
        </p>
      </div>

      {/* 2. Direct Call Emergency Button (Zero extra clicks, large visible touch target) */}
      <Card className="text-center p-6 sm:p-8 space-y-4">
        <span className="text-xs uppercase font-bold tracking-wider text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200 inline-block">
          Immediate Emergency Dispatch
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
          Dial Emergency: 108
        </h2>
        <p className="text-xs md:text-sm text-slate-500 max-w-md mx-auto">
          Tap the button below to connect immediately with the nearest centralized ambulance control center.
        </p>
        <div className="pt-2">
          <a
            href="tel:108"
            className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-lg rounded-xl shadow-md transition-transform active:scale-95"
          >
            <Phone className="w-6 h-6 animate-pulse" />
            <span>Call 108 Immediately</span>
          </a>
        </div>
      </Card>

      {/* 3. Nearby 24x7 Hospitals */}
      <Card title="Nearby 24x7 Emergency Hospitals" icon={Building}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {mockHospitals.map((hosp) => (
            <div
              key={hosp.id}
              className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-slate-900 text-sm">{hosp.name}</h3>
                <StatusBadge status="24x7 Open" size="xs" />
              </div>
              <p className="text-slate-600 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {hosp.location}
              </p>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="text-slate-700 font-semibold">{hosp.emergencyPhone}</span>
                <a
                  href={`tel:${hosp.emergencyPhone.split('/')[0].trim()}`}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Call Hospital
                </a>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 4. Emergency Contacts */}
      <Card title="Emergency Contact Directory" icon={Phone}>
        <div className="divide-y divide-slate-100 text-xs">
          {emergencyContacts.map((contact, idx) => (
            <div key={idx} className="py-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-slate-900">{contact.name}</p>
                <span className="text-slate-500 text-[11px]">{contact.type}</span>
              </div>
              <a
                href={`tel:${contact.number}`}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg border border-slate-200 flex items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5 text-teal-600" />
                {contact.number}
              </a>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
