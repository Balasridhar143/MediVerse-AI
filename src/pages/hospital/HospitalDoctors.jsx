import React, { useState, useEffect } from 'react';
import { hospitalDataService } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import AdminPasswordModal from '../../components/AdminPasswordModal';
import {
  Stethoscope,
  Search,
  Loader2,
  Lock,
  ShieldCheck,
  X,
  FileCheck2,
  Phone,
  Mail,
  Award,
  Calendar,
  Plus,
  Edit,
  CheckCircle2,
  AlertCircle,
  Building2,
} from 'lucide-react';

export default function HospitalDoctors() {
  const [searchTerm, setSearchTerm] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Status Alerts
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Add Doctor Modal State
  const [isAddDoctorModalOpen, setIsAddDoctorModalOpen] = useState(false);
  const [addingDoctor, setAddingDoctor] = useState(false);
  const [doctorForm, setDoctorForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    specialization: 'General Medicine',
    department: '',
    licenseNumber: '',
    experienceYears: 5,
    isAvailable: true,
  });

  // Edit Doctor Modal State
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [updatingDoctor, setUpdatingDoctor] = useState(false);
  const [editForm, setEditForm] = useState({
    specialization: '',
    department: '',
    isAvailable: true,
  });

  // Sensitive Doctor Credentials State
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);
  const [sensitiveDoctor, setSensitiveDoctor] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [fetchingSensitive, setFetchingSensitive] = useState(false);
  const [sensitiveError, setSensitiveError] = useState(null);

  const fetchDoctorRoster = async () => {
    try {
      const data = await hospitalDataService.getDoctors();
      setDoctors(data || []);
    } catch (err) {
      console.error('Failed to fetch hospital doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentOptions = async () => {
    try {
      const depts = await hospitalDataService.getDepartments();
      if (Array.isArray(depts)) setDepartments(depts);
    } catch (err) {
      console.warn('Failed to load department options:', err);
    }
  };

  useEffect(() => {
    fetchDoctorRoster();
    fetchDepartmentOptions();
  }, []);

  const openAddDoctorModal = () => {
    setActionError(null);
    setActionSuccess(null);
    const initialDept = departments[0];
    setDoctorForm({
      fullName: '',
      email: '',
      phone: '',
      password: '',
      specialization: 'General Medicine',
      department: initialDept?.name || 'General Medicine',
      departmentId: initialDept?.id || null,
      licenseNumber: '',
      experienceYears: 5,
      isAvailable: true,
    });
    setIsAddDoctorModalOpen(true);
  };

  const handleRegisterDoctor = async (e) => {
    e.preventDefault();
    if (!doctorForm.fullName.trim() || !doctorForm.email.trim()) {
      setActionError('Doctor full name and email are required.');
      return;
    }
    setAddingDoctor(true);
    setActionError(null);
    try {
      const res = await hospitalDataService.createDoctor({
        fullName: doctorForm.fullName.trim(),
        email: doctorForm.email.trim(),
        phone: doctorForm.phone.trim(),
        password: doctorForm.password || 'Doctor@123',
        specialization: doctorForm.specialization,
        department: doctorForm.department || doctorForm.specialization,
        departmentId: doctorForm.departmentId,
        licenseNumber: doctorForm.licenseNumber.trim(),
        experienceYears: parseInt(doctorForm.experienceYears, 10) || 5,
        isAvailable: doctorForm.isAvailable,
      });
      setActionSuccess(res.message || `Doctor ${doctorForm.fullName} registered successfully.`);
      setIsAddDoctorModalOpen(false);
      await fetchDoctorRoster();
      await fetchDepartmentOptions();
    } catch (err) {
      console.error('Doctor registration error:', err);
      setActionError(err.response?.data?.detail || 'Failed to register doctor.');
    } finally {
      setAddingDoctor(false);
    }
  };

  const openEditDoctorModal = (doc) => {
    setActionError(null);
    setActionSuccess(null);
    setEditingDoctor(doc);
    const matchedDept = departments.find(
      (d) => (doc.departmentId && d.id === doc.departmentId) || (d.name && d.name.toLowerCase() === (doc.department || '').toLowerCase())
    );
    setEditForm({
      specialization: doc.specialization || 'General Medicine',
      department: matchedDept ? matchedDept.name : (doc.department || departments[0]?.name || 'General Medicine'),
      departmentId: matchedDept ? matchedDept.id : (doc.departmentId || departments[0]?.id || null),
      isAvailable: doc.status === 'On Duty' || doc.is_available === true,
    });
  };

  const handleUpdateDoctor = async (e) => {
    e.preventDefault();
    setUpdatingDoctor(true);
    setActionError(null);
    try {
      await hospitalDataService.updateDoctor(editingDoctor.id, {
        specialization: editForm.specialization,
        department: editForm.department,
        departmentId: editForm.departmentId,
        isAvailable: editForm.isAvailable,
      });
      setActionSuccess(`Doctor ${editingDoctor.name} updated successfully.`);
      setEditingDoctor(null);
      await fetchDoctorRoster();
      await fetchDepartmentOptions();
    } catch (err) {
      console.error('Doctor update error:', err);
      setActionError(err.response?.data?.detail || 'Failed to update doctor details.');
    } finally {
      setUpdatingDoctor(false);
    }
  };

  const handleRequestSensitive = async (doctorId) => {
    setSelectedDoctorId(doctorId);
    const savedToken = sessionStorage.getItem('mediverse_admin_reauth_token');
    if (savedToken) {
      await fetchSensitiveData(doctorId, savedToken);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const fetchSensitiveData = async (doctorId, token) => {
    setFetchingSensitive(true);
    setSensitiveError(null);
    try {
      const res = await hospitalDataService.getDoctorSensitive(doctorId, { reauthToken: token });
      if (res && res.doctor) {
        setSensitiveDoctor(res.doctor);
      } else {
        setSensitiveError('No physician credentials returned.');
      }
    } catch (err) {
      console.warn('Doctor sensitive fetch error:', err);
      if (err.response?.status === 403 || err.response?.status === 401) {
        sessionStorage.removeItem('mediverse_admin_reauth_token');
        setIsAuthModalOpen(true);
      } else {
        setSensitiveError(err.response?.data?.detail || 'Failed to retrieve physician credentials.');
      }
    } finally {
      setFetchingSensitive(false);
    }
  };

  const handleAuthSuccess = async (token) => {
    setIsAuthModalOpen(false);
    if (selectedDoctorId) {
      await fetchSensitiveData(selectedDoctorId, token);
    }
  };

  const filteredDoctors = doctors.filter(
    (d) =>
      (d.name && d.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.specialization && d.specialization.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.department && d.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        badge="Medical Staff Directory"
        badgeStatus={`${doctors.length} Registered Clinicians`}
        title="Physician & Specialist Registry"
        subtitle="Manage hospital medical staff, department assignments, and clinical availability"
        action={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="w-full sm:w-64 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search clinician or department..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white focus:border-teal-500"
              />
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={openAddDoctorModal}
              className="whitespace-nowrap"
            >
              Add Doctor
            </Button>
          </div>
        }
      />

      {/* Action Alerts */}
      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-600 hover:text-rose-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Doctors Table */}
      <Card title="Hospital Physician Roster" icon={Stethoscope}>
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-600 mb-2" />
            Loading registered physicians...
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            <Stethoscope className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No doctors found matching your query.</p>
            <Button variant="primary" size="sm" icon={Plus} onClick={openAddDoctorModal} className="mt-3">
              Add First Doctor
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 md:-mx-5">
            <div className="inline-block min-w-full align-middle px-4 md:px-5">
              <table className="min-w-full text-left text-xs text-slate-700 divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-3">Physician Name</th>
                    <th className="py-3 px-3">Specialization</th>
                    <th className="py-3 px-3">Department</th>
                    <th className="py-3 px-3">Shift Availability</th>
                    <th className="py-3 px-3">Duty Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredDoctors.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                        {doc.name}
                      </td>
                      <td className="py-3 px-3 text-teal-700 font-medium whitespace-nowrap">
                        {doc.specialization}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-800">
                        {doc.department || 'General Medicine'}
                      </td>
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{doc.availability || 'Full-Time OPD'}</td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <StatusBadge status={doc.status} size="xs" />
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-right space-x-1.5">
                        <button
                          type="button"
                          onClick={() => openEditDoctorModal(doc)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-medium text-[11px] transition-colors cursor-pointer"
                          title="Edit Department or Availability"
                        >
                          <Edit className="w-3 h-3 text-slate-500" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRequestSensitive(doc.id)}
                          disabled={fetchingSensitive && selectedDoctorId === doc.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 hover:border-teal-300 rounded-lg font-medium text-[11px] transition-colors cursor-pointer"
                        >
                          {fetchingSensitive && selectedDoctorId === doc.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-teal-600" />
                          )}
                          <span>Credentials</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

      {/* REGISTER NEW DOCTOR MODAL */}
      {isAddDoctorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-teal-800">
                <Stethoscope className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-base">Register Doctor Under Hospital</h3>
              </div>
              <button
                onClick={() => setIsAddDoctorModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterDoctor} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Doctor Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={doctorForm.fullName}
                  onChange={(e) => setDoctorForm({ ...doctorForm, fullName: e.target.value })}
                  placeholder="e.g. Dr. Rajesh Sharma"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={doctorForm.email}
                    onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                    placeholder="doctor@hospital.org"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={doctorForm.phone}
                    onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Medical Specialization
                  </label>
                  <input
                    type="text"
                    value={doctorForm.specialization}
                    onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                    placeholder="e.g. Cardiologist, Neurologist"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assigned Department
                  </label>
                  <select
                    value={doctorForm.departmentId || doctorForm.department}
                    onChange={(e) => {
                      const sel = departments.find((d) => d.id === e.target.value || d.name === e.target.value);
                      setDoctorForm({
                        ...doctorForm,
                        department: sel ? sel.name : e.target.value,
                        departmentId: sel ? sel.id : null,
                      });
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-teal-500 focus:outline-none"
                  >
                    {departments.length === 0 ? (
                      <option value="General Medicine">General Medicine</option>
                    ) : (
                      departments.map((dept) => (
                        <option key={dept.id || dept.name} value={dept.id || dept.name}>
                          {dept.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Medical License / NMC Reg
                  </label>
                  <input
                    type="text"
                    value={doctorForm.licenseNumber}
                    onChange={(e) => setDoctorForm({ ...doctorForm, licenseNumber: e.target.value })}
                    placeholder="e.g. MCI-2024-5821"
                    className="w-full px-3 py-2 text-sm uppercase font-mono border border-slate-300 rounded-lg focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={doctorForm.experienceYears}
                    onChange={(e) => setDoctorForm({ ...doctorForm, experienceYears: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Temporary Password
                </label>
                <input
                  type="password"
                  value={doctorForm.password}
                  onChange={(e) => setDoctorForm({ ...doctorForm, password: e.target.value })}
                  placeholder="Defaults to Doctor@123 if blank"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="docAvailableCheckbox"
                  checked={doctorForm.isAvailable}
                  onChange={(e) => setDoctorForm({ ...doctorForm, isAvailable: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="docAvailableCheckbox" className="text-xs font-semibold text-slate-700">
                  Doctor is currently On Duty / Available for consultations
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddDoctorModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={addingDoctor}
                  icon={addingDoctor ? Loader2 : Plus}
                >
                  {addingDoctor ? 'Registering...' : 'Register Doctor'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DOCTOR / DEPARTMENT / AVAILABILITY MODAL */}
      {editingDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-teal-800">
                <Edit className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-base">Edit: {editingDoctor.name}</h3>
              </div>
              <button
                onClick={() => setEditingDoctor(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateDoctor} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department Assignment
                </label>
                <select
                  value={editForm.departmentId || editForm.department}
                  onChange={(e) => {
                    const sel = departments.find((d) => d.id === e.target.value || d.name === e.target.value);
                    setEditForm({
                      ...editForm,
                      department: sel ? sel.name : e.target.value,
                      departmentId: sel ? sel.id : null,
                    });
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-teal-500 focus:outline-none"
                >
                  {departments.length === 0 ? (
                    <option value="General Medicine">General Medicine</option>
                  ) : (
                    departments.map((dept) => (
                      <option key={dept.id || dept.name} value={dept.id || dept.name}>
                        {dept.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Specialization
                </label>
                <input
                  type="text"
                  value={editForm.specialization}
                  onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="editDocAvailableCheckbox"
                  checked={editForm.isAvailable}
                  onChange={(e) => setEditForm({ ...editForm, isAvailable: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="editDocAvailableCheckbox" className="text-xs font-semibold text-slate-700">
                  Duty Status: {editForm.isAvailable ? 'On Duty' : 'Off Duty'}
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingDoctor(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={updatingDoctor}
                  icon={updatingDoctor ? Loader2 : CheckCircle2}
                >
                  {updatingDoctor ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Security Password Re-authentication Modal */}
      <AdminPasswordModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        title="Admin Authorization Required"
        purpose="Reviewing verified physician licensure, NMC registration, and private credentials"
      />

      {/* Sensitive Physician Dossier Modal */}
      {sensitiveDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-600 text-white shadow-xs">
                  <FileCheck2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{sensitiveDoctor.name}</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">
                      NMC Verified
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {sensitiveDoctor.specialization} • Department of {sensitiveDoctor.department}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSensitiveDoctor(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dossier Body */}
            <div className="p-6 space-y-4 overflow-y-auto text-xs">
              {/* Licensure Information */}
              <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-100 space-y-2">
                <div className="flex items-center gap-1.5 text-teal-900 font-bold uppercase tracking-wider text-[10px]">
                  <ShieldCheck className="w-4 h-4 text-teal-700" />
                  National Medical Commission Verification
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-slate-500 block text-[11px]">NMC Registration No:</span>
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {sensitiveDoctor.licenseNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Medical Board Council:</span>
                    <span className="font-semibold text-slate-900 text-xs">
                      {sensitiveDoctor.medicalCouncil}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Registration Year:</span>
                    <span className="font-semibold text-slate-900 text-xs">
                      {sensitiveDoctor.yearOfRegistration}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Clinical Experience:</span>
                    <span className="font-semibold text-slate-900 text-xs">
                      {sensitiveDoctor.experienceYears} Years Verified
                    </span>
                  </div>
                </div>
              </div>

              {/* Direct Confidential Contact Information */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                  Confidential Clinician Contact
                </h4>
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-teal-600" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">Direct Phone</span>
                      <span className="font-semibold text-slate-900">{sensitiveDoctor.contactPhone}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-teal-600" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">Official Email</span>
                      <span className="font-semibold text-slate-900 truncate max-w-[170px] block">
                        {sensitiveDoctor.contactEmail}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Qualifications */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-teal-600" /> Verified Credentials & Degrees
                </h4>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700">
                  <p className="font-medium">{sensitiveDoctor.qualifications}</p>
                </div>
              </div>

              {/* Administrative Compliance Notice */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p>
                  This clinician credential record was logged under NABH / ISO-27001 healthcare compliance standards.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Authenticated Access</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSensitiveDoctor(null)}
              >
                Close Dossier
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
