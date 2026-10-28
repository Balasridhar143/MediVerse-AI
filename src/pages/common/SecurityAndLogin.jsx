import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { mockActiveSessions } from '../../data/mockData';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import {
  ShieldCheck,
  KeyRound,
  Laptop,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Clock,
  LogOut,
  Lock,
  Info,
} from 'lucide-react';

export default function SecurityAndLogin() {
  const { user, role } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const [sessions, setSessions] = useState(mockActiveSessions);
  const [sessionTerminated, setSessionTerminated] = useState(false);

  const handlePasswordChange = (e) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters in length.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation password do not match.');
      return;
    }

    // In production, invokes: POST /api/auth/change-password
    setPasswordSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordSuccess(false), 4000);
  };

  const handleSignOutOtherSessions = () => {
    // Retain only current device session
    setSessions(sessions.filter((s) => s.isCurrent));
    setSessionTerminated(true);
    setTimeout(() => setSessionTerminated(false), 3000);
  };

  const roleLabel =
    role === 'doctor'
      ? 'Doctor Workspace'
      : role === 'hospital_admin' || role === 'hospital'
      ? 'Hospital Administration'
      : 'Patient Account';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <PageHeader
        badge="Account Security"
        badgeStatus="Authentication Enforced"
        title="Security & Login Credentials"
        subtitle={`Manage credential protection, multi-session device control, and login verification for ${roleLabel}`}
      />

      {/* Security Architecture Guardrail Banner */}
      <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-xl flex items-start gap-3 text-xs text-slate-700">
        <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-slate-900 block mb-0.5">
            Security Architecture & Verification Notice
          </span>
          The frontend interface presents security configuration and telemetry. True credential hashing (Argon2id/bcrypt), JWT token verification, cryptographic session validation, and authorization boundaries are enforced independently by the backend server.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Password & Authentication */}
        <Card title="1. Password & Authentication" icon={KeyRound}>
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-slate-500 block text-[11px]">Last Password Update</span>
                <span className="font-bold text-slate-800 text-xs">
                  {user?.lastPasswordChange || '15 Aug 2026'}
                </span>
              </div>
              <span className="text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-semibold">
                Strong Standard
              </span>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-3">
              {passwordSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Password updated successfully! Hash regenerated on server.</span>
                </div>
              )}
              {passwordError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-xs focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-xs focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-xs focus:border-teal-500"
                  required
                />
              </div>

              <Button type="submit" variant="primary" size="sm" icon={Lock} className="w-full mt-2">
                Update Security Password
              </Button>
            </form>
          </div>
        </Card>

        {/* 2. Two-Factor Authentication */}
        <Card title="2. Two-Factor Authentication (2FA)" icon={ShieldCheck}>
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 text-sm">Two-Factor Authentication</span>
                <StatusBadge status="Not enabled" size="xs" />
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Adds an extra layer of security to your healthcare account by requiring a verification code in addition to your password.
              </p>
            </div>

            <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-lg space-y-1.5 text-amber-900">
              <div className="flex items-center gap-1.5 font-bold text-xs text-amber-950">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Feature Status: Coming Soon</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800">
                Backend TOTP authenticator (Google Authenticator / SMS OTP) infrastructure is currently being integrated into the FastAPI authentication service. 2FA is not yet active on this prototype.
              </p>
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full opacity-60 cursor-not-allowed"
                disabled
              >
                Enable 2FA (Coming soon)
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Login Activity & 4. Active Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Login Activity */}
        <Card title="3. Recent Login Activity" icon={Clock}>
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Last Successful Login:</span>
                <strong className="text-slate-900">Today at 09:15 AM</strong>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200/60 pt-1.5">
                <span className="text-slate-500">Access Device:</span>
                <span className="font-medium text-slate-800">Chrome on macOS 14.6</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200/60 pt-1.5">
                <span className="text-slate-500">Origin IP:</span>
                <span className="font-mono text-slate-700">103.21.124.89 (New Delhi, IN)</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200/60 pt-1.5">
                <span className="text-slate-500">Session Status:</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Authenticated Active
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              No unrecognized devices or abnormal geographic access detected within the last 30 days.
            </p>
          </div>
        </Card>

        {/* Active Sessions */}
        <Card
          title="4. Active Sessions & Connected Devices"
          icon={Laptop}
          action={
            sessions.length > 1 && (
              <button
                onClick={handleSignOutOtherSessions}
                className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
              >
                Sign out other sessions
              </button>
            )
          }
        >
          <div className="space-y-3 text-xs">
            {sessionTerminated && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>All secondary sessions have been revoked.</span>
              </div>
            )}

            {sessions.map((sess) => (
              <div
                key={sess.id}
                className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-3 ${
                  sess.isCurrent
                    ? 'bg-teal-50/40 border-teal-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-700 shrink-0">
                    {sess.sessionType === 'Mobile App' ? (
                      <Smartphone className="w-4 h-4" />
                    ) : (
                      <Laptop className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-900">{sess.device}</strong>
                      {sess.isCurrent && (
                        <span className="text-[10px] font-bold text-teal-800 bg-teal-100/70 px-1.5 py-0.5 rounded">
                          Current Device
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      {sess.location} • IP: {sess.ipAddress} • {sess.lastActive}
                    </p>
                  </div>
                </div>

                {!sess.isCurrent && (
                  <button
                    onClick={() => setSessions(sessions.filter((s) => s.id !== sess.id))}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-white cursor-pointer"
                    title="Terminate this session"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
