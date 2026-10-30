import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
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
  RefreshCw,
  Stethoscope,
  ChevronDown,
  ChevronUp,
  FileQuestion,
  Activity
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { reportService } from '../../services/reportService';
import { useAuth } from '../../context/AuthContext';

export default function ReportAnalyzer() {
  const { user } = useAuth();

  const [file, setFile] = useState(null);
  const [patientName, setPatientName] = useState(user?.full_name || user?.name || '');
  const [reportName, setReportName] = useState('');
  const [reportType, setReportType] = useState('Blood Tests (CBC & Metabolic)');
  const [hospital, setHospital] = useState('Advanced Clinical Laboratories');
  const [doctor, setDoctor] = useState('Dr. Arun Kumar, MD');
  const [validationError, setValidationError] = useState('');

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);

  const fileInputRef = useRef(null);

  const analysisSteps = [
    'Parsing file and validating document headers...',
    'Extracting quantitative laboratory entities and measurement units...',
    'Evaluating values against clinical reference bounds...',
    'Querying RAG medical guidelines (WHO, ADA, ICSH, KDIGO)...',
    'Synthesizing cautious, evidence-grounded recommendations...'
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
    if (!candidate) return;

    const allowed = ['pdf', 'png', 'jpg', 'jpeg'];
    const ext = candidate.name.split('.').pop()?.toLowerCase();
    if (!ext || !allowed.includes(ext)) {
      setValidationError('Supported file formats: PDF, JPG, or PNG.');
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
    if (!file) {
      setValidationError('Please select or drag a medical report file before initiating analysis.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);
    setSavedSuccess(false);
    setCurrentStep(0);

    // Animate through analysis progress steps
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < analysisSteps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 700);

    try {
      const response = await reportService.analyzeReport({
        file,
        patientName: patientName || user?.full_name || 'Patient Record',
        reportName: reportName || file.name.replace(/\.[^/.]+$/, ''),
        reportType,
        hospital,
        doctor
      });

      clearInterval(stepInterval);
      setAnalysisResult(response.ragAnalysis || response.report);
      setSavedSuccess(true);
    } catch (err) {
      clearInterval(stepInterval);
      setValidationError(`Analysis could not be completed: ${err.message || 'Please verify document format.'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setAnalysisResult(null);
    setValidationError('');
    setSavedSuccess(false);
    setCurrentStep(0);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <PageHeader
        badge="Evidence-Based RAG Intelligence"
        badgeStatus="Clinical Decision Support"
        title="AI Medical Report Analyzer"
        subtitle="Automated laboratory parameter extraction, physiological reference interval comparison, and clinical guideline citations."
        action={
          <div className="flex items-center gap-2">
            <Link to="/patient/reports">
              <Button variant="outline" size="sm" icon={FileCheck2}>
                My Health Records
              </Button>
            </Link>
          </div>
        }
      />

      {/* Safety Notice */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <span className="font-bold">CLINICAL SAFETY MANDATE: </span>
          Automated analysis provides evidence-based educational insights and reference comparisons. It does NOT provide a definitive diagnosis or replace the clinical assessment of a qualified, registered medical practitioner. Always review lab findings with your physician.
        </div>
      </div>

      {!analysisResult && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* File Upload Zone */}
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
                  accept=".pdf,.png,.jpg,.jpeg"
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
                      Supports PDF, PNG, or JPG lab results up to 15MB
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
                Extracted values are cross-checked against clinical thresholds published by WHO, the American Diabetes Association (ADA), and the International Council for Standardization in Haematology (ICSH).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Results View */}
      {analysisResult && (
        <div className="space-y-6">
          {/* Success Banner */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-xs font-bold text-emerald-900">Analysis Complete & Health Record Persisted</p>
                <p className="text-[11px] text-emerald-700">
                  Document parameters and RAG guideline citations have been indexed in Neon PostgreSQL.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
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

          {/* Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500 font-medium">Total Parameters</p>
              <p className="text-2xl font-black text-slate-800 mt-1">
                {analysisResult.parameters?.length || analysisResult.test_results_table?.length || 0}
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20">
              <p className="text-xs text-emerald-700 font-medium">Within Normal Bounds</p>
              <p className="text-2xl font-black text-emerald-700 mt-1">
                {(analysisResult.parameters || analysisResult.test_results_table || []).filter(p => p.status === 'Normal' || p.flag === 'Normal').length}
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20">
              <p className="text-xs text-amber-700 font-medium">Outside Reference Range</p>
              <p className="text-2xl font-black text-amber-700 mt-1">
                {(analysisResult.parameters || analysisResult.test_results_table || []).filter(p => p.status !== 'Normal' && p.flag !== 'Normal').length}
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20">
              <p className="text-xs text-rose-700 font-medium">Critical Thresholds</p>
              <p className="text-2xl font-black text-rose-700 mt-1">
                {(analysisResult.parameters || analysisResult.test_results_table || []).filter(p => p.is_critical).length}
              </p>
            </div>
          </div>

          {/* Interactive Parameters Table */}
          <Card title="Structured Laboratory Parameters" icon={Activity}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold">
                    <th className="py-2.5 px-3">Test Parameter</th>
                    <th className="py-2.5 px-3">Observed Value</th>
                    <th className="py-2.5 px-3">Reference Interval</th>
                    <th className="py-2.5 px-3">Status Indicator</th>
                    <th className="py-2.5 px-3 text-right">Clinical Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(analysisResult.parameters || analysisResult.test_results_table || []).map((t, idx) => {
                    const isNormal = t.status === 'Normal' || t.flag === 'Normal';
                    const isCritical = t.is_critical;
                    const isExpanded = expandedRow === idx;

                    return (
                      <React.Fragment key={idx}>
                        <tr className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 font-semibold text-slate-800">
                            {t.test_name || t.name}
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
                            <td colSpan={5} className="py-3 px-4">
                              <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-2">
                                <div>
                                  <span className="font-bold text-slate-700">What this test measures: </span>
                                  <span className="text-slate-600">{t.meaning || 'Clinical diagnostic parameter.'}</span>
                                </div>
                                {t.possible_reasons && (
                                  <div>
                                    <span className="font-bold text-slate-700">Possible physiological reasons: </span>
                                    <span className="text-slate-600">{t.possible_reasons}</span>
                                  </div>
                                )}
                                {t.explanation && (
                                  <div>
                                    <span className="font-bold text-slate-700">Evaluation: </span>
                                    <span className="text-slate-600">{t.explanation}</span>
                                  </div>
                                )}
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

          {/* RAG Knowledge Guideline Citations */}
          {(analysisResult.rag_citations || analysisResult.rag_sources || []).length > 0 && (
            <Card title="Evidence-Based Guideline Citations (RAG Pipeline)" icon={ShieldCheck}>
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

          {/* Cautious Recommendations & Questions for Physician */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Clinical Recommendations" icon={Stethoscope}>
              <ul className="space-y-2.5 text-xs text-slate-700">
                {(analysisResult.ai_explanation?.recommendations || analysisResult.medical_recommendations?.evidence_guidance || [
                  'Consult your attending physician to correlate lab parameters with symptoms.',
                  'Do not modify prescription doses independently based on lab values.',
                  'Maintain adequate hydration before repeat tests.'
                ]).map((rec, rIdx) => (
                  <li key={rIdx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card title="Discussion Points for Your Doctor" icon={HelpCircle}>
              <ul className="space-y-2.5 text-xs text-slate-700">
                {(analysisResult.ai_explanation?.doctor_discussion_questions || [
                  'Do any of the abnormal values require immediate medication adjustments or follow-up tests?',
                  'Could recent diet, hydration, or exercise have influenced these numbers?',
                  'When should a repeat diagnostic panel be performed?'
                ]).map((q, qIdx) => (
                  <li key={qIdx} className="flex items-start gap-2">
                    <ArrowRight className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
