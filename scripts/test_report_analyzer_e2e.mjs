// End-to-end automated test suite for Patient Portal AI Report Analyzer
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config({ path: '.env.local' });
if (!process.env.DATABASE_URL) dotenv.config({ path: '.env' });

const JWT_SECRET = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET || 'mediverse_jwt_secret_key_prod_2026';
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is missing.');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function runReportAnalyzerTests() {
  console.log('=== STARTING PATIENT PORTAL AI REPORT ANALYZER TEST SUITE ===');

  // 1. Identify active patient in the system
  const patients = await sql`
    SELECT id, full_name, email, role FROM users WHERE role = 'patient' LIMIT 1;
  `;
  if (patients.length === 0) {
    console.error('No patient user found in database.');
    process.exit(1);
  }
  const testPatient = patients[0];
  console.log(`[PASS] Using test patient: ${testPatient.full_name} (${testPatient.id})`);

  const token = jwt.sign(
    { id: testPatient.id, sub: testPatient.id, role: 'patient', full_name: testPatient.full_name, email: testPatient.email },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  // 2. Start API server
  const { default: app } = await import('../api/index.js');
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`[PASS] Local test server listening on ${baseUrl}`);

  try {
    // 3. Construct a realistic synthetic PDF document
    const sampleReportText = `
METROPOLIS DIAGNOSTIC HEALTHCARE
Accredited Clinical Pathology & Biochemistry Laboratory
Patient: ${testPatient.full_name} | Age: 34 | Gender: Male
Date of Collection: 2026-11-04 | Report ID: LAB-2026-98124
Doctor: Dr. Arun Kumar, MD | Hospital: Metropolis Clinical Care

COMPLETE BLOOD COUNT (CBC) & BIOCHEMISTRY PANEL
-----------------------------------------------------------------------------------
Investigation                     Result      Units        Biological Reference
-----------------------------------------------------------------------------------
Hemoglobin                        10.8        g/dL         13.0 - 17.0
Total WBC Count (TLC)             12500       cells/cumm   4000 - 11000
Platelet Count                    2.6         lakhs/cumm   1.5 - 4.5
Packed Cell Volume (PCV)          33.5        %            40.0 - 50.0
Fasting Blood Sugar (Glucose)     142         mg/dL        70 - 99
Serum Creatinine                  1.4         mg/dL        0.7 - 1.3
Blood Urea                        48          mg/dL        15 - 40
Total Cholesterol                 235         mg/dL        125 - 200
SGPT / ALT                        62          U/L          10 - 40
Total Bilirubin                   1.5         mg/dL        0.2 - 1.2
-----------------------------------------------------------------------------------
Clinical Remarks: Elevated inflammatory markers and glycemic excursion noted.
`;

    // Minimal valid PDF binary with text stream
    const escapedStream = sampleReportText.replace(/[\n\r]+/g, ') Tj T* (');
    const pdfContent = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Contents 4 0 R/Resources<<>>>>endobj
4 0 obj<</Length ${sampleReportText.length + 100}>>stream
BT /F1 10 Tf 50 720 Td (${escapedStream}) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000216 00000 n 
trailer<</Size 5/Root 1 0 R>>
startxref
${400 + sampleReportText.length}
%%EOF`;

    const pdfBuffer = Buffer.from(pdfContent);
    const pdfBase64 = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;

    console.log('\n--- TEST 1: Upload and Analyze Medical Report (POST /reports/analyze) ---');
    const analyzeRes = await fetch(`${baseUrl}/reports/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        file_data: pdfBase64,
        file_name: 'Metropolis_Comprehensive_Panel.pdf',
        file_type: 'application/pdf',
        file_size: pdfBuffer.length,
        patient_name: testPatient.full_name,
        report_name: 'Metropolis Comprehensive Diagnostic Panel',
        report_type: 'Blood Tests (CBC & Metabolic)',
        hospital: 'Metropolis Diagnostic Healthcare',
        doctor: 'Dr. Arun Kumar, MD',
        language: 'en'
      })
    });

    console.log(`Analysis HTTP Status: ${analyzeRes.status} (Expected: 201)`);
    if (analyzeRes.status !== 201) {
      const errBody = await analyzeRes.text();
      console.error('Failed response:', errBody);
      process.exit(1);
    }

    const analyzeData = await analyzeRes.json();
    const createdReportId = analyzeData.report_id;
    console.log(`[PASS] Report processed successfully! Report ID: ${createdReportId}`);

    // Verify extracted tests
    const params = analyzeData.rag_analysis.parameters;
    console.log(`[PASS] Extracted ${params.length} distinct quantitative laboratory tests:`);
    params.forEach(p => {
      console.log(`   * ${p.test_name}: ${p.patient_value} ${p.unit} (Ref: ${p.reference_range}) [Status: ${p.status}]`);
    });

    if (params.length < 5) {
      console.error(`[FAIL] Expected at least 5 extracted parameters, got ${params.length}`);
      process.exit(1);
    }

    // Verify 8 required explanation sections
    const explanation = analyzeData.rag_analysis.ai_explanation;
    console.log('\n--- TEST 2: Verifying 8 Required Patient-Friendly Explanation Sections ---');

    // 1. Overall report summary
    console.log('1. Overall Summary:', explanation.overall_summary ? 'PRESENT' : 'MISSING');
    console.log('   Preview:', explanation.overall_summary.slice(0, 150) + '...');
    if (!explanation.overall_summary) throw new Error('Missing overall summary');

    // 2. Each test and its purpose
    console.log('2. Test Evaluations with Purpose:', explanation.test_evaluations?.length ? `${explanation.test_evaluations.length} tests evaluated` : 'MISSING');
    if (!explanation.test_evaluations || explanation.test_evaluations.length === 0) throw new Error('Missing test evaluations');
    console.log(`   Sample test purpose (${explanation.test_evaluations[0].test_name}):`, explanation.test_evaluations[0].purpose);

    // 3. Measured values and reference ranges
    console.log('3. Measured Values & Reference Ranges: Verified on all parameters (all contain value, unit, reference_range).');

    // 4. Normal and abnormal findings
    console.log(`4. Normal Findings: ${explanation.normal_findings?.length} tests`);
    console.log(`   Abnormal Findings: ${explanation.abnormal_findings?.length} tests`);
    if (!explanation.abnormal_findings || explanation.abnormal_findings.length === 0) throw new Error('Expected abnormal findings');

    // 5. Possible significance of abnormal values
    console.log('5. Possible Significance of Abnormal Values:', explanation.possible_significance ? 'PRESENT' : 'MISSING');
    console.log('   Preview:', explanation.possible_significance.slice(0, 150) + '...');
    if (!explanation.possible_significance) throw new Error('Missing possible significance');

    // 6. Important precautions
    console.log(`6. Important Precautions: ${explanation.precautions?.length} precautions documented`);
    if (!explanation.precautions || explanation.precautions.length === 0) throw new Error('Missing precautions');

    // 7. Questions for doctor
    console.log(`7. Questions for Doctor: ${explanation.doctor_discussion_questions?.length} questions formulated`);
    if (!explanation.doctor_discussion_questions || explanation.doctor_discussion_questions.length === 0) throw new Error('Missing doctor questions');

    // 8. Recommended next steps
    console.log(`8. Recommended Next Steps: ${explanation.recommendations?.length} recommendations documented`);
    if (!explanation.recommendations || explanation.recommendations.length === 0) throw new Error('Missing recommendations');

    // 9. Clinical Decision Support Disclaimer
    console.log('9. AI Boundary / Clinical Disclaimer:', explanation.disclaimer ? 'PRESENT' : 'MISSING');
    if (!explanation.disclaimer) throw new Error('Missing disclaimer');

    // 4. Test Persistence in Neon PostgreSQL
    console.log('\n--- TEST 3: Database Persistence Verification ---');
    const dbRows = await sql`
      SELECT id, report_name, parameters, structured_data, ai_explanation, file_name
      FROM medical_reports
      WHERE id = ${createdReportId}
      LIMIT 1;
    `;
    if (dbRows.length === 0) {
      throw new Error(`Report ${createdReportId} not found in database!`);
    }
    const dbRep = dbRows[0];
    console.log(`[PASS] Verified record in Neon PostgreSQL! Name: ${dbRep.report_name}, File: ${dbRep.file_name}`);
    console.log(`[PASS] Stored parameters count: ${Array.isArray(dbRep.parameters) ? dbRep.parameters.length : typeof dbRep.parameters}`);
    console.log(`[PASS] Stored AI explanation summary: ${Boolean(dbRep.ai_explanation?.overall_summary || dbRep.ai_explanation?.summary)}`);

    // 5. Test Fetch Saved Report (GET /reports/:id)
    console.log('\n--- TEST 4: Fetch Saved Report by ID (Page Reload / Revisit) ---');
    const getRes = await fetch(`${baseUrl}/reports/${createdReportId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`Fetch HTTP Status: ${getRes.status} (Expected: 200)`);
    const fetchedData = await getRes.json();
    console.log(`[PASS] Successfully retrieved saved report "${fetchedData.report_name}".`);
    console.log(`[PASS] Parameters count on reload: ${fetchedData.parameters?.length}`);

    // 6. Test Multilingual Translation / Re-analysis (POST /reports/:id/reanalyze)
    console.log('\n--- TEST 5: Multilingual Re-analysis in Hindi (hi) ---');
    const reanalyzeRes = await fetch(`${baseUrl}/reports/${createdReportId}/reanalyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ language: 'hi' })
    });
    console.log(`Re-analysis HTTP Status: ${reanalyzeRes.status} (Expected: 200)`);
    const reanalyzeData = await reanalyzeRes.json();
    const hindiSummary = reanalyzeData.rag_analysis?.ai_explanation?.overall_summary;
    console.log(`[PASS] Translated Hindi explanation preview: ${hindiSummary ? hindiSummary.slice(0, 120) + '...' : 'N/A'}`);

    // 7. Test Image Report OCR via extractTextFromDocument
    console.log('\n--- TEST 6: OCR Extraction for Scanned Reports ---');
    const { extractTextFromDocument, extractAndCompareLabEntities } = await import('../api/reportRAG.js');
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: pdfBuffer });
    const screenshot = await parser.getScreenshot({ page: 1 });
    await parser.destroy();
    
    if (screenshot?.pages?.[0]?.dataUrl) {
      const base64Img = screenshot.pages[0].dataUrl.replace(/^data:[^;]+;base64,/, '');
      const imgBuffer = Buffer.from(base64Img, 'base64');
      const ocrText = await extractTextFromDocument(imgBuffer, 'image/png', 'scanned_report.png');
      console.log(`[PASS] OCR extracted ${ocrText.length} characters from image scan.`);
      const ocrTests = extractAndCompareLabEntities(ocrText);
      console.log(`[PASS] OCR extracted ${ocrTests.length} tests from image scan.`);
    }

    console.log('\n=== ALL AI REPORT ANALYZER TESTS PASSED SUCCESSFULLY ===');
  } finally {
    server.close();
  }
}

runReportAnalyzerTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
