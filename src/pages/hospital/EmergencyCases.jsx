import React, { useState } from 'react';
import { mockEmergencyCases } from '../../data/mockData';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import { Siren, Plus, PhoneCall } from 'lucide-react';

export default function EmergencyCases() {
  const [cases, setCases] = useState(mockEmergencyCases);

  const handleUpdateStatus = (id, newStatus) => {
    setCases((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        badge="Trauma Unit Roster"
        badgeStatus="24x7 Red Alert Line"
        title="Emergency & Trauma Unit Live Admissions"
        subtitle="Real-time triage ledger, critical resuscitation bay status, and attending trauma specialists"
        action={
          <div className="flex items-center gap-2">
            <a
              href="tel:108"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              Trauma Dispatch (108)
            </a>
            <Button
              variant="outline"
              size="sm"
              icon={Plus}
              onClick={() => alert('Prototype action: Immediate Trauma Admission Log')}
            >
              Log Emergency Arrival
            </Button>
          </div>
        }
      />

      {/* Emergency Active Admissions Table */}
      <Card title="Live Resuscitation & Triage Cases" icon={Siren}>
        <div className="overflow-x-auto -mx-4 md:-mx-5">
          <div className="inline-block min-w-full align-middle px-4 md:px-5">
            <table className="min-w-full text-left text-xs text-slate-700 divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-3">Case ID</th>
                  <th className="py-3 px-3">Patient Name</th>
                  <th className="py-3 px-3">Age / Gender</th>
                  <th className="py-3 px-3">Triage Urgency</th>
                  <th className="py-3 px-3">Presenting Condition</th>
                  <th className="py-3 px-3">Admitted At</th>
                  <th className="py-3 px-3">Attending Physician</th>
                  <th className="py-3 px-3">Bed / Unit</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {cases.map((c) => (
                  <tr
                    key={c.id}
                    className={`transition-colors ${
                      c.triageLevel === 'Critical'
                        ? 'bg-rose-50/40 hover:bg-rose-50/70'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-3 px-3 font-semibold text-rose-700 whitespace-nowrap">{c.id}</td>
                    <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">{c.patientName}</td>
                    <td className="py-3 px-3 whitespace-nowrap">{c.age}y / {c.gender}</td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <StatusBadge status={c.triageLevel} size="xs" />
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-900">{c.condition}</td>
                    <td className="py-3 px-3 whitespace-nowrap text-slate-500">{c.time}</td>
                    <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-800">{c.attendingDoctor}</td>
                    <td className="py-3 px-3 whitespace-nowrap font-bold text-slate-900">{c.unit}</td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <StatusBadge status={c.status} size="xs" />
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleUpdateStatus(c.id, 'Stabilized')}
                        className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors cursor-pointer"
                      >
                        Stabilize
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}
