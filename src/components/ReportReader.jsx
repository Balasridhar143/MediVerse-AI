import React, { useState } from 'react';
import {
  X,
  FileCheck2,
  Calendar,
  Building2,
  User,
  Sparkles,
  Volume2,
  Languages,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Columns,
  CheckCircle2,
  AlertTriangle,
  Info,
  HelpCircle,
  Stethoscope,
  Clock,
} from 'lucide-react';
import Button from './Button';
import ReportOverview from './ReportOverview';
import LabResultsTable from './LabResultsTable';
import LabResultDetails from './LabResultDetails';
import MedicalTermCard from './MedicalTermCard';
import DoctorReview from './DoctorReview';
import VoiceExplanation from './VoiceExplanation';
import UniversalLanguageSelector from './LanguageSelector';
import { getLanguageConfig } from '../utils/languageRegistry';
import { getUiText, getReportTranslation } from '../data/medicalTranslations';

/**
 * ReportReader
 * Comprehensive patient report workspace displaying:
 * 1. REPORT HEADER (Name, Date, Lab, Doctor, Status)
 * 2. Dedicated Mode Switch: Standard Medical View | Easy Explanation View
 * 3. [UNDERSTAND MY REPORT] 7-part structured patient walkthrough
 * 4. REPORT OVERVIEW (What is this report + Report Understanding completeness checklist)
 * 5. LAB VALUE TABLE with visual indicators (↓ Below, ✓ Within, ↑ Above) & click-to-explain
 * 6. MEDICAL TERMS section with beginner-friendly [Explain More] cards
 * 7. DOCTOR REVIEW section (doctor notes, signature, or request review simulation)
 * 8. Multi-language translation & browser speech synthesis voice controls
 */
