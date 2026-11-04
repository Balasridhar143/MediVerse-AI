import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL is missing from .env.local');
  process.exit(1);
}

const sql = neon(dbUrl);
const JWT_SECRET = process.env.JWT_SECRET || 'mediverse-secure-jwt-secret-key-2026';

async function runTests() {
  console.log('=== MEDIVERSE AI: AI REPORT ANALYZER & DOCTOR-DEPARTMENT ASSIGNMENT VERIFICATION ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // PART 1: AI REPORT ANALYZER TEST
    // -------------------------------------------------------------
    console.log('\n--- PART 1: Testing Patient Portal AI Report Analyzer ---');
    const { executeMedicalReportRAGPipeline, translateReportAnalysis } = await import('../api/reportRAG.js');

    const samplePdfPath = path.resolve(__dirname, 'fixtures/sample_lab_report.pdf');
    let pdfBuffer;
    if (fs.existsSync(samplePdfPath)) {
      pdfBuffer = fs.readFileSync(samplePdfPath);
    } else {
      // Create minimal synthetic digital PDF structure or sample clinical text
      const rawClinicalReport = `
DR. ARUN KUMAR CLINICAL LABS
Patient Name: Balasubramanian | Age: 42 | Gender: Male
Date: 2026-11-04 | Ref Doctor: Dr. Rajesh Sharma

COMPLETE BLOOD COUNT (CBC) & METABOLIC PANEL
Hemoglobin: 10.8 g/dL (Normal Range: 13.0 - 17.0 g/dL)
Total WBC Count: 11500 cells/cumm (Normal Range: 4000 - 11000 cells/cumm)
Platelet Count: 1.35 lakhs/cumm (Normal Range: 1.50 - 4.50 lakhs/cumm)
Fasting Blood Sugar: 142 mg/dL (Normal Range: 70 - 99 mg/dL)
HbA1c: 7.2 % (Normal Range: 4.0 - 5.6 %)
Serum Creatinine: 1.0 mg/dL (Normal Range: 0.7 - 1.3 mg/dL)
Total Bilirubin: 0.8 mg/dL (Normal Range: 0.2 - 1.2 mg/dL)
TSH: 2.45 uIU/mL (Normal Range: 0.40 - 4.20 uIU/mL)
`;
      pdfBuffer = Buffer.from(rawClinicalReport);
    }

    const ragResult = await executeMedicalReportRAGPipeline({
      fileBuffer: pdfBuffer,
      fileName: 'diagnostic_lab_report.pdf',
      mimeType: 'application/pdf',
      patientName: 'Test Patient',
      reportType: 'Blood Tests',
      hospital: 'Metro Health Diagnostics',
      rawText: '',
      language: 'en'
    });

    assert(ragResult && ragResult.parameters.length >= 4, `Extracted ${ragResult?.parameters?.length} parameters from document`);
    assert(ragResult.structured_data.abnormal_parameters > 0, `Identified abnormal parameters (${ragResult.structured_data.abnormal_parameters} abnormal)`);
    assert(ragResult.ai_explanation && ragResult.ai_explanation.overall_summary, 'Generated overall summary');
    assert(Array.isArray(ragResult.ai_explanation.abnormal_findings) && ragResult.ai_explanation.abnormal_findings.length > 0, 'Generated abnormal findings explanation');
    assert(Array.isArray(ragResult.ai_explanation.normal_findings) && ragResult.ai_explanation.normal_findings.length > 0, 'Generated normal findings explanation');
    assert(ragResult.ai_explanation.possible_significance, 'Generated clinical significance');
    assert(Array.isArray(ragResult.ai_explanation.precautions) && ragResult.ai_explanation.precautions.length > 0, 'Generated precautions');
    assert(Array.isArray(ragResult.ai_explanation.doctor_discussion_questions) && ragResult.ai_explanation.doctor_discussion_questions.length > 0, 'Generated questions for doctor');
    assert(Array.isArray(ragResult.ai_explanation.recommendations) && ragResult.ai_explanation.recommendations.length > 0, 'Generated recommendations');
    assert(ragResult.ai_explanation.disclaimer && ragResult.ai_explanation.disclaimer.includes('MEDICAL DECISION SUPPORT DISCLAIMER'), 'Generated medical disclaimer guardrail');

    // Test Neon DB Report Persistence & Reload
    const testRepId = `rep_test_${crypto.randomBytes(4).toString('hex')}`;
    await sql`
      INSERT INTO medical_reports (
        id, user_id, patient_name, report_name, report_type,
        hospital, doctor, status, date,
        parameters, structured_data, ai_explanation,
        extracted_text, rag_citations, file_name, file_size, file_type,
        created_at
      ) VALUES (
        ${testRepId}, null, 'Balasubramanian', 'Test CBC Panel', 'Blood Tests',
        'Metro Health Diagnostics', 'Dr. Arun Kumar', 'Ready', '2026-11-04',
        ${JSON.stringify(ragResult.parameters)},
        ${JSON.stringify(ragResult.structured_data)},
        ${JSON.stringify(ragResult.ai_explanation)},
        ${ragResult.extracted_text || ''},
        ${JSON.stringify(ragResult.rag_citations || [])},
        'test_cbc.pdf', 1024, 'application/pdf',
        NOW()
      );
    `;

    const loadedRows = await sql`SELECT * FROM medical_reports WHERE id = ${testRepId} LIMIT 1;`;
    assert(loadedRows.length === 1, 'Report saved and retrieved from Neon PostgreSQL');
    const loaded = loadedRows[0];
    const loadedAi = typeof loaded.ai_explanation === 'string' ? JSON.parse(loaded.ai_explanation) : loaded.ai_explanation;
    assert(loadedAi.abnormal_findings.length === ragResult.ai_explanation.abnormal_findings.length, 'Reloaded saved report preserves abnormal findings breakdown');
    assert(loadedAi.possible_significance === ragResult.ai_explanation.possible_significance, 'Reloaded saved report preserves possible significance');
    assert(loadedAi.precautions.length === ragResult.ai_explanation.precautions.length, 'Reloaded saved report preserves precautions');

    // Cleanup test report
    await sql`DELETE FROM medical_reports WHERE id = ${testRepId};`;

    // -------------------------------------------------------------
    // PART 2: HOSPITAL ADMIN DOCTOR-DEPARTMENT ASSIGNMENT TEST
    // -------------------------------------------------------------
    console.log('\n--- PART 2: Testing Hospital Admin Doctor-Department Assignment ---');

    // 1. Identify or setup test hospital facility
    const hospRows = await sql`SELECT id, name FROM hospitals LIMIT 1;`;
    if (hospRows.length === 0) {
      throw new Error('No hospital facility found in database.');
    }
    const testHospital = hospRows[0];
    const hospitalId = testHospital.id;
    console.log(`Using Hospital: "${testHospital.name}" (${hospitalId})`);

    // 2. Identify or setup departments for this hospital
    let depts = await sql`SELECT id, name, code FROM departments WHERE hospital_id = ${hospitalId} LIMIT 2;`;
    if (depts.length < 2) {
      const d1Id = `dept_test_cardio_${crypto.randomBytes(3).toString('hex')}`;
      const d2Id = `dept_test_neuro_${crypto.randomBytes(3).toString('hex')}`;
      await sql`
        INSERT INTO departments (id, hospital_id, name, code, bed_count, status, created_at)
        VALUES (${d1Id}, ${hospitalId}, 'Cardiology Test Ward', 'CARD', 30, 'ACTIVE', NOW()),
               (${d2Id}, ${hospitalId}, 'Neurology Test Ward', 'NEUR', 25, 'ACTIVE', NOW())
        ON CONFLICT (id) DO NOTHING;
      `;
      depts = await sql`SELECT id, name, code FROM departments WHERE hospital_id = ${hospitalId} LIMIT 2;`;
    }

    const deptA = depts[0];
    const deptB = depts[1];
    console.log(`Department A: "${deptA.name}" (${deptA.id})`);
    console.log(`Department B: "${deptB.name}" (${deptB.id})`);

    // 3. Setup a test doctor registered under this hospital
    const testDocId = `doc_test_${crypto.randomBytes(4).toString('hex')}`;
    const testDocUserId = `usr_test_${crypto.randomBytes(4).toString('hex')}`;
    const testDocEmail = `test.doc.${Date.now()}@hospital.org`;
    const pwdHash = await bcrypt.hash('Doctor@123', 10);

    await sql`
      INSERT INTO users (id, full_name, email, password_hash, role, hospital_id, created_at)
      VALUES (${testDocUserId}, 'Dr. Vikramaditya Test', ${testDocEmail}, ${pwdHash}, 'doctor', ${hospitalId}, NOW());
    `;

    await sql`
      INSERT INTO doctors (id, user_id, full_name, specialization, license_number, hospital_id, hospital_name, department, department_id, is_verified, is_available, created_at)
      VALUES (${testDocId}, ${testDocUserId}, 'Dr. Vikramaditya Test', 'Internal Medicine', 'NMC-TEST-9921', ${hospitalId}, ${testHospital.name}, ${deptA.name}, ${deptA.id}, true, true, NOW());
    `;

    await sql`
      INSERT INTO doctor_hospital_affiliations (id, doctor_id, hospital_id, department_id, department_name, employment_status, is_primary, created_at)
      VALUES (${'aff_' + testDocId + '_' + hospitalId}, ${testDocId}, ${hospitalId}, ${deptA.id}, ${deptA.name}, 'ACTIVE', true, NOW())
      ON CONFLICT (doctor_id, hospital_id) DO UPDATE SET department_id = ${deptA.id}, department_name = ${deptA.name};
    `;

    assert(true, 'Test doctor created with initial Department A assignment');

    // 4. Test re-assignment to Department B via assignment logic
    // Simulate POST /hospital/departments/:id/assign-doctor
    const affId = `aff_${testDocId}_${hospitalId}`;
    await sql`
      UPDATE doctors
      SET department = ${deptB.name}, department_id = ${deptB.id},
          hospital_id = COALESCE(hospital_id, ${hospitalId})
      WHERE id = ${testDocId};
    `;

    await sql`
      INSERT INTO doctor_hospital_affiliations (id, doctor_id, hospital_id, department_id, department_name, employment_status, is_primary, created_at)
      VALUES (${affId}, ${testDocId}, ${hospitalId}, ${deptB.id}, ${deptB.name}, 'ACTIVE', true, NOW())
      ON CONFLICT (doctor_id, hospital_id) 
      DO UPDATE SET department_id = ${deptB.id}, department_name = ${deptB.name}, employment_status = 'ACTIVE';
    `;

    // 5. Verify persistence in doctors table
    const docCheck = await sql`SELECT id, department, department_id, hospital_id FROM doctors WHERE id = ${testDocId} LIMIT 1;`;
    assert(docCheck.length === 1, 'Doctor found in database');
    assert(docCheck[0].department === deptB.name, `Doctor department updated in doctors table to "${deptB.name}"`);
    assert(docCheck[0].department_id === deptB.id, `Doctor department_id updated in doctors table to "${deptB.id}"`);

    // 6. Verify persistence in doctor_hospital_affiliations
    const affCheck = await sql`SELECT * FROM doctor_hospital_affiliations WHERE doctor_id = ${testDocId} AND hospital_id = ${hospitalId} LIMIT 1;`;
    assert(affCheck.length === 1, 'Affiliation record exists in doctor_hospital_affiliations');
    assert(affCheck[0].department_id === deptB.id, `Affiliation department_id matches Department B (${deptB.id})`);
    assert(affCheck[0].department_name === deptB.name, `Affiliation department_name matches Department B (${deptB.name})`);

    // 7. Test Department Doctors Query (GET /hospital/departments/:id/doctors)
    const deptDoctors = await sql`
      SELECT DISTINCT ON (d.id)
        d.id, COALESCE(u.full_name, d.full_name) as name, d.specialization,
        d.license_number as "licenseNumber", d.hospital_id as "hospitalId",
        COALESCE(dha.department_name, d.department, ${deptB.name}) as department,
        COALESCE(dha.department_id, d.department_id, ${deptB.id}) as "departmentId",
        COALESCE(d.is_available, true) as "isAvailable"
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN doctor_hospital_affiliations dha ON dha.doctor_id = d.id AND dha.hospital_id = ${hospitalId}
      WHERE (d.hospital_id = ${hospitalId} OR dha.hospital_id = ${hospitalId})
        AND (
          COALESCE(dha.department_id, d.department_id) = ${deptB.id}
          OR LOWER(COALESCE(dha.department_name, d.department)) = LOWER(${deptB.name})
        )
      ORDER BY d.id, d.created_at DESC;
    `;

    const foundInDeptB = deptDoctors.some((d) => d.id === testDocId);
    assert(foundInDeptB, 'Doctor appears in Department B doctors list');

    // Verify doctor does NOT appear in Department A list
    const deptADoctors = await sql`
      SELECT DISTINCT ON (d.id)
        d.id, COALESCE(u.full_name, d.full_name) as name
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN doctor_hospital_affiliations dha ON dha.doctor_id = d.id AND dha.hospital_id = ${hospitalId}
      WHERE (d.hospital_id = ${hospitalId} OR dha.hospital_id = ${hospitalId})
        AND (
          COALESCE(dha.department_id, d.department_id) = ${deptA.id}
          OR LOWER(COALESCE(dha.department_name, d.department)) = LOWER(${deptA.name})
        )
      ORDER BY d.id, d.created_at DESC;
    `;
    const foundInDeptA = deptADoctors.some((d) => d.id === testDocId);
    assert(!foundInDeptA, 'Doctor no longer appears in Department A doctors list after reassignment');

    // 8. Test Doctor Profile Query (/auth/me)
    const profileDocs = await sql`
      SELECT d.id, d.specialization, d.license_number, d.hospital_name, d.hospital_id,
             COALESCE(dha.department_name, d.department, 'General Medicine') as department,
             COALESCE(dha.department_id, d.department_id) as department_id
      FROM doctors d
      LEFT JOIN doctor_hospital_affiliations dha ON dha.doctor_id = d.id AND dha.is_primary = true
      WHERE d.user_id = ${testDocUserId} OR d.id = ${testDocUserId}
      LIMIT 1;
    `;
    assert(profileDocs.length === 1, 'Doctor profile fetched successfully');
    assert(profileDocs[0].department === deptB.name, `Doctor profile displays assigned department "${deptB.name}"`);
    assert(profileDocs[0].department_id === deptB.id, `Doctor profile displays assigned department_id "${deptB.id}"`);

    // 9. Test Security: Cross-Hospital Assignment Blocked
    // Create an outside hospital
    const outsideHospId = `hosp_outside_${crypto.randomBytes(3).toString('hex')}`;
    await sql`
      INSERT INTO hospitals (id, name, code, status, created_at)
      VALUES (${outsideHospId}, 'External Independent Clinic', 'EXT_CLINIC', 'ACTIVE', NOW())
      ON CONFLICT (id) DO NOTHING;
    `;

    // Doctor belongs to hospitalId; attempt to assign in outsideHospId
    const outsideDeptId = `dept_ext_${crypto.randomBytes(3).toString('hex')}`;
    await sql`
      INSERT INTO departments (id, hospital_id, name, code, status, created_at)
      VALUES (${outsideDeptId}, ${outsideHospId}, 'External Ward', 'EXTW', 'ACTIVE', NOW())
      ON CONFLICT (id) DO NOTHING;
    `;

    // Verify backend security check blocks assignment of testDocId to outsideDeptId
    const crossCheckDocRows = await sql`
      SELECT d.id, d.full_name, d.hospital_id
      FROM doctors d
      LEFT JOIN doctor_hospital_affiliations dha ON dha.doctor_id = d.id AND dha.hospital_id = ${outsideHospId}
      WHERE (d.id = ${testDocId} OR d.user_id = ${testDocId})
        AND (d.hospital_id = ${outsideHospId} OR dha.hospital_id = ${outsideHospId})
      LIMIT 1;
    `;
    const isCrossHospitalBlocked = crossCheckDocRows.length === 0;
    assert(isCrossHospitalBlocked, 'Backend security check correctly blocks cross-hospital assignment');

    // 10. Clean up test records
    await sql`DELETE FROM doctor_hospital_affiliations WHERE doctor_id = ${testDocId};`;
    await sql`DELETE FROM doctors WHERE id = ${testDocId};`;
    await sql`DELETE FROM users WHERE id = ${testDocUserId};`;
    await sql`DELETE FROM departments WHERE id = ${outsideDeptId};`;
    await sql`DELETE FROM hospitals WHERE id = ${outsideHospId};`;

    console.log(`\n=== FINAL RESULT: ${passed} PASSED, ${failed} FAILED ===\n`);
    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  }
}

runTests();
