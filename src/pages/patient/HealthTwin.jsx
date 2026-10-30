import React, { useState, useEffect } from 'react';
import {
  mockMedicines,
  mockVitalsHistory,
  mockFollowUps,
} from '../../data/mockData';
import { reportService } from '../../services/reportService';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import {
  Activity,
  Heart,
  Droplets,
  Scale,
  Pill,
  FileCheck2,
  Clock,
  FileText,
  User,
  ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

/**
 * Health Twin (Longitudinal Patient Health Profile Overview)
 * Designed strictly as a structured clinical summary avoiding sci-fi 3D digital human aesthetics.
 */
export default function HealthTwin() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    reportService.getReports().then((data) => setReports(data || []));
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        badge="Longitudinal Health Overview"
        badgeStatus="Digital Health Profile"
        title="Patient Health Profile & Longitudinal Summary"
        subtitle="Comprehensive clinical synthesis of vitals, chronic history, active prescriptions, and physiological response trends"
        action={
          <div className="text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 flex items-center gap-2 font-medium">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Longitudinal Record Active</span>
          </div>
        }
      />

      {/* 1. Basic Information & Important Clinical History */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Patient Basic Information" icon={User}>
          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Full Name:</span>
              <strong className="text-slate-900">Rahul Sharma</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Patient Identifier:</span>
              <strong className="text-slate-900">PID-2026-089</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Age / Gender:</span>
              <strong className="text-slate-900">42 Years, Male</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Blood Group:</span>
              <strong className="text-teal-700 font-bold">B+ Positive</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Assigned Clinician:</span>
              <strong className="text-slate-900">Dr. Ananya Sen</strong>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Emergency Contact:</span>
              <strong className="text-slate-900">+91 98765 43210 (Spouse)</strong>
            </div>
          </div>
        </Card>

        <Card title="Important Medical History" icon={FileText} className="md:col-span-2">
          <div className="space-y-3 text-xs text-slate-700">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <strong className="text-slate-900">Chronic Hypertension (Stage 1)</strong>
                <span className="text-[11px] text-slate-500">Diagnosed July 2025</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Managed on Telmisartan 40mg OD. Blood pressure currently stabilized at ~124/80 mmHg.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <strong className="text-slate-900">Impaired Fasting Glucose (Pre-Diabetes)</strong>
                <span className="text-[11px] text-slate-500">HbA1c: 6.1%</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Dietary counseling recommended with Metformin 500mg BD.
              </p>
            </div>

            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 text-xs flex items-center justify-between">
              <span>Known Drug Allergies: <strong>Penicillin (Causes cutaneous urticaria)</strong></span>
              <StatusBadge status="Allergy Flagged" size="xs" />
            </div>
          </div>
        </Card>
      </div>

      {/* 2. Current Health Indicators & Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-600" />
            Current Health Indicators
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-[11px] text-slate-500 block mb-1">Blood Pressure</span>
              <p className="text-base font-bold text-slate-900">124/80</p>
              <span className="text-[10px] text-emerald-700 font-medium">Optimal</span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-[11px] text-slate-500 block mb-1">Heart Rate</span>
              <p className="text-base font-bold text-slate-900">72 bpm</p>
              <span className="text-[10px] text-slate-500">Normal Sinus</span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-[11px] text-slate-500 block mb-1">Fasting Glucose</span>
              <p className="text-base font-bold text-slate-900">108 mg/dL</p>
              <span className="text-[10px] text-amber-700 font-medium">Borderline</span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-[11px] text-slate-500 block mb-1">Weight</span>
              <p className="text-base font-bold text-slate-900">73.5 kg</p>
              <span className="text-[10px] text-emerald-700 font-medium">-1.5 kg goal</span>
            </div>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1 shadow-2xs">
            <strong className="text-slate-900 block">Recent Symptoms Logged:</strong>
            <p className="text-slate-600 leading-relaxed">
              Mild postural lightheadedness on Sep 20; no chest pain, palpitations, or edema reported.
            </p>
          </div>
        </div>

        <div className="lg:col-span-2">
          <Card
            title="Longitudinal Health Trends"
            subtitle="Blood pressure response trajectory across sequential evaluations"
            icon={Activity}
          >
            <div className="h-56 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockVitalsHistory} margin={{ top: 5, right: 15, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis domain={[60, 150]} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="systolic" name="Systolic BP" stroke="#0d9488" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="diastolic" name="Diastolic BP" stroke="#0284c7" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      {/* 3. Current Medicines, Recent Reports & Upcoming Follow-up */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Current Medications" icon={Pill}>
          <div className="space-y-2 text-xs">
            {mockMedicines.map((m) => (
              <div key={m.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>{m.name}</span>
                  <span className="text-teal-700">{m.dosage}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">{m.frequency} • {m.mealRelation}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Recent Diagnostic Reports" icon={FileCheck2}>
          <div className="space-y-2 text-xs">
            {reports.length > 0 ? (
              reports.slice(0, 2).map((r) => (
                <div key={r.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex justify-between font-semibold text-slate-800">
                    <span>{r.reportName}</span>
                    <StatusBadge status={r.status} size="xs" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{r.date} • {r.reportType}</p>
                  <p className="text-[11px] text-slate-600 mt-1 line-clamp-1">{r.shortPreview}</p>
                </div>
              ))
            ) : (
              <p className="p-3 bg-slate-50 rounded text-slate-500 text-[11px] text-center">
                No diagnostic reports uploaded yet.
              </p>
            )}
          </div>
        </Card>

        <Card title="Upcoming Follow-up" icon={Clock}>
          {mockFollowUps[0] ? (
            <div className="p-3 bg-teal-50/50 border border-teal-200 rounded-lg text-xs space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-100/60 px-2 py-0.5 rounded">
                Next Review Date
              </span>
              <p className="text-base font-bold text-slate-900">{mockFollowUps[0].followUpDate}</p>
              <p className="text-slate-700 font-medium">Clinician: {mockFollowUps[0].doctorName}</p>
              <p className="text-slate-500">{mockFollowUps[0].reason}</p>
            </div>
          ) : (
            <p className="text-xs text-slate-500">No scheduled follow-ups.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
