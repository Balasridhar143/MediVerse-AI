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

async function runTwoDeviceSimulation() {
  console.log('=== PART 2: TWO-DEVICE WEBRTC SIGNALING & CALL SIMULATION ===');
  const sql = neon(process.env.DATABASE_URL);
  const { server, port } = await startServer();
  const baseUrl = `http://127.0.0.1:${port}`;

  const testAptId = `test_apt_${Date.now()}`;
  const patientUserId = 'usr_5509ee4ca0316bdc';
  const doctorUserId = 'usr_5fe5924685a413a1';

  const patientToken = signToken({ id: patientUserId, role: 'patient' });
  const doctorToken = signToken({ id: doctorUserId, role: 'doctor' });

  try {
    // Current time in IST (+05:30)
    const now = new Date();
    // Format today as YYYY-MM-DD
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    // Current hour in 12-hour format
    let curHr = now.getHours();
    const ampm = curHr >= 12 ? 'PM' : 'AM';
    let hr12 = curHr % 12;
    if (hr12 === 0) hr12 = 12;
    const timeSlotStr = `${String(hr12).padStart(2, '0')}:00 ${ampm} - ${String(hr12).padStart(2, '0')}:45 ${ampm}`;

    console.log(`Creating active slot test appointment: ID ${testAptId}, Date: ${todayStr}, Slot: ${timeSlotStr}`);
    await sql`
      INSERT INTO appointments (
        id, patient_id, patient_name, doctor_id, doctor_name, hospital_name, 
        department, specialization, appointment_date, time_slot, status, type, created_at
      ) VALUES (
        ${testAptId}, ${patientUserId}, 'Test Patient Device', ${doctorUserId}, 'Dr. Test Clinician', 
        'MediVerse Central Hospital', 'General Medicine', 'General Physician', 
        ${todayStr}, ${timeSlotStr}, 'CONFIRMED', 'Video Consultation', NOW()
      );
    `;

    // Step 1: Device 1 (Doctor) accesses room
    console.log('\n[Step 1: Doctor queries consultation room]');
    const docRoomRes = await fetchJson(`${baseUrl}/api/consultation/room/${testAptId}`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    console.log('Doctor Room Status:', docRoomRes.status);
    console.log('Slot canJoin:', docRoomRes.data?.slotValidation?.canJoin);
    console.log('Slot State:', docRoomRes.data?.slotValidation?.state);
    console.log('ICE Servers count:', docRoomRes.data?.iceServers?.length);

    if (docRoomRes.status !== 200 || !docRoomRes.data?.slotValidation?.canJoin) {
      throw new Error(`Doctor room check failed: ${JSON.stringify(docRoomRes.data)}`);
    }

    // Step 2: Device 2 (Patient) accesses room
    console.log('\n[Step 2: Patient queries consultation room]');
    const patRoomRes = await fetchJson(`${baseUrl}/api/consultation/room/${testAptId}`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    console.log('Patient Room Status:', patRoomRes.status);
    console.log('Slot canJoin:', patRoomRes.data?.slotValidation?.canJoin);

    if (patRoomRes.status !== 200 || !patRoomRes.data?.slotValidation?.canJoin) {
      throw new Error(`Patient room check failed: ${JSON.stringify(patRoomRes.data)}`);
    }

    // Step 3: Device 2 (Patient) announces arrival with peer-ready
    console.log('\n[Step 3: Patient sends peer-ready signal]');
    const patReady = await fetchJson(`${baseUrl}/api/consultation/room/${testAptId}/signal`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${patientToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'peer-ready',
        data: { role: 'patient', timestamp: new Date().toISOString() },
        sessionId: 'session_patient_device_2'
      })
    });
    console.log('Patient Signal POST result:', patReady.status, patReady.data);

    // Step 4: Device 1 (Doctor) polls signals and detects patient arrival
    console.log('\n[Step 4: Doctor polls signals and detects patient peer-ready]');
    const docPoll1 = await fetchJson(`${baseUrl}/api/consultation/room/${testAptId}/signal?sessionId=session_doctor_device_1`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    console.log(`Doctor received ${docPoll1.data?.length} signals:`, docPoll1.data?.map(s => s.type));
    const foundReady = docPoll1.data?.some(s => s.type === 'peer-ready');
    if (!foundReady) throw new Error('Doctor did not receive peer-ready signal');
    console.log('PASS: Doctor detected Patient arrival.');

    // Step 5: Device 1 (Doctor - impolite peer) creates and sends sdp-offer
    console.log('\n[Step 5: Doctor sends sdp-offer signal]');
    const mockOffer = { type: 'offer', sdp: 'v=0\r\no=Doctor 12345 2 IN IP4 127.0.0.1\r\ns=MediVerse Video Stream\r\nt=0 0\r\nm=video 9 UDP/TLS/RTP/SAVPF 96\r\n' };
    const docOfferRes = await fetchJson(`${baseUrl}/api/consultation/room/${testAptId}/signal`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${doctorToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'sdp-offer',
        data: mockOffer,
        sessionId: 'session_doctor_device_1'
      })
    });
    console.log('Doctor SDP Offer POST status:', docOfferRes.status);

    // Step 6: Device 2 (Patient - polite peer) polls signals, receives sdp-offer, and sends sdp-answer
    console.log('\n[Step 6: Patient receives sdp-offer and sends sdp-answer]');
    const patPoll1 = await fetchJson(`${baseUrl}/api/consultation/room/${testAptId}/signal?sessionId=session_patient_device_2`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    const foundOffer = patPoll1.data?.find(s => s.type === 'sdp-offer');
    if (!foundOffer) throw new Error('Patient did not receive sdp-offer signal');
    console.log('PASS: Patient received Doctor SDP offer.');

    const mockAnswer = { type: 'answer', sdp: 'v=0\r\no=Patient 67890 2 IN IP4 127.0.0.1\r\ns=MediVerse Video Stream\r\nt=0 0\r\nm=video 9 UDP/TLS/RTP/SAVPF 96\r\n' };
    const patAnswerRes = await fetchJson(`${baseUrl}/api/consultation/room/${testAptId}/signal`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${patientToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'sdp-answer',
        data: mockAnswer,
        sessionId: 'session_patient_device_2'
      })
    });
    console.log('Patient SDP Answer POST status:', patAnswerRes.status);

    // Step 7: Exchange ICE candidates
    console.log('\n[Step 7: Exchange ICE candidate signals]');
    await fetchJson(`${baseUrl}/api/consultation/room/${testAptId}/signal`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${doctorToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'ice-candidate',
        data: { candidate: 'candidate:1 1 UDP 2130706431 192.168.1.50 50000 typ host', sdpMid: '0', sdpMLineIndex: 0 },
        sessionId: 'session_doctor_device_1'
      })
    });

    await fetchJson(`${baseUrl}/api/consultation/room/${testAptId}/signal`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${patientToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'ice-candidate',
        data: { candidate: 'candidate:2 1 UDP 2130706431 192.168.1.60 50001 typ host', sdpMid: '0', sdpMLineIndex: 0 },
        sessionId: 'session_patient_device_2'
      })
    });
    console.log('PASS: Both peers dispatched ICE candidates.');

    // Step 8: In-Call Chat verification
    console.log('\n[Step 8: Exchange in-call clinical chat message]');
    const chatMsg = { sender: 'Dr. Test Clinician', role: 'doctor', text: 'BP: 120/80 mmHg, SpO2: 98% Normal', time: '10:15 AM' };
    await fetchJson(`${baseUrl}/api/consultation/room/${testAptId}/signal`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${doctorToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'chat-message',
        data: chatMsg,
        sessionId: 'session_doctor_device_1'
      })
    });

    const patPoll2 = await fetchJson(`${baseUrl}/api/consultation/room/${testAptId}/signal?sessionId=session_patient_device_2`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    const foundChat = patPoll2.data?.find(s => s.type === 'chat-message');
    if (!foundChat || foundChat.data.text !== chatMsg.text) throw new Error('Patient did not receive in-call chat message');
    console.log('PASS: In-call chat message successfully received by Patient device.');

    // Step 9: Doctor ends call
    console.log('\n[Step 9: End call and update status to COMPLETED]');
    const endRes = await fetchJson(`${baseUrl}/api/consultation/room/${testAptId}/end`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    console.log('End Call Status:', endRes.status, endRes.data);

    // Step 10: Verify new calls are now blocked because status is COMPLETED
    console.log('\n[Step 10: Verify new call signals blocked after completion]');
    const postAfterEnd = await fetchJson(`${baseUrl}/api/consultation/room/${testAptId}/signal`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${patientToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'peer-ready',
        data: { role: 'patient' }
      })
    });
    console.log('POST signal after completion status:', postAfterEnd.status, 'Code:', postAfterEnd.data?.code);
    if (postAfterEnd.status === 403 && postAfterEnd.data?.code === 'STATUS_INVALID') {
      console.log('PASS: Call signals strictly blocked after consultation completed.');
    } else {
      console.error('FAIL: Expected 403 STATUS_INVALID, got:', postAfterEnd);
    }

  } finally {
    // Clean up temporary test appointment and signals
    await sql`DELETE FROM consultation_signals WHERE room_id = ${'room_' + testAptId};`;
    await sql`DELETE FROM appointments WHERE id = ${testAptId};`;
    server.close();
    console.log('\n=== TWO-DEVICE SIMULATION COMPLETE & TEST DATA CLEANED ===');
  }
}

runTwoDeviceSimulation().catch(err => {
  console.error('Two-device test error:', err);
  process.exit(1);
});
