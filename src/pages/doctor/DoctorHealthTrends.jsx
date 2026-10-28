import React from 'react';
import { mockVitalsHistory } from '../../data/mockData';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import {
  Activity,
  Heart,
  Droplets,
  Scale,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

export default function DoctorHealthTrends() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        badge="Longitudinal Analytics"
        badgeStatus="6-Month Clinical Checkups"
        title="Patient Health Trends & Physiological Vitals"
        subtitle="Evaluating Patient: Rahul Sharma (PID-2026-089) • Stage 1 HTN under Telmisartan therapy"
      />

      {/* 4 Purposeful Vitals Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Blood Pressure Trajectory */}
        <Card
          title="1. Blood Pressure Trajectory (mmHg)"
          subtitle="Systolic vs Diastolic response over 6 recorded consultations"
          icon={Heart}
        >
          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockVitalsHistory} margin={{ top: 5, right: 15, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis domain={[60, 150]} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip contentStyle={{ fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="systolic" name="Systolic BP" stroke="#0d9488" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="diastolic" name="Diastolic BP" stroke="#0284c7" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
            Clinician note: Stable reduction in systolic pressure (-14 mmHg) from initial baseline.
          </p>
        </Card>

        {/* 2. Resting Heart Rate */}
        <Card
          title="2. Resting Heart Rate (bpm)"
          subtitle="Pulse rate tracking across routine visits"
          icon={Activity}
        >
          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockVitalsHistory} margin={{ top: 5, right: 15, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip contentStyle={{ fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="heartRate" name="Heart Rate (bpm)" stroke="#e11d48" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
            Normal sinus rhythm range maintained (72–78 bpm). No sustained tachycardia.
          </p>
        </Card>

        {/* 3. Fasting Blood Glucose */}
        <Card
          title="3. Fasting Blood Glucose (mg/dL)"
          subtitle="Pre-meal glucose levels assessing pre-diabetic response"
          icon={Droplets}
        >
          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockVitalsHistory} margin={{ top: 5, right: 15, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis domain={[90, 140]} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip contentStyle={{ fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="glucose" name="Fasting Glucose (mg/dL)" stroke="#d97706" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
            Mild upward excursions noted early September coincident with missed Metformin evening doses.
          </p>
        </Card>

        {/* 4. Body Weight */}
        <Card
          title="4. Longitudinal Body Weight (kg)"
          subtitle="Weight changes correlated with lifestyle modifications"
          icon={Scale}
        >
          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockVitalsHistory} margin={{ top: 5, right: 15, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis domain={[70, 80]} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip contentStyle={{ fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="weight" name="Body Weight (kg)" stroke="#4f46e5" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
            Gradual weight loss of 1.5 kg over 2 months aligns with recommended dietary regimen.
          </p>
        </Card>
      </div>
    </div>
  );
}
