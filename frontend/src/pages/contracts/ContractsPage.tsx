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
import { SearchableSelect } from '../../components/common/SearchableSelect';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Pagination } from '../../components/common/Pagination';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/currency';
import { extractItems } from '../../utils/pagination';

export const ContractsPage: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'expired'>('all');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');

  // Edit Contract Modal State
  const [editingContract, setEditingContract] = useState<Contract | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, selectedDepartmentId]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState<string>('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [position, setPosition] = useState('');
  const [wage, setWage] = useState<number | ''>('');
  const [structureId, setStructureId] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<'active' | 'draft' | 'closed' | 'expired'>('active');
  const [expireExisting, setExpireExisting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
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
      setContracts(extractItems<Contract>(contractList));
      setEmployees(extractItems<Employee>(empList));
      setDepartments(extractItems<Department>(deptList));
      setStructures(extractItems<SalaryStructure>(structList));
    } catch (err: any) {
      error(err.message || 'Failed to load contracts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const existingActiveContract = employeeId
    ? contracts.find((c) => String(c.employee_id || (c as any).employeeId) === String(employeeId) && c.status === 'active')
    : null;

  const handleOpenCreate = () => {
    setEditingContract(null);
    setEmployeeId('');
    setDepartmentId('');
    setPosition('');
    setWage('');
    setStructureId('');
    setStartDate(todayStr);
    setEndDate('');
    setStatus('active');
    setExpireExisting(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Contract) => {
    setEditingContract(c);
    setEmployeeId(String(c.employee_id || (c as any).employeeId || ''));
    setDepartmentId(String(c.department_id || (c as any).departmentId || ''));
    setPosition(c.position || '');
    setWage(c.wage || '');
    setStructureId(String(c.salary_structure_id || (c as any).salaryStructureId || ''));
    setStartDate(c.start_date ? c.start_date.slice(0, 10) : todayStr);
    setEndDate(c.end_date ? c.end_date.slice(0, 10) : '');
    setStatus(c.status || 'active');
    setExpireExisting(false);
    setIsModalOpen(true);
  };

  const handleQuickExpire = async (c: Contract) => {
    try {
      await contractsApi.updateContract(String(c.id), { status: 'expired' });
      success(`Contract #${c.id} set to Expired.`);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to expire contract.');
    }
  };

  const handleEmployeeChange = (idVal: string) => {
    setEmployeeId(idVal);
    setExpireExisting(false);
    const emp = employees.find((e) => String(e.id) === String(idVal));
    if (emp) {
      if (emp.department_id) setDepartmentId(String(emp.department_id));
      if (emp.job_position) setPosition(emp.job_position);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !position || !wage || !structureId || !startDate) {
      error('Please fill in all required contract fields.');
      return;
    }

    if (!editingContract && startDate < todayStr) {
      error('Contract Start Date cannot be in the past.');
      return;
    }

    if (endDate && endDate <= startDate) {
      error('Contract End Date must be after Start Date.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingContract) {
        await contractsApi.updateContract(String(editingContract.id), {
          employee_id: employeeId,
          department_id: departmentId || undefined,
          position,
          wage: Number(wage),
          salary_structure_id: structureId,
          start_date: startDate,
          end_date: endDate || null,
          status,
        });
        success(`Contract #${editingContract.id} updated successfully.`);
      } else {
        // If auto-expire checkbox is checked for an existing active contract
        if (existingActiveContract && expireExisting && status === 'active') {
          await contractsApi.updateContract(String(existingActiveContract.id), { status: 'expired' });
        }

        await contractsApi.createContract({
          employee_id: employeeId,
          department_id: departmentId || undefined,
          position,
          wage: Number(wage),
          salary_structure_id: structureId,
          start_date: startDate,
          end_date: endDate || null,
          status,
        });
        success('Contract created successfully.');
      }

      setIsModalOpen(false);
      setEditingContract(null);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to save contract.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered records
  const filteredContracts = contracts.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) {
      return false;
    }
    if (selectedDepartmentId) {
      const deptId = String(c.department_id || (c as any).departmentId || '');
      if (deptId !== String(selectedDepartmentId)) return false;
    }
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase().trim();
    const emp = employees.find((e) => String(e.id) === String(c.employee_id || (c as any).employeeId));
    const empName = ((c as any).employee?.name || c.employee_name || (c as any).employeeName || emp?.name || '').toLowerCase();
    const pos = (c.position || '').toLowerCase();
    const structName = (c.salary_structure_name || (c as any).salaryStructureName || '').toLowerCase();
    const contractId = String(c.id).toLowerCase();

    return empName.includes(q) || pos.includes(q) || structName.includes(q) || contractId.includes(q);
  });

  // Metrics
  const totalContractsCount = contracts.length;
  const activeContractsCount = contracts.filter((c) => c.status === 'active').length;
  const draftContractsCount = contracts.filter((c) => c.status === 'draft').length;
  const expiredContractsCount = contracts.filter((c) => c.status === 'expired').length;

  // Paginated records
  const totalPages = Math.max(1, Math.ceil(filteredContracts.length / itemsPerPage));
  const paginatedContracts = filteredContracts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || selectedDepartmentId;

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

      {/* Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`p-4 bg-white dark:bg-slate-900 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
            statusFilter === 'all'
              ? 'ring-2 ring-indigo-500 border-indigo-500 dark:border-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/20'
              : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="text-2xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Contracts</div>
          <div className="text-2xl font-black font-financial text-slate-900 dark:text-white mt-1">{totalContractsCount}</div>
          <div className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">Click to view all</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('active')}
          className={`p-4 bg-white dark:bg-slate-900 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
            statusFilter === 'active'
              ? 'ring-2 ring-emerald-500 border-emerald-500 dark:border-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/20'
              : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="text-2xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">Active Contracts</div>
          <div className="text-2xl font-black font-financial text-emerald-950 dark:text-emerald-200 mt-1">{activeContractsCount}</div>
          <div className="text-2xs text-emerald-700 dark:text-emerald-400 mt-0.5">Payroll eligible</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('draft')}
          className={`p-4 bg-white dark:bg-slate-900 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
            statusFilter === 'draft'
              ? 'ring-2 ring-amber-500 border-amber-500 dark:border-amber-400 bg-amber-50/20 dark:bg-amber-950/20'
              : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="text-2xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">Draft Contracts</div>
          <div className="text-2xl font-black font-financial text-amber-950 dark:text-amber-200 mt-1">{draftContractsCount}</div>
          <div className="text-2xs text-amber-700 dark:text-amber-400 mt-0.5">Pending activation</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('expired')}
          className={`p-4 bg-white dark:bg-slate-900 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
            statusFilter === 'expired'
              ? 'ring-2 ring-slate-500 border-slate-500 dark:border-slate-400 bg-slate-50/40 dark:bg-slate-800/40'
              : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="text-2xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Expired Contracts</div>
          <div className="text-2xl font-black font-financial text-slate-900 dark:text-white mt-1">{expiredContractsCount}</div>
          <div className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">Archived / Past</div>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-6">
            <input
              type="text"
              placeholder="Search by employee name, position, structure, or contract ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="draft">Draft Only</option>
              <option value="expired">Expired Only</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedDepartmentId}
              onChange={(e) => setSelectedDepartmentId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between text-2xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>
              Showing <strong className="text-slate-900 dark:text-white">{filteredContracts.length}</strong> matching contracts (out of {contracts.length} total)
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setSelectedDepartmentId('');
              }}
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Contracts Table */}
      {loading ? (
        <Spinner label="Loading contracts..." />
      ) : filteredContracts.length === 0 ? (
        <EmptyState
          title="No Contracts Found"
          description={hasActiveFilters ? "No employment contracts matched your search criteria. Try clearing filters." : "There are currently no employment contracts registered in the system."}
          actionLabel={hasActiveFilters ? "Clear Filters" : (isHRMPlus() ? 'Create First Contract' : undefined)}
          onAction={hasActiveFilters ? () => { setSearchQuery(''); setStatusFilter('all'); setSelectedDepartmentId(''); } : handleOpenCreate}
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
                  {isHRMPlus() && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedContracts.map((c) => {
                  const emp = employees.find((e) => String(e.id) === String(c.employee_id || (c as any).employeeId));
                  const struct = structures.find((s) => String(s.id) === String(c.salary_structure_id || (c as any).salaryStructureId));

                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-indigo-50/30 dark:hover:bg-slate-800/50 transition-colors ${
                        c.is_active_for_today ? 'bg-emerald-50/20 dark:bg-emerald-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {(c as any).employee?.name || c.employee_name || (c as any).employeeName || emp?.name || (c.employee_id || (c as any).employeeId ? `Employee #${String(c.employee_id || (c as any).employeeId).substring(0, 8)}` : 'Staff Member')}
                        </div>
                        <div className="text-2xs text-slate-400 dark:text-slate-500 font-mono">Contract #{c.id}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">{c.position}</td>
                      <td className="py-3 px-4 font-financial font-bold text-slate-900 dark:text-white">
                        {formatCurrency(c.wage)}
                      </td>
                      <td className="py-3 px-4 text-indigo-900 dark:text-indigo-300 font-medium">
                        {c.salary_structure_name || (c as any).salaryStructureName || struct?.name || (c.salary_structure_id ? `Structure #${c.salary_structure_id}` : 'Standard Structure')}
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
                      {isHRMPlus() && (
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(c)}
                              className="px-2.5 py-1 text-2xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                            >
                              Edit
                            </button>
                            {c.status === 'active' && (
                              <button
                                type="button"
                                onClick={() => handleQuickExpire(c)}
                                className="px-2.5 py-1 text-2xs font-semibold rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 cursor-pointer"
                              >
                                Expire
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredContracts.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(size) => {
              setItemsPerPage(size);
              setCurrentPage(1);
            }}
          />
        </div>
      )}

      {/* Create / Edit Contract Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingContract(null);
        }}
        title={editingContract ? `Edit Contract #${editingContract.id}` : 'Create Employment Contract'}
        description={editingContract ? 'Update contract terms, wage, salary structure, and status' : 'Assign wage and salary structure to an active employee'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <SearchableSelect
            label="Employee"
            value={employeeId}
            onChange={(val) => handleEmployeeChange(val)}
            placeholder="Select Employee..."
            options={employees.map((e) => ({
              value: String(e.id),
              label: e.name,
              sublabel: e.job_position,
            }))}
            required
            disabled={!!editingContract}
          />

          {!editingContract && existingActiveContract && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 space-y-2">
              <div className="flex items-start gap-2 font-medium">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  This employee already has an active contract running from{' '}
                  <span className="font-bold">{existingActiveContract.start_date}</span>{' '}
                  {existingActiveContract.end_date ? `to ${existingActiveContract.end_date}` : '(Ongoing)'}.
                </div>
              </div>
              <label className="flex items-center gap-2 pt-1 font-semibold text-amber-900 dark:text-amber-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={expireExisting}
                  onChange={(e) => setExpireExisting(e.target.checked)}
                  className="rounded border-amber-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span>Set current active contract to Expired automatically</span>
              </label>
            </div>
          )}

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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Salary Structure"
              value={structureId}
              onChange={(e) => setStructureId(e.target.value)}
              placeholder="Select Salary Structure..."
              options={structures.map((s) => ({ value: String(s.id), label: s.name }))}
              required
              helperText="Defines the salary computation rules applied during payruns"
            />

            <Select
              label="Contract Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              options={[
                { value: 'active', label: 'Active (Payroll Eligible)' },
                { value: 'draft', label: 'Draft (Pending Activation)' },
                { value: 'expired', label: 'Expired (Past / Inactive)' },
              ]}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              min={editingContract ? undefined : todayStr}
              onChange={(e) => setStartDate(e.target.value)}
              required
              helperText={editingContract ? undefined : "Cannot be in the past"}
            />

            <Input
              label="End Date (Optional)"
              type="date"
              value={endDate}
              min={startDate || todayStr}
              onChange={(e) => setEndDate(e.target.value)}
              helperText="Leave empty for permanent/ongoing contracts"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                setEditingContract(null);
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              {editingContract ? 'Save Changes' : 'Create Contract'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ContractsPage;
