import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { ensureTables } from '../api/index.js';

dotenv.config({ path: '.env.local' });

async function run() {
  const sql = neon(process.env.DATABASE_URL);
  console.log('Testing ensureTables with Neon database...');
  await ensureTables(sql);
  console.log('ensureTables completed successfully.');

  const doctors = await sql`
    SELECT specialization, department, full_name, hospital_name
    FROM doctors
    ORDER BY department ASC;
  `;
  console.log(`Total doctors now in database: ${doctors.length}`);
  console.log('Sample specializations:');
  const distinctDepts = Array.from(new Set(doctors.map(d => d.department)));
  console.log('Distinct departments:', distinctDepts);

  const coreDepts = [
    'Cardiology', 'Dermatology', 'Ophthalmology', 'Orthopedics',
    'Gastroenterology', 'ENT', 'Neurology', 'Nephrology',
    'Urology', 'Pediatrics', 'Gynecology', 'General Medicine', 'Pulmonology'
  ];

  for (const dept of coreDepts) {
    const hasDoc = doctors.some(d => (d.department || '').toLowerCase().includes(dept.toLowerCase()) || (d.specialization || '').toLowerCase().includes(dept.toLowerCase()));
    console.log(`  Core Department [${dept}]: ${hasDoc ? 'VERIFIED ACTIVE DOCTOR FOUND' : 'MISSING'}`);
    if (!hasDoc) {
      throw new Error(`Missing doctor for core department ${dept}`);
    }
  }

  console.log('ALL CORE MEDICAL SPECIALTIES HAVE VERIFIED REGISTERED PRACTITIONERS!');
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});

