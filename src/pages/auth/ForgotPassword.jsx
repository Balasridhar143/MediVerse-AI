import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Mail, ArrowLeft, CheckCircle2, ShieldCheck, KeyRound, Lock, Eye, EyeOff, RefreshCw } from 'lucide-react';
import Button from '../../components/Button';
import { authService } from '../../services/api';

export default function ForgotPassword() {
  const navigate = useNavigate();

  // Multi-step workflow state: 1 = Request, 2 = Verify OTP, 3 = New Password, 4 = Success
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetToken, setResetToken] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Cooldown countdown timer for resend
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Step 1: Request Password Recovery OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!email) {
      setError('Please provide your registered email address.');
      return;
    }

    try {
      setLoading(true);
      const res = await authService.forgotPassword(email);
      setSuccessMsg(res.message || 'Verification code sent to your email.');
      setCooldown(res.cooldown || 60);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Unable to process recovery request.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    setError('');
    try {
      setLoading(true);
      const res = await authService.forgotPassword(email);
      setSuccessMsg('A new verification code has been dispatched.');
      setCooldown(res.cooldown || 60);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    const cleanCode = otpCode.trim();
    if (!cleanCode || cleanCode.length < 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    try {
      setLoading(true);
      const res = await authService.verifyOtp(email, cleanCode, 'PASSWORD_RESET');
      if (res.reset_token) {
        setResetToken(res.reset_token);
        setStep(3);
        setSuccessMsg('Code verified. Please set your new secure password.');
      } else {
        throw new Error('Verification token not received.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Set New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!newPassword || newPassword.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify and re-enter.');
      return;
    }

    try {
      setLoading(true);
      const res = await authService.resetPassword(resetToken, newPassword);
      setSuccessMsg(res.message || 'Password successfully updated.');
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to update password.');
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
          Mediverse AI Recovery
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Secure Healthcare Identity & Password Recovery
        </p>
      </div>

      {/* Main Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xs border border-slate-200 rounded-xl sm:px-10">
          
          {/* Progress Indicators */}
          {step < 4 && (
            <div className="mb-6 flex items-center justify-between text-xs border-b border-slate-100 pb-3">
              <span className={`font-semibold ${step >= 1 ? 'text-teal-600' : 'text-slate-400'}`}>
                1. Request OTP
              </span>
              <span className="text-slate-300">›</span>
              <span className={`font-semibold ${step >= 2 ? 'text-teal-600' : 'text-slate-400'}`}>
                2. Verify Code
              </span>
              <span className="text-slate-300">›</span>
              <span className={`font-semibold ${step >= 3 ? 'text-teal-600' : 'text-slate-400'}`}>
                3. New Password
              </span>
            </div>
          )}

          {/* Feedback Alerts */}
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
              {error}
            </div>
          )}
          {successMsg && step !== 4 && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700">
              {successMsg}
            </div>
          )}

          {/* STEP 1: REQUEST OTP */}
          {step === 1 && (
            <div>
              <div className="mb-5">
                <h2 className="text-base font-semibold text-slate-800">Forgot Password?</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter your registered healthcare account email. We will send a secure 6-digit verification code.
                </p>
              </div>

              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your registered email"
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  size="md"
                  disabled={loading}
                >
                  {loading ? 'Sending Code...' : 'Send Verification Code'}
                </Button>
              </form>
            </div>
          )}

          {/* STEP 2: VERIFY OTP */}
          {step === 2 && (
            <div>
              <div className="mb-5">
                <h2 className="text-base font-semibold text-slate-800">Enter Verification Code</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter the 6-digit OTP code sent to <strong className="text-slate-700">{email}</strong>.
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    6-Digit One-Time Password (OTP)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      autoFocus
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 123456"
                      className="w-full pl-9 pr-3 py-2.5 text-center text-lg tracking-widest font-mono border border-slate-300 rounded-lg focus:outline-hidden focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  size="md"
                  disabled={loading || otpCode.length < 6}
                >
                  {loading ? 'Verifying...' : 'Verify Code & Proceed'}
                </Button>

                {/* Resend Cooldown Section */}
                <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="hover:underline text-slate-600 cursor-pointer"
                  >
                    Change Email
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={cooldown > 0 || loading}
                    className={`inline-flex items-center gap-1 font-medium cursor-pointer ${
                      cooldown > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-teal-600 hover:underline'
                    }`}
                  >
                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend Code'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: SET NEW PASSWORD */}
          {step === 3 && (
            <div>
              <div className="mb-5">
                <h2 className="text-base font-semibold text-slate-800">Set New Password</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose a new strong password for your MediVerse AI account.
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full pl-9 pr-10 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-hidden focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  size="md"
                  disabled={loading}
                >
                  {loading ? 'Updating Password...' : 'Save New Password'}
                </Button>
              </form>
            </div>
          )}

          {/* STEP 4: SUCCESS VIEW */}
          {step === 4 && (
            <div className="text-center space-y-4 py-2">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Password Reset Complete
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
                Your MediVerse AI password has been updated securely. You can now log into your clinical workspace with your new credentials.
              </p>
              <div className="pt-3">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => navigate('/login')}
                >
                  Sign In to MediVerse AI
                </Button>
              </div>
            </div>
          )}

          {/* Back to Login */}
          {step !== 4 && (
            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Sign In</span>
              </Link>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          <span>Encrypted cryptographic recovery powered by MediVerse Identity</span>
        </p>
      </div>
    </div>
  );
}
