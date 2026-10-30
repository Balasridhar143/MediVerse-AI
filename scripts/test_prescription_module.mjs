import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import http from 'http';
import jwt from 'jsonwebtoken';
import { neon } from '@neondatabase/serverless';
import app from '../api/index.js';

const PORT = 8095;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const JWT_SECRET = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET || 'mediverse_jwt_secret_key_prod_2026';
const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);

async function runTests() {
  console.log('--- Starting Prescription Module Comprehensive Verification ---');

  // Start local server
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
  console.log(`[Test Server] Listening on ${BASE_URL}`);

  try {
    // ----------------------------------------------------
    // TEST 1: Medicine Search (Real CDSCO / WHO / NLEM)
    // ----------------------------------------------------
    console.log('\n--- 1. Testing Medicine Database Search ---');

    // 1A. Search by brand name
    const brandRes = await fetch(`${BASE_URL}/api/prescriptions/medicines/search?q=Augmentin`);
    const brandData = await brandRes.json();
    console.log(`Brand Search 'Augmentin': ${brandRes.status}, Total matches: ${brandData.total}`);
    if (!brandData.items || brandData.items.length === 0) throw new Error('Failed to find Augmentin');
    const firstMed = brandData.items[0];
    console.log(`✓ Found Brand: ${firstMed.brand_name} | Generic: ${firstMed.generic_name}`);
    console.log(`  Strengths: ${firstMed.available_strengths?.join(', ')}`);
    console.log(`  Source: ${firstMed.source_reference}`);

    // 1B. Search by generic name
    const genericRes = await fetch(`${BASE_URL}/api/prescriptions/medicines/search?q=Telmisartan`);
    const genericData = await genericRes.json();
    console.log(`Generic Search 'Telmisartan': ${genericRes.status}, Total matches: ${genericData.total}`);
    if (!genericData.items || genericData.items.length === 0) throw new Error('Failed to find Telmisartan');
    console.log(`✓ Found Generic: ${genericData.items[0].brand_name} (${genericData.items[0].generic_name})`);

    // 1C. Search by active ingredient
    const activeRes = await fetch(`${BASE_URL}/api/prescriptions/medicines/search?q=Clavulanic`);
    const activeData = await activeRes.json();
    console.log(`Active Ingredient Search 'Clavulanic': ${activeRes.status}, Total matches: ${activeData.total}`);
    if (!activeData.items || activeData.items.length === 0) throw new Error('Failed to find Clavulanic');
    console.log(`✓ Found Active Ingredient match: ${activeData.items[0].brand_name}`);

    // ----------------------------------------------------
    // TEST 2: Eligible Registered Patients
    // ----------------------------------------------------
    console.log('\n--- 2. Testing Doctor Eligible Patients Retrieval ---');

    // Doctor token (Dr. Bala Sridhar / usr_13a59fc80b6908af)
    const doctorUser = { id: 'usr_13a59fc80b6908af', full_name: 'Dr. Bala Sridhar', role: 'doctor', email: 'doctor@mediverse.org' };
    const doctorToken = jwt.sign(doctorUser, JWT_SECRET, { expiresIn: '1h' });

    const patientRes = await fetch(`${BASE_URL}/api/prescriptions/patients`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    const patientData = await patientRes.json();
    console.log(`Eligible Patients Status: ${patientRes.status}, Total: ${patientData.total}`);
    if (!patientData.patients || patientData.patients.length === 0) throw new Error('No eligible patients returned');
    const targetPatient = patientData.patients[0];
    console.log(`✓ Retrieved Real Registered Patient: ${targetPatient.name} (ID: ${targetPatient.id}, Age: ${targetPatient.age}, Blood: ${targetPatient.bloodGroup})`);

    // Search patient by name
    const patSearchRes = await fetch(`${BASE_URL}/api/prescriptions/patients?q=${encodeURIComponent(targetPatient.name)}`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    const patSearchData = await patSearchRes.json();
    console.log(`Search by patient name '${targetPatient.name}': status ${patSearchRes.status}, count: ${patSearchData.patients?.length}`);
    if (!patSearchData.patients?.some(p => p.id === targetPatient.id)) throw new Error('Patient search failed to find target patient');
    console.log('✓ Patient search by name verified');

    // ----------------------------------------------------
    // TEST 3: Create Prescription for Real Patient
    // ----------------------------------------------------
    console.log('\n--- 3. Testing Prescription Creation & Database Persistence ---');

    const prescriptionPayload = {
      patient_id: targetPatient.id,
      diagnosis: 'Acute Bacterial Pharyngitis & Mild Hypertension',
      follow_up_date: '2026-11-15',
      clinical_notes: 'Hydrate well. Rest for 3 days. Return if fever persists.',
      medicines: [
        {
          id: firstMed.id,
          name: firstMed.brand_name,
          generic_name: firstMed.generic_name,
          brand_name: firstMed.brand_name,
          active_ingredient: firstMed.active_ingredient,
          dosage: '625 mg',
          dosage_form: 'Tablet',
          frequency: 'Twice daily (1-0-1)',
          duration: '5 days',
          mealRelation: 'After meals',
          instructions: 'Take 1 tablet after food with water every 12 hours.'
        },
        {
          id: 'med_telma',
          name: 'Telmisartan Tablet',
          generic_name: 'Telmisartan',
          brand_name: 'Telmisartan Tablet',
          dosage: '40 mg',
          dosage_form: 'Tablet',
          frequency: 'Once daily (1-0-0)',
          duration: '30 days',
          mealRelation: 'After breakfast',
          instructions: 'Take 1 tablet in the morning after breakfast.'
        }
      ]
    };

    const createRes = await fetch(`${BASE_URL}/api/prescriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`
      },
      body: JSON.stringify(prescriptionPayload)
    });

    const createData = await createRes.json();
    console.log(`Create Prescription Status: ${createRes.status}`);
    console.log('Created Prescription Details:', {
      id: createData.prescription?.id,
      prescriptionId: createData.prescription?.prescriptionId,
      patientName: createData.prescription?.patientName,
      doctorName: createData.prescription?.doctorName,
      medicinesCount: createData.prescription?.medicines?.length
    });

    if (createRes.status !== 201 || !createData.prescription?.id) {
      throw new Error(`Prescription creation failed: ${JSON.stringify(createData)}`);
    }
    const createdRxId = createData.prescription.id;
    console.log(`✓ Prescription #${createData.prescription.prescriptionId} successfully created in database!`);

    // Verify directly in Postgres
    const dbRx = await sql`SELECT * FROM prescriptions WHERE id = ${createdRxId} LIMIT 1;`;
    if (dbRx.length === 0) throw new Error('Prescription record not found in database table prescriptions');
    const dbItems = await sql`SELECT * FROM prescription_items WHERE prescription_id = ${createdRxId};`;
    if (dbItems.length !== 2) throw new Error(`Expected 2 items in prescription_items, found ${dbItems.length}`);
    console.log(`✓ Database integrity verified: 1 prescription header + 2 items persisted in Neon PostgreSQL`);

    // ----------------------------------------------------
    // TEST 4: Patient Prescription Retrieval
    // ----------------------------------------------------
    console.log('\n--- 4. Testing Patient Account Prescription Retrieval ---');

    const patientToken = jwt.sign(
      { id: targetPatient.id, full_name: targetPatient.name, role: 'patient', email: targetPatient.email || 'patient@test.com' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const getPatientRxRes = await fetch(`${BASE_URL}/api/prescriptions`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    const patientRxList = await getPatientRxRes.json();
    console.log(`Patient fetch prescriptions status: ${getPatientRxRes.status}, count: ${patientRxList.length}`);
    const foundMyRx = patientRxList.find(p => p.id === createdRxId);
    if (!foundMyRx) throw new Error('Patient was unable to retrieve their newly issued prescription');
    console.log(`✓ Patient successfully retrieved prescription #${foundMyRx.prescriptionId}`);
    console.log(`  Doctor: ${foundMyRx.doctorName} | Hospital: ${foundMyRx.hospital}`);
    console.log(`  Prescribed Medications (${foundMyRx.medicines.length}):`);
    foundMyRx.medicines.forEach((m, idx) => {
      console.log(`    ${idx + 1}. ${m.name} (${m.dosage}) - ${m.frequency} for ${m.duration} [${m.mealRelation}]`);
    });

    // ----------------------------------------------------
    // TEST 5: Privacy & Authorization Isolation
    // ----------------------------------------------------
    console.log('\n--- 5. Testing Patient Privacy & Access Control ---');

    // Create a different patient token
    const otherPatientToken = jwt.sign(
      { id: 'usr_different_patient_999', full_name: 'Unrelated Patient', role: 'patient', email: 'other@test.com' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const otherPatientListRes = await fetch(`${BASE_URL}/api/prescriptions`, {
      headers: { Authorization: `Bearer ${otherPatientToken}` }
    });
    const otherPatientList = await otherPatientListRes.json();
    const leaked = otherPatientList.some(p => p.id === createdRxId);
    if (leaked) throw new Error('SECURITY VIOLATION: Unrelated patient accessed another patient prescription list');
    console.log('✓ Verified: Unrelated patient cannot see another patient prescription in their list');

    // Attempt direct single prescription fetch
    const otherDirectRes = await fetch(`${BASE_URL}/api/prescriptions/${createdRxId}`, {
      headers: { Authorization: `Bearer ${otherPatientToken}` }
    });
    console.log(`Unauthorized direct access status: ${otherDirectRes.status} (Expected 403 Forbidden)`);
    if (otherDirectRes.status !== 403) throw new Error(`Expected 403 Forbidden, got ${otherDirectRes.status}`);
    console.log('✓ Verified: 403 Forbidden enforced on direct unauthorized prescription access');

    // ----------------------------------------------------
    // TEST 6: Patient Notification Verification
    // ----------------------------------------------------
    console.log('\n--- 6. Testing Patient System Notification ---');
    const notifs = await sql`
      SELECT id, type, title, message FROM notifications
      WHERE user_id = ${targetPatient.id} AND type = 'PRESCRIPTION_ISSUED'
      ORDER BY created_at DESC LIMIT 1;
    `;
    if (notifs.length === 0) throw new Error('No notification found for patient');
    console.log(`✓ Patient notification verified: '${notifs[0].title}' - '${notifs[0].message}'`);

    // ----------------------------------------------------
    // TEST 7: Regression Tests (Health & Video Room)
    // ----------------------------------------------------
    console.log('\n--- 7. Regression Testing ---');
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const health = await healthRes.json();
    console.log(`Health status: ${healthRes.status}, db: ${health.database}`);
    if (healthRes.status !== 200) throw new Error('Health check failed');

    const roomRes = await fetch(`${BASE_URL}/api/consultation/room/apt_101`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    console.log(`Video Consultation Room apt_101 status: ${roomRes.status}`);
    if (roomRes.status !== 200) throw new Error('Consultation room check failed');
    console.log('✓ Video consultation signaling endpoint regression check passed');

    console.log('\n======================================================');
    console.log('--- ALL PRESCRIPTION MODULE TESTS PASSED WITH 100% SUCCESS! ---');
    console.log('======================================================');
  } finally {
    server.close();
  }
}

runTests().catch((e) => {
  console.error('Test suite failed:', e);
  process.exit(1);
});
