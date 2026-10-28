/**
 * src/data/symptoms.js
 * Longitudinal Patient Symptoms Log for PulseCare.
 * All records share patientId: "P001".
 */

export const mockSymptomsList = [
  {
    id: 'sym_01',
    symptomId: 'SYM-2026-01',
    patientId: 'P001',
    patientName: 'Rahul Sharma',
    date: '20 Sep 2026',
    dateIso: '2026-09-20',
    title: 'Postural Lightheadedness',
    severity: 'Mild',
    description: 'Patient logged mild dizziness upon rising quickly from bed in the morning. Resolved within 15 seconds.',
    associatedVitals: 'Morning BP: 124/80 mmHg, HR: 72 bpm',
    status: 'Reported to Doctor',
    actionTaken: 'Advised hydration and gradual transition from lying to standing postures.',
  },
  {
    id: 'sym_02',
    symptomId: 'SYM-2026-02',
    patientId: 'P001',
    patientName: 'Rahul Sharma',
    date: '10 Aug 2026',
    dateIso: '2026-08-10',
    title: 'Afternoon Fatigue / Lethargy',
    severity: 'Mild',
    description: 'Sluggishness noted around 2 PM; prompted fasting blood sugar check.',
    associatedVitals: 'Fasting Glucose recorded 114 mg/dL',
    status: 'Investigated & Resolved',
    actionTaken: 'Metformin started, dietary adjustments implemented.',
  },
];
