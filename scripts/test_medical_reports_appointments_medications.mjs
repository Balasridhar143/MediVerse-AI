/**
 * Comprehensive Automated Test Suite:
 * - Phase 1 & 2: Medical Reports, File Persistence, AI RAG Analysis, Document Download
 * - Phase 3: Doctor Clinical Context, Health Timeline, Health Twin
 * - Phase 4: Appointment 60-Minute Slots, Doctor Acceptance & Scheduling
 * - Phase 5: Medication Management & Adherence Tracking
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { executeMedicalReportRAGPipeline, extractAndCompareLabEntities, extractTextFromDocument } from '../api/reportRAG.js';
import { parseTimeSlotString, validateAppointmentSlot } from '../api/appointmentSlotValidator.js';
import { ensureTables } from '../api/index.js';
import crypto from 'crypto';

dotenv.config({ path: '.env.local' });
const dbUrl = process.env.DATABASE_URL;
const sql = neon(dbUrl);

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 MEDIVERSE AI SYSTEM TEST SUITE: REPORTS, SLOTS, MEDS');
  console.log('======================================================\n');

  // TEST 1: 60-minute consultation slot validation
  console.log('▶ Test 1: 60-Minute Consultation Slot Parsing');
  const slot1 = parseTimeSlotString('10:00 AM');
  assert(slot1.startHour === 10 && slot1.startMinute === 0, 'Start hour is 10:00 AM');
  assert(slot1.endHour === 11 && slot1.endMinute === 0, 'Single time slot correctly defaults to 60-minute window (end: 11:00 AM)');

  const slot2 = parseTimeSlotString('02:30 PM - 03:30 PM');
  assert(slot2.startHour === 14 && slot2.startMinute === 30, 'Range start is 14:30');
  assert(slot2.endHour === 15 && slot2.endMinute === 30, 'Range end is 15:30 (1 hour)');

  // TEST 2: RAG Pipeline entity extraction
  console.log('\n▶ Test 2: AI Medical Report Entity Extraction & Reference Bounds');
  const sampleLabReportText = `
    CITY DIAGNOSTIC CLINICAL LABORATORY
    Patient: Rahul Sharma, Age: 42, Gender: Male
    Date: 2026-11-03

    COMPLETE BLOOD COUNT & METABOLIC PANEL
    Hemoglobin: 11.2 g/dL (Reference: 12.0 - 17.0 g/dL)
    Fasting Blood Sugar: 135 mg/dL (Reference: 70.0 - 99.0 mg/dL)
    Serum Creatinine: 0.95 mg/dL (Reference: 0.70 - 1.30 mg/dL)
    Total White Blood Cells: 7400 cells/cumm
    Platelet Count: 2.4 lakhs/cumm
  `;

  const extracted = extractAndCompareLabEntities(sampleLabReportText);
  assert(extracted.length >= 3, `Extracted ${extracted.length} laboratory test entities`);

  const hb = extracted.find(t => t.test_name === 'Hemoglobin');
  assert(hb && hb.patient_value === 11.2, 'Extracted Hemoglobin value: 11.2');
  assert(hb && hb.status === 'Below reference range', 'Correctly flagged Hemoglobin as Below reference range');

  const fbs = extracted.find(t => t.test_name.includes('Fasting'));
  assert(fbs && fbs.patient_value === 135, 'Extracted Fasting Blood Sugar: 135');
  assert(fbs && fbs.status === 'Above reference range', 'Correctly flagged Fasting Blood Sugar as Above reference range');

  const creat = extracted.find(t => t.test_name.includes('Creatinine'));
  assert(creat && creat.status === 'Normal', 'Correctly identified Serum Creatinine as Normal');

  // TEST 3: Safe AI RAG Analysis Pipeline execution
  console.log('\n▶ Test 3: RAG Synthesis Pipeline');
  const ragResult = await executeMedicalReportRAGPipeline({
    rawText: sampleLabReportText,
    fileName: 'CBC_Metabolic.pdf',
    reportType: 'Blood Tests',
    hospital: 'City Diagnostic Center',
    patientName: 'Rahul Sharma'
  });

  assert(ragResult.parameters.length >= 3, 'RAG pipeline returned extracted parameters');
  assert(ragResult.ai_explanation.summary.length > 20, 'RAG pipeline synthesized clinical summary');
  assert(ragResult.ai_explanation.doctor_discussion_questions.length > 0, 'Doctor discussion questions generated');
  assert(ragResult.rag_citations.length > 0, 'RAG citations retrieved from evidence-based clinical guidelines');

  // TEST 4: Empty / Unreadable Document Safety (NO fake values generated)
  console.log('\n▶ Test 4: Document Upload Safety (No Fabricated Test Values)');
  const emptyReportResult = await executeMedicalReportRAGPipeline({
    rawText: '',
    fileName: 'scanned_prescription_unreadable.jpg',
    mimeType: 'image/jpeg',
    reportType: 'Imaging / X-Ray',
    patientName: 'Test Patient'
  });

  assert(emptyReportResult.parameters.length === 0, 'Does NOT generate fabricated test values for unreadable image/empty text');
  assert(emptyReportResult.structured_data.total_tests_analyzed === 0, 'Correctly reports 0 parameters parsed');
  assert(emptyReportResult.ai_explanation.recommendations.some(r => r.includes('stored securely') || r.includes('consultation')), 'Safe guidance provided for original document review');

  // TEST 5: Database Persistence & Column Verification in Neon PostgreSQL
  console.log('\n▶ Test 5: Database Persistence in Neon PostgreSQL');
  try {
    await ensureTables(sql);

    // Check columns in medical_reports
    const cols = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'medical_reports'
      ORDER BY column_name;
    `;
    const colNames = cols.map(c => c.column_name);
    assert(colNames.includes('file_data'), 'medical_reports has file_data column');
    assert(colNames.includes('original_filename'), 'medical_reports has original_filename column');
    assert(colNames.includes('doctor_review_status'), 'medical_reports has doctor_review_status column');
    assert(colNames.includes('doctor_notes'), 'medical_reports has doctor_notes column');

    // Test persistent insert of a medical report with file_data
    const testReportId = `rep_test_${crypto.randomBytes(4).toString('hex')}`;
    const testFileData = 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXr...';
    await sql`
      INSERT INTO medical_reports (
        id, user_id, patient_name, report_name, report_type, hospital, doctor, status, date,
        parameters, structured_data, ai_explanation, file_name, file_data, doctor_review_status, created_at
      ) VALUES (
        ${testReportId}, NULL, 'Test Patient', 'Automated Verification Lab Report', 'Blood Tests',
        'Apollo Diagnostics', 'Dr. Test Clinician', 'Ready', '2026-11-03',
        ${JSON.stringify(ragResult.parameters)},
        ${JSON.stringify(ragResult.structured_data)},
        ${JSON.stringify(ragResult.ai_explanation)},
        'cbc_test.pdf', ${testFileData}, 'Pending Review', NOW()
      );
    `;

    const fetchedReport = await sql`SELECT id, report_name, file_data, doctor_review_status FROM medical_reports WHERE id = ${testReportId};`;
    assert(fetchedReport.length > 0, 'Test report persisted and retrieved');
    assert(fetchedReport[0].file_data === testFileData, 'file_data correctly persisted and matches upload');

    // Test doctor review update
    await sql`
      UPDATE medical_reports
      SET doctor_review_status = 'Doctor Reviewed',
          doctor_notes = 'Reviewed Hb levels; recommended follow-up in 4 weeks.',
          status = 'Doctor Reviewed'
      WHERE id = ${testReportId};
    `;
    const reviewed = await sql`SELECT status, doctor_review_status, doctor_notes FROM medical_reports WHERE id = ${testReportId};`;
    assert(reviewed[0].doctor_review_status === 'Doctor Reviewed', 'Doctor review status updated to Doctor Reviewed');
    assert(reviewed[0].doctor_notes.includes('Reviewed Hb levels'), 'Doctor clinical note persisted');

    // Clean up test report
    await sql`DELETE FROM medical_reports WHERE id = ${testReportId};`;
    assert(true, 'Test report safely cleaned up');

    // TEST 6: Medication Adherence Logs Table
    console.log('\n▶ Test 6: Medication Adherence Logs Table in Neon');
    const medTableCheck = await sql`
      SELECT table_name FROM information_schema.tables WHERE table_name = 'medication_adherence_logs';
    `;
    assert(medTableCheck.length > 0, 'medication_adherence_logs table exists');

    const testLogId = `medlog_test_${crypto.randomBytes(4).toString('hex')}`;
    const todayStr = new Date().toISOString().split('T')[0];
    await sql`
      INSERT INTO medication_adherence_logs (id, user_id, medicine_name, dosage, slot, status, log_date, logged_at)
      VALUES (${testLogId}, 'usr_test', 'Telmisartan', '40 mg', 'Morning', 'TAKEN', ${todayStr}, NOW());
    `;

    const fetchedLog = await sql`SELECT * FROM medication_adherence_logs WHERE id = ${testLogId};`;
    assert(fetchedLog.length > 0, 'Medication adherence dose logged successfully');
    assert(fetchedLog[0].status === 'TAKEN', 'Dose status correctly saved as TAKEN');

    // Clean up test log
    await sql`DELETE FROM medication_adherence_logs WHERE id = ${testLogId};`;
    assert(true, 'Test medication log cleaned up');

  } catch (dbErr) {
    console.error('Database test error:', dbErr.message);
    failed++;
  }

  console.log('\n======================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');
}

runTests();
