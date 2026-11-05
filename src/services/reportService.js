/**
 * src/services/reportService.js
 * Production Medical Reports Client Service
 * Interacts with Neon PostgreSQL persistence & RAG pipeline endpoints:
 * - GET    /api/reports
 * - GET    /api/reports/:id
 * - POST   /api/reports/analyze (RAG analysis)
 * - POST   /api/reports/upload
 * - DELETE /api/reports/:id
 */

import api from './api';

const normalizeDbReport = (r) => {
  if (!r) return null;

  const rawParams = r.parameters || [];
  const rawAi = r.ai_explanation || r.aiExplanation || {};
  const hasAi = rawAi && typeof rawAi === 'object' && Object.keys(rawAi).length > 0;
  const rawStructured = r.structured_data || {};

  const normalizedParams = Array.isArray(rawParams) ? rawParams.map((p) => {
    const rawFlag = String(p.status || p.flag || '').toLowerCase();
    const indicator = p.indicator || (rawFlag.includes('low') || rawFlag.includes('below') ? 'below' : rawFlag.includes('high') || rawFlag.includes('above') ? 'above' : 'within');
    const statusText = p.status || p.flag || (indicator === 'within' ? 'Within Range' : indicator === 'above' ? 'Above Range' : 'Below Range');

    const testTitle = p.test_name || p.name || 'Laboratory Marker';
    const evalMatch = hasAi && Array.isArray(rawAi.test_evaluations)
      ? rawAi.test_evaluations.find(e => e.test_name && e.test_name.toLowerCase() === testTitle.toLowerCase())
      : null;

    const purposeVal = p.purpose || evalMatch?.purpose || p.what_it_measures || p.easyMeaning || p.meaning || `Diagnostic biomarker assessing physiological function of ${testTitle}.`;
    const whatItMeasuresVal = p.what_it_measures || evalMatch?.what_it_measures || purposeVal;

    return {
      id: p.id || p.test_name || p.name,
      name: testTitle,
      testName: testTitle,
      value: p.patient_value !== undefined ? p.patient_value : p.value,
      unit: p.unit || '',
      referenceRange: p.reference_range || p.referenceRange || 'Standard reference bounds',
      indicator: indicator,
      status: statusText,
      flag: statusText,
      is_critical: Boolean(p.is_critical),
      meaning: p.meaning || whatItMeasuresVal,
      easyMeaning: p.easyMeaning || purposeVal,
      purpose: purposeVal,
      what_it_measures: whatItMeasuresVal,
      possible_reasons: p.possible_reasons || evalMatch?.possible_significance || p.whatItMeans || '',
      explanation: p.explanation || evalMatch?.interpretation || ''
    };
  }) : [];

  const overallSummaryVal = hasAi
    ? (rawAi.overall_summary || rawAi.summary || rawAi.simpleExplanation || rawStructured.overall_summary || 'Diagnostic laboratory analysis processed.')
    : (rawStructured.overall_summary || 'Diagnostic laboratory analysis processed.');

  const whatThisMeansVal = hasAi
    ? (rawAi.whatThisMeans || rawAi.possible_significance || rawAi.findings_summary || rawStructured.important_findings || 'Review findings with your attending physician.')
    : (rawStructured.important_findings || 'Review findings with your attending physician.');

  const questionsList = hasAi
    ? (rawAi.doctor_discussion_questions || rawAi.questionsForDoctor || [])
    : [];

  const recsList = hasAi
    ? (rawAi.recommendations || [])
    : [];

  const precautionsList = hasAi
    ? (rawAi.precautions || [])
    : [];

  return {
    id: r.id,
    patientId: r.patient_id || r.user_id || 'PAT-CURRENT',
    patientName: r.patient_name || 'Patient Record',
    reportName: r.report_name || r.reportName || 'Diagnostic Report',
    reportType: r.report_type || r.reportType || 'Blood Tests',
    category: r.report_type || r.category || 'Blood Tests',
    hospital: r.hospital || 'Clinical Diagnostic Laboratory',
    doctor: r.doctor || 'Attending Physician',
    date: r.date || (r.created_at ? r.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
    status: r.status || 'Ready',
    fileName: r.file_name || 'report.pdf',
    fileType: r.file_type || 'application/pdf',
    fileData: r.file_data || null,
    hasFile: Boolean(r.has_file || r.file_data),
    doctorReviewStatus: r.doctor_review_status || (r.status === 'Doctor Reviewed' ? 'Doctor Reviewed' : 'Pending Review'),
    doctorNotes: r.doctor_notes || '',
    parameters: normalizedParams,
    rag_citations: r.rag_citations || [],
    ai_explanation: {
      ...rawAi,
      overall_summary: overallSummaryVal,
      summary: overallSummaryVal,
      simpleExplanation: overallSummaryVal,
      findings_summary: rawAi.findings_summary || whatThisMeansVal,
      whatThisMeans: whatThisMeansVal,
      possible_significance: rawAi.possible_significance || whatThisMeansVal,
      normal_findings: rawAi.normal_findings || [],
      abnormal_findings: rawAi.abnormal_findings || [],
      precautions: precautionsList,
      recommendations: recsList,
      doctor_discussion_questions: questionsList,
      questionsForDoctor: questionsList,
      test_evaluations: rawAi.test_evaluations || [],
      disclaimer: rawAi.disclaimer || 'CLINICAL DECISION SUPPORT: Educational decision support only. Consult a registered medical practitioner.'
    },
    aiExplanation: {
      ...rawAi,
      originalFinding: rawStructured.important_findings || rawAi.findings_summary || 'Standard laboratory panel',
      simpleExplanation: overallSummaryVal,
      overall_summary: overallSummaryVal,
      summary: overallSummaryVal,
      whatThisMeans: whatThisMeansVal,
      possible_significance: rawAi.possible_significance || whatThisMeansVal,
      findings_summary: rawAi.findings_summary || whatThisMeansVal,
      recommendations: recsList,
      precautions: precautionsList,
      questionsForDoctor: questionsList,
      doctor_discussion_questions: questionsList,
      test_evaluations: rawAi.test_evaluations || [],
      disclaimer: rawAi.disclaimer || 'Educational and clinical decision support only.'
    },
    structured_data: rawStructured,
    shortPreview: rawStructured.important_findings || overallSummaryVal,
    detailedFindings: overallSummaryVal
  };
};

export const reportService = {
  /**
   * GET /api/reports
   * Fetches real user-specific reports from Neon PostgreSQL
   */
  async getReports(filters = {}) {
    try {
      const res = await api.get('/reports');
      const rawList = Array.isArray(res.data) ? res.data : [];
      let results = rawList.map(normalizeDbReport);

      if (filters.search) {
        const q = filters.search.toLowerCase();
        results = results.filter(
          (r) =>
            r.reportName.toLowerCase().includes(q) ||
            r.hospital.toLowerCase().includes(q) ||
            r.doctor.toLowerCase().includes(q) ||
            r.reportType.toLowerCase().includes(q)
        );
      }

      if (filters.category && filters.category !== 'All') {
        results = results.filter((r) => r.category.toLowerCase() === filters.category.toLowerCase() || r.reportType.toLowerCase() === filters.category.toLowerCase());
      }

      if (filters.status && filters.status !== 'All') {
        results = results.filter((r) => r.status.toLowerCase() === filters.status.toLowerCase());
      }

      return results;
    } catch (err) {
      console.warn('Failed to fetch medical reports from database:', err.message);
      return [];
    }
  },

  /**
   * GET /api/reports/:id
   */
  async getReportById(id) {
    try {
      const res = await api.get(`/reports/${id}`);
      return normalizeDbReport(res.data);
    } catch (err) {
      console.error(`Failed to fetch report ${id}:`, err);
      return null;
    }
  },

  /**
   * POST /api/reports/upload
   * Dedicated multipart/form-data report upload route with storage & extraction
   */
  async uploadReport({ file, reportName, reportType, hospital, doctor, patientName, onUploadProgress }) {
    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }
    formData.append('report_name', reportName || file?.name?.replace(/\.[^/.]+$/, '') || 'Medical Laboratory Report');
    formData.append('report_type', reportType || 'Blood Tests');
    formData.append('hospital', hospital || 'City Diagnostic Center');
    formData.append('doctor', doctor || 'Dr. Arun Kumar');
    if (patientName) formData.append('patient_name', patientName);

    const res = await api.post('/reports/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 2 minutes for upload and extraction
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(percent);
        }
      }
    });

    const repData = res.data.report || res.data;
    return {
      success: true,
      reportId: res.data.report_id || repData?.id,
      report: normalizeDbReport(repData),
      ragAnalysis: res.data.rag_analysis
    };
  },

  /**
   * POST /api/reports/analyze
   * Full clinical RAG analysis pipeline with optional Indian language selection
   */
  async analyzeReport({ reportId, file, fileData, fileName, fileType, patientName, reportName, reportType, hospital, doctor, rawText, language = 'en' }) {
    let payload = {
      patient_name: patientName,
      report_name: reportName,
      report_type: reportType || 'Blood Tests',
      hospital: hospital || 'Diagnostic Laboratory',
      doctor: doctor || 'Attending Physician',
      raw_text: rawText || '',
      language: language || 'en'
    };

    if (reportId) {
      payload.reportId = reportId;
      payload.report_id = reportId;
    }

    if (file) {
      payload.file_name = file.name;
      payload.file_type = file.type || 'application/pdf';
      payload.file_size = file.size;

      // Convert file to base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      payload.file_data = base64;
    } else if (fileData) {
      payload.file_data = fileData;
      payload.file_name = fileName || 'document.pdf';
      payload.file_type = fileType || 'application/pdf';
    }

    const res = await api.post('/reports/analyze', payload, {
      timeout: 120000 // 2 minutes for comprehensive OCR, RAG retrieval & LLM synthesis
    });
    return {
      success: true,
      reportId: res.data.report_id || res.data.id || res.data.data?.reportId,
      data: res.data.data,
      report: normalizeDbReport(res.data.report),
      ragAnalysis: res.data.rag_analysis
    };
  },

  /**
   * POST /api/reports/start-analysis (Phase 4.2)
   */
  async startAnalysis(reportId, language = 'en') {
    const res = await api.post('/reports/start-analysis', { reportId, language });
    return res.data;
  },

  /**
   * GET /api/reports/analysis/:analysisId/status (Phase 4.3)
   */
  async getAnalysisStatus(analysisId) {
    const res = await api.get(`/reports/analysis/${analysisId}/status`);
    return res.data;
  },

  /**
   * GET /api/reports/analysis/:analysisId/extracted-data (Phase 4.4)
   */
  async getExtractedData(analysisId) {
    const res = await api.get(`/reports/analysis/${analysisId}/extracted-data`);
    return res.data;
  },

  /**
   * GET /api/reports/analysis/:analysisId/friendly-explanation (Phase 4.5)
   */
  async getFriendlyExplanation(analysisId) {
    const res = await api.get(`/reports/analysis/${analysisId}/friendly-explanation`);
    return res.data;
  },

  /**
   * POST /api/reports/:id/reanalyze
   * Translates or re-runs analysis on an existing uploaded report in the selected language
   */
  async getJobStatus(jobId) {
    try {
      const res = await api.get(`/reports/jobs/${jobId}`);
      return res.data;
    } catch (e) {
      console.warn('Job status poll notice:', e.message);
      return null;
    }
  },

  async reanalyzeReport(id, language = 'en') {
    const res = await api.post(`/reports/${id}/reanalyze`, { language }, {
      timeout: 120000
    });
    const normalized = res.data.report ? normalizeDbReport(res.data.report) : null;
    return {
      ...res.data,
      report: normalized
    };
  },

  /**
   * POST /api/reports/:id/explain
   * Step 5 dedicated: Synthesizes or refreshes friendly explanation using existing extracted parameters
   * without re-running OCR or document parsing.
   */
  async explainReport(id, language = 'en') {
    const res = await api.post(`/reports/${id}/explain`, { language }, {
      timeout: 120000
    });
    const normalized = res.data.report ? normalizeDbReport(res.data.report) : null;
    return {
      ...res.data,
      report: normalized
    };
  },

  /**
   * Downloads or opens original report file
   */
  async downloadReportFile(id, filename = 'medical_report.pdf') {
    try {
      const res = await api.get(`/reports/${id}/download`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.warn('Direct file download fallback:', err);
      window.open(`/api/reports/${id}/download`, '_blank');
    }
  },

  /**
   * DELETE /api/reports/:id
   */
  async deleteReport(id) {
    const res = await api.delete(`/reports/${id}`);
    return res.data;
  },

  /**
   * GET /api/reports/:id/explanation
   */
  async getReportExplanation(id, lang = 'en') {
    const report = await this.getReportById(id);
    if (!report) return null;

    return {
      reportId: report.id,
      reportName: report.reportName,
      language: lang,
      explanation: report.aiExplanation,
      ragCitations: report.rag_citations,
      disclaimer: 'Clinical decision support: derived from authoritative medical literature. Not a substitute for professional evaluation.'
    };
  },

  /**
   * Longitudinal comparison between two reports
   */
  async compareReports(id1, id2) {
    const [rep1, rep2] = await Promise.all([this.getReportById(id1), this.getReportById(id2)]);
    if (!rep1 || !rep2) return null;

    const rep1Params = rep1.parameters || [];
    const rep2Params = rep2.parameters || [];
    const comparisonRows = [];

    rep2Params.forEach((p2) => {
      const p1 = rep1Params.find((p) => p.name.toLowerCase() === p2.name.toLowerCase());
      comparisonRows.push({
        parameter: p2.name,
        unit: p2.unit,
        previousDate: rep1.date,
        previousValue: p1 ? p1.value : 'N/A',
        latestDate: rep2.date,
        latestValue: p2.value,
        referenceRange: p2.referenceRange,
        trend: !p1 ? 'new' : Number(p2.value) > Number(p1.value) ? 'up' : Number(p2.value) < Number(p1.value) ? 'down' : 'stable',
        status: p2.flag
      });
    });

    return {
      report1: rep1,
      report2: rep2,
      comparison: comparisonRows
    };
  },

  /**
   * Triggers download of the original uploaded PDF or image file
   */
  async downloadReportFile(reportId, preferredFileName = 'diagnostic_report.pdf') {
    try {
      // First fetch report details to get fileData if available
      const report = await this.getReportById(reportId);
      if (report && report.fileData) {
        const link = document.createElement('a');
        link.href = report.fileData;
        link.download = report.fileName || preferredFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return true;
      }

      // Direct endpoint download fallback
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reports/${reportId}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!response.ok) throw new Error('Download request failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = report?.fileName || preferredFileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      return true;
    } catch (err) {
      console.error('Failed to download report file:', err);
      // Fallback: window.open
      window.open(`/api/reports/${reportId}/download`, '_blank');
      return false;
    }
  },

  /**
   * Clinician marks report as reviewed and saves notes
   */
  async reviewReport(reportId, { status = 'Doctor Reviewed', doctorNotes = '' } = {}) {
    const res = await api.post(`/reports/${reportId}/review`, {
      status,
      doctor_notes: doctorNotes
    });
    return res.data;
  }
};

export default reportService;
