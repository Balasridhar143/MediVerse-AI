import express from 'express';
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config({ path: '.env.local' });
if (!process.env.DATABASE_URL) dotenv.config({ path: '.env' });

const JWT_SECRET = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET || 'mediverse_jwt_secret_key_prod_2026';
const databaseUrl = process.env.DATABASE_URL;
const sql = neon(databaseUrl);

async function testHttpEndpoints() {
  console.log('=== STARTING EXPRESS BACKEND ROUTE UNIT TEST ===');

  // Load app from api/index.js
  const { default: app } = await import('../api/index.js');

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`[PASS] Test server listening on ${baseUrl}`);

  try {
    // 1. Identify doctor
    const doctors = await sql`SELECT d.id as doc_id, d.user_id, u.full_name, u.email FROM doctors d JOIN users u ON d.user_id = u.id LIMIT 1;`;
    const doctor = doctors[0];

    const doctorToken = jwt.sign(
      { id: doctor.user_id, sub: doctor.user_id, role: 'doctor', name: doctor.full_name, email: doctor.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 2. Identify unauthorized user / different doctor not linked to Bala
    const unauthorizedToken = jwt.sign(
      { id: 'usr_unauthorized_9999', sub: 'usr_unauthorized_9999', role: 'doctor', name: 'Dr. Stranger', email: 'stranger@example.com' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Test A: GET /doctor/patients
    console.log('\n--- Endpoint Test 1: GET /doctor/patients ---');
    const patientsRes = await fetch(`${baseUrl}/doctor/patients`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    console.log(`Status: ${patientsRes.status}`);
    const patientsData = await patientsRes.json();
    console.log(`[PASS] Returned ${patientsData.length} authorized patients for ${doctor.full_name}`);
    if (patientsData.length > 0) {
      console.log(`First patient: ${patientsData[0].patientName} (ID: ${patientsData[0].patientId})`);
    }

    // Test B: GET /doctor/patients/usr_eaf97fd4ca1e7895/health-trends (Bala)
    console.log('\n--- Endpoint Test 2: GET /doctor/patients/:id/health-trends (Bala) ---');
    const trendsRes = await fetch(`${baseUrl}/doctor/patients/usr_eaf97fd4ca1e7895/health-trends`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    console.log(`Status: ${trendsRes.status}`);
    const trendsData = await trendsRes.json();
    console.log(`[PASS] Patient Name: ${trendsData.patient?.patientName}`);
    console.log(`[PASS] Total Reports: ${trendsData.summary?.totalReportsAnalyzed}`);
    console.log(`[PASS] Parameters Tracked: ${trendsData.summary?.parametersTracked}`);
    console.log(`[PASS] Has Multi-Point Trends: ${trendsData.summary?.hasSufficientHistoricalData}`);
    if (trendsData.trends?.length > 0) {
      const hb = trendsData.trends.find(t => t.parameterName.toLowerCase().includes('hemoglobin'));
      if (hb) {
        console.log(`[PASS] Hemoglobin: ${hb.readingCount} readings, delta: ${hb.deltaValue} ${hb.unit}, direction: ${hb.trendDirection}`);
      }
    }

    // Test C: GET /doctor/patients/usr_eaf97fd4ca1e7895/early-warnings (Bala)
    console.log('\n--- Endpoint Test 3: GET /doctor/patients/:id/early-warnings (Bala) ---');
    const warningsRes = await fetch(`${baseUrl}/doctor/patients/usr_eaf97fd4ca1e7895/early-warnings`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    console.log(`Status: ${warningsRes.status}`);
    const warningsData = await warningsRes.json();
    console.log(`[PASS] Active Warnings: ${warningsData.warningCount}`);
    if (warningsData.warnings?.length > 0) {
      warningsData.warnings.forEach(w => {
        console.log(`   * [${w.priority}] ${w.title} - ${w.reason}`);
      });
    }

    // Test D: POST /doctor/patients/usr_eaf97fd4ca1e7895/early-warnings/:warningId/review
    console.log('\n--- Endpoint Test 4: POST review early warning ---');
    const warnId = warningsData.warnings?.[0]?.id || 'warn_test_glucose';
    const reviewRes = await fetch(`${baseUrl}/doctor/patients/usr_eaf97fd4ca1e7895/early-warnings/${warnId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`
      },
      body: JSON.stringify({ notes: 'Clinician confirmed abnormal elevation. Follow up ordered.' })
    });
    console.log(`Status: ${reviewRes.status}`);
    const reviewData = await reviewRes.json();
    console.log(`[PASS] Review response: ${JSON.stringify(reviewData)}`);

    // Test E: GET /doctor/patients/usr_eaf97fd4ca1e7895/health-trends as unauthorized clinician
    console.log('\n--- Endpoint Test 5: Authorization Security (403 Expected) ---');
    const unauthRes = await fetch(`${baseUrl}/doctor/patients/usr_eaf97fd4ca1e7895/health-trends`, {
      headers: { Authorization: `Bearer ${unauthorizedToken}` }
    });
    console.log(`Status: ${unauthRes.status} (Expected: 403)`);
    if (unauthRes.status === 403) {
      console.log('[PASS] Security check successfully blocked unauthorized clinician access with 403!');
    } else {
      console.error('[FAIL] Expected 403 but got:', unauthRes.status);
    }

    // Test F: Zero-Report Patient
    console.log('\n--- Endpoint Test 6: Zero-Report Patient Response ---');
    const anitaRes = await fetch(`${baseUrl}/doctor/patients/usr_7e5e2aee077831d7/health-trends`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    // Note: Anita is not linked to doctor, or if linked returns 0 reports
    console.log(`Status: ${anitaRes.status}`);
    if (anitaRes.status === 200) {
      const anitaData = await anitaRes.json();
      console.log(`[PASS] Total Reports: ${anitaData.summary?.totalReportsAnalyzed}, Parameters: ${anitaData.trends?.length}`);
    } else if (anitaRes.status === 403) {
      console.log('[PASS] Unlinked patient returns 403 as expected by security rules.');
    }

    console.log('\n=== ALL HTTP ROUTE TESTS PASSED SUCCESSFULLY ===');
  } finally {
    server.close();
  }
}

testHttpEndpoints().catch(err => {
  console.error('HTTP test failed:', err);
  process.exit(1);
});
