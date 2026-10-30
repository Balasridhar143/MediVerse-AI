import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';

const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);

async function runMigrationWithRetry(retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[Migration] Starting hospitals and departments migration (Attempt ${attempt})...`);

      // 1. Create hospitals table
      await sql`
        CREATE TABLE IF NOT EXISTS hospitals (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(256) NOT NULL,
          code VARCHAR(64) UNIQUE NOT NULL,
          facility_id VARCHAR(64),
          address VARCHAR(512),
          city VARCHAR(128),
          district VARCHAR(128),
          state VARCHAR(128),
          pin_code VARCHAR(16),
          phone VARCHAR(64),
          email VARCHAR(128),
          bed_capacity INTEGER DEFAULT 150,
          status VARCHAR(64) DEFAULT 'ACTIVE',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;
      console.log('✓ Table hospitals ensured.');

      // 2. Create departments table
      await sql`
        CREATE TABLE IF NOT EXISTS departments (
          id VARCHAR(64) PRIMARY KEY,
          hospital_id VARCHAR(64) REFERENCES hospitals(id) ON DELETE CASCADE,
          name VARCHAR(128) NOT NULL,
          code VARCHAR(64),
          head_doctor_name VARCHAR(128),
          head_doctor_id VARCHAR(64),
          bed_count INTEGER DEFAULT 20,
          status VARCHAR(64) DEFAULT 'ACTIVE',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;
      console.log('✓ Table departments ensured.');

      await sql`CREATE INDEX IF NOT EXISTS idx_departments_hospital ON departments(hospital_id);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);`;

      // 3. Ensure doctor table has department column
      await sql`ALTER TABLE doctors ADD COLUMN IF NOT EXISTS department VARCHAR(128) DEFAULT 'General Medicine';`;

      // 4. Seed real hospitals
      const hospitalsData = [
        {
          id: 'hosp_apollo_01',
          name: 'Apollo Speciality Care',
          code: 'APOLLO-SPL-01',
          facility_id: 'hosp_apollo_01',
          address: '21 Greams Lane, Thousand Lights',
          city: 'Chennai',
          district: 'Chennai',
          state: 'Tamil Nadu',
          pin_code: '600006',
          phone: '+91-44-2829-0200',
          email: 'admin@apollospeciality.org',
          bed_capacity: 550,
        },
        {
          id: 'hosp_1',
          name: 'City Care Multispeciality Hospital',
          code: 'CITYCARE-01',
          facility_id: 'hosp_1',
          address: 'Central Campus, Sector 4, Tech Zone',
          city: 'Bengaluru',
          district: 'Bengaluru Urban',
          state: 'Karnataka',
          pin_code: '560100',
          phone: '+91-80-4912-3400',
          email: 'admin@citycarehealth.org',
          bed_capacity: 350,
        },
        {
          id: 'hosp_ghkarur_01',
          name: 'GH Karur District Headquarters Hospital',
          code: 'GH-KARUR-01',
          facility_id: 'NABH-0923',
          address: 'Hospital Road, Gandhi Gramam',
          city: 'Karur',
          district: 'Karur',
          state: 'Tamil Nadu',
          pin_code: '639004',
          phone: '+91-4324-220100',
          email: 'admin@ghkarur.gov.in',
          bed_capacity: 450,
        },
        {
          id: 'hosp_vm_01',
          name: 'VM Multi-speciality Hospital',
          code: 'VM-HOSP-01',
          facility_id: 'NAJL-33',
          address: 'Perundurai Road, Collectorate Post',
          city: 'Erode',
          district: 'Erode',
          state: 'Tamil Nadu',
          pin_code: '638011',
          phone: '+91-424-222-8800',
          email: 'contact@vmhospital.org',
          bed_capacity: 250,
        },
        {
          id: 'hosp_aiims_01',
          name: 'All India Institute of Medical Sciences (AIIMS)',
          code: 'AIIMS-ND-01',
          facility_id: 'FAC-AIIMS-DELHI',
          address: 'Sri Aurobindo Marg, Ansari Nagar',
          city: 'New Delhi',
          district: 'South Delhi',
          state: 'Delhi',
          pin_code: '110029',
          phone: '+91-11-2658-8500',
          email: 'director@aiims.edu',
          bed_capacity: 2400,
        },
        {
          id: 'hosp_fortis_01',
          name: 'Fortis Memorial Research Institute',
          code: 'FORTIS-GUR-01',
          facility_id: 'FAC-FORTIS-09',
          address: 'Sector 44, Opposite HUDA City Centre',
          city: 'Gurugram',
          district: 'Gurugram',
          state: 'Haryana',
          pin_code: '122002',
          phone: '+91-124-496-2200',
          email: 'reachus@fortishealthcare.com',
          bed_capacity: 310,
        },
      ];

      for (const h of hospitalsData) {
        await sql`
          INSERT INTO hospitals (id, name, code, facility_id, address, city, district, state, pin_code, phone, email, bed_capacity)
          VALUES (${h.id}, ${h.name}, ${h.code}, ${h.facility_id}, ${h.address}, ${h.city}, ${h.district}, ${h.state}, ${h.pin_code}, ${h.phone}, ${h.email}, ${h.bed_capacity})
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            code = EXCLUDED.code,
            facility_id = EXCLUDED.facility_id,
            address = EXCLUDED.address,
            city = EXCLUDED.city,
            district = EXCLUDED.district,
            state = EXCLUDED.state,
            pin_code = EXCLUDED.pin_code,
            phone = EXCLUDED.phone,
            email = EXCLUDED.email,
            bed_capacity = EXCLUDED.bed_capacity;
        `;
      }
      console.log('✓ Seeded authentic hospitals.');

      // 5. Seed standard departments across the hospitals
      const standardDepts = [
        { name: 'Cardiology', code: 'CARD', bedCount: 45, head: 'Dr. Vikram Malhotra' },
        { name: 'Neurology', code: 'NEUR', bedCount: 30, head: 'Dr. Anand Ramanathan' },
        { name: 'Orthopedics', code: 'ORTH', bedCount: 40, head: 'Dr. Ramesh Sundaram' },
        { name: 'Pediatrics', code: 'PED', bedCount: 35, head: 'Dr. Sneha Kulkarni' },
        { name: 'Oncology', code: 'ONC', bedCount: 50, head: 'Dr. Priya Venkatesh' },
        { name: 'General Medicine', code: 'GENMED', bedCount: 60, head: 'Dr. Sunita Sharma' },
        { name: 'Dermatology', code: 'DERM', bedCount: 15, head: 'Dr. Meera Iyer' },
        { name: 'Radiology & Imaging', code: 'RAD', bedCount: 10, head: 'Dr. Arvind Swaminathan' },
        { name: 'Emergency & Trauma Care', code: 'EMERG', bedCount: 25, head: 'Dr. Rajesh Nair' },
        { name: 'Pulmonology', code: 'PULM', bedCount: 30, head: 'Dr. Rajesh Nair' },
        { name: 'Gastroenterology', code: 'GASTRO', bedCount: 25, head: 'Dr. Sanjay Gupta' },
        { name: 'Nephrology', code: 'NEPH', bedCount: 20, head: 'Dr. Kavita Krishnan' },
      ];

      for (const h of hospitalsData) {
        for (const d of standardDepts) {
          const deptId = `dept_${h.id}_${d.code.toLowerCase()}`;
          await sql`
            INSERT INTO departments (id, hospital_id, name, code, head_doctor_name, bed_count, status)
            VALUES (${deptId}, ${h.id}, ${d.name}, ${d.code}, ${d.head}, ${d.bedCount}, 'ACTIVE')
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              code = EXCLUDED.code,
              head_doctor_name = EXCLUDED.head_doctor_name,
              bed_count = EXCLUDED.bed_count;
          `;
        }
      }
      console.log('✓ Seeded authentic clinical departments.');

      // 6. Associate existing doctors with hospital_id and departments
      await sql`
        UPDATE doctors
        SET hospital_id = 'hosp_apollo_01'
        WHERE (hospital_name ILIKE '%Apollo%' OR hospital_id IS NULL)
          AND id IN (SELECT id FROM doctors WHERE hospital_name ILIKE '%Apollo%');
      `;

      await sql`
        UPDATE doctors
        SET hospital_id = 'hosp_1'
        WHERE (hospital_name ILIKE '%City Care%' OR hospital_id IS NULL)
          AND id IN (SELECT id FROM doctors WHERE hospital_name ILIKE '%City Care%');
      `;

      // Assign remaining unlinked doctors to hosp_1 by default
      await sql`
        UPDATE doctors
        SET hospital_id = 'hosp_1'
        WHERE hospital_id IS NULL;
      `;

      // Align specialization to department if needed
      await sql`
        UPDATE doctors
        SET department = CASE
          WHEN specialization ILIKE '%Cardio%' THEN 'Cardiology'
          WHEN specialization ILIKE '%Neuro%' THEN 'Neurology'
          WHEN specialization ILIKE '%Ortho%' THEN 'Orthopedics'
          WHEN specialization ILIKE '%Pediatric%' THEN 'Pediatrics'
          WHEN specialization ILIKE '%Onco%' THEN 'Oncology'
          WHEN specialization ILIKE '%Derma%' THEN 'Dermatology'
          WHEN specialization ILIKE '%Pulmon%' THEN 'Pulmonology'
          WHEN specialization ILIKE '%Radiol%' THEN 'Radiology & Imaging'
          WHEN specialization ILIKE '%Emerg%' THEN 'Emergency & Trauma Care'
          ELSE 'General Medicine'
        END
        WHERE department IS NULL OR department = 'General Medicine';
      `;

      console.log('✓ Doctor affiliations synchronized with hospitals and departments.');
      console.log('=== Migration Completed Successfully ===');
      return true;
    } catch (err) {
      console.error(`Migration error on attempt ${attempt}:`, err);
      if (attempt === retries) throw err;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

runMigrationWithRetry()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Fatal migration failure:', e);
    process.exit(1);
  });
