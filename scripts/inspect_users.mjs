import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);

async function inspect() {
  const users = await sql`SELECT id, full_name, email, role FROM users ORDER BY created_at ASC LIMIT 20;`;
  console.log('Registered Users:', users);

  const patients = await sql`SELECT id, user_id, full_name, age, gender, blood_group FROM patients LIMIT 20;`;
  console.log('Patient Profiles:', patients);

  const doctors = await sql`SELECT id, user_id, full_name, specialization, hospital_name FROM doctors LIMIT 20;`;
  console.log('Doctor Profiles:', doctors);

  const appointments = await sql`SELECT id, patient_id, doctor_id, doctor_name, patient_name, status, appointment_date FROM appointments LIMIT 20;`;
  console.log('Appointments:', appointments);
}

inspect().catch(console.error);
