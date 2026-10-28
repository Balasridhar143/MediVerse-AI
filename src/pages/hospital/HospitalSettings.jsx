import React, { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import { Bell, CheckCircle2, Save } from 'lucide-react';

export default function HospitalSettings() {
  const [traumaAlerts, setTraumaAlerts] = useState(true);
  const [capacityAlerts, setCapacityAlerts] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Page Header */}
      <PageHeader
        badge="Facility Controls"
        badgeStatus="Hospital Administration"
        title="Hospital Administration Settings"
        subtitle="Configure real-time trauma triage dispatch channels, ICU occupancy threshold alerts, and operations"
      />

      <Card title="Emergency & Operational Notification Rules" icon={Bell}>
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <label className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100/60 transition-colors">
            <div>
              <p className="font-semibold text-slate-800 text-sm">Trauma Center Dispatch Alerts</p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Send emergency notifications to on-duty trauma surgeons upon 108 dispatch activation
              </p>
            </div>
            <input
              type="checkbox"
              checked={traumaAlerts}
              onChange={(e) => setTraumaAlerts(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100/60 transition-colors">
            <div>
              <p className="font-semibold text-slate-800 text-sm">Critical Bed Capacity Warnings</p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Notify administrative desk when ICU resuscitation bed availability drops below 15%
              </p>
            </div>
            <input
              type="checkbox"
              checked={capacityAlerts}
              onChange={(e) => setCapacityAlerts(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
            />
          </label>

          <div className="pt-2 flex justify-between items-center">
            {saved ? (
              <span className="text-emerald-800 font-medium flex items-center gap-1.5 text-xs bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Administrative preferences saved!
              </span>
            ) : <div />}
            <Button type="submit" variant="primary" size="sm" icon={Save}>
              Save Preferences
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
