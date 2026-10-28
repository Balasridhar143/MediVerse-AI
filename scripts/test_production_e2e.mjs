const PROD_URL = 'https://mediverse-ai-fawn.vercel.app/api';

async function runProductionTests() {
  console.log('=== RUNNING PRODUCTION E2E TESTS AGAINST DEPLOYED WEBSITE ===');
  console.log('Target URL:', PROD_URL);

  const timestamp = Date.now();

  // 1. Health Check
  console.log('\n[PROD TEST 1] Testing Health Endpoint...');
  const hRes = await fetch(`${PROD_URL}/health`);
  const hData = await hRes.json();
  if (hRes.status !== 200 || hData.status !== 'healthy') throw new Error(`Health check failed: ${JSON.stringify(hData)}`);
  console.log('  [PASS] Server & Neon PostgreSQL DB are healthy.');

  // 2. Patient Registration
  const pEmail = `synth_patient_${timestamp}@example.com`;
  console.log(`\n[PROD TEST 2] Registering Synthetic Patient (${pEmail})...`);
  const pRes = await fetch(`${PROD_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      full_name: 'Synthetic Patient Kavya',
      email: pEmail,
      password: 'Password123!',
      role: 'patient',
      age: 32,
      gender: 'Female',
      blood_group: 'B+',
      phone: '+91 98888 11111',
    }),
  });
  const pData = await pRes.json();
  if (pRes.status !== 200 || !pData.access_token) throw new Error(`Patient registration failed: ${JSON.stringify(pData)}`);
  const patientToken = pData.access_token;
  const patientId = pData.user.id;
  console.log(`  [PASS] Patient registered. User ID: ${patientId}`);

  // 3. Doctor Registration
  const dEmail = `synth_doctor_${timestamp}@example.com`;
  console.log(`\n[PROD TEST 3] Registering Synthetic Doctor (${dEmail})...`);
  const dRes = await fetch(`${PROD_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      full_name: 'Dr. Siddharth Sen (Synthetic Doctor)',
      email: dEmail,
      password: 'Password123!',
      role: 'doctor',
      specialization: 'Cardiology',
      department: 'Cardiology',
      license_number: `DOC-${timestamp}`,
      hospital_name: 'City Care Multispeciality Hospital',
      qualifications: 'MBBS, MD (Cardiology)',
      experience_years: 9,
    }),
  });
  const dData = await dRes.json();
  if (dRes.status !== 200 || !dData.access_token) throw new Error(`Doctor registration failed: ${JSON.stringify(dData)}`);
  const doctorToken = dData.access_token;
  const doctorUserId = dData.user.id;
  console.log(`  [PASS] Doctor registered. User ID: ${doctorUserId}`);

  // 4. Doctor Discovery (GET /doctors)
  console.log('\n[PROD TEST 4] Testing Doctor Discovery (Find Doctor)...');
  const docListRes = await fetch(`${PROD_URL}/doctors`);
  const docList = await docListRes.json();
  if (docListRes.status !== 200 || !Array.isArray(docList)) throw new Error(`Find Doctor failed: ${JSON.stringify(docList)}`);
  const registeredDoctor = docList.find((doc) => doc.userId === doctorUserId);
  if (!registeredDoctor) throw new Error(`Newly registered doctor ${doctorUserId} not found in /doctors response!`);
  console.log(`  [PASS] Found registered doctor in directory: "${registeredDoctor.name}" (${registeredDoctor.specialization}) at ${registeredDoctor.hospital}`);

  // 5. Filter Doctor by Department & Search
  console.log('\n[PROD TEST 5] Testing Doctor Search & Department Filter...');
  const searchRes = await fetch(`${PROD_URL}/doctors?search=Siddharth&department=Cardiology`);
  const searchList = await searchRes.json();
  if (searchList.length === 0 || !searchList.some((d) => d.userId === doctorUserId)) {
    throw new Error('Search and department filter did not return the registered doctor!');
  }
  console.log(`  [PASS] Filter query returned ${searchList.length} matching doctor(s).`);

  // 6. Patient Books Appointment (POST /appointments)
  const aptDate = '2026-11-10';
  const aptTime = '11:00 AM';
  console.log(`\n[PROD TEST 6] Patient Booking Appointment on ${aptDate} at ${aptTime}...`);
  const bookRes = await fetch(`${PROD_URL}/appointments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${patientToken}`,
    },
    body: JSON.stringify({
      doctor_id: doctorUserId,
      doctor_name: registeredDoctor.name,
      hospital_name: registeredDoctor.hospital,
      department: registeredDoctor.department,
      specialization: registeredDoctor.specialization,
      appointment_date: aptDate,
      time_slot: aptTime,
      type: 'Video Consultation',
      notes: 'Routine cardiovascular follow-up',
    }),
  });
  const bookData = await bookRes.json();
  if (bookRes.status !== 201 || bookData.status !== 'PENDING') {
    throw new Error(`Appointment booking failed: ${JSON.stringify(bookData)}`);
  }
  const appointmentId = bookData.id;
  console.log(`  [PASS] Appointment created with status PENDING. ID: ${appointmentId}`);

  // 7. Concurrency / Double-Booking Prevention Check
  console.log('\n[PROD TEST 7] Testing Double-Booking Prevention Constraint...');
  const conflictRes = await fetch(`${PROD_URL}/appointments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${patientToken}`,
    },
    body: JSON.stringify({
      doctor_id: doctorUserId,
      appointment_date: aptDate,
      time_slot: aptTime,
      type: 'In-Person',
    }),
  });
  const conflictData = await conflictRes.json();
  if (conflictRes.status !== 409) {
    throw new Error(`Expected 409 Conflict for duplicate slot booking, got ${conflictRes.status}`);
  }
  console.log(`  [PASS] Concurrency check prevented double-booking: "${conflictData.detail}"`);

  // 8. Doctor Checks Notifications for Appointment Request
  console.log('\n[PROD TEST 8] Doctor Checking Persistent Notifications...');
  const docNotifsRes = await fetch(`${PROD_URL}/notifications`, {
    headers: { Authorization: `Bearer ${doctorToken}` },
  });
  const docNotifs = await docNotifsRes.json();
  if (docNotifsRes.status !== 200 || !docNotifs.notifications) throw new Error('Failed to fetch doctor notifications');
  const aptNotif = docNotifs.notifications.find((n) => n.entity_id === appointmentId);
  if (!aptNotif) throw new Error(`Appointment notification for ID ${appointmentId} was not created!`);
  console.log(`  [PASS] Doctor received notification: "${aptNotif.title}" - ${aptNotif.message}`);

  // 9. Doctor Retrieves Assigned Appointments
  console.log('\n[PROD TEST 9] Doctor Retrieving Pending Appointments in Workspace...');
  const docAptsRes = await fetch(`${PROD_URL}/doctor/appointments`, {
    headers: { Authorization: `Bearer ${doctorToken}` },
  });
  const docApts = await docAptsRes.json();
  const docPendingApt = docApts.find((a) => a.id === appointmentId);
  if (!docPendingApt || docPendingApt.status !== 'PENDING') {
    throw new Error('Doctor appointments ledger missing the pending appointment!');
  }
  console.log(`  [PASS] Doctor ledger contains pending appointment from patient: ${docPendingApt.patientName}`);

  // 10. Doctor Accepts Appointment
  console.log(`\n[PROD TEST 10] Doctor Accepting Appointment ${appointmentId}...`);
  const acceptRes = await fetch(`${PROD_URL}/appointments/${appointmentId}/accept`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${doctorToken}` },
  });
  const acceptData = await acceptRes.json();
  if (acceptRes.status !== 200 || acceptData.status !== 'CONFIRMED') {
    throw new Error(`Doctor accept failed: ${JSON.stringify(acceptData)}`);
  }
  console.log(`  [PASS] Doctor accepted request. Status changed to CONFIRMED.`);

  // 11. Patient Verifies Confirmed Notification
  console.log('\n[PROD TEST 11] Patient Checking Confirmation Notification...');
  const patNotifsRes = await fetch(`${PROD_URL}/notifications`, {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  const patNotifs = await patNotifsRes.json();
  const confirmNotif = patNotifs.notifications.find(
    (n) => n.entity_id === appointmentId && n.type === 'APPOINTMENT_CONFIRMED'
  );
  if (!confirmNotif) throw new Error('Patient did not receive confirmation notification!');
  console.log(`  [PASS] Patient received confirmation notification: "${confirmNotif.message}"`);

  // 12. Patient Ledger Reflects Confirmed Status
  console.log('\n[PROD TEST 12] Patient Checking Appointments Ledger...');
  const patAptsRes = await fetch(`${PROD_URL}/appointments/my-appointments`, {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  const patApts = await patAptsRes.json();
  const myConfirmedApt = patApts.find((a) => a.id === appointmentId);
  if (!myConfirmedApt || myConfirmedApt.status !== 'CONFIRMED') {
    throw new Error('Patient ledger does not show status CONFIRMED!');
  }
  console.log(`  [PASS] Patient ledger shows consultation status is CONFIRMED with ${myConfirmedApt.doctorName}`);

  // 13. Rejection Workflow Test
  console.log('\n[PROD TEST 13] Testing Rejection Workflow (New slot request -> Doctor decline)...');
  const apt2Res = await fetch(`${PROD_URL}/appointments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${patientToken}`,
    },
    body: JSON.stringify({
      doctor_id: doctorUserId,
      appointment_date: '2026-11-12',
      time_slot: '03:00 PM',
      type: 'In-Person',
    }),
  });
  const apt2Data = await apt2Res.json();
  const apt2Id = apt2Data.id;

  const rejectRes = await fetch(`${PROD_URL}/appointments/${apt2Id}/reject`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${doctorToken}`,
    },
    body: JSON.stringify({ reason: 'Emergency clinical shift' }),
  });
  const rejectData = await rejectRes.json();
  if (rejectRes.status !== 200 || rejectData.status !== 'REJECTED') {
    throw new Error(`Doctor rejection failed: ${JSON.stringify(rejectData)}`);
  }
  console.log(`  [PASS] Doctor successfully rejected request. Reason: "${rejectData.rejection_reason}"`);

  // 14. Mark Notification Read
  console.log('\n[PROD TEST 14] Patient Marking Notification Read...');
  const readRes = await fetch(`${PROD_URL}/notifications/${confirmNotif.id}/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  const readData = await readRes.json();
  if (readRes.status !== 200 || !readData.success) throw new Error('Mark notification read failed');
  console.log('  [PASS] Notification marked read successfully.');

  // 15. Doctor Stats Calculation
  console.log('\n[PROD TEST 15] Checking Doctor Dynamic Stats Calculation...');
  const statsRes = await fetch(`${PROD_URL}/doctor/stats`, {
    headers: { Authorization: `Bearer ${doctorToken}` },
  });
  const statsData = await statsRes.json();
  if (statsRes.status !== 200) throw new Error('Doctor stats failed');
  console.log(`  [PASS] Dynamic Stats: active_patients=${statsData.active_patients}, upcoming_consultations=${statsData.upcoming_consultations}`);

  // 16. Hospital Admin Dashboard Data
  console.log('\n[PROD TEST 16] Checking Hospital Dashboard Live Aggregations...');
  const hospRes = await fetch(`${PROD_URL}/hospital/dashboard-data`);
  const hospData = await hospRes.json();
  if (hospRes.status !== 200) throw new Error('Hospital dashboard data failed');
  console.log(`  [PASS] Hospital DB Aggregations: doctors=${hospData.doctors_count}, appointments=${hospData.appointments_count}`);

  console.log('\n======================================================');
  console.log('>>> ALL 16 PRODUCTION E2E TESTS PASSED 100% <<<');
  console.log('======================================================\n');
}

runProductionTests().catch((err) => {
  console.error('\n[FATAL ERROR IN PROD E2E TESTS]', err);
  process.exit(1);
});
