import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ElderModeProvider } from './context/ElderModeContext';
import Layout from './components/Layout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// Patient Pages
import PatientDashboard from './pages/patient/PatientDashboard';
import PatientProfile from './pages/patient/PatientProfile';
import FindDoctor from './pages/patient/FindDoctor';
import FindHospital from './pages/patient/FindHospital';
import Appointments from './pages/patient/Appointments';
import Consultation from './pages/patient/Consultation';
import Prescriptions from './pages/patient/Prescriptions';
import Medicines from './pages/patient/Medicines';
import MedicalReports from './pages/patient/MedicalReports';
import HealthTimeline from './pages/patient/HealthTimeline';
import HealthTwin from './pages/patient/HealthTwin';
import FollowUps from './pages/patient/FollowUps';
import Emergency from './pages/patient/Emergency';
import PatientSettings from './pages/patient/Settings';
import CaregiverMode from './pages/patient/CaregiverMode';

// Doctor Pages
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorPatientList from './pages/doctor/DoctorPatientList';
import ClinicalContext from './pages/doctor/ClinicalContext';
import PrescriptionWriter from './pages/doctor/PrescriptionWriter';
import DoctorConsultations from './pages/doctor/DoctorConsultations';
import MedicineSafety from './pages/doctor/MedicineSafety';
import DoctorHealthTrends from './pages/doctor/DoctorHealthTrends';
import EarlyWarnings from './pages/doctor/EarlyWarnings';
import DoctorSettings from './pages/doctor/DoctorSettings';

// Hospital Pages
import HospitalDashboard from './pages/hospital/HospitalDashboard';
import HospitalProfile from './pages/hospital/HospitalProfile';
import HospitalDepartments from './pages/hospital/HospitalDepartments';
import HospitalDoctors from './pages/hospital/HospitalDoctors';
import HospitalPatients from './pages/hospital/HospitalPatients';
import HospitalAppointments from './pages/hospital/HospitalAppointments';
import EmergencyCases from './pages/hospital/EmergencyCases';
import HospitalAnalytics from './pages/hospital/HospitalAnalytics';
import HospitalSettings from './pages/hospital/HospitalSettings';

// Common Security & Governance Pages
import SecurityAndLogin from './pages/common/SecurityAndLogin';
import PrivacyAndAccess from './pages/common/PrivacyAndAccess';
import ActivityAuditHistory from './pages/common/ActivityAuditHistory';

/**
 * PublicRoute
 * Redirects already-authenticated users directly to their designated portal dashboard.
 */
function PublicRoute({ children }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
        Loading Mediverse AI System...
      </div>
    );
  }

  if (user) {
    const userRole = role === 'hospital' ? 'hospital_admin' : role;
    if (userRole === 'doctor') return <Navigate to="/doctor/dashboard" replace />;
    if (userRole === 'hospital_admin') return <Navigate to="/hospital/dashboard" replace />;
    return <Navigate to="/patient/dashboard" replace />;
  }

  return children;
}

/**
 * RoleGuard
 * Strictly protects portal routes:
 * 1. If not authenticated -> redirects to /login.
 * 2. If authenticated user attempts to access an unauthorized portal -> redirects them to their OWN dashboard.
 */
function RoleGuard({ allowedRole, children }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
        Verifying Clinical Authorization...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = role === 'hospital' ? 'hospital_admin' : role;
  const targetRole = allowedRole === 'hospital' ? 'hospital_admin' : allowedRole;

  if (userRole !== targetRole) {
    // Unauthorized portal access attempt: redirect to user's assigned role dashboard
    const ownDashboard =
      userRole === 'doctor'
        ? '/doctor/dashboard'
        : userRole === 'hospital_admin'
        ? '/hospital/dashboard'
        : '/patient/dashboard';
    return <Navigate to={ownDashboard} replace />;
  }

  return children;
}

/**
 * RootRedirect
 * Resolves root '/' to the user's role dashboard or '/login'.
 */
