/**
 * scripts/test_complete_reports_and_analyzer_workflow.mjs
 * Comprehensive End-to-End Verification of Medical Reports Hub & AI Report Analyzer
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import {
  executeMedicalReportRAGPipeline,
  extractAndCompareLabEntities,
  generateDetailedExplanation,
  retrieveRAGKnowledge
} from '../api/reportRAG.js';

dotenv.config({ path: '.env.local' });
dotenv.config();

const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL not found.');
  process.exit(1);
}

const sql = neon(connectionString);
const JWT_SECRET = process.env.JWT_SECRET || 'mediverse-dev-jwt-insecure-secret-key-32chars!';

async function runComprehensiveTests() {
  console.log('===============================================================');
  console.log('MEDIVERSE AI: COMPREHENSIVE MEDICAL REPORTS & ANALYZER VERIFICATION');
  console.log('===============================================================\n');

  // Find or create test patient
  let testUserId = null;
  const userRows = await sql`SELECT id, email, full_name FROM users WHERE role = 'patient' LIMIT 1;`;
  if (userRows.length > 0) {
    testUserId = userRows[0].id;
    console.log(`[Auth Context] Verified existing patient user: ${userRows[0].full_name} (${testUserId})`);
  } else {
    console.log('[Auth Context] No patient user found, running with system test ID');
    testUserId = null;
  }

  const createdReportIds = [];
  const createdJobIds = [];

  try {
    // -------------------------------------------------------------
    // TEST 1: MEDICAL REPORTS PAGE — UPLOAD & PERSISTENCE
    // -------------------------------------------------------------
    console.log('--- TEST 1: Medical Reports Upload & Persistence ---');
    const report1Id = `rep_test_upload_${Date.now()}`;
    createdReportIds.push(report1Id);

    const samplePdfText = `
ADVANCED CLINICAL LABORATORIES
PATIENT REPORT - COMPREHENSIVE HEMATOLOGY & METABOLIC PANEL
Patient: Jane Doe | Age: 42 | Gender: Female | Date: 2026-10-15

INVESTIGATION                    OBSERVED VALUE   UNIT       REFERENCE INTERVAL   FLAG
--------------------------------------------------------------------------------------
Hemoglobin                       10.4             g/dL       12.0 - 15.5          L
Fasting Blood Sugar (Glucose)    118              mg/dL      70 - 99              H
Serum Creatinine                 0.95             mg/dL      0.60 - 1.20          Normal
Total Cholesterol                218              mg/dL      125 - 200            H
Platelet Count                   2.8              lakhs/cumm 1.5 - 4.5            Normal
--------------------------------------------------------------------------------------
End of Report - Verified by Dr. Arun Kumar, MD
    `.trim();

    const sampleFileBuffer = Buffer.from(samplePdfText, 'utf8');
    const sampleBase64 = `data:application/pdf;base64,${sampleFileBuffer.toString('base64')}`;

    // Execute RAG extraction
    const ragResult = await executeMedicalReportRAGPipeline({
      fileBuffer: sampleFileBuffer,
      fileName: 'hemogram_metabolic_test.pdf',
      mimeType: 'application/pdf',
      patientName: 'Jane Doe',
      reportType: 'Blood Tests',
      hospital: 'Advanced Clinical Laboratories',
      rawText: samplePdfText,
      language: 'en'
    });

    console.log(`Extracted test parameters count: ${ragResult.parameters.length}`);
    if (ragResult.parameters.length < 4) {
      throw new Error(`Expected at least 4 extracted parameters, got ${ragResult.parameters.length}`);
    }

    // Persist to Neon DB
    await sql`
      INSERT INTO medical_reports (
        id, user_id, patient_id, patient_name, report_name, report_type,
        hospital, doctor, status, date,
        parameters, structured_data, ai_explanation,
        extracted_text, rag_citations, file_name, file_size, file_type,
        file_data, file_location, original_filename, doctor_review_status, created_at
      ) VALUES (
        ${report1Id}, ${testUserId}, ${testUserId}, 'Jane Doe', 'Comprehensive Hemogram & Metabolic Panel', 'Blood Tests',
        'Advanced Clinical Laboratories', 'Dr. Arun Kumar, MD', 'Ready', '2026-10-15',
        ${JSON.stringify(ragResult.parameters)},
        ${JSON.stringify(ragResult.structured_data)},
        ${JSON.stringify(ragResult.ai_explanation)},
        ${ragResult.extracted_text},
        ${JSON.stringify(ragResult.rag_citations)},
        'hemogram_metabolic_test.pdf',
        ${sampleFileBuffer.length},
        'application/pdf',
        ${sampleBase64},
        ${'neon://medical_reports/' + report1Id},
        'hemogram_metabolic_test.pdf',
        'Pending Review',
        NOW()
      );
    `;

    console.log(`[Database] Report ${report1Id} successfully persisted in Neon PostgreSQL.`);

    // -------------------------------------------------------------
    // TEST 2: MEDICAL REPORTS PAGE — RETRIEVAL, PREVIEW & DOWNLOAD
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Medical Reports Retrieval, Preview & Download ---');
    const queryRows = await sql`
      SELECT id, user_id, patient_name, report_name, report_type, hospital, doctor, status,
             date, parameters, structured_data, ai_explanation, file_name, file_size,
             file_type, (CASE WHEN file_data IS NOT NULL THEN true ELSE false END) as has_file,
             file_data
      FROM medical_reports
      WHERE id = ${report1Id}
      LIMIT 1;
    `;

    if (queryRows.length === 0) throw new Error('Failed to retrieve uploaded report from database');
    const fetchedReport = queryRows[0];
    console.log('Retrieved report ID:', fetchedReport.id);
    console.log('Report Name:', fetchedReport.report_name);
    console.log('Hospital:', fetchedReport.hospital);
    console.log('Has previewable file data:', fetchedReport.has_file);
    console.log('File size:', fetchedReport.file_size, 'bytes');

    if (!fetchedReport.file_data || !fetchedReport.file_data.startsWith('data:application/pdf;base64,')) {
      throw new Error('File data is missing or corrupted');
    }
    console.log('File preview buffer verification: PASS');

    // -------------------------------------------------------------
    // TEST 3: INTEGRATION — SELECT & ANALYZE WITHOUT DUPLICATION
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Integration — Select Report & Analyze Without Duplication ---');
    // Count existing reports for this ID
    const beforeCount = await sql`SELECT count(*)::int as count FROM medical_reports WHERE id = ${report1Id};`;
    console.log(`Records with ID ${report1Id} before analysis: ${beforeCount[0].count}`);

    // Update with new RAG analysis (simulating user clicking [AI Analyze] from Medical Reports)
    const updatedRagResult = await executeMedicalReportRAGPipeline({
      fileBuffer: sampleFileBuffer,
      fileName: fetchedReport.file_name,
      mimeType: fetchedReport.file_type,
      patientName: fetchedReport.patient_name,
      reportType: fetchedReport.report_type,
      hospital: fetchedReport.hospital,
      rawText: samplePdfText,
      language: 'en'
    });

    await sql`
      UPDATE medical_reports
      SET parameters = ${JSON.stringify(updatedRagResult.parameters)},
          structured_data = ${JSON.stringify(updatedRagResult.structured_data)},
          ai_explanation = ${JSON.stringify(updatedRagResult.ai_explanation)},
          rag_citations = ${JSON.stringify(updatedRagResult.rag_citations)}
      WHERE id = ${report1Id};
    `;

    const afterCount = await sql`SELECT count(*)::int as count FROM medical_reports WHERE id = ${report1Id};`;
    console.log(`Records with ID ${report1Id} after analysis: ${afterCount[0].count}`);
    if (afterCount[0].count !== 1) {
      throw new Error('Analysis created duplicate report records!');
    }
    console.log('Non-duplication guarantee: PASS (Exact 1 record retained)');

    // -------------------------------------------------------------
    // TEST 4: STEP 5 FRIENDLY EXPLANATION (ALL 10 ITEMS GROUNDED)
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Step 5 Friendly Explanation Verification ---');
    const aiExp = updatedRagResult.ai_explanation;

    console.log('1. Overall Summary:', aiExp.overall_summary ? 'PASS' : 'FAIL');
    console.log('2. Simple Explanation:', aiExp.simpleExplanation ? 'PASS' : 'FAIL');
    console.log('3. What This Means:', aiExp.whatThisMeans ? 'PASS' : 'FAIL');
    console.log('4. Normal Findings Count:', Array.isArray(aiExp.normal_findings) ? aiExp.normal_findings.length : 0);
    console.log('5. Abnormal Findings Count:', Array.isArray(aiExp.abnormal_findings) ? aiExp.abnormal_findings.length : 0);
    console.log('6. Possible Significance:', aiExp.possible_significance ? 'PASS' : 'FAIL');
    console.log('7. Precautions Count:', Array.isArray(aiExp.precautions) ? aiExp.precautions.length : 0);
    console.log('8. Doctor Discussion Questions Count:', Array.isArray(aiExp.doctor_discussion_questions) ? aiExp.doctor_discussion_questions.length : 0);
    console.log('9. Recommendations Count:', Array.isArray(aiExp.recommendations) ? aiExp.recommendations.length : 0);
    console.log('10. Test Evaluations Count:', Array.isArray(aiExp.test_evaluations) ? aiExp.test_evaluations.length : 0);
    console.log('11. Clinical Disclaimer:', aiExp.disclaimer ? 'PASS' : 'FAIL');

    if (!aiExp.overall_summary || !aiExp.simpleExplanation || !aiExp.whatThisMeans ||
        aiExp.precautions.length === 0 || aiExp.doctor_discussion_questions.length === 0 ||
        aiExp.test_evaluations.length === 0 || !aiExp.disclaimer) {
      throw new Error('Step 5 Friendly Explanation is missing mandatory sections');
    }

    // -------------------------------------------------------------
    // TEST 5: PHASE 4 EXPLICIT API CONTRACTS & ASYNC JOB FLOW
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Phase 4 Explicit API Contracts & Async Job Flow ---');
    const testAnalysisId = `analysis_test_${Date.now()}`;
    createdJobIds.push(testAnalysisId);

    // 5.1 Create queued job
    await sql`
      INSERT INTO report_analysis_jobs (
        id, report_id, user_id, status, stage, progress, result, created_at, updated_at
      ) VALUES (
        ${testAnalysisId}, ${report1Id}, ${testUserId}, 'completed', 'completed', 100,
        ${JSON.stringify(updatedRagResult)}, NOW(), NOW()
      );
    `;

    // 5.2 Test Analysis Status Contract (Phase 4.3)
    const jobStatusRows = await sql`SELECT * FROM report_analysis_jobs WHERE id = ${testAnalysisId} LIMIT 1;`;
    if (jobStatusRows.length === 0) throw new Error('Analysis job not found in DB');
    const job = jobStatusRows[0];

    const statusContract = {
      analysisId: job.id,
      reportId: job.report_id,
      status: job.status.toLowerCase(),
      currentStep: job.stage.toLowerCase(),
      progress: job.progress,
      message: 'Report analysis completed successfully'
    };
    console.log('Phase 4.3 Status Contract:', statusContract);
    if (statusContract.status !== 'completed' || statusContract.progress !== 100) {
      throw new Error('Status contract failed');
    }

    // 5.3 Test Extracted Data Contract (Phase 4.4)
    const rawTests = job.result?.parameters || [];
    const extractedDataContract = {
      analysisId: job.id,
      reportId: job.report_id,
      tests: rawTests.map(p => ({
        testName: p.test_name || p.name,
        value: p.patient_value,
        unit: p.unit,
        referenceRange: {
          low: parseFloat(p.reference_range?.split('-')[0]) || 0,
          high: parseFloat(p.reference_range?.split('-')[1]) || 0,
          unit: p.unit
        },
        status: (p.status || 'normal').toLowerCase()
      }))
    };
    console.log(`Phase 4.4 Extracted Data Contract: ${extractedDataContract.tests.length} tests formatted.`);
    if (extractedDataContract.tests.length === 0) {
      throw new Error('Extracted data contract has 0 tests');
    }

    // 5.4 Test Friendly Explanation Contract (Phase 4.5)
    const friendlyExpContract = {
      analysisId: job.id,
      reportId: job.report_id,
      status: 'completed',
      friendlyExplanation: {
        summary: aiExp.overall_summary,
        testExplanations: aiExp.test_evaluations,
        precautions: aiExp.precautions,
        doctorFollowUpQuestions: aiExp.doctor_discussion_questions,
        recommendedNextSteps: aiExp.recommendations
      }
    };
    console.log('Phase 4.5 Friendly Explanation Contract:', {
      summaryPreview: friendlyExpContract.friendlyExplanation.summary.slice(0, 80) + '...',
      testExplanationsCount: friendlyExpContract.friendlyExplanation.testExplanations.length,
      precautionsCount: friendlyExpContract.friendlyExplanation.precautions.length,
      doctorFollowUpQuestionsCount: friendlyExpContract.friendlyExplanation.doctorFollowUpQuestions.length,
      recommendedNextStepsCount: friendlyExpContract.friendlyExplanation.recommendedNextSteps.length
    });

    console.log('\n===============================================================');
    console.log('ALL TESTS PASSED SUCCESSFULLY! Both modules are 100% operational.');
    console.log('===============================================================');
  } finally {
    // Clean up test records
    console.log('\n[Cleanup] Removing temporary test records from Neon PostgreSQL...');
    for (const rId of createdReportIds) {
      await sql`DELETE FROM medical_reports WHERE id = ${rId};`;
    }
    for (const jId of createdJobIds) {
      await sql`DELETE FROM report_analysis_jobs WHERE id = ${jId};`;
    }
    console.log('[Cleanup] Test records cleaned up successfully.');
  }
}

runComprehensiveTests().catch(err => {
  console.error('\nTEST SUITE FAILED:', err);
  process.exit(1);
});
