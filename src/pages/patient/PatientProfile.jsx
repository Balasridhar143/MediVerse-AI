import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import api from '../../services/api';
import { prescriptionService } from '../../services/prescriptionService';
import {
  User,
  Heart,
  Phone,
  Mail,
  AlertTriangle,
  Edit2,
  X,
  Save,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building,
  Activity,
  Lock,
  Plus,
  ShieldAlert,
  Loader2,
} from 'lucide-react';

export default function PatientProfile() {
  const { user } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  // Core patient profile fields
  const [profile, setProfile] = useState({
    name: user?.name || user?.full_name || 'Patient',
    patientId: user?.patientId || user?.id || 'PID-2026-089',
    bloodGroup: user?.bloodGroup || 'B+',
    age: user?.age || 28,
    phone: user?.phone || '+91 98765 43210',
    email: user?.email || 'patient@example.com',
    allergies: '',
    allergyStatus: 'UNDOCUMENTED',
    medicalHistory: 'Available in longitudinal record',
    chronicConditions: 'None Reported',
    emergencyContact: 'Emergency Caretaker',
    relationship: 'Family Member',
    emergencyPhone: '+91 98765 43210',
  });

  const [allergyList, setAllergyList] = useState([]);
  const [loadingAllergies, setLoadingAllergies] = useState(true);

  // Load real allergy information from backend
  const loadPatientAllergies = async () => {
    if (!user?.id) return;
    setLoadingAllergies(true);
    try {
      const data = await prescriptionService.getPatientAllergies(user.id);
      setAllergyList(data.allergies || []);
      setProfile((prev) => ({
        ...prev,
        allergyStatus: data.allergyStatus || 'UNDOCUMENTED',
        allergies: data.allergies?.map((a) => a.allergen).join(', ') || (data.allergyStatus === 'CONFIRMED_NKDA' ? 'No Known Allergies (NKDA Confirmed)' : ''),
      }));
    } catch (err) {
      console.warn('Could not load patient allergies:', err);
    } finally {
      setLoadingAllergies(false);
    }
  };

  useEffect(() => {
    loadPatientAllergies();
  }, [user?.id]);

  const [editForm, setEditForm] = useState({ ...profile });

  const handleStartEdit = () => {
    setEditForm({ ...profile });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Persist profile to backend database
      await api.put('/patients/me/profile', {
        name: editForm.name,
        age: editForm.age,
        phone: editForm.phone,
        bloodGroup: editForm.bloodGroup,
        chronicConditions: editForm.chronicConditions,
        allergies: editForm.allergies,
      });

      setProfile({ ...editForm });
      setIsEditing(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
      loadPatientAllergies();
    } catch (err) {
      console.error('Failed to save profile:', err);
      alert('Failed to save profile updates to database.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmNKDA = async () => {
    if (!user?.id) return;
    try {
      await prescriptionService.confirmPatientNKDA(user.id);
      await loadPatientAllergies();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to confirm NKDA status.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* 1. Header: Patient Identity + Edit Toggle */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-2xl shadow-xs shrink-0">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  {profile.name}
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  ● Verified Patient
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                <span className="font-mono text-slate-700 font-medium">
                  Patient ID: {profile.patientId}
                </span>
                <span className="text-slate-300">•</span>
                <span className="font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  Blood Group: {profile.bloodGroup}
                </span>
              </div>
            </div>
          </div>

          <div>
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                icon={Edit2}
                onClick={handleStartEdit}
              >
                Edit Profile
              </Button>
            ) : (
              <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 font-medium">
                Editing Profile
              </span>
            )}
          </div>
        </div>

        {/* Feedback notification */}
        {savedSuccess && (
          <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">Profile Updated Successfully</span>
          </div>
        )}
      </div>

      {/* 2. Main Content Layout (Desktop: 2 columns; Mobile: vertical stack) */}
      {isEditing ? (
        /* Edit Form Mode */
        <Card
          title="Edit Health Profile"
          subtitle="Update your personal details, clinical notes, and emergency contact"
          icon={Edit2}
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Age</label>
                <input
                  type="number"
                  value={editForm.age}
                  onChange={(e) => setEditForm({ ...editForm, age: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Phone</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Blood Group</label>
                <input
                  type="text"
                  value={editForm.bloodGroup}
                  onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Known Allergies</label>
                <input
                  type="text"
                  value={editForm.allergies}
                  onChange={(e) => setEditForm({ ...editForm, allergies: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:border-teal-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-medium mb-1">Chronic Conditions</label>
                <input
                  type="text"
                  value={editForm.chronicConditions}
                  onChange={(e) => setEditForm({ ...editForm, chronicConditions: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:border-teal-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-medium mb-1">Medical History</label>
                <textarea
                  rows={2}
                  value={editForm.medicalHistory}
                  onChange={(e) => setEditForm({ ...editForm, medicalHistory: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:border-teal-500"
                />
              </div>

              {/* Emergency Contact */}
              <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                <h4 className="font-semibold text-slate-800 text-xs mb-2">Emergency Proxy</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Contact Name</label>
                    <input
                      type="text"
                      value={editForm.emergencyContact}
                      onChange={(e) => setEditForm({ ...editForm, emergencyContact: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Relationship</label>
                    <input
                      type="text"
                      value={editForm.relationship}
                      onChange={(e) => setEditForm({ ...editForm, relationship: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Emergency Phone</label>
                    <input
                      type="text"
                      value={editForm.emergencyPhone}
                      onChange={(e) => setEditForm({ ...editForm, emergencyPhone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end items-center gap-2">
              <Button type="button" variant="outline" size="sm" icon={X} onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" icon={Save}>
                Save Changes
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        /* Read-only Profile Sections (Clean 2-column layout) */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Patient Identity & Account Card */}
          <div className="lg:col-span-1 space-y-5">
            <Card title="Patient Identity" icon={User}>
              <div className="text-center py-2 border-b border-slate-100">
                <div className="w-16 h-16 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-2xl mx-auto shadow-2xs mb-2">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{profile.name}</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{profile.patientId}</p>
                <div className="inline-flex items-center gap-1 mt-2 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  ● Account Active
                </div>
              </div>

              <div className="pt-3 space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Blood Group</span>
                  <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {profile.bloodGroup}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Account Type</span>
                  <span className="font-medium text-slate-800">Verified Patient</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Registered</span>
                  <span className="text-slate-700">Jan 2026</span>
                </div>
              </div>
            </Card>

            {/* Quick Helper Notice */}
            <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Verified Patient Record</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500">
                This profile is linked to your digital electronic health records across attending hospital facilities.
              </p>
            </div>
          </div>

          {/* Right Column: Personal, Medical, and Emergency Info */}
          <div className="lg:col-span-2 space-y-5">
            {/* 1. PERSONAL INFORMATION */}
            <Card title="Personal Information" icon={User}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                    Full Name
                  </span>
                  <strong className="text-slate-900 text-xs mt-0.5 block">{profile.name}</strong>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                    Age
                  </span>
                  <span className="text-slate-800 font-semibold text-xs mt-0.5 block">{profile.age} years</span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                    Phone
                  </span>
                  <span className="text-slate-800 font-medium text-xs mt-0.5 block">{profile.phone}</span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                    Email
                  </span>
                  <span className="text-slate-800 font-medium text-xs mt-0.5 block">{profile.email}</span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60 sm:col-span-2">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                    Blood Group
                  </span>
                  <span className="font-bold text-teal-800 text-xs mt-0.5 block">{profile.bloodGroup}</span>
                </div>
              </div>
            </Card>

            {/* 2. MEDICAL INFORMATION */}
            <Card title="Medical Information & Allergies" icon={Heart}>
              <div className="space-y-3 text-xs">
                <div className="py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 block mb-1">Documented Allergies</span>
                  {loadingAllergies ? (
                    <div className="flex items-center gap-2 text-slate-500 py-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                      <span>Loading allergy records...</span>
                    </div>
                  ) : profile.allergyStatus === 'DOCUMENTED' || allergyList.length > 0 ? (
                    /* STATE A — Allergies documented */
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap gap-1.5">
                        {allergyList.length > 0 ? (
                          allergyList.map((alg, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-50 border border-rose-200 text-rose-950 shadow-2xs"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              <span>{alg.allergen}</span>
                              <span className="text-[10px] text-rose-700 font-semibold bg-white px-1 py-0.2 rounded border border-rose-200">
                                {alg.severity || 'Moderate'}
                              </span>
                              {alg.reaction && (
                                <span className="text-[10px] text-slate-500 font-normal italic">
                                  ({alg.reaction})
                                </span>
                              )}
                            </span>
                          ))
                        ) : (
                          <span className="font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                            {profile.allergies}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : profile.allergyStatus === 'CONFIRMED_NKDA' ? (
                    /* STATE B — No known allergies confirmed */
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold block text-xs">● Confirmed No Known Allergies (NKDA)</span>
                        <span className="text-[11px] text-emerald-700">
                          Confirmed: No documented drug, food, or environmental allergies.
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* STATE C — Allergy information unavailable or undocumented */
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-950 space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block text-xs">
                            ⚠️ Allergy information not documented — confirmation required.
                          </span>
                          <span className="text-[11px] text-amber-800 block">
                            You have not documented your allergy history. Please confirm if you have any allergies to help your doctors prescribe safely.
                          </span>
                        </div>
                      </div>
                      <div className="pt-1 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleConfirmNKDA}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>I Have No Known Allergies (Confirm NKDA)</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-start py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 w-36 shrink-0">Chronic Conditions</span>
                  <span className="font-medium text-slate-800 text-right">{profile.chronicConditions}</span>
                </div>

                <div className="py-1.5">
                  <span className="text-slate-500 block mb-1">Medical History</span>
                  <span className="text-slate-700 leading-relaxed block p-2 bg-slate-50 rounded-lg border border-slate-200/60">
                    {profile.medicalHistory}
                  </span>
                </div>
              </div>
            </Card>

            {/* 3. EMERGENCY INFORMATION */}
            <Card title="Emergency Information" icon={AlertTriangle}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                    Emergency Contact
                  </span>
                  <strong className="text-slate-900 text-xs mt-0.5 block">{profile.emergencyContact}</strong>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                    Relationship
                  </span>
                  <span className="text-slate-800 font-medium text-xs mt-0.5 block">{profile.relationship}</span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                    Emergency Phone
                  </span>
                  <span className="font-bold text-rose-700 text-xs mt-0.5 block">{profile.emergencyPhone}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
