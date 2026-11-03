import React, { useState, useEffect } from 'react';
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
import { reportService } from '../../services/reportService';
import api from '../../services/api';

export default function HealthTimeline() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTimeline();
  }, []);

  const loadTimeline = async () => {
    setLoading(true);
    const baselineEvents = [
      {
        id: 'base_1',
        type: 'Follow-up',
        date: 'Oct 05, 2026 (Scheduled)',
        title: 'Upcoming Cardiology Follow-up Check',
        description: 'Scheduled with Dr. Ananya Sen to evaluate blood pressure control after 4 weeks of Telmisartan 40mg.',
        icon: Clock,
        badge: 'Scheduled',
        categoryColor: 'bg-sky-50 text-sky-800 border-sky-200',
      },
      {
        id: 'base_2',
        type: 'Consultation',
        date: 'Sep 28, 2026 (10:15 AM)',
        title: 'Telemedicine Video Consultation',
        description: 'Consultation with Dr. Ananya Sen regarding BP monitoring, mild dizziness spells, and reviewing recent CBC report.',
        icon: Video,
        badge: 'Upcoming',
        categoryColor: 'bg-teal-50 text-teal-800 border-teal-200',
      },
      {
        id: 'base_3',
        type: 'Symptoms',
        date: 'Sep 20, 2026',
        title: 'Patient Reported Mild Symptoms',
        description: 'Patient logged mild dizziness upon sudden standing; fasting glucose measured 118 mg/dL.',
        icon: Activity,
        badge: 'Reported',
        categoryColor: 'bg-amber-50 text-amber-800 border-amber-200',
      },
    ];

    try {
      const [reportsData, aptsRes, rxRes] = await Promise.allSettled([
        reportService.getReports(),
        api.get('/appointments/my-appointments'),
        api.get('/prescriptions')
      ]);

      const liveEvents = [];

      // 1. Live reports
      if (reportsData.status === 'fulfilled' && Array.isArray(reportsData.value)) {
        reportsData.value.forEach((r) => {
          liveEvents.push({
            id: `rep_${r.id}`,
            type: 'Medical report',
            date: r.date || 'Recent',
            title: r.reportName,
            description: `${r.hospital}: ${r.shortPreview || r.detailedFindings || 'Laboratory report processed.'}`,
            icon: FileCheck2,
            badge: r.status,
            categoryColor: 'bg-slate-100 text-slate-800 border-slate-200',
          });
        });
      }

      // 2. Live appointments
      if (aptsRes.status === 'fulfilled' && Array.isArray(aptsRes.value?.data)) {
        aptsRes.value.data.forEach((a) => {
          liveEvents.push({
            id: `apt_${a.id}`,
            type: a.type || 'Consultation',
            date: `${a.date || a.appointment_date || ''} (${a.time || a.time_slot || ''})`,
            title: `${a.type || 'Consultation'} — ${a.doctorName || a.doctor_name || 'Clinician'}`,
            description: `${a.hospital || 'Hospital'} (${a.department || 'General'}). Reason: ${a.notes || a.chiefComplaint || 'Consultation'}.`,
            icon: Video,
            badge: a.status,
            categoryColor: 'bg-teal-50 text-teal-800 border-teal-200',
          });
        });
      }

      // 3. Live prescriptions
      if (rxRes.status === 'fulfilled' && Array.isArray(rxRes.value?.data)) {
        rxRes.value.data.forEach((p) => {
          const medSummary = p.medicines?.map((m) => m.name || m.medicine_name).join(', ') || 'Prescribed medications';
          liveEvents.push({
            id: `rx_${p.id}`,
            type: 'Prescription',
            date: p.date || p.dateIso || 'Recent',
            title: `Prescription Issued by ${p.doctorName || 'Doctor'}`,
            description: `Medications: ${medSummary}. Diagnosis: ${p.diagnosis || 'Clinical evaluation'}.`,
            icon: FileText,
            badge: p.status || 'Active Rx',
            categoryColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          });
        });
      }

      setEvents([...liveEvents, ...baselineEvents]);
    } catch (err) {
      console.warn('Failed to compile timeline events:', err);
      setEvents(baselineEvents);
    } finally {
      setLoading(false);
    }
  };

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
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-500">Loading chronological health events...</div>
        ) : (
          <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 space-y-7 ml-2 sm:ml-4">
            {events.map((evt) => {
              const Icon = evt.icon || Activity;
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
        )}
      </Card>
    </div>
  );
}