function RootRedirect() {
  const { user, role, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = role === 'hospital' ? 'hospital_admin' : role;
  if (userRole === 'doctor') return <Navigate to="/doctor/dashboard" replace />;
  if (userRole === 'hospital_admin') return <Navigate to="/hospital/dashboard" replace />;
  return <Navigate to="/patient/dashboard" replace />;
}

import { initializeMobileApp } from './services/mobileNative';
import { useNavigate } from 'react-router-dom';

function MobileAppInitializer() {
  const navigate = useNavigate();
  React.useEffect(() => {
    initializeMobileApp(navigate);
  }, [navigate]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <MobileAppInitializer />
      <AuthProvider>
        <ElderModeProvider>
          <Routes>
          {/* Public Auth Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            }
          />

          {/* Root Redirection */}
          <Route path="/" element={<RootRedirect />} />

          {/* Patient Portal Routes (RoleGuard: patient) */}
          <Route
            element={
              <RoleGuard allowedRole="patient">
                <Layout />
              </RoleGuard>
            }
          >
            <Route path="/patient/dashboard" element={<PatientDashboard />} />
            <Route path="/patient/profile" element={<PatientProfile />} />
            <Route path="/patient/find-doctor" element={<FindDoctor />} />
            <Route path="/patient/find-hospital" element={<FindHospital />} />
            <Route path="/patient/appointments" element={<Appointments />} />
            <Route path="/patient/consultations" element={<Consultation />} />
            <Route path="/patient/consultation" element={<Consultation />} />
            <Route path="/patient/prescriptions" element={<Prescriptions />} />
            <Route path="/patient/medicines" element={<Medicines />} />
            <Route path="/patient/reports" element={<MedicalReports />} />
            <Route path="/patient/timeline" element={<HealthTimeline />} />
            <Route path="/patient/health-timeline" element={<HealthTimeline />} />
            <Route path="/patient/health-twin" element={<HealthTwin />} />
            <Route path="/patient/follow-ups" element={<FollowUps />} />
            <Route path="/patient/emergency" element={<Emergency />} />
            <Route path="/patient/caregiver" element={<CaregiverMode />} />
            <Route path="/patient/settings" element={<PatientSettings />} />
            <Route path="/patient/security" element={<SecurityAndLogin />} />
            <Route path="/patient/privacy" element={<PrivacyAndAccess />} />
            <Route path="/patient/activity" element={<ActivityAuditHistory />} />
          </Route>

          {/* Doctor Portal Routes (RoleGuard: doctor) */}
          <Route
            element={
              <RoleGuard allowedRole="doctor">
                <Layout />
              </RoleGuard>
            }
          >
            <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
            <Route path="/doctor/appointments" element={<DoctorDashboard />} />
            <Route path="/doctor/patients" element={<DoctorPatientList />} />
            <Route path="/doctor/records" element={<DoctorPatientList />} />
            <Route path="/doctor/consultations" element={<DoctorConsultations />} />
            <Route path="/doctor/clinical-context" element={<ClinicalContext />} />
            <Route path="/doctor/prescriptions" element={<PrescriptionWriter />} />
            <Route path="/doctor/prescription" element={<PrescriptionWriter />} />
            <Route path="/doctor/medicine-safety" element={<MedicineSafety />} />
            <Route path="/doctor/health-trends" element={<DoctorHealthTrends />} />
            <Route path="/doctor/early-warnings" element={<EarlyWarnings />} />
            <Route path="/doctor/follow-ups" element={<FollowUps />} />
            <Route path="/doctor/settings" element={<DoctorSettings />} />
            <Route path="/doctor/security" element={<SecurityAndLogin />} />
            <Route path="/doctor/privacy" element={<PrivacyAndAccess />} />
            <Route path="/doctor/activity" element={<ActivityAuditHistory />} />
          </Route>

          {/* Hospital Admin Portal Routes (RoleGuard: hospital_admin) */}
          <Route
            element={
              <RoleGuard allowedRole="hospital_admin">
                <Layout />
              </RoleGuard>
            }
          >
            <Route path="/hospital/dashboard" element={<HospitalDashboard />} />
            <Route path="/hospital/profile" element={<HospitalProfile />} />
            <Route path="/hospital/departments" element={<HospitalDepartments />} />
            <Route path="/hospital/doctors" element={<HospitalDoctors />} />
            <Route path="/hospital/patients" element={<HospitalPatients />} />
            <Route path="/hospital/appointments" element={<HospitalAppointments />} />
            <Route path="/hospital/emergency-cases" element={<EmergencyCases />} />
            <Route path="/hospital/emergency" element={<EmergencyCases />} />
            <Route path="/hospital/analytics" element={<HospitalAnalytics />} />
            <Route path="/hospital/settings" element={<HospitalSettings />} />
            <Route path="/hospital/security" element={<SecurityAndLogin />} />
            <Route path="/hospital/privacy" element={<PrivacyAndAccess />} />
            <Route path="/hospital/activity" element={<ActivityAuditHistory />} />
          </Route>

          {/* Fallback Catch-all: redirects to user's assigned portal or login */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
        </ElderModeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
