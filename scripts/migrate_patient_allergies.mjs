import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';

const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);

async function runMigrationWithRetry(retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[Migration] Starting patient_allergies migration (Attempt ${attempt})...`);

      // 1. Create patient_allergies table
      await sql`
        CREATE TABLE IF NOT EXISTS patient_allergies (
          id VARCHAR(64) PRIMARY KEY,
          patient_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          allergen VARCHAR(128) NOT NULL,
          category VARCHAR(64) NOT NULL DEFAULT 'Medication allergy',
          reaction VARCHAR(256),
          severity VARCHAR(64) NOT NULL DEFAULT 'Moderate',
          date_identified VARCHAR(64),
          notes TEXT,
          verification_status VARCHAR(64) NOT NULL DEFAULT 'CONFIRMED',
          documented_by_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
          documented_by_name VARCHAR(128),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;
      console.log('✓ Table patient_allergies ensured.');

      await sql`CREATE INDEX IF NOT EXISTS idx_patient_allergies_patient ON patient_allergies(patient_id);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_patient_allergies_allergen ON patient_allergies(allergen);`;

      // 2. Add columns to patients table
      await sql`ALTER TABLE patients ADD COLUMN IF NOT EXISTS allergy_status VARCHAR(32) DEFAULT 'UNDOCUMENTED';`;
      await sql`ALTER TABLE patients ADD COLUMN IF NOT EXISTS allergy_confirmed_at TIMESTAMP WITH TIME ZONE;`;
      await sql`ALTER TABLE patients ADD COLUMN IF NOT EXISTS allergy_confirmed_by VARCHAR(128);`;
      console.log('✓ Columns added to patients table.');

      // 3. Migrate existing text records into structured patient_allergies
      // Patient 1: Anita Desai (usr_7e5e2aee077831d7) -> Penicillin
      const anitaId = 'usr_7e5e2aee077831d7';
      const existingAnita = await sql`SELECT id FROM patient_allergies WHERE patient_id = ${anitaId} AND allergen ILIKE '%Penicillin%';`;
      if (existingAnita.length === 0) {
        const algId = 'alg_' + crypto.randomBytes(6).toString('hex');
        await sql`
          INSERT INTO patient_allergies (
            id, patient_id, allergen, category, reaction, severity, date_identified, notes, verification_status, documented_by_name
          ) VALUES (
            ${algId}, ${anitaId}, 'Penicillin / Beta-Lactam Antibiotics', 'Medication allergy',
            'Severe cutaneous urticaria, facial angioedema, throat tightness', 'Severe',
            '2021', 'Strict contraindication to all aminopenicillins and beta-lactam derivatives', 'CONFIRMED', 'Dr. Sunita Deshmukh'
          );
        `;
        await sql`UPDATE patients SET allergy_status = 'DOCUMENTED', allergies = 'Penicillin / Beta-Lactam Antibiotics' WHERE user_id = ${anitaId};`;
        console.log('✓ Migrated Penicillin allergy for Anita Desai');
      }

      // Patient 2: Kailash (usr_e1bc91a478bebe47) -> Peanut allergy
      const kailashId = 'usr_e1bc91a478bebe47';
      const existingKailash = await sql`SELECT id FROM patient_allergies WHERE patient_id = ${kailashId} AND allergen ILIKE '%Peanut%';`;
      if (existingKailash.length === 0) {
        const algId = 'alg_' + crypto.randomBytes(6).toString('hex');
        await sql`
          INSERT INTO patient_allergies (
            id, patient_id, allergen, category, reaction, severity, date_identified, notes, verification_status, documented_by_name
          ) VALUES (
            ${algId}, ${kailashId}, 'Peanuts & Tree Nuts', 'Food allergy',
            'Oral pruritus, facial edema, acute bronchospasm', 'Severe',
            '2019', 'Carries emergency epinephrine autoinjector', 'CONFIRMED', 'Dr. Rajesh Patel'
          );
        `;
        await sql`UPDATE patients SET allergy_status = 'DOCUMENTED', allergies = 'Peanuts & Tree Nuts' WHERE user_id = ${kailashId};`;
        console.log('✓ Migrated Food allergy for Kailash');
      }

      // Patient 3: Synthetic Patient Kavya (usr_bb358f04a5ec8324) -> Multiple Allergies
      const kavyaMultiId = 'usr_bb358f04a5ec8324';
      const existingKavya = await sql`SELECT id FROM patient_allergies WHERE patient_id = ${kavyaMultiId};`;
      if (existingKavya.length === 0) {
        const allergies = [
          {
            allergen: 'Sulfonamides (Sulfa Drugs)',
            category: 'Medication allergy',
            reaction: 'Generalized maculopapular rash, epidermal pruritus',
            severity: 'Moderate',
            notes: 'Avoid Bactrim, Septra, and all sulfonamide antibiotics',
          },
          {
            allergen: 'Ibuprofen & NSAIDs',
            category: 'Medication allergy',
            reaction: 'Epigastric distress, bronchospasm, peri-orbital hives',
            severity: 'Moderate',
            notes: 'Avoid NSAIDs, Naproxen, and Diclofenac. Use Paracetamol safely.',
          },
          {
            allergen: 'Iodinated Radiographic Contrast Media',
            category: 'Other allergies',
            reaction: 'Flushing, nausea, mild laryngeal sensation',
            severity: 'Moderate',
            notes: 'Pre-medication required prior to IV contrast studies',
          },
        ];

        for (const a of allergies) {
          const algId = 'alg_' + crypto.randomBytes(6).toString('hex');
          await sql`
            INSERT INTO patient_allergies (
              id, patient_id, allergen, category, reaction, severity, date_identified, notes, verification_status, documented_by_name
            ) VALUES (
              ${algId}, ${kavyaMultiId}, ${a.allergen}, ${a.category},
              ${a.reaction}, ${a.severity},
              '2022', ${a.notes}, 'CONFIRMED', 'Dr. Arun Kumar'
            );
          `;
        }
        await sql`UPDATE patients SET allergy_status = 'DOCUMENTED', allergies = 'Sulfonamides (Sulfa Drugs), Ibuprofen & NSAIDs, Iodinated Contrast Media' WHERE user_id = ${kavyaMultiId};`;
        console.log('✓ Migrated Multiple Allergies for Synthetic Patient Kavya');
      }

      // Patient 4: Gokulsankar V (usr_c50858c60bab0809) -> Confirmed NO KNOWN ALLERGIES (State B)
      const gokulId = 'usr_c50858c60bab0809';
      await sql`
        UPDATE patients
        SET allergy_status = 'CONFIRMED_NKDA',
            allergy_confirmed_at = NOW(),
            allergy_confirmed_by = 'Dr. Bala Sridhar (Consultation Clinical Intake)',
            allergies = 'No Known Allergies (NKDA Confirmed)'
        WHERE user_id = ${gokulId};
      `;
      console.log('✓ Confirmed No Known Allergies (NKDA) for Gokulsankar V');

      // Patient 5: Synthetic Patient Kavya (usr_01559794ca248c60) -> Explicitly UNDOCUMENTED (State C)
      const kavyaUndocId = 'usr_01559794ca248c60';
      await sql`
        UPDATE patients
        SET allergy_status = 'UNDOCUMENTED',
            allergy_confirmed_at = NULL,
            allergy_confirmed_by = NULL,
            allergies = NULL
        WHERE user_id = ${kavyaUndocId};
      `;
      await sql`DELETE FROM patient_allergies WHERE patient_id = ${kavyaUndocId};`;
      console.log('✓ Set State C (UNDOCUMENTED) for Synthetic Patient Kavya (usr_01559794ca248c60)');

      // Verify row counts
      const counts = await sql`
        SELECT COUNT(*) as total_allergies FROM patient_allergies;
      `;
      console.log(`✓ Total structured allergy records in DB: ${counts[0].total_allergies}`);

      console.log('[Migration] Migration successfully completed!');
      return;
    } catch (err) {
      console.warn(`[Migration] Attempt ${attempt} error: ${err.message}`);
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 2000));
      } else {
        throw err;
      }
    }
  }
}

runMigrationWithRetry().catch((err) => {
  console.error('[Migration] Fatal error:', err);
  process.exit(1);
});

