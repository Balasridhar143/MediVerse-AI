/**
 * src/data/allergies.js
 * Longitudinal Allergy & Adverse Drug Reaction Registry for PulseCare.
 * All records share patientId: "P001".
 */

export const mockAllergiesList = [
  {
    id: 'alg_01',
    allergyId: 'ALG-2021-01',
    patientId: 'P001',
    patientName: 'Rahul Sharma',
    allergen: 'Penicillin / Beta-Lactam Antibiotics',
    category: 'Drug Allergy',
    reactionType: 'Type I Hypersensitivity',
    clinicalPresentation: 'Severe cutaneous urticaria (hives), facial angioedema, generalized pruritus.',
    dateDocumented: '12 Nov 2021',
    documentedBy: 'Dr. Sunita Deshmukh (Emergency Triage)',
    severity: 'Critical / Strict Contraindication',
    status: 'Active Alert',
    systemBehavior: 'Automated prescription gate prevents prescribing any penicillin, amoxicillin, or related beta-lactams.',
  },
  {
    id: 'alg_02',
    allergyId: 'ALG-2024-02',
    patientId: 'P001',
    patientName: 'Rahul Sharma',
    allergen: 'Iodinated Radiographic Contrast Media',
    category: 'Contrast Reaction Alert',
    reactionType: 'Metabolic & Renal Clearance Precaution',
    clinicalPresentation: 'Metformin co-administration precaution to avoid transient contrast-induced nephrotoxicity.',
    dateDocumented: '05 Mar 2024',
    documentedBy: 'Radiology Dept, City Hospital',
    severity: 'Moderate Precaution',
    status: 'Active Advisory',
    systemBehavior: 'Metformin must be temporarily withheld 48 hours prior to elective IV contrast studies.',
  },
];
