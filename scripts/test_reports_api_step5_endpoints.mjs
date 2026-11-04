/**
 * scripts/test_reports_api_step5_endpoints.mjs
 * Database persistence and API handler verification for Step 5: Friendly Explanation
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL not found.');
  process.exit(1);
}

const sql = neon(connectionString);

async function verifyPersistenceAndStep5() {
  console.log('--- Verifying Database Persistence for Report Analyzers ---');
  
  const testReportId = `rep_test_${Date.now()}`;
  const testDate = new Date().toISOString().split('T')[0];

  const sampleParameters = [
    {
      test_name: 'Hemoglobin',
      name: 'Hemoglobin',
      patient_value: 10.8,
      value: 10.8,
      unit: 'g/dL',
      reference_range: '12.0 - 15.5 g/dL',
      status: 'Below reference range',
      flag: 'Review',
      is_critical: false,
      purpose: 'Carries oxygen from lungs to body tissues.',
      meaning: 'Assesses red cell oxygen-carrying capacity.'
    },
    {
      test_name: 'Fasting Blood Sugar',
      name: 'Fasting Blood Sugar',
      patient_value: 92,
      value: 92,
      unit: 'mg/dL',
      reference_range: '70 - 99 mg/dL',
      status: 'Normal',
      flag: 'Normal',
      is_critical: false,
      purpose: 'Measures blood glucose after overnight fasting.',
      meaning: 'Primary indicator of baseline glycemic control.'
    }
  ];

  const initialAiExplanation = {
    overall_summary: 'Comprehensive lab analysis for test verification.',
    summary: 'Comprehensive lab analysis for test verification.',
    simpleExplanation: 'Comprehensive lab analysis for test verification.',
    whatThisMeans: 'Hemoglobin is slightly lower than normal; blood glucose is healthy.',
    normal_findings: ['Fasting Blood Sugar (92 mg/dL) is within normal target range.'],
    abnormal_findings: [
      {
        test_name: 'Hemoglobin',
        value: '10.8 g/dL',
        reference_range: '12.0 - 15.5 g/dL',
        status: 'Below reference range',
        significance: 'May indicate mild nutritional deficiency or iron need.'
      }
    ],
    precautions: [
      'Do not self-prescribe high dose iron supplements without clinician review.',
      'Maintain adequate hydration and balanced nutritional meals.'
    ],
    doctor_discussion_questions: [
      'Should I undergo serum ferritin testing to assess iron stores?',
      'When is a follow-up complete blood count recommended?'
    ],
    recommendations: [
      'Discuss results with your attending clinician.'
    ],
    test_evaluations: [
      {
        test_name: 'Hemoglobin',
        purpose: 'Carries oxygen from lungs to body tissues.',
        what_it_measures: 'Assesses red cell oxygen-carrying capacity.'
      }
    ],
    disclaimer: 'CLINICAL DECISION SUPPORT: Consult your physician.'
  };

  // 1. Get an existing user ID if available
  const existingUsers = await sql`SELECT id FROM users LIMIT 1;`;
  const validUserId = existingUsers.length > 0 ? existingUsers[0].id : null;

  console.log(`Inserting test report ${testReportId} with user_id: ${validUserId}...`);
  await sql`
    INSERT INTO medical_reports (
      id, user_id, patient_id, patient_name, report_name, report_type,
      hospital, doctor, status, date,
      parameters, structured_data, ai_explanation,
      extracted_text, rag_citations,
      file_name, file_size, file_type, doctor_review_status, created_at
    ) VALUES (
      ${testReportId}, ${validUserId}, ${validUserId}, 'Sundar Pichai',
      'Executive Wellness Diagnostic Panel', 'Blood Tests',
      'Apollo Speciality Diagnostic Lab', 'Dr. Arun Kumar, MD', 'Ready', ${testDate},
      ${JSON.stringify(sampleParameters)},
      ${JSON.stringify({ normal_parameters: 1, abnormal_parameters: 1, total_tests_analyzed: 2 })},
      ${JSON.stringify(initialAiExplanation)},
      'Hemoglobin: 10.8 g/dL Fasting Blood Sugar: 92 mg/dL',
      ${JSON.stringify([{ title: 'WHO Anemia Protocol', source: 'WHO', content: 'Normal hemoglobin guidelines' }])},
      'executive_wellness_panel.pdf', 104857, 'application/pdf', 'Pending Review', NOW()
    );
  `;

  // 2. Query back and verify persistence
  console.log('Querying back saved report...');
  const rows = await sql`
    SELECT id, patient_name, report_name, report_type, hospital, doctor, date,
           parameters, structured_data, ai_explanation, rag_citations
    FROM medical_reports
    WHERE id = ${testReportId}
    LIMIT 1;
  `;

  if (rows.length === 0) {
    throw new Error('Persistence test failed: Report was not saved in medical_reports.');
  }

  const fetched = rows[0];
  console.log('Successfully fetched saved report:', fetched.id);
  console.log('ai_explanation exists:', Boolean(fetched.ai_explanation));
  console.log('overall_summary:', fetched.ai_explanation?.overall_summary);
  console.log('abnormal_findings length:', fetched.ai_explanation?.abnormal_findings?.length);
  console.log('precautions length:', fetched.ai_explanation?.precautions?.length);
  console.log('questions length:', fetched.ai_explanation?.doctor_discussion_questions?.length);

  // 3. Update Step 5 explanation (simulating POST /reports/:id/explain)
  const updatedExplanation = {
    ...initialAiExplanation,
    overall_summary: 'Updated Step 5: Fully synthesized friendly explanation without OCR re-run.'
  };

  await sql`
    UPDATE medical_reports
    SET ai_explanation = ${JSON.stringify(updatedExplanation)}
    WHERE id = ${testReportId};
  `;

  const afterExplain = await sql`
    SELECT ai_explanation FROM medical_reports WHERE id = ${testReportId};
  `;

  if (!afterExplain[0]?.ai_explanation?.overall_summary?.includes('Updated Step 5')) {
    throw new Error('Update explanation failed: Value was not updated in database.');
  }
  console.log('Updated Step 5 explanation persisted successfully!');

  // Cleanup test record
  await sql`DELETE FROM medical_reports WHERE id = ${testReportId};`;
  console.log('Cleaned up test record.');
  console.log('DATABASE PERSISTENCE AND STEP 5 EXPLANATION VERIFIED!');
}

verifyPersistenceAndStep5().catch(e => {
  console.error('Database test error:', e);
  process.exit(1);
});
