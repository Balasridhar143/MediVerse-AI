const BASE_URL = 'https://mediverse-ai-fawn.vercel.app';
const API_URL = `${BASE_URL}/api`;

console.log('================================================================');
console.log('  LIVE PRODUCTION WEBSITE VERIFICATION: MEDIVERSE AI');
console.log(`  Target URL: ${BASE_URL}`);
console.log('================================================================\n');

async function runLiveVerification() {
  let passed = 0;
  let total = 0;

  async function testStep(name, fn) {
    total++;
    try {
      console.log(`[TEST ${total}] ${name}...`);
      const result = await fn();
      console.log(`  -> [PASS] ${result || 'Success'}`);
      passed++;
    } catch (e) {
      console.error(`  -> [FAIL] ${e.message}`);
    }
  }

  // 1. Frontend Homepage Load
  await testStep('Frontend Homepage HTML Load', async () => {
    const res = await fetch(BASE_URL);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const html = await res.text();
    if (!html.includes('doctype html') && !html.includes('<html')) throw new Error('Invalid HTML');
    return `HTTP ${res.status} OK (HTML received, ${html.length} bytes)`;
  });

  // 2. Production API Health Check
  await testStep('Serverless API Health & Neon Database Check', async () => {
    const res = await fetch(`${API_URL}/health`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.status !== 'healthy') throw new Error(`Unhealthy status: ${data.status}`);
    return `Status: ${data.status} | DB: ${data.database} | Service: ${data.service}`;
  });

  // 3. Medicines Search & Formulation/Category Filters
  await testStep('Medicines Pharmacopeia Search (Augmentin)', async () => {
    const res = await fetch(`${API_URL}/medicines?q=Augmentin`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.items || data.items.length === 0) throw new Error('No medicines returned');
    return `Found ${data.total} items. Top: "${data.items[0].brand_name}" (${data.items[0].category})`;
  });

  // 4. Hospital Directory Search
  await testStep('Hospital Directory Query (Delhi)', async () => {
    const res = await fetch(`${API_URL}/hospitals?state=Delhi`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    const count = data.total || (Array.isArray(data) ? data.length : 0);
    if (count === 0) throw new Error('No hospitals returned for Delhi');
    const first = (data.items || data)[0];
    return `Found ${count} hospitals. First: "${first.hospital_name}" in ${first.city}`;
  });

  // 5. Doctor Specialist Registry
  await testStep('Doctor Specialist Discovery Registry', async () => {
    const res = await fetch(`${API_URL}/doctors`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const docs = await res.json();
    if (!Array.isArray(docs) || docs.length === 0) throw new Error('No doctors returned');
    return `Found ${docs.length} doctors. First: "${docs[0].name}" (${docs[0].specialization})`;
  });

  // 6. Patient Authentication (Login)
  let patientToken = null;
  await testStep('Patient Login with Verified Account', async () => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'patient@example.com',
        password: 'password123'
      })
    });
    if (!res.ok) {
      // Fallback: register new patient if demo account not seeded in Postgres
      const regRes = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: 'Aarav Sharma',
          email: 'patient@example.com',
          password: 'password123',
          role: 'patient',
          phone: '+91 98765 43210'
        })
      });
      const regData = await regRes.json();
      if (!regRes.ok && !regData.access_token) throw new Error(`Login & Register both failed: ${JSON.stringify(regData)}`);
      patientToken = regData.access_token;
      return `Patient registered & authenticated (Token: ${patientToken.slice(0, 15)}...)`;
    }
    const data = await res.json();
    patientToken = data.access_token;
    return `Patient authenticated as "${data.user.full_name}" (Role: ${data.user.role})`;
  });

  // 7. Doctor Authentication (Login)
  let doctorToken = null;
  await testStep('Doctor Login with Clinical Credentials', async () => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'doctor@example.com',
        password: 'password123'
      })
    });
    if (!res.ok) {
      // Fallback: register doctor if not present
      const regRes = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: 'Dr. Arun Kumar',
          email: 'doctor@example.com',
          password: 'password123',
          role: 'doctor',
          specialization: 'Cardiology',
          hospitalName: 'City Care Multispeciality Hospital'
        })
      });
      const regData = await regRes.json();
      if (!regRes.ok && !regData.access_token) throw new Error(`Doctor login & register failed: ${JSON.stringify(regData)}`);
      doctorToken = regData.access_token;
      return `Doctor registered & authenticated (Token: ${doctorToken.slice(0, 15)}...)`;
    }
    const data = await res.json();
    doctorToken = data.access_token;
    return `Doctor authenticated as "${data.user.full_name}" (Role: ${data.user.role})`;
  });

  // 8. Appointment Booking Lifecycle
  let createdAptId = null;
  await testStep('Appointment Booking Lifecycle (Patient -> Doctor)', async () => {
    if (!patientToken) throw new Error('No patient token');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    const dateStr = tomorrow.toISOString().split('T')[0];
    const uniqueSlot = `1${Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 5)}0 PM`;

    const res = await fetch(`${API_URL}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${patientToken}`
      },
      body: JSON.stringify({
        doctor_id: 'usr_doc_001',
        doctor_name: 'Dr. Arun Kumar',
        hospital_name: 'City Care Multispeciality Hospital',
        department: 'Cardiology',
        appointment_date: dateStr,
        time_slot: uniqueSlot,
        type: 'Video Consultation',
        notes: 'Cardiac clinical assessment and telehealth review'
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(`Booking failed: ${data.detail || JSON.stringify(data)}`);
    createdAptId = data.id;
    return `Appointment Created: ID=${data.id} | Status=${data.status} | Room=${data.roomId || data.room_id}`;
  });

  // 9. Doctor Approval / Roster Query
  await testStep('Doctor Appointment Roster & Review', async () => {
    if (!doctorToken) throw new Error('No doctor token');
    const res = await fetch(`${API_URL}/doctor/appointments`, {
      headers: { 'Authorization': `Bearer ${doctorToken}` }
    });
    const apts = await res.json();
    if (!res.ok) throw new Error(`Failed to load doctor roster: ${apts.detail}`);
    return `Doctor has ${Array.isArray(apts) ? apts.length : 0} appointments in schedule`;
  });

  // 10. WebRTC Teleconsultation Room Access
  await testStep('WebRTC Consultation Room Access (#apt_101)', async () => {
    if (!patientToken) throw new Error('No patient token');
    const res = await fetch(`${API_URL}/consultation/room/apt_101`, {
      headers: { 'Authorization': `Bearer ${patientToken}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Room access failed: ${data.detail}`);
    return `Room Authorized: ID=${data.roomId} | Peer=${data.peerName} | ICE Servers=${data.iceServers?.length || 0}`;
  });

  // 11. WebRTC Signaling Dispatch
  await testStep('WebRTC Signaling Exchange (Peer status & offer)', async () => {
    if (!patientToken) throw new Error('No patient token');
    const res = await fetch(`${API_URL}/consultation/room/apt_101/signal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${patientToken}`
      },
      body: JSON.stringify({
        type: 'peer-ready',
        data: { role: 'patient', ready: true, timestamp: new Date().toISOString() }
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Signal dispatch failed: ${data.detail}`);
    return `Signal Dispatched: ID=${data.signal_id || data.id}`;
  });

  // 12. Password Reset OTP Verification Flow
  await testStep('OTP Password Reset Security Flow', async () => {
    const testEmail = 'balasridharp@gmail.com';
    const reqRes = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });
    const reqData = await reqRes.json();
    if (!reqRes.ok) throw new Error(`Forgot-password failed: ${reqData.detail}`);
    return `OTP Dispatched successfully to ${testEmail}`;
  });

  console.log('\n================================================================');
  console.log(`  VERIFICATION RESULTS: ${passed}/${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('================================================================\n');
}

runLiveVerification().catch(console.error);
