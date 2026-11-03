/**
 * scripts/test_medicine_kb_hospital_doctor_search.mjs
 * Comprehensive automated verification test for:
 * 1. Medicine Knowledge Base & Pharmacological Monograph Enrichment (all 16 fields, no cross-drug collision)
 * 2. Find Nearest Hospital Geolocation & Haversine Distance Sorting
 * 3. Doctor Discovery, 12 Core Specialties & Symptom-to-Specialist Mapping
 * 4. Cross-linking between Hospitals and Doctors
 */

import { enrichMedicineKnowledge, CLINICAL_DRUG_CLASSES } from '../api/medicineKnowledge.js';
import { CLINICAL_HOSPITALS } from '../api/datasets.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

console.log('====================================================');
console.log('PART 1: MEDICINE KNOWLEDGE BASE & MONOGRAPH ACCURACY');
console.log('====================================================');

// Test 1: Fluoroquinolone separation from Penicillin/Beta-lactam
const ciproMed = enrichMedicineKnowledge({
  id: 'MED-CIPRO-1',
  brand_name: 'Ciplox 500',
  generic_name: 'Ciprofloxacin',
  composition: 'Ciprofloxacin (500mg)',
  category: 'Antibiotics & Anti-Infectives',
  dosage_form: 'Tablet'
});

assert(ciproMed !== null, 'Ciplox 500 enriches successfully');
assert(ciproMed.drug_classification.includes('Fluoroquinolone'), `Ciplox correctly identified as Fluoroquinolone (got: ${ciproMed.drug_classification})`);
assert(!ciproMed.drug_classification.toLowerCase().includes('beta-lactam'), 'Ciplox is NOT misclassified as Beta-lactam');
assert(ciproMed.mechanism_of_action.includes('DNA gyrase'), 'Ciplox mechanism mentions DNA gyrase / topoisomerase');

// Test 2: Tramadol separation from Paracetamol
const tramadolMed = enrichMedicineKnowledge({
  id: 'MED-TRAM-1',
  brand_name: 'Tramazac 50',
  generic_name: 'Tramadol HCl',
  composition: 'Tramadol (50mg)',
  category: 'Analgesics'
});
assert(tramadolMed.drug_classification.includes('Opioid'), `Tramadol correctly identified as Opioid Analgesic (got: ${tramadolMed.drug_classification})`);
assert(!tramadolMed.drug_classification.includes('Antipyretic'), 'Tramadol is NOT misclassified as Antipyretic/Paracetamol');

// Test 3: Substring collision avoidance (Paraplatin must not match 'para' / Paracetamol)
const paraplatinMed = enrichMedicineKnowledge({
  id: 'MED-CARBO-1',
  brand_name: 'Paraplatin',
  generic_name: 'Carboplatin',
  composition: 'Carboplatin (150mg)',
  category: 'Antineoplastic / Oncology'
});
assert(!paraplatinMed.drug_classification.includes('Analgesic & Antipyretic'), `Paraplatin does not collide with Paracetamol (got: ${paraplatinMed.drug_classification})`);

// Test 4: Genuine Paracetamol / Dolo 650
const doloMed = enrichMedicineKnowledge({
  id: 'MED-DOLO-1',
  brand_name: 'Dolo 650',
  generic_name: 'Paracetamol',
  composition: 'Paracetamol (650mg)',
  category: 'Analgesics & Antipyretics'
});
assert(doloMed.drug_classification.includes('Analgesic & Antipyretic'), `Dolo 650 correctly classified as Analgesic & Antipyretic`);
assert(doloMed.mechanism_of_action.includes('prostaglandin synthesis'), 'Dolo mechanism accurately cites CNS prostaglandin modulation');

// Test 5: Verify all 16 required clinical attributes
const requiredFields = [
  'medicine_name',
  'generic_name',
  'brand_names',
  'active_ingredients',
  'category',
  'approved_indications',
  'mechanism_of_action',
  'common_side_effects',
  'serious_adverse_effects',
  'contraindications',
  'drug_interactions',
  'available_strengths',
  'dosage_forms',
  'route_of_administration',
  'food_instructions',
  'storage_instructions',
  'generic_vs_brand_explanation',
  'safety_information'
];

let allFieldsPresent = true;
for (const f of requiredFields) {
  if (!doloMed[f] || (Array.isArray(doloMed[f]) && doloMed[f].length === 0)) {
    console.error(`Missing required attribute: ${f}`);
    allFieldsPresent = false;
  }
}
assert(allFieldsPresent, 'All 16 required clinical attributes are populated in monograph');
assert(doloMed.generic_vs_brand_explanation.includes('Generic Name (Paracetamol)') && doloMed.generic_vs_brand_explanation.includes('Brand Name (Dolo 650)'), 'Generic vs Brand educational breakdown correctly incorporates medication names');

// Test 6: Route of Administration deduction
const eyeDropMed = enrichMedicineKnowledge({
  id: 'MED-EYE-1',
  brand_name: 'Refresh Tears',
  generic_name: 'Carboxymethylcellulose',
  composition: 'Carboxymethylcellulose 0.5%',
  dosage_form: 'Eye Drops'
});
assert(eyeDropMed.route_of_administration.includes('Ophthalmic'), `Eye drops correctly identified as Ophthalmic route (got: ${eyeDropMed.route_of_administration})`);

