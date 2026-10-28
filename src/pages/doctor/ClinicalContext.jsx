import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import ReportDetails from '../../components/ReportDetails';
import {
  BrainCircuit,
  User,
  Activity,
  Heart,
  Pill,
  FileCheck2,
  FileText,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Info,
  Eye,
  MessageSquare,
  TrendingUp,
  History,
  Calendar,
  Layers,
  ArrowRight,
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
import { mockVitalsHistory, mockMedicines } from '../../data/mockData';
import { mockMedicalReports } from '../../data/reports';

export default function ClinicalContext() {
  const [reportsList, setReportsList] = useState(mockMedicalReports);
  const [viewingReport, setViewingReport] = useState(null);
  const [noteModalReport, setNoteModalReport] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [reviewedNotice, setReviewedNotice] = useState('');

  const handleMarkAsReviewed = (reportId) => {
    setReportsList((prev) =>
      prev.map((r) =>
        r.id === reportId ? { ...r, status: 'Doctor Reviewed' } : r
      )
    );
    const rep = reportsList.find((r) => r.id === reportId);
    setReviewedNotice(`Report "${rep?.reportName}" marked as Doctor Reviewed.`);
    setTimeout(() => setReviewedNotice(''), 4000);
  };

  const handleSaveNote = (e) => {
    e.preventDefault();
    if (!noteModalReport) return;
    setReportsList((prev) =>
      prev.map((r) =>
        r.id === noteModalReport.id
          ? { ...r, doctorNotes: noteText }
          : r
      )
    );
    setNoteModalReport(null);
    setNoteText('');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        badge="Clinical Synthesis"
        badgeStatus="Doctor Review Required"
        title="Patient Clinical Context"
        subtitle="Evaluating Patient: Rahul Sharma (PID-2026-089) • 42y / Male • Stage 1 Hypertension"
        action={
          <div className="flex items-center gap-2">
            <Link to="/doctor/health-trends">
              <Button variant="outline" size="sm">
                View Longitudinal Trends
              </Button>
            </Link>
            <Link to="/doctor/prescriptions">
              <Button variant="primary" size="sm">
                Write Prescription
              </Button>
            </Link>
          </div>
        }
      />

      {/* Mandatory Notice Banner */}
      <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-medium text-amber-900">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>AI-generated summary — Doctor review required:</strong> Automated synthesis compiled from electronic logs. Does not replace clinician evaluation.
          </span>
        </div>
        <StatusBadge status="Doctor Review Required" size="xs" />
      </div>

      {reviewedNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2 text-xs text-emerald-900 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{reviewedNotice}</span>
        </div>
      )}

      {/* Clinical Context Connection Map */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <Layers className="w-4 h-4 text-teal-600" />
            <span>Integrated Clinical Context Mesh</span>
          </div>
          <span className="text-[11px] text-slate-500">
            Longitudinal Patient Record Architecture
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center text-xs pt-1">
          <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-lg">
            <strong className="block text-teal-900 font-bold">10 Reports</strong>
            <span className="text-[10px] text-teal-700">Lab & Imaging</span>
          </div>
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
            <strong className="block text-slate-900 font-bold">3 Medicines</strong>
            <span className="text-[10px] text-slate-500">Active Regimen</span>
          </div>
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
            <strong className="block text-slate-900 font-bold">Rx #rx_501</strong>
            <span className="text-[10px] text-slate-500">Verified Prescriptions</span>
          </div>
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
            <strong className="block text-slate-900 font-bold">28 Sep</strong>
            <span className="text-[10px] text-slate-500">Tele-Consultation</span>
          </div>
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
            <strong className="block text-slate-900 font-bold">05 Oct</strong>
            <span className="text-[10px] text-slate-500">Next Follow-Up</span>
          </div>
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
            <strong className="block text-slate-900 font-bold">6 Milestones</strong>
            <span className="text-[10px] text-slate-500">Health Timeline</span>
          </div>
        </div>
      </div>

      {/* 1. Patient Information & Medical History */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Patient Information */}
        <Card title="Patient Information" icon={User}>
          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Patient:</span>
              <strong className="text-slate-900">Rahul Sharma</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">ID / Age:</span>
              <span className="font-semibold text-slate-800">PID-2026-089 (42y / M)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Blood Group:</span>
              <strong className="text-teal-700">B+ Positive</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Primary Clinician:</span>
              <span className="font-medium text-slate-800">Dr. Ananya Sen</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Enrolled:</span>
              <span className="text-slate-500">July 14, 2025</span>
            </div>
          </div>
        </Card>

        {/* Symptoms */}
        <Card title="Reported Symptoms" icon={Activity}>
          <div className="space-y-2.5 text-xs">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="font-bold text-slate-900 block mb-0.5">Postural Lightheadedness</span>
              <p className="text-slate-600">Occasional dizziness when standing abruptly in the morning. Logged Sep 20.</p>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="font-bold text-slate-900 block mb-0.5">Absence of Critical Red Flags</span>
              <p className="text-slate-600">No chest tightness, radiating pain, breathlessness, or lower limb edema reported.</p>
            </div>
          </div>
        </Card>

        {/* Allergies */}
        <Card title="Known Allergies" icon={AlertTriangle}>
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <strong className="text-rose-900 text-sm">Penicillin / Beta-lactams</strong>
                <StatusBadge status="Contraindicated" size="xs" />
              </div>
              <p className="text-rose-800 leading-relaxed">
                Severe cutaneous urticaria and generalized pruritus documented in 2021. Avoid all penicillin derivatives.
              </p>
            </div>
            <p className="text-[11px] text-slate-500 italic">
              *System blocks prescription of penicillin-class molecules automatically.
            </p>
          </div>
        </Card>
      </div>

      {/* 2. Medical History & Current Medicines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Medical History */}
        <Card title="Medical History" icon={FileText}>
          <div className="space-y-3 text-xs text-slate-700">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <div className="flex justify-between items-center">
                <strong className="text-slate-900 text-sm">Essential Hypertension (Stage 1)</strong>
                <span className="text-[11px] text-slate-400">July 2025</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Initial presentation: 148/92 mmHg. Baseline renal workup and ECG confirmed within normal limits. Commenced on Telmisartan 40mg once daily.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <div className="flex justify-between items-center">
                <strong className="text-slate-900 text-sm">Dyslipidemia & Pre-Diabetes</strong>
                <span className="text-[11px] text-slate-400">August 2026</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                HbA1c 6.1%, borderline triglycerides (160 mg/dL). Prescribed Metformin 500mg BD with dietary exercise plan.
              </p>
            </div>
          </div>
        </Card>

        {/* Current Medicines */}
        <Card title="Current Medications" icon={Pill}>
          <div className="space-y-2.5 text-xs">
            {mockMedicines.map((med) => (
              <div
                key={med.id}
                className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3"
              >
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{med.name}</h4>
                  <p className="text-slate-500 text-[11px]">
                    {med.dosage} • {med.frequency} • {med.mealRelation}
                  </p>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Prescribed by {med.prescribedBy}
                  </span>
                </div>
                <StatusBadge status={med.status} size="xs" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 3. Comprehensive Doctor Report View with Actions */}
      <Card
        title="Diagnostic Laboratory & Imaging Reports (Clinician Review Panel)"
        subtitle="Patient: Rahul Sharma (PID-2026-089) • Review lab findings, append clinical notes, and sign off status"
        icon={FileCheck2}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {reportsList.slice(0, 4).map((report) => (
              <div
                key={report.id}
                className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 hover:border-teal-300 transition-colors"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 bg-teal-50 text-teal-800 rounded border border-teal-200">
                        {report.reportType}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {report.reportName}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Patient: <strong className="text-slate-700">Rahul Sharma</strong> • Date: <strong>{report.date}</strong> • Lab: {report.hospital}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={report.status} size="xs" />
                  </div>
                </div>

                {/* Important Findings */}
                <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-1">
                  <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider text-slate-500">
                    Important Findings:
                  </span>
                  <p className="text-slate-800 leading-relaxed font-medium">
                    {report.detailedFindings || report.shortPreview}
                  </p>
                </div>

                {/* Previous Reports & Trend Indicators */}
                {report.historicalValues && report.historicalValues.length > 0 && (
                  <div className="p-2.5 bg-white/80 border border-slate-200 rounded-lg text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <History className="w-3.5 h-3.5 text-teal-600" />
                      <span className="font-bold text-slate-700 text-[11px]">
                        Previous Values (Trend):
                      </span>
                      <div className="flex items-center gap-2 text-slate-600 tabular-nums">
                        {report.historicalValues.map((h, i) => (
                          <span key={i} className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                            {h.dateLabel}: <strong>{h.value}</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 italic">
                      Trend shown for reference
                    </span>
                  </div>
                )}

                {/* Doctor Note display if present */}
                {report.doctorNotes && (
                  <div className="p-2.5 bg-teal-50/70 border border-teal-200 rounded-lg text-xs space-y-0.5">
                    <span className="font-bold text-teal-900 text-[11px] uppercase tracking-wider block">
                      Clinician Note:
                    </span>
                    <p className="text-slate-800">{report.doctorNotes}</p>
                  </div>
                )}

                {/* Action Buttons: [VIEW REPORT], [ADD NOTE], [MARK AS REVIEWED] */}
                <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-end gap-2 text-xs">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Eye}
                    onClick={() => setViewingReport(report)}
                  >
                    VIEW REPORT
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    icon={MessageSquare}
                    onClick={() => {
                      setNoteModalReport(report);
                      setNoteText(report.doctorNotes || '');
                    }}
                  >
                    ADD NOTE
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    icon={CheckCircle2}
                    onClick={() => handleMarkAsReviewed(report.id)}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white"
                  >
                    MARK AS REVIEWED
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* 4. Longitudinal Blood Pressure Trajectory */}
      <Card
        title="Longitudinal Blood Pressure Trajectory"
        subtitle="Systolic vs Diastolic response over 6 recorded consultations"
        icon={Heart}
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
        <p className="mt-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
          Current therapeutic response demonstrates a 14 mmHg systolic decrease from baseline. Clinical correlation advised.
        </p>
      </Card>

      {/* Report Details Modal */}
      <ReportDetails
        report={viewingReport}
        isOpen={!!viewingReport}
        onClose={() => setViewingReport(null)}
      />

      {/* Doctor Add Note Modal */}
      {noteModalReport && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                Add Clinical Note for {noteModalReport.reportName}
              </h3>
            </div>

            <form onSubmit={handleSaveNote} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Doctor's Clinical Impression / Follow-Up Directive:
                </label>
                <textarea
                  rows={4}
                  required
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="e.g. Mild normocytic anemia pattern. Recommend dietary iron evaluation and follow-up during scheduled consultation..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNoteModalReport(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Save Clinical Note
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
