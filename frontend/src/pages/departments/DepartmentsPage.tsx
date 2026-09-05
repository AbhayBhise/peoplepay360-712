import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit, Trash2, Users, Layers, AlertCircle } from 'lucide-react';
import { departmentsApi } from '../../api/departments';
import { employeesApi } from '../../api/employees';
import { Department, Employee } from '../../types';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const DepartmentsPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<number | ''>('');
  const [headId, setHeadId] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation
  const [deptToDelete, setDeptToDelete] = useState<Department | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { isHRMPlus } = useAuth();
  const { success, error } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [deptList, empList] = await Promise.all([
        departmentsApi.getDepartments(),
        employeesApi.getEmployees().catch(() => []),
      ]);
      setDepartments(deptList || []);
      setEmployees(empList || []);
    } catch (err: any) {
      error(err.message || 'Failed to load departments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingDept(null);
    setName('');
    setParentId('');
    setHeadId('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dept: Department) => {
    setEditingDept(dept);
    setName(dept.name);
    setParentId(dept.parent_department_id || '');
    setHeadId(dept.head_employee_id || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      error('Department name is required.');
      return;
    }

    if (editingDept && parentId === editingDept.id) {
      error('A department cannot be its own parent department (no self-parenting).');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        parent_department_id: parentId ? Number(parentId) : null,
        head_employee_id: headId ? Number(headId) : null,
      };

      if (editingDept) {
        await departmentsApi.updateDepartment(editingDept.id, payload);
        success(`Department "${name}" updated successfully.`);
      } else {
        await departmentsApi.createDepartment(payload);
        success(`Department "${name}" created successfully.`);
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to save department.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deptToDelete) return;
    setDeleting(true);
    try {
      await departmentsApi.deleteDepartment(deptToDelete.id);
      success(`Department "${deptToDelete.name}" deleted.`);
      setDeptToDelete(null);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to delete department.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#714B67]" />
            <span>Departments</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Define and manage organizational units, hierarchy, and department managers
          </p>
        </div>

        {isHRMPlus() && (
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleOpenCreate}
          >
            Create Department
          </Button>
        )}
      </div>

      {/* Main List Table */}
      {loading ? (
        <Spinner label="Loading departments..." />
      ) : departments.length === 0 ? (
        <EmptyState
          title="No Departments Found"
          description="No organizational departments exist in the database."
          actionLabel={isHRMPlus() ? 'Add First Department' : undefined}
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Department Name</th>
                  <th className="py-3 px-4">Parent Department</th>
                  <th className="py-3 px-4">Head of Department</th>
                  <th className="py-3 px-4">Dept ID</th>
                  {isHRMPlus() && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {departments.map((dept) => {
                  const parentDept = departments.find((d) => d.id === dept.parent_department_id);
                  const headEmp = employees.find((e) => e.id === dept.head_employee_id);

                  return (
                    <tr key={dept.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-purple-50 text-[#714B67] border border-purple-100 flex items-center justify-center font-bold text-xs">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{dept.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {dept.parent_department_name || (parentDept ? parentDept.name : '—')}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {dept.head_employee_name || (headEmp ? `${headEmp.name} (${headEmp.job_position})` : '—')}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">#{dept.id}</td>
                      {isHRMPlus() && (
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(dept)}
                              className="p-1.5 rounded-md text-slate-500 hover:text-[#714B67] hover:bg-purple-50 transition-colors cursor-pointer"
                              title="Edit Department"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeptToDelete(dept)}
                              className="p-1.5 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Department"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDept ? 'Edit Department' : 'Create Department'}
        description="Configure department title, parent relationship, and department head"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Department Name"
            placeholder="e.g. Engineering, Finance, Operations"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Select
            label="Parent Department"
            value={parentId}
            onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : '')}
            placeholder="None (Top Level Department)"
            options={departments
              .filter((d) => !editingDept || d.id !== editingDept.id)
              .map((d) => ({ value: d.id, label: d.name }))}
            helperText="Select a parent department to organize sub-units"
          />

          <Select
            label="Head of Department"
            value={headId}
            onChange={(e) => setHeadId(e.target.value ? Number(e.target.value) : '')}
            placeholder="Select Employee..."
            options={employees.map((e) => ({
              value: e.id,
              label: `${e.name} — ${e.job_position}`,
            }))}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              {editingDept ? 'Save Changes' : 'Create Department'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deptToDelete}
        onClose={() => setDeptToDelete(null)}
        title="Confirm Department Deletion"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              Are you sure you want to delete department{' '}
              <strong className="font-bold">{deptToDelete?.name}</strong>?
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => setDeptToDelete(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete} isLoading={deleting}>
              Delete Department
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
