import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import UniversalLanguageSelector from '../../components/LanguageSelector';
import {
  Pill,
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Clock,
  Utensils,
  BookOpen,
  Sparkles,
  Info,
  CheckCircle2,
  HelpCircle,
  ShieldAlert,
  Archive,
  Layers,
  HeartPulse,
  Activity,
  FileText,
  Loader2,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

export default function MedicineDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    return localStorage.getItem('mediverse_patient_language') || 'en';
  });

  const [medicine, setMedicine] = useState(location.state?.medicine || null);
  const [loading, setLoading] = useState(!location.state?.medicine);
  const [error, setError] = useState(null);
  const [relatedMedicines, setRelatedMedicines] = useState([]);

  useEffect(() => {
    if (id) {
      loadMedicineDetails(id, selectedLanguage);
    }
  }, [id, selectedLanguage]);

  const loadMedicineDetails = async (medId, lang) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Try primary knowledge monograph endpoint with language support
      try {
        const res = await api.get(`/medicines/${encodeURIComponent(medId)}/knowledge?lang=${lang}`);
        if (res.data?.medicine) {
          setMedicine(res.data.medicine);
          if (res.data.related_medicines) {
            setRelatedMedicines(res.data.related_medicines);
          }
          setLoading(false);
          return;
        }
      } catch (kErr) {
        // Fall back to standard medicine details endpoint
        console.warn('Monograph endpoint fallback:', kErr.message);
      }

      // 2. Fallback to standard medicine details endpoint
      const fallbackRes = await api.get(`/medicines/${encodeURIComponent(medId)}?lang=${lang}`);
      if (fallbackRes.data) {
        setMedicine(fallbackRes.data);
      } else {
        throw new Error(`Medicine profile unavailable for identifier: ${medId}`);
      }
    } catch (err) {
      console.error('Failed to load medicine details:', err);
      const errorMsg = err.response?.data?.detail || err.message || 'The requested medicine details could not be found.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (lang) => {
    setSelectedLanguage(lang);
    localStorage.setItem('mediverse_patient_language', lang);
  };

  // Helper for safe display of string or array fields
  const renderListOrText = (val, emptyFallback = 'Information not available') => {
    if (!val) return emptyFallback;
    if (Array.isArray(val)) {
      if (val.length === 0) return emptyFallback;
      return (
        <ul className="list-disc list-inside space-y-1">
          {val.map((item, idx) => (
            <li key={idx} className="text-slate-700 leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
      );
    }
    return <p className="text-slate-700 leading-relaxed">{String(val)}</p>;
  };

  // Safe string helper
  const getField = (val, emptyFallback = 'Information not available') => {
    if (val === undefined || val === null || val === '') return emptyFallback;
    if (Array.isArray(val)) return val.length > 0 ? val.join(', ') : emptyFallback;
    return String(val);
  };

  if (loading && !medicine) {
    return (
      <div className="max-w-5xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-16 h-16 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-slate-900">Loading Medicine Information</h2>
          <p className="text-sm text-slate-500">Retrieving verified clinical monograph and therapeutic parameters...</p>
        </div>
      </div>
    );
  }

  if (error && !medicine) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 space-y-6">
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl space-y-4 text-rose-950">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center shrink-0">
              <AlertCircle className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-rose-900">Medicine Not Found</h2>
              <p className="text-xs text-rose-700 mt-0.5">
                We could not locate clinical records for medicine identifier <code>"{id}"</code>.
              </p>
            </div>
          </div>
          <p className="text-xs text-rose-800 leading-relaxed">
            {error}. The medicine may have been archived or the link might be incomplete. Please return to the Medicine Knowledge Base to search among the 5,600+ verified CDSCO / WHO medications.
          </p>
          <div className="pt-2 flex items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              icon={ArrowLeft}
              onClick={() => navigate('/patient/medicine-knowledge')}
            >
              Back to Medicine Knowledge Base
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={() => loadMedicineDetails(id, selectedLanguage)}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const med = medicine || {};
  const brandName = med.brand_name || med.name || 'Medicine Details';
  const genericName = med.generic_name || 'Information not available';
  const activeIngredients = med.active_ingredients || med.composition || med.active_ingredient;
  const isRx = med.prescription_required;
  const scheduleLabel = med.prescription_classification || (isRx ? 'Schedule H Rx' : 'OTC / General Sale');

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      {/* Top Navigation Bar: Back Button & Language Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <Button
          variant="outline"
          size="sm"
          icon={ArrowLeft}
          onClick={() => navigate('/patient/medicine-knowledge')}
          className="font-bold text-slate-700 hover:text-teal-700 w-fit"
        >
          Back to Medicine Knowledge Base
        </Button>

        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs w-fit">
          <BookOpen className="w-4 h-4 text-teal-600 shrink-0" />
          <span className="text-xs font-semibold text-slate-600 hidden sm:inline">Monograph Language:</span>
          <UniversalLanguageSelector
            language={selectedLanguage}
            onChangeLanguage={handleLanguageChange}
          />
        </div>
      </div>

      {/* Main Medicine Header Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Pill className="w-8 h-8 sm:w-9 sm:h-9" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200">
                  {getField(med.category || med.therapeutic_category, 'Pharmaceutical Medication')}
                </span>
                <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                  isRx ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {scheduleLabel}
                </span>
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200">
                  Route: {getField(med.route_of_administration, 'Oral')}
                </span>
              </div>

              {/* Medicine Name as Primary Page Heading */}
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                {brandName}
              </h1>

              <div className="space-y-0.5 pt-0.5">
                <p className="text-sm text-slate-600 font-mono">
                  <span className="font-semibold text-slate-800">Generic Non-Proprietary Name: </span>
                  <span className="text-teal-900 font-bold">{genericName}</span>
                </p>
                {med.manufacturer && (
                  <p className="text-xs text-slate-500">
                    <span className="font-medium text-slate-700">Manufacturer / Marketer: </span>
                    {med.manufacturer}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Pricing & Pack summary */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-right min-w-[180px] shrink-0 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pack & Formulation</p>
            <p className="text-sm font-bold text-slate-800">{getField(med.pack_size || med.dosage_form, 'Standard Pack')}</p>
            {med.price_inr && (
              <p className="text-xl font-black text-teal-800 pt-1">
                ₹{Number(med.price_inr).toFixed(2)}
              </p>
            )}
            <p className="text-[10px] text-slate-500">CDSCO / WHO Reference</p>
          </div>
        </div>

        {/* Patient-Friendly Explanation Box */}
        <div className="p-5 bg-teal-50/80 border border-teal-200 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-teal-950 font-extrabold text-sm">
            <Sparkles className="w-5 h-5 text-teal-700 shrink-0" />
            <span>Patient-Friendly Medical Explanation</span>
            <span className="text-[10px] text-teal-800 bg-teal-100 px-2 py-0.5 rounded font-bold ml-auto uppercase">
              Plain Language
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-800">
            <div className="space-y-1">
              <strong className="text-teal-950 block text-[11px] uppercase tracking-wider">What this medicine does:</strong>
              <p className="text-slate-700 leading-relaxed">
                {med.patient_explanation?.what_it_does || med.common_medical_uses || med.uses || 'Acts as a targeted therapeutic preparation for clinically diagnosed conditions.'}
              </p>
            </div>

            <div className="space-y-1">
              <strong className="text-teal-950 block text-[11px] uppercase tracking-wider">Why it is prescribed:</strong>
              <p className="text-slate-700 leading-relaxed">
                {med.patient_explanation?.why_prescribed || med.what_medicine_is_used_for || 'Prescribed by attending clinicians for authorized therapeutic indications and disease management.'}
              </p>
            </div>

            <div className="space-y-1">
              <strong className="text-teal-950 block text-[11px] uppercase tracking-wider">How it works in the body:</strong>
              <p className="text-slate-700 leading-relaxed">
                {med.patient_explanation?.how_it_works_in_body || med.mechanism_of_action || 'Interacts with specific cellular receptors and metabolic pathways to stabilize biological function.'}
              </p>
            </div>

            <div className="space-y-1">
              <strong className="text-teal-950 block text-[11px] uppercase tracking-wider">What to discuss with your doctor:</strong>
              <p className="text-slate-700 leading-relaxed">
                {med.patient_explanation?.what_to_discuss_with_doctor || 'Discuss your current medical history, ongoing medications, kidney/liver function, and duration of therapy.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Clearly Organized Information Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* SECTION 1: CORE PHARMACOLOGICAL PROFILE */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="text-base font-extrabold text-slate-900">Pharmacological Profile</h2>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between py-1.5 border-b border-slate-50 gap-1">
              <span className="font-semibold text-slate-500">Brand Name</span>
              <span className="font-bold text-slate-900 text-right">{brandName}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start justify-between py-1.5 border-b border-slate-50 gap-1">
              <span className="font-semibold text-slate-500">Generic Non-Proprietary Name</span>
              <span className="font-mono text-teal-900 font-bold text-right">{genericName}</span>
            </div>

            <div className="py-1.5 border-b border-slate-50 space-y-1">
              <span className="font-semibold text-slate-500 block">Active Ingredients / Composition</span>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-medium text-slate-800">
                {renderListOrText(activeIngredients, 'Information not available')}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start justify-between py-1.5 border-b border-slate-50 gap-1">
              <span className="font-semibold text-slate-500">Medicine Category</span>
              <span className="font-medium text-slate-800 text-right">{getField(med.category || med.therapeutic_category)}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start justify-between py-1.5 border-b border-slate-50 gap-1">
              <span className="font-semibold text-slate-500">Therapeutic Class / Nature</span>
              <span className="font-medium text-slate-800 text-right">{getField(med.drug_classification || med.treats_nature)}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start justify-between py-1.5 border-b border-slate-50 gap-1">
              <span className="font-semibold text-slate-500">Available Strengths</span>
              <span className="font-medium text-slate-800 text-right">{getField(med.available_strengths)}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start justify-between py-1.5 border-b border-slate-50 gap-1">
              <span className="font-semibold text-slate-500">Dosage Form</span>
              <span className="font-medium text-slate-800 text-right">{getField(med.dosage_forms || med.dosage_form)}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start justify-between py-1.5 border-b border-slate-50 gap-1">
              <span className="font-semibold text-slate-500">Route of Administration</span>
              <span className="font-medium text-slate-800 text-right">{getField(med.route_of_administration, 'Oral')}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start justify-between py-1.5 gap-1">
              <span className="font-semibold text-slate-500">Manufacturer</span>
              <span className="font-medium text-slate-800 text-right">{getField(med.manufacturer)}</span>
            </div>
          </div>
        </div>

        {/* SECTION 2: USES, HOW IT WORKS & DOSAGE */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <h2 className="text-base font-extrabold text-slate-900">Uses, Indications & Dosage</h2>
          </div>

          <div className="space-y-4 text-xs">
            {/* Approved Indications */}
            <div className="space-y-1.5">
              <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>Approved Uses and Indications:</span>
              </span>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                {renderListOrText(med.approved_indications || med.conditions_indicated || med.common_medical_uses || med.uses)}
              </div>
            </div>

            {/* How It Works / Mechanism */}
            <div className="space-y-1.5">
              <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <HeartPulse className="w-4 h-4 text-teal-600" />
                <span>How It Works (Mechanism of Action):</span>
              </span>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                {renderListOrText(med.mechanism_of_action || med.how_it_works_in_body)}
              </div>
            </div>

            {/* Verified Reference Dosage */}
            <div className="space-y-1.5">
              <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <Clock className="w-4 h-4 text-teal-600" />
                <span>Dosage Information:</span>
              </span>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                <p className="font-medium text-slate-800">
                  {getField(med.reference_dosage || med.general_approved_dosage)}
                </p>
                <p className="text-[11px] text-slate-500 italic">
                  Note: Dosage must be strictly tailored by a licensed physician according to age, weight, and renal function.
                </p>
              </div>
            </div>

            {/* Food Instructions */}
            <div className="space-y-1.5">
              <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <Utensils className="w-4 h-4 text-teal-600" />
                <span>Food & Administration Instructions:</span>
              </span>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                {renderListOrText(med.food_instructions || med.food_interactions || med.administration_instructions)}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: SIDE EFFECTS & WARNING SIGNS */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h2 className="text-base font-extrabold text-slate-900">Side Effects & Adverse Reactions</h2>
          </div>

          <div className="space-y-4 text-xs">
            {/* Common Side Effects */}
            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-2 text-amber-950">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <Info className="w-4 h-4 text-amber-600" />
                <span>Common Side Effects (Usually Mild & Self-Limiting):</span>
              </div>
              <div className="text-slate-800">
                {renderListOrText(med.common_side_effects)}
              </div>
            </div>

            {/* Serious Adverse Reactions */}
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2 text-rose-950">
              <div className="flex items-center gap-1.5 font-extrabold text-rose-900">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Warning Signs Requiring Urgent Medical Attention:</span>
              </div>
              <div className="text-slate-800">
                {renderListOrText(med.serious_adverse_effects || med.important_warnings)}
              </div>
              <p className="text-[11px] text-rose-800 pt-1 font-semibold">
                If facial swelling, breathing distress, sudden severe rash or fainting occurs, discontinue and seek emergency care immediately.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 4: CONTRAINDICATIONS & PRECAUTIONS */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h2 className="text-base font-extrabold text-slate-900">Contraindications & Precautions</h2>
          </div>

          <div className="space-y-4 text-xs">
            {/* Contraindications */}
            <div className="space-y-1.5">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Contraindications (When NOT to take this medication):</span>
              </span>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                {renderListOrText(med.contraindications)}
              </div>
            </div>

            {/* Clinical Precautions */}
            <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="font-bold text-slate-900 block">General Clinical Precautions:</span>
              <p className="text-slate-700 leading-relaxed">
                {getField(med.clinical_precautions || med.precautions || med.important_precautions)}
              </p>

              <div className="pt-2 border-t border-slate-200/80 space-y-1.5 text-[11px]">
                <p><strong className="text-slate-800">Pregnancy Precautions: </strong>{getField(med.pregnancy_precautions)}</p>
                <p><strong className="text-slate-800">Breastfeeding Precautions: </strong>{getField(med.breastfeeding_precautions)}</p>
                <p><strong className="text-slate-800">Pediatric / Geriatric Age Precautions: </strong>{getField(med.age_related_precautions || med.age_precautions)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 5: DRUG & FOOD INTERACTIONS */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <h2 className="text-base font-extrabold text-slate-900">Interactions (Drug & Food)</h2>
          </div>

          <div className="space-y-4 text-xs">
            {/* Drug Interactions */}
            <div className="space-y-1.5">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-indigo-600" />
                <span>Known Drug-Drug Interactions:</span>
              </span>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                {renderListOrText(med.drug_interactions)}
              </div>
            </div>

            {/* Food Interactions */}
            <div className="space-y-1.5">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-indigo-600" />
                <span>Food & Dietary Interactions:</span>
              </span>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                {renderListOrText(med.food_interactions || med.food_instructions)}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 6: STORAGE & REGULATORY REPOSITORY */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Archive className="w-4 h-4" />
            </div>
            <h2 className="text-base font-extrabold text-slate-900">Storage & Regulatory Details</h2>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Storage Instructions */}
            <div className="space-y-1.5">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Archive className="w-4 h-4 text-emerald-600" />
                <span>Storage Instructions:</span>
              </span>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-slate-800 font-medium">
                  {getField(med.storage_instructions || med.storage, 'Store below 25°C in a dry place. Protect from direct heat, sunlight and moisture. Keep out of reach of children.')}
                </p>
              </div>
            </div>

            {/* Regulatory and Verification Reference */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-[11px] text-slate-600">
              <p><strong className="text-slate-800">Regulatory Schedule: </strong>{getField(med.schedule || (isRx ? 'Schedule H' : 'General'))}</p>
              <p><strong className="text-slate-800">Source Standard: </strong>{getField(med.medical_source || med.source_reference, 'CDSCO / WHO Essential Medicines / Indian Pharmacopoeia')}</p>
              <p><strong className="text-slate-800">Clinical Verification Cycle: </strong>{getField(med.last_verification_date || med.verification_date, '2026-Q1')}</p>
            </div>
          </div>
        </div>

      </div>

      {/* Statutory Clinical Notice */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs space-y-1.5">
        <div className="flex items-center gap-2 font-bold text-amber-800">
          <ShieldCheck className="w-4 h-4 text-amber-600" />
          <span>Statutory Medical Notice & Clinical Guardrail</span>
        </div>
        <p className="text-[11px] leading-relaxed text-amber-800/90">
          {med.safety_information || 'This pharmaceutical monograph is provided strictly for patient education and clinical guidance. Do not self-medicate, alter doses, or discontinue therapy without consulting a Registered Medical Practitioner.'}
        </p>
      </div>

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          size="sm"
          icon={ArrowLeft}
          onClick={() => navigate('/patient/medicine-knowledge')}
          className="font-bold text-slate-700"
        >
          Back to Medicine Knowledge Base
        </Button>
        <Button
          variant="primary"
          size="sm"
          icon={Pill}
          onClick={() => navigate('/patient/medicines')}
          className="font-bold"
        >
          View My Prescriptions & Regimen
        </Button>
      </div>
    </div>
  );
}

