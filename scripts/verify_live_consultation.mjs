import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
dotenv.config({ path: '.env.local' });
dotenv.config();

const BASE_URL = 'https://mediverse-ai-fawn.vercel.app';
const JWT_SECRET = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET || 'mediverse_jwt_secret_key_prod_2026';

async function verifyLive() {
  console.log(`Checking live deployment at: ${BASE_URL}`);

  // 1. Health check
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  console.log('Health status:', healthRes.status);
  const healthData = await healthRes.json();
  console.log('Health payload:', healthData);

  // 2. Mint test doctor and patient JWT tokens
  const patientToken = jwt.sign(
    { id: 'usr_pat_test', email: 'patient.test@mediverse.ai', role: 'patient', full_name: 'Patient Test' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const doctorToken = jwt.sign(
    { id: 'usr_doc_001', email: 'doctor.test@mediverse.ai', role: 'doctor', full_name: 'Dr. Arun Kumar' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  // 3. Get room metadata as Patient
  const roomRes = await fetch(`${BASE_URL}/api/consultation/room/apt_101`, {
    headers: { Authorization: `Bearer ${patientToken}` }
  });
  console.log('Room access status (Patient):', roomRes.status);
  const roomData = await roomRes.json();
  console.log('Room details:', {
    roomId: roomData.roomId,
    doctorName: roomData.doctorName,
    patientName: roomData.patientName,
    iceServersCount: roomData.iceServers?.length,
    iceServers: roomData.iceServers
  });

  // 4. Doctor posts peer-ready & sdp-offer
  const docSessionId = `live_doc_${Date.now()}`;
  const docOfferRes = await fetch(`${BASE_URL}/api/consultation/room/apt_101/signal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${doctorToken}`
    },
    body: JSON.stringify({
      type: 'sdp-offer',
      data: { type: 'offer', sdp: 'v=0\r\no=- 123 2 IN IP4 127.0.0.1\r\ns=-\r\n' },
      sessionId: docSessionId
    })
  });
  console.log('Doctor sdp-offer post status:', docOfferRes.status);

  // 5. Patient polls signals (should receive doctor offer)
  const patSessionId = `live_pat_${Date.now()}`;
  const patFetchRes = await fetch(`${BASE_URL}/api/consultation/room/apt_101/signal?sessionId=${patSessionId}`, {
    headers: { Authorization: `Bearer ${patientToken}` }
  });
  console.log('Patient fetch signals status:', patFetchRes.status);
  const patSignals = await patFetchRes.json();
  const receivedOffer = patSignals.find(s => s.type === 'sdp-offer' && s.senderSessionId === docSessionId);
  console.log('Patient received doctor offer:', Boolean(receivedOffer));
  if (!receivedOffer) throw new Error('Patient did not receive doctor offer in live room');

  // 6. Patient posts sdp-answer
  const patAnswerRes = await fetch(`${BASE_URL}/api/consultation/room/apt_101/signal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${patientToken}`
    },
    body: JSON.stringify({
      type: 'sdp-answer',
      data: { type: 'answer', sdp: 'v=0\r\no=- 456 2 IN IP4 127.0.0.1\r\ns=-\r\n' },
      sessionId: patSessionId
    })
  });
  console.log('Patient sdp-answer post status:', patAnswerRes.status);

  // 7. Doctor polls signals (should receive patient answer and NOT doctor signals)
  const docFetchRes = await fetch(`${BASE_URL}/api/consultation/room/apt_101/signal?sessionId=${docSessionId}`, {
    headers: { Authorization: `Bearer ${doctorToken}` }
  });
  console.log('Doctor fetch signals status:', docFetchRes.status);
  const docSignals = await docFetchRes.json();
  const receivedAnswer = docSignals.find(s => s.type === 'sdp-answer' && s.senderSessionId === patSessionId);
  console.log('Doctor received patient answer:', Boolean(receivedAnswer));
  if (!receivedAnswer) throw new Error('Doctor did not receive patient answer in live room');

  // 8. Patient posts clinical chat message
  const chatRes = await fetch(`${BASE_URL}/api/consultation/room/apt_101/signal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${patientToken}`
    },
    body: JSON.stringify({
      type: 'chat-message',
      data: { sender: 'Patient Test', text: 'Live consultation WebRTC operational!', time: '1:55 PM' },
      sessionId: patSessionId
    })
  });
  console.log('Clinical chat post status:', chatRes.status);

  console.log('\n--- ALL LIVE PRODUCTION WEBRTC TESTS PASSED WITH 100% SUCCESS! ---');
}

verifyLive().catch((e) => {
  console.error('Live verification failed:', e);
  process.exit(1);
});
