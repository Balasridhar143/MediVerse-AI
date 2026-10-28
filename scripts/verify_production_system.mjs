import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const BASE_URL = 'https://mediverse-ai-fawn.vercel.app';
const API_URL = `${BASE_URL}/api`;

// Load live Neon Database connection string
const DATABASE_URL = 'postgresql://neondb_owner:npg_ILe9fG7nqVxk@ep-odd-violet-b8mtt393-pooler.c-14.us-east-1.aws.neon.tech/neondb?sslmode=require';
const sql = neon(DATABASE_URL);

async function testProductionSuite() {
  console.log('====================================================');
  console.log('   MEDIVERSE AI PRODUCTION E2E VERIFICATION SUITE   ');
  console.log('====================================================');
  console.log(`Target Production URL: ${BASE_URL}`);

  const results = {
    apiHealth: false,
    databasePersistence: false,
    otpRecoveryFlow: false,
    otpLoginFlow: false,
    pushDeviceRegistration: false,
    androidApkVerified: false,
  };

  // 1. Check API Health
  try {
    const res = await fetch(`${API_URL}/health`);
    const data = await res.json();
    console.log('\n[1] Production API Health Check:');
    console.log(`    Status: ${data.status}`);
    console.log(`    Database: ${data.database}`);
    console.log(`    Service: ${data.service}`);
    if (data.status === 'healthy' && data.database.includes('Neon PostgreSQL')) {
      results.apiHealth = true;
      console.log('    -> PASSED');
    }
  } catch (err) {
    console.error('    -> FAILED:', err.message);
  }

  // 2. Direct DB verification to read real records
  let testEmail = 'balasridharp@gmail.com';

  async function queryWithRetry(fn) {
    for (let i = 0; i < 3; i++) {
      try {
        return await fn();
      } catch (e) {
        if (i === 2) throw e;
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }

  try {
    console.log('\n[2] Database Persistence & Schema Verification:');
    
    // Verify tables exist
    const tablesRes = await queryWithRetry(() => sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('users', 'doctors', 'patients', 'appointments', 'medical_records', 'otps', 'device_tokens', 'notifications')
    `);
    const tables = tablesRes.map(r => r.table_name);
    console.log(`    Found tables: ${tables.join(', ')}`);

    const usersCount = (await queryWithRetry(() => sql`SELECT COUNT(*) as count FROM users`))[0].count;
    const doctorsCount = (await queryWithRetry(() => sql`SELECT COUNT(*) as count FROM doctors`))[0].count;
    const appointmentsCount = (await queryWithRetry(() => sql`SELECT COUNT(*) as count FROM appointments`))[0].count;
    console.log(`    Persistence Counts: Users=${usersCount}, Doctors=${doctorsCount}, Appointments=${appointmentsCount}`);

    if (tables.includes('otps') && tables.includes('device_tokens') && parseInt(usersCount) > 0) {
      results.databasePersistence = true;
      console.log('    -> PASSED');
    }
  } catch (err) {
    console.error('    -> FAILED to inspect DB:', err.message);
  }

  // 3. Test Forgot Password -> OTP Generation -> OTP Verification -> Password Reset
  try {
    console.log('\n[3] Testing Password Recovery via OTP Flow:');
    
    // Delete old test OTPs for clean slate
    await queryWithRetry(() => sql`DELETE FROM otps WHERE email = ${testEmail}`);

    // Request OTP
    const reqRes = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });
    const reqData = await reqRes.json();
    console.log(`    Forgot-Password Request status: ${reqRes.status}`);
    console.log(`    Response: ${reqData.message || reqData.detail}`);

    // Retrieve newest OTP directly from DB
    const otpRes = await queryWithRetry(() => sql`
      SELECT otp_code FROM otps WHERE email = ${testEmail} AND purpose = 'PASSWORD_RESET' AND is_used = false ORDER BY created_at DESC LIMIT 1
    `);

    if (otpRes.length === 0) {
      throw new Error('OTP was not recorded in the database');
    }

    const testOtpCode = otpRes[0].otp_code;
    console.log(`    Retrieved active OTP code from DB: ${testOtpCode}`);

    // Verify OTP
    const verifyRes = await fetch(`${API_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, code: testOtpCode, purpose: 'PASSWORD_RESET' })
    });
    const verifyData = await verifyRes.json();
    console.log(`    OTP Verification status: ${verifyRes.status}`);
    const resetToken = verifyData.reset_token || verifyData.resetToken;
    console.log(`    Reset Token issued: ${Boolean(resetToken)}`);

    if (!resetToken) {
      throw new Error(`OTP Verification failed: ${JSON.stringify(verifyData)}`);
    }

    // Reset password
    const resetRes = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reset_token: resetToken, new_password: 'DoctorPassword@2026' })
    });
    const resetData = await resetRes.json();
    console.log(`    Reset Password status: ${resetRes.status}`);
    console.log(`    Reset Password message: ${resetData.message || resetData.detail}`);

    // Verify login with new password
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'DoctorPassword@2026' })
    });
    const loginData = await loginRes.json();
    console.log(`    Login verification with new password: ${loginRes.status} (${loginData.user?.full_name || loginData.user?.name})`);

    if (loginRes.ok && loginData.access_token) {
      results.otpRecoveryFlow = true;
      console.log('    -> PASSED');
    }
  } catch (err) {
    console.error('    -> FAILED:', err.message);
  }

  // 4. Test Passwordless OTP Login
  try {
    console.log('\n[4] Testing Passwordless OTP Login:');
    // Clear old login OTPs to avoid rate-limit cooldown
    await queryWithRetry(() => sql`DELETE FROM otps WHERE email = ${testEmail} AND purpose = 'LOGIN'`);

    const otpReq = await fetch(`${API_URL}/auth/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });
    const otpReqData = await otpReq.json();
    console.log(`    OTP Login Request Status: ${otpReq.status} (${otpReqData.message || otpReqData.detail})`);

    // Retrieve newest LOGIN OTP
    const otpRes = await queryWithRetry(() => sql`
      SELECT otp_code FROM otps WHERE email = ${testEmail} AND purpose = 'LOGIN' AND is_used = false ORDER BY created_at DESC LIMIT 1
    `);

    if (otpRes.length > 0) {
      const loginOtp = otpRes[0].otp_code;
      console.log(`    Retrieved active Login OTP: ${loginOtp}`);

      const verifyLoginRes = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, code: loginOtp, purpose: 'LOGIN' })
      });
      const verifyLoginData = await verifyLoginRes.json();
      console.log(`    OTP Login Status: ${verifyLoginRes.status}`);
      console.log(`    Authenticated User: ${verifyLoginData.user?.full_name || verifyLoginData.user?.name} (Role: ${verifyLoginData.user?.role})`);
      if (verifyLoginRes.ok && verifyLoginData.access_token) {
        results.otpLoginFlow = true;
        console.log('    -> PASSED');
      }
    }
  } catch (err) {
    console.error('    -> FAILED:', err.message);
  }

  // 5. Test Push Notification Device Token Registration (Authenticated)
  try {
    console.log('\n[5] Testing Push Device Registration:');
    // Login to get valid auth token
    const authRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'DoctorPassword@2026' })
    });
    const authData = await authRes.json();
    const token = authData.access_token || authData.token;

    const tokenRes = await fetch(`${API_URL}/notifications/register-device`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        token: 'fcm_test_device_token_' + Date.now(),
        platform: 'android'
      })
    });
    const tokenData = await tokenRes.json();
    console.log(`    Registration Status: ${tokenRes.status}`);
    console.log(`    Message: ${tokenData.message || tokenData.detail}`);
    if (tokenRes.ok) {
      results.pushDeviceRegistration = true;
      console.log('    -> PASSED');
    }
  } catch (err) {
    console.error('    -> FAILED:', err.message);
  }

  // 6. Verify Android APK
  try {
    console.log('\n[6] Verifying Android APK:');
    const apkPath = path.join(PROJECT_ROOT, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
    if (fs.existsSync(apkPath)) {
      const stats = fs.statSync(apkPath);
      console.log(`    APK Path: ${apkPath}`);
      console.log(`    APK Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB (${stats.size} bytes)`);
      console.log(`    Modified: ${stats.mtime.toISOString()}`);
      if (stats.size > 1000000) {
        results.androidApkVerified = true;
        console.log('    -> PASSED');
      }
    } else {
      console.log('    APK file NOT found at expected location.');
    }
  } catch (err) {
    console.error('    -> FAILED:', err.message);
  }

  console.log('\n====================================================');
  console.log('               VERIFICATION SUMMARY                 ');
  console.log('====================================================');
  console.table(results);

  const allPassed = Object.values(results).every(v => v === true);
  if (allPassed) {
    console.log('\nSUCCESS: All production verification tests PASSED!\n');
  } else {
    console.log('\nWARNING: Some tests did not pass. Check output above.\n');
  }
}

testProductionSuite();
