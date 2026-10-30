import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function patch() {
  console.log('Patching patient_allergies columns...');
  await sql`ALTER TABLE patient_allergies ADD COLUMN IF NOT EXISTS notes TEXT;`;
  await sql`ALTER TABLE patient_allergies ADD COLUMN IF NOT EXISTS date_identified VARCHAR(64);`;
  await sql`ALTER TABLE patient_allergies ADD COLUMN IF NOT EXISTS verification_status VARCHAR(64) DEFAULT 'CONFIRMED';`;
  await sql`ALTER TABLE patient_allergies ADD COLUMN IF NOT EXISTS documented_by_id VARCHAR(64);`;
  await sql`ALTER TABLE patient_allergies ADD COLUMN IF NOT EXISTS documented_by_name VARCHAR(128);`;
  console.log('✓ Successfully ensured all columns on patient_allergies!');
}

patch().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });

