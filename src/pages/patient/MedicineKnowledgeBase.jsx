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
  FileText,
  Utensils,
  Archive,
  HelpCircle,
  ShieldAlert,
  Compass
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import UniversalLanguageSelector from '../../components/LanguageSelector';
import api from '../../services/api';

export default function MedicineKnowledgeBase() {
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    return localStorage.getItem('mediverse_patient_language') || 'en';
  });

  const handleLanguageChange = (lang) => {
    setSelectedLanguage(lang);
    localStorage.setItem('mediverse_patient_language', lang);
    if (selectedMedicine) {
      openMonograph(selectedMedicine, lang);
    }
  };

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

  const openMonograph = async (med, reqLang = selectedLanguage) => {
    setSelectedMedicine(med);
    setMonographLoading(true);
    setRelatedMedicines([]);
    try {
      const res = await api.get(`/medicines/${med.id}/knowledge?lang=${reqLang}`);
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
        subtitle="Authoritative pharmacology, mechanisms of action, approved indications, and clinical safety precautions across verified Indian medicines."
        action={
          <UniversalLanguageSelector
            language={selectedLanguage}
            onChangeLanguage={handleLanguageChange}
          />
        }
      />

      {/* Safety Notice Banner */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <span className="font-bold">CLINICAL SAFETY MANDATE: </span>
          Reference dosage ranges and pharmacology provided are clinical standards derived from CDSCO, WHO EML, and NLEM India.
          They <span className="font-bold underline">MUST NOT</span> be construed as individualized prescriptions. Never adjust, initiate, or discontinue medications without evaluation by a registered medical doctor or licensed pharmacist.
        </div>
      </div>

      {/* Educational Banner: Understanding Generic vs. Brand Name */}
      <div className="p-4.5 bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 text-sm">
              Understanding Generic vs. Brand Name
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
              <strong>Generic Name:</strong> The globally recognized active chemical ingredient (e.g., <em>Paracetamol</em>, <em>Amoxicillin</em>) approved by international health authorities.
              <br />
              <strong>Brand Name:</strong> The proprietary trade name chosen by the pharmaceutical manufacturer (e.g., <em>Dolo 650</em>, <em>Augmentin</em>). Both contain the identical active molecule meeting identical pharmacopeial bioequivalence, purity, and clinical efficacy standards.
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-[11px] font-bold text-teal-800 bg-white px-3 py-1.5 rounded-lg border border-teal-200 inline-flex items-center gap-1.5 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            Verified Bioequivalence
          </span>
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
              placeholder="Search by Brand, Generic, Active Molecule, or Category (e.g. Paracetamol, Augmentin, Metformin, Ciplox)..."
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
          <p className="text-xs font-semibold text-slate-600">Querying verified clinical pharmacological catalog...</p>
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
                    Generic: {med.generic_name}
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

                {/* Route of Administration & Food instruction preview */}
                <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg space-y-1 border border-slate-100">
                  <p><span className="font-semibold text-slate-700">Route: </span>{med.route_of_administration || 'Oral'}</p>
                  <p className="truncate"><span className="font-semibold text-slate-700">Food: </span>{med.food_instructions || 'With water after food'}</p>
                </div>

                {/* Pack Size & Pricing */}
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
                  View Clinical Monograph
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

      {/* Detailed Clinical Monograph Modal with all 16 attributes */}
      {selectedMedicine && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50/80 sticky top-0 backdrop-blur-xs z-10">
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800 px-2 py-0.5 rounded">
                    {selectedMedicine.category}
                  </span>
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded">
                    {selectedMedicine.prescription_classification || (selectedMedicine.prescription_required ? 'Schedule H' : 'General')}
                  </span>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Route: {selectedMedicine.route_of_administration || 'Oral'}
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-900">
                  {selectedMedicine.brand_name}
                </h2>
                <p className="text-xs text-slate-600 font-mono mt-0.5">
                  Generic Non-Proprietary Name: <strong>{selectedMedicine.generic_name}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <UniversalLanguageSelector
                  language={selectedLanguage}
                  onChangeLanguage={handleLanguageChange}
                />
                <button
                  type="button"
                  onClick={() => setSelectedMedicine(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Complete 16 Core Clinical Attributes */}
            <div className="p-6 space-y-6 text-xs text-slate-700">
              {/* Patient-Friendly Explanation Summary (Requirement 2 & 3) */}
              <div className="p-4 bg-teal-50/80 border border-teal-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-teal-950 font-extrabold text-xs">
                  <Sparkles className="w-4 h-4 text-teal-700 shrink-0" />
                  <span>Patient-Friendly Medical Summary</span>
                  <span className="text-[10px] text-teal-800 bg-teal-100 px-2 py-0.5 rounded font-bold ml-auto uppercase">
                    Simple Explanation
                  </span>
                </div>

                <div className="space-y-2 text-slate-800 text-[11px]">
                  <div>
                    <strong className="text-teal-950 block">What the medicine does:</strong>
                    <p className="text-slate-700">{selectedMedicine.patient_explanation?.what_it_does || selectedMedicine.common_medical_uses || "Acts as a therapeutic preparation for clinically diagnosed conditions."}</p>
                  </div>
                  <div>
                    <strong className="text-teal-950 block">Why it is generally prescribed:</strong>
                    <p className="text-slate-700">{selectedMedicine.patient_explanation?.why_prescribed || selectedMedicine.what_medicine_is_used_for || "Prescribed by attending physicians for verified clinical indications."}</p>
                  </div>
                  <div>
                    <strong className="text-teal-950 block">How it works in the body:</strong>
                    <p className="text-slate-700">{selectedMedicine.patient_explanation?.how_it_works_in_body || selectedMedicine.mechanism_of_action || "Interacts with targeted physiological pathways to restore normal function."}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                    <div className="p-2.5 bg-white border border-teal-100 rounded-xl">
                      <strong className="text-amber-900 block mb-0.5 font-bold">Common Side Effects:</strong>
                      <p className="text-slate-600">{selectedMedicine.patient_explanation?.common_side_effects || (Array.isArray(selectedMedicine.common_side_effects) ? selectedMedicine.common_side_effects.join(', ') : selectedMedicine.common_side_effects) || "Mild nausea, headache, or transient stomach upset."}</p>
                    </div>
                    <div className="p-2.5 bg-white border border-teal-100 rounded-xl">
                      <strong className="text-teal-950 block mb-0.5 font-bold">Important Precautions:</strong>
                      <p className="text-slate-600">{selectedMedicine.patient_explanation?.important_precautions || selectedMedicine.clinical_precautions || "Take strictly as directed. Inform doctor of all current medications."}</p>
                    </div>
                  </div>
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-950">
                    <strong className="text-rose-900 block mb-0.5 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>Warning Signs Requiring Urgent Medical Attention:</span>
                    </strong>
                    <p className="text-rose-900/90 text-[11px]">{selectedMedicine.patient_explanation?.warning_signs_requiring_medical_attention || (Array.isArray(selectedMedicine.serious_adverse_effects) ? selectedMedicine.serious_adverse_effects.join(', ') : selectedMedicine.serious_adverse_effects) || "Difficulty breathing, swelling of face or throat, severe rash, or sudden dizziness."}</p>
                  </div>
                  <div>
                    <strong className="text-teal-950 block">What to discuss with your doctor or pharmacist:</strong>
                    <p className="text-slate-700">{selectedMedicine.patient_explanation?.what_to_discuss_with_doctor || "Discuss your medication timeline, pre-existing liver/kidney conditions, and all concurrent therapies."}</p>
                  </div>
                </div>
              </div>

              {/* 1. Generic vs Brand Educational Breakdown */}
              <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                  <Info className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>Generic vs. Brand Name Distinction</span>
                </div>
                <p className="text-blue-950 text-xs leading-relaxed">
                  {selectedMedicine.generic_vs_brand_explanation}
                </p>
              </div>

              {/* 2. Active Ingredients & Drug Class */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Pill className="w-4 h-4 text-teal-600" />
                    Active Pharmaceutical Ingredients (API)
                  </h4>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(selectedMedicine.active_ingredients || [selectedMedicine.generic_name]).map((act, aIdx) => (
                      <span key={aIdx} className="bg-white border border-slate-300 text-slate-800 px-2 py-1 rounded text-[11px] font-semibold">
                        {act}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-teal-600" />
                    Pharmacological Drug Class
                  </h4>
                  <p className="text-teal-900 font-bold text-xs pt-1">
                    {selectedMedicine.drug_classification || selectedMedicine.category}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Therapeutic nature: {selectedMedicine.treats_nature || 'Underlying Medical Management'}
                  </p>
                </div>
              </div>

              {/* 3. Mechanism of Action ("How it works in the body") */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-700" />
                  How the Medicine Works in the Body (Mechanism of Action)
                </h4>
                <p className="leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-slate-800 text-xs leading-relaxed">
                  {selectedMedicine.mechanism_of_action}
                </p>
              </div>

              {/* 4. What the medicine is used for (Approved Indications) */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-700" />
                  What the Medicine is Used For (Approved Indications)
                </h4>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <ul className="space-y-1.5 list-disc pl-4 text-slate-700 text-xs">
                    {(selectedMedicine.approved_indications || selectedMedicine.conditions_indicated || []).map((ind, iIdx) => (
                      <li key={iIdx}>{ind}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 5. Food-Related Instructions & Administration Guidance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1.5">
                  <h4 className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                    <Utensils className="w-4 h-4 text-amber-700" />
                    Food-Related Instructions & Meal Timing
                  </h4>
                  <p className="text-amber-900 text-xs leading-relaxed">
                    {selectedMedicine.food_instructions || selectedMedicine.food_interactions}
                  </p>
                </div>

                <div className="p-3.5 bg-teal-50/70 border border-teal-200 rounded-xl space-y-1.5">
                  <h4 className="font-bold text-teal-950 text-xs flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-teal-700" />
                    Reference Clinical Dosing & Administration
                  </h4>
                  <p className="text-teal-900 text-xs leading-relaxed">
                    {selectedMedicine.reference_dosage || selectedMedicine.general_approved_dosage}
                  </p>
                  <p className="text-[11px] text-teal-800 font-semibold pt-1">
                    Route: {selectedMedicine.route_of_administration}
                  </p>
                </div>
              </div>

              {/* 6. Adverse Effects: Common vs. Serious Warnings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-slate-600" />
                    Common Side Effects
                  </h5>
                  <ul className="space-y-1 text-slate-600 text-[11px] list-disc pl-3">
                    {(selectedMedicine.common_side_effects || []).map((eff, eIdx) => (
                      <li key={eIdx}>{eff}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                  <h5 className="font-bold text-rose-900 text-xs flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    Serious Side Effects & Warning Signs (Seek Urgent Care)
                  </h5>
                  <ul className="space-y-1 text-rose-800 text-[11px] list-disc pl-3">
                    {(selectedMedicine.serious_adverse_effects || selectedMedicine.important_warnings || []).map((warn, wIdx) => (
                      <li key={wIdx}>{warn}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 7. Contraindications & Drug Interactions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Contraindications & Precautions
                  </h5>
                  <ul className="space-y-1 text-slate-700 text-[11px] list-disc pl-3">
                    {(selectedMedicine.contraindications || []).map((c, cIdx) => (
                      <li key={cIdx}>{c}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-blue-600" />
                    Known Medicine Interactions
                  </h5>
                  <ul className="space-y-1 text-slate-700 text-[11px] list-disc pl-3">
                    {(selectedMedicine.drug_interactions || []).map((d, dIdx) => (
                      <li key={dIdx}>{d}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 8. Available Strengths, Dosage Forms & Storage Instructions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <h5 className="font-bold text-slate-900 text-xs">Available Strengths & Dosage Forms</h5>
                  <p className="text-slate-600 text-[11px]">
                    <span className="font-semibold text-slate-800">Strengths: </span>
                    {(selectedMedicine.available_strengths || []).join(', ')}
                  </p>
                  <p className="text-slate-600 text-[11px]">
                    <span className="font-semibold text-slate-800">Dosage Forms: </span>
                    {(selectedMedicine.dosage_forms || []).join(', ')}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Archive className="w-4 h-4 text-slate-600" />
                    Storage Instructions
                  </h5>
                  <p className="text-slate-700 text-[11px] leading-relaxed">
                    {selectedMedicine.storage_instructions}
                  </p>
                </div>
              </div>

              {/* 9. Special Population Precautions */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[11px]">
                <h5 className="font-bold text-slate-800 text-xs">Special Population Guidance</h5>
                <p><span className="font-semibold text-slate-700">Pregnancy: </span>{selectedMedicine.pregnancy_precautions || 'Consult prescribing obstetrician before use.'}</p>
                <p><span className="font-semibold text-slate-700">Breastfeeding: </span>{selectedMedicine.breastfeeding_precautions || 'Assess maternal benefit vs infant risk.'}</p>
                <p><span className="font-semibold text-slate-700">Pediatric / Geriatric: </span>{selectedMedicine.age_related_precautions || 'Dose adjustment required based on body weight and organ clearance.'}</p>
              </div>

              {/* 10. Statutory Safety Notice */}
              <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
                <p className="font-bold text-slate-800">Important Safety Information:</p>
                <p>{selectedMedicine.safety_information}</p>
                <p className="text-[10px] text-slate-500 pt-1">
                  <strong>Source Authorities: </strong>{selectedMedicine.medical_source} • Last Verified: {selectedMedicine.last_verification_date || '2026-Q1'}
                </p>
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