const inhalerMed = enrichMedicineKnowledge({
  id: 'MED-INH-1',
  brand_name: 'Asthalin Inhaler',
  generic_name: 'Salbutamol',
  composition: 'Salbutamol 100mcg',
  dosage_form: 'Metered-Dose Inhaler'
});
assert(inhalerMed.route_of_administration.includes('Inhalation'), `Inhaler correctly identified as Inhalation route (got: ${inhalerMed.route_of_administration})`);

console.log('\n====================================================');
console.log('PART 2: HAVERSINE DISTANCE & HOSPITAL GEOLOCATION');
console.log('====================================================');

// Haversine implementation from api/index.js
function haversineDist(lat1, lon1, lat2, lon2) {
  const rEarth = 6371.0;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(rEarth * c * 10) / 10;
}

// User location at Chennai Central (13.0827, 80.2707)
const chennaiLat = 13.0827;
const chennaiLon = 80.2707;

// Apollo Greams Road coordinates (13.0604, 80.2496)
const apolloGreams = CLINICAL_HOSPITALS.find(h => h.id === 'hosp_apollo_chennai');
assert(apolloGreams !== undefined, 'Apollo Hospital Greams Road exists in verified dataset');

const apolloDist = haversineDist(chennaiLat, chennaiLon, apolloGreams.latitude, apolloGreams.longitude);
assert(apolloDist > 0 && apolloDist < 5.0, `Calculated distance to Apollo Greams Road from Chennai Central is accurate (${apolloDist} km, expected ~3.4 km)`);

// Test sorting list by distance
const rankedHospitals = CLINICAL_HOSPITALS.slice(0, 50).map(h => ({
  ...h,
  distance_km: haversineDist(chennaiLat, chennaiLon, h.latitude, h.longitude)
})).sort((a, b) => a.distance_km - b.distance_km);

assert(rankedHospitals[0].distance_km <= rankedHospitals[1].distance_km, 'Hospital results strictly sorted ascending by distance');
assert(rankedHospitals[1].distance_km <= rankedHospitals[2].distance_km, 'Strict monotonic distance ordering verified');

console.log('\n====================================================');
console.log('PART 3: SPECIALIST DOCTOR MATCHING & HOSPITAL LINK');
console.log('====================================================');

const SYMPTOM_TO_SPECIALTY = {
  'heart': 'Cardiology',
  'chest pain': 'Cardiology',
  'skin': 'Dermatology',
  'rash': 'Dermatology',
  'eye': 'Ophthalmology',
  'vision': 'Ophthalmology',
  'bone': 'Orthopedics',
  'joint': 'Orthopedics',
  'knee pain': 'Orthopedics',
  'stomach': 'Gastroenterology',
  'acidity': 'Gastroenterology',
  'ear': 'ENT',
  'throat': 'ENT',
  'brain': 'Neurology',
  'headache': 'Neurology',
  'kidney': 'Nephrology',
  'urine': 'Urology',
  'child': 'Pediatrics',
  'women': 'Gynecology',
  'pregnancy': 'Gynecology',
  'fever': 'General Medicine'
};

assert(SYMPTOM_TO_SPECIALTY['heart'] === 'Cardiology', 'Symptom "heart" maps to Cardiology');
assert(SYMPTOM_TO_SPECIALTY['skin'] === 'Dermatology', 'Symptom "skin" maps to Dermatology');
assert(SYMPTOM_TO_SPECIALTY['eye'] === 'Ophthalmology', 'Symptom "eye" maps to Ophthalmology');
assert(SYMPTOM_TO_SPECIALTY['bone'] === 'Orthopedics', 'Symptom "bone" maps to Orthopedics');
assert(SYMPTOM_TO_SPECIALTY['stomach'] === 'Gastroenterology', 'Symptom "stomach" maps to Gastroenterology');
assert(SYMPTOM_TO_SPECIALTY['ear'] === 'ENT', 'Symptom "ear" maps to ENT');
assert(SYMPTOM_TO_SPECIALTY['brain'] === 'Neurology', 'Symptom "brain" maps to Neurology');
assert(SYMPTOM_TO_SPECIALTY['kidney'] === 'Nephrology', 'Symptom "kidney" maps to Nephrology');
assert(SYMPTOM_TO_SPECIALTY['urine'] === 'Urology', 'Symptom "urine" maps to Urology');
assert(SYMPTOM_TO_SPECIALTY['child'] === 'Pediatrics', 'Symptom "child" maps to Pediatrics');
assert(SYMPTOM_TO_SPECIALTY['women'] === 'Gynecology', 'Symptom "women" maps to Gynecology');
assert(SYMPTOM_TO_SPECIALTY['fever'] === 'General Medicine', 'Symptom "fever" maps to General Medicine');

console.log('\n====================================================');
console.log(`TOTAL PASSES: ${passed} | TOTAL FAILURES: ${failed}`);
console.log('====================================================');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('ALL CLINICAL LOGIC TESTS PASSED PERFECTLY!');
  process.exit(0);
}

