import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { mockEarlyWarnings } from '../../data/mockData';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import {
  ShieldAlert,
  CheckCircle2,
  Info,
  BrainCircuit,
} from 'lucide-react';

export default function EarlyWarnings() {
  const [warningsList, setWarningsList] = useState(mockEarlyWarnings);

  const handleMarkReviewed = (id) => {
    setWarningsList((prev) =>
      prev.map((w) => (w.id === id ? { ...w, status: 'Reviewed by Clinician' } : w))
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <PageHeader
        badge="Clinical Early Warning"
        badgeStatus="Triage Alert Engine"
        title="Early Clinical Warning Alerts"
        subtitle="Algorithmic trend flagging for longitudinal vitals deviations. Requires clinical review."
      />

      {/* Mandatory Safety / AI Boundary Banner */}
      <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1">
        <p className="font-semibold text-slate-900 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-teal-600 shrink-0" />
          Clinical Practice Guardrail:
        </p>
        <p className="leading-relaxed text-slate-600">
          This system highlights quantitative shifts in longitudinal records. <strong>The AI does not diagnose diseases or prescribe therapies.</strong> It flags notable deviations so the attending doctor can review the patient.
        </p>
      </div>

      {/* Warning Cards */}
      <div className="space-y-4">
        {warningsList.map((alert) => {
          const isReviewed = alert.status === 'Reviewed by Clinician';
          return (
            <Card
              key={alert.id}
              className={`space-y-4 transition-all ${
                isReviewed ? 'border-slate-200 opacity-75' : 'border-amber-300 ring-1 ring-amber-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                  <h3 className="font-bold text-slate-900 text-sm md:text-base">{alert.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={alert.riskLevel} size="xs" />
                  <span className="text-xs text-slate-500 font-medium">{alert.detectedDate}</span>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2.5 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-400 block mb-0.5">Patient Information:</span>
                  <strong className="text-slate-900 text-sm">
                    {alert.patientName} ({alert.patientId})
                  </strong>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-400 block mb-0.5">What Changed:</span>
                  <p className="text-slate-800 font-medium leading-relaxed">
                    {alert.whatChanged}
                  </p>
                </div>

                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg">
                  <span className="text-amber-800 font-semibold block mb-0.5">
                    Suggested Action:
                  </span>
                  <p className="text-amber-950 font-bold text-sm">
                    "{alert.suggestedAction}"
                  </p>
                </div>

                <p className="text-[11px] text-slate-500 italic pt-1">
                  *{alert.aiDisclaimer}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <Link to="/doctor/clinical-context">
                  <Button variant="outline" size="sm">
                    Review Patient Clinical Context
                  </Button>
                </Link>

                {!isReviewed ? (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={CheckCircle2}
                    onClick={() => handleMarkReviewed(alert.id)}
                  >
                    Mark Reviewed & Acknowledged
                  </Button>
                ) : (
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                    Acknowledged by Clinician
                  </span>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
