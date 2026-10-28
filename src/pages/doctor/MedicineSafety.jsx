import React, { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import { Pill, ShieldCheck, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { verifiedDrugInteractions } from '../../data/medicineSafetyData';

export default function MedicineSafety() {
  const [filterSeverity, setFilterSeverity] = useState('All');

  const filteredInteractions =
    filterSeverity === 'All'
      ? verifiedDrugInteractions
      : verifiedDrugInteractions.filter((i) => i.severity === filterSeverity);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Page Header */}
      <PageHeader
        badge="Pharmacovigilance Suite"
        badgeStatus="Active Clinical Rules"
        title="Clinical Medication Safety & Drug Interaction Matrix"
        subtitle="Automated cross-allergy checks, drug-drug interaction matrix, and duplicate molecule screenings"
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="font-bold text-slate-700">Filter by Severity:</span>
        {['All', 'High', 'Moderate'].map((sev) => (
          <button
            key={sev}
            type="button"
            onClick={() => setFilterSeverity(sev)}
            className={`px-3 py-1 rounded-lg font-bold cursor-pointer transition-colors border ${
              filterSeverity === sev
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
            }`}
          >
            {sev}
          </button>
        ))}
      </div>

      <div className="space-y-3.5">
        {filteredInteractions.map((rule, idx) => (
          <Card key={idx} className="space-y-2.5 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                  <Pill className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {rule.drugA} + {rule.drugB}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    rule.severity === 'High'
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  Severity: {rule.severity}
                </span>
                <StatusBadge status="Doctor Review Required" size="xs" />
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider mb-0.5">
                Clinical Pharmacological Mechanism:
              </span>
              <p className="text-slate-700 leading-relaxed">{rule.clinicalReason}</p>
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-0.5">
              <strong className="text-teal-900 text-[11px] block uppercase tracking-wider">
                Patient-friendly Explanation:
              </strong>
              <p className="text-slate-600 text-xs">{rule.simpleExplanation}</p>
            </div>

            <div className="pt-1 text-[11px] text-slate-500 italic">
              <strong>Recommended Clinical Action:</strong> {rule.recommendedAction}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
