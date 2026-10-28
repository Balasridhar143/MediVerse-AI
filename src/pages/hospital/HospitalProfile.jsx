import React, { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import { Building2, Save, CheckCircle2 } from 'lucide-react';

export default function HospitalProfile() {
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    hospitalName: 'City Care Multispeciality Hospital',
    regNumber: 'NABH-2026-09',
    campusAddress: 'Central Campus, Sector 4, Tech Zone',
    helpdeskPhone: '+91 11 2345 6789',
    emergencyHotline: '108 / +91 11 2345 9999',
    medicalSuperintendent: 'Dr. Ramesh Kulkarni, MD',
    bedCapacity: 250,
    icuBeds: 32,
  });

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <PageHeader
        badge="Healthcare Facility"
        badgeStatus="NABH Accredited"
        title="Hospital Profile & Accreditation Details"
        subtitle="Public registry information, campus address, emergency hotline, and bed allocations"
        action={
          saved && (
            <span className="text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Hospital records updated
            </span>
          )
        }
      />

      <Card title="Hospital Institutional Dossier" icon={Building2}>
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Hospital Legal Name</label>
              <input
                type="text"
                value={formData.hospitalName}
                onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">NABH / MCI Registration Code</label>
              <input
                type="text"
                value={formData.regNumber}
                onChange={(e) => setFormData({ ...formData, regNumber: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Campus Location & Street Address</label>
            <input
              type="text"
              value={formData.campusAddress}
              onChange={(e) => setFormData({ ...formData, campusAddress: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Central Reception Helpline</label>
              <input
                type="text"
                value={formData.helpdeskPhone}
                onChange={(e) => setFormData({ ...formData, helpdeskPhone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">24x7 Emergency Trauma Hotline</label>
              <input
                type="text"
                value={formData.emergencyHotline}
                onChange={(e) => setFormData({ ...formData, emergencyHotline: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Medical Superintendent</label>
              <input
                type="text"
                value={formData.medicalSuperintendent}
                onChange={(e) => setFormData({ ...formData, medicalSuperintendent: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Total Inpatient Beds</label>
              <input
                type="number"
                value={formData.bedCapacity}
                onChange={(e) => setFormData({ ...formData, bedCapacity: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">ICU Resuscitation Beds</label>
              <input
                type="number"
                value={formData.icuBeds}
                onChange={(e) => setFormData({ ...formData, icuBeds: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                required
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <Button type="submit" variant="primary" size="md" icon={Save}>
              Save Hospital Profile
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
