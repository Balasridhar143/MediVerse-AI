import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Activity, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import Button from '../../components/Button';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('patient@example.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Quick fill demo helper buttons (strictly populates the email/password fields; does not select a role)
  const handleQuickFill = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    try {
      setLoading(true);
      const authenticatedUser = await login(email, password);

      // Redirect strictly based on the authenticated user's assigned role
      const userRole = authenticatedUser.role;
      if (userRole === 'doctor') {
        navigate('/doctor/dashboard', { replace: true });
      } else if (userRole === 'hospital_admin' || userRole === 'hospital') {
        navigate('/hospital/dashboard', { replace: true });
      } else {
        navigate('/patient/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-teal-600 text-white shadow-xs mb-3">
          <Activity className="w-7 h-7" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          PulseCare TeleHealth System
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Telemedicine & Longitudinal Patient Health Management
        </p>
      </div>

      {/* Main Form Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xs border border-slate-200 rounded-xl sm:px-10">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-slate-800">Sign in to your account</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your credentials to access your designated healthcare workspace
            </p>
          </div>

          {/* Quick Demo Credentials Fill (Pre-populates fields for reviewers) */}
          <div className="mb-5 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Demo Test Accounts (Click to Fill)
            </span>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('patient@example.com')}
                className={`py-1.5 px-2 rounded-md border text-center font-medium transition-colors cursor-pointer ${
                  email.includes('patient')
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Patient
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('doctor@example.com')}
                className={`py-1.5 px-2 rounded-md border text-center font-medium transition-colors cursor-pointer ${
                  email.includes('doctor')
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Doctor
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('admin@example.com')}
                className={`py-1.5 px-2 rounded-md border text-center font-medium transition-colors cursor-pointer ${
                  email.includes('admin')
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Hospital Admin
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
              {error}
            </div>
          )}

          {/* Single Login Form: Email + Password only. No role selection! */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-teal-700 hover:text-teal-800 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2"
              disabled={loading}
              icon={loading ? null : ArrowRight}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>

          {/* Registration link */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              New patient or clinician?{' '}
              <Link
                to="/register"
                className="font-medium text-teal-700 hover:text-teal-800 hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>

        {/* Security / HIPAA compliance footer note */}
        <div className="mt-6 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>NABH & HIPAA Compliant Role-Based Access Control</span>
        </div>
      </div>
    </div>
  );
}
