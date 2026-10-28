import React, { useState, useEffect, useRef } from 'react';
import {
  FileCheck2,
  Upload,
  Search,
  Filter,
  Columns,
  TrendingUp,
  BookOpen,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  ArrowRight,
  Eye,
  FileText,
  Activity,
  Stethoscope,
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import ReportCard from '../../components/ReportCard';
import ReportReader from '../../components/ReportReader';
import ReportComparison from '../../components/ReportComparison';
import ReportTrendChart from '../../components/ReportTrendChart';
import ReportUpload from '../../components/ReportUpload';
import MedicalTermCard from '../../components/MedicalTermCard';
import AIPipelinePreview from '../../components/AIPipelinePreview';
import UniversalLanguageSelector from '../../components/LanguageSelector';
import { mockMedicalReports, REPORT_CATEGORIES, MEDICAL_GLOSSARY } from '../../data/reports';
import { reportService } from '../../services/reportService';

/**
 * MedicalReports
 * Advanced Medical Report Understanding & Workspace.
 * 
 * Top Section:
 * - "Medical Reports"
 * - "View, understand and track your medical reports in one place."
 * - Actions: [Upload Report], [Search Reports]
 * 
 * Summary Cards:
 * - Total Reports
 * - Recent Reports
 * - Doctor Reviewed
 * - Needs Review
 * 
 * Recent Reports with:
 * - Report Name, Report Type, Date, Hospital/Lab, Doctor, Status
 * - [Open Report], [Understand Report]
 * 
 * In-depth Report Reader with:
 * - Standard vs Easy Explanation View
 * - [UNDERSTAND MY REPORT] 7-step patient walkthrough
 * - Structured Lab Value Table with visual indicators (↓ Below, ✓ Within, ↑ Above)
 * - Click any test value for 4-level explanations
 * - Medical terms section
 * - Doctor review & note
 * - Longitudinal comparison & trend charts
 */
export default function MedicalReports() {
  const [reports, setReports] = useState(mockMedicalReports);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'compare' | 'trends' | 'terms' | 'timeline'

  // Modals & Reader States
  const [activeReaderReport, setActiveReaderReport] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [globalLanguage, setGlobalLanguage] = useState('en');

  // Search input ref to focus when clicking [Search Reports]
  const searchInputRef = useRef(null);

  // Derived Summary Metric Cards (Requirement 1)
  const totalReportsCount = reports.length;
  const doctorReviewedCount = reports.filter((r) => r.status === 'Doctor Reviewed').length;
  const needsReviewCount = reports.filter(
    (r) => r.status === 'Needs Review' || r.status === 'Doctor Review Recommended' || r.status === 'Awaiting Doctor Review'
  ).length;
  const recentReportsCount = reports.filter((r) => {
    // Reports within recent months
    return r.date.includes('2026');
  }).length;

  // Filtered reports
  const filteredReports = reports.filter((r) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      r.reportName.toLowerCase().includes(q) ||
      r.hospital.toLowerCase().includes(q) ||
      r.doctor.toLowerCase().includes(q) ||
      r.shortPreview.toLowerCase().includes(q) ||
      r.reportType.toLowerCase().includes(q);

    const matchesCategory =
      selectedCategory === 'All' ? true : r.category === selectedCategory || r.reportType === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleOpenReport = (report) => {
    setActiveReaderReport(report);
  };

  const handleUnderstandReport = (report) => {
    setActiveReaderReport(report);
  };

  const handleUploadSuccess = (newReport) => {
    setReports((prev) => [newReport, ...prev]);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ==================================================== */}
      {/* 1. TOP SECTION (Requirement 1) */}
      {/* ==================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200 uppercase tracking-wider">
              Diagnostic Clarity Workspace
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Medical Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            View, understand and track your medical reports in one place.
          </p>
        </div>

        {/* Action Buttons: [Upload Report], [Search Reports] */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            icon={Search}
            onClick={() => {
              setActiveTab('dashboard');
              searchInputRef.current?.focus();
            }}
            className="text-xs font-semibold"
          >
            Search Reports
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={Upload}
            onClick={() => setIsUploadOpen(true)}
            className="bg-teal-700 hover:bg-teal-800 text-xs font-bold shadow-2xs"
          >
            Upload Report
          </Button>

          <UniversalLanguageSelector
            language={globalLanguage}
            onChangeLanguage={setGlobalLanguage}
          />
        </div>
      </div>

      {/* ==================================================== */}
      {/* SUMMARY CARDS (Requirement 1) */}
      {/* Total Reports, Recent Reports, Doctor Reviewed, Needs Review */}
      {/* ==================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Reports */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Reports
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 tabular-nums">
              {totalReportsCount}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Recorded tests</span>
          </div>
          <p className="text-[10px] text-slate-400 pt-0.5">Stored in Digital Health Locker</p>
        </div>

        {/* Recent Reports */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block">
            Recent Reports
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-teal-800 tabular-nums">
              {recentReportsCount}
            </span>
            <span className="text-[11px] text-teal-700 font-medium">Last 3 months</span>
          </div>
          <p className="text-[10px] text-slate-400 pt-0.5">Chronologically indexed</p>
        </div>

        {/* Doctor Reviewed */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
            Doctor Reviewed
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-800 tabular-nums">
              {doctorReviewedCount}
            </span>
            <span className="text-[11px] text-emerald-700 font-medium">Signed by physician</span>
          </div>
          <p className="text-[10px] text-slate-400 pt-0.5">With clinical review notes</p>
        </div>

        {/* Needs Review */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
            Needs Review
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-800 tabular-nums">
              {needsReviewCount}
            </span>
            <span className="text-[11px] text-amber-700 font-medium">Consultation pending</span>
          </div>
          <p className="text-[10px] text-slate-400 pt-0.5">Discuss at next visit</p>
        </div>
      </div>

      {/* Navigation Tabs for Advanced Report Sub-Views */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`px-3.5 py-1.5 rounded-lg font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'dashboard'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5 text-teal-700" />
          <span>Recent Reports</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('compare')}
          className={`px-3.5 py-1.5 rounded-lg font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'compare'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Columns className="w-3.5 h-3.5 text-teal-700" />
          <span>Compare Reports</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('trends')}
          className={`px-3.5 py-1.5 rounded-lg font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'trends'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-teal-700" />
          <span>Monthly Trend Charts</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('terms')}
          className={`px-3.5 py-1.5 rounded-lg font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'terms'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-teal-700" />
          <span>Medical Terms</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('timeline')}
          className={`px-3.5 py-1.5 rounded-lg font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'timeline'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-teal-700" />
          <span>Health Timeline</span>
        </button>
      </div>

      {/* ==================================================== */}
      {/* VIEW: RECENT REPORTS DASHBOARD */}
      {/* ==================================================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-4">
          {/* Categories Filter Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {REPORT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-teal-700 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="bg-white p-3.5 border border-slate-200 rounded-xl flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by report name, lab, doctor, or test parameter..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:border-teal-500 focus:outline-hidden"
              />
            </div>

            {searchTerm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchTerm('')}
                className="text-xs"
              >
                Clear Search
              </Button>
            )}
          </div>

          {/* AI Pipeline Architecture Banner (Requirement 18) */}
          <AIPipelinePreview />

          {/* Section Title */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Recent Reports</h2>
              <p className="text-xs text-slate-500">
                Select [Open Report] to examine structured parameters or [Understand Report] for plain-language explanations
              </p>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Showing {filteredReports.length} {filteredReports.length === 1 ? 'report' : 'reports'}
            </span>
          </div>

          {/* Reports Grid (Requirement 1) */}
          {filteredReports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredReports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onOpenReport={handleOpenReport}
                  onUnderstandReport={handleUnderstandReport}
                />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-xl space-y-3">
              <FileCheck2 className="w-10 h-10 text-slate-400 mx-auto" />
              <div>
                <h4 className="font-bold text-slate-800 text-sm">No Reports Match Current Filters</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Try clearing your search keyword or switching categories.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All');
                }}
              >
                Reset Filters
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* VIEW: COMPARE REPORTS (Requirement 13) */}
      {/* ==================================================== */}
      {activeTab === 'compare' && (
        <ReportComparison
          reports={reports}
          onClose={() => setActiveTab('dashboard')}
        />
      )}

      {/* ==================================================== */}
      {/* VIEW: MONTHLY TREND CHARTS (Requirement 14) */}
      {/* ==================================================== */}
      {activeTab === 'trends' && (
        <div className="space-y-4">
          <ReportTrendChart />
        </div>
      )}

      {/* ==================================================== */}
      {/* VIEW: MEDICAL TERMS GLOSSARY (Requirement 6) */}
      {/* ==================================================== */}
      {activeTab === 'terms' && (
        <div className="space-y-4">
          <div className="bg-white p-5 border border-slate-200 rounded-xl space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Medical Terminology Dictionary</h3>
              <p className="text-xs text-slate-500">
                Beginner-friendly explanations for terms commonly found in diagnostic lab reports
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {Object.keys(MEDICAL_GLOSSARY).map((termKey) => (
                <MedicalTermCard key={termKey} termKey={termKey} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* VIEW: HEALTH TIMELINE CONNECTION (Requirement 15) */}
      {/* ==================================================== */}
      {activeTab === 'timeline' && (
        <Card title="Diagnostic Reports Longitudinal Health Timeline" icon={Clock}>
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 leading-relaxed">
              Longitudinal tracking visually connecting your laboratory tests with consultations, prescriptions, and physician sign-offs.
            </p>

            <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 space-y-6 ml-2 sm:ml-4 py-2">
              {[
                {
                  date: '28 Sep 2026 (10:15 AM)',
                  event: 'Doctor Consultation',
                  note: 'Scheduled follow-up video consultation with Dr. Ananya Sen to review CBC Hemogram results and blood pressure.',
                  type: 'Clinical Visit',
                  badge: 'Upcoming',
                },
                {
                  date: '25 Sep 2026 (09:05 AM)',
                  event: 'Report Reviewed by Dr. Arun Kumar',
                  note: 'Dr. Arun Kumar completed clinical review of CBC: noted borderline low hemoglobin (11.2 g/dL) for discussion.',
                  type: 'Doctor Review',
                  badge: 'Doctor Reviewed',
                },
                {
                  date: '24 Sep 2026 (02:15 PM)',
                  event: 'Blood Test Uploaded (CBC)',
                  note: 'Complete Blood Count (CBC) with Hemogram digitized from City Diagnostic Center.',
                  type: 'Lab Report',
                  badge: 'Uploaded',
                },
                {
                  date: '13 Sep 2026 (11:15 AM)',
                  event: 'Lipid Profile Reviewed',
                  note: 'Dr. Ananya Sen confirmed total cholesterol decreased to 195 mg/dL; continued evening Atorvastatin.',
                  type: 'Doctor Review',
                  badge: 'Doctor Reviewed',
                },
                {
                  date: '12 Sep 2026 (04:20 PM)',
                  event: 'Lipid Profile Blood Test',
                  note: 'Fasting lipid panel completed at City Care Diagnostics Laboratory.',
                  type: 'Lab Report',
                  badge: 'Uploaded',
                },
                {
                  date: '15 Aug 2026 (10:00 AM)',
                  event: 'Fasting Glucose & HbA1c Test',
                  note: 'Metro Diagnostic Center recorded fasting glucose 114 mg/dL and HbA1c 6.1%. Metformin 500mg BD initiated.',
                  type: 'Lab Report',
                  badge: 'Doctor Reviewed',
                },
              ].map((evt, idx) => (
                <div key={idx} className="relative group">
                  <div className="absolute -left-[37px] sm:-left-[45px] top-0 w-8 h-8 rounded-full bg-white border-2 border-teal-600 flex items-center justify-center text-teal-700 shadow-2xs group-hover:scale-105 transition-transform">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-teal-400 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                          {evt.type}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm">{evt.event}</h4>
                      </div>
                      <span className="text-slate-500 font-medium">{evt.date}</span>
                    </div>
                    <p className="text-slate-600 text-xs leading-relaxed">{evt.note}</p>
                    <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Authenticated Timeline Record</span>
                      <span className="text-teal-800 font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-[10px]">
                        {evt.badge}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* ==================================================== */}
      {/* 2. COMPREHENSIVE REPORT READER (Requirement 2) */}
      {/* ==================================================== */}
      <ReportReader
        report={activeReaderReport}
        isOpen={!!activeReaderReport}
        onClose={() => setActiveReaderReport(null)}
        onOpenComparison={(rep) => {
          setActiveReaderReport(null);
          setActiveTab('compare');
        }}
        onOpenTrend={(rep) => {
          setActiveReaderReport(null);
          setActiveTab('trends');
        }}
      />

      {/* ==================================================== */}
      {/* REPORT UPLOAD MODAL (Requirement 17) */}
      {/* ==================================================== */}
      <ReportUpload
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}
