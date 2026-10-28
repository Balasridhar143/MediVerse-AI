import http from 'http';
import app from '../api/index.js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env.local
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else {
  dotenv.config();
}

const server = http.createServer(app);

server.listen(3001, async () => {
  console.log('[INFO] Serverless API testing server listening on port 3001');

  try {
    // 1. Test Health
    console.log('[TEST 1] Testing /api/health...');
    const hRes = await fetch('http://localhost:3001/api/health');
    const hData = await hRes.json();
    console.log('[PASS] Health check returned:', hData.status, hData.database);

    // 2. Test Patient Registration
    const testEmail = `patient_neon_${Date.now()}@example.com`;
    console.log(`[TEST 2] Registering Patient (${testEmail})...`);
    const regRes = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Anita Desai',
        email: testEmail,
        password: 'Password123!',
        role: 'patient',
        age: 34,
        gender: 'Female',
        blood_group: 'B+',
        phone: '+91 98765 11111',
        address: '12 Indiranagar, Bengaluru'
      })
    });
    const regData = await regRes.json();
    if (regRes.status !== 200) {
      throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
    }
    console.log('[PASS] Patient registered:', regData.user.id, regData.user.role, 'Token received:', !!regData.access_token);
    const token = regData.access_token;

    // 3. Test Duplicate Registration
    console.log('[TEST 3] Testing duplicate email rejection...');
    const dupRes = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Anita Desai Dup',
        email: testEmail,
        password: 'Password123!',
        role: 'patient'
      })
    });
    console.log(`[${dupRes.status === 400 ? 'PASS' : 'FAIL'}] Duplicate email rejected with status:`, dupRes.status);

    // 4. Test Doctor Registration
    const docEmail = `doctor_neon_${Date.now()}@example.com`;
    console.log(`[TEST 4] Registering Doctor (${docEmail})...`);
    const docRes = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Dr. Vikram Malhotra',
        email: docEmail,
        password: 'DoctorPass123!',
        role: 'doctor',
        specialization: 'Cardiology',
        licenseNumber: 'MCI-2026-9871',
        hospitalName: 'City Care Multispeciality Hospital'
      })
    });
    const docData = await docRes.json();
    console.log(`[${docRes.status === 200 ? 'PASS' : 'FAIL'}] Doctor registered:`, docData.user.id, docData.user.role);

    // 5. Test Hospital Admin Registration
    const adminEmail = `admin_neon_${Date.now()}@example.com`;
    console.log(`[TEST 5] Registering Hospital Admin (${adminEmail})...`);
    const admRes = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Suresh Patel',
        email: adminEmail,
        password: 'AdminPass123!',
        role: 'hospital_admin',
        hospitalName: 'Apollo Speciality Care',
        facilityId: 'hosp_apollo_01'
      })
    });
    const admData = await admRes.json();
    console.log(`[${admRes.status === 200 ? 'PASS' : 'FAIL'}] Hospital Admin registered:`, admData.user.id, admData.user.role);

    // 6. Test Login
    console.log('[TEST 6] Testing Login with registered patient...');
    const logRes = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'Password123!'
      })
    });
    const logData = await logRes.json();
    console.log(`[${logRes.status === 200 ? 'PASS' : 'FAIL'}] Login succeeded for user:`, logData.user.id, logData.user.full_name);

    // 7. Test /auth/me
    console.log('[TEST 7] Testing Protected /api/auth/me...');
    const meRes = await fetch('http://localhost:3001/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const meData = await meRes.json();
    console.log(`[${meRes.status === 200 ? 'PASS' : 'FAIL'}] /auth/me returned profile:`, meData.full_name, meData.email, meData.blood_group);

    // 8. Test Appointment Booking
    console.log('[TEST 8] Booking Patient Registration / Appointment...');
    const bookRes = await fetch('http://localhost:3001/api/registrations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        hospital_id: 'hosp_1',
        hospital_name: 'City Care Multispeciality Hospital',
        full_name: 'Anita Desai',
        phone: '+91 98765 11111',
        reason_for_visit: 'Routine Cardiac Checkup',
        department: 'Cardiology'
      })
    });
    const bookData = await bookRes.json();
    console.log(`[${bookRes.status === 201 ? 'PASS' : 'FAIL'}] Appointment booked:`, bookData.id, bookData.department);

    console.log('=== ALL SERVERLESS API TESTS PASSED SUCCESSFULLY ===');
  } catch (err) {
    console.error('[ERROR] Test failed:', err);
  } finally {
    server.close();
    process.exit(0);
  }
});
