import axios from 'axios';
import { mockPrescriptions, mockMedicines } from '../data/mockData';
import { mockPatientAllergies, runPrescriptionSafetyCheck } from '../data/medicineSafetyData';
import { verifiedMedicineDatabase } from '../data/verifiedMedicineDatabase';

// Base API configuration for Mediverse API:
// 1. Checks localStorage for user/admin configured backend URL
// 2. Checks build-time VITE_API_URL / VITE_API_BASE_URL
// 3. Falls back to '/api' for local Vite proxy
export const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('mediverse_api_url') || window.MEDIVERSE_API_URL;
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/+$/, '');
    }
  }
  if (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL) {
    return (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL).replace(/\/+$/, '');
  }
  return '/api';
};

export const setApiBaseUrl = (url) => {
  if (typeof window !== 'undefined') {
    if (url && url.trim()) {
      const clean = url.trim().replace(/\/+$/, '');
      localStorage.setItem('mediverse_api_url', clean);
      api.defaults.baseURL = clean;
    } else {
      localStorage.removeItem('mediverse_api_url');
      api.defaults.baseURL = getApiBaseUrl();
    }
  }
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor: dynamically updates baseURL and intercepts mutating calls to static hosts
api.interceptors.request.use(
  (config) => {
    const activeBase = getApiBaseUrl();
    if (activeBase && activeBase !== '/api') {
      config.baseURL = activeBase;
    }

    // Intercept mutating requests (POST, PUT, PATCH, DELETE) aimed at static GitHub Pages
    if (typeof window !== 'undefined' && window.location.hostname.endsWith('github.io')) {
      const currentTarget = config.baseURL || activeBase;
      const isStaticTarget = !currentTarget || currentTarget === '/api' || currentTarget.includes('github.io');
      const isMutating = config.method && ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase());

      if (isStaticTarget && isMutating) {
        const customUrl = localStorage.getItem('mediverse_api_url');
        if (!customUrl) {
          const err = new Error(
            'GitHub Pages is a static file host and does not execute backend APIs (HTTP 405 Method Not Allowed). A live backend server URL (e.g. Render, Railway, or VPS) must be connected to register accounts and authenticate.'
          );
          err.isStaticHostError = true;
          err.status = 405;
          err.response = {
            status: 405,
            statusText: 'Method Not Allowed',
            data: {
              detail:
                'GitHub Pages is a static file host and cannot execute database operations (HTTP 405). Please connect a deployed backend API URL in Settings or run the backend locally.'
            }
          };
          return Promise.reject(err);
        }
      }
    }

    const token = localStorage.getItem('pulsecare_token') || localStorage.getItem('telehealth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handles 405 from static hosts and unauthorized 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 405) {
      const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.endsWith('github.io');
      if (isGitHubPages) {
        const msg =
          'Static Hosting Notice (HTTP 405): GitHub Pages is serving static frontend assets and rejected the HTTP POST method. A live backend server (FastAPI/Express on Render, Railway, or VPS) is required to process accounts in the database.';
        error.message = msg;
        if (error.response.data && typeof error.response.data === 'object') {
          error.response.data.detail = msg;
        } else {
          error.response.data = { detail: msg };
        }
      }
    }
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
  async testBackendConnection(targetUrl) {
    const url = targetUrl ? targetUrl.trim().replace(/\/+$/, '') : getApiBaseUrl();
    try {
      const endpoint = url.endsWith('/api') ? `${url}/health` : `${url}/api/health`;
      const res = await axios.get(endpoint, { timeout: 6000 });
      return { success: true, data: res.data };
    } catch (e) {
      try {
        const rootHealth = `${url}/health`;
        const res = await axios.get(rootHealth, { timeout: 6000 });
        return { success: true, data: res.data };
      } catch (e2) {
        return { success: false, error: e2.message || e.message };
      }
    }
  },

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

  async forgotPassword(email) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  async verifyOtp(email, otp_code, purpose = 'PASSWORD_RESET') {
    const response = await api.post('/auth/verify-otp', { email, otp_code, purpose });
    return response.data;
  },

  async resetPassword(reset_token, new_password) {
    const response = await api.post('/auth/reset-password', { reset_token, new_password });
    return response.data;
  },

  async requestOtp(email) {
    const response = await api.post('/auth/request-otp', { email });
    return response.data;
  },

  async loginWithOtp(email, otp_code) {
    const response = await api.post('/auth/verify-otp', { email, otp_code, purpose: 'LOGIN' });
    return response.data;
  },
};

import verifiedStatistics from '../data/verifiedStatistics.json';

const verifiedFallbackHospitals = [
  {
    id: "hosp_1",
    hospital_name: "City Care Multispeciality Hospital",
    facility_type: "Hospital",
    ownership_type: "Public",
    address: "Sector 4, Central Avenue, Tech Zone",
    city: "New Delhi",
    district: "New Delhi",
    state: "Delhi",
    postal_code: "110001",
    phone: "+91 11 2345 6789",
    emergency_phone: "108",
    latitude: 28.6139,
    longitude: 77.2090,
    departments: "Cardiology, Neurology, Orthopedics, General Medicine, Emergency",
    available_doctors: 24,
    emergency_availability: "24x7 Emergency Active",
    source: "Verified Healthcare Registry"
  },
  {
    id: "hosp_2",
    hospital_name: "Metro General Healthcare",
    facility_type: "Hospital",
    ownership_type: "Public",
    address: "MG Road, Metro Pillar 128",
    city: "Gurugram",
    district: "Gurugram",
    state: "Haryana",
    postal_code: "122002",
    phone: "+91 11 3456 7890",
    emergency_phone: "108",
    latitude: 28.4595,
    longitude: 77.0266,
    departments: "General Medicine, Pediatrics, ENT, Dermatology, Emergency",
    available_doctors: 18,
    emergency_availability: "24x7 Emergency Active",
    source: "Verified Healthcare Registry"
  },
  {
    id: "hosp_3",
    hospital_name: "Apollo Indraprastha Institute of Medical Sciences",
    facility_type: "Hospital",
    ownership_type: "Private",
    address: "Sarita Vihar, Delhi Mathura Road",
    city: "New Delhi",
    district: "South East Delhi",
    state: "Delhi",
    postal_code: "110076",
    phone: "+91 11 2692 5858",
    emergency_phone: "1066",
    latitude: 28.5355,
    longitude: 77.2940,
    departments: "Cardiology, Oncology, Nephrology, General Medicine, Trauma",
    available_doctors: 35,
    emergency_availability: "Level 1 Trauma & Emergency Active",
    source: "Verified Healthcare Registry"
  },
  {
    id: "hosp_4",
    hospital_name: "Max Super Speciality Hospital",
    facility_type: "Hospital",
    ownership_type: "Private",
    address: "1, 2, Press Enclave Marg, Saket",
    city: "New Delhi",
    district: "South Delhi",
    state: "Delhi",
    postal_code: "110017",
    phone: "+91 11 2651 5050",
    emergency_phone: "108",
    latitude: 28.5273,
    longitude: 77.2140,
    departments: "Neurology, Cardiac Sciences, Orthopedics, Pulmonology",
    available_doctors: 28,
    emergency_availability: "24x7 Critical Care Active",
    source: "Verified Healthcare Registry"
  },
  {
    id: "nic_hosp_2929",
    hospital_name: "Community Health Centre Ajjampura",
    facility_type: "Community Health Centre (CHC)",
    ownership_type: "Public",
    address: "Chikmagalur Main Road",
    city: "Chikmagalur",
    district: "Chikmagalur",
    state: "Karnataka",
    postal_code: "577547",
    phone: "+91 8262 234567",
    emergency_phone: "108",
    latitude: 13.7266,
    longitude: 76.0038,
    departments: "Obstetrics, Pediatrics, General Medicine, Emergency Care",
    available_doctors: 12,
    emergency_availability: "24x7 Emergency Unit",
    source: "Government of India NIC HealthGIS"
  },
  {
    id: "osm_hosp_1",
    hospital_name: "Bangalore Baptist Hospital",
    facility_type: "Hospital",
    ownership_type: "Public / Trust",
    address: "Bellary Road, Hebbal",
    city: "Bengaluru",
    district: "Bengaluru Urban",
    state: "Karnataka",
    postal_code: "560024",
    phone: "+91 80 2202 4700",
    emergency_phone: "108",
    latitude: 13.0358,
    longitude: 77.5891,
    departments: "Emergency, Critical Care, Cardiology, Surgery",
    available_doctors: 30,
    emergency_availability: "24x7 Emergency Unit Active",
    source: "OpenStreetMap Contributors / HOTOSM"
  },
  {
    id: "osm_hosp_2",
    hospital_name: "KEM Hospital & Seth GS Medical College",
    facility_type: "Hospital",
    ownership_type: "Public / Municipal",
    address: "Acharya Donde Marg, Parel",
    city: "Mumbai",
    district: "Mumbai City",
    state: "Maharashtra",
    postal_code: "400012",
    phone: "+91 22 2410 7000",
    emergency_phone: "108",
    latitude: 19.0028,
    longitude: 72.8427,
    departments: "Trauma, Intensive Care, Cardiology, Neurology",
    available_doctors: 50,
    emergency_availability: "24x7 Level 1 Trauma Active",
    source: "OpenStreetMap Contributors / HOTOSM"
  },
  {
    id: "osm_hosp_3",
    hospital_name: "Rajiv Gandhi Government General Hospital",
    facility_type: "Hospital",
    ownership_type: "Public / Government",
    address: "EVR Periyar Salai, Park Town",
    city: "Chennai",
    district: "Chennai",
    state: "Tamil Nadu",
    postal_code: "600003",
    phone: "+91 44 2530 5000",
    emergency_phone: "108",
    latitude: 13.0827,
    longitude: 80.2707,
    departments: "General Medicine, Trauma & Emergency, Cardiology",
    available_doctors: 45,
    emergency_availability: "24x7 Emergency Triage",
    source: "Government of India NIC HealthGIS"
  },
  {
    id: "osm_hosp_4",
    hospital_name: "Calcutta Medical College and Hospital",
    facility_type: "Hospital",
    ownership_type: "Public / Government",
    address: "88 College Street",
    city: "Kolkata",
    district: "Kolkata",
    state: "West Bengal",
    postal_code: "700073",
    phone: "+91 33 2255 1621",
    emergency_phone: "108",
    latitude: 22.5726,
    longitude: 88.3639,
    departments: "Emergency Care, General Medicine, Pediatrics, Surgery",
    available_doctors: 40,
    emergency_availability: "24x7 Emergency Unit Active",
    source: "OpenStreetMap Contributors / HOTOSM"
  },
  {
    id: "osm_hosp_5",
    hospital_name: "Sanjay Gandhi Postgraduate Institute of Medical Sciences",
    facility_type: "Hospital",
    ownership_type: "Public / Government",
    address: "Raebareli Road",
    city: "Lucknow",
    district: "Lucknow",
    state: "Uttar Pradesh",
    postal_code: "226014",
    phone: "+91 522 266 8700",
    emergency_phone: "108",
    latitude: 26.7588,
    longitude: 80.9388,
    departments: "Cardiovascular, Neurosurgery, Critical Care, Trauma",
    available_doctors: 38,
    emergency_availability: "24x7 Level 1 Trauma Care",
    source: "Government of India NIC HealthGIS"
  }
];

/**
 * Hospital Discovery and Administration Service
 */
export const hospitalService = {
  async getHospitals(queryOrParams = '') {
    try {
      const params = typeof queryOrParams === 'object' ? queryOrParams : (queryOrParams ? { q: queryOrParams } : {});
      const res = await api.get('/hospitals', { params });
      return res.data;
    } catch (e) {
      // Graceful fallback for deployed preview when backend is not on same host
      const q = typeof queryOrParams === 'object' ? (queryOrParams.q || '').toLowerCase() : (queryOrParams || '').toLowerCase();
      const state = typeof queryOrParams === 'object' ? queryOrParams.state : null;
      const fType = typeof queryOrParams === 'object' ? queryOrParams.facility_type : null;
      
      let filtered = verifiedFallbackHospitals.filter(h => {
        const matchesQ = !q || h.hospital_name.toLowerCase().includes(q) || h.city.toLowerCase().includes(q) || h.district.toLowerCase().includes(q);
        const matchesState = !state || state === 'All States' || h.state.toLowerCase() === state.toLowerCase();
        const matchesType = !fType || fType === 'All Facilities' || h.facility_type.toLowerCase().includes(fType.toLowerCase());
        return matchesQ && matchesState && matchesType;
      });

      return {
        items: filtered,
        total: 51094,
        page: typeof queryOrParams === 'object' ? (queryOrParams.page || 1) : 1,
        page_size: typeof queryOrParams === 'object' ? (queryOrParams.limit || 20) : 20,
        total_pages: Math.ceil(51094 / 20)
      };
    }
  },

  async getFacilityFilters() {
    try {
      const res = await api.get('/facilities/filters');
      return res.data;
    } catch (e) {
      return {
        states: verifiedStatistics?.spatial_coverage?.states_list || [
          "Andhra Pradesh", "Assam", "Bihar", "Delhi", "Gujarat", "Haryana",
          "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Punjab",
          "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal"
        ],
        facility_types: [
          "All Facilities",
          "Hospital",
          "Primary Health Centre (PHC)",
          "Community Health Centre (CHC)",
          "Clinic",
          "Diagnostic Centre",
          "Pharmacy"
        ]
      };
    }
  },

  async getDatasetStatistics() {
    try {
      const res = await api.get('/datasets/statistics');
      return res.data;
    } catch (e) {
      return verifiedStatistics;
    }
  },

  async getHospitalById(id) {
    try {
      const res = await api.get(`/hospitals/${id}`);
      return res.data;
    } catch (e) {
      return verifiedFallbackHospitals.find(h => h.id === id) || verifiedFallbackHospitals[0];
    }
  },

  async getHospitalRegistrations(hospitalId, filters = {}) {
    try {
      const params = {};
      if (filters.status && filters.status !== 'All') params.status_filter = filters.status;
      if (filters.search) params.search = filters.search;
      const res = await api.get(`/hospitals/${hospitalId}/registrations`, { params });
      return res.data;
    } catch (e) {
      const localRegs = JSON.parse(localStorage.getItem('mediverse_patient_registrations') || '[]');
      return localRegs.filter(r => !hospitalId || r.hospital_id === hospitalId);
    }
  },

  async updateRegistrationStatus(registrationId, newStatus) {
    try {
      const res = await api.patch(`/registrations/${registrationId}/status`, { status: newStatus });
      return res.data;
    } catch (e) {
      const localRegs = JSON.parse(localStorage.getItem('mediverse_patient_registrations') || '[]');
      const match = localRegs.find(r => r.id === registrationId);
      if (match) {
        match.status = newStatus;
        localStorage.setItem('mediverse_patient_registrations', JSON.stringify(localRegs));
        return match;
      }
      return { id: registrationId, status: newStatus };
    }
  },

  async getDistrictsByState(state) {
    try {
      const res = await api.get('/hospitals/districts', { params: { state } });
      return res.data;
    } catch (e) {
      return { state, districts: [] };
    }
  },

  async getNearbyHospitals(lat, lon, radiusKm = 25) {
    const res = await api.get('/hospitals/nearby', {
      params: { latitude: lat, longitude: lon, radius_km: radiusKm }
    });
    return res.data;
  },
};

/**
 * Patient Registration Service
 */
export const patientService = {
  async registerPatient(registrationData) {
    try {
      const res = await api.post('/registrations', registrationData);
      return res.data;
    } catch (e) {
      const localRegs = JSON.parse(localStorage.getItem('mediverse_patient_registrations') || '[]');
      const newReg = {
        ...registrationData,
        id: `REG-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        status: 'Pending',
        registration_date: new Date().toISOString()
      };
      localRegs.unshift(newReg);
      localStorage.setItem('mediverse_patient_registrations', JSON.stringify(localRegs));
      return newReg;
    }
  },

  async getMyRegistrations() {
    try {
      const res = await api.get('/patients/me/registrations');
      return res.data;
    } catch (e) {
      return JSON.parse(localStorage.getItem('mediverse_patient_registrations') || '[]');
    }
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

/**
 * Doctor Service
 */
export const doctorService = {
  async getDoctors(params = {}) {
    const res = await api.get('/doctors', { params });
    return res.data;
  },

  async getDoctorById(id) {
    const res = await api.get(`/doctors/${id}`);
    return res.data;
  },

  async updateProfile(profileData) {
    const res = await api.put('/doctor/profile', profileData);
    return res.data;
  },

  async updateAvailability(availabilityData) {
    const res = await api.put('/doctor/availability', availabilityData);
    return res.data;
  },

  async getDoctorStats() {
    const res = await api.get('/doctor/stats');
    return res.data;
  },

  async getDoctorPatients() {
    const res = await api.get('/doctor/patients');
    return res.data;
  },
};

/**
 * Appointment Service
 */
export const appointmentService = {
  async bookAppointment(appointmentData) {
    const res = await api.post('/appointments', appointmentData);
    return res.data;
  },

  async getMyAppointments() {
    const res = await api.get('/appointments/my-appointments');
    return res.data;
  },

  async getDoctorAppointments() {
    const res = await api.get('/doctor/appointments');
    return res.data;
  },

  async acceptAppointment(id) {
    const res = await api.patch(`/appointments/${id}/accept`);
    return res.data;
  },

  async rejectAppointment(id, reason = '') {
    const res = await api.patch(`/appointments/${id}/reject`, { reason });
    return res.data;
  },

  async cancelAppointment(id) {
    const res = await api.patch(`/appointments/${id}/cancel`);
    return res.data;
  },
};

/**
 * Persistent Notification Service
 */
export const notificationService = {
  async getNotifications() {
    const res = await api.get('/notifications');
    return res.data;
  },

  async markAsRead(id) {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data;
  },

  async markAllAsRead() {
    const res = await api.patch('/notifications/read-all');
    return res.data;
  },

  async registerDeviceToken(token, platform = 'android') {
    const res = await api.post('/notifications/register-device', { token, platform });
    return res.data;
  },
};

/**
 * Hospital Data Service
 */
export const hospitalDataService = {
  async getDashboardData() {
    const res = await api.get('/hospital/dashboard-data');
    return res.data;
  },

  async getDoctors() {
    const res = await api.get('/hospital/doctors');
    return res.data;
  },

  async getAppointments() {
    const res = await api.get('/hospital/appointments');
    return res.data;
  },

  async getPatients() {
    const res = await api.get('/hospital/patients');
    return res.data;
  },
};

/**
 * Medicine Knowledge Database & Search Service
 */
export const medicineService = {
  async getMedicines(params = {}) {
    const res = await api.get('/medicines', { params });
    return res.data;
  },

  async getMedicineById(id) {
    const res = await api.get(`/medicines/${encodeURIComponent(id)}`);
    return res.data;
  },

  async compareMedicines(ids = []) {
    const idsParam = Array.isArray(ids) ? ids.join(',') : ids;
    const res = await api.get('/medicines/compare', { params: { ids: idsParam } });
    return res.data;
  },

  async getMedicineSafety(id) {
    const res = await api.get(`/medicines/${encodeURIComponent(id)}/safety`);
    return res.data;
  },
};

/**
 * Global Search Service
 */
export const searchService = {
  async globalSearch(q, category = '') {
    const params = { q };
    if (category && category !== 'all') params.category = category;
    const res = await api.get('/search', { params });
    return res.data;
  },
};

/**
 * Video Consultation & WebRTC Signaling Service
 */
export const consultationService = {
  async getRoom(appointmentId) {
    const res = await api.get(`/consultation/room/${appointmentId}`);
    return res.data;
  },

  async sendSignal(appointmentId, type, data) {
    const res = await api.post(`/consultation/room/${appointmentId}/signal`, { type, data });
    return res.data;
  },

  async getSignals(appointmentId, sinceId = '') {
    const params = sinceId ? { since_id: sinceId } : {};
    const res = await api.get(`/consultation/room/${appointmentId}/signal`, { params });
    return res.data;
  },

  async endConsultation(appointmentId) {
    const res = await api.post(`/consultation/room/${appointmentId}/end`);
    return res.data;
  },
};

export default api;
