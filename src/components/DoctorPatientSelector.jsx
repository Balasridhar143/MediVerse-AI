import React, { useState, useMemo } from 'react';
import { User, Search, ChevronDown, Check, UserCheck, ShieldCheck, X } from 'lucide-react';

export default function DoctorPatientSelector({
  patients = [],
  selectedPatientId = '',
  onSelectPatient,
  loading = false,
  subtitle = 'Select an authorized patient from your clinical ledger to review records.'
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Filter patients by name or ID
  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients;
    const q = searchQuery.toLowerCase().trim();
    return patients.filter((p) => {
      const name = (p.patientName || '').toLowerCase();
      const id = (p.patientId || p.id || '').toLowerCase();
      const phone = (p.phone || '').toLowerCase();
      const condition = (p.primaryCondition || '').toLowerCase();
      return name.includes(q) || id.includes(q) || phone.includes(q) || condition.includes(q);
    });
  }, [patients, searchQuery]);

  const selectedPatient = useMemo(() => {
    return patients.find((p) => (p.patientId || p.id) === selectedPatientId) || null;
  }, [patients, selectedPatientId]);

  const handleSelect = (patient) => {
    onSelectPatient(patient);
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
      {/* Header and status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-teal-50 text-teal-700 rounded-lg">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Authorized Patient Selection</h3>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full border border-slate-200">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            {loading ? 'Loading ledger...' : `${patients.length} Authorized Patients`}
          </span>
        </div>
      </div>

      {/* Selected Patient Banner (if selected) */}
      {selectedPatient ? (
        <div className="p-3.5 bg-gradient-to-r from-teal-50/60 to-slate-50 border border-teal-200/80 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
              {(selectedPatient.patientName || 'P').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-bold text-slate-900 text-base">
                  {selectedPatient.patientName}
                </h4>
                <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                  ID: {selectedPatient.patientId || selectedPatient.id}
                </span>
                <span className="text-xs bg-teal-100 text-teal-800 font-semibold px-2 py-0.5 rounded-full">
                  Active Clinical Care
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>Age: <strong>{selectedPatient.age || 35} yrs</strong></span>
                <span>•</span>
                <span>Gender: <strong>{selectedPatient.gender || 'M'}</strong></span>
                <span>•</span>
                <span>Blood: <strong className="text-rose-700">{selectedPatient.bloodGroup || 'O+'}</strong></span>
                <span>•</span>
                <span>Condition: <strong>{selectedPatient.primaryCondition || 'Under Clinical Observation'}</strong></span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:border-teal-500 hover:text-teal-700 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition-all shrink-0"
          >
            <span>Switch Patient</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      ) : (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center justify-between">
          <span>No patient currently selected. Please choose an authorized patient below to view actual records.</span>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(true)}
            className="font-bold underline ml-2"
          >
            Select Now
          </button>
        </div>
      )}

      {/* Patient Picker & Search Box */}
      {(isDropdownOpen || !selectedPatient) && (
        <div className="space-y-3 pt-1 border-t border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search authorized patient by name, patient ID, phone, or condition..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-900"
              autoFocus={isDropdownOpen}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* List of matched patients */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg bg-white shadow-inner">
            {loading ? (
              <div className="p-4 text-center text-xs text-slate-500">
                Loading authorized patient directory...
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                No authorized patients match "{searchQuery}".
              </div>
            ) : (
              filteredPatients.map((p) => {
                const isSelected = (p.patientId || p.id) === selectedPatientId;
                return (
                  <button
                    key={p.patientId || p.id}
                    type="button"
                    onClick={() => handleSelect(p)}
                    className={`w-full text-left p-3 hover:bg-slate-50 flex items-center justify-between transition-colors ${
                      isSelected ? 'bg-teal-50/70 border-l-4 border-teal-600' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {(p.patientName || 'P').charAt(0).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-slate-900 truncate">
                            {p.patientName}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {p.patientId || p.id}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {p.age ? `${p.age}y` : ''} {p.gender ? `• ${p.gender}` : ''} {p.bloodGroup ? `• ${p.bloodGroup}` : ''} {p.primaryCondition ? `• ${p.primaryCondition}` : ''}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-teal-600 shrink-0 ml-2">
                        <Check className="w-4 h-4" />
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
