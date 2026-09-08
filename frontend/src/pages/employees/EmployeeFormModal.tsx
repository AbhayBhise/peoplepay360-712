import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';
import { Employee, Department, WorkingSchedule } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { extractItems } from '../../utils/pagination';
import { useCreateEmployee, useUpdateEmployee, useEmployees } from '../../hooks/useEmployees';
import { useDepartments } from '../../hooks/useDepartments';
import { useSchedules } from '../../hooks/useSchedules';

interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (emp: Employee) => void;
  employeeToEdit?: Employee | null;
}

export const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  employeeToEdit,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [managerId, setManagerId] = useState<string>('');
  const [jobPosition, setJobPosition] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [workingScheduleId, setWorkingScheduleId] = useState<string>('');

  const { isAdmin } = useAuth();
  const { success, error } = useToast();
  
  const { data: deptData } = useDepartments();
  const { data: empData } = useEmployees();
  const { data: schedData } = useSchedules();

  const createEmployeeMutation = useCreateEmployee();
  const updateEmployeeMutation = useUpdateEmployee();

  const departments = extractItems<Department>(deptData || []);
  const schedules = extractItems<WorkingSchedule>(schedData || []);
  const allEmployees = extractItems<Employee>(empData || []);
  const potentialManagers = allEmployees.filter(
    (e) => !employeeToEdit || String(e.id) !== String(employeeToEdit.id)
  );

  const submitting = createEmployeeMutation.isPending || updateEmployeeMutation.isPending;

  useEffect(() => {
    if (isOpen) {
      if (employeeToEdit) {
        setName(employeeToEdit.name || '');
        setEmail(employeeToEdit.email || '');
        setDepartmentId(employeeToEdit.department_id ? String(employeeToEdit.department_id) : '');
        setManagerId(employeeToEdit.manager_id ? String(employeeToEdit.manager_id) : '');
        setJobPosition(employeeToEdit.job_position || '');
        setStatus(employeeToEdit.status || 'active');
        setWorkingScheduleId(employeeToEdit.working_schedule_id ? String(employeeToEdit.working_schedule_id) : '');
      } else {
        setName('');
        setEmail('');
        setDepartmentId('');
        setManagerId('');
        setJobPosition('');
        setStatus('active');
        setWorkingScheduleId('');
      }


    }
  }, [isOpen, employeeToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !departmentId || !jobPosition) {
      error('Please complete all required fields (Name, Department, Job Position).');
      return;
    }

    if (managerId && employeeToEdit && String(managerId) === String(employeeToEdit.id)) {
      error('An employee cannot be their own manager.');
      return;
    }

    try {
      const payload = {
        name,
        email: email || undefined,
        department_id: departmentId || undefined,
        manager_id: managerId || null,
        job_position: jobPosition,
        status,
        working_schedule_id: workingScheduleId || undefined,
      };

      if (employeeToEdit) {
        const result = await updateEmployeeMutation.mutateAsync({ id: employeeToEdit.id, data: payload });
        success(`Employee "${result.name}" updated successfully.`);
        onSuccess(result);
      } else {
        const result = await createEmployeeMutation.mutateAsync(payload);
        success(`Employee "${result.name}" created successfully.`);
        onSuccess(result);
      }
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to save employee.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={employeeToEdit ? 'Edit Employee' : 'Create New Employee'}
      description="Fill in employee details and operational assignments"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            placeholder="e.g. Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          {isAdmin() && (
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. jane@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!!employeeToEdit}
              required={!employeeToEdit}
            />
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Job Position"
            placeholder="e.g. Senior Software Engineer"
            value={jobPosition}
            onChange={(e) => setJobPosition(e.target.value)}
            required
          />

          <Select
            label="Department"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            placeholder="Select Department..."
            options={departments.map((d) => ({ value: String(d.id), label: d.name }))}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Manager"
            value={managerId}
            onChange={(e) => setManagerId(e.target.value)}
            placeholder="No Manager (Top level)"
            options={potentialManagers.map((m) => ({
              value: String(m.id),
              label: m.name,
              sublabel: m.job_position,
            }))}
          />

          <Select
            label="Working Schedule"
            value={workingScheduleId}
            onChange={(e) => setWorkingScheduleId(e.target.value)}
            placeholder="Standard Full-Time (40h)"
            options={schedules.map((s) => ({
              value: String(s.id),
              label: `${s.name} (${s.weekly_hours}h/wk)`,
            }))}
          />
        </div>

        <div>
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={submitting}>
            {employeeToEdit ? 'Save Changes' : 'Create Employee'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
