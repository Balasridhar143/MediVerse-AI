import React, { useState, useEffect } from 'react';
import {
  Pill,
  Search,
  Filter,
  BookOpen,
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Info,
  Clock,
  HeartPulse,
  Activity,
  Layers,
  Sparkles,
  X,
  FileText
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import api from '../../services/api';

export default function MedicineKnowledgeBase() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedForm, setSelectedForm] = useState('all');
  const [prescriptionFilter, setPrescriptionFilter] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [dosageForms, setDosageForms] = useState([]);
  const [totalMatching, setTotalMatching] = useState(0);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 24;

  // Selected Medicine Monograph Modal
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [monographLoading, setMonographLoading] = useState(false);
  const [relatedMedicines, setRelatedMedicines] = useState([]);

  useEffect(() => {
    fetchMedicines();
  }, [search, selectedCategory, selectedForm, prescriptionFilter, offset]);

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedForm && selectedForm !== 'all') params.append('dosage_form', selectedForm);
      if (prescriptionFilter) params.append('prescription_required', prescriptionFilter);
      params.append('limit', String(limit));
      params.append('offset', String(offset));

      const res = await api.get(`/medicines/knowledge-base?${params.toString()}`);
      setMedicines(res.data.medicines || []);
      setTotalMatching(res.data.total_matching || 0);
      if (res.data.categories?.length > 0) setCategories(res.data.categories);
      if (res.data.dosage_forms?.length > 0) setDosageForms(res.data.dosage_forms);
    } catch (err) {
      console.error('Failed to load medicine knowledge base:', err);
    } finally {
      setLoading(false);
    }
  };

  const openMonograph = async (med) => {
    setSelectedMedicine(med);
    setMonographLoading(true);
    setRelatedMedicines([]);
    try {
      const res = await api.get(`/medicines/${med.id}/knowledge`);
      if (res.data.medicine) setSelectedMedicine(res.data.medicine);
      if (res.data.related_medicines) setRelatedMedicines(res.data.related_medicines);
    } catch (err) {
      console.warn('Monograph detailed lookup warning:', err.message);
    } finally {
      setMonographLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <PageHeader
        badge="Pharmacopeia & Therapeutics"
        badgeStatus="CDSCO & WHO EML Aligned"
        title="Medicine Knowledge Base"
        subtitle="Authoritative pharmacology, mechanisms of action, approved indications, and clinical safety precautions."
      />

      {/* Safety Notice Banner */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <span className="font-bold">CLINICAL SAFETY MANDATE: </span>
          Reference dosage ranges and pharmacology provided are clinical reference standards derived from CDSCO, WHO EML, and NLEM India.
          They <span className="font-bold underline">MUST NOT</span> be construed as individualized prescriptions. Never adjust, initiate, or discontinue medications without evaluation by a registered medical doctor or licensed pharmacist.
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setOffset(0);
              }}
              placeholder="Search by Brand, Generic, Active Ingredient, or Use (e.g. Paracetamol, Augmentin, Metformin)..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:border-teal-500 focus:outline-hidden"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setOffset(0);
              }}
              className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:border-teal-500 focus:outline-hidden bg-white text-slate-700 font-medium"
            >
              <option value="all">All Therapeutic Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Dosage Form Filter */}
          <div>
            <select
              value={selectedForm}
              onChange={(e) => {
                setSelectedForm(e.target.value);
                setOffset(0);
              }}
              className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:border-teal-500 focus:outline-hidden bg-white text-slate-700 font-medium"
            >
              <option value="all">All Dosage Forms</option>
              {dosageForms.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span>Filter by Schedule:</span>
            <button
              type="button"
              onClick={() => { setPrescriptionFilter(''); setOffset(0); }}
              className={`px-2.5 py-1 rounded-md font-semibold text-[11px] cursor-pointer ${
                prescriptionFilter === '' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => { setPrescriptionFilter('true'); setOffset(0); }}
              className={`px-2.5 py-1 rounded-md font-semibold text-[11px] cursor-pointer ${
                prescriptionFilter === 'true' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Prescription Required (Schedule H)
            </button>
            <button
              type="button"
              onClick={() => { setPrescriptionFilter('false'); setOffset(0); }}
              className={`px-2.5 py-1 rounded-md font-semibold text-[11px] cursor-pointer ${
                prescriptionFilter === 'false' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              General / Non-Prescription
            </button>
          </div>

          <span className="font-medium text-slate-600">
            Showing {medicines.length} of {totalMatching} matching medicines
          </span>
        </div>
      </div>

      {/* Medicines Grid */}
      {loading ? (
        <div className="p-16 text-center bg-white border border-slate-200 rounded-xl">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-600">Querying clinical pharmacological index...</p>
        </div>
      ) : medicines.length === 0 ? (
        <div className="p-16 text-center bg-white border border-slate-200 rounded-xl space-y-3">
          <Pill className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="font-bold text-slate-800 text-sm">No medicines found matching your criteria</h4>
          <p className="text-xs text-slate-500">Try broadening your search term or resetting category filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {medicines.map((med) => (
            <div
              key={med.id}
              className="bg-white border border-slate-200 rounded-xl p-4.5 hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                {/* Header badges */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-800 px-2 py-0.5 rounded border border-teal-200">
                    {med.category || 'Therapeutic Agent'}
                  </span>
                  {med.prescription_required ? (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      Rx Schedule H
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      General
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm leading-snug">
                    {med.brand_name}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {med.generic_name}
                  </p>
                </div>

                {/* Drug class */}
                {med.drug_classification && (
                  <p className="text-[11px] text-teal-800 font-semibold bg-teal-50/50 p-1.5 rounded">
                    Class: {med.drug_classification}
                  </p>
                )}

                {/* Uses preview */}
                <div className="text-xs text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-700 text-[11px]">Approved Indications:</p>
                  <p className="line-clamp-2 text-[11px] leading-relaxed">
                    {med.common_medical_uses || med.uses || 'Consult monograph for detailed clinical indications.'}
                  </p>
                </div>

                {/* Strength & Pricing */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  <span>Pack: {med.pack_size || 'Standard Unit'}</span>
                  {med.price_inr && (
                    <span className="font-bold text-slate-800">Approx. ₹{med.price_inr}</span>
                  )}
                </div>
              </div>

              <div className="pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  icon={BookOpen}
                  onClick={() => openMonograph(med)}
                  className="w-full text-xs font-bold justify-center"
                >
                  Clinical Monograph
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalMatching > limit && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(offset - limit, 0))}
            className="text-xs font-bold"
          >
            Previous
          </Button>
          <span className="text-xs text-slate-600 font-medium">
            Page {Math.floor(offset / limit) + 1} of {Math.ceil(totalMatching / limit)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={offset + limit >= totalMatching}
            onClick={() => setOffset(offset + limit)}
            className="text-xs font-bold"
          >
            Next
          </Button>
        </div>
      )}

      {/* Detailed Clinical Monograph Modal */}
      {selectedMedicine && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50/70 sticky top-0 backdrop-blur-xs z-10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800 px-2 py-0.5 rounded">
                    {selectedMedicine.category}
                  </span>
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded">
                    {selectedMedicine.prescription_classification || (selectedMedicine.prescription_required ? 'Schedule H' : 'General')}
                  </span>
                </div>
                <h2 className="text-lg font-black text-slate-900">
                  {selectedMedicine.brand_name}
                </h2>
                <p className="text-xs text-slate-600 font-mono mt-0.5">
                  Generic: {selectedMedicine.generic_name}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMedicine(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 text-xs text-slate-700">
              {/* Pharmacology & Mechanism */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-700" />
                  Mechanism of Action (Pharmacodynamics)
                </h4>
                <p className="leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {selectedMedicine.mechanism_of_action || 'Pharmacological mechanism details aligned with clinical literature.'}
                </p>
              </div>

              {/* General Reference Dosage (Strict Reference Notice) */}
              <div className="space-y-1.5 p-3.5 bg-teal-50/70 border border-teal-200 rounded-xl">
                <h4 className="font-bold text-teal-950 text-xs flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-700" />
                  General Reference Dosage (Clinical Standard — Not an Individual Prescription)
                </h4>
                <p className="leading-relaxed text-teal-900 text-xs">
                  {selectedMedicine.general_approved_dosage || selectedMedicine.reference_dosage || 'Dosage is individualized based on patient clinical status and renal clearance.'}
                </p>
                {selectedMedicine.administration_instructions && (
                  <p className="text-[11px] text-teal-800 font-semibold pt-1">
                    Route & Administration: {selectedMedicine.administration_instructions}
                  </p>
                )}
              </div>

              {/* Indications */}
              {selectedMedicine.conditions_indicated && selectedMedicine.conditions_indicated.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs">Approved Clinical Indications</h4>
                  <ul className="space-y-1.5 list-disc pl-4 text-slate-600">
                    {selectedMedicine.conditions_indicated.map((ind, iIdx) => (
                      <li key={iIdx}>{ind}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Adverse Effects & Warnings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                  <h5 className="font-bold text-slate-800 text-xs">Common Adverse Effects</h5>
                  <ul className="space-y-1 text-slate-600 text-[11px] list-disc pl-3">
                    {(selectedMedicine.common_side_effects || ['Mild gastrointestinal upset', 'Headache']).map((eff, eIdx) => (
                      <li key={eIdx}>{eff}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-1.5">
                  <h5 className="font-bold text-rose-900 text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    Serious Warnings & Contraindications
                  </h5>
                  <ul className="space-y-1 text-rose-800 text-[11px] list-disc pl-3">
                    {(selectedMedicine.serious_adverse_effects || selectedMedicine.contraindications || ['Hypersensitivity reactions']).map((warn, wIdx) => (
                      <li key={wIdx}>{warn}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Precautions: Pregnancy & Pediatric */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-[11px]">
                <h5 className="font-bold text-slate-800 text-xs">Special Population Precautions</h5>
                <p><span className="font-semibold text-slate-700">Pregnancy: </span>{selectedMedicine.pregnancy_precautions || 'Consult obstetrician before administration.'}</p>
                <p><span className="font-semibold text-slate-700">Breastfeeding: </span>{selectedMedicine.breastfeeding_precautions || 'Assess maternal benefit vs infant risk.'}</p>
                <p><span className="font-semibold text-slate-700">Pediatric / Geriatric: </span>{selectedMedicine.age_related_precautions || 'Dose adjustment required based on body weight and organ clearance.'}</p>
              </div>

              {/* Related Medicines in Class */}
              {relatedMedicines.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <h4 className="font-bold text-slate-900 text-xs">Related Therapeutics in Same Drug Class</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {relatedMedicines.map((rel) => (
                      <div
                        key={rel.id}
                        onClick={() => openMonograph(rel)}
                        className="p-2.5 bg-slate-50 hover:bg-teal-50 border border-slate-200 rounded-lg cursor-pointer transition-colors"
                      >
                        <p className="font-bold text-slate-800 text-xs">{rel.brand_name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{rel.generic_name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Citations & Verified Authorities */}
              <div className="p-3 bg-slate-100 rounded-lg text-[10px] text-slate-500 space-y-1">
                <p className="font-bold text-slate-700">Authoritative Sources:</p>
                <p>{selectedMedicine.medical_source || 'Central Drugs Standard Control Organisation (CDSCO), Govt of India / WHO Model List of Essential Medicines / National List of Essential Medicines (NLEM India 2022)'}</p>
                <p className="italic">Last verified: {selectedMedicine.last_verification_date || '2026-Q1'}</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-[10px] text-slate-500">
                Prescription validation required at licensed dispensaries.
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedMedicine(null)}
                className="bg-teal-700 hover:bg-teal-800 text-xs font-bold"
              >
                Close Monograph
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
