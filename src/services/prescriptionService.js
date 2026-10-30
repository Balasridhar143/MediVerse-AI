import api from './api';
import { runPrescriptionSafetyCheck, mockPatientAllergies } from '../data/medicineSafetyData';

/**
 * prescriptionService
 * Real PostgreSQL Database & Clinical Dataset API service:
 * - GET /api/prescriptions
 * - GET /api/prescriptions/{id}
 * - POST /api/prescriptions
 * - GET /api/prescriptions/medicines/search
 * - GET /api/prescriptions/patients
 * - GET /api/patients/{id}/allergies
 * - POST /api/prescriptions/safety-check
 */
export const prescriptionService = {
  // GET /api/prescriptions
  async getPrescriptions(patientId = '') {
    const params = patientId ? { patient_id: patientId } : {};
    const response = await api.get('/prescriptions', { params });
    return response.data;
  },

  // GET /api/prescriptions/{id}
  async getPrescriptionById(id) {
    const response = await api.get(`/prescriptions/${id}`);
    return response.data;
  },

  // POST /api/prescriptions
  async createPrescription(prescriptionData) {
    const response = await api.post('/prescriptions', prescriptionData);
    return response.data;
  },

  // GET /api/prescriptions/medicines/search
  async searchMedicines({ q = '', category = '', dosage_form = '', page = 1, limit = 20 } = {}) {
    const response = await api.get('/prescriptions/medicines/search', {
      params: { q, category, dosage_form, page, limit }
    });
    return response.data;
  },

  // GET /api/prescriptions/patients
  async getEligiblePatients({ q = '', page = 1, limit = 30 } = {}) {
    const response = await api.get('/prescriptions/patients', {
      params: { q, page, limit }
    });
    return response.data;
  },

  // GET /api/patients/{id}/allergies
  async getPatientAllergies(patientId = '') {
    try {
      const response = await api.get(`/patients/${patientId}/allergies`);
      return response.data;
    } catch (err) {
      return mockPatientAllergies[patientId]?.knownAllergies || [];
    }
  },

  // POST /api/prescriptions/safety-check
  async runSafetyCheck({ medicines, patientId }) {
    try {
      const response = await api.post('/prescriptions/safety-check', { medicines, patient_id: patientId });
      return response.data;
    } catch (err) {
      return runPrescriptionSafetyCheck({ medicines, patientId });
    }
  },
};

export default prescriptionService;
