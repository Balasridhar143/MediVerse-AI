import React, { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import { Bell, CheckCircle2, Save } from 'lucide-react';

export default function Settings() {
  const [reminders, setReminders] = useState(true);
  const [teleNotifs, setTeleNotifs] = useState(true);
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
        badge="Account Preferences"
        badgeStatus="Saved"
        title="Patient Settings"
        subtitle="Configure medication reminder alerts, telemedicine waiting room notifications, and privacy"
      />

      {/* Settings Form */}
      <Card title="Alerts & Notification Rules" icon={Bell}>
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <label className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100/60 transition-colors">
            <div>
              <p className="font-semibold text-slate-800 text-sm">Daily Medication Reminders</p>
              <p className="text-slate-500 text-[11px] mt-0.5">Send alert notifications at scheduled prescription hours</p>
            </div>
            <input
              type="checkbox"
              checked={reminders}
              onChange={(e) => setReminders(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100/60 transition-colors">
            <div>
              <p className="font-semibold text-slate-800 text-sm">Telemedicine Consultation Alerts</p>
              <p className="text-slate-500 text-[11px] mt-0.5">Send room-ready notifications 15 minutes prior to scheduled appointments</p>
            </div>
            <input
              type="checkbox"
              checked={teleNotifs}
              onChange={(e) => setTeleNotifs(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
            />
          </label>

          <div className="pt-2 flex justify-between items-center">
            {saved ? (
              <span className="text-emerald-800 font-medium flex items-center gap-1.5 text-xs bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Preferences saved!
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
