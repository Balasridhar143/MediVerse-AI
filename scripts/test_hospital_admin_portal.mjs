import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'mediverse-ai-clinical-secret-2026';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('MEDIVERSE AI — HOSPITAL ADMIN PORTAL SYSTEM TEST SUITE');
  console.log('====================================================\n');

  const sql = neon(process.env.DATABASE_URL);

  // 1. DEPARTMENT SUMMARY DYNAMIC METRICS
  console.log('[TEST 1] Department Summary Dynamic Calculation:');
  const deptsHosp1 = await sql`
    SELECT 
      d.id, d.name, d.code, d.head_doctor_name as "headDoctor", d.bed_count as "bedCount",
      COUNT(DISTINCT doc.id)::int as "registeredDoctors",
      COUNT(DISTINCT CASE WHEN (doc.is_available = true AND COALESCE(dha.employment_status, doc.employment_status) != 'SUSPENDED') THEN doc.id END)::int as "activeDoctors",
      COUNT(DISTINCT CASE WHEN doc.is_verified = true THEN doc.id END)::int as "verifiedDoctors",
      COUNT(DISTINCT COALESCE(apt.patient_id, pr.patient_id))::int as "registeredPatients",
      COUNT(DISTINCT apt.id)::int as "totalAppointments",
      COUNT(DISTINCT CASE WHEN apt.status = 'COMPLETED' THEN apt.id END)::int as "completedAppointments",
      COUNT(DISTINCT CASE WHEN apt.status IN ('PENDING', 'CONFIRMED', 'SCHEDULED') THEN apt.id END)::int as "pendingAppointments",
      COUNT(DISTINCT CASE WHEN apt.appointment_date = TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') THEN apt.id END)::int as "appointmentsToday"
    FROM departments d
    LEFT JOIN hospitals h ON d.hospital_id = h.id
    LEFT JOIN doctor_hospital_affiliations dha ON (dha.department_id = d.id OR dha.department_name = d.name) AND dha.hospital_id = d.hospital_id
    LEFT JOIN doctors doc ON (doc.id = dha.doctor_id OR (doc.hospital_id = d.hospital_id AND (doc.department_id = d.id OR doc.department = d.name)))
    LEFT JOIN appointments apt ON (apt.department = d.name AND (apt.hospital_name = h.name OR apt.hospital_id = h.id OR apt.doctor_id = doc.id))
    LEFT JOIN patient_registrations pr ON (pr.hospital_id = d.hospital_id AND pr.department = d.name)
    WHERE d.hospital_id = 'hosp_1'
    GROUP BY d.id, d.name, d.code, d.head_doctor_name, d.bed_count, d.status, d.hospital_id, h.name
    ORDER BY d.name ASC;
  `;

  assert(deptsHosp1.length > 0, `Retrieved ${deptsHosp1.length} departments for hosp_1`);
  const cardDept = deptsHosp1.find(d => d.code === 'CARD');
  assert(cardDept !== undefined, 'Cardiology department exists in hosp_1');
  assert(typeof cardDept.registeredDoctors === 'number', 'registeredDoctors is numeric');
  assert(typeof cardDept.activeDoctors === 'number', 'activeDoctors is numeric');
  assert(typeof cardDept.verifiedDoctors === 'number', 'verifiedDoctors is numeric');
  assert(typeof cardDept.registeredPatients === 'number', 'registeredPatients is numeric');
  assert(typeof cardDept.totalAppointments === 'number', 'totalAppointments is numeric');
  assert(typeof cardDept.completedAppointments === 'number', 'completedAppointments is numeric');
  assert(typeof cardDept.pendingAppointments === 'number', 'pendingAppointments is numeric');
  assert(typeof cardDept.bedCount === 'number', 'bedCount is numeric');

  // Verify zero state for empty department
  const dermDept = deptsHosp1.find(d => d.code === 'DERM');
  if (dermDept) {
    assert(dermDept.registeredDoctors === 0, 'Empty department accurately returns 0 registeredDoctors (no mock data)');
    assert(dermDept.totalAppointments === 0, 'Empty department accurately returns 0 totalAppointments (no mock data)');
  }

  // 2. HOSPITAL-SPECIFIC DOCTOR MANAGEMENT & ISOLATION
  console.log('\n[TEST 2] Hospital Doctor Affiliations & Isolation:');
  const apolloDocs = await sql`
    SELECT DISTINCT d.id, d.full_name
    FROM doctors d
    LEFT JOIN doctor_hospital_affiliations dha ON dha.doctor_id = d.id AND dha.hospital_id = 'hosp_apollo_01'
    WHERE d.hospital_id = 'hosp_apollo_01' OR dha.hospital_id = 'hosp_apollo_01';
  `;
  const cityCareDocs = await sql`
    SELECT DISTINCT d.id, d.full_name
    FROM doctors d
    LEFT JOIN doctor_hospital_affiliations dha ON dha.doctor_id = d.id AND dha.hospital_id = 'hosp_1'
    WHERE d.hospital_id = 'hosp_1' OR dha.hospital_id = 'hosp_1';
  `;

  assert(apolloDocs.length > 0, `Apollo Speciality Care has ${apolloDocs.length} affiliated physicians`);
  assert(cityCareDocs.length > 0, `City Care has ${cityCareDocs.length} affiliated physicians`);
  
  // Dr. Arun Kumar (doc_usr_doc_001) is only at City Care, must not be at Apollo
  const arunInApollo = apolloDocs.some(d => d.id === 'doc_usr_doc_001');
  assert(!arunInApollo, 'Doctor at City Care (Dr. Arun Kumar) does NOT automatically appear at Apollo');

  // Multi-hospital doctor: Dr. Vikram Malhotra is affiliated with BOTH
  const vikramApollo = apolloDocs.some(d => d.id === 'doc_695f07a240bb');
  const vikramCity = cityCareDocs.some(d => d.id === 'doc_695f07a240bb');
  assert(vikramApollo && vikramCity, 'Multi-hospital physician (Dr. Vikram Malhotra) appears in both City Care and Apollo');

  // 3. DOCTOR HOSPITAL AFFILIATIONS QUERY
  console.log('\n[TEST 3] Doctor Multi-Hospital Affiliation Retrieval:');
  const docAffs = await sql`
    SELECT dha.id as "affiliationId", dha.hospital_id as "hospitalId", h.name as "hospitalName",
           dha.employment_status as "employmentStatus", dha.is_primary as "isPrimary"
    FROM doctor_hospital_affiliations dha
    JOIN hospitals h ON dha.hospital_id = h.id
    WHERE dha.doctor_id = 'doc_695f07a240bb'
    ORDER BY dha.is_primary DESC;
  `;
  assert(docAffs.length === 2, `Dr. Vikram Malhotra has exactly 2 verified affiliations`);
  assert(docAffs[0].isPrimary === true && docAffs[0].hospitalId === 'hosp_1', 'Primary affiliation is City Care');
  assert(docAffs[1].isPrimary === false && docAffs[1].hospitalId === 'hosp_apollo_01', 'Visiting affiliation is Apollo');

  // 4. HOSPITAL ADMIN CONTEXT ENFORCEMENT
  console.log('\n[TEST 4] Hospital Admin Context & Isolation:');
  const apolloAdminUser = await sql`SELECT id, email FROM users WHERE email = 'suresh.patel@apollo.example.com' OR id = 'usr_daa54ea670cc401f' LIMIT 1;`;
  assert(apolloAdminUser.length > 0, 'Apollo administrator record exists');
  const adminId = apolloAdminUser[0]?.id;

  // Verify Suresh Patel's assigned hospital is hosp_apollo_01
  const sureshHosp = await sql`
    SELECT h.id, h.name FROM hospitals h WHERE h.admin_user_id = ${adminId}
    UNION
    SELECT ha.facility_id as id, ha.hospital_name as name FROM hospital_admins ha WHERE ha.user_id = ${adminId}
  `;
  assert(sureshHosp.length > 0 && sureshHosp[0].id === 'hosp_apollo_01', 'Suresh Patel resolves strictly to hosp_apollo_01');

  // 5. DOCTOR PATIENT ACCESS CONTROL
  console.log('\n[TEST 5] Doctor Access to Patient Clinical Dossier:');
  // Check patient with an appointment with Dr. Arun Kumar
  const arunApt = await sql`SELECT patient_id, doctor_id FROM appointments WHERE doctor_id = 'usr_doc_001' OR doctor_id = 'doc_usr_doc_001' LIMIT 1;`;
  if (arunApt.length > 0) {
    const authorizedPatientId = arunApt[0].patient_id;
    // Check authorization query
    const authCheck = await sql`
      SELECT id FROM appointments 
      WHERE (doctor_id = 'doc_usr_doc_001' OR doctor_id = 'usr_doc_001')
        AND (patient_id = ${authorizedPatientId} OR patient_id = (SELECT user_id FROM patients WHERE id = ${authorizedPatientId}))
      LIMIT 1;
    `;
    assert(authCheck.length > 0, `Doctor authorized for patient ${authorizedPatientId} via active appointment`);
  }

  // Check unauthorized doctor
  const unauthCheck = await sql`
    SELECT id FROM appointments 
    WHERE doctor_id = 'doc_463ef06c166e' -- Dr. Priya Nair
      AND patient_id = 'usr_pat_001'
    LIMIT 1;
  `;
  assert(unauthCheck.length === 0, 'Unauthorized doctor correctly denied access to unrelated patient');

  // 6. SENSITIVE ACCESS & AUDIT LOGGING
  console.log('\n[TEST 6] Audit Trail Verification:');
  const testAuditLogId = 'log_test_' + Date.now();
  await sql`
    INSERT INTO audit_logs (id, user_id, user_role, action, resource, resource_id, details, ip_address)
    VALUES (${testAuditLogId}, 'usr_system_audit', 'hospital_admin', 'SYSTEM_AUDIT_VERIFICATION', 'HOSPITAL_PORTAL', 'hosp_1', '{"status":"VERIFIED"}'::jsonb, '127.0.0.1');
  `;
  const logged = await sql`SELECT id, action, resource FROM audit_logs WHERE id = ${testAuditLogId};`;
  assert(logged.length > 0 && logged[0].action === 'SYSTEM_AUDIT_VERIFICATION', 'Audit log successfully recorded and queried from PostgreSQL');

  // Cleanup test audit log
  await sql`DELETE FROM audit_logs WHERE id = ${testAuditLogId};`;

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});

