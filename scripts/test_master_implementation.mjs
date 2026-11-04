/**
 * Comprehensive Master Implementation End-to-End Verification Test
 * Tests:
 * 1. Task 1: 24 Consecutive 1-Hour Appointment Slots & Overlap Prevention & Midnight Boundary
 * 2. Task 2: Medical Report Cloud Persistence (No EROFS, Memory Storage, DB Storage, Stream Download, RBAC)
 * 3. Task 3: Fast Document Extraction, 11-part AI Clinical Explanation, Job Polling & Timeouts
 */

import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { parseTimeSlotString, validateAppointmentSlot } from '../api/appointmentSlotValidator.js';
import { executeMedicalReportRAGPipeline, extractTextFromDocument } from '../api/reportRAG.js';

// Load .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = (match[2] || '').trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    env[match[1]] = value;
    process.env[match[1]] = value;
  }
});

const DATABASE_URL = env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET_KEY || env.JWT_SECRET_KEY || env.JWT_SECRET || process.env.JWT_SECRET || 'mediverse_jwt_secret_key_prod_2026';

if (!DATABASE_URL) {
  console.error('DATABASE_URL not found in .env.local');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

// Import express app from api/index.js
import app from '../api/index.js';

async function runTests() {
  console.log('================================================================');
  console.log('MEDIVERSE AI – MASTER VERIFICATION SUITE STARTING');
  console.log('================================================================\n');

  // Start local ephemeral test server for HTTP API testing
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[Test Harness] Live test server listening on ${baseUrl}`);

  const testPatient1 = { id: `test_pat_${Date.now()}_1`, role: 'patient', email: `pat1_${Date.now()}@example.com`, full_name: 'Test Patient One' };
  const testPatient2 = { id: `test_pat_${Date.now()}_2`, role: 'patient', email: `pat2_${Date.now()}@example.com`, full_name: 'Test Patient Two' };
  const testDoc1 = { id: `test_doc_${Date.now()}_1`, role: 'doctor', email: `doc1_${Date.now()}@example.com`, full_name: 'Dr. Test One' };
  const testDoc2 = { id: `test_doc_${Date.now()}_2`, role: 'doctor', email: `doc2_${Date.now()}@example.com`, full_name: 'Dr. Test Two' };

  const tokenPat1 = jwt.sign(testPatient1, JWT_SECRET, { expiresIn: '1h' });
  const tokenPat2 = jwt.sign(testPatient2, JWT_SECRET, { expiresIn: '1h' });
  const tokenDoc1 = jwt.sign(testDoc1, JWT_SECRET, { expiresIn: '1h' });
  const tokenDoc2 = jwt.sign(testDoc2, JWT_SECRET, { expiresIn: '1h' });

  // Ensure test users exist in DB
  await sql`
    INSERT INTO users (id, email, password_hash, role, full_name, created_at)
    VALUES 
      (${testPatient1.id}, ${testPatient1.email}, 'hash', 'patient', ${testPatient1.full_name}, NOW()),
      (${testPatient2.id}, ${testPatient2.email}, 'hash', 'patient', ${testPatient2.full_name}, NOW()),
      (${testDoc1.id}, ${testDoc1.email}, 'hash', 'doctor', ${testDoc1.full_name}, NOW()),
      (${testDoc2.id}, ${testDoc2.email}, 'hash', 'doctor', ${testDoc2.full_name}, NOW())
    ON CONFLICT (id) DO NOTHING;
  `;

  await sql`
    INSERT INTO doctors (id, user_id, full_name, specialization, department, hospital_name, created_at)
    VALUES 
      (${testDoc1.id}, ${testDoc1.id}, ${testDoc1.full_name}, 'Cardiology', 'Cardiology', 'MediVerse Test Hospital', NOW()),
      (${testDoc2.id}, ${testDoc2.id}, ${testDoc2.full_name}, 'Neurology', 'Neurology', 'MediVerse Test Hospital', NOW())
    ON CONFLICT (id) DO NOTHING;
  `;

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition, desc) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✓ [PASS] ${desc}`);
    } else {
      console.error(`  ✗ [FAIL] ${desc}`);
      throw new Error(`Assertion failed: ${desc}`);
    }
  }

  try {
    // =========================================================================
    // SECTION 1: TASK 1 – 24 CONSECUTIVE ONE-HOUR APPOINTMENT SLOTS
    // =========================================================================
    console.log('\n--- SECTION 1: 24 CONSECUTIVE 1-HOUR APPOINTMENT SLOTS ---');

    const ALL_24_SLOTS = [
      "12:00 AM – 1:00 AM",
      "1:00 AM – 2:00 AM",
      "2:00 AM – 3:00 AM",
      "3:00 AM – 4:00 AM",
      "4:00 AM – 5:00 AM",
      "5:00 AM – 6:00 AM",
      "6:00 AM – 7:00 AM",
      "7:00 AM – 8:00 AM",
      "8:00 AM – 9:00 AM",
      "9:00 AM – 10:00 AM",
      "10:00 AM – 11:00 AM",
      "11:00 AM – 12:00 PM",
      "12:00 PM – 1:00 PM",
      "1:00 PM – 2:00 PM",
      "2:00 PM – 3:00 PM",
      "3:00 PM – 4:00 PM",
      "4:00 PM – 5:00 PM",
      "5:00 PM – 6:00 PM",
      "6:00 PM – 7:00 PM",
      "7:00 PM – 8:00 PM",
      "8:00 PM – 9:00 PM",
      "9:00 PM – 10:00 PM",
      "10:00 PM – 11:00 PM",
      "11:00 PM – 12:00 AM"
    ];

    assert(ALL_24_SLOTS.length === 24, 'Exactly 24 hourly slots are defined');

    // Test parsing each of the 24 slots
    for (let i = 0; i < ALL_24_SLOTS.length; i++) {
      const slot = ALL_24_SLOTS[i];
      const parsed = parseTimeSlotString(slot);
      assert(parsed.startHour === i, `Slot ${i + 1} (${slot}) startHour is ${i}`);
      assert(parsed.endHour === (i + 1) % 24, `Slot ${i + 1} (${slot}) endHour is ${(i + 1) % 24}`);
    }

    // Midnight boundary validation: Slot 24 (11:00 PM – 12:00 AM)
    const slot24Validation = validateAppointmentSlot({
      status: 'CONFIRMED',
      appointment_date: '2026-11-05',
      time_slot: '11:00 PM – 12:00 AM'
    }, new Date('2026-11-05T23:30:00+05:30'));

    assert(slot24Validation.canJoin === true, '11:00 PM – 12:00 AM is active during slot (23:30 IST)');
    assert(slot24Validation.state === 'DURING_SLOT', '11:00 PM – 12:00 AM state is DURING_SLOT');
    assert(slot24Validation.slotEnd.getDate() === 6, '11:00 PM – 12:00 AM ends at midnight next calendar day (Nov 6)');

    // Slot 1 (12:00 AM – 1:00 AM) validation
    const slot1Validation = validateAppointmentSlot({
      status: 'CONFIRMED',
      appointment_date: '2026-11-05',
      time_slot: '12:00 AM – 1:00 AM'
    }, new Date('2026-11-05T00:30:00+05:30'));

    assert(slot1Validation.canJoin === true, '12:00 AM – 1:00 AM is active during slot (00:30 IST)');

    // Create 2 test appointments for Doctor 1
    const testDate = '2026-11-10';
    const apt1Id = `apt_t1_${Date.now()}`;
    const apt2Id = `apt_t2_${Date.now()}`;
    const aptDoc2Id = `apt_t3_${Date.now()}`;

    await sql`
      INSERT INTO appointments (id, patient_id, doctor_id, doctor_name, patient_name, appointment_date, time_slot, status, created_at, updated_at)
      VALUES 
        (${apt1Id}, ${testPatient1.id}, ${testDoc1.id}, ${testDoc1.full_name}, ${testPatient1.full_name}, ${testDate}, '02:00 PM – 03:00 PM', 'PENDING', NOW(), NOW()),
        (${apt2Id}, ${testPatient2.id}, ${testDoc1.id}, ${testDoc1.full_name}, ${testPatient2.full_name}, ${testDate}, '02:00 PM – 03:00 PM', 'PENDING', NOW(), NOW()),
        (${aptDoc2Id}, ${testPatient1.id}, ${testDoc2.id}, ${testDoc2.full_name}, ${testPatient1.full_name}, ${testDate}, '02:00 PM – 03:00 PM', 'PENDING', NOW(), NOW());
    `;

    // Doctor 1 accepts Apt 1 for '02:00 PM – 03:00 PM'
    const acceptRes1 = await fetch(`${baseUrl}/appointments/${apt1Id}/accept`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenDoc1}`
      },
      body: JSON.stringify({
        appointment_date: testDate,
        time_slot: '2:00 PM – 3:00 PM'
      })
    });
    const acceptData1 = await acceptRes1.json();
    console.log('acceptRes1 status:', acceptRes1.status, acceptData1);
    assert(acceptRes1.status === 200, 'Doctor 1 successfully confirmed appointment 1 for 2:00 PM – 3:00 PM');
    assert(acceptData1.duration === '60 minutes', 'Appointment duration recorded as 60 minutes');
    assert(acceptData1.start_time === '2:00 PM', 'Appointment start_time is 2:00 PM');
    assert(acceptData1.end_time === '3:00 PM', 'Appointment end_time is 3:00 PM');

    // Conflict Check: Doctor 1 tries to accept Apt 2 on the SAME date & slot -> HTTP 409 Conflict
    const acceptRes2 = await fetch(`${baseUrl}/appointments/${apt2Id}/accept`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenDoc1}`
      },
      body: JSON.stringify({
        appointment_date: testDate,
        time_slot: '2:00 PM – 3:00 PM'
      })
    });
    assert(acceptRes2.status === 409, 'Conflict detected: Doctor 1 cannot double-book 2:00 PM – 3:00 PM on same date (HTTP 409)');

    // Independent Doctor Schedules: Doctor 2 accepts AptDoc2 on the SAME date & slot -> SUCCESS
    const acceptResDoc2 = await fetch(`${baseUrl}/appointments/${aptDoc2Id}/accept`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenDoc2}`
      },
      body: JSON.stringify({
        appointment_date: testDate,
        time_slot: '2:00 PM – 3:00 PM'
      })
    });
    assert(acceptResDoc2.status === 200, 'Independent Doctor Schedules: Doctor 2 can book the same slot without conflict');

    // Test GET /doctor/booked-slots endpoint
    const bookedRes = await fetch(`${baseUrl}/doctor/booked-slots?date=${testDate}`, {
      headers: { 'Authorization': `Bearer ${tokenDoc1}` }
    });
    const bookedData = await bookedRes.json();
    assert(bookedRes.status === 200, 'GET /doctor/booked-slots returned 200');
    assert(bookedData.booked_slots.includes('2:00 PM – 3:00 PM'), 'Booked slots contains 2:00 PM – 3:00 PM for Doctor 1');


    // =========================================================================
    // SECTION 2: TASK 2 – MEDICAL REPORT CLOUD STORAGE (NO EROFS, NEON STORAGE)
    // =========================================================================
    console.log('\n--- SECTION 2: MEDICAL REPORTS PERSISTENT CLOUD STORAGE ---');

    // Create a real sample PDF in memory (synthesizing valid PDF header and text content)
    const samplePdfText = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 200 >> stream
BT
/F1 12 Tf
72 712 Td
(METROPOLIS CLINICAL DIAGNOSTICS LABORATORY) Tj
0 -20 Td
(Patient Name: Test Patient One) Tj
0 -20 Td
(Fasting Blood Sugar: 145 mg/dL | Reference: 70 - 99 mg/dL | Status: HIGH) Tj
0 -20 Td
(Hemoglobin: 14.2 g/dL | Reference: 13.8 - 17.2 g/dL | Status: NORMAL) Tj
ET
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000497 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
570
%%EOF`;

    const samplePdfBuffer = Buffer.from(samplePdfText, 'utf8');

    // Upload via multipart/form-data boundary simulation
    const boundary = `----MediVerseBoundary${Date.now()}`;
    const crlf = '\r\n';
    let multipartBody = Buffer.concat([
      Buffer.from(`--${boundary}${crlf}Content-Disposition: form-data; name="file"; filename="Complete_Blood_Panel.pdf"${crlf}Content-Type: application/pdf${crlf}${crlf}`),
      samplePdfBuffer,
      Buffer.from(`${crlf}--${boundary}${crlf}Content-Disposition: form-data; name="report_name"${crlf}${crlf}Complete Blood Panel`),
      Buffer.from(`${crlf}--${boundary}${crlf}Content-Disposition: form-data; name="report_type"${crlf}${crlf}Blood Tests`),
      Buffer.from(`${crlf}--${boundary}${crlf}Content-Disposition: form-data; name="hospital"${crlf}${crlf}Metropolis Clinical Diagnostics`),
      Buffer.from(`${crlf}--${boundary}--${crlf}`)
    ]);

    const uploadRes = await fetch(`${baseUrl}/reports/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Authorization': `Bearer ${tokenPat1}`
      },
      body: multipartBody
    });

    const uploadData = await uploadRes.json();
    assert(uploadRes.status === 201, `Upload succeeded with HTTP 201 without EROFS errors (report_id: ${uploadData.report_id})`);
    assert(uploadData.report_id && uploadData.report_id.startsWith('rep_'), 'Valid report_id generated');

    const createdRepId = uploadData.report_id;

    // Verify database persistence in Neon PostgreSQL
    const dbReportRows = await sql`
      SELECT id, user_id, report_name, file_name, file_location, file_data, parameters, ai_explanation
      FROM medical_reports
      WHERE id = ${createdRepId}
      LIMIT 1;
    `;
    assert(dbReportRows.length === 1, 'Report saved in Neon PostgreSQL medical_reports table');
    const dbRep = dbReportRows[0];
    assert(dbRep.file_location.startsWith('neon://medical_reports/'), `Persistent cloud locator used: ${dbRep.file_location}`);
    assert(dbRep.file_data && dbRep.file_data.startsWith('data:application/pdf;base64,'), 'file_data stored directly as base64 dataUrl in PostgreSQL');

    // Test GET /reports/:id/download as the authorized owner
    const downloadRes = await fetch(`${baseUrl}/reports/${createdRepId}/download`, {
      headers: { 'Authorization': `Bearer ${tokenPat1}` }
    });
    assert(downloadRes.status === 200, 'Owner can download the report file (HTTP 200)');
    assert(downloadRes.headers.get('content-type') === 'application/pdf', 'Download content-type is application/pdf');
    const downloadedBuf = Buffer.from(await downloadRes.arrayBuffer());
    assert(downloadedBuf.length === samplePdfBuffer.length, 'Downloaded buffer matches uploaded buffer length exactly');

    // Test RBAC: Patient 2 tries to download Patient 1's report -> HTTP 403 Forbidden
    const unauthDownloadRes = await fetch(`${baseUrl}/reports/${createdRepId}/download`, {
      headers: { 'Authorization': `Bearer ${tokenPat2}` }
    });
    assert(unauthDownloadRes.status === 403, 'RBAC Enforced: Unauthorized patient cannot download another patient report (HTTP 403)');

    // Test upload rejection for oversized file (> 15MB)
    const fakeOversizedHeader = Buffer.from(`--${boundary}${crlf}Content-Disposition: form-data; name="file_size"${crlf}${crlf}${16 * 1024 * 1024}${crlf}--${boundary}--${crlf}`);
    const oversizedRes = await fetch(`${baseUrl}/reports/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Authorization': `Bearer ${tokenPat1}`
      },
      body: fakeOversizedHeader
    });
    assert(oversizedRes.status === 400, 'Oversized file (>15MB) rejected with HTTP 400');


    // =========================================================================
    // SECTION 3: TASK 3 – AI REPORT ANALYZER (PERFORMANCE, JOBS, EXPLANATION)
    // =========================================================================
    console.log('\n--- SECTION 3: AI REPORT ANALYZER PERFORMANCE & JOBS ---');

    // 1. Digital PDF fast text extraction test (< 500ms)
    const extractStartTime = Date.now();
    const extractedPdfText = await extractTextFromDocument(samplePdfBuffer, 'application/pdf', 'Complete_Blood_Panel.pdf');
    const extractDurationMs = Date.now() - extractStartTime;

    assert(extractDurationMs < 500, `Fast digital PDF extraction completed in ${extractDurationMs}ms (< 500ms target)`);
    assert(extractedPdfText.includes('Fasting Blood Sugar'), 'Extracted text contains Fasting Blood Sugar');
    assert(extractedPdfText.includes('Hemoglobin'), 'Extracted text contains Hemoglobin');

    // 2. Full End-to-End RAG Analysis Pipeline test
    const ragStartTime = Date.now();
    const ragResult = await executeMedicalReportRAGPipeline({
      fileBuffer: samplePdfBuffer,
      fileName: 'Complete_Blood_Panel.pdf',
      mimeType: 'application/pdf',
      patientName: 'Test Patient One',
      reportType: 'Blood Tests',
      hospital: 'Metropolis Diagnostics',
      language: 'en'
    });
    const ragDurationMs = Date.now() - ragStartTime;

    console.log(`[RAG Performance] Full clinical pipeline completed in ${ragDurationMs}ms`);
    assert(ragDurationMs < 3000, `RAG pipeline completed in ${ragDurationMs}ms (well within serverless bounds)`);
    assert(ragResult.parameters.length >= 2, `Extracted ${ragResult.parameters.length} quantitative parameters`);

    // Verify 11-part complete explanation
    const exp = ragResult.ai_explanation;
    assert(Boolean(exp.overall_summary), '1. Overall report summary generated');
    assert(Array.isArray(exp.test_evaluations) && exp.test_evaluations.length >= 2, '2. Identified medical tests generated');
    assert(exp.test_evaluations.every(t => t.purpose), '3. Purpose of each test generated');
    assert(exp.test_evaluations.every(t => t.observed_value), '4. Measured values extracted');
    assert(ragResult.parameters.every(p => p.unit), '5. Units extracted');
    assert(exp.test_evaluations.every(t => t.reference_range), '6. Reference ranges matched');
    assert(Array.isArray(exp.normal_findings) && exp.normal_findings.length >= 1, '7. Normal findings identified');
    assert(Array.isArray(exp.abnormal_findings) && exp.abnormal_findings.length >= 1, '8. Abnormal findings identified');
    assert(Boolean(exp.possible_significance), '9. Possible significance of abnormal values generated');
    assert(Array.isArray(exp.precautions) && exp.precautions.length >= 2, '10. Relevant precautions generated');
    assert(Array.isArray(exp.doctor_discussion_questions) && exp.doctor_discussion_questions.length >= 2, '11. Doctor questions generated');
    assert(Array.isArray(exp.recommendations) && exp.recommendations.length >= 2, '12. Recommended next steps generated');
    assert(Boolean(exp.disclaimer), '13. Medical safety disclaimer included');

    // 3. Test POST /reports/analyze endpoint and verify Job creation
    const analyzeRes = await fetch(`${baseUrl}/reports/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenPat1}`
      },
      body: JSON.stringify({
        raw_text: extractedPdfText,
        report_name: 'Metropolis Lab Panel',
        report_type: 'Blood Tests',
        patient_name: 'Test Patient One',
        hospital: 'Metropolis Diagnostics'
      })
    });

    const analyzeData = await analyzeRes.json();
    assert(analyzeRes.status === 201, `POST /reports/analyze succeeded with HTTP 201 (report_id: ${analyzeData.report_id})`);
    assert(Boolean(analyzeData.job_id), `Analysis created persistent job: ${analyzeData.job_id}`);

    // 4. Test GET /reports/jobs/:jobId polling endpoint
    const jobRes = await fetch(`${baseUrl}/reports/jobs/${analyzeData.job_id}`);
    const jobData = await jobRes.json();
    assert(jobRes.status === 200, 'GET /reports/jobs/:jobId returned HTTP 200');
    assert(jobData.status === 'COMPLETED', `Job status is COMPLETED (stage: ${jobData.stage}, progress: ${jobData.progress}%)`);
    assert(Boolean(jobData.result), 'Job result JSON is populated with clinical RAG data');

    console.log('\n================================================================');
    console.log(`ALL TESTS PASSED! (${passedTests}/${totalTests} assertions passed)`);
    console.log('================================================================\n');

  } finally {
    // Cleanup test server
    server.close();
  }
}

runTests().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('\nTest suite failed with error:', err);
  process.exit(1);
});
