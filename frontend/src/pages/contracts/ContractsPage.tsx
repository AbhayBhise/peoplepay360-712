import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { contractsApi } from '../../api/contracts';
import { employeesApi } from '../../api/employees';
import { departmentsApi } from '../../api/departments';
import { payrollApi } from '../../api/payroll';
import { Contract, Employee, Department, SalaryStructure } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/currency';

export const ContractsPage: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState<string>('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [position, setPosition] = useState('');
  const [wage, setWage] = useState<number | ''>('');
  const [structureId, setStructureId] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<string>('active');
  const [submitting, setSubmitting] = useState(false);

  const { isHRMPlus } = useAuth();
  const { success, error } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [contractList, empList, deptList, structList] = await Promise.all([
        contractsApi.getContracts().catch(() => []),
        employeesApi.getEmployees().catch(() => []),
        departmentsApi.getDepartments().catch(() => []),
        payrollApi.getStructures().catch(() => []),
      ]);
      setContracts(contractList || []);
      setEmployees(empList || []);
      setDepartments(deptList || []);
      setStructures(structList || []);
    } catch (err: any) {
      error(err.message || 'Failed to load contracts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEmployeeId('');
    setDepartmentId('');
    setPosition('');
    setWage('');
    setStructureId('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setStatus('active');
    setIsModalOpen(true);
  };

  const handleEmployeeChange = (idVal: string) => {
    setEmployeeId(idVal);
    const emp = employees.find((e) => String(e.id) === String(idVal));
    if (emp) {
      if (emp.department_id) setDepartmentId(String(emp.department_id));
      if (emp.job_position) setPosition(emp.job_position);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !departmentId || !position || !wage || !structureId || !startDate) {
      error('Please fill in all required contract fields.');
      return;
    }

    if (endDate && endDate <= startDate) {
      error('Contract End Date must be after Start Date.');
      return;
    }

    setSubmitting(true);
    try {
      await contractsApi.createContract({
        employee_id: employeeId,
        department_id: departmentId,
        position,
        wage: Number(wage),
        salary_structure_id: structureId,
        start_date: startDate,
        end_date: endDate || null,
        status,
      });

      success('Contract created successfully.');
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to save contract.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Employee Contracts</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage employee wage contracts, salary structures, and active payroll eligibility
          </p>
        </div>

        {isHRMPlus() && (
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleOpenCreate}>
            New Contract
          </Button>
        )}
      </div>

      {/* Contracts Table */}
      {loading ? (
        <Spinner label="Loading contracts..." />
      ) : contracts.length === 0 ? (
        <EmptyState
          title="No Contracts Found"
          description="There are currently no employment contracts registered in the system."
          actionLabel={isHRMPlus() ? 'Create First Contract' : undefined}
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Job Position</th>
                  <th className="py-3 px-4">Monthly Wage</th>
                  <th className="py-3 px-4">Salary Structure</th>
                  <th className="py-3 px-4">Contract Period</th>
                  <th className="py-3 px-4">Active Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {contracts.map((c) => {
                  const emp = employees.find((e) => String(e.id) === String(c.employee_id));
                  const struct = structures.find((s) => String(s.id) === String(c.salary_structure_id));

                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-indigo-50/30 dark:hover:bg-slate-800/50 transition-colors ${
                        c.is_active_for_today ? 'bg-emerald-50/20 dark:bg-emerald-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {c.employee_name || emp?.name || `Employee #${c.employee_id}`}
                        </div>
                        <div className="text-2xs text-slate-400 dark:text-slate-500 font-mono">Contract #{c.id}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">{c.position}</td>
                      <td className="py-3 px-4 font-financial font-bold text-slate-900 dark:text-white">
                        {formatCurrency(c.wage)}
                      </td>
                      <td className="py-3 px-4 text-indigo-900 dark:text-indigo-300 font-medium">
                        {c.salary_structure_name || struct?.name || `Structure #${c.salary_structure_id}`}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {c.start_date} {c.end_date ? `to ${c.end_date}` : '→ Ongoing'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Badge variant={c.status === 'active' ? 'active' : 'draft'} size="sm">
                            {c.status}
                          </Badge>
                          {c.is_active_for_today && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-2xs font-bold border border-emerald-300 dark:border-emerald-800/60">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              Active Today
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Contract Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Employment Contract"
        description="Assign wage and salary structure to an active employee"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Employee"
            value={employeeId}
            onChange={(e) => handleEmployeeChange(e.target.value)}
            placeholder="Select Employee..."
            options={employees.map((e) => ({
              value: String(e.id),
              label: `${e.name} (${e.job_position})`,
            }))}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Job Position / Role"
              placeholder="e.g. Senior Software Engineer"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              required
            />

            <Input
              label="Monthly Wage (₹)"
              type="number"
              placeholder="e.g. 50000"
              value={wage}
              onChange={(e) => setWage(e.target.value ? Number(e.target.value) : '')}
              required
            />
          </div>

          <Select
            label="Salary Structure"
            value={structureId}
            onChange={(e) => setStructureId(e.target.value)}
            placeholder="Select Salary Structure..."
            options={structures.map((s) => ({ value: String(s.id), label: s.name }))}
            required
            helperText="Defines the salary computation rules applied during payruns"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />

            <Input
              label="End Date (Optional)"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              helperText="Leave empty for permanent/ongoing contracts"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              Create Contract
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ContractsPage;
