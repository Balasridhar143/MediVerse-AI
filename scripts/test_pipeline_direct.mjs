import { executeMedicalReportRAGPipeline } from '../api/reportRAG.js';

const sampleLabReportText = `
  CITY CARE ADVANCED DIAGNOSTICS & RESEARCH CENTRE
  PATIENT NAME: Balasridhar S.  AGE: 34  GENDER: Male
  SAMPLE COLLECTED: 2026-10-28 08:30 AM
  REFERRING PHYSICIAN: Dr. Arun Kumar, MD
  
  INVESTIGATION: COMPLETE BLOOD COUNT (CBC) & METABOLIC PANEL
  
  Hemoglobin: 10.5 g/dL (Normal Range: 13.0 - 17.5 g/dL) [LOW]
  Total Leukocyte Count (WBC): 14200 /uL (Normal Range: 4000 - 11000 /uL) [HIGH]
  Platelet Count: 280000 /uL (Normal Range: 150000 - 450000 /uL) [NORMAL]
  Fasting Blood Glucose: 138 mg/dL (Normal Range: 70 - 99 mg/dL) [HIGH]
  HbA1c (Glycated Hemoglobin): 7.2 % (Normal Range: 4.0 - 5.6 %) [HIGH]
  Serum Creatinine: 1.1 mg/dL (Normal Range: 0.7 - 1.3 mg/dL) [NORMAL]
  Total Cholesterol: 235 mg/dL (Normal Range: 125 - 200 mg/dL) [HIGH]
  Serum Bilirubin: 0.8 mg/dL (Normal Range: 0.2 - 1.2 mg/dL) [NORMAL]
`;

async function main() {
  console.log('Testing executeMedicalReportRAGPipeline directly...');
  const res = await executeMedicalReportRAGPipeline({
    patientName: 'Balasridhar S.',
    reportType: 'Complete Blood Count (CBC) & Biochemistry',
    hospital: 'City Care Diagnostics',
    rawText: sampleLabReportText
  });
  console.log('Result extracted parameters:', res.parameters?.length);
  console.log('Parameters:', res.parameters?.map(p => `${p.test_name}: ${p.patient_value} ${p.unit} (${p.status})`));
  console.log('RAG citations:', res.rag_citations?.length);
}

main().catch(console.error);
