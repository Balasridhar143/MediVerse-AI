import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Activity, Lock, Mail, ArrowRight, ShieldCheck, Eye, EyeOff, KeyRound, Loader2, AlertCircle } from 'lucide-react';
import Button from '../../components/Button';
import { authService } from '../../services/api';

export default function Login() {
  const { login, loginWithOtp } = useAuth();
  const navigate = useNavigate();

  // Mode: 'password' | 'otp'
  const [loginMode, setLoginMode] = useState('password');

  // Input states - strictly start empty as requested
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP Login state
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // Cooldown countdown timer for OTP resend
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleRedirect = (authenticatedUser) => {
    const userRole = authenticatedUser.role;
    if (userRole === 'doctor') {
      navigate('/doctor/dashboard', { replace: true });
    } else if (userRole === 'hospital_admin' || userRole === 'hospital') {
      navigate('/hospital/dashboard', { replace: true });
    } else {
      navigate('/patient/dashboard', { replace: true });
    }
  };

  // Standard Password Login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address format.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    try {
      setLoading(true);
      const authenticatedUser = await login(cleanEmail, password);
      handleRedirect(authenticatedUser);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  // Request Login OTP
  const handleRequestLoginOtp = async () => {
    setError('');
    setInfoMsg('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your email address first to receive an OTP.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address format.');
      return;
    }

    try {
      setLoading(true);
      const res = await authService.requestOtp(cleanEmail);
      setOtpSent(true);
      setCooldown(res.cooldown || 60);
      setInfoMsg('A 6-digit one-time login code has been dispatched to your email address.');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Unable to dispatch login OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Submit OTP Login
  const handleOtpLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');

    const cleanEmail = email.trim();
    const cleanOtp = otpCode.trim();

    if (!cleanEmail || !cleanOtp) {
      setError('Please enter your email address and the 6-digit verification code.');
      return;
    }

    if (cleanOtp.length !== 6) {
      setError('Please enter the complete 6-digit one-time password.');
      return;
    }

    try {
      setLoading(true);
      const authenticatedUser = await loginWithOtp(cleanEmail, cleanOtp);
      handleRedirect(authenticatedUser);
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-teal-600 text-white shadow-xs mb-3">
          <Activity className="w-7 h-7" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Mediverse AI
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Clinical Healthcare Management & Telemedicine Suite
        </p>
      </div>

      {/* Main Login Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-5 sm:px-8 shadow-xs border border-slate-200 rounded-2xl">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg mb-6 text-xs">
            <button
              type="button"
              onClick={() => { setLoginMode('password'); setError(''); setInfoMsg(''); }}
              className={`py-2 rounded-md font-medium transition-colors cursor-pointer text-center ${
                loginMode === 'password'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Password Login
            </button>
            <button
              type="button"
              onClick={() => { setLoginMode('otp'); setError(''); setInfoMsg(''); }}
              className={`py-2 rounded-md font-medium transition-colors cursor-pointer text-center ${
                loginMode === 'otp'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              OTP Code Login
            </button>
          </div>

          <div className="mb-5">
            <h2 className="text-base font-semibold text-slate-900">
              {loginMode === 'password' ? 'Sign in to your account' : 'Sign in with One-Time Password'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {loginMode === 'password'
                ? 'Enter your verified credentials to access your clinical portal'
                : 'Enter your registered email to receive an instant verification code'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Info Message */}
          {infoMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{infoMsg}</span>
            </div>
          )}

          {/* MODE 1: PASSWORD LOGIN */}
          {loginMode === 'password' && (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Enter your email address"
                    className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    disabled={loading}
                    autoComplete="email"
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
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Enter your password"
                    className="block w-full pl-9 pr-10 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    disabled={loading}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full mt-2"
                disabled={loading}
                icon={loading ? Loader2 : ArrowRight}
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </Button>
            </form>
          )}

          {/* MODE 2: OTP LOGIN */}
          {loginMode === 'otp' && (
            <form onSubmit={handleOtpLoginSubmit} className="space-y-4" noValidate>
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
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Enter your email address"
                    className="block w-full pl-9 pr-24 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    disabled={loading}
                    autoComplete="email"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleRequestLoginOtp}
                    disabled={loading || cooldown > 0 || !email.trim()}
                    className={`absolute inset-y-1 right-1 px-3 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                      cooldown > 0 || !email.trim()
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                    }`}
                  >
                    {cooldown > 0 ? `${cooldown}s` : 'Get Code'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  6-Digit One-Time Password
                </label>
                <div className="relative rounded-lg shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => {
                      setOtpCode(e.target.value.replace(/\D/g, ''));
                      if (error) setError('');
                    }}
                    placeholder="Enter 6-digit code"
                    className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm bg-white text-slate-900 placeholder:text-slate-400 tracking-widest font-mono focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full mt-2"
                disabled={loading || otpCode.length < 6}
                icon={loading ? Loader2 : ArrowRight}
              >
                {loading ? 'Verifying OTP...' : 'Verify & Sign In'}
              </Button>
            </form>
          )}

          {/* Registration link */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              New patient or healthcare clinician?{' '}
              <Link
                to="/register"
                className="font-medium text-teal-700 hover:text-teal-800 hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>

        {/* Security & Regulatory Standards Footer */}
        <div className="mt-6 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>NABH & HIPAA Compliant Role-Based Access Control</span>
        </div>
      </div>
    </div>
  );
}
