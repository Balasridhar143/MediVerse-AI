import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  User,
  Search,
  Building,
  Calendar,
  Video,
  FileText,
  Pill,
  FileCheck2,
  GitCommit,
  Activity,
  Clock,
  Settings,
  LogOut,
  Users,
  BrainCircuit,
  ShieldAlert,
  LineChart,
  Siren,
  Hospital,
  PieChart,
  X,
  Stethoscope,
  ChevronDown,
  KeyRound,
  Lock,
  History,
  BookOpen,
  Sparkles,
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { role, logout, user } = useAuth();
  const navigate = useNavigate();
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const userPatientId =
    user?.patientId ||
    user?.facilityId ||
    user?.id ||
    (role === 'doctor' ? 'D001' : role === 'hospital_admin' || role === 'hospital' ? 'H001' : 'PID-2026-089');

  const isDoctor = role === 'doctor';
  const isHospital = role === 'hospital_admin' || role === 'hospital';

  // 1. Patient Navigation (Grouped by clinical domain for rapid scanning)
  const patientGroups = [
    {
      group: 'MAIN',
      items: [
        { label: 'Dashboard', path: '/patient/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      group: 'CARE',
      items: [
        { label: 'Find Doctor', path: '/patient/find-doctor', icon: Search },
        { label: 'Find Hospital', path: '/patient/find-hospital', icon: Building },
        { label: 'Appointments', path: '/patient/appointments', icon: Calendar },
        { label: 'Consultations', path: '/patient/consultations', icon: Video },
        { label: 'Caregiver Oversight', path: '/patient/caregiver', icon: Users },
      ],
    },
    {
      group: 'HEALTH',
      items: [
        { label: 'My Health Profile', path: '/patient/profile', icon: User },
        { label: 'Prescriptions', path: '/patient/prescriptions', icon: FileText },
        { label: 'Medicines', path: '/patient/medicines', icon: Pill },
        { label: 'Medicine Knowledge Base', path: '/patient/medicine-knowledge', icon: BookOpen },
        { label: 'Medical Reports', path: '/patient/reports', icon: FileCheck2 },
        { label: 'AI Report Analyzer', path: '/patient/report-analyzer', icon: Sparkles },
        { label: 'Health Timeline', path: '/patient/timeline', icon: GitCommit },
        { label: 'Health Twin', path: '/patient/health-twin', icon: Activity },
        { label: 'Follow-ups', path: '/patient/follow-ups', icon: Clock },
      ],
    },
    {
      group: 'EMERGENCY',
      items: [
        { label: 'Emergency', path: '/patient/emergency', icon: Siren, isEmergency: true },
      ],
    },
    {
      group: 'ACCOUNT',
      items: [
        { label: 'Settings', path: '/patient/settings', icon: Settings },
      ],
    },
  ];

  // 2. Doctor Navigation (Grouped for clinical workflow)
  const doctorGroups = [
    {
      group: 'OVERVIEW',
      items: [
        { label: 'Dashboard', path: '/doctor/dashboard', icon: LayoutDashboard },
        { label: 'Appointments', path: '/doctor/appointments', icon: Calendar },
        { label: 'Patients', path: '/doctor/patients', icon: Users },
        { label: 'Consultations', path: '/doctor/consultations', icon: Video },
      ],
    },
    {
      group: 'CLINICAL CARE',
      items: [
        { label: 'Clinical Context', path: '/doctor/clinical-context', icon: BrainCircuit },
        { label: 'Prescriptions', path: '/doctor/prescriptions', icon: FileText },
        { label: 'Medicine Safety', path: '/doctor/medicine-safety', icon: Pill },
        { label: 'Health Trends', path: '/doctor/health-trends', icon: LineChart },
        { label: 'Early Warnings', path: '/doctor/early-warnings', icon: ShieldAlert },
        { label: 'Follow-ups', path: '/doctor/follow-ups', icon: Clock },
      ],
    },
    {
      group: 'SYSTEM',
      items: [
        { label: 'Settings', path: '/doctor/settings', icon: Settings },
      ],
    },
  ];

  // 3. Hospital Admin Navigation (Grouped for administration)
  const hospitalGroups = [
    {
      group: 'OPERATIONS',
      items: [
        { label: 'Dashboard', path: '/hospital/dashboard', icon: LayoutDashboard },
        { label: 'Hospital Profile', path: '/hospital/profile', icon: Hospital },
        { label: 'Departments', path: '/hospital/departments', icon: Building },
        { label: 'Doctors', path: '/hospital/doctors', icon: Stethoscope },
        { label: 'Patients', path: '/hospital/patients', icon: Users },
        { label: 'Appointments', path: '/hospital/appointments', icon: Calendar },
      ],
    },
    {
      group: 'TRIAGE & DATA',
      items: [
        { label: 'Emergency Cases', path: '/hospital/emergency-cases', icon: Siren, isEmergency: true },
        { label: 'Analytics', path: '/hospital/analytics', icon: PieChart },
      ],
    },
    {
      group: 'SYSTEM',
      items: [
        { label: 'Settings', path: '/hospital/settings', icon: Settings },
      ],
    },
  ];

  const currentGroups = isDoctor ? doctorGroups : isHospital ? hospitalGroups : patientGroups;

  const roleTitle = isDoctor
    ? 'DOCTOR WORKSPACE'
    : isHospital
    ? 'HOSPITAL ADMIN'
    : 'PATIENT PORTAL';

  const roleLabel = isDoctor
    ? 'Doctor'
    : isHospital
    ? 'Hospital Admin'
    : 'Patient';

  const handleLogout = () => {
    if (onClose) onClose();
    logout();
    navigate('/login', { replace: true });
  };

  const portalPrefix = isDoctor ? '/doctor' : isHospital ? '/hospital' : '/patient';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-2xs transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-2xs shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-slate-900 text-sm tracking-tight block truncate">
                MEDIVERSE AI
              </span>
              <span className="text-[10px] text-teal-700 font-semibold tracking-wider uppercase block truncate">
                {roleTitle}
              </span>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grouped Navigation Links Area */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
          {currentGroups.map((grp) => (
            <div key={grp.group} className="space-y-0.5">
              <div className="px-2.5 pt-1 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {grp.group}
              </div>
              {grp.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) => {
                      if (item.isEmergency) {
                        return `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                          isActive
                            ? 'bg-rose-600 text-white shadow-2xs'
                            : 'bg-rose-50/80 text-rose-700 hover:bg-rose-100 border border-rose-200/80'
                        }`;
                      }
                      return `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-teal-50 text-teal-800 font-semibold border border-teal-200'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`;
                    }}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}

          {/* Quick Logout button in navigation list as requested */}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
              <span>Logout</span>
            </button>
          </div>
        </nav>

        {/* User Profile Area (Clean footer: [ G ] Gokul Sankar • Patient • PID-2026-089 • ● Active) */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/80 shrink-0 relative">
          {/* Account Popover Menu */}
          {showAccountMenu && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden text-xs">
              <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-100">
                <p className="font-bold text-slate-900 truncate">{user?.name || 'Gokul Sankar'}</p>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-600 mt-0.5">
                  <span className="font-medium text-slate-700">{roleLabel}</span>
                  <span className="text-slate-400">•</span>
                  <span className="font-mono text-slate-600">{userPatientId}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>● Account Active</span>
                </div>
              </div>

              <div className="py-1 divide-y divide-slate-100">
                <div className="py-1">
                  <NavLink
                    to={`${portalPrefix}/profile`}
                    onClick={() => {
                      setShowAccountMenu(false);
                      if (onClose) onClose();
                    }}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>My Health Profile</span>
                  </NavLink>

                  <NavLink
                    to={`${portalPrefix}/security`}
                    onClick={() => {
                      setShowAccountMenu(false);
                      if (onClose) onClose();
                    }}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <KeyRound className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Security & Login</span>
                  </NavLink>

                  <NavLink
                    to={`${portalPrefix}/privacy`}
                    onClick={() => {
                      setShowAccountMenu(false);
                      if (onClose) onClose();
                    }}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Privacy & Access</span>
                  </NavLink>

                  <NavLink
                    to={`${portalPrefix}/activity`}
                    onClick={() => {
                      setShowAccountMenu(false);
                      if (onClose) onClose();
                    }}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <History className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Activity History</span>
                  </NavLink>
                </div>

                <div className="py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-rose-600 hover:bg-rose-50 cursor-pointer font-medium"
                  >
                    <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Profile Trigger Button (Clean: [ G ] Gokul Sankar, Patient • PID-2026-089, ● Active) */}
          <button
            onClick={() => setShowAccountMenu(!showAccountMenu)}
            className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 transition-colors text-left cursor-pointer group"
            aria-label="Toggle user account menu"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate group-hover:text-teal-700">
                  {user?.name || 'Gokul Sankar'}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {roleLabel} • {userPatientId}
                </p>
                <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>● Active</span>
                </div>
              </div>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 shrink-0 transition-transform duration-150 ${
                showAccountMenu ? 'rotate-180 text-teal-600' : ''
              }`}
            />
          </button>
        </div>
      </aside>
    </>
  );
}
