import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

const dbUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_ILe9fG7nqVxk@ep-odd-violet-b8mtt393-pooler.c-14.us-east-1.aws.neon.tech/neondb?sslmode=require';
const sql = neon(dbUrl);

import { executeMedicalReportRAGPipeline } from '../api/reportRAG.js';

async function testInsert() {
  console.log('Testing DB insert of medical report...');
  const res = await executeMedicalReportRAGPipeline({
    patientName: 'Balasridhar S.',
    reportType: 'Complete Blood Count (CBC) & Biochemistry',
    hospital: 'City Care Diagnostics',
    rawText: 'Hemoglobin: 12.5 g/dL'
  });

  const reportId = 'rep_test_' + Date.now();
  const todayStr = new Date().toISOString().split('T')[0];

  try {
    await sql`
      INSERT INTO medical_reports (
        id, user_id, patient_name, report_name, report_type,
        hospital, doctor, status, date,
        parameters, structured_data, ai_explanation,
        extracted_text, rag_citations, file_name, file_size, file_type, created_at
      ) VALUES (
        ${reportId}, ${null}, 'Balasridhar S.', 'CBC Test Report', 'Blood Tests',
        'City Care Diagnostics', 'Dr. Arun', 'Ready', ${todayStr},
        ${JSON.stringify(res.parameters || [])},
        ${JSON.stringify(res.structured_data || {})},
        ${JSON.stringify(res.ai_explanation || {})},
        ${res.extracted_text || ''},
        ${JSON.stringify(res.rag_citations || [])},
        'test.pdf',
        1000,
        'application/pdf',
        NOW()
      );
    `;
    console.log('Insert SUCCESSFUL! Cleaning up test record...');
    await sql`DELETE FROM medical_reports WHERE id = ${reportId};`;
    console.log('Cleaned up.');
  } catch (err) {
    console.error('Insert error:', err);
  }
}

testInsert();
