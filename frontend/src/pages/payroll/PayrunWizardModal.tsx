import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { SalaryStructure, Employee, Payrun } from '../../types';
import { payrollApi } from '../../api/payroll';
import { useToast } from '../../context/ToastContext';
import {
  Users,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  Search,
  Sparkles,
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
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 Form Data
  const [structureId, setStructureId] = useState<number | ''>('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');

  // Step 2 Eligible Employees & Selection
  const [eligibleEmployees, setEligibleEmployees] = useState<Employee[]>([]);
  const [selectedEmpIds, setSelectedEmpIds] = useState<number[]>([]);
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
        structure_id: Number(structureId),
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

  const handleToggleEmployee = (id: number) => {
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

  // STEP 2 -> STEP 3 (Review)
  const handleProceedToReview = () => {
    if (selectedEmpIds.length === 0) {
      error('Please select at least one employee for the batch.');
      return;
    }
    setStep(3);
  };

  // STEP 3 -> CREATE (POST /api/payruns)
  const handleCreatePayrun = async () => {
    setSubmittingPayrun(true);
    try {
      const created = await payrollApi.createPayrun({
        structure_id: Number(structureId),
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

  const selectedStructureObj = structures.find((s) => s.id === Number(structureId));

  const filteredEligible = eligibleEmployees.filter((e) => {
    if (!empSearch) return true;
    const q = empSearch.toLowerCase();
    return (
      e.name.toLowerCase().includes(q) ||
      e.job_position.toLowerCase().includes(q) ||
      (e.department_name && e.department_name.toLowerCase().includes(q))
    );
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Payrun Batch — Guided 3-Step Wizard"
      description="Calculate salary rules against active employee contracts for the payroll period"
      maxWidth="3xl"
    >
      {/* 3-STEP PROGRESS STEPPER */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
          <span className={step === 1 ? 'text-[#714B67] font-extrabold' : 'text-slate-400'}>
            01 Scope & Period
          </span>
          <span className={step === 2 ? 'text-[#714B67] font-extrabold' : 'text-slate-400'}>
            02 Cohort Selection ({selectedEmpIds.length})
          </span>
          <span className={step === 3 ? 'text-teal-700 font-extrabold' : 'text-slate-400'}>
            03 Review & Batch Creation
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
          <div
            className={`h-full transition-all duration-300 ${
              step === 1 ? 'w-1/3 bg-[#714B67]' : step === 2 ? 'w-2/3 bg-purple-600' : 'w-full bg-teal-600'
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
            onChange={(e) => setStructureId(Number(e.target.value))}
            placeholder="Select Structure..."
            options={structures.map((s) => ({ value: s.id, label: s.name }))}
            required
            helperText="The sequenced rules (Basic, Allowances, Deductions) in this structure will be computed"
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

          <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 text-xs text-purple-950 flex items-start gap-3">
            <Users className="w-5 h-5 text-[#714B67] shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Live Server-Side Contract Verification:</strong>
              <div className="text-2xs text-purple-800 mt-0.5">
                Continuing will verify active contracts covering {periodStart} to {periodEnd} assigned to{' '}
                <strong>{selectedStructureObj?.name || 'this structure'}</strong>.
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loadingPreview} icon={<ArrowRight className="w-4 h-4" />}>
              Continue to Employee Selection
            </Button>
          </div>
        </form>
      )}

      {/* STEP 2: Cohort Checkbox Selection */}
      {step === 2 && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Eligible Employee Cohort ({eligibleEmployees.length} Identified)
              </h4>
              <p className="text-2xs text-slate-500">
                Select the employees to include in this payrun calculation batch.
              </p>
            </div>

            {eligibleEmployees.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAllExplicitly}
                className="text-xs font-bold text-[#714B67] hover:underline cursor-pointer"
              >
                {selectedEmpIds.length === eligibleEmployees.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search eligible employees..."
              value={empSearch}
              onChange={(e) => setEmpSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          {filteredEligible.length === 0 ? (
            <div className="p-8 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-600">
              <ShieldAlert className="w-6 h-6 text-amber-500 mx-auto mb-2" />
              <div className="font-bold text-slate-800">No Eligible Employees Found</div>
              <p className="text-2xs text-slate-500 mt-1">
                No active contracts match structure "{selectedStructureObj?.name}" for dates {periodStart} to {periodEnd}.
              </p>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl bg-white shadow-2xs">
              {filteredEligible.map((emp) => {
                const isSelected = selectedEmpIds.includes(emp.id);
                return (
                  <label
                    key={emp.id}
                    className={`flex items-center justify-between p-3.5 cursor-pointer transition-colors ${
                      isSelected ? 'bg-purple-50/70' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleEmployee(emp.id)}
                        className="w-4 h-4 rounded text-[#714B67] focus:ring-[#714B67]"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900">{emp.name}</div>
                        <div className="text-2xs text-slate-500">
                          {emp.job_position} · {emp.department_name || `Dept #${emp.department_id}`}
                        </div>
                      </div>
                    </div>
                    <span className="text-2xs font-mono font-bold text-slate-400">ID #{emp.id}</span>
                  </label>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStep(1)}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Back to Period
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleProceedToReview}
              disabled={selectedEmpIds.length === 0}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Review Scope ({selectedEmpIds.length} Selected)
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Review & Create */}
      {step === 3 && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-4 bg-teal-50/80 rounded-2xl border border-teal-200 text-xs text-teal-950 space-y-3">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              <span>Confirm Payrun Batch Parameters</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-2xs pt-1">
              <div>
                <span className="text-teal-700 block font-semibold">Salary Structure</span>
                <strong className="text-xs text-slate-900">{selectedStructureObj?.name}</strong>
              </div>
              <div>
                <span className="text-teal-700 block font-semibold">Payroll Period</span>
                <strong className="text-xs text-slate-900">{periodStart} to {periodEnd}</strong>
              </div>
              <div>
                <span className="text-teal-700 block font-semibold">Included Employees</span>
                <strong className="text-xs text-slate-900">{selectedEmpIds.length} Employees</strong>
              </div>
              <div>
                <span className="text-teal-700 block font-semibold">Initial Status</span>
                <strong className="text-xs text-amber-800 uppercase">Draft (Pending Computation)</strong>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStep(2)}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Back to Selection
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleCreatePayrun}
              isLoading={submittingPayrun}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              Create Payrun Batch
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
