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
  const normalizedParams = Array.isArray(rawParams) ? rawParams.map((p) => {
    const rawFlag = String(p.status || p.flag || '').toLowerCase();
    const indicator = p.indicator || (rawFlag.includes('low') || rawFlag.includes('below') ? 'below' : rawFlag.includes('high') || rawFlag.includes('above') ? 'above' : 'within');
    const statusText = p.status || p.flag || (indicator === 'within' ? 'Within Range' : indicator === 'above' ? 'Above Range' : 'Below Range');

    return {
      id: p.id || p.test_name || p.name,
      name: p.test_name || p.name || 'Laboratory Marker',
      testName: p.test_name || p.name || 'Laboratory Marker',
      value: p.patient_value !== undefined ? p.patient_value : p.value,
      unit: p.unit || '',
      referenceRange: p.reference_range || p.referenceRange || 'Standard reference bounds',
      indicator: indicator,
      status: statusText,
      flag: statusText,
      is_critical: Boolean(p.is_critical),
      meaning: p.meaning || p.easyMeaning || '',
      easyMeaning: p.easyMeaning || p.meaning || '',
      purpose: p.purpose || p.meaning || '',
      possible_reasons: p.possible_reasons || p.whatItMeans || '',
      explanation: p.explanation || ''
    };
  }) : [];

  const rawStructured = r.structured_data || {};
  const rawAi = r.ai_explanation || {};

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
    ai_explanation: rawAi,
    aiExplanation: {
      ...rawAi,
      originalFinding: rawStructured.important_findings || rawAi.findings_summary || 'Standard laboratory panel',
      simpleExplanation: rawAi.overall_summary || rawAi.summary || rawStructured.overall_summary || 'Analysis complete.',
      whatThisMeans: rawAi.findings_summary || 'Review findings with your attending physician.',
      recommendations: rawAi.recommendations || [],
      questionsForDoctor: rawAi.doctor_discussion_questions || [],
      disclaimer: rawAi.disclaimer || 'Educational and clinical decision support only.'
    },
    structured_data: rawStructured,
    shortPreview: rawStructured.important_findings || rawAi.summary || 'Clinical laboratory analysis',
    detailedFindings: rawStructured.overall_summary || rawAi.summary || 'Laboratory document successfully processed.'
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
   * POST /api/reports/analyze
   * Full clinical RAG analysis pipeline with optional Indian language selection
   */
  async analyzeReport({ file, fileData, fileName, fileType, patientName, reportName, reportType, hospital, doctor, rawText, language = 'en' }) {
    let payload = {
      patient_name: patientName,
      report_name: reportName,
      report_type: reportType || 'Blood Tests',
      hospital: hospital || 'Diagnostic Laboratory',
      doctor: doctor || 'Attending Physician',
      raw_text: rawText || '',
      language: language || 'en'
    };

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

    const res = await api.post('/reports/analyze', payload);
    return {
      success: true,
      reportId: res.data.report_id,
      report: normalizeDbReport(res.data.report),
      ragAnalysis: res.data.rag_analysis
    };
  },

  /**
   * POST /api/reports/:id/reanalyze
   * Translates or re-runs analysis on an existing uploaded report in the selected language
   */
  async reanalyzeReport(id, language = 'en') {
    const res = await api.post(`/reports/${id}/reanalyze`, { language });
    return res.data;
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
