import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import DoctorPatientSelector from '../../components/DoctorPatientSelector';
import { doctorService } from '../../services/api';
import {
  Activity,
  Heart,
  Droplets,
  Scale,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  AlertTriangle,
  FileText,
  ShieldAlert,
  ArrowRight,
  Filter,
  CheckCircle2,
  RefreshCw,
  Info,
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
  ReferenceLine,
} from 'recharts';

export default function DoctorHealthTrends() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlPatientId = searchParams.get('patientId') || '';

  // Patients ledger state
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(urlPatientId);
  const [patientsLoading, setPatientsLoading] = useState(true);

  // Health trends data state
  const [trendsData, setTrendsData] = useState(null);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [trendsError, setTrendsError] = useState(null);

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchFilter, setSearchFilter] = useState('');

  // 1. Fetch authorized patients on load
  useEffect(() => {
    let isMounted = true;
    async function loadPatients() {
      setPatientsLoading(true);
      try {
        const list = await doctorService.getDoctorPatients();
        if (!isMounted) return;
        const patientArr = Array.isArray(list) ? list : [];
        setPatients(patientArr);

        // If URL has patientId, respect it; otherwise default to first authorized patient
        if (urlPatientId && patientArr.some((p) => (p.patientId || p.id) === urlPatientId)) {
          setSelectedPatientId(urlPatientId);
        } else if (patientArr.length > 0 && !selectedPatientId) {
          const firstId = patientArr[0].patientId || patientArr[0].id;
          setSelectedPatientId(firstId);
          setSearchParams({ patientId: firstId }, { replace: true });
        }
      } catch (err) {
        console.error('Failed to load authorized doctor patients:', err);
      } finally {
        if (isMounted) setPatientsLoading(false);
      }
    }
    loadPatients();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch patient-specific health trends whenever selectedPatientId changes
  useEffect(() => {
    if (!selectedPatientId) {
      setTrendsData(null);
      return;
    }

    let isMounted = true;
    async function fetchTrends() {
      setTrendsLoading(true);
      setTrendsError(null);
      try {
        const data = await doctorService.getPatientHealthTrends(selectedPatientId);
        if (isMounted) {
          setTrendsData(data);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to fetch patient health trends:', err);
          const status = err.response?.status;
          if (status === 403) {
            setTrendsError('Clinician is not authorized to access health trends for this patient record.');
          } else if (status === 404) {
            setTrendsError('Patient record or clinical reports not found in the database.');
          } else {
            setTrendsError(err.response?.data?.detail || 'Unable to retrieve longitudinal health trends.');
          }
        }
      } finally {
        if (isMounted) setTrendsLoading(false);
      }
    }

    fetchTrends();
    return () => {
      isMounted = false;
    };
  }, [selectedPatientId]);

  // Handle patient switch
  const handleSelectPatient = (patient) => {
    const id = patient.patientId || patient.id;
    setSelectedPatientId(id);
    setSearchParams({ patientId: id });
  };

  // Derive categories list
  const categories = useMemo(() => {
    if (!trendsData?.trends) return ['All'];
    const set = new Set();
    trendsData.trends.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return ['All', ...Array.from(set)];
  }, [trendsData]);

  // Filter trends based on selected category and text search
  const filteredTrends = useMemo(() => {
    if (!trendsData?.trends) return [];
    return trendsData.trends.filter((t) => {
      const matchCat = selectedCategory === 'All' || t.category === selectedCategory;
      const matchText =
        !searchFilter.trim() ||
        t.parameterName.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (t.category && t.category.toLowerCase().includes(searchFilter.toLowerCase()));
      return matchCat && matchText;
    });
  }, [trendsData, selectedCategory, searchFilter]);

  // Palette generator based on category
  const getLineColor = (category, index) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('glycemic')) return '#d97706';
    if (cat.includes('hematology')) return '#7c3aed';
    if (cat.includes('lipid')) return '#0284c7';
    if (cat.includes('renal')) return '#0d9488';
    if (cat.includes('vital')) return '#e11d48';
    if (cat.includes('hepatic')) return '#ea580c';
    if (cat.includes('endocrine')) return '#4f46e5';
    const fallbackPalette = ['#0d9488', '#0284c7', '#7c3aed', '#d97706', '#e11d48', '#059669'];
    return fallbackPalette[index % fallbackPalette.length];
  };

  const selectedPatientObj = patients.find((p) => (p.patientId || p.id) === selectedPatientId);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        badge="Longitudinal Analytics"
        badgeStatus="Actual Patient Database"
        title="Patient Health Trends & Physiological Vitals"
        subtitle="Chronological biomarker trajectories and physiological velocity derived from verified laboratory reports."
      />

      {/* Part 1: Patient Selection */}
      <DoctorPatientSelector
        patients={patients}
        selectedPatientId={selectedPatientId}
        onSelectPatient={handleSelectPatient}
        loading={patientsLoading}
        subtitle="Search and select an authorized patient to visualize actual health trends over time."
      />

      {/* Quick Navigation / Cross-link to Early Warnings */}
      {selectedPatientId && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <Activity className="w-4 h-4 text-teal-600" />
            <span>
              Analyzing real records for: <strong>{trendsData?.patient?.patientName || selectedPatientObj?.patientName || selectedPatientId}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/doctor/early-warnings?patientId=${selectedPatientId}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-50 text-amber-900 font-semibold rounded-lg shadow-sm transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              <span>View Early Warnings for this Patient</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Error state */}
      {trendsError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-2">
          <div className="flex items-center gap-2 font-bold text-rose-900">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Access / Retrieval Error</span>
          </div>
          <p>{trendsError}</p>
        </div>
      )}

      {/* Loading state */}
      {trendsLoading && (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-xl space-y-3">
          <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
          <h4 className="text-sm font-bold text-slate-900">Processing Patient Medical Records...</h4>
          <p className="text-xs text-slate-500">Extracting chronological parameters, reference ranges, and delta changes.</p>
        </div>
      )}

      {/* Loaded Content */}
      {!trendsLoading && !trendsError && trendsData && (
        <>
          {/* Summary Metric Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">Reports Analyzed</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">{trendsData.summary?.totalReportsAnalyzed || 0}</span>
                <span className="text-xs text-slate-500">diagnostic files</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">Parameters Tracked</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-teal-700">{trendsData.summary?.parametersTracked || 0}</span>
                <span className="text-xs text-slate-500">unique biomarkers</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">Longitudinal Span</span>
              <div className="mt-1 flex items-baseline gap-1 text-xs font-medium text-slate-800">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {trendsData.summary?.oldestDate
                    ? `${trendsData.summary.oldestDate} ➔ ${trendsData.summary.latestDate}`
                    : 'Single Observation'}
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">Data Status</span>
              <div className="mt-1 flex items-center gap-1.5">
                {trendsData.summary?.hasSufficientHistoricalData ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Multi-Point Trends
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    <Info className="w-3 h-3 text-amber-600" />
                    Baseline Single-Point
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Empty state: 0 Reports or 0 Parameters */}
          {trendsData.trends?.length === 0 ? (
            <div className="p-10 bg-white border border-slate-200 rounded-xl text-center space-y-4 shadow-sm">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Insufficient Diagnostic Records for {trendsData.patient?.patientName}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  No quantitative medical reports or lab parameters are currently associated with this patient in the database.
                  Upload diagnostic lab reports or await patient document submission to map longitudinal trajectories.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to="/doctor/clinical-context"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                >
                  <span>Review Clinical Dossier</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Category Filter and Search Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-xl shadow-sm">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                  <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1 mr-1" />
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                        selectedCategory === cat
                          ? 'bg-teal-600 text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="relative shrink-0 sm:w-64">
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Filter parameter (e.g. Glucose)..."
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-900"
                  />
                </div>
              </div>

              {/* Grid of Real Patient Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredTrends.map((trend, idx) => {
                  const lineColor = getLineColor(trend.category, idx);
                  const isNormal = trend.latestReading?.status === 'Normal';
                  const isHigh = trend.latestReading?.status === 'High';
                  const isLow = trend.latestReading?.status === 'Low';
                  const isCritical = trend.latestReading?.isCritical || trend.latestReading?.status === 'Critical';

                  // Calculate min/max for chart Y-axis domain
                  const values = trend.readings.map((r) => r.value);
                  const minVal = Math.min(...values, trend.refMin !== null ? trend.refMin : 999999);
                  const maxVal = Math.max(...values, trend.refMax !== null ? trend.refMax : -999999);
                  const padding = (maxVal - minVal) * 0.15 || 5;
                  const yDomain = [
                    Math.max(0, Number((minVal - padding).toFixed(1))),
                    Number((maxVal + padding).toFixed(1)),
                  ];

                  return (
                    <Card
                      key={trend.id}
                      title={`${trend.parameterName} (${trend.unit || 'Score'})`}
                      subtitle={`Category: ${trend.category} • Reference Range: ${trend.referenceRange}`}
                      icon={Activity}
                    >
                      {/* Top Metric Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 pb-3 border-b border-slate-100">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-slate-900">
                            {trend.latestReading?.value}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">
                            {trend.unit}
                          </span>
                          <span className="text-xs text-slate-400">
                            (on {trend.latestReading?.date})
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isCritical ? (
                            <span className="px-2 py-0.5 text-xs font-bold bg-rose-100 text-rose-800 rounded border border-rose-200">
                              Critical Deviation
                            </span>
                          ) : isHigh ? (
                            <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 rounded border border-amber-200">
                              Elevated (High)
                            </span>
                          ) : isLow ? (
                            <span className="px-2 py-0.5 text-xs font-bold bg-sky-100 text-sky-800 rounded border border-sky-200">
                              Below Range (Low)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 rounded border border-emerald-200">
                              Normal Range
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Longitudinal Comparison / Delta Notice */}
                      <div className="py-2.5 text-xs">
                        {trend.hasSufficientData ? (
                          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                            <div className="flex items-center gap-1.5">
                              {trend.trendDirection === 'increased' ? (
                                <TrendingUp className={`w-4 h-4 ${isNormal ? 'text-teal-600' : 'text-amber-600'}`} />
                              ) : trend.trendDirection === 'decreased' ? (
                                <TrendingDown className={`w-4 h-4 ${isNormal ? 'text-teal-600' : 'text-rose-600'}`} />
                              ) : (
                                <Minus className="w-4 h-4 text-slate-500" />
                              )}
                              <span className="text-slate-700">
                                Previous: <strong>{trend.previousReading?.value} {trend.unit}</strong> on {trend.previousReading?.date}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-800">
                                Shift: {trend.deltaValue > 0 ? `+${trend.deltaValue}` : trend.deltaValue} {trend.unit}
                              </span>
                              <span
                                className={`font-mono text-[11px] px-1.5 py-0.5 rounded ${
                                  trend.percentChange > 0
                                    ? 'bg-amber-100 text-amber-800'
                                    : trend.percentChange < 0
                                    ? 'bg-sky-100 text-sky-800'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {trend.percentChange > 0 ? `+${trend.percentChange}%` : `${trend.percentChange}%`}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg text-amber-900 text-[11px] flex items-center gap-2">
                            <Info className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>
                              <strong>Single measurement on file.</strong> Minimum 2 chronological observations required to plot physiological trajectory.
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Recharts Chart Visualization */}
                      <div className="h-60 w-full pt-1">
                        {trend.hasSufficientData ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={trend.readings}
                              margin={{ top: 10, right: 20, left: -15, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                              <XAxis
                                dataKey="date"
                                tick={{ fontSize: 11, fill: '#64748b' }}
                              />
                              <YAxis
                                domain={yDomain}
                                tick={{ fontSize: 11, fill: '#64748b' }}
                              />
                              <Tooltip
                                contentStyle={{
                                  fontSize: '12px',
                                  backgroundColor: '#ffffff',
                                  borderRadius: '8px',
                                  border: '1px solid #cbd5e1',
                                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                }}
                                formatter={(val) => [`${val} ${trend.unit}`, trend.parameterName]}
                                labelFormatter={(label) => `Observed on: ${label}`}
                              />
                              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />

                              {/* Clinical Reference Bounds */}
                              {trend.refMin !== null && (
                                <ReferenceLine
                                  y={trend.refMin}
                                  stroke="#10b981"
                                  strokeDasharray="3 3"
                                  label={{
                                    value: `Min (${trend.refMin})`,
                                    position: 'insideBottomLeft',
                                    fill: '#10b981',
                                    fontSize: 10,
                                  }}
                                />
                              )}
                              {trend.refMax !== null && (
                                <ReferenceLine
                                  y={trend.refMax}
                                  stroke="#ef4444"
                                  strokeDasharray="3 3"
                                  label={{
                                    value: `Max (${trend.refMax})`,
                                    position: 'insideTopLeft',
                                    fill: '#ef4444',
                                    fontSize: 10,
                                  }}
                                />
                              )}

                              <Line
                                type="monotone"
                                dataKey="value"
                                name={`${trend.parameterName} (${trend.unit})`}
                                stroke={lineColor}
                                strokeWidth={2.5}
                                dot={{ r: 4, strokeWidth: 1.5, fill: '#ffffff' }}
                                activeDot={{ r: 6 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          /* Informative Single-Point State (Never fabricate fake points!) */
                          <div className="h-full flex flex-col items-center justify-center p-6 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-center space-y-2">
                            <Activity className="w-8 h-8 text-slate-400" />
                            <h5 className="text-xs font-bold text-slate-800">
                              Single Baseline Measurement: {trend.latestReading?.value} {trend.unit}
                            </h5>
                            <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
                              Observed in "{trend.latestReading?.reportName}" on {trend.latestReading?.date}.
                              Longitudinal velocity requires subsequent checkups or follow-up laboratory analyses.
                            </p>
                            <span className="text-[10px] text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200 font-medium">
                              Zero artificial readings plotted
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Card Footer: Metadata and Clinical Bounds */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
                        <span>Source: <strong>{trend.latestReading?.reportName}</strong></span>
                        <span>Clinical Bound: <strong>{trend.referenceRange}</strong></span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
