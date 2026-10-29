import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Activity,
  User,
  Mail,
  Lock,
  UserCheck,
  Stethoscope,
  Building2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import Button from '../../components/Button';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('patient');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    // Patient specific
    age: '',
    gender: 'Male',
    bloodGroup: 'B+',
    // Doctor specific
    specialization: 'Internal Medicine',
    licenseNumber: '',
    hospital: '',
    // Hospital Admin specific
    hospitalName: '',
    facilityId: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setLoading(true);
      await register({
        ...formData,
        role,
      });

      // Redirect according to role
      if (role === 'patient') {
        navigate('/patient/dashboard');
      } else if (role === 'doctor') {
        navigate('/doctor/dashboard');
      } else if (role === 'hospital') {
        navigate('/hospital/dashboard');
      }
    } catch (err) {
      const errMsg = err.response?.data?.detail || err.message || 'Registration failed. Please verify your details.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-teal-600 text-white shadow-xs mb-3">
          <Activity className="w-7 h-7" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Create TeleHealth Account
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Join the longitudinal health and telemedicine network
        </p>
      </div>

      {/* Main Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 shadow-xs border border-slate-200 rounded-xl sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Select Your Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('patient')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-colors cursor-pointer ${
                    role === 'patient'
                      ? 'border-teal-600 bg-teal-50/60 text-teal-800'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <UserCheck className="w-4 h-4 mb-1 text-teal-600" />
                  <span className="text-xs font-medium">Patient</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('doctor')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-colors cursor-pointer ${
                    role === 'doctor'
                      ? 'border-teal-600 bg-teal-50/60 text-teal-800'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <Stethoscope className="w-4 h-4 mb-1 text-teal-600" />
                  <span className="text-xs font-medium">Doctor</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('hospital')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-colors cursor-pointer ${
                    role === 'hospital'
                      ? 'border-teal-600 bg-teal-50/60 text-teal-800'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <Building2 className="w-4 h-4 mb-1 text-teal-600" />
                  <span className="text-xs font-medium">Hospital Admin</span>
                </button>
              </div>
            </div>

            {/* Common: Full Name */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={role === 'doctor' ? 'Dr. First Last' : 'Full Name'}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white"
                />
              </div>
            </div>

            {/* Common: Email */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email address"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white"
                />
              </div>
            </div>

            {/* Role Specific Conditional Fields */}
            {role === 'patient' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Age</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    placeholder="e.g. 35"
                    className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md bg-white focus:outline-hidden focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md bg-white focus:outline-hidden focus:border-teal-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Blood Group</label>
                  <select
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleChange}
                    className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md bg-white focus:outline-hidden focus:border-teal-500"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>
            )}

            {role === 'doctor' && (
              <div className="space-y-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Specialization
                    </label>
                    <input
                      type="text"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      placeholder="e.g. Cardiology"
                      className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md bg-white focus:outline-hidden focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Medical License / Reg No.
                    </label>
                    <input
                      type="text"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      placeholder="e.g. MCI-78219"
                      className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md bg-white focus:outline-hidden focus:border-teal-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Affiliated Hospital
                  </label>
                  <input
                    type="text"
                    name="hospital"
                    value={formData.hospital}
                    onChange={handleChange}
                    placeholder="e.g. City Care Multispeciality Hospital"
                    className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md bg-white focus:outline-hidden focus:border-teal-500"
                  />
                </div>
              </div>
            )}

            {role === 'hospital' && (
              <div className="space-y-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Hospital / Institution Name
                  </label>
                  <input
                    type="text"
                    name="hospitalName"
                    value={formData.hospitalName}
                    onChange={handleChange}
                    placeholder="e.g. Metro General Healthcare"
                    className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md bg-white focus:outline-hidden focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Facility Accreditation / ID
                  </label>
                  <input
                    type="text"
                    name="facilityId"
                    value={formData.facilityId}
                    onChange={handleChange}
                    placeholder="e.g. NABH-2026-09"
                    className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md bg-white focus:outline-hidden focus:border-teal-500"
                  />
                </div>
              </div>
            )}

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full"
                size="md"
              >
                {loading ? 'Creating Account...' : 'Complete Registration'}
                {!loading && <ArrowRight className="w-4 h-4 ml-1.5" />}
              </Button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              Already registered?{' '}
              <Link
                to="/login"
                className="font-semibold text-teal-600 hover:text-teal-700 hover:underline"
              >
                Sign in to your account
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          Ready to connect to Python FastAPI backend (`/api/auth/register`)
        </p>
      </div>
    </div>
  );
}
