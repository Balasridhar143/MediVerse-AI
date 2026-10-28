import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load .env.local
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else {
  dotenv.config();
}

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!dbUrl) {
  console.error('[FAIL] No DATABASE_URL found in environment or .env.local');
  process.exit(1);
}

const sql = neon(dbUrl);

async function init() {
  console.log('[INFO] Connecting to Neon PostgreSQL...');
  
  // 1. Test connection
  const res = await sql`SELECT NOW() as current_time, current_database() as db;`;
  console.log('[PASS] Connected successfully to database:', res[0].db, 'at', res[0].current_time);

  // 2. Create users table
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      full_name VARCHAR(128) NOT NULL,
      email VARCHAR(128) UNIQUE NOT NULL,
      password_hash VARCHAR(256) NOT NULL,
      role VARCHAR(32) NOT NULL DEFAULT 'patient',
      hospital_id VARCHAR(64),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`;
  console.log('[PASS] users table verified');

  // 3. Create patients table
  await sql`
    CREATE TABLE IF NOT EXISTS patients (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      full_name VARCHAR(128) NOT NULL,
      age INT,
      gender VARCHAR(32),
      blood_group VARCHAR(16),
      phone VARCHAR(32),
      address VARCHAR(256),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);`;
  console.log('[PASS] patients table verified');

  // 4. Create doctors table
  await sql`
    CREATE TABLE IF NOT EXISTS doctors (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      full_name VARCHAR(128) NOT NULL,
      specialization VARCHAR(128),
      license_number VARCHAR(128),
      hospital_id VARCHAR(64),
      hospital_name VARCHAR(256),
      is_verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  console.log('[PASS] doctors table verified');

  // 5. Create hospital_admins table
  await sql`
    CREATE TABLE IF NOT EXISTS hospital_admins (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      full_name VARCHAR(128) NOT NULL,
      hospital_name VARCHAR(256),
      facility_id VARCHAR(64),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  console.log('[PASS] hospital_admins table verified');

  // 6. Create patient_registrations table
  await sql`
    CREATE TABLE IF NOT EXISTS patient_registrations (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
      patient_id VARCHAR(64),
      hospital_id VARCHAR(64) NOT NULL,
      hospital_name VARCHAR(256),
      full_name VARCHAR(128) NOT NULL,
      phone VARCHAR(32),
      reason_for_visit VARCHAR(256) NOT NULL,
      department VARCHAR(64) DEFAULT 'General Medicine',
      status VARCHAR(32) DEFAULT 'Pending',
      registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON patient_registrations(user_id);`;
  console.log('[PASS] patient_registrations table verified');

  // 7. Create medical_reports table
  await sql`
    CREATE TABLE IF NOT EXISTS medical_reports (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
      patient_id VARCHAR(64),
      patient_name VARCHAR(128),
      report_name VARCHAR(256) NOT NULL,
      report_type VARCHAR(64) DEFAULT 'Blood Tests',
      hospital VARCHAR(128),
      doctor VARCHAR(128),
      status VARCHAR(32) DEFAULT 'Ready',
      date VARCHAR(32),
      parameters JSONB,
      structured_data JSONB,
      ai_explanation JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_reports_user_id ON medical_reports(user_id);`;
  console.log('[PASS] medical_reports table verified');

  console.log('=== NEON POSTGRESQL INITIALIZATION COMPLETE ===');
}

init().catch((err) => {
  console.error('[ERROR] Failed to initialize Neon DB:', err);
  process.exit(1);
});
