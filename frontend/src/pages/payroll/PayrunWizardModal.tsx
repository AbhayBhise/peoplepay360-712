import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { SalaryStructure, Employee, Payrun } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { payrollApi } from '../../api/payroll';
import { useToast } from '../../context/ToastContext';
import {
  Users,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  Search,
  Layers,
  Calendar,
} from 'lucide-react';

interface PayrunWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (payrun: Payrun) => void;
  structures: SalaryStructure[];
}

export const PayrunWizardModal: React.FC<PayrunWizardModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  structures,
}) => {
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 Form Data
  const [structureId, setStructureId] = useState<number | string>('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');

  // Step 2 Eligible Employees & Selection
  const [eligibleEmployees, setEligibleEmployees] = useState<Employee[]>([]);
  const [selectedEmpIds, setSelectedEmpIds] = useState<(number | string)[]>([]);
  const [empSearch, setEmpSearch] = useState('');

  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submittingPayrun, setSubmittingPayrun] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setStructureId(structures[0]?.id || 1);
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      setPeriodStart(firstDay);
      setPeriodEnd(lastDay);
      setEligibleEmployees([]);
      setSelectedEmpIds([]);
      setEmpSearch('');
    }
  }, [isOpen, structures]);

  // STEP 1 -> STEP 2 (Preview Eligible Employees via POST /api/payruns/preview)
  const handleStep1Continue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!structureId || !periodStart || !periodEnd) {
      error('Please select structure and valid period dates.');
      return;
    }

    if (periodEnd <= periodStart) {
      error('Period End date must be strictly after Period Start date.');
      return;
    }

    setLoadingPreview(true);
    try {
      const eligible = await payrollApi.previewPayrun({
        structure_id: structureId,
        period_start: periodStart,
        period_end: periodEnd,
      });

      setEligibleEmployees(eligible || []);
      setSelectedEmpIds([]); // Explicit selection required — never auto-select all
      setStep(2);
    } catch (err: any) {
      error(err.message || 'Failed to fetch eligible employees for this period.');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleToggleEmployee = (id: number | string) => {
    setSelectedEmpIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllExplicitly = () => {
    if (selectedEmpIds.length === eligibleEmployees.length) {
      setSelectedEmpIds([]);
    } else {
      setSelectedEmpIds(eligibleEmployees.map((e) => e.id));
    }
  };

  // STEP 2 -> CREATE PAYRUN BATCH (POST /api/payruns)
  const handleCreatePayrun = async () => {
    if (selectedEmpIds.length === 0) {
      error('Please select at least one employee for the batch.');
      return;
    }

    setSubmittingPayrun(true);
    try {
      const created = await payrollApi.createPayrun({
        structure_id: structureId,
        period_start: periodStart,
        period_end: periodEnd,
        employee_ids: selectedEmpIds,
      });

      success('Payrun batch created successfully in Draft state.');
      onSuccess(created);
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to create payrun batch.');
    } finally {
      setSubmittingPayrun(false);
    }
  };

  const selectedStructureObj = structures.find((s) => String(s.id) === String(structureId));

  const filteredEligible = eligibleEmployees.filter((e) => {
    if (!empSearch) return true;
    const q = empSearch.toLowerCase();
    return (
      e.name.toLowerCase().includes(q) ||
      e.job_position?.toLowerCase().includes(q) ||
      (e.department_name && e.department_name.toLowerCase().includes(q))
    );
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Payrun Batch — 2-Step Wizard"
      description="Calculate salary rules against active employee contracts for the payroll period"
      maxWidth="3xl"
    >
      {/* 2-STEP PROGRESS STEPPER */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
          <span className={step === 1 ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : 'text-slate-400 dark:text-slate-500'}>
            Step 1: Structure & Period
          </span>
          <span className={step === 2 ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : 'text-slate-400 dark:text-slate-500'}>
            Step 2: Employee Selection & Batch Creation ({selectedEmpIds.length} Selected)
          </span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden flex">
          <div
            className={`h-full transition-all duration-300 ${
              step === 1 ? 'w-1/2 bg-indigo-600' : 'w-full bg-indigo-600'
            }`}
          />
        </div>
      </div>

      {/* STEP 1: Structure & Period */}
      {step === 1 && (
        <form onSubmit={handleStep1Continue} className="space-y-4 animate-fade-in">
          <Select
            label="Salary Structure"
            value={structureId}
            onChange={(e) => setStructureId(e.target.value)}
            placeholder="Select Structure..."
            options={structures.map((s) => ({ value: s.id, label: s.name }))}
            required
            helperText="The sequenced rules in this structure will be evaluated against active contracts"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Payroll Period Start"
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              required
            />

            <Input
              label="Payroll Period End"
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              required
            />
          </div>

          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/60 rounded-2xl border border-indigo-100 dark:border-indigo-800 text-xs text-indigo-950 dark:text-indigo-200 flex items-start gap-3">
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Live Server-Side Contract Verification:</strong>
              <div className="text-2xs text-indigo-800 dark:text-indigo-300 mt-0.5">
                Continuing will verify active contracts covering {periodStart} to {periodEnd} assigned to{' '}
                <strong>{selectedStructureObj?.name || 'this structure'}</strong>.
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loadingPreview} icon={<ArrowRight className="w-4 h-4" />}>
              Continue to Employee Selection
            </Button>
          </div>
        </form>
      )}

      {/* STEP 2: Cohort Checkbox Selection & Direct Creation */}
      {step === 2 && (
        <div className="space-y-4 animate-fade-in">
          {/* Summary Banner */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-slate-500 dark:text-slate-400">Structure:</span>{' '}
              <strong className="text-slate-900 dark:text-white">{selectedStructureObj?.name}</strong>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Period:</span>{' '}
              <strong className="text-slate-900 dark:text-white">{periodStart} to {periodEnd}</strong>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Selected:</span>{' '}
              <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{selectedEmpIds.length} / {eligibleEmployees.length}</strong>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Eligible Employee Cohort ({eligibleEmployees.length} Identified)
              </h4>
              <p className="text-2xs text-slate-500 dark:text-slate-400">
                Explicitly select employees to include in this payrun calculation batch.
              </p>
            </div>

            {eligibleEmployees.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAllExplicitly}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                {selectedEmpIds.length === eligibleEmployees.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search eligible employees..."
              value={empSearch}
              onChange={(e) => setEmpSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          {filteredEligible.length === 0 ? (
            <div className="p-8 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-center text-xs text-slate-600 dark:text-slate-400">
              <ShieldAlert className="w-6 h-6 text-amber-500 mx-auto mb-2" />
              <div className="font-bold text-slate-800 dark:text-slate-200">No Eligible Employees Found</div>
              <p className="text-2xs text-slate-500 dark:text-slate-400 mt-1">
                No active contracts match structure "{selectedStructureObj?.name}" for dates {periodStart} to {periodEnd}.
              </p>
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-2xs">
              {filteredEligible.map((emp) => {
                const isSelected = selectedEmpIds.includes(emp.id);
                return (
                  <label
                    key={emp.id}
                    className={`flex items-center justify-between p-3.5 cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-50/70 dark:bg-indigo-950/40' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleEmployee(emp.id)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-600"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">{emp.name}</div>
                        <div className="text-2xs text-slate-500 dark:text-slate-400">
                          {emp.job_position || (emp as any).jobPosition || 'Employee'} · {emp.department_name || (emp as any).departmentName || (emp.department_id || (emp as any).departmentId ? `Dept #${emp.department_id || (emp as any).departmentId}` : 'General')}
                        </div>
                      </div>
                    </div>
                    {emp.wage && (
                      <span className="text-2xs font-mono font-bold text-slate-500 dark:text-slate-400">
                        {formatCurrency(emp.wage)} / mo
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStep(1)}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Back to Step 1
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleCreatePayrun}
              disabled={selectedEmpIds.length === 0}
              isLoading={submittingPayrun}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              Create Payrun Batch ({selectedEmpIds.length})
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

