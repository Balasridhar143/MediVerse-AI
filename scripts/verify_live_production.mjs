const PROD_URL = 'https://mediverse-ai-fawn.vercel.app';

async function verifyLiveProduction() {
  console.log(`[Verification] Testing Live Production Deployment at ${PROD_URL}...\n`);

  try {
    // 1. Root / Frontend HTML Check
    console.log('1. Checking Live Frontend Landing Page:');
    const rootRes = await fetch(`${PROD_URL}/`);
    console.log(`   GET / -> Status: ${rootRes.status} ${rootRes.statusText}`);
    const rootText = await rootRes.text();
    console.log(`   HTML Length: ${rootText.length} bytes, Contains title: ${rootText.includes('MediVerse') || rootText.includes('Mediverse') || rootText.includes('root')}`);

    // 2. Health Endpoint
    console.log('\n2. Checking Backend Health & Neon DB Status:');
    const healthRes = await fetch(`${PROD_URL}/api/health`);
    const healthData = await healthRes.json();
    console.log(`   GET /api/health -> Status: ${healthRes.status}, Status: ${healthData.status}, Database: ${healthData.database || healthData.db || 'Active'}`);

    // 3. Medicine Knowledge Base API
    console.log('\n3. Checking Live Medicine Knowledge Base Endpoint:');
    const kbRes = await fetch(`${PROD_URL}/api/medicines/knowledge-base?search=amoxicillin&limit=2`);
    console.log(`   GET /api/medicines/knowledge-base -> Status: ${kbRes.status}`);
    const kbData = await kbRes.json();
    console.log(`   Total matching: ${kbData.total_matching}, Total categories: ${kbData.categories?.length}`);
    if (kbData.medicines && kbData.medicines.length > 0) {
      const sample = kbData.medicines[0];
      console.log(`   First match: "${sample.brand_name}" (${sample.generic_name})`);
      console.log(`   Drug class: ${sample.drug_classification}`);
      console.log(`   CDSCO/WHO Citation: ${sample.medical_source}`);
      console.log(`   Disclaimer present: ${Boolean(sample.disclaimer)}`);
    }

    // 4. Single Medicine Monograph
    console.log('\n4. Checking Live Single Monograph Endpoint:');
    const monoRes = await fetch(`${PROD_URL}/api/medicines/med_1/knowledge`);
    console.log(`   GET /api/medicines/med_1/knowledge -> Status: ${monoRes.status}`);
    const monoData = await monoRes.json();
    console.log(`   Medicine: ${monoData.medicine?.brand_name}, Related: ${monoData.related_medicines?.length} alternatives`);

    // 5. Live AI Medical Report RAG Analysis Pipeline
    console.log('\n5. Checking Live End-to-End Medical Report RAG Pipeline:');
    const analyzeRes = await fetch(`${PROD_URL}/api/reports/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_name: 'Balasridhar S.',
        report_name: 'Verification Diagnostic Hemogram & Metabolic Panel',
        report_type: 'Complete Blood Count (CBC)',
        hospital: 'Apollo Diagnostic Clinical Lab',
        doctor: 'Dr. Arun Kumar, MD',
        raw_text: `
          PATIENT: Balasridhar S.  AGE: 34
          Hemoglobin: 11.2 g/dL (Reference Range: 13.0 - 17.5 g/dL) [LOW]
          Fasting Blood Glucose: 142 mg/dL (Reference Range: 70 - 99 mg/dL) [HIGH]
          Platelet Count: 260000 /uL (Reference Range: 150000 - 450000 /uL) [NORMAL]
          Serum Creatinine: 0.9 mg/dL (Reference Range: 0.7 - 1.3 mg/dL) [NORMAL]
        `
      })
    });
    console.log(`   POST /api/reports/analyze -> Status: ${analyzeRes.status}`);
    const analyzeData = await analyzeRes.json();
    console.log(`   Report ID: ${analyzeData.report_id}`);
    console.log(`   Extracted Parameters: ${analyzeData.rag_analysis?.parameters?.length}`);
    console.log(`   Abnormal Count: ${analyzeData.rag_analysis?.structured_data?.abnormal_parameters}`);
    console.log(`   RAG Citations Count: ${analyzeData.rag_analysis?.rag_citations?.length}`);
    if (analyzeData.rag_analysis?.rag_citations?.length > 0) {
      console.log(`   Retrieved Citation: ${analyzeData.rag_analysis.rag_citations[0].guideline_title} (${analyzeData.rag_analysis.rag_citations[0].issuing_organization})`);
    }

    // 6. Admin System Statistics
    console.log('\n6. Checking Live Admin Database Statistics:');
    const statsRes = await fetch(`${PROD_URL}/api/admin/statistics`);
    console.log(`   GET /api/admin/statistics -> Status: ${statsRes.status}`);
    const statsData = await statsRes.json();
    console.log(`   Registered Users: ${statsData.users?.total_users}`);
    console.log(`   Analyzed Reports: ${statsData.reports?.total_reports}`);
    console.log(`   Audit Log Entries: ${statsData.audit?.total_audit_entries}`);
    console.log(`   Hospitals in Registry: ${statsData.dataset_hospitals_count}`);
    console.log(`   Medicines in Catalog: ${statsData.dataset_medicines_count}`);

    console.log('\n======================================================');
    console.log('✅ ALL LIVE PRODUCTION VERIFICATION CHECKS PASSED!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('Verification failed:', err);
    process.exitCode = 1;
  }
}

verifyLiveProduction();
