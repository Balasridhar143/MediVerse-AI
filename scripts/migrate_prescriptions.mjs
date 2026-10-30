import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL is not configured');
const sql = neon(DATABASE_URL);

async function checkAndMigrate() {
  console.log('--- Checking Database Tables for Prescription Module ---');
  let retries = 3;
  let tables;
  while (retries > 0) {
    try {
      tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;`;
      break;
    } catch (e) {
      console.warn(`Attempt failed (${e.message}), retrying...`);
      retries--;
      if (retries === 0) throw e;
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  console.log('Existing tables in DB:', tables.map(t => t.table_name));

  console.log('Creating prescriptions table if not exists...');
  await sql`
    CREATE TABLE IF NOT EXISTS prescriptions (
      id VARCHAR(64) PRIMARY KEY,
      prescription_id VARCHAR(64) UNIQUE NOT NULL,
      patient_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      patient_profile_id VARCHAR(64),
      patient_name VARCHAR(128) NOT NULL,
      doctor_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      doctor_profile_id VARCHAR(64),
      doctor_name VARCHAR(128) NOT NULL,
      doctor_specialization VARCHAR(128),
      doctor_license VARCHAR(128),
      hospital_name VARCHAR(256),
      hospital_id VARCHAR(64),
      diagnosis TEXT NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'Active',
      date VARCHAR(64) NOT NULL,
      date_iso DATE NOT NULL DEFAULT CURRENT_DATE,
      follow_up_date VARCHAR(64),
      clinical_notes TEXT,
      safety_checked BOOLEAN DEFAULT TRUE,
      safety_notes TEXT,
      doctor_signature VARCHAR(256),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor ON prescriptions(doctor_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_prescriptions_date ON prescriptions(date_iso DESC);`;

  console.log('Creating prescription_items table if not exists...');
  await sql`
    CREATE TABLE IF NOT EXISTS prescription_items (
      id VARCHAR(64) PRIMARY KEY,
      prescription_id VARCHAR(64) NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
      medicine_id VARCHAR(64),
      medicine_name VARCHAR(256) NOT NULL,
      generic_name VARCHAR(256),
      brand_name VARCHAR(256),
      active_ingredient VARCHAR(256),
      dosage_form VARCHAR(64),
      strength VARCHAR(64),
      dosage VARCHAR(64),
      frequency VARCHAR(64) NOT NULL,
      timing VARCHAR(64),
      duration VARCHAR(64) NOT NULL,
      route VARCHAR(64) DEFAULT 'Oral',
      quantity INT DEFAULT 1,
      meal_relation VARCHAR(64) DEFAULT 'After meals',
      instructions TEXT,
      warnings TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_prescription_items_rx ON prescription_items(prescription_id);`;

  const countRx = await sql`SELECT COUNT(*)::int as count FROM prescriptions;`;
  console.log('Current prescriptions count in DB:', countRx[0].count);

  console.log('--- Migration & Table Verification Completed Successfully ---');
}

checkAndMigrate().catch((e) => {
  console.error('Migration failed:', e);
  process.exit(1);
});
