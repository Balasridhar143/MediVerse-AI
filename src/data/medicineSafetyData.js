/**
 * medicineSafetyData.js
 * Verified Clinical Pharmacovigilance Rules & Patient Allergy Data.
 * 
 * Safety & Clinical Accuracy Constraints:
 * - Patient allergy database
 * - Verified drug-drug interaction matrix with severity (Low, Moderate, High), clinical reason, and recommended actions
 * - Duplicate molecule / active ingredient mapping (e.g., brand vs generic, dual therapy)
 * - Patient-friendly simplified explanation alongside clinical terminology
 * - Pre-formatted for future FastAPI / RAG endpoint migration:
 *   GET /api/prescriptions/{id}
 *   GET /api/medicines/{id}/safety
 *   POST /api/prescriptions/safety-check
 */

export const mockPatientAllergies = {
  'PID-2026-089': {
    patientId: 'PID-2026-089',
    patientName: 'Rahul Sharma',
    knownAllergies: [
      {
        allergen: 'Penicillin',
        allergenClass: 'Beta-Lactam Antibiotics',
        severity: 'High',
        reaction: 'Cutaneous hives and facial urticaria',
        diagnosedYear: '2021',
      },
      {
        allergen: 'Amoxicillin',
        allergenClass: 'Penicillin-class Antibiotic',
        severity: 'High',
        reaction: 'Acute rash and throat tightness',
        diagnosedYear: '2021',
      },
      {
        allergen: 'Sulfa Drugs (Sulfonamides)',
        allergenClass: 'Sulfonamide Antimicrobials',
        severity: 'Moderate',
        reaction: 'Generalized skin rash',
        diagnosedYear: '2019',
      },
    ],
  },
};

/**
 * Active molecules / generic equivalents for duplicate checks
 */
export const medicineMolecules = {
  telmisartan: {
    activeMolecule: 'telmisartan',
    brandAliases: ['micardis', 'telma', 'telpres', 'cresar'],
    drugClass: 'Angiotensin II Receptor Blocker (ARB)',
  },
  metformin: {
    activeMolecule: 'metformin',
    brandAliases: ['glucophage', 'glycomet', 'cetapin', 'obimet'],
    drugClass: 'Biguanide Antidiabetic',
  },
  atorvastatin: {
    activeMolecule: 'atorvastatin',
    brandAliases: ['lipitor', 'atorva', 'storvas', 'tonact'],
    drugClass: 'HMG-CoA Reductase Inhibitor (Statin)',
  },
  amlodipine: {
    activeMolecule: 'amlodipine',
    brandAliases: ['norvasc', 'amlong', 'stamlo'],
    drugClass: 'Dihydropyridine Calcium Channel Blocker',
  },
  amoxicillin: {
    activeMolecule: 'amoxicillin',
    brandAliases: ['augmentin', 'mox', 'novamox', 'amoxil'],
    drugClass: 'Aminopenicillin Antibiotic',
  },
  enalapril: {
    activeMolecule: 'enalapril',
    brandAliases: ['vasotec', 'envas', 'nuril'],
    drugClass: 'Angiotensin Converting Enzyme (ACE) Inhibitor',
  },
  ibuprofen: {
    activeMolecule: 'ibuprofen',
    brandAliases: ['advil', 'motrin', 'brufen', 'combiflam'],
    drugClass: 'Nonsteroidal Anti-inflammatory Drug (NSAID)',
  },
};

/**
 * Verified clinical drug interaction matrix
 */
export const verifiedDrugInteractions = [
  {
    drugA: 'Telmisartan',
    drugB: 'Enalapril',
    severity: 'High',
    clinicalReason: 'Dual blockade of the renin-angiotensin system (ARB + ACE Inhibitor) significantly increases the risk of severe hypotension, syncope, hyperkalemia, and acute renal failure.',
    simpleExplanation: 'These two medicines both lower blood pressure through similar pathways. Taking both together can cause blood pressure to drop dangerously low and strain the kidneys.',
    recommendedAction: 'Do not co-prescribe. Select either Telmisartan (ARB) or Enalapril (ACEI) based on clinical indication. Physician review required.',
  },
  {
    drugA: 'Telmisartan',
    drugB: 'Ibuprofen',
    severity: 'Moderate',
    clinicalReason: 'NSAIDs (Ibuprofen) diminish the antihypertensive effectiveness of Telmisartan and may exacerbate renal impairment in volume-depleted or elderly patients.',
    simpleExplanation: 'Pain relievers like ibuprofen can reduce how well this blood pressure medicine works and may strain your kidneys.',
    recommendedAction: 'Monitor blood pressure regularly. Use acetaminophen/paracetamol for mild analgesia where appropriate. Review with doctor.',
  },
  {
    drugA: 'Atorvastatin',
    drugB: 'Clarithromycin',
    severity: 'High',
    clinicalReason: 'Strong CYP3A4 inhibition by Clarithromycin dramatically increases Atorvastatin serum concentrations, elevating the risk of severe myopathy and rhabdomyolysis.',
    simpleExplanation: 'This antibiotic significantly increases the statin level in the blood, which can cause severe muscle breakdown.',
    recommendedAction: 'Temporarily withhold Atorvastatin during antibiotic course, or prescribe an alternative antibiotic (e.g., azithromycin).',
  },
  {
    drugA: 'Metformin',
    drugB: 'Iodinated Radiocontrast',
    severity: 'High',
    clinicalReason: 'Intravascular iodinated contrast media can cause contrast-induced nephropathy leading to severe metformin accumulation and life-threatening lactic acidosis.',
    simpleExplanation: 'Dyes used in hospital imaging scans can affect how kidneys clear metformin. A pause is required before and after scans.',
    recommendedAction: 'Withhold Metformin at time of or prior to procedure; resume after 48 hours only if renal function re-evaluation remains stable.',
  },
];

