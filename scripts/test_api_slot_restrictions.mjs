import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import jwt from 'jsonwebtoken';
import http from 'http';
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

async function runApiTests() {
  console.log('--- PART 1: API ENDPOINT RESTRICTION TESTS ---');
  const { server, port } = await startServer();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // Known appointment in DB:
    // apt_8bca80866af7: date 2026-11-01 09:00 AM (FUTURE / BEFORE_SLOT)
    // patient: usr_5509ee4ca0316bdc
    // doctor: usr_5fe5924685a413a1
    const patientToken = signToken({ id: 'usr_5509ee4ca0316bdc', role: 'patient' });
    const doctorToken = signToken({ id: 'usr_5fe5924685a413a1', role: 'doctor' });
    const unauthorizedPatientToken = signToken({ id: 'usr_imposter_pat', role: 'patient' });
    const unauthorizedDoctorToken = signToken({ id: 'usr_imposter_doc', role: 'doctor' });

    console.log('\n[Test A: Unauthorized Patient GET /consultation/room/:id]');
    const resA = await fetchJson(`${baseUrl}/api/consultation/room/apt_8bca80866af7`, {
      headers: { Authorization: `Bearer ${unauthorizedPatientToken}` }
    });
    console.log(`Status: ${resA.status}, Code: ${resA.data?.code}`);
    if (resA.status === 403 && resA.data?.code === 'UNAUTHORIZED_PATIENT') {
      console.log('PASS: Unauthorized patient rejected with 403 UNAUTHORIZED_PATIENT.');
    } else {
      console.error('FAIL: Expected 403 UNAUTHORIZED_PATIENT, got:', resA);
    }

    console.log('\n[Test B: Unauthorized Doctor GET /consultation/room/:id]');
    const resB = await fetchJson(`${baseUrl}/api/consultation/room/apt_8bca80866af7`, {
      headers: { Authorization: `Bearer ${unauthorizedDoctorToken}` }
    });
    console.log(`Status: ${resB.status}, Code: ${resB.data?.code}`);
    if (resB.status === 403 && resB.data?.code === 'UNAUTHORIZED_DOCTOR') {
      console.log('PASS: Unauthorized doctor rejected with 403 UNAUTHORIZED_DOCTOR.');
    } else {
      console.error('FAIL: Expected 403 UNAUTHORIZED_DOCTOR, got:', resB);
    }

    console.log('\n[Test C: Authorized Patient GET /consultation/room/:id]');
    const resC = await fetchJson(`${baseUrl}/api/consultation/room/apt_8bca80866af7`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    console.log(`Status: ${resC.status}, Slot canJoin: ${resC.data?.slotValidation?.canJoin}, State: ${resC.data?.slotValidation?.state}`);
    if (resC.status === 200 && resC.data?.slotValidation?.canJoin === false) {
      console.log('PASS: Room metadata fetched with accurate slot restriction state (canJoin: false).');
    } else {
      console.error('FAIL: Expected 200 with canJoin: false, got:', resC);
    }

    console.log('\n[Test D: Starting Call via Signal POST Outside Allowed Window]');
    const resD = await fetchJson(`${baseUrl}/api/consultation/room/apt_8bca80866af7/signal`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${patientToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'peer-ready',
        data: { role: 'patient' }
      })
    });
    console.log(`Status: ${resD.status}, Code: ${resD.data?.code}, Detail: ${resD.data?.detail}`);
    if (resD.status === 403 && resD.data?.code === 'BEFORE_SLOT') {
      console.log('PASS: Call signal strictly blocked outside slot window with 403 BEFORE_SLOT.');
    } else {
      console.error('FAIL: Expected 403 BEFORE_SLOT, got:', resD);
    }

    console.log('\n[Test E: Non-Existent or Hardcoded Bypass Apt]');
    const resE = await fetchJson(`${baseUrl}/api/consultation/room/apt_101`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    console.log(`Status: ${resE.status}, Detail: ${resE.data?.detail}`);
    if (resE.status === 404) {
      console.log('PASS: Non-existent appointment / bypass strictly blocked with 404.');
    } else {
      console.error('FAIL: Expected 404 for non-existent appointment, got:', resE);
    }

  } finally {
    server.close();
  }
  console.log('\n--- ALL API RESTRICTION TESTS FINISHED ---');
}

runApiTests().catch(err => {
  console.error('API Test Error:', err);
  process.exit(1);
});
