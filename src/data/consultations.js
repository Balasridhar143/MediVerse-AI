/**
 * src/data/consultations.js
 * Longitudinal Consultations Encounter Records for PulseCare.
 * All records are fictional sample data for frontend prototype demonstration.
 */

export const mockConsultationsList = [
  {
    id: 'cst_201',
    consultationId: 'CST-2026-201',
    patientId: 'P001',
    patientName: 'Rahul Sharma',
    doctorName: 'Dr. Arun Kumar',
    doctorId: 'D001',
    department: 'Cardiology',
    hospital: 'City Hospital Multispeciality',
    date: '28 Aug 2026',
    dateIso: '2026-08-28',
    consultationType: 'Video Telemedicine Encounter',
    chiefComplaint: 'Morning lightheadedness on sudden standing; routine BP follow-up.',
    symptoms: 'Mild postural dizziness upon waking. Denies chest pain, palpitation, or dyspnea.',
    vitalsRecorded: 'BP 128/82 mmHg, HR 72 bpm, Weight 74 kg',
    clinicalObservations: 'Cardiovascular exam unremarkable. Heart sounds regular. Peripheral pulses intact without edema. Good therapeutic response to Telmisartan.',
    assessment: 'Controlled Stage 1 Essential Hypertension. Orthostatic lightheadedness likely hydration-related.',
    plan: 'Continue Telmisartan 40mg OD. Instructed to rise slowly from seated/lying postures and maintain hydration. Routine CBC scheduled.',
    followUp: '4 weeks (Sep 28, 2026)',
  },
  {
    id: 'cst_200',
    consultationId: 'CST-2026-200',
    patientId: 'P001',
    patientName: 'Rahul Sharma',
    doctorName: 'Dr. Sunita Deshmukh',
    doctorId: 'D003',
    department: 'General Medicine',
    hospital: 'Metro General Healthcare',
    date: '15 Aug 2026',
    dateIso: '2026-08-15',
    consultationType: 'In-Person Clinical Visit',
    chiefComplaint: 'Routine wellness review & metabolic screening results check.',
    symptoms: 'Occasional post-lunch sluggishness. Normal appetite and activity.',
    vitalsRecorded: 'BP 132/85 mmHg, HR 75 bpm, Fasting Blood Glucose 114 mg/dL',
    clinicalObservations: 'Body Mass Index 25.8 kg/m². Abdomen soft, non-tender. Lungs clear bilaterally.',
    assessment: 'Impaired Fasting Glycemia (Pre-diabetes) with borderline dyslipidemia.',
    plan: 'Commenced Metformin 500mg twice daily with meals. Advised low glycemic index diet and 150 minutes weekly aerobic activity.',
    followUp: '3 months with repeat HbA1c',
  },
];
