/**
 * src/services/reportService.js
 * Frontend client service prepared for future REST endpoints:
 * - GET    /api/reports
 * - GET    /api/reports/{id}
 * - POST   /api/reports/upload
 * - GET    /api/reports/{id}/explanation
 * - GET    /api/reports/{id}/history
 * - GET    /api/reports/{id}/comparison
 * 
 * In this Phase 3 frontend prototype, this service operates against the
 * in-memory mock reports database in src/data/reports.js.
 */

import { mockMedicalReports, MEDICAL_GLOSSARY } from '../data/reports';

let inMemoryReports = [...mockMedicalReports];

export const reportService = {
  /**
   * GET /api/reports
   * Fetches all reports with optional filtering
   */
  async getReports(filters = {}) {
    // Simulating async network delay
    await new Promise((resolve) => setTimeout(resolve, 80));

    let results = [...inMemoryReports];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(
        (r) =>
          r.reportName.toLowerCase().includes(q) ||
          r.hospital.toLowerCase().includes(q) ||
          r.doctor.toLowerCase().includes(q) ||
          r.shortPreview.toLowerCase().includes(q) ||
          r.reportType.toLowerCase().includes(q)
      );
    }

    if (filters.category && filters.category !== 'All') {
      results = results.filter((r) => {
        if (filters.category === 'Imaging') {
          return ['Imaging', 'X-Ray', 'CT', 'MRI', 'Ultrasound'].includes(r.category);
        }
        return r.category.toLowerCase() === filters.category.toLowerCase();
      });
    }

    if (filters.status && filters.status !== 'All') {
      results = results.filter((r) => r.status.toLowerCase() === filters.status.toLowerCase());
    }

    if (filters.hospital && filters.hospital !== 'All') {
      results = results.filter((r) => r.hospital.toLowerCase().includes(filters.hospital.toLowerCase()));
    }

    return results;
  },

  /**
   * GET /api/reports/{id}
   */
  async getReportById(id) {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return inMemoryReports.find((r) => r.id === id) || null;
  },

  /**
   * POST /api/reports/upload
   * Simulates file upload, validation, and addition to frontend memory state
   */
  async uploadReport({ file, reportName, reportType, hospital, doctor, specimen }) {
    await new Promise((resolve) => setTimeout(resolve, 600));

    const todayStr = '2026-09-25';
    const newReport = {
      id: `rep_${Date.now()}`,
      patientId: 'PID-2026-089',
      patientName: 'Rahul Sharma',
      reportName: reportName || file.name.replace(/\.[^/.]+$/, ''),
      reportType: reportType || 'Blood Tests',
      category: reportType || 'Blood Tests',
      hospital: hospital || 'City Care Diagnostics Laboratory',
      lab: hospital || 'City Care Diagnostics Laboratory',
      doctor: doctor || 'Dr. Arun Kumar',
      date: todayStr,
      uploadedDate: todayStr,
      status: 'Ready',
      specimen: specimen || 'Clinical Sample',
      shortPreview: `Digitized report uploaded from ${file.name}. Ready for patient view and doctor consultation.`,
      detailedFindings: `Laboratory document "${file.name}" (${(file.size / 1024).toFixed(1)} KB) successfully uploaded and parsed into structured electronic record.`,
      parameters: [
        {
          name: 'Specimen Quality Indicator',
          value: 'Adequate',
          unit: 'index',
          referenceRange: 'Adequate',
          flag: 'Normal',
          easyMeaning: 'The condition of the sample collected for testing.',
          whatItMeans: 'The test sample meets diagnostic testing standards.',
        },
      ],
      terms: ['Hypertension'],
      aiExplanation: {
        originalFinding: `Uploaded document: ${file.name}`,
        simpleExplanation: 'Your medical report has been uploaded to your personal records.',
        whatThisMeans: 'Your assigned doctor can access and review this report during your next consultation.',
        importantNote: 'Example explanation for frontend demonstration.',
      },
      timeline: [
        { date: '25 Sep 2026', time: 'Just now', event: 'Report Uploaded', note: `File "${file.name}" uploaded successfully.` },
        { date: '25 Sep 2026', time: 'Just now', event: 'Parsed & Ready', note: 'Structured electronic record generated.' },
      ],
      historicalValues: [],
      doctorNotes: 'Pending clinical review.',
    };

    inMemoryReports.unshift(newReport);
    return newReport;
  },

  /**
   * GET /api/reports/{id}/explanation
   */
  async getReportExplanation(id, lang = 'en') {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const report = inMemoryReports.find((r) => r.id === id);
    if (!report) return null;

    return {
      reportId: report.id,
      reportName: report.reportName,
      language: lang,
      explanation: report.aiExplanation,
      disclaimer: 'AI-assisted explanation — not a diagnosis. Discuss medical decisions with your healthcare professional. Sample data for frontend demonstration.',
    };
  },

  /**
   * GET /api/reports/{id}/comparison
   */
  async compareReports(id1, id2) {
    await new Promise((resolve) => setTimeout(resolve, 60));
    const rep1 = inMemoryReports.find((r) => r.id === id1);
    const rep2 = inMemoryReports.find((r) => r.id === id2);

    if (!rep1 || !rep2) return null;

    // Match parameters by name
    const comparisonRows = [];
    const rep1Params = rep1.parameters || [];
    const rep2Params = rep2.parameters || [];

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
        note: 'Change shown for reference.',
      });
    });

    return {
      report1: rep1,
      report2: rep2,
      rows: comparisonRows,
      disclaimer: 'Change shown for reference. Clinical interpretation requires professional review.',
    };
  },

  /**
   * POST /api/reports/{id}/notes
   * Doctor adds a clinical note
   */
  async addDoctorNote(id, note) {
    const report = inMemoryReports.find((r) => r.id === id);
    if (report) {
      report.doctorNotes = note;
    }
    return report;
  },

  /**
   * PATCH /api/reports/{id}/review
   * Doctor marks report as reviewed
   */
  async markReportReviewed(id, doctorName = 'Dr. Ananya Sen') {
    const report = inMemoryReports.find((r) => r.id === id);
    if (report) {
      report.status = 'Doctor Reviewed';
      report.timeline.push({
        date: '25 Sep 2026',
        time: 'Just now',
        event: 'Doctor Reviewed',
        note: `Reviewed and verified by ${doctorName}.`,
      });
    }
    return report;
  },

  /**
   * Medical glossary lookup
   */
  getGlossary() {
    return MEDICAL_GLOSSARY;
  },
};
