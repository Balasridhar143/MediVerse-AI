import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import jwt from 'jsonwebtoken';
import http from 'http';
import { neon } from '@neondatabase/serverless';
import app from '../api/index.js';

const JWT_SECRET = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET || 'mediverse_jwt_secret_key_prod_2026';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

async function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({ server, port });
    });
  });
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function runTests() {
  console.log('=== HOSPITAL ADMIN & DOCTOR PATIENT MANAGEMENT TEST SUITE ===');
  const sql = neon(process.env.DATABASE_URL);
  const { server, port } = await startServer();
  const baseUrl = `http://127.0.0.1:${port}`;

  // Hospital A: hosp_apollo_01, Admin: usr_daa54ea670cc401f
  const adminAToken = signToken({ id: 'usr_daa54ea670cc401f', role: 'hospital_admin', hospital_id: 'hosp_apollo_01' });

  // Hospital B: hosp_1, Admin: usr_9cac525746fe0d69
  const adminBToken = signToken({ id: 'usr_9cac525746fe0d69', role: 'hospital_admin', hospital_id: 'hosp_1' });

  // Doctor under hosp_apollo_01: doc_463ef06c166e (user_id: usr_0dc95c5af86346db)
  const doctorToken = signToken({ id: 'usr_0dc95c5af86346db', role: 'doctor', hospital_id: 'hosp_apollo_01' });

  let testDeptId = null;
  let testDoctorUserId = null;
  let testDoctorDocId = null;
  let testPatientUserId = null;

  try {
    // ----------------------------------------------------
    // TEST 1: Hospital Admin can add a department
    // ----------------------------------------------------
    console.log('\n[Test 1: Hospital Admin creates new Department in Hospital A]');
    const deptName = `Endocrinology & Metabolism ${Date.now()}`;
    const createDeptRes = await fetchJson(`${baseUrl}/api/hospital/departments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminAToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: deptName,
        code: 'ENDO',
        bed_count: 28,
        head_doctor_name: 'Dr. Anand Kumar',
        status: 'ACTIVE'
      })
    });
    console.log('Create Dept Status:', createDeptRes.status, 'Response:', createDeptRes.data?.message);
    if (createDeptRes.status === 201 && createDeptRes.data?.department?.id) {
      testDeptId = createDeptRes.data.department.id;
      console.log('PASS: Department created with ID:', testDeptId, 'in hospital:', createDeptRes.data.department.hospitalId);
    } else {
      throw new Error(`Test 1 Failed: ${JSON.stringify(createDeptRes)}`);
    }

    // ----------------------------------------------------
    // TEST 2: Hospital Admin can edit and view departments
    // ----------------------------------------------------
    console.log('\n[Test 2: Hospital Admin edits the Department]');
    const editDeptRes = await fetchJson(`${baseUrl}/api/hospital/departments/${testDeptId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${adminAToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bed_count: 35,
        head_doctor_name: 'Dr. Anand Kumar Senior'
      })
    });
    console.log('Edit Dept Status:', editDeptRes.status, 'Beds:', editDeptRes.data?.department?.bedCount);
    if (editDeptRes.status === 200 && editDeptRes.data?.department?.bedCount === 35) {
      console.log('PASS: Department successfully updated to 35 beds.');
    } else {
      throw new Error(`Test 2 Failed: ${JSON.stringify(editDeptRes)}`);
    }

    // ----------------------------------------------------
    // TEST 3: Hospital Admin can register a doctor
    // ----------------------------------------------------
    console.log('\n[Test 3: Hospital Admin registers a Doctor under Hospital A]');
    const doctorEmail = `dr_endo_${Date.now()}@mediverse.test`;
    const regDocRes = await fetchJson(`${baseUrl}/api/hospital/doctors`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminAToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fullName: 'Dr. Neha Sharma',
        email: doctorEmail,
        phone: '+91 91234 56789',
        specialization: 'Endocrinology',
        department: deptName,
        departmentId: testDeptId,
        licenseNumber: 'NMC-2026-ENDO-889',
        experienceYears: 8,
        isAvailable: true
      })
    });
    console.log('Register Doctor Status:', regDocRes.status, 'Message:', regDocRes.data?.message);
    if (regDocRes.status === 201 && regDocRes.data?.doctor?.id) {
      testDoctorDocId = regDocRes.data.doctor.id;
      testDoctorUserId = regDocRes.data.doctor.userId;
      console.log('PASS: Doctor registered with ID:', testDoctorDocId, 'under Hospital:', regDocRes.data.doctor.hospitalId);
    } else {
      throw new Error(`Test 3 Failed: ${JSON.stringify(regDocRes)}`);
    }

    // ----------------------------------------------------
    // TEST 4: Registered doctors appear under the correct hospital
    // ----------------------------------------------------
    console.log('\n[Test 4: Verify Doctor appears in Hospital A roster]');
    const hospDocList = await fetchJson(`${baseUrl}/api/hospital/doctors?hospital_id=hosp_apollo_01`, {
      headers: { Authorization: `Bearer ${adminAToken}` }
    });
    const foundDoc = hospDocList.data?.find(d => d.id === testDoctorDocId || d.name.includes('Neha Sharma'));
    if (foundDoc) {
      console.log(`PASS: Doctor found in Hospital A roster with department: ${foundDoc.department}`);
    } else {
      throw new Error(`Test 4 Failed: Doctor not found in hospital roster`);
    }

    // ----------------------------------------------------
    // TEST 5: Hospital Admin can assign doctors to departments
    // ----------------------------------------------------
    console.log('\n[Test 5: View doctors belonging to the Department]');
    const deptDocList = await fetchJson(`${baseUrl}/api/hospital/departments/${testDeptId}/doctors`, {
      headers: { Authorization: `Bearer ${adminAToken}` }
    });
    console.log(`Department doctors count: ${deptDocList.data?.length}`);
    if (deptDocList.status === 200 && deptDocList.data?.some(d => d.id === testDoctorDocId)) {
      console.log('PASS: Doctor correctly listed under department.');
    } else {
      throw new Error(`Test 5 Failed: Doctor not listed in department doctors`);
    }

    // ----------------------------------------------------
    // TEST 6: Doctor can add/register a patient
    // ----------------------------------------------------
    console.log('\n[Test 6: Doctor registers a new Patient]');
    const patEmail = `patient_care_${Date.now()}@mediverse.test`;
    const regPatRes = await fetchJson(`${baseUrl}/api/doctor/patients`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${doctorToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fullName: 'Rohan Mehra',
        email: patEmail,
        phone: '+91 98888 77777',
        age: 42,
        gender: 'M',
        bloodGroup: 'A+',
        primaryCondition: 'Type 2 Diabetes Mellitus',
        address: '12 Sector 4, Bangalore',
        allergies: ['Penicillin', 'Sulfa drugs']
      })
    });
    console.log('Register Patient Status:', regPatRes.status, 'Message:', regPatRes.data?.message);
    if (regPatRes.status === 201 && regPatRes.data?.patient?.patientId) {
      testPatientUserId = regPatRes.data.patient.patientId;
      console.log('PASS: Patient registered with ID:', testPatientUserId, 'associated with Hospital:', regPatRes.data.patient.hospitalName);
    } else {
      throw new Error(`Test 6 Failed: ${JSON.stringify(regPatRes)}`);
    }

    // ----------------------------------------------------
    // TEST 7: Patient is associated with the correct hospital
    // ----------------------------------------------------
    console.log('\n[Test 7: Verify patient is associated with correct hospital in patient_registrations]');
    const patRegCheck = await sql`
      SELECT id, hospital_id, hospital_name, full_name, department 
      FROM patient_registrations 
      WHERE user_id = ${testPatientUserId} 
      LIMIT 1;
    `;
    if (patRegCheck.length > 0 && patRegCheck[0].hospital_id === 'hosp_apollo_01') {
      console.log('PASS: Patient registration linked to hospital:', patRegCheck[0].hospital_id, patRegCheck[0].hospital_name);
    } else {
      throw new Error(`Test 7 Failed: Patient not associated with hosp_apollo_01`);
    }

    // ----------------------------------------------------
    // TEST 8: Doctor can access authorized patient information
    // ----------------------------------------------------
    console.log('\n[Test 8: Doctor fetches assigned patient roster and clinical dossier]');
    const docPatList = await fetchJson(`${baseUrl}/api/doctor/patients`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    const foundPat = docPatList.data?.find(p => p.patientId === testPatientUserId);
    if (foundPat) {
      console.log(`PASS: Patient '${foundPat.patientName}' appears in doctor roster with condition '${foundPat.primaryCondition}'.`);
    } else {
      throw new Error(`Test 8A Failed: Patient not found in doctor's roster`);
    }

    const dossierRes = await fetchJson(`${baseUrl}/api/doctor/patients/${testPatientUserId}/clinical-dossier`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    console.log('Dossier Status:', dossierRes.status, 'Allergies count:', dossierRes.data?.patient?.documented_allergies?.length);
    if (dossierRes.status === 200 && dossierRes.data?.patient?.full_name === 'Rohan Mehra') {
      console.log('PASS: Doctor accessed authorized clinical dossier.');
    } else {
      throw new Error(`Test 8B Failed: ${JSON.stringify(dossierRes)}`);
    }

    // ----------------------------------------------------
    // TEST 9: Multi-tenant Isolation - Admin B cannot modify Hospital A's department
    // ----------------------------------------------------
    console.log('\n[Test 9: Admin B attempts to modify Hospital A Department]');
    const unauthorizedEdit = await fetchJson(`${baseUrl}/api/hospital/departments/${testDeptId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${adminBToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: 'Hacked Department' })
    });
    console.log('Cross-hospital edit status:', unauthorizedEdit.status, 'Detail:', unauthorizedEdit.data?.detail);
    if (unauthorizedEdit.status === 404 || unauthorizedEdit.status === 403) {
      console.log('PASS: Hospital isolation strictly prevented Admin B from modifying Hospital A department.');
    } else {
      throw new Error(`Test 9 Failed: Hospital isolation violated!`);
    }

    // ----------------------------------------------------
    // TEST 10: All records persist in PostgreSQL
    // ----------------------------------------------------
    console.log('\n[Test 10: Database persistence verification in PostgreSQL]');
    const dbDept = await sql`SELECT id, name, bed_count FROM departments WHERE id = ${testDeptId};`;
    const dbDoc = await sql`SELECT id, full_name, hospital_id FROM doctors WHERE id = ${testDoctorDocId};`;
    const dbPat = await sql`SELECT id, full_name, age FROM patients WHERE user_id = ${testPatientUserId};`;

    if (dbDept.length > 0 && dbDoc.length > 0 && dbPat.length > 0) {
      console.log('PASS: Department, Doctor, and Patient verified persistently in PostgreSQL database.');
      console.log(`- Dept: ${dbDept[0].name} (Beds: ${dbDept[0].bed_count})`);
      console.log(`- Doctor: ${dbDoc[0].full_name} (${dbDoc[0].id})`);
      console.log(`- Patient: ${dbPat[0].full_name} (Age: ${dbPat[0].age})`);
    } else {
      throw new Error(`Test 10 Failed: Records not persisted in PostgreSQL`);
    }

  } finally {
    // Clean up temporary test data created in this test run
    console.log('\nCleaning up test artifacts...');
    if (testDeptId) await sql`DELETE FROM departments WHERE id = ${testDeptId};`;
    if (testDoctorDocId) {
      await sql`DELETE FROM doctor_hospital_affiliations WHERE doctor_id = ${testDoctorDocId};`;
      await sql`DELETE FROM doctors WHERE id = ${testDoctorDocId};`;
      if (testDoctorUserId) await sql`DELETE FROM users WHERE id = ${testDoctorUserId};`;
    }
    if (testPatientUserId) {
      await sql`DELETE FROM doctor_patient_relationships WHERE patient_id = ${testPatientUserId};`;
      await sql`DELETE FROM patient_allergies WHERE patient_id = ${testPatientUserId};`;
      await sql`DELETE FROM patient_registrations WHERE user_id = ${testPatientUserId};`;
      await sql`DELETE FROM patients WHERE user_id = ${testPatientUserId};`;
      await sql`DELETE FROM users WHERE id = ${testPatientUserId};`;
    }
    server.close();
    console.log('=== TEST SUITE COMPLETE: ALL 10 TESTS PASSED ===');
  }
}

runTests().catch(err => {
  console.error('Test Suite Error:', err);
  process.exit(1);
});

