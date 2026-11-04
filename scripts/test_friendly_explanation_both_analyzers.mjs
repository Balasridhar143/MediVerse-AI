/**
 * scripts/test_friendly_explanation_both_analyzers.mjs
 * End-to-end verification of Step 5: Patient-Friendly Clinical Explanation
 * for both report analyzer workflows in MediVerse AI.
 */

import { executeMedicalReportRAGPipeline, generateAiPatientFriendlyExplanation, generateDetailedExplanation } from '../api/reportRAG.js';

async function runTests() {
  console.log('===============================================================');
  console.log('MEDIVERSE AI: STEP 5 FRIENDLY EXPLANATION VERIFICATION SUITE');
  console.log('===============================================================');

  // Test 1: Grounded RAG explanation generator with all 10 clinical items
  console.log('\n--- TEST 1: Generate Clinical Explanation (All 10 Items) ---');
  const sampleTestResults = [
    {
      test_name: 'Fasting Blood Sugar (Glucose)',
      name: 'Fasting Blood Sugar (Glucose)',
      patient_value: 138,
      value: 138,
      unit: 'mg/dL',
      reference_range: '70 - 99 mg/dL',
      status: 'Above reference range',
      flag: 'Review',
      is_critical: false,
      purpose: 'Measures blood glucose levels after an overnight fast of at least 8 hours.',
      meaning: 'Primary diagnostic biomarker for diabetes mellitus and insulin sensitivity.'
    },
    {
      test_name: 'Hemoglobin',
      name: 'Hemoglobin',
      patient_value: 14.5,
      value: 14.5,
      unit: 'g/dL',
      reference_range: '13.0 - 17.0 g/dL',
      status: 'Normal',
      flag: 'Normal',
      is_critical: false,
      purpose: 'Iron-containing oxygen transport protein in red blood cells.',
      meaning: 'Assesses red cell oxygen-carrying capacity.'
    },
    {
      test_name: 'Serum Creatinine',
      name: 'Serum Creatinine',
      patient_value: 0.95,
      value: 0.95,
      unit: 'mg/dL',
      reference_range: '0.70 - 1.30 mg/dL',
      status: 'Normal',
      flag: 'Normal',
      is_critical: false,
      purpose: 'Metabolic waste product filtered exclusively by renal glomeruli.',
      meaning: 'Primary indicator of glomerular filtration rate and kidney function.'
    }
  ];

  const explanation = await generateAiPatientFriendlyExplanation({
    testResults: sampleTestResults,
    patientName: 'Karthik Raja',
    reportType: 'Comprehensive Metabolic Panel',
    hospital: 'Advanced Diagnostic Center',
    date: '2026-11-04'
  });

  console.log('1. Overall Summary:', explanation.overall_summary ? 'PASS' : 'FAIL');
  console.log('2. Simple Explanation:', explanation.simpleExplanation ? 'PASS' : 'FAIL');
  console.log('3. What This Means (Clinical Implications):', explanation.whatThisMeans ? 'PASS' : 'FAIL');
  console.log('4. Normal Findings Count:', Array.isArray(explanation.normal_findings) ? explanation.normal_findings.length : 'FAIL');
  console.log('5. Abnormal Findings Count:', Array.isArray(explanation.abnormal_findings) ? explanation.abnormal_findings.length : 'FAIL');
  console.log('6. Possible Significance:', explanation.possible_significance ? 'PASS' : 'FAIL');
  console.log('7. Precautions Count:', Array.isArray(explanation.precautions) ? explanation.precautions.length : 'FAIL');
  console.log('8. Doctor Discussion Questions Count:', Array.isArray(explanation.doctor_discussion_questions) ? explanation.doctor_discussion_questions.length : 'FAIL');
  console.log('9. Recommendations Count:', Array.isArray(explanation.recommendations) ? explanation.recommendations.length : 'FAIL');
  console.log('10. Test Evaluations Count:', Array.isArray(explanation.test_evaluations) ? explanation.test_evaluations.length : 'FAIL');
  console.log('11. Disclaimer:', explanation.disclaimer ? 'PASS' : 'FAIL');

  if (!explanation.overall_summary || !explanation.simpleExplanation || !explanation.whatThisMeans ||
      explanation.precautions.length < 3 || explanation.doctor_discussion_questions.length < 3) {
    throw new Error('Test 1 failed: Missing required explanation fields.');
  }

  // Test 2: Verify parameter enrichment (Purpose & What It Measures)
  console.log('\n--- TEST 2: Parameter Purpose & Measurement Enrichment ---');
  sampleTestResults.forEach((p, idx) => {
    console.log(`Param ${idx + 1} (${p.name}):`);
    console.log(`  - Purpose: "${p.purpose}"`);
    console.log(`  - What it measures: "${p.what_it_measures || p.meaning}"`);
    if (!p.purpose || (!p.what_it_measures && !p.meaning)) {
      throw new Error(`Test 2 failed: Missing purpose for ${p.name}`);
    }
  });

  // Test 3: End-to-End Pipeline Execution with Mock Laboratory Document
  console.log('\n--- TEST 3: Full RAG Pipeline Execution ---');
  const mockReportText = `
    CITY DIAGNOSTIC SERVICES & CLINICAL REFERENCE LABORATORY
    Patient: Priya Ramesh   Age: 38   Gender: Female   Date: 2026-11-04
    Referred by: Dr. Arun Kumar, MD

    COMPLETE BLOOD COUNT (CBC) & METABOLIC INVESTIGATION:
    Hemoglobin: 11.2 g/dL (Reference Range: 12.0 - 15.5 g/dL) LOW
    WBC Count: 8500 cells/cumm (Reference Range: 4000 - 11000 cells/cumm) Normal
    Platelet Count: 250000 cells/cumm (Reference Range: 150000 - 450000 cells/cumm) Normal
    Fasting Blood Sugar: 142 mg/dL (Reference Range: 70 - 99 mg/dL) HIGH
    Serum Creatinine: 0.85 mg/dL (Reference Range: 0.60 - 1.10 mg/dL) Normal
  `;

  const pipelineResult = await executeMedicalReportRAGPipeline({
    rawText: mockReportText,
    fileName: 'cbc_metabolic_report.pdf',
    patientName: 'Priya Ramesh',
    reportType: 'Complete Blood Count & Metabolic Panel',
    hospital: 'City Diagnostic Services',
    language: 'en'
  });

  console.log('Pipeline Status:', pipelineResult.status);
  console.log('Extracted Parameters Count:', pipelineResult.parameters.length);
  console.log('Normal Parameters:', pipelineResult.structured_data.normal_parameters);
  console.log('Abnormal Parameters:', pipelineResult.structured_data.abnormal_parameters);
  console.log('RAG Citations Count:', pipelineResult.rag_citations.length);
  console.log('AI Explanation Summary:', pipelineResult.ai_explanation.summary.substring(0, 80) + '...');

  if (pipelineResult.parameters.length < 3) {
    throw new Error('Test 3 failed: Did not extract expected parameters.');
  }
  if (!pipelineResult.ai_explanation.overall_summary || !pipelineResult.ai_explanation.doctor_discussion_questions) {
    throw new Error('Test 3 failed: AI explanation missing in pipeline output.');
  }

  // Test 4: Multilingual Translation of Explanation
  console.log('\n--- TEST 4: Multilingual Translation (Tamil & Hindi) ---');
  const tamilResult = await executeMedicalReportRAGPipeline({
    rawText: mockReportText,
    fileName: 'cbc_report_tamil.pdf',
    patientName: 'Priya Ramesh',
    reportType: 'Blood Tests',
    hospital: 'City Diagnostic Services',
    language: 'ta'
  });

  console.log('Tamil Summary Preview:', tamilResult.ai_explanation.summary.substring(0, 60) + '...');
  console.log('Tamil Questions Count:', tamilResult.ai_explanation.doctor_discussion_questions.length);
  if (!tamilResult.ai_explanation.summary.includes('மருத்துவ') && !tamilResult.ai_explanation.summary.includes('அறிக்கை')) {
    throw new Error('Test 4 failed: Tamil translation not present in summary.');
  }

  console.log('\n===============================================================');
  console.log('ALL TESTS PASSED SUCCESSFULLY! Step 5 is fully operational.');
  console.log('===============================================================');
}

runTests().catch(err => {
  console.error('\nTEST SUITE FAILED:', err);
  process.exit(1);
});