export default function ReportReader({
  report,
  isOpen,
  onClose,
  onOpenComparison,
  onOpenTrend,
  onOpenExplanation,
  initialLanguage = 'en',
}) {
  const [viewMode, setViewMode] = useState('standard'); // 'standard' | 'easy'
  const [isUnderstandWalkthroughOpen, setIsUnderstandWalkthroughOpen] = useState(false);
  const [selectedParamForDetail, setSelectedParamForDetail] = useState(null);
  const [language, setLanguage] = useState(initialLanguage);

  React.useEffect(() => {
    if (initialLanguage) {
      setLanguage(initialLanguage);
    }
  }, [initialLanguage, isOpen]);

  if (!isOpen || !report) return null;

  const currentLangConfig = getLanguageConfig(language);
  const isEnglish = language === 'en';

  // Results categorizations
  const withinRangeParams = report.parameters?.filter((p) => p.indicator === 'within') || [];
  const outsideRangeParams = report.parameters?.filter((p) => p.indicator !== 'within') || [];

  // Speech summary text
  const repTrans = getReportTranslation(report.id, language);
  const speechText = repTrans?.simpleExplanation
    ? `${report.reportName}. ${repTrans.whatIsThisReport} ${repTrans.simpleExplanation} ${repTrans.whatThisMeans}`
    : `${report.reportName}. Conducted at ${report.hospital} on ${report.date}. ${report.whatIsThisReport} Important finding: ${report.importantFindings}. Discuss results with your doctor.`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[95vh] flex flex-col">
        {/* ==================================================== */}
        {/* 1. REPORT HEADER */}
        {/* ==================================================== */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/80 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 uppercase tracking-wider">
                  {report.reportType}
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-xs text-slate-500 font-medium">
                  Patient: <strong className="text-slate-800">Rahul Sharma</strong>
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">
                {report.reportName}
              </h1>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 cursor-pointer"
                aria-label="Close report reader"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Subheader Metadata Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 mt-3 border-t border-slate-200/70 text-xs">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Date:</span>
              <strong className="text-slate-800 font-bold">{report.date}</strong>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Lab / Diagnostic Center:</span>
              <strong className="text-slate-800 font-semibold truncate block" title={report.hospital}>
                {report.hospital}
              </strong>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Attending Doctor:</span>
              <strong className="text-slate-800 font-semibold">{report.doctor || 'Dr. Arun Kumar'}</strong>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Status:</span>
              <span className="font-bold text-teal-700">{report.status}</span>
            </div>
          </div>
        </div>

        {/* ==================================================== */}
        {/* INTERACTIVE CONTROLS BAR: Mode Switch, Understand, Voice, Language */}
        {/* ==================================================== */}
        <div className="px-5 py-3 bg-white border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0 text-xs">
          {/* View Mode Toggle: Standard Medical View vs Easy Explanation View */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600 text-[11px] uppercase tracking-wider hidden sm:inline">
              View Mode:
            </span>
            <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode('standard')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'standard'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Standard Medical View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('easy')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'easy'
                    ? 'bg-teal-700 text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Easy Explanation View</span>
              </button>
            </div>
          </div>

          {/* Action cluster: Understand My Report + Explain Simply + Language + Voice */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {onOpenExplanation && (
              <Button
                variant="outline"
                size="sm"
                icon={Sparkles}
                onClick={() => onOpenExplanation(report)}
                className="text-xs font-semibold text-teal-800 border-teal-300 hover:bg-teal-50"
              >
                Explain Simply
              </Button>
            )}

            <Button
              variant="primary"
              size="sm"
              icon={Sparkles}
              onClick={() => setIsUnderstandWalkthroughOpen(true)}
              className="bg-teal-700 hover:bg-teal-800 text-xs font-bold shadow-2xs"
            >
              UNDERSTAND MY REPORT
            </Button>

            <UniversalLanguageSelector
              language={language}
              onChangeLanguage={setLanguage}
            />

            <VoiceExplanation
              text={speechText}
              language={language}
              label="Listen"
            />
          </div>
        </div>

        {/* Multilingual Notice */}
        {!isEnglish && (
          <div className="px-5 py-2 bg-teal-50/70 border-b border-teal-200 text-[11px] text-teal-900 flex items-center gap-2 shrink-0 animate-in fade-in font-medium">
            <Info className="w-4 h-4 text-teal-600 shrink-0" />
            <span>
              <strong>{currentLangConfig.nativeName} ({currentLangConfig.name}): </strong>
              {getUiText('multilingualNotice', language)}
            </span>
          </div>
        )}

        {/* ==================================================== */}
        {/* SCROLLABLE REPORT BODY */}
        {/* ==================================================== */}
        <div className="p-5 overflow-y-auto space-y-6 text-xs">
          {/* Easy mode banner */}
          {viewMode === 'easy' && (
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between gap-2 text-teal-950 font-medium">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
                <span>
                  <strong>Easy Explanation Mode Active:</strong> Medical terms and laboratory parameters are displayed with plain-language everyday descriptions.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewMode('standard')}
                className="text-xs font-bold text-teal-800 underline hover:text-teal-950 cursor-pointer shrink-0"
              >
                Back to Standard
              </button>
            </div>
          )}

          {/* 2. REPORT OVERVIEW + REPORT UNDERSTANDING COMPLETENESS */}
          <ReportOverview report={report} language={language} />

          {/* 3. LAB VALUE TABLE */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Laboratory Parameters & Measurements</h3>
                <p className="text-[11px] text-slate-500">
                  Click any parameter row or [Explain Result] to view in-depth 4-level clinical explanations
                </p>
              </div>

              {/* Compare / Trend Shortcut Actions */}
              <div className="flex items-center gap-2">
                {onOpenComparison && (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Columns}
                    onClick={() => onOpenComparison(report)}
                    className="text-xs"
                  >
                    Compare Previous
                  </Button>
                )}
                {onOpenTrend && (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={TrendingUp}
                    onClick={() => onOpenTrend(report)}
                    className="text-xs"
                  >
                    View Trend
                  </Button>
                )}
              </div>
            </div>

            <LabResultsTable
              parameters={report.parameters || []}
              onSelectParameter={setSelectedParamForDetail}
              isEasyMode={viewMode === 'easy'}
              language={language}
            />
          </div>

          {/* 6. MEDICAL TERMS SECTION */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Medical Terms in this Report</h3>
                <p className="text-[11px] text-slate-500">
                  Beginner-friendly definitions for clinical terminology found in your laboratory findings
                </p>
              </div>
              <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                Predefined Reference
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {(report.terms || ['Hemoglobin', 'WBC', 'Platelets', 'Reference Range']).map((tKey) => (
                <MedicalTermCard key={tKey} termKey={tKey} language={language} />
              ))}
            </div>
          </div>

          {/* 16. DOCTOR REVIEW SECTION */}
          <DoctorReview
            doctorReview={report.doctorReview}
            defaultDoctor={report.doctor}
            reportName={report.reportName}
          />

          {/* Mandatory Patient Safety Reminder (Requirement 19) */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-2.5 text-[11px] text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong>Patient Safety Notice:</strong>
              <p className="leading-relaxed">
                AI-assisted explanation for understanding only. It is not a diagnosis or treatment recommendation. Reference ranges may vary between laboratories and individuals. Always discuss medical decisions with your doctor.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0 text-xs">
          <span className="text-slate-400 text-[11px]">
            PulseCare Medical Intelligence · Longitudinal Electronic Records
          </span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Reader
          </Button>
        </div>
      </div>

      {/* Slide-out / Modal for Clicked Parameter Details (Requirement 4 & 5) */}
      <LabResultDetails
        parameter={selectedParamForDetail}
        report={report}
        isOpen={!!selectedParamForDetail}
        onClose={() => setSelectedParamForDetail(null)}
        language={language}
      />

      {/* "UNDERSTAND MY REPORT" 7-STEP WALKTHROUGH MODAL (Requirement 9) */}
      {isUnderstandWalkthroughOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-teal-50/60 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-700 text-white rounded-xl shadow-2xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    UNDERSTAND MY REPORT
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Comprehensive 7-Step Patient-Friendly Walkthrough
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsUnderstandWalkthroughOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: 7 Structured Questions */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Safety notice */}
              <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-lg text-[11px] text-amber-900">
                <strong>Important: </strong>
                This walkthrough is designed to help you understand your laboratory document in simple words. It does not provide a medical diagnosis, predict illness, or recommend starting, stopping, or changing medications.
              </div>

              {/* 1. What is this report? */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <strong className="text-teal-950 font-bold block text-xs">
                  1. {getUiText('whatIsThisReport', language) || 'What is this report?'}
                </strong>
                <p className="text-slate-700 leading-relaxed font-medium">
                  {repTrans?.whatIsThisReport || report.whatIsThisReport}
                </p>
              </div>

              {/* 2. What tests are included? */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <strong className="text-teal-950 font-bold block text-xs">
                  2. What tests are included in this report?
                </strong>
                <p className="text-slate-700 leading-relaxed">
                  This report includes measurements for: {report.parameters?.map((p) => p.name).join(', ')}.
                </p>
              </div>

              {/* 3. Which results are within the displayed range? */}
              <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-1">
                <strong className="text-emerald-950 font-bold block text-xs">
                  3. Which results are within the displayed laboratory reference range?
                </strong>
                {withinRangeParams.length > 0 ? (
                  <ul className="list-disc pl-4 space-y-1 text-slate-700">
                    {withinRangeParams.map((p) => (
                      <li key={p.name}>
                        <strong>{p.name}:</strong> {p.value} {p.unit} (Displayed range: {p.referenceRange})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-600">No parameters in this category.</p>
                )}
              </div>

              {/* 4. Which results are outside the displayed range? */}
              <div className="p-3.5 bg-amber-50/50 border border-amber-200 rounded-xl space-y-1">
                <strong className="text-amber-950 font-bold block text-xs">
                  4. Which results are outside the displayed reference range?
                </strong>
                {outsideRangeParams.length > 0 ? (
                  <ul className="list-disc pl-4 space-y-1 text-slate-700">
                    {outsideRangeParams.map((p) => (
                      <li key={p.name}>
                        <strong>{p.name}:</strong> {p.value} {p.unit} ({p.status}. Displayed range: {p.referenceRange})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-600">All results are within the displayed laboratory reference ranges.</p>
                )}
              </div>

              {/* 5. What does each important test measure? */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <strong className="text-teal-950 font-bold block text-xs">
                  5. What does each important test measure?
                </strong>
                <div className="space-y-1.5 pt-1">
                  {report.parameters?.map((p) => (
                    <div key={p.name} className="p-2 bg-white rounded-lg border border-slate-200">
                      <strong className="text-slate-900">{p.name}: </strong>
                      <span className="text-slate-700">{p.purpose || p.easyMeaning}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6. What do the medical terms mean? */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <strong className="text-teal-950 font-bold block text-xs">
                  6. What do the medical terms mean?
                </strong>
                <div className="space-y-1.5 pt-1">
                  {(report.terms || ['Hemoglobin', 'Reference Range']).map((t) => (
                    <div key={t} className="p-2 bg-white rounded-lg border border-slate-200">
                      <strong className="text-slate-900">{t}: </strong>
                      <span className="text-slate-700">
                        {t === 'Hemoglobin'
                          ? 'A protein in red blood cells that helps carry oxygen.'
                          : t === 'Reference Range'
                          ? 'The range shown by the laboratory for comparison.'
                          : t === 'WBC'
                          ? 'White blood cells that are part of the immune system.'
                          : 'A routine clinical parameter.'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 7. What should I discuss with my doctor? */}
              <div className="p-3.5 bg-teal-50/60 border border-teal-200 rounded-xl space-y-1">
                <strong className="text-teal-950 font-bold block text-xs">
                  7. {getUiText('whatShouldIDo', language) || 'What should I discuss with my doctor?'}
                </strong>
                <p className="text-slate-800 leading-relaxed font-medium">
                  {repTrans?.whatThisMeans || report.doctorReview?.note || 'Review any results outside the displayed range together with your overall symptoms, current medications, and routine lifestyle.'}
                </p>
                <p className="text-[11px] text-slate-500 pt-1">
                  Tip: {getUiText('doctorDiscussionAdvisory', language)}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-400">
                PulseCare Health Intelligence
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsUnderstandWalkthroughOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
