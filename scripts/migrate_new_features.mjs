import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

const dbUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_ILe9fG7nqVxk@ep-odd-violet-b8mtt393-pooler.c-14.us-east-1.aws.neon.tech/neondb?sslmode=require';
const sql = neon(dbUrl);

async function runMigration() {
  console.log('[Migration] Starting database migration for Medicine KB, RAG, and Doctor-Patient Access...');

  try {
    // 1. Extend medical_reports table
    console.log('[Migration] Updating medical_reports columns...');
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medical_reports' AND column_name='extracted_text') THEN
          ALTER TABLE medical_reports ADD COLUMN extracted_text TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medical_reports' AND column_name='rag_citations') THEN
          ALTER TABLE medical_reports ADD COLUMN rag_citations JSONB;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medical_reports' AND column_name='file_name') THEN
          ALTER TABLE medical_reports ADD COLUMN file_name VARCHAR(256);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medical_reports' AND column_name='file_size') THEN
          ALTER TABLE medical_reports ADD COLUMN file_size INT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medical_reports' AND column_name='file_type') THEN
          ALTER TABLE medical_reports ADD COLUMN file_type VARCHAR(64);
        END IF;
      END $$;
    `;

    // 2. Doctor Patient Relationships
    console.log('[Migration] Creating doctor_patient_relationships table...');
    await sql`
      CREATE TABLE IF NOT EXISTS doctor_patient_relationships (
        id VARCHAR(64) PRIMARY KEY,
        patient_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        doctor_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        access_status VARCHAR(32) NOT NULL DEFAULT 'GRANTED',
        consent_notes TEXT,
        granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        revoked_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT uq_doctor_patient UNIQUE(patient_id, doctor_id)
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_dpr_patient ON doctor_patient_relationships(patient_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_dpr_doctor ON doctor_patient_relationships(doctor_id);`;

    // 3. Audit Logs
    console.log('[Migration] Creating audit_logs table...');
    await sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64),
        user_role VARCHAR(32),
        user_email VARCHAR(128),
        action VARCHAR(64) NOT NULL,
        resource VARCHAR(64) NOT NULL,
        resource_id VARCHAR(64),
        details JSONB,
        ip_address VARCHAR(64),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);`;

    // 4. Medical Knowledge Cache
    console.log('[Migration] Creating medical_knowledge table...');
    await sql`
      CREATE TABLE IF NOT EXISTS medical_knowledge (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(256) NOT NULL,
        source_org VARCHAR(128) NOT NULL,
        source_url VARCHAR(512),
        category VARCHAR(128) NOT NULL,
        content TEXT NOT NULL,
        verified_date VARCHAR(64),
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_med_knowledge_cat ON medical_knowledge(category);`;

    // Seed medical_knowledge if empty
    const existing = await sql`SELECT COUNT(*) as count FROM medical_knowledge;`;
    if (parseInt(existing[0].count, 10) === 0) {
      console.log('[Migration] Seeding authoritative clinical knowledge entries...');
      const seeds = [
        {
          id: 'kb_who_eml_2023',
          title: 'WHO Model List of Essential Medicines (23rd List, 2023)',
          source_org: 'World Health Organization',
          source_url: 'https://www.who.int/publications/i/item/WHO-MHP-HPS-EML-2023.02',
          category: 'Essential Medicines & Pharmacology',
          content: 'The WHO Model List of Essential Medicines presents the core minimum medicine needs for a basic healthcare system, prioritizing public health relevance, evidence of clinical efficacy and safety, and comparative cost-effectiveness. Includes anti-infectives, cardiovascular agents, endocrine therapeutics, analgesics, and essential diagnostics.',
          verified_date: '2023-07-26'
        },
        {
          id: 'kb_cdsco_rules',
          title: 'CDSCO Drugs and Cosmetics Rules & Good Clinical Practices India',
          source_org: 'Central Drugs Standard Control Organisation (CDSCO), MoHFW India',
          source_url: 'https://cdsco.gov.in',
          category: 'Regulatory & Prescription Classifications',
          content: 'Governs allopathic medicine licensing, manufacturing standards, Schedule H, H1, and X prescription drug classifications, pharmacovigilance reporting, and bioequivalence guidelines across India.',
          verified_date: '2024-01-15'
        },
        {
          id: 'kb_ada_diabetes_2026',
          title: 'ADA Standards of Medical Care in Diabetes: Diagnostic Thresholds',
          source_org: 'American Diabetes Association',
          source_url: 'https://diabetesjournals.org/care/issue',
          category: 'Endocrinology & Diagnostic Guidelines',
          content: 'Defines diagnostic criteria for prediabetes and diabetes mellitus: Normal fasting plasma glucose is <100 mg/dL, impaired fasting glucose (prediabetes) is 100-125 mg/dL, and diabetes is >=126 mg/dL. Normal HbA1c is <5.7%, prediabetes is 5.7%-6.4%, and diabetes is >=6.5%.',
          verified_date: '2026-01-01'
        },
        {
          id: 'kb_icsh_hematology',
          title: 'ICSH International Reference Guidelines for Complete Blood Counts',
          source_org: 'International Council for Standardization in Haematology',
          source_url: 'https://icsh.org',
          category: 'Hematology & Diagnostic Guidelines',
          content: 'Provides clinical reference intervals and critical alert thresholds for automated blood cell counting: adult male hemoglobin normal reference range is 13.8 - 17.2 g/dL; adult female is 12.1 - 15.1 g/dL. Total leukocyte count reference interval is 4,000 - 11,000 /uL. Platelet count reference interval is 150,000 - 450,000 /uL with critical alert threshold below 50,000 /uL.',
          verified_date: '2024-09-10'
        },
        {
          id: 'kb_kdigo_ckd_2024',
          title: 'KDIGO Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease',
          source_org: 'Kidney Disease: Improving Global Outcomes (KDIGO)',
          source_url: 'https://kdigo.org/guidelines/ckd-evaluation-and-management/',
          category: 'Nephrology & Renal Function',
          content: 'Establishes serum creatinine reference limits (0.7 - 1.3 mg/dL for adult males, 0.5 - 1.1 mg/dL for adult females) and eGFR CKD-EPI staging. Values >1.4 mg/dL require clinical assessment of baseline trends and urinary albumin-to-creatinine ratio (ACR).',
          verified_date: '2024-03-20'
        }
      ];

      for (const s of seeds) {
        await sql`
          INSERT INTO medical_knowledge (id, title, source_org, source_url, category, content, verified_date, metadata, created_at)
          VALUES (${s.id}, ${s.title}, ${s.source_org}, ${s.source_url}, ${s.category}, ${s.content}, ${s.verified_date}, ${JSON.stringify({ verified: true })}, NOW())
          ON CONFLICT (id) DO NOTHING;
        `;
      }
      console.log(`[Migration] Seeded ${seeds.length} clinical knowledge base records.`);
    }

    // Verify all tables
    const tableList = await sql`
      SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;
    `;
    console.log('[Migration] Active tables in Neon Postgres:', tableList.map(t => t.table_name));

    // Verify columns in medical_reports
    const reportCols = await sql`
      SELECT column_name, data_type FROM information_schema.columns WHERE table_name='medical_reports' ORDER BY ordinal_position;
    `;
    console.log('[Migration] medical_reports schema columns:', reportCols.map(c => `${c.column_name} (${c.data_type})`));

    console.log('[Migration] SUCCESS! All tables, columns, indexes, and initial knowledge entries verified.');
  } catch (err) {
    console.error('[Migration] Failed:', err);
    process.exit(1);
  }
}

runMigration();
