import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import app from '../api/index.js';
import http from 'http';

const PORT = 8089;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function runTests() {
  console.log('[Test] Launching local Express test server...');
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
  console.log(`[Test] Server listening on ${BASE_URL}`);

  try {
    // 1. Test Medicines Knowledge Base search
    console.log('\n--- 1. Testing GET /api/medicines/knowledge-base ---');
    const kbRes = await fetch(`${BASE_URL}/api/medicines/knowledge-base?search=amox&limit=5`);
    const kbData = await kbRes.json();
    console.log(`Status: ${kbRes.status}, Total matches: ${kbData.total_matching}`);
    if (kbData.medicines && kbData.medicines.length > 0) {
      const first = kbData.medicines[0];
      console.log(`Sample Result: ${first.brand_name} (${first.generic_name})`);
      console.log(`Drug class: ${first.drug_classification}`);
      console.log(`Mechanism: ${first.mechanism_of_action ? first.mechanism_of_action.slice(0, 80) + '...' : 'N/A'}`);
      console.log(`Disclaimer present: ${Boolean(first.disclaimer)}`);
    } else {
      throw new Error('No medicines returned from knowledge-base query');
    }

    // 2. Test Single Medicine Monograph
    console.log('\n--- 2. Testing GET /api/medicines/:id/knowledge ---');
    const firstMedId = kbData.medicines[0].id;
    const monoRes = await fetch(`${BASE_URL}/api/medicines/${firstMedId}/knowledge`);
    const monoData = await monoRes.json();
    console.log(`Status: ${monoRes.status}, Name: ${monoData.medicine?.brand_name}`);
    console.log(`Related medicines count: ${monoData.related_medicines?.length}`);
    console.log(`Contraindications: ${monoData.medicine?.contraindications?.length} items`);

    // 3. Test Medical Report RAG Analysis Pipeline
    console.log('\n--- 3. Testing POST /api/reports/analyze ---');
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

    const analyzeRes = await fetch(`${BASE_URL}/api/reports/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_name: 'Balasridhar S.',
        report_name: 'Comprehensive Diagnostic Hemogram & Metabolic Panel',
        report_type: 'Complete Blood Count (CBC) & Biochemistry',
        hospital: 'City Care Diagnostics',
        doctor: 'Dr. Arun Kumar',
        raw_text: sampleLabReportText
      })
    });

    const analyzeData = await analyzeRes.json();
    console.log(`Status: ${analyzeRes.status}, Report ID: ${analyzeData.report_id}`);
    console.log(`Extracted tests count: ${analyzeData.rag_analysis?.parameters?.length}`);
    console.log(`Abnormal count: ${analyzeData.rag_analysis?.structured_data?.abnormal_parameters}`);
    console.log(`RAG Citations retrieved: ${analyzeData.rag_analysis?.rag_citations?.length}`);
    if (analyzeData.rag_analysis?.rag_citations?.length > 0) {
      console.log(`Top Citation: ${analyzeData.rag_analysis.rag_citations[0].guideline_title} (${analyzeData.rag_analysis.rag_citations[0].issuing_organization})`);
    }
    console.log(`Cautious Recommendations: ${analyzeData.rag_analysis?.ai_explanation?.recommendations?.length} items`);

    // 4. Test Single Report Retrieval
    console.log('\n--- 4. Testing GET /api/reports/:id ---');
    const getRepRes = await fetch(`${BASE_URL}/api/reports/${analyzeData.report_id}`);
    const getRepData = await getRepRes.json();
    console.log(`Status: ${getRepRes.status}, Name: ${getRepData.report_name}, Parameters: ${getRepData.parameters?.length}`);

    // 5. Test Admin Statistics
    console.log('\n--- 5. Testing GET /api/admin/statistics ---');
    const statRes = await fetch(`${BASE_URL}/api/admin/statistics`);
    const statData = await statRes.json();
    console.log(`Status: ${statRes.status}`);
    console.log(`Total Users in DB: ${statData.users?.total_users}`);
    console.log(`Total Reports in DB: ${statData.reports?.total_reports}`);
    console.log(`Total Audit Entries: ${statData.audit?.total_audit_entries}`);

    console.log('\n>>> ALL BACKEND API TESTS COMPLETED SUCCESSFULLY! <<<');
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

runTests();
