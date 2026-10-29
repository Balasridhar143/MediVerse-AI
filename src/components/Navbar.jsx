import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificationService, searchService } from '../services/api';
import {
  Menu,
  Bell,
  User,
  ChevronDown,
  Siren,
  LogOut,
  KeyRound,
  Lock,
  History,
  Search,
  X,
  Loader2,
  Pill,
  Building2,
  Stethoscope,
  BookOpen,
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Navbar({ onToggleSidebar }) {
  const { user, role, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Global Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchPopover, setShowSearchPopover] = useState(false);
  const searchContainerRef = useRef(null);

  // Close menus on path change
  useEffect(() => {
    setShowUserMenu(false);
    setShowNotifs(false);
    setShowSearchPopover(false);
  }, [location.pathname]);

  // Handle outside click for search popover
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSearchPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced global search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const data = await searchService.globalSearch(searchQuery.trim());
        setSearchResults(data);
        setShowSearchPopover(true);
      } catch (err) {
        console.warn('Global search query failed:', err.message);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Human-readable breadcrumbs/title derived cleanly from pathname
  const formatBreadcrumb = () => {
    const path = location.pathname;
    if (path.includes('/patient/dashboard')) return 'Mediverse AI / Dashboard';
    if (path.includes('/patient/profile')) return 'Mediverse AI / Health / My Health Profile';
    if (path.includes('/patient/find-doctor')) return 'Mediverse AI / Care / Find Doctor';
    if (path.includes('/patient/find-hospital')) return 'Mediverse AI / Care / Find Hospital';
    if (path.includes('/patient/appointments')) return 'Mediverse AI / Care / Appointments';
    if (path.includes('/patient/consultation')) return 'Mediverse AI / Care / Consultations';
    if (path.includes('/patient/prescriptions')) return 'Mediverse AI / Health / Prescriptions';
    if (path.includes('/patient/medicines')) return 'Mediverse AI / Health / Medicines';
    if (path.includes('/patient/reports')) return 'Mediverse AI / Health / Medical Reports';
    if (path.includes('/patient/timeline')) return 'Mediverse AI / Health / Health Timeline';
    if (path.includes('/patient/health-twin')) return 'Mediverse AI / Health / Health Twin';
    if (path.includes('/patient/follow-ups')) return 'Mediverse AI / Health / Follow-ups';
    if (path.includes('/patient/caregiver')) return 'Mediverse AI / Care / Caregiver Oversight';
    if (path.includes('/patient/emergency')) return 'Mediverse AI / Emergency';
    if (path.includes('/patient/settings')) return 'Mediverse AI / Settings';
    if (path.includes('/patient/security')) return 'Mediverse AI / Account / Security & Login';
    if (path.includes('/patient/privacy')) return 'Mediverse AI / Account / Privacy & Access';
    if (path.includes('/patient/activity')) return 'Mediverse AI / Account / Activity History';

    if (path.includes('/doctor/dashboard')) return 'Mediverse AI / Doctor / Dashboard';
    if (path.includes('/doctor/clinical-context')) return 'Mediverse AI / Doctor / Clinical Context';
    if (path.includes('/doctor/prescriptions') || path.includes('/doctor/prescription')) return 'Mediverse AI / Doctor / Prescriptions';
    if (path.includes('/doctor/early-warnings')) return 'Mediverse AI / Doctor / Early Warnings';
    if (path.includes('/doctor/health-trends')) return 'Mediverse AI / Doctor / Health Trends';
    if (path.includes('/doctor/patients')) return 'Mediverse AI / Doctor / Patients';

    if (path.includes('/hospital/dashboard')) return 'Mediverse AI / Hospital / Dashboard';
    if (path.includes('/hospital/departments')) return 'Mediverse AI / Hospital / Departments';
    if (path.includes('/hospital/doctors')) return 'Mediverse AI / Hospital / Doctors';
    if (path.includes('/hospital/emergency')) return 'Mediverse AI / Hospital / Emergency Cases';

    return 'Mediverse AI';
  };

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchLiveNotifications = async () => {
    try {
      const res = await notificationService.getNotifications();
      if (res) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unread_count || 0);
      }
    } catch (err) {
      // Non-intrusive logging
      console.warn('Unable to sync live notifications:', err.message);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLiveNotifications();
      const interval = setInterval(fetchLiveNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleMarkAsRead = async (notif) => {
    if (!notif.is_read) {
      try {
        await notificationService.markAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (e) {}
    }
    if (notif.link_url) {
      setShowNotifs(false);
      navigate(notif.link_url);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {}
  };

  const roleLabel =
    role === 'doctor'
      ? 'Doctor'
      : role === 'hospital_admin' || role === 'hospital'
      ? 'Hospital Admin'
      : 'Patient';

  const userIdentifier =
    user?.patientId ||
    user?.facilityId ||
    user?.id ||
    (role === 'doctor' ? 'D001' : role === 'hospital_admin' || role === 'hospital' ? 'H001' : 'PID-2026-089');

  const portalPrefix = role === 'doctor' ? '/doctor' : role === 'hospital_admin' || role === 'hospital' ? '/hospital' : '/patient';

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between shadow-2xs">
      {/* Left: Mobile hamburger & clean breadcrumb */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer focus:outline-hidden"
          aria-label="Open sidebar navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-700">
          <span className="font-semibold text-slate-900 tracking-tight hidden md:inline">
            {formatBreadcrumb()}
          </span>
          <span className="font-semibold text-slate-900 tracking-tight md:hidden">
            Mediverse AI
          </span>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div ref={searchContainerRef} className="relative flex-1 max-w-md mx-3 sm:mx-6">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchResults && searchQuery.trim().length >= 2) {
                setShowSearchPopover(true);
              }
            }}
            placeholder="Search medicines, hospitals, doctors..."
            className="w-full pl-9 pr-9 py-1.5 text-xs bg-slate-100 hover:bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400 rounded-xl border border-transparent focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-hidden transition-all shadow-inner"
          />
          {isSearching && (
            <Loader2 className="w-3.5 h-3.5 text-teal-600 animate-spin absolute right-3 pointer-events-none" />
          )}
          {!isSearching && searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResults(null);
                setShowSearchPopover(false);
              }}
              className="absolute right-2.5 p-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Floating Results Popover */}
        {showSearchPopover && searchResults && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden max-h-[460px] flex flex-col text-xs animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-600">
              <span>Results for "{searchResults.query}"</span>
              <span className="text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {searchResults.total_matches} found
              </span>
            </div>

            <div className="overflow-y-auto divide-y divide-slate-100 p-1">
              {/* Medicines Group */}
              {searchResults.results?.medicines?.length > 0 && (
                <div className="p-1.5">
                  <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-teal-800">
                    <Pill className="w-3 h-3 text-teal-600" />
                    <span>Medicines</span>
                  </div>
                  {searchResults.results.medicines.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setShowSearchPopover(false);
                        setSearchQuery('');
                        navigate(m.url);
                      }}
                      className="w-full text-left p-2 rounded-xl hover:bg-teal-50/60 transition-colors flex items-center justify-between group cursor-pointer"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors text-xs truncate">
                          {m.title}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">{m.subtitle}</p>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                          {m.badge}
                        </span>
                        {m.price && (
                          <p className="text-[11px] font-bold text-teal-700 mt-0.5">{m.price}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Hospitals Group */}
              {searchResults.results?.hospitals?.length > 0 && (
                <div className="p-1.5">
                  <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-cyan-800">
                    <Building2 className="w-3 h-3 text-cyan-600" />
                    <span>Hospitals</span>
                  </div>
                  {searchResults.results.hospitals.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => {
                        setShowSearchPopover(false);
                        setSearchQuery('');
                        navigate(h.url);
                      }}
                      className="w-full text-left p-2 rounded-xl hover:bg-cyan-50/60 transition-colors flex items-center justify-between group cursor-pointer"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-slate-900 group-hover:text-cyan-700 transition-colors text-xs truncate">
                          {h.title}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">{h.subtitle}</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 font-semibold shrink-0 ml-2">
                        {h.badge}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Doctors Group */}
              {searchResults.results?.doctors?.length > 0 && (
                <div className="p-1.5">
                  <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                    <Stethoscope className="w-3 h-3 text-emerald-600" />
                    <span>Doctors & Specialists</span>
                  </div>
                  {searchResults.results.doctors.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => {
                        setShowSearchPopover(false);
                        setSearchQuery('');
                        navigate(d.url);
                      }}
                      className="w-full text-left p-2 rounded-xl hover:bg-emerald-50/60 transition-colors flex items-center justify-between group cursor-pointer"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors text-xs truncate">
                          {d.title}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">{d.subtitle}</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold shrink-0 ml-2">
                        {d.badge}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Articles Group */}
              {searchResults.results?.articles?.length > 0 && (
                <div className="p-1.5">
                  <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-indigo-800">
                    <BookOpen className="w-3 h-3 text-indigo-600" />
                    <span>Medical Information & Articles</span>
                  </div>
                  {searchResults.results.articles.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => {
                        setShowSearchPopover(false);
                        setSearchQuery('');
                        navigate(a.url);
                      }}
                      className="w-full text-left p-2 rounded-xl hover:bg-indigo-50/60 transition-colors flex items-center justify-between group cursor-pointer"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors text-xs truncate">
                          {a.title}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">{a.subtitle}</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-semibold shrink-0 ml-2">
                        {a.badge}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {searchResults.total_matches === 0 && (
                <div className="p-6 text-center text-slate-400">
                  <p className="font-medium text-slate-600">No matching healthcare records found.</p>
                  <p className="text-[11px] text-slate-400 mt-1">Try searching by generic name, brand name, specialty, or hospital.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right: Emergency Shortcut + Notifications + Patient Account Menu (No repetition) */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Patient Emergency Button Shortcut */}
        {role === 'patient' && (
          <Link
            to="/patient/emergency"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors"
          >
            <Siren className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">Emergency</span>
          </Link>
        )}

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifs(!showNotifs);
              setShowUserMenu(false);
              if (!showNotifs) fetchLiveNotifications();
            }}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer relative"
            title="View notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-teal-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-72 sm:w-84 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden text-xs">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-900">Notifications</span>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] text-teal-700 hover:underline cursor-pointer font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                  <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-semibold">
                    {unreadCount} Unread
                  </span>
                </div>
              </div>
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No notifications yet. Clinical updates and appointment confirmations will appear here.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleMarkAsRead(notif)}
                      className={`p-3 space-y-0.5 hover:bg-slate-50 transition-colors cursor-pointer ${
                        !notif.is_read ? 'bg-teal-50/40' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className={`font-semibold ${!notif.is_read ? 'text-teal-950 font-bold' : 'text-slate-800'}`}>
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">{notif.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Compact Account Menu (Gokul Sankar, Patient, PID-2026-089, ● Active) */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifs(false);
            }}
            className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
            aria-label="User account menu"
          >
            <div className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
            </div>
            <span className="text-xs font-semibold text-slate-800 hidden sm:block max-w-[120px] truncate">
              {user?.name || 'Gokul Sankar'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200 rounded-xl shadow-lg z-50 text-xs overflow-hidden">
              {/* Account Credentials Header */}
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                <p className="font-bold text-slate-900 text-sm truncate">{user?.name || 'Gokul Sankar'}</p>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-600 mt-0.5">
                  <span className="font-medium text-slate-700">{roleLabel}</span>
                  <span className="text-slate-400">•</span>
                  <span className="font-mono text-slate-600">{userIdentifier}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-semibold text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>● Account Active</span>
                </div>
              </div>

              {/* Concise Account Menu Links */}
              <div className="py-1 divide-y divide-slate-100">
                <div className="py-1">
                  <Link
                    to={`${portalPrefix}/profile`}
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>My Health Profile</span>
                  </Link>

                  <Link
                    to={`${portalPrefix}/security`}
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <KeyRound className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Security & Login</span>
                  </Link>

                  <Link
                    to={`${portalPrefix}/privacy`}
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Privacy & Access</span>
                  </Link>

                  <Link
                    to={`${portalPrefix}/activity`}
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <History className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Activity History</span>
                  </Link>
                </div>

                {/* Sign Out */}
                <div className="py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer font-medium"
                  >
                    <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
