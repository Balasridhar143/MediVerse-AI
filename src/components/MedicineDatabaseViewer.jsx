import React, { useState, useEffect } from 'react';
import { medicineService } from '../services/api';
import Card from './Card';
import Button from './Button';
import Modal from './Modal';
import StatusBadge from './StatusBadge';
import {
  Search,
  Pill,
  ShieldCheck,
  AlertTriangle,
  Info,
  Layers,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Check,
  Scale,
  Sparkles,
  ExternalLink,
  BookOpen
} from 'lucide-react';

const QUICK_SEARCH_CHIPS = [
  { label: 'Augmentin (Amoxicillin)', q: 'Augmentin' },
  { label: 'Telmisartan (BP)', q: 'Telmisartan' },
  { label: 'Paracetamol (Fever/Pain)', q: 'Paracetamol' },
  { label: 'Azithromycin (Antibiotic)', q: 'Azithromycin' },
  { label: 'Pantoprazole (Acidity)', q: 'Pantoprazole' },
  { label: 'Metformin (Diabetes)', q: 'Metformin' },
  { label: 'Allegra (Allergy)', q: 'Allegra' },
];

export default function MedicineDatabaseViewer() {
  const [searchTerm, setSearchTerm] = useState('Augmentin');
  const [debouncedQuery, setDebouncedQuery] = useState('Augmentin');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [formulationFilter, setFormulationFilter] = useState('All');
  
  const [medicines, setMedicines] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Detail Modal State
  const [selectedMed, setSelectedMed] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Comparison State
  const [compareList, setCompareList] = useState([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [comparisonData, setComparisonData] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch medicines from database
  const fetchMedicines = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 12
      };
      if (debouncedQuery.trim()) params.q = debouncedQuery.trim();
      if (categoryFilter !== 'All') params.category = categoryFilter;
      if (formulationFilter !== 'All') params.formulation = formulationFilter;

      const data = await medicineService.getMedicines(params);
      setMedicines(data.items || []);
      setTotalCount(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      console.error('Failed to query medicine database:', err);
      setError('Unable to retrieve medicines from the clinical database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, [debouncedQuery, categoryFilter, formulationFilter, page]);

  // View Details
  const handleOpenDetails = async (med) => {
    setSelectedMed(med);
    setDetailLoading(true);
    try {
      const fullDetails = await medicineService.getMedicineById(med.id);
      setSelectedMed(fullDetails);
    } catch (e) {
      console.warn('Could not fetch expanded clinical details:', e);
    } finally {
      setDetailLoading(false);
    }
  };

  // Comparison toggle
  const toggleCompare = (med) => {
    if (compareList.some((m) => m.id === med.id)) {
      setCompareList(compareList.filter((m) => m.id !== med.id));
    } else {
      if (compareList.length >= 3) {
        alert('You can compare a maximum of 3 medicines at a time.');
        return;
      }
      setCompareList([...compareList, med]);
    }
  };

  const handleExecuteComparison = async () => {
    if (compareList.length < 2) {
      alert('Please select at least 2 medicines to compare.');
      return;
    }
    setCompareLoading(true);
    setIsCompareModalOpen(true);
    try {
      const res = await medicineService.compareMedicines(compareList.map((m) => m.id));
      setComparisonData(res);
    } catch (err) {
      alert('Failed to generate clinical comparison: ' + (err.response?.data?.detail || err.message));
      setIsCompareModalOpen(false);
    } finally {
      setCompareLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Search Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search 250,000+ Indian medicines by Brand Name, Generic Name, Active Ingredients, or Manufacturer..."
              className="w-full pl-11 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {compareList.length > 0 && (
            <Button
              variant="primary"
              size="md"
              icon={Scale}
              onClick={handleExecuteComparison}
              className="shrink-0"
            >
              Compare ({compareList.length}) Selected
            </Button>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-slate-500 font-semibold flex items-center gap-1 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" /> Common Queries:
          </span>
          {QUICK_SEARCH_CHIPS.map((chip) => (
            <button
              key={chip.q}
              onClick={() => setSearchTerm(chip.q)}
              className={`px-2.5 py-1 rounded-lg border font-medium transition-colors cursor-pointer ${
                searchTerm.toLowerCase() === chip.q.toLowerCase()
                  ? 'bg-teal-50 text-teal-800 border-teal-300'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header / Statistics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
        <p>
          Showing <strong>{medicines.length}</strong> of <strong>{totalCount.toLocaleString()}</strong> verified medicines
          {debouncedQuery && <span> for "<strong>{debouncedQuery}</strong>"</span>}
        </p>
        <span className="inline-flex items-center gap-1.5 text-teal-700 font-medium bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
          <ShieldCheck className="w-3.5 h-3.5" /> CDSCO & IP Verified Standards
        </span>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-3">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Querying 250,000+ pharmaceutical records...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Database Query Error</p>
            <p className="mt-0.5 text-rose-700">{error}</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && medicines.length === 0 && (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-3">
          <Pill className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No Matching Medicines Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            We could not find any pharmaceutical product matching "{searchTerm}". Please check for spelling variations or try searching by generic chemical name.
          </p>
        </div>
      )}

      {/* Medicines Grid */}
      {!loading && !error && medicines.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {medicines.map((med) => {
            const isSelectedForCompare = compareList.some((m) => m.id === med.id);
            return (
              <div
                key={med.id}
                className={`bg-white rounded-xl border p-4.5 flex flex-col justify-between transition-all hover:shadow-xs ${
                  isSelectedForCompare ? 'border-teal-500 ring-2 ring-teal-100' : 'border-slate-200'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-100 mt-0.5">
                        <Pill className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm leading-snug">
                          {med.brand_name}
                        </h4>
                        <span className="text-[11px] font-semibold text-teal-800 block">
                          {med.generic_name}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleCompare(med)}
                      className={`text-[10px] font-bold px-2 py-1 rounded border transition-colors cursor-pointer shrink-0 ${
                        isSelectedForCompare
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {isSelectedForCompare ? '✓ Selected' : '+ Compare'}
                    </button>
                  </div>

                  {/* Active Composition */}
                  <div className="bg-slate-50 p-2 rounded-lg text-[11px] text-slate-700 border border-slate-100">
                    <span className="font-semibold text-slate-900 block text-[10px] uppercase tracking-wider text-slate-400 mb-0.5">
                      Active Ingredients
                    </span>
                    <p className="line-clamp-2">{med.active_ingredients || med.composition || med.generic_name}</p>
                  </div>

                  {/* Manufacturer & Formulation */}
                  <div className="text-[11px] text-slate-500 space-y-0.5 pt-1">
                    <p className="truncate">
                      <strong>Manufacturer:</strong> {med.manufacturer}
                    </p>
                    <p>
                      <strong>Formulation:</strong> {med.pack_size || med.formulation}
                    </p>
                  </div>
                </div>

                {/* Price and Details Action */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    {med.price_inr ? (
                      <span className="text-sm font-extrabold text-slate-900">
                        ₹{med.price_inr.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">Price on Prescription</span>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => handleOpenDetails(med)}
                  >
                    Clinical Info
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-xs">
          <Button
            variant="outline"
            size="sm"
            icon={ChevronLeft}
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>

          <span className="text-slate-600 font-medium">
            Page <strong>{page}</strong> of <strong>{totalPages}</strong>
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      )}

      {/* Clinical Details Modal */}
      {selectedMed && (
        <Modal
          isOpen={Boolean(selectedMed)}
          onClose={() => setSelectedMed(null)}
          title={selectedMed.brand_name}
          subtitle={`${selectedMed.generic_name} • ${selectedMed.manufacturer}`}
          size="lg"
        >
          <div className="space-y-4 text-xs text-slate-800">
            {detailLoading && (
              <div className="p-4 text-center">
                <Loader2 className="w-5 h-5 text-teal-600 animate-spin mx-auto" />
                <p className="text-[11px] text-slate-500 mt-1">Loading clinical annotations...</p>
              </div>
            )}

            {/* Disclaimer Alert */}
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Statutory Medical Notice & Clinical Disclaimer</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800/90">
                {selectedMed.clinical_disclaimer || "This pharmaceutical monograph is provided strictly for educational and clinical guidance. Do not alter doses or start medication without direct supervision of a Registered Medical Practitioner."}
              </p>
            </div>

            {/* Therapeutic Classification */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                Therapeutic Classification
              </span>
              <p className="text-sm font-bold text-teal-900">
                {selectedMed.therapeutic_class || selectedMed.category}
              </p>
            </div>

            {/* Approved Indications */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <Info className="w-4 h-4 text-teal-600" />
                <span>Approved Clinical Indications</span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                {selectedMed.approved_indications}
              </p>
            </div>

            {/* Side Effects & Adverse Reactions */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Known Adverse Effects</span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                {selectedMed.known_adverse_effects}
              </p>
            </div>

            {/* Contraindications & Precautions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                <span className="font-bold text-rose-900 text-xs block">Contraindications</span>
                <p className="text-rose-800 text-[11px] leading-relaxed">
                  {selectedMed.contraindications}
                </p>
              </div>

              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                <span className="font-bold text-blue-900 text-xs block">Clinical Precautions</span>
                <p className="text-blue-800 text-[11px] leading-relaxed">
                  {selectedMed.precautions}
                </p>
              </div>
            </div>

            {/* Drug Interactions & Storage */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <strong className="block text-slate-900 mb-1">Significant Drug Interactions:</strong>
                <p className="text-slate-600">{selectedMed.drug_interactions}</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <strong className="block text-slate-900 mb-1">Storage Instructions:</strong>
                <p className="text-slate-600">{selectedMed.storage_instructions}</p>
              </div>
            </div>

            {/* Provenance & Regulatory Status */}
            <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
              <span>
                <strong>Regulatory Schedule:</strong> {selectedMed.regulatory_schedule}
              </span>
              <span>
                <strong>Source:</strong> {selectedMed.source} ({selectedMed.last_verification_date || '2026'})
              </span>
            </div>
          </div>
        </Modal>
      )}

      {/* Side-by-Side Comparison Modal */}
      {isCompareModalOpen && (
        <Modal
          isOpen={isCompareModalOpen}
          onClose={() => setIsCompareModalOpen(false)}
          title="Clinical Medicine Comparison"
          subtitle="Side-by-side comparative analysis of active composition, safety, and therapeutic class"
          size="xl"
        >
          {compareLoading ? (
            <div className="p-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-500">Synthesizing clinical comparison matrix...</p>
            </div>
          ) : comparisonData ? (
            <div className="space-y-4 text-xs">
              {/* Bioequivalence Notice */}
              <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                comparisonData.shares_same_active_ingredient
                  ? 'bg-blue-50 text-blue-900 border-blue-200'
                  : 'bg-amber-50 text-amber-900 border-amber-200'
              }`}>
                <strong>Bioequivalence & Interchangeability Notice: </strong>
                {comparisonData.clinical_interchangeability_guidance}
              </div>

              {/* Matrix Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="p-3 font-bold text-slate-700 w-1/4">Parameter</th>
                      {comparisonData.medicines.map((m) => (
                        <th key={m.id} className="p-3 font-bold text-teal-900">
                          {m.brand_name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-3 font-semibold text-slate-600">Active Formulation</td>
                      {comparisonData.medicines.map((m) => (
                        <td key={m.id} className="p-3 font-medium text-slate-900">
                          {m.active_ingredients || m.composition}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-600">Therapeutic Class</td>
                      {comparisonData.medicines.map((m) => (
                        <td key={m.id} className="p-3 text-slate-800">
                          {m.therapeutic_class}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-600">Indications</td>
                      {comparisonData.medicines.map((m) => (
                        <td key={m.id} className="p-3 text-slate-700">
                          {m.approved_indications}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-600">Contraindications</td>
                      {comparisonData.medicines.map((m) => (
                        <td key={m.id} className="p-3 text-rose-800 font-medium bg-rose-50/40">
                          {m.contraindications}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-600">Manufacturer & Price</td>
                      {comparisonData.medicines.map((m) => (
                        <td key={m.id} className="p-3 text-slate-800">
                          <p className="font-bold">{m.manufacturer}</p>
                          <p className="text-teal-700 font-semibold">{m.price_inr ? `₹${m.price_inr.toFixed(2)}` : 'On prescription'}</p>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </Modal>
      )}
    </div>
  );
}

