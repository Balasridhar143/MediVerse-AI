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
    if (!patientId) return { allergyStatus: 'UNDOCUMENTED', allergies: [], knownAllergies: [] };
    try {
      const response = await api.get(`/patients/${patientId}/allergies`);
      const data = response.data;
      if (Array.isArray(data)) {
        return {
          patientId,
          allergyStatus: data.length > 0 ? 'DOCUMENTED' : 'UNDOCUMENTED',
          allergies: data,
          knownAllergies: data,
        };
      }
      return data;
    } catch (err) {
      console.warn('Failed to fetch patient allergies:', err);
      throw err;
    }
  },

  // POST /api/patients/{id}/allergies
  async addPatientAllergy(patientId, allergyData) {
    const response = await api.post(`/patients/${patientId}/allergies`, allergyData);
    return response.data;
  },

  // POST /api/patients/{id}/allergies/confirm-nkda
  async confirmPatientNKDA(patientId) {
    const response = await api.post(`/patients/${patientId}/allergies/confirm-nkda`, {});
    return response.data;
  },

  // DELETE /api/patients/{id}/allergies/{allergyId}
  async deletePatientAllergy(patientId, allergyId) {
    const response = await api.delete(`/patients/${patientId}/allergies/${allergyId}`);
    return response.data;
  },

  // POST /api/prescriptions/safety-check
  async runSafetyCheck({ medicines, patientId, patientAllergies, allergyStatus }) {
    try {
      const response = await api.post('/prescriptions/safety-check', {
        medicines,
        patient_id: patientId,
        patient_allergies: patientAllergies,
        allergy_status: allergyStatus,
      });
      return response.data;
    } catch (err) {
      return runPrescriptionSafetyCheck({
        medicines,
        patientId,
        patientAllergies,
        allergyStatus,
      });
    }
  },
};

export default prescriptionService;
