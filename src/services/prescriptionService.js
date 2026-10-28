import api from './api';
import { mockPrescriptions } from '../data/mockData';
import { runPrescriptionSafetyCheck, mockPatientAllergies } from '../data/medicineSafetyData';

/**
 * prescriptionService
 * Backend-ready API service structure for:
 * - GET /api/prescriptions
 * - GET /api/prescriptions/{id}
 * - POST /api/prescriptions
 * - GET /api/medicines/{id}/safety
 * - GET /api/patients/{id}/allergies
 * - POST /api/prescriptions/safety-check
 * 
 * Falls back gracefully to structured mock data until Python FastAPI backend is booted.
 */
export const prescriptionService = {
  // GET /api/prescriptions
  async getPrescriptions(patientId) {
    try {
      const response = await api.get('/prescriptions', { params: { patient_id: patientId } });
      return response.data;
    } catch (err) {
      // Backend not yet connected: return verified mock data
      return mockPrescriptions;
    }
  },

  // GET /api/prescriptions/{id}
  async getPrescriptionById(id) {
    try {
      const response = await api.get(`/prescriptions/${id}`);
      return response.data;
    } catch (err) {
      const rx = mockPrescriptions.find((p) => p.id === id);
      return rx || null;
    }
  },

  // POST /api/prescriptions
  async createPrescription(prescriptionData) {
    try {
      const response = await api.post('/prescriptions', prescriptionData);
      return response.data;
    } catch (err) {
      return {
        id: `rx_${Date.now()}`,
        ...prescriptionData,
        date: new Date().toISOString().split('T')[0],
        status: 'Active',
      };
    }
  },

  // GET /api/patients/{id}/allergies
  async getPatientAllergies(patientId = 'PID-2026-089') {
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
      // Client-side execution of verified clinical rules engine
      return runPrescriptionSafetyCheck({ medicines, patientId });
    }
  },
};

export default prescriptionService;
