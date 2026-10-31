import React, { useState, useEffect } from 'react';
import { hospitalDataService } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import {
  Building2,
  Plus,
  Users,
  Calendar,
  Loader2,
  Bed,
  Stethoscope,
  Edit2,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  X,
  UserCheck
} from 'lucide-react';

export default function HospitalDepartments() {
  const [departments, setDepartments] = useState([]);
  const [hospitalDoctors, setHospitalDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [viewingDeptDoctors, setViewingDeptDoctors] = useState(null);
  const [deptDoctorsList, setDeptDoctorsList] = useState([]);
  const [loadingDeptDoctors, setLoadingDeptDoctors] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Add / Edit Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    bedCount: 25,
    headDoctorName: '',
    status: 'ACTIVE'
  });

  // Assign Doctor state
  const [selectedDoctorToAssign, setSelectedDoctorToAssign] = useState('');
  const [assigningDoctor, setAssigningDoctor] = useState(false);

  const fetchDepartments = async () => {
    try {
      const data = await hospitalDataService.getDepartments();
      if (Array.isArray(data)) setDepartments(data);
    } catch (err) {
      console.error('Failed to load departments:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHospitalDoctors = async () => {
    try {
      const docs = await hospitalDataService.getDoctors();
      if (Array.isArray(docs)) setHospitalDoctors(docs);
    } catch (err) {
      console.warn('Failed to load hospital doctors:', err);
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchHospitalDoctors();
  }, []);

  const openAddModal = () => {
    setActionError(null);
    setActionSuccess(null);
    setFormData({
      name: '',
      code: '',
      bedCount: 30,
      headDoctorName: '',
      status: 'ACTIVE'
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (dept) => {
    setActionError(null);
    setActionSuccess(null);
    setEditingDept(dept);
    setFormData({
      name: dept.name || '',
      code: dept.code || '',
      bedCount: dept.bedCount || 25,
      headDoctorName: dept.headDoctor && dept.headDoctor !== 'Attending Head' ? dept.headDoctor : '',
      status: dept.status || 'ACTIVE'
    });
  };

  const openDeptDoctorsModal = async (dept) => {
    setViewingDeptDoctors(dept);
    setSelectedDoctorToAssign('');
    setLoadingDeptDoctors(true);
    setActionError(null);
    try {
      const res = await hospitalDataService.getDepartmentDoctors(dept.id);
      setDeptDoctorsList(res.doctors || []);
    } catch (err) {
      console.error('Failed to load department doctors:', err);
      setDeptDoctorsList([]);
    } finally {
      setLoadingDeptDoctors(false);
    }
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setActionError('Department name is required.');
      return;
    }
    setSubmitting(true);
    setActionError(null);
    try {
      await hospitalDataService.createDepartment({
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        bedCount: parseInt(formData.bedCount, 10) || 0,
        headDoctorName: formData.headDoctorName.trim(),
        status: formData.status
      });
      setActionSuccess(`Department "${formData.name}" established successfully.`);
      setIsAddModalOpen(false);
      await fetchDepartments();
    } catch (err) {
      console.error('Create department failed:', err);
      setActionError(err.response?.data?.detail || 'Failed to create department.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateDepartment = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setActionError('Department name is required.');
      return;
    }
    setSubmitting(true);
    setActionError(null);
    try {
      await hospitalDataService.updateDepartment(editingDept.id, {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        bedCount: parseInt(formData.bedCount, 10) || 0,
        headDoctorName: formData.headDoctorName.trim(),
        status: formData.status
      });
      setActionSuccess(`Department "${formData.name}" updated successfully.`);
      setEditingDept(null);
      await fetchDepartments();
    } catch (err) {
      console.error('Update department failed:', err);
      setActionError(err.response?.data?.detail || 'Failed to update department.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignDoctor = async (e) => {
    e.preventDefault();
    if (!selectedDoctorToAssign) return;
    setAssigningDoctor(true);
    setActionError(null);
    try {
      await hospitalDataService.assignDoctorToDepartment(viewingDeptDoctors.id, {
        doctorId: selectedDoctorToAssign
      });
      setActionSuccess('Doctor successfully assigned to department.');
      setSelectedDoctorToAssign('');
      const res = await hospitalDataService.getDepartmentDoctors(viewingDeptDoctors.id);
      setDeptDoctorsList(res.doctors || []);
      await fetchDepartments();
    } catch (err) {
      console.error('Assign doctor failed:', err);
      setActionError(err.response?.data?.detail || 'Failed to assign doctor to department.');
    } finally {
      setAssigningDoctor(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        badge="Clinical Divisions"
        badgeStatus={`${departments.length} Verified Units`}
        title="Hospital Departments & Clinical Divisions"
        subtitle="Manage hospital wards, outpatient divisions, specialist staffing allocations, and daily patient load"
        action={
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={openAddModal}
          >
            Add Department
          </Button>
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

      {loading ? (
        <Card className="p-12 text-center text-slate-500">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
          <p className="font-semibold text-slate-700">Loading Clinical Department Registry...</p>
        </Card>
      ) : departments.length === 0 ? (
        <Card className="p-10 text-center text-slate-500">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="font-semibold text-slate-700">No departments found.</p>
          <Button variant="primary" size="sm" icon={Plus} onClick={openAddModal} className="mt-4">
            Provision First Department
          </Button>
        </Card>
      ) : (
        /* Departments Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <Card key={dept.id || dept.name} className="flex flex-col justify-between hover:border-teal-400 transition-colors shadow-sm">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-teal-50 text-teal-700 rounded-lg border border-teal-200 shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm md:text-base">{dept.name}</h3>
                      <p className="text-[11px] text-slate-400 font-mono">Code: {dept.code || 'DEPT'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={dept.status || 'ACTIVE'} size="xs" />
                    <button
                      onClick={() => openEditModal(dept)}
                      title="Edit Department"
                      className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded border border-transparent hover:border-teal-200 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Stethoscope className="w-3.5 h-3.5 text-teal-600" /> Registered Doctors:
                    </span>
                    <strong className="text-slate-900">
                      {dept.registeredDoctors || 0} Clinicians
                      {dept.activeDoctors > 0 && (
                        <span className="ml-1 text-[11px] text-emerald-700 font-normal">
                          ({dept.activeDoctors} On Duty)
                        </span>
                      )}
                    </strong>
                  </div>

                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Verified Specialists:</span>
                    <span className={`font-semibold ${dept.verifiedDoctors > 0 ? 'text-teal-700' : 'text-slate-400'}`}>
                      {dept.verifiedDoctors || 0} Verified
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-teal-600" /> Registered Patients:
                    </span>
                    <strong className="text-slate-800">{dept.registeredPatients || 0} Patients</strong>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-teal-600" /> Total Consultations:
                    </span>
                    <strong className="text-teal-700">{dept.totalAppointments || 0} Bookings</strong>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-200/60 text-[11px]">
                    <div className="bg-white p-1.5 rounded border border-slate-200 text-center">
                      <span className="text-slate-400 block text-[10px]">Completed</span>
                      <strong className="text-emerald-700">{dept.completedAppointments || 0}</strong>
                    </div>
                    <div className="bg-white p-1.5 rounded border border-slate-200 text-center">
                      <span className="text-slate-400 block text-[10px]">Pending</span>
                      <strong className="text-amber-700">{dept.pendingAppointments || 0}</strong>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Bed className="w-3.5 h-3.5 text-teal-600" /> Ward Capacity:
                    </span>
                    <strong className="text-slate-800">{dept.bedCount || 0} Beds</strong>
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500">Department Head:</span>
                    <span className="text-slate-800 font-semibold truncate max-w-[150px]">{dept.headDoctor || 'Attending Head'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <Button
                  variant="outline"
                  size="xs"
                  icon={Stethoscope}
                  onClick={() => openDeptDoctorsModal(dept)}
                  className="text-slate-700 hover:text-teal-700"
                >
                  View Doctors ({dept.registeredDoctors || 0})
                </Button>
                <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  24x7 Active
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ADD DEPARTMENT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-teal-800">
                <Building2 className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-base">Add New Clinical Department</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDepartment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Cardiology, Endocrinology, Orthopedics"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department Code
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. CARD, ENDO"
                    className="w-full px-3 py-2 text-sm uppercase font-mono border border-slate-300 rounded-lg focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ward Bed Capacity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.bedCount}
                    onChange={(e) => setFormData({ ...formData, bedCount: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department Head / Chief Clinician
                </label>
                <input
                  type="text"
                  value={formData.headDoctorName}
                  onChange={(e) => setFormData({ ...formData, headDoctorName: e.target.value })}
                  placeholder="e.g. Dr. Ramesh Kumar"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-teal-500 focus:outline-none"
                >
                  <option value="ACTIVE">ACTIVE — Normal Operations</option>
                  <option value="EXPANDING">EXPANDING — Provisioning Capacity</option>
                  <option value="MAINTENANCE">MAINTENANCE — Ward Refurbishment</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submitting}
                  icon={submitting ? Loader2 : Plus}
                >
                  {submitting ? 'Creating...' : 'Create Department'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DEPARTMENT MODAL */}
      {editingDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-teal-800">
                <Edit2 className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-base">Edit Department: {editingDept.name}</h3>
              </div>
              <button
                onClick={() => setEditingDept(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateDepartment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department Code
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-sm uppercase font-mono border border-slate-300 rounded-lg focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ward Bed Capacity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.bedCount}
                    onChange={(e) => setFormData({ ...formData, bedCount: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department Head / Chief Clinician
                </label>
                <input
                  type="text"
                  value={formData.headDoctorName}
                  onChange={(e) => setFormData({ ...formData, headDoctorName: e.target.value })}
                  placeholder="e.g. Dr. Suresh Patel"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-teal-500 focus:outline-none"
                >
                  <option value="ACTIVE">ACTIVE — Normal Operations</option>
                  <option value="EXPANDING">EXPANDING — Provisioning Capacity</option>
                  <option value="MAINTENANCE">MAINTENANCE — Ward Refurbishment</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingDept(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submitting}
                  icon={submitting ? Loader2 : CheckCircle2}
                >
                  {submitting ? 'Updating...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW DEPARTMENT DOCTORS & ASSIGN MODAL */}
      {viewingDeptDoctors && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-teal-800">
                <Stethoscope className="w-5 h-5 text-teal-600" />
                <div>
                  <h3 className="font-bold text-base">Clinicians: {viewingDeptDoctors.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">Code: {viewingDeptDoctors.code || 'DEPT'}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingDeptDoctors(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Assign Doctor Section */}
              <div className="p-4 bg-teal-50/50 border border-teal-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-teal-800 text-xs sm:text-sm font-semibold">
                  <UserPlus className="w-4 h-4 text-teal-600" />
                  <span>Assign Clinician to {viewingDeptDoctors.name}</span>
                </div>
                <form onSubmit={handleAssignDoctor} className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={selectedDoctorToAssign}
                    onChange={(e) => setSelectedDoctorToAssign(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white focus:border-teal-500 focus:outline-none"
                  >
                    <option value="">-- Select Hospital Doctor to Assign --</option>
                    {hospitalDoctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} ({doc.specialization} • Currently: {doc.department || 'Unassigned'})
                      </option>
                    ))}
                  </select>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={!selectedDoctorToAssign || assigningDoctor}
                    icon={assigningDoctor ? Loader2 : UserCheck}
                  >
                    {assigningDoctor ? 'Assigning...' : 'Assign'}
                  </Button>
                </form>
              </div>

              {/* Department Doctors List */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Currently Assigned Doctors ({deptDoctorsList.length})
                </h4>
                {loadingDeptDoctors ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-teal-600 mb-2" />
                    Loading assigned clinicians...
                  </div>
                ) : deptDoctorsList.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
                    No doctors currently assigned to this department. Use the form above to assign a clinician.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {deptDoctorsList.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs hover:border-teal-300 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs">
                            {doc.name?.replace('Dr. ', '').charAt(0) || 'D'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-xs sm:text-sm">{doc.name}</p>
                            <p className="text-[11px] text-slate-500">
                              {doc.specialization} • Reg: {doc.licenseNumber || 'Verified Lic.'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            doc.isAvailable ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {doc.isAvailable ? 'On Duty' : 'Off Duty'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewingDeptDoctors(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
