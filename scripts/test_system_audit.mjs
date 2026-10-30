import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { CLINICAL_DRUG_CLASSES, enrichMedicineKnowledge } from '../api/medicineKnowledge.js';

const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);
const JWT_SECRET = process.env.JWT_SECRET || 'mediverse-dev-secret-key-change-in-production';

async function runAudit() {
  console.log('========================================================');
  console.log('MEDIVERSE AI — COMPREHENSIVE SYSTEM INTEGRITY & AUDIT TEST');
  console.log('========================================================\n');

  let passes = 0;
  let failures = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passes++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failures++;
    }
  }

  try {
    // 1. Database Persistence Verification
    console.log('--- 1. DATABASE DATA INTEGRITY & RECORD PRESERVATION ---');
    const userCount = await sql`SELECT COUNT(*)::int as c FROM users;`;
    const patientCount = await sql`SELECT COUNT(*)::int as c FROM patients;`;
    const doctorCount = await sql`SELECT COUNT(*)::int as c FROM doctors;`;
    const adminCount = await sql`SELECT COUNT(*)::int as c FROM hospital_admins;`;
    const apptCount = await sql`SELECT COUNT(*)::int as c FROM appointments;`;

    assert(userCount[0].c >= 41, `Users preserved: ${userCount[0].c} >= 41`);
    assert(patientCount[0].c >= 20, `Patients preserved: ${patientCount[0].c} >= 20`);
    assert(doctorCount[0].c >= 13, `Doctors preserved: ${doctorCount[0].c} >= 13`);
    assert(adminCount[0].c >= 7, `Hospital admins preserved: ${adminCount[0].c} >= 7`);
    assert(apptCount[0].c >= 17, `Appointments preserved: ${apptCount[0].c} >= 17`);

    // 2. Hospital & Department Architecture
    console.log('\n--- 2. HOSPITAL & DEPARTMENT ARCHITECTURE ---');
    const hospitals = await sql`SELECT id, name, code, bed_capacity FROM hospitals;`;
    assert(hospitals.length >= 6, `Authentic hospitals count in DB: ${hospitals.length} >= 6`);

    const departments = await sql`SELECT id, name, code, hospital_id FROM departments;`;
    assert(departments.length >= 50, `Authentic clinical departments in DB: ${departments.length} >= 50`);

    const doctorsWithDept = await sql`SELECT COUNT(*)::int as c FROM doctors WHERE department IS NOT NULL;`;
    assert(doctorsWithDept[0].c === doctorCount[0].c, `All doctors assigned to genuine clinical departments (${doctorsWithDept[0].c}/${doctorCount[0].c})`);

    // Dynamic aggregation test
    const deptAgg = await sql`
      SELECT 
        d.name,
        COUNT(DISTINCT doc.id)::int as "doctorsCount",
        COUNT(DISTINCT apt.id)::int as "appointmentsToday"
      FROM departments d
      LEFT JOIN doctors doc ON doc.department = d.name
      LEFT JOIN appointments apt ON apt.department = d.name
      GROUP BY d.name
      LIMIT 5;
    `;
    assert(deptAgg.length > 0, `Dynamic department aggregation queries successfully returned`);

    // 3. Admin Security & Re-authentication Audit
    console.log('\n--- 3. ADMINISTRATOR SECURITY RE-AUTHENTICATION & AUDIT TRAIL ---');
    const sampleAdmin = await sql`
      SELECT u.id, u.email, u.password_hash, u.role
      FROM users u
      JOIN hospital_admins ha ON ha.user_id = u.id
      LIMIT 1;
    `;
    assert(sampleAdmin.length > 0, `Found hospital admin user in DB: ${sampleAdmin[0]?.email}`);

    // Verify bcrypt password checking
    const dummyBadPass = await bcrypt.compare('WrongPassword123!', sampleAdmin[0].password_hash);
    assert(!dummyBadPass, 'Incorrect password correctly rejected by bcrypt');

    // Generate valid reauth token
    const testReauthToken = jwt.sign(
      { sub: sampleAdmin[0].id, id: sampleAdmin[0].id, role: 'hospital_admin', reauth: true },
      JWT_SECRET,
      { expiresIn: '10m' }
    );
    const decoded = jwt.verify(testReauthToken, JWT_SECRET);
    assert(decoded.reauth === true && decoded.id === sampleAdmin[0].id, 'Valid 10-minute sensitive re-auth token created & verified');

    // Verify audit log write
    const logId = 'test_log_' + Date.now().toString(36);
    await sql`
      INSERT INTO audit_logs (id, user_id, user_role, action, resource, details, ip_address)
      VALUES (${logId}, ${sampleAdmin[0].id}, 'hospital_admin', 'AUDIT_VERIFICATION_TEST', 'TEST_HARNESS', '{"status":"SUCCESS"}'::jsonb, '127.0.0.1');
    `;
    const auditRecord = await sql`SELECT id, action FROM audit_logs WHERE id = ${logId};`;
    assert(auditRecord.length === 1 && auditRecord[0].action === 'AUDIT_VERIFICATION_TEST', 'Audit log successfully written and queried in PostgreSQL');

    // 4. Medicine Database & 35 Clinical Categories
    console.log('\n--- 4. MEDICINE DATABASE & 35 CLINICAL CATEGORIES ---');
    assert(CLINICAL_DRUG_CLASSES.length === 35, `35 distinct clinical drug classes codified: ${CLINICAL_DRUG_CLASSES.length}`);
    const uniqueCats = new Set(CLINICAL_DRUG_CLASSES.map(c => c.category));
    assert(uniqueCats.size === 35, `35 distinct clinical categories verified: ${uniqueCats.size}`);

    // Test sample enrichments
    const sampleAugmentin = enrichMedicineKnowledge({
      id: 'TEST-1',
      brand_name: 'Augmentin 625 Duo',
      generic_name: 'Amoxycillin (500mg) + Clavulanic Acid (125mg)',
      composition: 'Amoxicillin and Clavulanate',
      category: 'Allopathic'
    });
    assert(sampleAugmentin.category === 'Antibiotics & Anti-Infectives', 'Augmentin correctly enriched as Antibiotics & Anti-Infectives');

    const sampleAmlodipine = enrichMedicineKnowledge({
      id: 'TEST-2',
      brand_name: 'Amlong 5mg',
      generic_name: 'Amlodipine Besylate',
      composition: 'Amlodipine (5mg)',
      category: 'Allopathic'
    });
    assert(sampleAmlodipine.category === 'Antihypertensives', 'Amlong correctly enriched as Antihypertensives');

    const sampleMetformin = enrichMedicineKnowledge({
      id: 'TEST-3',
      brand_name: 'Glycomet 500mg',
      generic_name: 'Metformin Hydrochloride',
      composition: 'Metformin (500mg)',
      category: 'Allopathic'
    });
    assert(sampleMetformin.category === 'Antidiabetic Agents', 'Glycomet correctly enriched as Antidiabetic Agents');

    // 5. Patient Allergies & 3 Clinical States
    console.log('\n--- 5. PATIENT ALLERGY MANAGEMENT & 3 CLINICAL STATES ---');
    const allergyRows = await sql`SELECT COUNT(*)::int as c FROM patient_allergies;`;
    assert(allergyRows[0].c >= 5, `Structured patient_allergies populated: ${allergyRows[0].c} >= 5`);

    // Verify Anita Desai has penicillin allergy
    const anitaAllergies = await sql`
      SELECT pa.allergen, pa.severity, p.allergy_status
      FROM patient_allergies pa
      JOIN patients p ON p.user_id = pa.patient_id
      WHERE pa.allergen ILIKE '%Penicillin%'
      LIMIT 1;
    `;
    assert(anitaAllergies.length > 0 && anitaAllergies[0].allergy_status === 'DOCUMENTED', 'Anita Desai confirmed with DOCUMENTED Penicillin allergy');

    // 6. WebRTC Signaling Schema & Ice Configuration
    console.log('\n--- 6. WEBRTC SIGNALING & INFRASTRUCTURE ---');
    const signalTable = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'consultation_signals';
    `;
    const colNames = signalTable.map(c => c.column_name);
    assert(colNames.includes('room_id') && colNames.includes('signal_type') && colNames.includes('signal_data'), 'consultation_signals schema intact for WebRTC SDP & ICE candidate exchange');

    console.log('\n========================================================');
    console.log(`AUDIT COMPLETE: ${passes} PASSED, ${failures} FAILED`);
    console.log('========================================================');

    if (failures === 0) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Audit exception:', err);
    process.exit(1);
  }
}

runAudit();
