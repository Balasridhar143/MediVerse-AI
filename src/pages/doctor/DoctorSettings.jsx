import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import { Bell, CheckCircle2, Save, Stethoscope, Building2, User, Award, ShieldCheck } from 'lucide-react';

export default function DoctorSettings() {
  const { user } = useAuth();
  const [teleAlerts, setTeleAlerts] = useState(true);
  const [warningAlerts, setWarningAlerts] = useState(true);
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
        badge="Clinician Profile"
        badgeStatus="Clinician Workspace"
        title="Doctor Settings & Clinical Preferences"
        subtitle="Configure early warning thresholds, tele-consultation waiting queue alerts, and consultation roster"
      />

      {/* Doctor Profile & Assigned Department Card */}
      <Card title="Physician Profile & Department Affiliation" icon={Stethoscope}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-teal-600" /> Clinician Name
            </span>
            <p className="font-bold text-slate-900 text-sm">{user?.name || user?.full_name || 'Dr. Practitioner'}</p>
            <p className="text-slate-500 text-[11px]">{user?.email || 'clinician@hospital.org'}</p>
          </div>

          <div className="p-3.5 bg-teal-50/50 border border-teal-200 rounded-xl space-y-1">
            <span className="text-[11px] font-semibold text-teal-700 uppercase flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-teal-600" /> Assigned Department
            </span>
            <p className="font-bold text-teal-900 text-sm">{user?.department || 'General Medicine'}</p>
            <p className="text-teal-700 text-[11px]">Specialization: {user?.specialization || 'Clinical Specialist'}</p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-teal-600" /> Affiliated Hospital
            </span>
            <p className="font-bold text-slate-900 text-sm">{user?.hospital_name || 'City Care Multispeciality Hospital'}</p>
            <p className="text-slate-500 text-[11px]">Facility ID: {user?.hospital_id || user?.facility_id || 'HOSP-CARE-01'}</p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-teal-600" /> Medical Licensure
            </span>
            <div className="flex items-center gap-2">
              <p className="font-mono font-bold text-slate-900 text-xs">{user?.license_number || 'NMC-REG-2024'}</p>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 flex items-center gap-0.5">
                <ShieldCheck className="w-3 h-3 text-teal-600" /> Verified
              </span>
            </div>
            <p className="text-slate-500 text-[11px]">Status: Active OPD & Telemedicine</p>
          </div>
        </div>
      </Card>

      <Card title="Clinical Notification Rules" icon={Bell}>
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <label className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100/60 transition-colors">
            <div>
              <p className="font-semibold text-slate-800 text-sm">Early Warning Deviation Alerts</p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Notify clinician when longitudinal vitals breach pre-defined physiological risk boundaries
              </p>
            </div>
            <input
              type="checkbox"
              checked={warningAlerts}
              onChange={(e) => setWarningAlerts(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100/60 transition-colors">
            <div>
              <p className="font-semibold text-slate-800 text-sm">Telemedicine Waiting Queue Alerts</p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Notify clinician when patient enters the video consultation waiting room
              </p>
            </div>
            <input
              type="checkbox"
              checked={teleAlerts}
              onChange={(e) => setTeleAlerts(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
            />
          </label>

          <div className="pt-2 flex justify-between items-center">
            {saved ? (
              <span className="text-emerald-800 font-medium flex items-center gap-1.5 text-xs bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Doctor preferences saved!
              </span>
            ) : <div />}
            <Button type="submit" variant="primary" size="sm" icon={Save}>
              Save Settings
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
