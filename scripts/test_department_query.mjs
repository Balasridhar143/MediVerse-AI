import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

async function main() {
  const sql = neon(process.env.DATABASE_URL);
  const hospitalId = 'hosp_1';
  const depts = await sql`
    SELECT 
      d.id,
      d.name,
      d.code,
      d.head_doctor_name as "headDoctor",
      d.bed_count as "bedCount",
      d.status,
      d.hospital_id as "hospitalId",
      h.name as "hospitalName",
      COUNT(DISTINCT doc.id)::int as "registeredDoctors",
      COUNT(DISTINCT doc.id)::int as "doctorsCount",
      COUNT(DISTINCT CASE WHEN doc.is_available = true THEN doc.id END)::int as "activeDoctors",
      COUNT(DISTINCT CASE WHEN doc.is_verified = true THEN doc.id END)::int as "verifiedDoctors",
      COUNT(DISTINCT COALESCE(apt.patient_id, pr.patient_id))::int as "registeredPatients",
      COUNT(DISTINCT apt.id)::int as "totalAppointments",
      COUNT(DISTINCT CASE WHEN apt.status = 'COMPLETED' THEN apt.id END)::int as "completedAppointments",
      COUNT(DISTINCT CASE WHEN apt.status IN ('PENDING', 'CONFIRMED', 'SCHEDULED') THEN apt.id END)::int as "pendingAppointments",
      COUNT(DISTINCT CASE WHEN apt.appointment_date = TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') THEN apt.id END)::int as "appointmentsToday"
    FROM departments d
    LEFT JOIN hospitals h ON d.hospital_id = h.id
    LEFT JOIN doctor_hospital_affiliations dha ON (dha.department_id = d.id OR dha.department_name = d.name) AND dha.hospital_id = d.hospital_id
    LEFT JOIN doctors doc ON (doc.id = dha.doctor_id OR (doc.hospital_id = d.hospital_id AND (doc.department_id = d.id OR doc.department = d.name)))
    LEFT JOIN appointments apt ON (apt.department = d.name AND (apt.hospital_name = h.name OR apt.doctor_id = doc.id))
    LEFT JOIN patient_registrations pr ON (pr.hospital_id = d.hospital_id AND pr.department = d.name)
    WHERE d.hospital_id = ${hospitalId}
    GROUP BY d.id, d.name, d.code, d.head_doctor_name, d.bed_count, d.status, d.hospital_id, h.name
    ORDER BY d.name ASC;
  `;
  console.log('Returned', depts.length, 'departments for hosp_1');
  console.log('Sample depts:');
  depts.slice(0, 3).forEach(d => console.log(JSON.stringify(d, null, 2)));

  // Test for another hospital (e.g. hosp_apollo_01)
  const apolloDepts = await sql`
    SELECT 
      d.id,
      d.name,
      d.code,
      COUNT(DISTINCT doc.id)::int as "registeredDoctors",
      COUNT(DISTINCT CASE WHEN doc.is_available = true THEN doc.id END)::int as "activeDoctors"
    FROM departments d
    LEFT JOIN doctor_hospital_affiliations dha ON (dha.department_id = d.id OR dha.department_name = d.name) AND dha.hospital_id = d.hospital_id
    LEFT JOIN doctors doc ON (doc.id = dha.doctor_id OR (doc.hospital_id = d.hospital_id AND (doc.department_id = d.id OR doc.department = d.name)))
    WHERE d.hospital_id = 'hosp_apollo_01'
    GROUP BY d.id, d.name, d.code
    ORDER BY d.name ASC;
  `;
  console.log('Apollo depts sample:');
  apolloDepts.slice(0, 3).forEach(d => console.log(JSON.stringify(d, null, 2)));
}

main().catch(console.error);
