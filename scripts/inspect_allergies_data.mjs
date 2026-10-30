import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);

async function inspectWithRetry(retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`--- Inspecting Existing Patients (Attempt ${attempt}) ---`);
      const patients = await sql`
        SELECT u.id as user_id, u.full_name, u.email, p.id as patient_id, p.age, p.blood_group, p.allergies
        FROM users u
        LEFT JOIN patients p ON p.user_id = u.id
        WHERE u.role = 'patient'
        ORDER BY u.created_at DESC
        LIMIT 20;
      `;
      console.log(`Found ${patients.length} patients:`);
      patients.forEach((p, idx) => {
        console.log(`${idx + 1}. ${p.full_name} (User ID: ${p.user_id}, Pat ID: ${p.patient_id}) - Allergies: ${p.allergies || 'NULL'}`);
      });
      return;
    } catch (err) {
      console.warn(`Attempt ${attempt} failed: ${err.message}`);
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 2000));
      } else {
        throw err;
      }
    }
  }
}

inspectWithRetry().catch(console.error);
