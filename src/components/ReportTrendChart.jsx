import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, AlertCircle, Info, Calendar } from 'lucide-react';

/**
 * ReportTrendChart
 * Interactive Recharts line chart showing parameter trends over consecutive months:
 * June, July, August, September.
 * 
 * When user selects/hovers a point:
 * Shows: Date, Value, Reference range.
 * 
 * Safety constraint:
 * Never creates health prediction or disease prediction.
 * Does NOT label the trend as good/bad without verified clinical logic.
 */
export default function ReportTrendChart({
  className = '',
}) {
  const [selectedParamIndex, setSelectedParamIndex] = useState(0);

  const availableParameters = [
    {
      name: 'Hemoglobin',
      unit: 'g/dL',
      referenceRange: '12.0 – 16.0 g/dL',
      refMin: 12.0,
      refMax: 16.0,
      data: [
        { month: 'June', date: '15 Jun 2026', value: 10.8, referenceRange: '12.0 – 16.0 g/dL' },
        { month: 'July', date: '10 Jul 2026', value: 10.9, referenceRange: '12.0 – 16.0 g/dL' },
        { month: 'August', date: '01 Aug 2026', value: 11.0, referenceRange: '12.0 – 16.0 g/dL' },
        { month: 'September', date: '24 Sep 2026', value: 11.2, referenceRange: '12.0 – 16.0 g/dL' },
      ],
    },
    {
      name: 'Fasting Glucose',
      unit: 'mg/dL',
      referenceRange: '70 – 100 mg/dL',
      refMin: 70,
      refMax: 100,
      data: [
        { month: 'June', date: '10 Jun 2026', value: 124, referenceRange: '70 – 100 mg/dL' },
        { month: 'July', date: '05 Jul 2026', value: 120, referenceRange: '70 – 100 mg/dL' },
        { month: 'August', date: '15 Aug 2026', value: 114, referenceRange: '70 – 100 mg/dL' },
        { month: 'September', date: '24 Sep 2026', value: 98, referenceRange: '70 – 100 mg/dL' },
      ],
    },
    {
      name: 'Total Cholesterol',
      unit: 'mg/dL',
      referenceRange: '< 200 mg/dL',
      refMin: 125,
      refMax: 200,
      data: [
        { month: 'June', date: '10 Jun 2026', value: 218, referenceRange: '< 200 mg/dL' },
        { month: 'July', date: '20 Jul 2026', value: 205, referenceRange: '< 200 mg/dL' },
        { month: 'August', date: '12 Aug 2026', value: 201, referenceRange: '< 200 mg/dL' },
        { month: 'September', date: '12 Sep 2026', value: 195, referenceRange: '< 200 mg/dL' },
      ],
    },
    {
      name: 'Serum Creatinine',
      unit: 'mg/dL',
      referenceRange: '0.70 – 1.30 mg/dL',
      refMin: 0.70,
      refMax: 1.30,
      data: [
        { month: 'June', date: '08 Jun 2026', value: 0.95, referenceRange: '0.70 – 1.30 mg/dL' },
        { month: 'July', date: '18 Jul 2026', value: 0.92, referenceRange: '0.70 – 1.30 mg/dL' },
        { month: 'August', date: '15 Aug 2026', value: 0.93, referenceRange: '0.70 – 1.30 mg/dL' },
        { month: 'September', date: '24 Sep 2026', value: 0.92, referenceRange: '0.70 – 1.30 mg/dL' },
      ],
    },
  ];

  const active = availableParameters[selectedParamIndex];
  const [selectedPoint, setSelectedPoint] = useState(active.data[active.data.length - 1]);

  const handleSelectParam = (idx) => {
    setSelectedParamIndex(idx);
    setSelectedPoint(availableParameters[idx].data[availableParameters[idx].data.length - 1]);
  };

  return (
    <div className={`p-4 sm:p-5 bg-white border border-slate-200 rounded-xl space-y-4 ${className}`}>
      {/* Header & Parameter Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-teal-800 font-semibold uppercase tracking-wider">
            <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
            <span>Longitudinal Parameter Trend</span>
          </div>
          <h3 className="font-bold text-slate-900 text-base">{active.name} Trend</h3>
          <p className="text-xs text-slate-500">
            Consecutive monthly readings (June, July, August, September)
          </p>
        </div>

        {/* Parameter Switcher Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs overflow-x-auto">
          {availableParameters.map((p, idx) => (
            <button
              key={p.name}
              type="button"
              onClick={() => handleSelectParam(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedParamIndex === idx
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Point Details Panel (Requirement 14) */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <span className="text-[11px] text-slate-400 block font-medium">Selected Date:</span>
          <strong className="text-slate-900 font-bold text-sm">
            {selectedPoint?.date || 'Select a point on chart'}
          </strong>
          <span className="text-[10px] text-slate-400 block mt-0.5">Month: {selectedPoint?.month}</span>
        </div>

        <div>
          <span className="text-[11px] text-slate-400 block font-medium">Recorded Value:</span>
          <strong className="text-teal-700 font-extrabold text-sm tabular-nums">
            {selectedPoint?.value} {active.unit}
          </strong>
          <span className="text-[10px] text-slate-500 block mt-0.5">Laboratory test result</span>
        </div>

        <div>
          <span className="text-[11px] text-slate-400 block font-medium">Displayed Reference Range:</span>
          <strong className="text-slate-800 font-semibold text-xs tabular-nums">
            {selectedPoint?.referenceRange || active.referenceRange}
          </strong>
          <span className="text-[10px] text-slate-400 block mt-0.5">Standard lab interval</span>
        </div>
      </div>

      {/* Recharts LineChart */}
      <div className="h-60 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={active.data}
            margin={{ top: 15, right: 25, left: -10, bottom: 5 }}
            onClick={(state) => {
              if (state && state.activePayload && state.activePayload.length) {
                setSelectedPoint(state.activePayload[0].payload);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }}
              axisLine={{ stroke: '#cbd5e1' }}
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={{ stroke: '#cbd5e1' }}
            />
            <Tooltip
              content={({ active: isHovered, payload }) => {
                if (isHovered && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white p-2.5 rounded-xl text-xs shadow-lg space-y-1">
                      <p className="font-bold text-teal-300">{d.month} ({d.date})</p>
                      <p className="font-semibold">
                        {active.name}: <span className="tabular-nums font-extrabold">{d.value} {active.unit}</span>
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Ref: {d.referenceRange}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            {active.refMax && (
              <ReferenceLine
                y={active.refMax}
                label={{ value: `Ref Max: ${active.refMax}`, fill: '#94a3b8', fontSize: 10, position: 'top' }}
                stroke="#cbd5e1"
                strokeDasharray="4 4"
              />
            )}
            <Line
              type="monotone"
              dataKey="value"
              name={active.name}
              stroke="#0d9488"
              strokeWidth={3}
              dot={{ r: 5, fill: '#0d9488', stroke: '#ffffff', strokeWidth: 2 }}
              activeDot={{ r: 7, fill: '#0f766e' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Safety Notice (Requirement 14) */}
      <div className="p-3 bg-amber-50/80 border border-amber-300 rounded-xl flex items-start gap-2.5 text-xs text-amber-950">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <strong>Trend Visualization Only:</strong>
          <p className="text-[11px] leading-relaxed">
            This graph displays numerical values over time for visual comparison. It does not predict disease or health outcomes, nor does it label trends as good or bad without verified clinical correlation. Discuss any changes with your doctor.
          </p>
        </div>
      </div>
    </div>
  );
}
