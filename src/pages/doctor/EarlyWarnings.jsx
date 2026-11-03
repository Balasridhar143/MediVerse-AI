import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import DoctorPatientSelector from '../../components/DoctorPatientSelector';
import { doctorService } from '../../services/api';
import {
  ShieldAlert,
  CheckCircle2,
  Info,
  BrainCircuit,
  TrendingUp,
  Activity,
  ArrowRight,
  Filter,
  Check,
  AlertTriangle,
  RefreshCw,
  Clock,
  FileText,
  UserCheck,
  ExternalLink,
} from 'lucide-react';

export default function EarlyWarnings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlPatientId = searchParams.get('patientId') || '';

  // Patient directory state
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(urlPatientId);
  const [patientsLoading, setPatientsLoading] = useState(true);

  // Early warnings data state
  const [warningsData, setWarningsData] = useState(null);
  const [warningsList, setWarningsList] = useState([]);
  const [warningsLoading, setWarningsLoading] = useState(false);
  const [warningsError, setWarningsError] = useState(null);

  // Filter state
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [reviewNoteInput, setReviewNoteInput] = useState({});
  const [submittingReview, setSubmittingReview] = useState({});

  // 1. Fetch authorized patients on initial load
  useEffect(() => {
    let isMounted = true;
    async function loadPatients() {
      setPatientsLoading(true);
      try {
        const list = await doctorService.getDoctorPatients();
        if (!isMounted) return;
        const patientArr = Array.isArray(list) ? list : [];
        setPatients(patientArr);

        if (urlPatientId && patientArr.some((p) => (p.patientId || p.id) === urlPatientId)) {
          setSelectedPatientId(urlPatientId);
        } else if (patientArr.length > 0 && !selectedPatientId) {
          const firstId = patientArr[0].patientId || patientArr[0].id;
          setSelectedPatientId(firstId);
          setSearchParams({ patientId: firstId }, { replace: true });
        }
      } catch (err) {
        console.error('Failed to load doctor patients:', err);
      } finally {
        if (isMounted) setPatientsLoading(false);
      }
    }
    loadPatients();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch patient early warnings whenever selectedPatientId changes
  useEffect(() => {
    if (!selectedPatientId) {
      setWarningsData(null);
      setWarningsList([]);
      return;
    }

    let isMounted = true;
    async function fetchWarnings() {
      setWarningsLoading(true);
      setWarningsError(null);
      try {
        const data = await doctorService.getPatientEarlyWarnings(selectedPatientId);
        if (isMounted) {
          setWarningsData(data);
          setWarningsList(data?.warnings || []);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to fetch patient early warnings:', err);
          const status = err.response?.status;
          if (status === 403) {
            setWarningsError('Access denied: Clinician is not authorized to access early warnings for this patient.');
          } else if (status === 404) {
            setWarningsError('Patient record not found.');
          } else {
            setWarningsError(err.response?.data?.detail || 'Unable to retrieve early warnings from database.');
          }
        }
      } finally {
        if (isMounted) setWarningsLoading(false);
      }
    }

    fetchWarnings();
    return () => {
      isMounted = false;
    };
  }, [selectedPatientId]);

  // Handle patient selection change
  const handleSelectPatient = (patient) => {
    const id = patient.patientId || patient.id;
    setSelectedPatientId(id);
    setSearchParams({ patientId: id });
  };

  // Handle marking warning as reviewed/acknowledged
  const handleMarkReviewed = async (warningId) => {
    setSubmittingReview((prev) => ({ ...prev, [warningId]: true }));
    try {
      const note = reviewNoteInput[warningId] || 'Acknowledged by attending clinician.';
      await doctorService.reviewEarlyWarning(selectedPatientId, warningId, note);

      // Locally mark as reviewed
      setWarningsList((prev) =>
        prev.map((w) =>
          w.id === warningId
            ? { ...w, status: 'Reviewed by Clinician', isReviewed: true }
            : w
        )
      );
    } catch (err) {
      console.error('Failed to review early warning:', err);
      alert(err.response?.data?.detail || 'Failed to persist clinician acknowledgement.');
    } finally {
      setSubmittingReview((prev) => ({ ...prev, [warningId]: false }));
    }
  };

  // Summary counts
  const criticalCount = warningsList.filter((w) => w.priority === 'Critical').length;
  const highCount = warningsList.filter((w) => w.priority === 'High').length;
  const moderateCount = warningsList.filter((w) => w.priority === 'Moderate').length;
  const reviewedCount = warningsList.filter((w) => w.isReviewed).length;
  const pendingCount = warningsList.length - reviewedCount;

  // Filtered warnings
  const filteredWarnings = useMemo(() => {
    if (priorityFilter === 'All') return warningsList;
    if (priorityFilter === 'Pending') return warningsList.filter((w) => !w.isReviewed);
    if (priorityFilter === 'Reviewed') return warningsList.filter((w) => w.isReviewed);
    return warningsList.filter((w) => w.priority === priorityFilter);
  }, [warningsList, priorityFilter]);

  const selectedPatientObj = patients.find((p) => (p.patientId || p.id) === selectedPatientId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <PageHeader
        badge="Clinical Early Warning"
        badgeStatus="Actual Patient Database"
        title="Early Clinical Warning Alerts"
        subtitle="Algorithmic trend flagging and abnormal laboratory deviation detection derived from verified patient records."
      />

      {/* Part 1: Patient Selection */}
      <DoctorPatientSelector
        patients={patients}
        selectedPatientId={selectedPatientId}
        onSelectPatient={handleSelectPatient}
        loading={patientsLoading}
        subtitle="Search and select an authorized patient to evaluate active early clinical warnings."
      />

      {/* Mandatory Safety / AI Boundary Banner */}
      <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1">
        <p className="font-semibold text-slate-900 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-teal-600 shrink-0" />
          Clinical Practice Guardrail & AI Decision Support Notice:
        </p>
        <p className="leading-relaxed text-slate-600">
          This system highlights quantitative shifts and laboratory reference deviations in actual longitudinal records.
          <strong> Automated alerts are intended for clinician decision support and do not constitute confirmed medical diagnoses.</strong>{' '}
          All flagged parameters must be clinically evaluated by the attending physician in context with overall patient symptomatology.
        </p>
      </div>

      {/* Quick Navigation / Cross-link to Health Trends */}
      {selectedPatientId && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <Activity className="w-4 h-4 text-teal-600" />
            <span>
              Evaluating early alerts for: <strong>{warningsData?.patient?.patientName || selectedPatientObj?.patientName || selectedPatientId}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/doctor/health-trends?patientId=${selectedPatientId}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-teal-300 hover:bg-teal-50 text-teal-900 font-semibold rounded-lg shadow-sm transition-colors"
            >
              <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
              <span>View Health Trends Trajectory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Error state */}
      {warningsError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-2">
          <div className="flex items-center gap-2 font-bold text-rose-900">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Access / Alert Error</span>
          </div>
          <p>{warningsError}</p>
        </div>
      )}

      {/* Loading state */}
      {warningsLoading && (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-xl space-y-3">
          <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
          <h4 className="text-sm font-bold text-slate-900">Scanning Longitudinal Patient Records...</h4>
          <p className="text-xs text-slate-500">Evaluating laboratory bounds, shift velocities, and clinical risk parameters.</p>
        </div>
      )}

      {/* Loaded Content */}
      {!warningsLoading && !warningsError && warningsData && (
        <>
          {/* Summary Metric Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">Total Alerts</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">{warningsList.length}</span>
                <span className="text-xs text-slate-500">active alerts</span>
              </div>
            </div>

            <div className="bg-white border border-rose-200 bg-rose-50/30 rounded-xl p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-rose-700 block uppercase tracking-wider">Critical Priority</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-rose-700">{criticalCount}</span>
                <span className="text-xs text-rose-600">urgent triage</span>
              </div>
            </div>

            <div className="bg-white border border-amber-200 bg-amber-50/30 rounded-xl p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-amber-700 block uppercase tracking-wider">High Priority</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-amber-700">{highCount}</span>
                <span className="text-xs text-amber-600">elevated shift</span>
              </div>
            </div>

            <div className="bg-white border border-emerald-200 bg-emerald-50/30 rounded-xl p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-emerald-700 block uppercase tracking-wider">Clinician Reviewed</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-700">{reviewedCount}</span>
                <span className="text-xs text-emerald-600">acknowledged</span>
              </div>
            </div>
          </div>

          {/* Priority Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-xl shadow-sm">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1 mr-1" />
              {[
                { label: 'All Alerts', val: 'All', count: warningsList.length },
                { label: 'Critical', val: 'Critical', count: criticalCount },
                { label: 'High Priority', val: 'High', count: highCount },
                { label: 'Moderate', val: 'Moderate', count: moderateCount },
                { label: 'Pending Review', val: 'Pending', count: pendingCount },
                { label: 'Acknowledged', val: 'Reviewed', count: reviewedCount },
              ].map((tab) => (
                <button
                  key={tab.val}
                  type="button"
                  onClick={() => setPriorityFilter(tab.val)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                    priorityFilter === tab.val
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    priorityFilter === tab.val ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <span className="text-xs text-slate-500 font-medium">
              Showing {filteredWarnings.length} of {warningsList.length} alerts
            </span>
          </div>

          {/* Empty state: No warnings active for this patient */}
          {warningsList.length === 0 ? (
            <div className="p-10 bg-white border border-slate-200 rounded-xl text-center space-y-4 shadow-sm">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  No Active Early Warnings for {warningsData.patient?.patientName}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  All documented laboratory results, physiological vitals, and documented allergies for this patient are currently
                  within normal boundaries, or insufficient longitudinal variation was detected.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to={`/doctor/health-trends?patientId=${selectedPatientId}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Review Longitudinal Health Trends</span>
                </Link>
              </div>
            </div>
          ) : filteredWarnings.length === 0 ? (
            <div className="p-8 bg-white border border-slate-200 rounded-xl text-center space-y-2 text-xs text-slate-500">
              <p>No early warnings match the selected filter ({priorityFilter}).</p>
              <button
                type="button"
                onClick={() => setPriorityFilter('All')}
                className="text-teal-600 font-bold hover:underline"
              >
                Clear Filter
              </button>
            </div>
          ) : (
            /* Warning Cards List */
            <div className="space-y-4">
              {filteredWarnings.map((alert) => {
                const isReviewed = alert.isReviewed || alert.status === 'Reviewed by Clinician';
                const isCritical = alert.priority === 'Critical';
                const isHigh = alert.priority === 'High';

                return (
                  <Card
                    key={alert.id}
                    className={`space-y-4 transition-all ${
                      isReviewed
                        ? 'border-slate-200 bg-slate-50/40 opacity-80'
                        : isCritical
                        ? 'border-rose-400 ring-1 ring-rose-200 bg-white'
                        : isHigh
                        ? 'border-amber-300 ring-1 ring-amber-200 bg-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        {isCritical ? (
                          <div className="p-1.5 bg-rose-100 text-rose-700 rounded-lg shrink-0">
                            <ShieldAlert className="w-5 h-5 text-rose-600" />
                          </div>
                        ) : isHigh ? (
                          <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg shrink-0">
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                          </div>
                        ) : (
                          <div className="p-1.5 bg-teal-100 text-teal-700 rounded-lg shrink-0">
                            <Activity className="w-5 h-5 text-teal-600" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm md:text-base">
                            {alert.title}
                          </h3>
                          <span className="text-[11px] text-slate-500">
                            Biomarker: <strong>{alert.parameter}</strong> • Source: {alert.reportName || 'Diagnostic Report'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isCritical ? (
                          <span className="px-2.5 py-1 text-xs font-bold bg-rose-100 text-rose-800 rounded-full border border-rose-300">
                            Critical Priority
                          </span>
                        ) : isHigh ? (
                          <span className="px-2.5 py-1 text-xs font-bold bg-amber-100 text-amber-800 rounded-full border border-amber-300">
                            High Priority
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-bold bg-sky-100 text-sky-800 rounded-full border border-sky-300">
                            Moderate
                          </span>
                        )}
                        <span className="text-xs text-slate-500 font-medium">
                          {alert.reportDate || alert.detectedDate}
                        </span>
                      </div>
                    </div>

                    {/* 4-Grid Structured Clinical Evidence */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {/* Metric & Reference Bounds */}
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                        <span className="text-slate-400 block font-semibold text-[10px] uppercase tracking-wider">
                          Actual Measured Value vs Reference
                        </span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-bold text-slate-900">
                            {alert.actualValue}
                          </span>
                          <span className="text-slate-500 text-xs">
                            (Ref: <strong>{alert.referenceRange}</strong>)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Detected in {alert.reportName} ({alert.reportDate})
                        </p>
                      </div>

                      {/* Longitudinal Context */}
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                        <span className="text-slate-400 block font-semibold text-[10px] uppercase tracking-wider">
                          Previous Readings & Velocity
                        </span>
                        <p className="text-slate-800 font-medium leading-relaxed">
                          {alert.previousReadings || 'Baseline measurement on file'}
                        </p>
                      </div>

                      {/* Clinical Reason */}
                      <div className="md:col-span-2 p-3 bg-amber-50/60 border border-amber-200 rounded-lg space-y-1">
                        <span className="text-amber-800 font-semibold block text-[10px] uppercase tracking-wider">
                          Clinical Evaluation Rationale
                        </span>
                        <p className="text-amber-950 font-semibold text-xs leading-relaxed">
                          {alert.reason}
                        </p>
                      </div>
                    </div>

                    {/* AI Decision Support Disclaimer */}
                    <p className="text-[11px] text-slate-500 italic pt-0.5">
                      *{alert.aiDisclaimer}
                    </p>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/doctor/health-trends?patientId=${selectedPatientId}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline"
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>Inspect Parameter Trajectory</span>
                        </Link>
                        <span className="text-slate-300">•</span>
                        <Link
                          to="/doctor/clinical-context"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:underline"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Patient Dossier</span>
                        </Link>
                      </div>

                      {/* Clinician Review Control */}
                      {!isReviewed ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Optional clinician note..."
                            value={reviewNoteInput[alert.id] || ''}
                            onChange={(e) =>
                              setReviewNoteInput({ ...reviewNoteInput, [alert.id]: e.target.value })
                            }
                            className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-900 w-48 sm:w-56"
                          />
                          <Button
                            variant="primary"
                            size="sm"
                            icon={CheckCircle2}
                            loading={submittingReview[alert.id]}
                            onClick={() => handleMarkReviewed(alert.id)}
                          >
                            Mark Reviewed & Acknowledged
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 shadow-sm">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            Acknowledged by Clinician
                          </span>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
