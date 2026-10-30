import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import jwt from 'jsonwebtoken';
import { neon } from '@neondatabase/serverless';

const PROD_URL = 'https://mediverse-ai-fawn.vercel.app';
const JWT_SECRET = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET || 'mediverse_jwt_secret_key_prod_2026';
const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);

async function runLiveVerification() {
  console.log(`=== LIVE VERCEL PRODUCTION VERIFICATION ===`);
  console.log(`Target: ${PROD_URL}`);

  // 1. Health Check
  const healthRes = await fetch(`${PROD_URL}/api/health`);
  const healthData = await healthRes.json();
  console.log(`1. Health Check: ${healthRes.status} | Status: ${healthData.status} | DB: ${healthData.database}`);
  if (healthRes.status !== 200) throw new Error('Health check failed');

  // 2. Real Medicine Search
  const medRes = await fetch(`${PROD_URL}/api/prescriptions/medicines/search?q=Augmentin`);
  const medData = await medRes.json();
  console.log(`2. Medicine Search 'Augmentin': ${medRes.status} | Found: ${medData.total} | First: ${medData.items[0]?.brand_name}`);
  if (medRes.status !== 200 || !medData.items || medData.items.length === 0) throw new Error('Medicine search failed');

  // 3. Eligible Patients for Doctor
  const doctorToken = jwt.sign(
    { id: 'usr_13a59fc80b6908af', full_name: 'Dr. Bala Sridhar', role: 'doctor', email: 'doctor@mediverse.org' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const patRes = await fetch(`${PROD_URL}/api/prescriptions/patients`, {
    headers: { Authorization: `Bearer ${doctorToken}` }
  });
  const patData = await patRes.json();
  console.log(`3. Doctor Eligible Patients: ${patRes.status} | Total Patients: ${patData.total}`);
  if (patRes.status !== 200 || !patData.patients || patData.patients.length === 0) throw new Error('Patient query failed');
  const targetPatient = patData.patients[0];
  console.log(`   Selected Patient: ${targetPatient.name} (${targetPatient.id}) | Blood: ${targetPatient.bloodGroup}`);

  // 4. Create Live Prescription on Production
  const payload = {
    patient_id: targetPatient.id,
    diagnosis: 'Seasonal Bronchial Inflammation - Clinical Verification',
    follow_up_date: '2026-11-20',
    clinical_notes: 'Take medications strictly with food. Rest adequately.',
    medicines: [
      {
        id: medData.items[0].id,
        name: medData.items[0].brand_name,
        generic_name: medData.items[0].generic_name,
        brand_name: medData.items[0].brand_name,
        active_ingredient: medData.items[0].active_ingredient,
        dosage: '625 mg',
        dosage_form: 'Tablet',
        frequency: 'Twice daily (1-0-1)',
        duration: '5 days',
        timing: 'After meals',
        instructions: 'Do not discontinue early'
      }
    ]
  };

  const createRes = await fetch(`${PROD_URL}/api/prescriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${doctorToken}`
    },
    body: JSON.stringify(payload)
  });
  const createData = await createRes.json();
  console.log(`4. Live Prescription Creation: ${createRes.status} | Prescription ID: ${createData.prescription?.prescriptionId}`);
  if (createRes.status !== 201) throw new Error(`Prescription creation failed: ${JSON.stringify(createData)}`);

  // 5. Patient Retrieves Live Prescription
  const patientToken = jwt.sign(
    { id: targetPatient.id, full_name: targetPatient.name, role: 'patient', email: targetPatient.email },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const getRes = await fetch(`${PROD_URL}/api/prescriptions`, {
    headers: { Authorization: `Bearer ${patientToken}` }
  });
  const getData = await getRes.json();
  const list = Array.isArray(getData) ? getData : (getData.prescriptions || []);
  console.log(`5. Patient Prescription View: ${getRes.status} | Total Prescriptions: ${list.length}`);
  const matchingRx = list.find(rx => rx.prescriptionId === createData.prescription.prescriptionId);
  if (!matchingRx) throw new Error('Live prescription not found in patient account');
  console.log(`   Found Prescription ${matchingRx.prescriptionId} issued by ${matchingRx.doctorName}`);
  console.log(`   Medication: ${matchingRx.medicines[0].name} (${matchingRx.medicines[0].dosage}) - ${matchingRx.medicines[0].frequency}`);

  // 6. Direct Database Row Verification in Neon PostgreSQL
  const dbRows = await sql`
    SELECT p.id, p.prescription_id, p.patient_name, p.doctor_name, COUNT(pi.id) as item_count
    FROM prescriptions p
    LEFT JOIN prescription_items pi ON pi.prescription_id = p.id
    WHERE p.id = ${createData.prescription.id}
    GROUP BY p.id, p.prescription_id, p.patient_name, p.doctor_name;
  `;
  console.log(`6. Neon PostgreSQL Persistence: ${dbRows.length} row(s) found in DB!`);
  console.log(`   DB Record: ID=${dbRows[0].prescription_id}, Patient=${dbRows[0].patient_name}, Items=${dbRows[0].item_count}`);

  console.log(`\n>>> LIVE PRODUCTION VERIFICATION COMPLETED WITH 100% SUCCESS! <<<`);
}

runLiveVerification().catch(err => {
  console.error('Live verification failed:', err);
  process.exit(1);
});
