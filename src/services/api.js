import axios from 'axios';
import { mockPrescriptions, mockMedicines } from '../data/mockData';
import { mockPatientAllergies, runPrescriptionSafetyCheck } from '../data/medicineSafetyData';
import { verifiedMedicineDatabase } from '../data/verifiedMedicineDatabase';

// Base API configuration for Python FastAPI backend
const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor: attaches Bearer token if user is logged in
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pulsecare_token') || localStorage.getItem('telehealth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handles unauthorized 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear expired credentials
      localStorage.removeItem('pulsecare_token');
      localStorage.removeItem('pulsecare_user');
      localStorage.removeItem('telehealth_token');
      localStorage.removeItem('telehealth_user');
    }
    return Promise.reject(error);
  }
);

/**
 * Authentication Service
 */
export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  async register(userData) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

/**
 * Hospital Discovery and Administration Service
 */
export const hospitalService = {
  async getHospitals(queryOrParams = '') {
    const params = typeof queryOrParams === 'object' ? queryOrParams : (queryOrParams ? { q: queryOrParams } : {});
    const res = await api.get('/hospitals', { params });
    return res.data;
  },

  async getFacilityFilters() {
    const res = await api.get('/facilities/filters');
    return res.data;
  },

  async getDatasetStatistics() {
    const res = await api.get('/datasets/statistics');
    return res.data;
  },

  async getHospitalById(id) {
    const res = await api.get(`/hospitals/${id}`);
    return res.data;
  },

  async getHospitalRegistrations(hospitalId, filters = {}) {
    const params = {};
    if (filters.status && filters.status !== 'All') params.status_filter = filters.status;
    if (filters.search) params.search = filters.search;
    const res = await api.get(`/hospitals/${hospitalId}/registrations`, { params });
    return res.data;
  },

  async updateRegistrationStatus(registrationId, newStatus) {
    const res = await api.patch(`/registrations/${registrationId}/status`, { status: newStatus });
    return res.data;
  },
};

/**
 * Patient Registration Service
 */
export const patientService = {
  async registerPatient(registrationData) {
    const res = await api.post('/registrations', registrationData);
    return res.data;
  },

  async getMyRegistrations() {
    const res = await api.get('/patients/me/registrations');
    return res.data;
  },
};

/**
 * RAG and Diagnostic Intelligence Service
 */
export const ragService = {
  async queryEvidence(query, topK = 3) {
    const res = await api.post('/rag/query', { query, top_k: topK });
    return res.data;
  },

  async interpretLab(testName, value, unit, gender) {
    const res = await api.post('/lab/interpret', {
      test_name: testName,
      value: parseFloat(value),
      unit: unit,
      gender: gender,
    });
    return res.data;
  },
};

/**
 * Prescription & Medicine Safety Service
 */
export const prescriptionService = {
  async getPrescriptions(patientId) {
    try {
      const res = await api.get('/prescriptions', { params: { patient_id: patientId } });
      return res.data;
    } catch (err) {
      return mockPrescriptions;
    }
  },

  async getPrescriptionById(id) {
    try {
      const res = await api.get(`/prescriptions/${id}`);
      return res.data;
    } catch (err) {
      return mockPrescriptions.find((p) => p.id === id) || null;
    }
  },

  async createPrescription(prescriptionData) {
    try {
      const res = await api.post('/prescriptions', prescriptionData);
      return res.data;
    } catch (err) {
      return {
        ...prescriptionData,
        id: `rx_${Date.now()}`,
        status: 'Active',
        date: new Date().toISOString().split('T')[0],
      };
    }
  },

  async checkSafety(payload) {
    try {
      const res = await api.post('/prescriptions/safety-check', payload);
      return res.data;
    } catch (err) {
      return runPrescriptionSafetyCheck(payload);
    }
  },

  async getPatientAllergies(patientId) {
    try {
      const res = await api.get(`/patients/${patientId}/allergies`);
      return res.data;
    } catch (err) {
      return mockPatientAllergies[patientId] || { knownAllergies: [] };
    }
  },

  async getMedicineSafety(medId) {
    try {
      const res = await api.get(`/medicines/${medId}/safety`);
      return res.data;
    } catch (err) {
      return verifiedMedicineDatabase[medId] || null;
    }
  },
};

export default api;
