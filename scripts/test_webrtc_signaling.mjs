import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL is not configured');
const sql = neon(DATABASE_URL);

async function runTest() {
  console.log('--- Starting WebRTC Signaling & Database Verification ---');

  // Ensure tables and column exist
  await sql`
    CREATE TABLE IF NOT EXISTS consultation_signals (
      id VARCHAR(64) PRIMARY KEY,
      room_id VARCHAR(64) NOT NULL,
      sender_id VARCHAR(64) NOT NULL,
      sender_role VARCHAR(32) NOT NULL,
      signal_type VARCHAR(64) NOT NULL,
      signal_data TEXT NOT NULL,
      sender_session_id VARCHAR(64),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='consultation_signals' AND column_name='sender_session_id') THEN
        ALTER TABLE consultation_signals ADD COLUMN sender_session_id VARCHAR(64);
      END IF;
    END $$;
  `;

  const roomId = 'room_apt_101';
  const doctorSessionId = `sess_doc_${crypto.randomBytes(4).toString('hex')}`;
  const patientSessionId = `sess_pat_${crypto.randomBytes(4).toString('hex')}`;

  console.log(`Doctor Session: ${doctorSessionId}`);
  console.log(`Patient Session: ${patientSessionId}`);

  // 1. Doctor sends peer-ready
  const docSigId1 = `sig_${crypto.randomBytes(6).toString('hex')}`;
  await sql`
    INSERT INTO consultation_signals (id, room_id, sender_id, sender_role, signal_type, signal_data, sender_session_id, created_at)
    VALUES (${docSigId1}, ${roomId}, 'usr_doc_001', 'doctor', 'peer-ready', ${JSON.stringify({ role: 'doctor', sessionId: doctorSessionId })}, ${doctorSessionId}, NOW());
  `;
  console.log('✓ Doctor dispatched peer-ready');

  // 2. Doctor sends sdp-offer
  const mockOffer = { type: 'offer', sdp: 'v=0\r\no=- 42 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\nm=video 9 UDP/TLS/RTP/SAVPF 96\r\n' };
  const docSigId2 = `sig_${crypto.randomBytes(6).toString('hex')}`;
  await sql`
    INSERT INTO consultation_signals (id, room_id, sender_id, sender_role, signal_type, signal_data, sender_session_id, created_at)
    VALUES (${docSigId2}, ${roomId}, 'usr_doc_001', 'doctor', 'sdp-offer', ${JSON.stringify(mockOffer)}, ${doctorSessionId}, NOW());
  `;
  console.log('✓ Doctor dispatched sdp-offer');

  // 3. Patient polls signals
  const patientFetched = await sql`
    SELECT id, sender_id, sender_role, signal_type, signal_data, sender_session_id
    FROM consultation_signals
    WHERE room_id = ${roomId}
      AND (sender_session_id IS NULL OR sender_session_id != ${patientSessionId})
      AND created_at >= NOW() - INTERVAL '15 minutes'
    ORDER BY created_at ASC;
  `;
  console.log(`Patient fetched ${patientFetched.length} signals`);
  const offerFound = patientFetched.find(s => s.signal_type === 'sdp-offer' && s.sender_session_id === doctorSessionId);
  if (!offerFound) throw new Error('Patient did not receive doctor sdp-offer');
  console.log('✓ Patient successfully received Doctor sdp-offer');

  // 4. Patient sends sdp-answer
  const mockAnswer = { type: 'answer', sdp: 'v=0\r\no=- 43 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\nm=video 9 UDP/TLS/RTP/SAVPF 96\r\n' };
  const patSigId1 = `sig_${crypto.randomBytes(6).toString('hex')}`;
  await sql`
    INSERT INTO consultation_signals (id, room_id, sender_id, sender_role, signal_type, signal_data, sender_session_id, created_at)
    VALUES (${patSigId1}, ${roomId}, 'usr_pat_001', 'patient', 'sdp-answer', ${JSON.stringify(mockAnswer)}, ${patientSessionId}, NOW());
  `;
  console.log('✓ Patient dispatched sdp-answer');

  // 5. Patient sends ICE candidates
  const mockIce = { candidate: 'candidate:1 1 UDP 2130706431 192.168.1.100 50000 typ host', sdpMid: '0', sdpMLineIndex: 0 };
  const patSigId2 = `sig_${crypto.randomBytes(6).toString('hex')}`;
  await sql`
    INSERT INTO consultation_signals (id, room_id, sender_id, sender_role, signal_type, signal_data, sender_session_id, created_at)
    VALUES (${patSigId2}, ${roomId}, 'usr_pat_001', 'patient', 'ice-candidate', ${JSON.stringify(mockIce)}, ${patientSessionId}, NOW());
  `;
  console.log('✓ Patient dispatched ice-candidate');

  // 6. Doctor polls signals
  const docFetched = await sql`
    SELECT id, sender_id, sender_role, signal_type, signal_data, sender_session_id
    FROM consultation_signals
    WHERE room_id = ${roomId}
      AND (sender_session_id IS NULL OR sender_session_id != ${doctorSessionId})
      AND created_at >= NOW() - INTERVAL '15 minutes'
    ORDER BY created_at ASC;
  `;
  console.log(`Doctor fetched ${docFetched.length} signals`);
  const answerFound = docFetched.find(s => s.signal_type === 'sdp-answer' && s.sender_session_id === patientSessionId);
  const iceFound = docFetched.find(s => s.signal_type === 'ice-candidate' && s.sender_session_id === patientSessionId);

  if (!answerFound) throw new Error('Doctor did not receive patient sdp-answer');
  if (!iceFound) throw new Error('Doctor did not receive patient ice-candidate');
  console.log('✓ Doctor successfully received Patient sdp-answer & ice-candidate');

  // 7. Verify Doctor does NOT receive their own signals
  const docSelfSignals = docFetched.filter(s => s.sender_session_id === doctorSessionId);
  if (docSelfSignals.length > 0) throw new Error('Doctor received its own signals!');
  console.log('✓ Verified: Doctor received 0 self-signals');

  // 8. Patient sends clinical chat
  const chatMsg = { sender: 'John Doe', role: 'patient', text: 'Hello Doctor, my BP reading is 120/80 mmHg.', time: '10:05 AM' };
  const patSigId3 = `sig_${crypto.randomBytes(6).toString('hex')}`;
  await sql`
    INSERT INTO consultation_signals (id, room_id, sender_id, sender_role, signal_type, signal_data, sender_session_id, created_at)
    VALUES (${patSigId3}, ${roomId}, 'usr_pat_001', 'patient', 'chat-message', ${JSON.stringify(chatMsg)}, ${patientSessionId}, NOW());
  `;
  console.log('✓ Patient dispatched clinical chat message');

  const docFetchedChat = await sql`
    SELECT id, signal_type, signal_data
    FROM consultation_signals
    WHERE room_id = ${roomId}
      AND signal_type = 'chat-message'
      AND sender_session_id = ${patientSessionId}
    LIMIT 1;
  `;
  if (!docFetchedChat || docFetchedChat.length === 0) throw new Error('Doctor failed to receive chat');
  console.log('✓ Doctor successfully received clinical chat message');

  console.log('\n--- ALL WEBRTC SIGNALING TESTS PASSED SUCCESSFULLY! ---');
}

runTest().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
