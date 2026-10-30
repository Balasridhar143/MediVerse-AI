import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';

const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);

async function runMigration() {
  console.log('=== Starting Hospital Admin Portal & Affiliation Migration ===');

  // 1. Ensure doctor_hospital_affiliations table
  await sql`
    CREATE TABLE IF NOT EXISTS doctor_hospital_affiliations (
      id VARCHAR(64) PRIMARY KEY,
      doctor_id VARCHAR(64) NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
      hospital_id VARCHAR(64) NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
      department_id VARCHAR(64) REFERENCES departments(id) ON DELETE SET NULL,
      department_name VARCHAR(128),
      employment_status VARCHAR(64) DEFAULT 'ACTIVE',
      is_primary BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(doctor_id, hospital_id)
    );
  `;
  console.log('✓ Table doctor_hospital_affiliations ensured.');

  // 2. Add columns to doctors table
  await sql`ALTER TABLE doctors ADD COLUMN IF NOT EXISTS department_id VARCHAR(64);`;
  await sql`ALTER TABLE doctors ADD COLUMN IF NOT EXISTS employment_status VARCHAR(64) DEFAULT 'ACTIVE';`;
  console.log('✓ Columns added to doctors table.');

  // 3. Add columns to hospitals table
  await sql`ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS admin_user_id VARCHAR(64);`;
  await sql`ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS admin_name VARCHAR(128);`;
  console.log('✓ Columns added to hospitals table.');

  // 3b. Add hospital_id to appointments table
  await sql`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS hospital_id VARCHAR(64);`;
  await sql`
    UPDATE appointments apt
    SET hospital_id = h.id
    FROM hospitals h
    WHERE apt.hospital_name = h.name AND (apt.hospital_id IS NULL OR apt.hospital_id = '');
  `;
  console.log('✓ Column hospital_id added and populated in appointments table.');

  // 4. Associate hospital administrators to hospitals
  await sql`
    UPDATE hospitals
    SET admin_user_id = 'usr_daa54ea670cc401f', admin_name = 'Suresh Patel'
    WHERE id = 'hosp_apollo_01';
  `;

  await sql`
    UPDATE hospitals
    SET admin_user_id = 'usr_9cac525746fe0d69', admin_name = 'Anita Verma'
    WHERE id = 'hosp_1';
  `;

  await sql`
    UPDATE hospitals
    SET admin_user_id = 'usr_ce1791e1e61dc477', admin_name = 'Isanth'
    WHERE id = 'hosp_ghkarur_01';
  `;

  await sql`
    UPDATE hospitals
    SET admin_user_id = 'usr_44034f325c4f82ce', admin_name = 'Gokulsankar'
    WHERE id = 'hosp_vm_01';
  `;
  console.log('✓ Hospital administrators associated with hospitals.');

  // 5. Update department_id in doctors based on matching departments table
  await sql`
    UPDATE doctors d
    SET department_id = dept.id
    FROM departments dept
    WHERE dept.hospital_id = d.hospital_id AND dept.name = d.department;
  `;
  console.log('✓ Doctor department_ids linked.');

  // 6. Populate doctor_hospital_affiliations from existing doctors
  const doctors = await sql`
    SELECT d.id, d.hospital_id, d.department, d.department_id, d.is_verified, d.is_available
    FROM doctors d
    WHERE d.hospital_id IS NOT NULL;
  `;

  for (const doc of doctors) {
    const affId = `aff_${doc.id}_${doc.hospital_id}`;
    await sql`
      INSERT INTO doctor_hospital_affiliations (id, doctor_id, hospital_id, department_id, department_name, employment_status, is_primary)
      VALUES (${affId}, ${doc.id}, ${doc.hospital_id}, ${doc.department_id}, ${doc.department}, 'ACTIVE', true)
      ON CONFLICT (doctor_id, hospital_id) DO UPDATE SET
        department_id = EXCLUDED.department_id,
        department_name = EXCLUDED.department_name,
        is_primary = true;
    `;
  }
  console.log(`✓ Seeded ${doctors.length} primary doctor hospital affiliations.`);

  // 7. Seed multi-hospital affiliation for Dr. Vikram Malhotra
  // Dr. Vikram Malhotra (Cardiology) is primary at City Care (hosp_1), and also a visiting consultant at Apollo (hosp_apollo_01)
  const drVikram = await sql`SELECT id FROM doctors WHERE full_name ILIKE '%Vikram Malhotra%' LIMIT 1;`;
  if (drVikram.length > 0) {
    const vId = drVikram[0].id;
    const apolloCardio = await sql`SELECT id FROM departments WHERE hospital_id = 'hosp_apollo_01' AND name = 'Cardiology' LIMIT 1;`;
    const apolloDeptId = apolloCardio[0]?.id || null;
    const multiAffId = `aff_${vId}_hosp_apollo_01`;

    await sql`
      INSERT INTO doctor_hospital_affiliations (id, doctor_id, hospital_id, department_id, department_name, employment_status, is_primary)
      VALUES (${multiAffId}, ${vId}, 'hosp_apollo_01', ${apolloDeptId}, 'Cardiology', 'VISITING_CONSULTANT', false)
      ON CONFLICT (doctor_id, hospital_id) DO UPDATE SET
        employment_status = 'VISITING_CONSULTANT',
        is_primary = false;
    `;
    console.log('✓ Multi-hospital affiliation established for Dr. Vikram Malhotra (Primary: City Care, Visiting: Apollo).');
  }

  console.log('=== Migration Completed Successfully ===');
}

runMigration().then(() => process.exit(0)).catch(e => { console.error('Migration failed:', e); process.exit(1); });