/**
 * Reusable safety check engine
 * Evaluates a list of medicines against patient allergies, duplicate molecules, and drug-drug interactions.
 */
export const runPrescriptionSafetyCheck = ({
  medicines = [],
  patientId = 'PID-2026-089',
  existingMedications = [],
}) => {
  const patientData = mockPatientAllergies[patientId] || { knownAllergies: [] };
  const knownAllergies = patientData.knownAllergies;

  const allergyWarnings = [];
  const duplicateWarnings = [];
  const interactionWarnings = [];

  const allMedsToCheck = [
    ...medicines.map((m) => (typeof m === 'string' ? m : m.name)),
    ...existingMedications.map((m) => (typeof m === 'string' ? m : m.name)),
  ];

  // 1. Allergy Checking
  medicines.forEach((med) => {
    const medName = typeof med === 'string' ? med : med.name;
    const lowerMed = medName.toLowerCase();

    knownAllergies.forEach((allergy) => {
      const lowerAllergy = allergy.allergen.toLowerCase();
      // Direct name match or penicillin/beta-lactam cross-reactivity rule
      const isDirectMatch = lowerMed.includes(lowerAllergy) || lowerAllergy.includes(lowerMed);
      const isCrossPenicillin =
        lowerAllergy.includes('penicillin') &&
        (lowerMed.includes('amoxicillin') || lowerMed.includes('ampicillin') || lowerMed.includes('augmentin'));

      if (isDirectMatch || isCrossPenicillin) {
        allergyWarnings.push({
          medicine: medName,
          allergen: allergy.allergen,
          allergenClass: allergy.allergenClass,
          severity: allergy.severity,
          reaction: allergy.reaction,
          clinicalMessage: `Potential allergy conflict detected. Patient has documented hypersensitivity to ${allergy.allergen} (${allergy.reaction}).`,
          simpleExplanation: `This medicine belongs to or is related to ${allergy.allergen}, which you are allergic to. Doctor confirmation is strictly required.`,
        });
      }
    });
  });

  // 2. Duplicate Medicine / Molecule Checking
  const seenMolecules = new Map();
  medicines.forEach((med) => {
    const medName = typeof med === 'string' ? med : med.name;
    const lowerName = medName.toLowerCase();
    
    // Find molecule key
    let moleculeKey = lowerName;
    for (const [key, details] of Object.entries(medicineMolecules)) {
      if (lowerName.includes(key) || details.brandAliases.some((b) => lowerName.includes(b))) {
        moleculeKey = details.activeMolecule;
        break;
      }
    }

    if (seenMolecules.has(moleculeKey)) {
      const prevMed = seenMolecules.get(moleculeKey);
      duplicateWarnings.push({
        medicineA: prevMed,
        medicineB: medName,
        activeMolecule: moleculeKey,
        clinicalMessage: `Potential duplicate medicine detected. "${prevMed}" and "${medName}" share the same active molecule (${moleculeKey}).`,
        simpleExplanation: `Both of these medicines contain the same active drug. Taking both together can cause an accidental double dose.`,
      });
    } else {
      seenMolecules.set(moleculeKey, medName);
    }
  });

  // 3. Drug-Drug Interaction Checking
  for (let i = 0; i < allMedsToCheck.length; i++) {
    for (let j = i + 1; j < allMedsToCheck.length; j++) {
      const nameA = allMedsToCheck[i].toLowerCase();
      const nameB = allMedsToCheck[j].toLowerCase();

      verifiedDrugInteractions.forEach((interaction) => {
        const intA = interaction.drugA.toLowerCase();
        const intB = interaction.drugB.toLowerCase();

        const match1 = nameA.includes(intA) && nameB.includes(intB);
        const match2 = nameA.includes(intB) && nameB.includes(intA);

        if (match1 || match2) {
          // Avoid duplicate pairs in warning list
          const alreadyLogged = interactionWarnings.some(
            (w) =>
              (w.drugA === interaction.drugA && w.drugB === interaction.drugB) ||
              (w.drugA === interaction.drugB && w.drugB === interaction.drugA)
          );

          if (!alreadyLogged) {
            interactionWarnings.push({
              drugA: interaction.drugA,
              drugB: interaction.drugB,
              severity: interaction.severity,
              clinicalReason: interaction.clinicalReason,
              simpleExplanation: interaction.simpleExplanation,
              recommendedAction: interaction.recommendedAction,
            });
          }
        }
      });
    }
  }

  // Overall Safety Determination
  const hasCriticalAllergy = allergyWarnings.some((w) => w.severity === 'High');
  const hasHighInteraction = interactionWarnings.some((w) => w.severity === 'High');
  const hasDuplicates = duplicateWarnings.length > 0;

  const requiresReview =
    allergyWarnings.length > 0 || interactionWarnings.length > 0 || duplicateWarnings.length > 0;

  return {
    allergyStatus: allergyWarnings.length === 0 ? 'No known conflict' : 'Potential allergy concern',
    duplicateStatus: duplicateWarnings.length === 0 ? 'No duplicate detected' : 'Possible duplicate flagged',
    interactionStatus: interactionWarnings.length === 0 ? 'No major interaction' : 'Review required',
    overallStatus: requiresReview ? 'Doctor Review Required' : 'Clinical Review Passed',
    overallSeverity: hasCriticalAllergy || hasHighInteraction ? 'High' : requiresReview ? 'Moderate' : 'Low',
    allergyWarnings,
    duplicateWarnings,
    interactionWarnings,
    patientAllergies: knownAllergies,
  };
};
