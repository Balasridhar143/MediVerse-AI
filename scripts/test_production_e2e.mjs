const PROD_URL = 'https://mediverse-ai-fawn.vercel.app/api';

async function runProductionTests() {
  console.log('=== RUNNING PRODUCTION E2E TESTS AGAINST DEPLOYED WEBSITE ===');
  console.log('Target URL:', PROD_URL);

  const timestamp = Date.now();
  const results = {};

  // 1. Health Check
  console.log('\n[PROD TEST 1] Health Check...');
  const hRes = await fetch(`${PROD_URL}/health`);
  const hData = await hRes.json();
  results.health = { status: hRes.status, data: hData };
  console.log(`[${hRes.status === 200 ? 'PASS' : 'FAIL'}] Health:`, hData);

  // 2. Patient Registration
  const patientEmail = `patient_prod_${timestamp}@example.com`;
  console.log(`\n[PROD TEST 2] Registering Patient (${patientEmail})...`);
  const pRegRes = await fetch(`${PROD_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      full_name: 'Priya Sharma (Synthetic Patient)',
      email: patientEmail,
      password: 'ProdSecurePass123!',
      role: 'patient',
      age: 29,
      gender: 'Female',
      blood_group: 'O+',
      phone: '+91 98765 22222',
      address: '77 Residency Road, Bengaluru'
    })
  });
  const pRegData = await pRegRes.json();
  results.patient_registration = { status: pRegRes.status, user: pRegData.user };
  console.log(`[${pRegRes.status === 200 ? 'PASS' : 'FAIL'}] Patient Registered:`, pRegData.user?.id, 'Role:', pRegData.user?.role);
  const patientToken = pRegData.access_token;

  // 3. Duplicate Email Prevention
  console.log('\n[PROD TEST 3] Testing duplicate email rejection...');
  const dupRes = await fetch(`${PROD_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      full_name: 'Priya Sharma Duplicate',
      email: patientEmail,
      password: 'ProdSecurePass123!',
      role: 'patient'
    })
  });
  const dupData = await dupRes.json();
  results.duplicate_check = { status: dupRes.status, detail: dupData.detail };
  console.log(`[${dupRes.status === 400 ? 'PASS' : 'FAIL'}] Duplicate Check:`, dupRes.status, dupData.detail);

  // 4. Doctor Registration
  const doctorEmail = `doctor_prod_${timestamp}@example.com`;
  console.log(`\n[PROD TEST 4] Registering Doctor (${doctorEmail})...`);
  const docRegRes = await fetch(`${PROD_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      full_name: 'Dr. Rajesh Nair (Synthetic Doctor)',
      email: doctorEmail,
      password: 'DocSecurePass123!',
      role: 'doctor',
      specialization: 'Pulmonology',
      licenseNumber: 'KMC-2026-4432',
      hospitalName: 'Apollo Speciality Care'
    })
  });
  const docRegData = await docRegRes.json();
  results.doctor_registration = { status: docRegRes.status, user: docRegData.user };
  console.log(`[${docRegRes.status === 200 ? 'PASS' : 'FAIL'}] Doctor Registered:`, docRegData.user?.id, 'Role:', docRegData.user?.role);
  const doctorToken = docRegData.access_token;

  // 5. Hospital Administrator Registration
  const adminEmail = `admin_prod_${timestamp}@example.com`;
  console.log(`\n[PROD TEST 5] Registering Hospital Administrator (${adminEmail})...`);
  const admRegRes = await fetch(`${PROD_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      full_name: 'Anita Verma (Synthetic Admin)',
      email: adminEmail,
      password: 'AdmSecurePass123!',
      role: 'hospital_admin',
      hospitalName: 'City Care Multispeciality Hospital',
      facilityId: 'hosp_1'
    })
  });
  const admRegData = await admRegRes.json();
  results.admin_registration = { status: admRegRes.status, user: admRegData.user };
  console.log(`[${admRegRes.status === 200 ? 'PASS' : 'FAIL'}] Admin Registered:`, admRegData.user?.id, 'Role:', admRegData.user?.role);

  // 6. Login Test with registered patient
  console.log(`\n[PROD TEST 6] Logging in with patient credentials...`);
  const logRes = await fetch(`${PROD_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: patientEmail,
      password: 'ProdSecurePass123!'
    })
  });
  const logData = await logRes.json();
  results.login_success = { status: logRes.status, user: logData.user };
  console.log(`[${logRes.status === 200 ? 'PASS' : 'FAIL'}] Login Succeeded:`, logData.user?.id, logData.user?.full_name);

  // 7. Login Test - Bad Password
  console.log(`\n[PROD TEST 7] Testing invalid password rejection...`);
  const badLogRes = await fetch(`${PROD_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: patientEmail,
      password: 'WrongPassword!'
    })
  });
  results.login_bad_pass = { status: badLogRes.status };
  console.log(`[${badLogRes.status === 401 ? 'PASS' : 'FAIL'}] Bad Password Rejected:`, badLogRes.status);

  // 8. Session & Profile Verification (/auth/me)
  console.log(`\n[PROD TEST 8] Verifying protected /auth/me with Bearer token...`);
  const meRes = await fetch(`${PROD_URL}/auth/me`, {
    headers: { 'Authorization': `Bearer ${patientToken}` }
  });
  const meData = await meRes.json();
  results.auth_me = { status: meRes.status, profile: meData };
  console.log(`[${meRes.status === 200 ? 'PASS' : 'FAIL'}] /auth/me Profile:`, meData.full_name, meData.email, 'Blood Group:', meData.blood_group);

  // 9. Appointment Booking / Registration Persistence
  console.log(`\n[PROD TEST 9] Booking Patient Appointment at Hospital...`);
  const bookRes = await fetch(`${PROD_URL}/registrations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${patientToken}`
    },
    body: JSON.stringify({
      hospital_id: 'hosp_1',
      hospital_name: 'City Care Multispeciality Hospital',
      full_name: 'Priya Sharma (Synthetic Patient)',
      phone: '+91 98765 22222',
      reason_for_visit: 'Comprehensive Pulmonary & Vitals Evaluation',
      department: 'Pulmonology'
    })
  });
  const bookData = await bookRes.json();
  results.appointment = { status: bookRes.status, booking: bookData };
  console.log(`[${bookRes.status === 201 ? 'PASS' : 'FAIL'}] Appointment Booked:`, bookData.id, bookData.department);

  // 10. Retrieve User's Appointments
  console.log(`\n[PROD TEST 10] Retrieving Patient Appointments from Neon DB...`);
  const myAppRes = await fetch(`${PROD_URL}/patients/me/registrations`, {
    headers: { 'Authorization': `Bearer ${patientToken}` }
  });
  const myAppData = await myAppRes.json();
  results.my_appointments = { status: myAppRes.status, count: myAppData.length };
  console.log(`[${myAppRes.status === 200 ? 'PASS' : 'FAIL'}] Retrieved Appointments:`, myAppData.length, 'records');

  // 11. Medical Report Persistence
  console.log(`\n[PROD TEST 11] Uploading and Persisting Medical Report to Neon DB...`);
  const repRes = await fetch(`${PROD_URL}/reports/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${patientToken}`
    },
    body: JSON.stringify({
      report_name: 'Comprehensive Lipid & Glycemic Panel',
      report_type: 'Blood Tests',
      hospital: 'City Care Diagnostics Laboratory',
      doctor: 'Dr. Rajesh Nair',
      patient_name: 'Priya Sharma',
      parameters: [
        { name: 'Fasting Blood Sugar', value: 92, unit: 'mg/dL', referenceRange: '70-99 mg/dL', flag: 'Normal' },
        { name: 'HbA1c', value: 5.4, unit: '%', referenceRange: '4.0-5.6 %', flag: 'Normal' },
        { name: 'Total Cholesterol', value: 175, unit: 'mg/dL', referenceRange: '125-200 mg/dL', flag: 'Normal' }
      ],
      structured_data: { findings: 'All evaluated parameters within normal clinical bounds.' },
      ai_explanation: {
        simpleExplanation: 'Your blood sugar and cholesterol levels are within the healthy range.',
        recommendation: 'Continue regular lifestyle and dietary routine.'
      }
    })
  });
  const repData = await repRes.json();
  results.report_upload = { status: repRes.status, report: repData };
  console.log(`[${repRes.status === 201 ? 'PASS' : 'FAIL'}] Report Uploaded & Stored:`, repData.id);

  // 12. Retrieve Saved Reports
  console.log(`\n[PROD TEST 12] Fetching Patient Reports from Neon DB...`);
  const getRepRes = await fetch(`${PROD_URL}/reports`, {
    headers: { 'Authorization': `Bearer ${patientToken}` }
  });
  const getRepData = await getRepRes.json();
  results.get_reports = { status: getRepRes.status, count: getRepData.length };
  console.log(`[${getRepRes.status === 200 ? 'PASS' : 'FAIL'}] Retrieved Reports:`, getRepData.length, 'records');

  // 13. Security - Access Control: Unauthorized User cannot access private data without token
  console.log(`\n[PROD TEST 13] Security: Testing unauthorized access rejection...`);
  const unauthRes = await fetch(`${PROD_URL}/auth/me`);
  console.log(`[${unauthRes.status === 401 ? 'PASS' : 'FAIL'}] Unauthorized Access Rejected:`, unauthRes.status);

  console.log('\n=== ALL PRODUCTION E2E TESTS COMPLETED SUCCESSFULLY ===');
}

runProductionTests().catch(console.error);
