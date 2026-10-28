import React from 'react';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import {
  Video,
  FileText,
  FileCheck2,
  Activity,
  Clock,
  Calendar,
  Eye,
} from 'lucide-react';

export default function HealthTimeline() {
  const timelineEvents = [
    {
      id: 1,
      type: 'Follow-up',
      date: 'Oct 05, 2026 (Scheduled)',
      title: 'Upcoming Cardiology Follow-up Check',
      description: 'Scheduled with Dr. Ananya Sen to evaluate blood pressure control after 4 weeks of Telmisartan 40mg.',
      icon: Clock,
      badge: 'Scheduled',
      categoryColor: 'bg-sky-50 text-sky-800 border-sky-200',
    },
    {
      id: 2,
      type: 'Consultation',
      date: 'Sep 28, 2026 (10:15 AM)',
      title: 'Telemedicine Video Consultation',
      description: 'Consultation with Dr. Ananya Sen regarding BP monitoring, mild dizziness spells, and reviewing recent CBC report.',
      icon: Video,
      badge: 'Upcoming',
      categoryColor: 'bg-teal-50 text-teal-800 border-teal-200',
    },
    {
      id: 21,
      type: 'AI Explanation',
      date: 'Sep 25, 2026 (09:05 AM)',
      title: 'AI Explanation Viewed',
      description: 'Patient accessed simple AI explanation for CBC report: Hemoglobin 11.2 g/dL (mild borderline anemia context).',
      icon: FileCheck2,
      badge: 'Viewed',
      categoryColor: 'bg-teal-50 text-teal-800 border-teal-200',
    },
    {
      id: 22,
      type: 'Medical report',
      date: 'Sep 25, 2026 (09:00 AM)',
      title: 'Report Viewed in Patient Portal',
      description: 'Complete Blood Count (CBC) with Hemogram report reviewed by patient in Digital Health Locker.',
      icon: Eye,
      badge: 'Viewed',
      categoryColor: 'bg-slate-100 text-slate-800 border-slate-200',
    },
    {
      id: 23,
      type: 'Medical report',
      date: 'Sep 24, 2026 (02:15 PM)',
      title: 'Blood Test Uploaded',
      description: 'City Diagnostic Center: Complete Blood Count (CBC) digitized and synced to electronic medical records.',
      icon: FileCheck2,
      badge: 'Uploaded',
      categoryColor: 'bg-slate-100 text-slate-800 border-slate-200',
    },
    {
      id: 3,
      type: 'Symptoms',
      date: 'Sep 20, 2026',
      title: 'Patient Reported Mild Symptoms',
      description: 'Patient logged mild dizziness upon sudden standing; fasting glucose measured 118 mg/dL.',
      icon: Activity,
      badge: 'Reported',
      categoryColor: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    {
      id: 4,
      type: 'Medical report',
      date: 'Sep 12, 2026',
      title: 'Comprehensive Lipid Profile Report',
      description: 'City Care Diagnostics: Total Cholesterol 195 mg/dL, Triglycerides 160 mg/dL (Borderline elevated).',
      icon: FileCheck2,
      badge: 'Reviewed',
      categoryColor: 'bg-slate-100 text-slate-800 border-slate-200',
    },
    {
      id: 5,
      type: 'Prescription',
      date: 'Aug 28, 2026',
      title: 'Prescription Issued (Rx #rx_501)',
      description: 'Dr. Ananya Sen prescribed Telmisartan 40mg (OD morning) and Atorvastatin 10mg (OD night).',
      icon: FileText,
      badge: 'Active Rx',
      categoryColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    {
      id: 6,
      type: 'Consultation',
      date: 'Aug 15, 2026',
      title: 'In-Person Consultation (General Medicine)',
      description: 'Dr. Sunita Deshmukh at Metro General Healthcare. Routine health check for seasonal cough and fatigue.',
      icon: Calendar,
      badge: 'Completed',
      categoryColor: 'bg-slate-100 text-slate-800 border-slate-200',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        badge="Longitudinal Records"
        badgeStatus="Chronological Record"
        title="Patient Health Timeline"
        subtitle="Sequential chronological history of consultations, prescriptions, reports, symptoms, and follow-ups"
      />

      {/* Vertical Timeline Container */}
      <Card>
        <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 space-y-7 ml-2 sm:ml-4">
          {timelineEvents.map((evt) => {
            const Icon = evt.icon;
            return (
              <div key={evt.id} className="relative group">
                {/* Timeline node icon */}
                <div className="absolute -left-[37px] sm:-left-[45px] top-0 w-8 h-8 rounded-full bg-white border-2 border-teal-600 flex items-center justify-center text-teal-700 shadow-2xs group-hover:scale-105 transition-transform">
                  <Icon className="w-4 h-4" />
                </div>

                {/* Event Content Card */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-teal-400 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${evt.categoryColor}`}>
                        {evt.type}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm">{evt.title}</h3>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">{evt.date}</span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {evt.description}
                  </p>

                  <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Authenticated Clinical Event</span>
                    <StatusBadge status={evt.badge} size="xs" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
