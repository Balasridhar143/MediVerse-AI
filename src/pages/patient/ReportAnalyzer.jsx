import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  FileText,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileCheck2,
  Building2,
  Calendar,
  ExternalLink,
  HelpCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  Stethoscope,
  ChevronDown,
  ChevronUp,
  FileQuestion,
  Activity,
  Info,
  Check,
  XCircle,
  User,
  ListChecks,
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import UniversalLanguageSelector from '../../components/LanguageSelector';
import { reportService } from '../../services/reportService';
import { useAuth } from '../../context/AuthContext';

export default function ReportAnalyzer() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlReportId = searchParams.get('reportId') || '';

  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    return localStorage.getItem('mediverse_patient_language') || 'en';
  });

  const [file, setFile] = useState(null);
  const [patientName, setPatientName] = useState(user?.full_name || user?.name || '');
  const [reportName, setReportName] = useState('');
  const [reportType, setReportType] = useState('Blood Tests (CBC & Metabolic)');
  const [hospital, setHospital] = useState('Advanced Clinical Laboratories');
  const [doctor, setDoctor] = useState('Dr. Arun Kumar, MD');
  const [validationError, setValidationError] = useState('');
  const [analysisError, setAnalysisError] = useState('');

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRetryingStep5, setIsRetryingStep5] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [currentReportId, setCurrentReportId] = useState(urlReportId || null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [step5Error, setStep5Error] = useState('');

  const fileInputRef = useRef(null);

  // 1. Load saved analysis on mount or URL param change (Persistence requirement)
  useEffect(() => {
    let isMounted = true;
    if (urlReportId && (!analysisResult || currentReportId !== urlReportId)) {
      setIsAnalyzing(true);
      setAnalysisError('');
      reportService.getReportById(urlReportId)
        .then((rep) => {
          if (!isMounted) return;
          if (rep) {
            setAnalysisResult(rep);
            setCurrentReportId(rep.id);
            if (rep.reportName) setReportName(rep.reportName);
            if (rep.patientName) setPatientName(rep.patientName);
            if (rep.hospital) setHospital(rep.hospital);
            if (rep.doctor) setDoctor(rep.doctor);
            if (rep.reportType) setReportType(rep.reportType);
            setSavedSuccess(true);
          }
        })
        .catch((err) => {
          if (isMounted) {
            console.warn('Failed to load saved report analysis:', err);
            setAnalysisError('Unable to load saved report analysis from database.');
          }
        })
        .finally(() => {
          if (isMounted) setIsAnalyzing(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [urlReportId]);

  const handleLanguageChange = async (lang) => {
    setSelectedLanguage(lang);
    localStorage.setItem('mediverse_patient_language', lang);
    if (currentReportId) {
      try {
        setIsAnalyzing(true);
        const res = await reportService.reanalyzeReport(currentReportId, lang);
        if (res.rag_analysis) {
          setAnalysisResult(res.rag_analysis);
        } else if (res.report) {
          setAnalysisResult(res.report);
        }
      } catch (e) {
        console.warn('Re-analysis translation warning:', e);
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const analysisSteps = [
    'Reading and extracting text from report (PDF / OCR)...',
    'Identifying quantitative medical tests, values, and units...',
    'Comparing measurements against clinical reference intervals...',
    'Querying medical knowledge guidelines (WHO, ADA, ICSH, KDIGO)...',
    'Synthesizing detailed, patient-friendly clinical explanation...'
  ];

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    validateFile(selected);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    validateFile(dropped);
  };

  const validateFile = (candidate) => {
    setValidationError('');
    setAnalysisError('');
    if (!candidate) return;

    const allowed = ['pdf', 'png', 'jpg', 'jpeg', 'webp'];
    const ext = candidate.name.split('.').pop()?.toLowerCase();
    if (!ext || !allowed.includes(ext)) {
      setValidationError('Supported file formats: PDF, JPG, PNG, or WEBP.');
      setFile(null);
      return;
    }

    if (candidate.size > 15 * 1024 * 1024) {
      setValidationError('File size exceeds the 15MB limit. Please upload a smaller document.');
      setFile(null);
      return;
    }

    setFile(candidate);
    if (!reportName) {
      setReportName(candidate.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
    }
  };

  const runAnalysis = async () => {
    if (!file && !currentReportId) {
      setValidationError('Please select or drag a medical report file before initiating analysis.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError('');
    setValidationError('');
    setSavedSuccess(false);
    setCurrentStep(0);

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < analysisSteps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 800);

    try {
      const response = await reportService.analyzeReport({
        file,
        patientName: patientName || user?.full_name || 'Patient Record',
        reportName: reportName || file?.name?.replace(/\.[^/.]+$/, '') || 'Diagnostic Report',
        reportType,
        hospital,
        doctor,
        language: selectedLanguage
      });

      clearInterval(stepInterval);
      setCurrentStep(analysisSteps.length - 1);
      const resData = response.rag_analysis || response.ragAnalysis || response.report;
      const repId = response.report_id || response.reportId || response.report?.id;

      setAnalysisResult(resData);
      setCurrentReportId(repId);
      setSavedSuccess(true);
      setStep5Error('');

      // Persist in URL query so refreshing or sharing keeps the analysis
      if (repId) {
        setSearchParams({ reportId: repId }, { replace: true });
      }
    } catch (err) {
      clearInterval(stepInterval);
      console.error('Report analysis error:', err);
      const msg = err.response?.data?.detail || err.message || 'Verification of document failed.';
      setAnalysisError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Step 5 dedicated retry without re-uploading file
   */
  const handleRetryStep5 = async () => {
    if (!currentReportId) return;
    setIsRetryingStep5(true);
    setStep5Error('');
    try {
      const res = await reportService.explainReport(currentReportId, selectedLanguage);
      if (res.report) {
        setAnalysisResult(res.report);
      } else if (res.explanation) {
        setAnalysisResult((prev) => ({
          ...prev,
          ai_explanation: res.explanation,
          aiExplanation: res.explanation
        }));
      }
      setSavedSuccess(true);
    } catch (err) {
      console.error('Step 5 retry failed:', err);
      const msg = err.response?.data?.detail || err.message || 'Friendly explanation generation failed. Please try again.';
      setStep5Error(msg);
    } finally {
      setIsRetryingStep5(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setAnalysisResult(null);
    setCurrentReportId(null);
    setValidationError('');
    setAnalysisError('');
    setStep5Error('');
    setSavedSuccess(false);
    setCurrentStep(0);
    setSearchParams({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Helper extracts explanation data safely across live analysis & loaded DB formats
  const rawAi = (analysisResult?.ai_explanation && typeof analysisResult.ai_explanation === 'object' && Object.keys(analysisResult.ai_explanation).length > 0)
    ? analysisResult.ai_explanation
    : (analysisResult?.aiExplanation && typeof analysisResult.aiExplanation === 'object' && Object.keys(analysisResult.aiExplanation).length > 0)
    ? analysisResult.aiExplanation
    : {};
  const aiExp = rawAi;
  const structData = analysisResult?.structured_data || analysisResult?.structuredData || {};
  const parameters = analysisResult?.parameters || analysisResult?.test_results_table || [];

  const normalParams = parameters.filter((p) => p.status === 'Normal' || p.flag === 'Normal');
  const abnormalParams = parameters.filter((p) => p.status !== 'Normal' && p.flag !== 'Normal');
  const criticalParams = parameters.filter((p) => p.is_critical);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <PageHeader
        badge="Evidence-Based Clinical Intelligence"
        badgeStatus="Verified Lab Analysis"
        title="AI Medical Report Analyzer"
        subtitle="Automated laboratory parameter extraction, physiological reference interval comparison, and clinical guideline citations."
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <UniversalLanguageSelector
              language={selectedLanguage}
              onChangeLanguage={handleLanguageChange}
            />
            <Link to="/patient/reports">
              <Button variant="outline" size="sm" icon={FileCheck2}>
                My Health Records
              </Button>
            </Link>
          </div>
        }
      />

      {/* Clinical Practice Guardrail & Safety Notice */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <span className="font-bold">CLINICAL SAFETY MANDATE & AI BOUNDARY: </span>
          Automated analysis provides evidence-based educational insights and reference comparisons. It does <strong>NOT</strong> provide a definitive diagnosis, prognosis, or prescription. Always review lab findings with your attending doctor for comprehensive medical evaluation.
        </div>
      </div>

      {/* Analysis Error Card with Retry Option (Requirement 9) */}
      {analysisError && (
        <div className="p-5 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-rose-900">Analysis Encountered an Error</h4>
              <p className="text-xs text-rose-800 leading-relaxed">{analysisError}</p>
              <p className="text-[11px] text-rose-700">
                Troubleshooting tips: Ensure document is a readable PDF, PNG, or JPG (under 15MB). Scanned reports should have clear contrast and legible text.
              </p>
            </div>
          </div>
          <div className="pt-2 flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              icon={RefreshCw}
              onClick={runAnalysis}
              className="bg-rose-700 hover:bg-rose-800 text-xs font-bold shadow-xs"
            >
              Retry Analysis
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetForm}
              className="text-xs"
            >
              Select Another Document
            </Button>
          </div>
        </div>
      )}

      {/* Upload Zone (Kept completely functional and preserved) */}
      {!analysisResult && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card title="Upload Diagnostic Document" icon={Upload}>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                  isDragOver
                    ? 'border-teal-500 bg-teal-50/60'
                    : file
                    ? 'border-teal-300 bg-teal-50/20'
                    : 'border-slate-300 hover:border-teal-400 bg-slate-50/50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  className="hidden"
                />

                <div className="w-14 h-14 bg-teal-100 text-teal-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-2xs">
                  {file ? <FileCheck2 className="w-7 h-7" /> : <Upload className="w-7 h-7" />}
                </div>

                {file ? (
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-slate-800">{file.name}</p>
                    <p className="text-xs text-slate-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type || 'Document'}
                    </p>
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs"
                      >
                        Change File
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-slate-800">
                      Drag & drop your medical laboratory report here
                    </p>
                    <p className="text-xs text-slate-500">
                      Supports PDF, PNG, JPG, or scanned lab reports up to 15MB
                    </p>
                    <div className="pt-2">
                      <Button
                        variant="primary"
                        size="sm"
                        icon={Upload}
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-teal-700 hover:bg-teal-800 text-xs font-bold"
                      >
                        Select Document
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {validationError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2 mt-4">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Progress Stepper */}
              {isAnalyzing && (
                <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-teal-800">
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 animate-spin text-teal-600" />
                      Analyzing Report via RAG Pipeline
                    </span>
                    <span>Step {currentStep + 1} of {analysisSteps.length}</span>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-teal-600 h-2 transition-all duration-500 rounded-full"
                      style={{ width: `${((currentStep + 1) / analysisSteps.length) * 100}%` }}
                    />
                  </div>

                  <p className="text-xs text-slate-600 font-medium animate-pulse">
                    {analysisSteps[currentStep]}
                  </p>
                </div>
              )}

              {!isAnalyzing && (
                <div className="pt-4 flex justify-end">
                  <Button
                    variant="primary"
                    size="md"
                    icon={Sparkles}
                    onClick={runAnalysis}
                    disabled={!file}
                    className="bg-teal-700 hover:bg-teal-800 text-xs font-bold shadow-2xs"
                  >
                    Run Clinical RAG Analysis
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* Metadata Configuration */}
          <div className="space-y-4">
            <Card title="Document Metadata" icon={FileText}>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Patient Name</label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Enter patient full name"
                    className="w-full p-2 border border-slate-300 rounded-lg focus:border-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Report Description</label>
                  <input
                    type="text"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    placeholder="e.g. Comprehensive Metabolic Panel"
                    className="w-full p-2 border border-slate-300 rounded-lg focus:border-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Diagnostic Category</label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:border-teal-500 focus:outline-hidden bg-white"
                  >
                    <option value="Complete Blood Count (CBC)">Complete Blood Count (CBC)</option>
                    <option value="Diabetes & Glycemic Panel (HbA1c / Glucose)">Diabetes & Glycemic Panel</option>
                    <option value="Renal Function Tests (RFT / KFT)">Renal Function Tests (RFT)</option>
                    <option value="Liver Function Tests (LFT)">Liver Function Tests (LFT)</option>
                    <option value="Lipid Profile">Lipid Profile</option>
                    <option value="Thyroid Function (TSH, T3, T4)">Thyroid Function</option>
                    <option value="General Biochemistry & Blood Tests">General Biochemistry</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Laboratory / Hospital Name</label>
                  <input
                    type="text"
                    value={hospital}
                    onChange={(e) => setHospital(e.target.value)}
                    placeholder="e.g. Apollo Diagnostics"
                    className="w-full p-2 border border-slate-300 rounded-lg focus:border-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </Card>

            <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-teal-800 font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified Guideline Citations</span>
              </div>
              <p className="text-[11px] text-teal-900 leading-relaxed">
                Extracted laboratory values are cross-referenced with diagnostic thresholds from WHO, the American Diabetes Association (ADA), and the International Council for Standardization in Haematology (ICSH).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* COMPLETE AI REPORT EXPLANATION DISPLAY (Requirements 6 & 7) */}
      {/* ========================================================================= */}
      {analysisResult && (
        <div className="space-y-6">
          {/* Success & Persistence Ribbon */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-xs font-bold text-emerald-900">Analysis Complete & Health Record Persisted</p>
                <p className="text-[11px] text-emerald-700">
                  Extracted biomarkers, reference bounds, and clinical explanations are saved to your electronic health record.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <UniversalLanguageSelector
                language={selectedLanguage}
                onChangeLanguage={handleLanguageChange}
              />
              {currentReportId && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={Sparkles}
                  onClick={handleRetryStep5}
                  disabled={isRetryingStep5}
                  className="text-xs font-semibold text-teal-800 border-teal-300 hover:bg-teal-50"
                  title="Re-synthesize patient-friendly clinical explanation without re-uploading"
                >
                  {isRetryingStep5 ? 'Generating Step 5...' : 'Refresh AI Explanation'}
                </Button>
              )}
              <Button variant="outline" size="sm" icon={RefreshCw} onClick={resetForm} className="text-xs">
                Analyze Another
              </Button>
              <Link to="/patient/reports">
                <Button variant="primary" size="sm" icon={FileCheck2} className="bg-teal-700 hover:bg-teal-800 text-xs font-bold">
                  View All Records
                </Button>
              </Link>
            </div>
          </div>

          {/* Step 5 Specific Error & Retry Alert */}
          {step5Error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-rose-900 block font-bold">Step 5: Friendly Explanation Error</strong>
                  <p className="text-rose-800">{step5Error}</p>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                icon={RefreshCw}
                onClick={handleRetryStep5}
                disabled={isRetryingStep5}
                className="bg-rose-700 hover:bg-rose-800 text-xs shrink-0 font-bold"
              >
                {isRetryingStep5 ? 'Retrying...' : 'Retry Step 5'}
              </Button>
            </div>
          )}

          {/* Prompt to generate explanation if missing */}
          {!step5Error && !aiExp.overall_summary && !aiExp.summary && !aiExp.simpleExplanation && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-900 block font-bold">Step 5: Patient-Friendly Explanation Pending</strong>
                  <p className="text-amber-800">Parameters have been extracted, but the comprehensive clinical explanation has not yet been synthesized.</p>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                icon={Sparkles}
                onClick={handleRetryStep5}
                disabled={isRetryingStep5}
                className="bg-teal-700 hover:bg-teal-800 text-xs shrink-0 font-bold"
              >
                {isRetryingStep5 ? 'Synthesizing...' : 'Generate Step 5 Explanation'}
              </Button>
            </div>
          )}

          {/* Metric Highlights Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Total Parameters</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{parameters.length}</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
              <p className="text-xs text-emerald-700 font-medium">Within Normal Bounds</p>
              <p className="text-2xl font-black text-emerald-700 mt-1">{normalParams.length}</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs">
              <p className="text-xs text-amber-700 font-medium">Outside Reference Range</p>
              <p className="text-2xl font-black text-amber-700 mt-1">{abnormalParams.length}</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-xs">
              <p className="text-xs text-rose-700 font-medium">Critical Alerts</p>
              <p className="text-2xl font-black text-rose-700 mt-1">{criticalParams.length}</p>
            </div>
          </div>

          {/* 1. OVERALL REPORT SUMMARY */}
          <Card title="1. Overall Report Summary" icon={FileText}>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-100 text-xs">
                <span className="font-semibold text-slate-700">Patient:</span>
                <strong className="text-slate-900">{analysisResult.patientName || patientName || 'Patient Record'}</strong>
                <span className="text-slate-300">•</span>
                <span className="font-semibold text-slate-700">Category:</span>
                <span className="text-slate-900">{analysisResult.reportType || reportType}</span>
                <span className="text-slate-300">•</span>
                <span className="font-semibold text-slate-700">Facility:</span>
                <span className="text-slate-900">{analysisResult.hospital || hospital}</span>
                <span className="text-slate-300">•</span>
                <span className="font-semibold text-slate-700">Date:</span>
                <span className="text-slate-900">{analysisResult.date || new Date().toISOString().split('T')[0]}</span>
              </div>

              <p className="text-xs text-slate-800 leading-relaxed font-medium bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                {aiExp.overall_summary || aiExp.summary || structData.overall_summary || 'Diagnostic laboratory analysis processed.'}
              </p>
            </div>
          </Card>

          {/* 2. NORMAL & ABNORMAL FINDINGS BREAKDOWN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Abnormal Findings */}
            <Card title="Abnormal Findings (Requires Doctor Correlation)" icon={AlertTriangle}>
              {abnormalParams.length === 0 ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>All analyzed biomarkers fall within standard reference intervals.</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {(aiExp.abnormal_findings || abnormalParams).map((abn, aIdx) => {
                    const testName = abn.test_name || abn.name;
                    const val = abn.value || abn.patient_value;
                    const ref = abn.reference_range || abn.referenceRange;
                    const sig = abn.significance || abn.possible_reasons || 'Observed reading is outside laboratory reference intervals.';

                    return (
                      <div key={aIdx} className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <strong className="text-amber-950 font-bold">{testName}</strong>
                          <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-amber-200 text-amber-900">
                            {abn.status || 'Out of Range'}
                          </span>
                        </div>
                        <p className="text-slate-700 font-mono text-[11px]">
                          Observed: <strong>{val}</strong> {abn.unit || ''} (Ref: {ref})
                        </p>
                        <p className="text-slate-600 text-[11px] leading-relaxed pt-0.5">
                          {sig}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Normal Findings */}
            <Card title="Normal Findings (Healthy Physiological Bounds)" icon={CheckCircle2}>
              {normalParams.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                  No parameters were classified within standard physiological ranges.
                </div>
              ) : (
                <ul className="space-y-2 text-xs">
                  {(aiExp.normal_findings || normalParams).map((norm, nIdx) => {
                    const text = typeof norm === 'string'
                      ? norm
                      : `${norm.test_name || norm.name} (${norm.patient_value || norm.value} ${norm.unit || ''}) aligns with normal bounds (${norm.reference_range || norm.referenceRange}).`;

                    return (
                      <li key={nIdx} className="flex items-start gap-2 p-2 rounded-lg bg-emerald-50/40 border border-emerald-100 text-slate-700">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{text}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>

          {/* 3. STRUCTURED PARAMETERS TABLE (EACH TEST & ITS PURPOSE) */}
          <Card title="2. Structured Test Parameters & Clinical Purpose" icon={Activity}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold">
                    <th className="py-2.5 px-3">Test Parameter</th>
                    <th className="py-2.5 px-3">Purpose in Body</th>
                    <th className="py-2.5 px-3">Observed Value</th>
                    <th className="py-2.5 px-3">Reference Interval</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Detailed Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parameters.map((t, idx) => {
                    const isNormal = t.status === 'Normal' || t.flag === 'Normal';
                    const isCritical = t.is_critical;
                    const isExpanded = expandedRow === idx;

                    return (
                      <React.Fragment key={idx}>
                        <tr className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 font-semibold text-slate-800">
                            {t.test_name || t.name}
                          </td>
                          <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                            {t.purpose || t.meaning || 'Clinical laboratory observation.'}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">
                            {t.patient_value !== undefined ? t.patient_value : t.value} <span className="text-slate-500 font-normal">{t.unit}</span>
                          </td>
                          <td className="py-3 px-3 text-slate-600 font-mono">
                            {t.reference_range || t.referenceRange}
                          </td>
                          <td className="py-3 px-3">
                            {isCritical ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                                <AlertTriangle className="w-3 h-3" /> Critical
                              </span>
                            ) : isNormal ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <CheckCircle2 className="w-3 h-3" /> Normal
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                <AlertCircle className="w-3 h-3" /> {t.status || t.flag || 'Review'}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => setExpandedRow(isExpanded ? null : idx)}
                              className="text-teal-700 hover:text-teal-900 font-semibold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>{isExpanded ? 'Hide' : 'Explain'}</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-slate-50/60">
                            <td colSpan={6} className="py-3 px-4">
                              <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-2">
                                <div>
                                  <span className="font-bold text-slate-700">Test Purpose: </span>
                                  <span className="text-slate-600">{t.purpose || t.meaning}</span>
                                </div>
                                <div>
                                  <span className="font-bold text-slate-700">Possible Physiological Factors: </span>
                                  <span className="text-slate-600">{t.possible_reasons || 'Varies based on hydration, diet, exercise, or acute physiological stressors.'}</span>
                                </div>
                                <div>
                                  <span className="font-bold text-slate-700">Clinical Evaluation: </span>
                                  <span className="text-slate-600">{t.explanation || `${t.test_name} recorded at ${t.patient_value} ${t.unit}.`}</span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* 4. POSSIBLE SIGNIFICANCE OF ABNORMAL VALUES */}
          {abnormalParams.length > 0 && (
            <Card title="3. Possible Significance of Abnormal Values" icon={Info}>
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 text-xs">
                <p className="text-amber-950 font-semibold leading-relaxed">
                  {aiExp.possible_significance || structData.important_findings || 'Abnormal laboratory findings require clinical correlation with symptoms and physical examination.'}
                </p>
                <p className="text-amber-900 text-[11px] leading-relaxed">
                  Important clinical note: An individual lab reading that falls outside established reference intervals does not independently diagnose a chronic disease. Temporary physiological factors like hydration, fasting duration, recent physical exertion, and minor viral illnesses can shift numbers. Your doctor will assess whether repeat testing is required.
                </p>
              </div>
            </Card>
          )}

          {/* 5 & 6. IMPORTANT PRECAUTIONS & RECOMMENDED NEXT STEPS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="4. Important Precautions" icon={ShieldAlert}>
              <ul className="space-y-2.5 text-xs text-slate-700">
                {(aiExp.precautions || [
                  'Do not independently start, stop, or change doses of any prescription medications based on this laboratory report.',
                  'Avoid self-treating abnormal results with unverified over-the-counter supplements or antibiotics without physician approval.',
                  'Maintain balanced daily hydration and dietary habits unless specific restrictions have been advised by your medical provider.',
                  'If you experience severe fatigue, shortness of breath, dizziness, sudden chest pain, or high fever, seek immediate medical consultation.'
                ]).map((pre, pIdx) => (
                  <li key={pIdx} className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{pre}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card title="5. Recommended Next Steps" icon={CheckCircle2}>
              <ul className="space-y-2.5 text-xs text-slate-700">
                {(aiExp.recommendations || structData.recommendations || [
                  'Schedule a follow-up consultation with your attending physician to review these laboratory findings.',
                  'Keep this digitized report accessible in your MediVerse profile and share it with your consulting clinician.',
                  'Plan for a repeat follow-up test in 2 to 4 weeks if recommended by your physician to track longitudinal stabilization.'
                ]).map((rec, rIdx) => (
                  <li key={rIdx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* 7. QUESTIONS TO ASK YOUR DOCTOR */}
          <Card title="6. Questions You Can Ask Your Doctor" icon={HelpCircle}>
            <ul className="space-y-2.5 text-xs text-slate-700">
              {(aiExp.doctor_discussion_questions || aiExp.questionsForDoctor || [
                'What might be the primary cause of any abnormal readings in this report?',
                'Do any of these values warrant repeat confirmatory testing or additional diagnostic panels?',
                'Could recent dietary habits, dehydration, or medications have influenced these specific test numbers?',
                'When should my next routine follow-up checkup be scheduled?'
              ]).map((q, qIdx) => (
                <li key={qIdx} className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <ArrowRight className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <span className="font-medium text-slate-800">{q}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* 8. EVIDENCE-BASED GUIDELINE CITATIONS (RAG PIPELINE) */}
          {(analysisResult.rag_citations || analysisResult.rag_sources || []).length > 0 && (
            <Card title="7. Evidence-Based Guideline Citations (RAG Pipeline)" icon={ShieldCheck}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(analysisResult.rag_citations || analysisResult.rag_sources || []).map((citation, cIdx) => (
                  <div key={cIdx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800 px-2 py-0.5 rounded">
                        {citation.issuing_organization || citation.source || 'Medical Guideline'}
                      </span>
                      {citation.source_url && (
                        <a
                          href={citation.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-700 hover:text-teal-900 inline-flex items-center gap-1 text-[11px] font-semibold"
                        >
                          Source <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <h5 className="font-bold text-slate-900 text-xs leading-snug">
                      {citation.guideline_title || citation.title}
                    </h5>
                    <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-4">
                      {citation.relevant_content_excerpt || citation.content}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* 9. CLINICAL PRACTICE GUARDRAIL DISCLAIMER */}
          <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
            <span className="font-bold text-slate-800">CLINICAL DECISION SUPPORT DISCLAIMER:</span>
            <p>
              {aiExp.disclaimer || 'This automated AI analysis is generated exclusively for patient health literacy and clinical decision support. It does NOT constitute a definitive medical diagnosis, clinical prognosis, or prescription. All laboratory findings must be reviewed and correlated with physical examination by a qualified, registered medical practitioner.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
