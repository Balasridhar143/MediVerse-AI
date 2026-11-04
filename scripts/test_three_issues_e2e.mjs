import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { neon } from '@neondatabase/serverless';
import FormData from 'form-data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL is missing from .env.local');
  process.exit(1);
}

const sql = neon(dbUrl);
const JWT_SECRET = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET || 'mediverse_jwt_secret_key_prod_2026';

async function main() {
  console.log('=== MEDIVERSE AI: END-TO-END VERIFICATION OF 3 CRITICAL ISSUES ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Setup express app server for live API testing
  const { default: app } = await import('../api/index.js');
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Test API Server running on ${baseUrl}\n`);

  try {
    // -----------------------------------------------------------------
    // SETUP TEST PATIENT & TOKENS
    // -----------------------------------------------------------------
    const testPatientId = `usr_test_pat_${Date.now()}`;
    const testPatientEmail = `anita.${Date.now()}@test.org`;
    await sql`
      INSERT INTO users (id, full_name, email, password_hash, role, created_at)
      VALUES (${testPatientId}, 'Anita Roy', ${testPatientEmail}, 'dummy_hash', 'patient', NOW())
      ON CONFLICT (id) DO NOTHING;
    `;

    const patientToken = jwt.sign(
      { sub: testPatientId, id: testPatientId, full_name: 'Anita Roy', role: 'patient', email: testPatientEmail },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // =================================================================
    // ISSUE 1: MEDICAL REPORTS UPLOAD WITH MULTIPART/FORM-DATA
    // =================================================================
    console.log('--- ISSUE 1: Testing Medical Reports Multipart Upload & Storage ---');

    // Prepare synthetic test files
    const dummyPdfContent = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >> endobj
4 0 obj << /Length 300 >>
stream
BT
/F1 12 Tf
72 712 Td (CITY HEALTH DIAGNOSTIC LABS) Tj
0 -20 Td (Patient: Anita Roy | Age: 36 | Gender: Female) Tj
0 -20 Td (Hemoglobin: 11.4 g/dL  Ref: 12.0 - 15.5 g/dL) Tj
0 -20 Td (Total WBC: 6800 cells/cumm  Ref: 4000 - 11000 cells/cumm) Tj
0 -20 Td (Platelet Count: 2.4 lakhs/cumm  Ref: 1.5 - 4.5 lakhs/cumm) Tj
0 -20 Td (Fasting Glucose: 135 mg/dL  Ref: 70 - 100 mg/dL) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000216 00000 n 
trailer << /Size 5 /Root 1 0 R >>
startxref
570
%%EOF`;

    const dummyPdfBuffer = Buffer.from(dummyPdfContent);

    // 1.1 Upload PDF via multipart/form-data
    const formPdf = new FormData();
    formPdf.append('file', dummyPdfBuffer, {
      filename: 'Anita_Roy_CBC_Report.pdf',
      contentType: 'application/pdf',
    });
    formPdf.append('report_name', 'Comprehensive Hemogram');
    formPdf.append('report_type', 'Blood Tests');
    formPdf.append('hospital', 'City Health Diagnostic Labs');
    formPdf.append('doctor', 'Dr. Arun Kumar');

    const uploadRes = await axios.post(`${baseUrl}/reports/upload`, formPdf, {
      headers: {
        ...formPdf.getHeaders(),
        Authorization: `Bearer ${patientToken}`,
      },
      timeout: 120000,
    });

    assert(uploadRes.status === 201, 'PDF report uploaded via multipart/form-data (HTTP 201)');
    assert(uploadRes.data.success === true, 'Upload response indicates success');
    const createdReportId = uploadRes.data.report_id || uploadRes.data.id;
    assert(Boolean(createdReportId), `Report record created with ID: ${createdReportId}`);

    // 1.2 Verify persistence in database
    const dbRows = await sql`
      SELECT id, user_id, patient_name, report_name, report_type, hospital, file_name, file_size, file_type, file_data, file_location
      FROM medical_reports
      WHERE id = ${createdReportId}
      LIMIT 1;
    `;
    assert(dbRows.length === 1, 'Report verified in Neon PostgreSQL medical_reports table');
    assert(dbRows[0].user_id === testPatientId, 'Report correctly associated with authenticated patient ID');
    assert(dbRows[0].report_name === 'Comprehensive Hemogram', 'Report metadata name stored accurately');
    assert(dbRows[0].hospital === 'City Health Diagnostic Labs', 'Hospital facility stored accurately');
    assert(dbRows[0].file_type === 'application/pdf', 'File MIME type stored accurately');
    assert(Boolean(dbRows[0].file_data), 'File binary dataUrl preserved in database');
    assert(dbRows[0].file_location && fs.existsSync(dbRows[0].file_location), 'File preserved in storage architecture on disk');

    // 1.3 Upload PNG image via multipart/form-data
    // Minimal 1x1 PNG buffer
    const pngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    const formPng = new FormData();
    formPng.append('file', pngBuffer, {
      filename: 'Lab_Scan_Sample.png',
      contentType: 'image/png',
    });
    formPng.append('report_name', 'Lab Scan Imaging');
    formPng.append('report_type', 'Imaging');
    formPng.append('hospital', 'Metro Imaging Center');

    const uploadPngRes = await axios.post(`${baseUrl}/reports/upload`, formPng, {
      headers: {
        ...formPng.getHeaders(),
        Authorization: `Bearer ${patientToken}`,
      },
      timeout: 120000,
    });
    assert(uploadPngRes.status === 201, 'PNG report uploaded via multipart/form-data (HTTP 201)');
    const createdPngId = uploadPngRes.data.report_id || uploadPngRes.data.id;

    // 1.4 Retrieve patient's actual uploaded reports via GET /reports
    const listRes = await axios.get(`${baseUrl}/reports`, {
      headers: { Authorization: `Bearer ${patientToken}` },
    });
    assert(listRes.status === 200, 'GET /reports succeeded for authenticated patient');
    const patientReports = listRes.data;
    const hasPdfReport = patientReports.some((r) => r.id === createdReportId);
    const hasPngReport = patientReports.some((r) => r.id === createdPngId);
    assert(hasPdfReport, 'Patient report list includes newly uploaded PDF');
    assert(hasPngReport, 'Patient report list includes newly uploaded PNG');

    // 1.5 Download uploaded file via GET /reports/:id/download
    const downloadRes = await axios.get(`${baseUrl}/reports/${createdReportId}/download`, {
      headers: { Authorization: `Bearer ${patientToken}` },
      responseType: 'arraybuffer',
    });
    assert(downloadRes.status === 200, 'GET /reports/:id/download succeeded');
    assert(downloadRes.headers['content-type'] === 'application/pdf', 'Download returns correct application/pdf content-type');
    assert(downloadRes.data.length > 0, 'Download returns non-empty file buffer');

    // 1.6 Verify validation: rejected invalid file format
    try {
      const invalidForm = new FormData();
      invalidForm.append('file', Buffer.from('echo malware'), {
        filename: 'script.exe',
        contentType: 'application/x-msdownload',
      });
      await axios.post(`${baseUrl}/reports/upload`, invalidForm, {
        headers: {
          ...invalidForm.getHeaders(),
          Authorization: `Bearer ${patientToken}`,
        },
      });
      assert(false, 'Invalid file format (.exe) should be rejected');
    } catch (err) {
      assert(err.response?.status === 400, 'Invalid file format correctly rejected with HTTP 400');
    }

    // =================================================================
    // ISSUE 2: AI REPORT ANALYZER TIMEOUT & 10-SECTION EXPLANATION
    // =================================================================
    console.log('\n--- ISSUE 2: Testing AI Report Analyzer & Long-Running Processing ---');

    // 2.1 Send document for analysis with 120s timeout capability
    const analyzePayload = {
      patient_name: 'Anita Roy',
      report_name: 'Metabolic & Hematology Panel',
      report_type: 'Blood Tests',
      hospital: 'Apex Diagnostic Hospital',
      doctor: 'Dr. Arun Kumar',
      file_name: 'Apex_Hematology.pdf',
      file_type: 'application/pdf',
      file_data: `data:application/pdf;base64,${dummyPdfBuffer.toString('base64')}`,
    };

    const analyzeStartTime = Date.now();
    const analyzeRes = await axios.post(`${baseUrl}/reports/analyze`, analyzePayload, {
      headers: {
        Authorization: `Bearer ${patientToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 120000, // Configured for 2-minute clinical document processing
    });
    const analyzeDuration = Date.now() - analyzeStartTime;

    assert(analyzeRes.status === 201, `Report analyzed successfully in ${analyzeDuration}ms (HTTP 201)`);
    assert(analyzeRes.data.rag_analysis !== undefined, 'RAG analysis payload returned');
    const rag = analyzeRes.data.rag_analysis;

    // 2.2 Verify extracted test parameters, values, units & ranges
    assert(Array.isArray(rag.parameters) && rag.parameters.length >= 3, `Extracted ${rag.parameters?.length} lab parameters`);
    const hgb = rag.parameters.find((p) => p.test_name.toLowerCase().includes('hemoglobin'));
    assert(Boolean(hgb), 'Identified test name: Hemoglobin');
    if (hgb) {
      assert(hgb.patient_value !== undefined, `Extracted measured value: ${hgb.patient_value}`);
      assert(Boolean(hgb.unit), `Extracted unit: ${hgb.unit}`);
      assert(Boolean(hgb.reference_range), `Extracted reference range: ${hgb.reference_range}`);
    }

    // 2.3 Verify 10-Part Explanation Structure
    const exp = rag.ai_explanation;
    assert(Boolean(exp.overall_summary), '1. Overall Report Summary present');
    assert(Array.isArray(exp.test_evaluations) && exp.test_evaluations.length > 0, '2. Identified Medical Tests list present');
    assert(Boolean(exp.test_evaluations[0]?.purpose), '3. Test purpose explained');
    assert(Boolean(exp.test_evaluations[0]?.observed_value), '4. Measured values and units included');
    assert(Boolean(exp.test_evaluations[0]?.reference_range), '5. Reference intervals included');
    assert(Array.isArray(exp.normal_findings), '6a. Normal findings documented');
    assert(Array.isArray(exp.abnormal_findings), '6b. Out-of-range findings documented');
    assert(Boolean(exp.possible_significance), '7. Clinical significance of abnormal values explained');
    assert(Array.isArray(exp.precautions) && exp.precautions.length > 0, '8. Patient precautions provided');
    assert(Array.isArray(exp.doctor_discussion_questions) && exp.doctor_discussion_questions.length > 0, '9. Doctor discussion questions formulated');
    assert(Array.isArray(exp.recommendations) && exp.recommendations.length > 0, '10. Suggested next steps provided');
    assert(Boolean(exp.disclaimer), 'Clinical decision support disclaimer guardrail present');

    // 2.4 Verify persistence & reloading by ID (GET /reports/:id)
    const analyzedReportId = analyzeRes.data.report_id || analyzeRes.data.id;
    const fetchSavedRes = await axios.get(`${baseUrl}/reports/${analyzedReportId}`, {
      headers: { Authorization: `Bearer ${patientToken}` },
    });
    assert(fetchSavedRes.status === 200, 'GET /reports/:id retrieved saved analysis');
    const savedRep = fetchSavedRes.data;
    assert(savedRep.parameters.length === rag.parameters.length, 'Reloaded saved report preserves full parameter list');
    assert(Boolean(savedRep.ai_explanation.overall_summary), 'Reloaded saved report preserves overall explanation');
    assert(savedRep.ai_explanation.precautions.length === exp.precautions.length, 'Reloaded saved report preserves precautions');

    // =================================================================
    // ISSUE 3: HOSPITAL ADMIN DOCTOR-DEPARTMENT ASSIGNMENT
    // =================================================================
    console.log('\n--- ISSUE 3: Testing Hospital Admin Doctor-Department Assignment ---');

    // 3.1 Setup Hospital & Admin
    const hospRows = await sql`SELECT id, name FROM hospitals LIMIT 1;`;
    if (hospRows.length === 0) {
      throw new Error('No hospital facility found in database.');
    }
    const hospital = hospRows[0];
    const hospitalId = hospital.id;

    const adminUserId = `usr_test_hosp_admin_${Date.now()}`;
    await sql`
      INSERT INTO users (id, full_name, email, password_hash, role, hospital_id, created_at)
      VALUES (${adminUserId}, 'Dr. Administrator', ${'admin.' + Date.now() + '@hospital.org'}, 'dummy_hash', 'hospital_admin', ${hospitalId}, NOW())
      ON CONFLICT (id) DO NOTHING;
    `;
    const adminToken = jwt.sign(
      { sub: adminUserId, id: adminUserId, role: 'hospital_admin', hospital_id: hospitalId, full_name: 'Dr. Administrator' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 3.2 Ensure two departments exist in this hospital
    let hospitalDepts = await sql`SELECT id, name FROM departments WHERE hospital_id = ${hospitalId} LIMIT 2;`;
    if (hospitalDepts.length < 2) {
      const d1 = `dept_test_gastro_${Date.now()}`;
      const d2 = `dept_test_pulmo_${Date.now()}`;
      await sql`
        INSERT INTO departments (id, hospital_id, name, code, bed_count, status, created_at)
        VALUES (${d1}, ${hospitalId}, 'Gastroenterology Unit', 'GAST', 20, 'ACTIVE', NOW()),
               (${d2}, ${hospitalId}, 'Pulmonology Unit', 'PULM', 20, 'ACTIVE', NOW());
      `;
      hospitalDepts = await sql`SELECT id, name FROM departments WHERE hospital_id = ${hospitalId} LIMIT 2;`;
    }
    const dept1 = hospitalDepts[0];
    const dept2 = hospitalDepts[1];
    console.log(`Hospital: "${hospital.name}"`);
    console.log(`Department 1: "${dept1.name}" (${dept1.id})`);
    console.log(`Department 2: "${dept2.name}" (${dept2.id})`);

    // 3.3 Register a doctor under this hospital
    const testDocId = `doc_assign_test_${Date.now()}`;
    const testDocUserId = `usr_doc_assign_${Date.now()}`;
    await sql`
      INSERT INTO users (id, full_name, email, password_hash, role, hospital_id, created_at)
      VALUES (${testDocUserId}, 'Dr. Rajesh Deshmukh', ${'rajesh.' + Date.now() + '@hospital.org'}, 'hash', 'doctor', ${hospitalId}, NOW());
    `;
    await sql`
      INSERT INTO doctors (id, user_id, full_name, specialization, license_number, hospital_id, hospital_name, department, department_id, is_verified, is_available, created_at)
      VALUES (${testDocId}, ${testDocUserId}, 'Dr. Rajesh Deshmukh', 'Pulmonology', 'NMC-2026-8871', ${hospitalId}, ${hospital.name}, ${dept1.name}, ${dept1.id}, true, true, NOW());
    `;
    await sql`
      INSERT INTO doctor_hospital_affiliations (id, doctor_id, hospital_id, department_id, department_name, employment_status, is_primary, created_at)
      VALUES (${'aff_' + testDocId + '_' + hospitalId}, ${testDocId}, ${hospitalId}, ${dept1.id}, ${dept1.name}, 'ACTIVE', true, NOW())
      ON CONFLICT (doctor_id, hospital_id) DO UPDATE SET department_id = ${dept1.id}, department_name = ${dept1.name};
    `;

    // 3.4 Assign Doctor to Department 2 via POST /hospital/departments/:id/assign-doctor
    const assignRes = await axios.post(
      `${baseUrl}/hospital/departments/${dept2.id}/assign-doctor`,
      { doctorId: testDocId },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(assignRes.status === 200, 'Assigned doctor to Department 2 via POST /hospital/departments/:id/assign-doctor');
    assert(assignRes.data.success === true, 'Assignment response confirmed success');
    assert(assignRes.data.doctor.departmentId === dept2.id, 'Assigned department ID matches Department 2');

    // 3.5 Verify persistence in doctors table
    const docDb = await sql`SELECT department, department_id FROM doctors WHERE id = ${testDocId} LIMIT 1;`;
    assert(docDb[0].department === dept2.name, `doctors.department updated to "${dept2.name}"`);
    assert(docDb[0].department_id === dept2.id, `doctors.department_id updated to "${dept2.id}"`);

    // 3.6 Verify persistence in doctor_hospital_affiliations table
    const affDb = await sql`SELECT department_id, department_name FROM doctor_hospital_affiliations WHERE doctor_id = ${testDocId} AND hospital_id = ${hospitalId} LIMIT 1;`;
    assert(affDb[0].department_id === dept2.id, `affiliations.department_id updated to "${dept2.id}"`);
    assert(affDb[0].department_name === dept2.name, `affiliations.department_name updated to "${dept2.name}"`);

    // 3.7 Verify Department Doctors listing displays the doctor
    const dept2DocsRes = await axios.get(`${baseUrl}/hospital/departments/${dept2.id}/doctors`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(dept2DocsRes.status === 200, 'GET /hospital/departments/:id/doctors succeeded');
    const dept2Docs = dept2DocsRes.data;
    const isDocInDept2 = dept2Docs.some((d) => d.id === testDocId);
    assert(isDocInDept2, 'Assigned doctor appears in Department 2 clinicians list');

    // 3.8 Verify Doctor does NOT appear in Department 1 listing
    const dept1DocsRes = await axios.get(`${baseUrl}/hospital/departments/${dept1.id}/doctors`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const isDocInDept1 = dept1DocsRes.data.some((d) => d.id === testDocId);
    assert(!isDocInDept1, 'Doctor is not listed in Department 1 after reassignment');

    // 3.9 Update doctor's department via PUT /hospital/doctors/:id
    const updateDocRes = await axios.put(
      `${baseUrl}/hospital/doctors/${testDocId}`,
      { departmentId: dept1.id, department: dept1.name, specialization: 'Pulmonology' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(updateDocRes.status === 200, 'Updated doctor department via PUT /hospital/doctors/:id');
    const docDbRe = await sql`SELECT department, department_id FROM doctors WHERE id = ${testDocId} LIMIT 1;`;
    assert(docDbRe[0].department_id === dept1.id, 'Doctor department reassigned back to Department 1');

    // 3.10 Security: Block cross-hospital assignment (HTTP 403)
    const foreignHospitalId = `hosp_foreign_${Date.now()}`;
    const foreignDeptId = `dept_foreign_${Date.now()}`;
    await sql`
      INSERT INTO hospitals (id, name, code, status, created_at)
      VALUES (${foreignHospitalId}, 'Foreign Clinic Facility', 'FOR_CLINIC', 'ACTIVE', NOW());
    `;
    await sql`
      INSERT INTO departments (id, hospital_id, name, code, status, created_at)
      VALUES (${foreignDeptId}, ${foreignHospitalId}, 'Foreign Ward', 'FWRD', 'ACTIVE', NOW());
    `;

    const foreignAdminUserId = `usr_foreign_admin_${Date.now()}`;
    await sql`
      INSERT INTO users (id, full_name, email, password_hash, role, hospital_id, created_at)
      VALUES (${foreignAdminUserId}, 'Foreign Administrator', ${'foreign.' + Date.now() + '@foreign.org'}, 'dummy_hash', 'hospital_admin', ${foreignHospitalId}, NOW())
      ON CONFLICT (id) DO NOTHING;
    `;

    try {
      const foreignAdminToken = jwt.sign(
        { sub: foreignAdminUserId, id: foreignAdminUserId, role: 'hospital_admin', hospital_id: foreignHospitalId },
        JWT_SECRET,
        { expiresIn: '1h' }
      );
      await axios.post(
        `${baseUrl}/hospital/departments/${foreignDeptId}/assign-doctor`,
        { doctorId: testDocId },
        { headers: { Authorization: `Bearer ${foreignAdminToken}` } }
      );
      assert(false, 'Cross-hospital assignment should be forbidden');
    } catch (err) {
      assert(err.response?.status === 403, 'Cross-hospital assignment correctly blocked with HTTP 403 Forbidden');
    }

    // Cleanup test records
    await sql`DELETE FROM doctor_hospital_affiliations WHERE doctor_id = ${testDocId};`;
    await sql`DELETE FROM doctors WHERE id = ${testDocId};`;
    await sql`DELETE FROM users WHERE id = ${testDocUserId};`;
    await sql`DELETE FROM users WHERE id = ${foreignAdminUserId};`;
    await sql`DELETE FROM departments WHERE id = ${foreignDeptId};`;
    await sql`DELETE FROM hospitals WHERE id = ${foreignHospitalId};`;
    await sql`DELETE FROM medical_reports WHERE user_id = ${testPatientId};`;

    console.log(`\n=== FINAL COMPREHENSIVE RESULT: ${passed} PASSED, ${failed} FAILED ===\n`);
    server.close();
    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test error:', err.response?.data || err.message);
    server.close();
    process.exit(1);
  }
}

main();

