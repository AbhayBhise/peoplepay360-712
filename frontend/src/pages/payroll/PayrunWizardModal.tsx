import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { SalaryStructure, Employee, Payrun } from '../../types';
import { payrollApi } from '../../api/payroll';
import { useToast } from '../../context/ToastContext';
import { Users, CheckCircle2, ArrowRight, ArrowLeft, ShieldAlert } from 'lucide-react';

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
  const [structureId, setStructureId] = useState<number | ''>('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');

  // Step 2 Eligible Employees & Selection
  const [eligibleEmployees, setEligibleEmployees] = useState<Employee[]>([]);
  const [selectedEmpIds, setSelectedEmpIds] = useState<number[]>([]);

  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submittingPayrun, setSubmittingPayrun] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setStructureId(structures[0]?.id || '');
      // Default to current month
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      setPeriodStart(firstDay);
      setPeriodEnd(lastDay);
      setEligibleEmployees([]);
      setSelectedEmpIds([]);
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

  // STEP 2 -> CREATE (POST /api/payruns)
  const handleCreatePayrun = async () => {
    if (selectedEmpIds.length === 0) {
      error('Please select at least one eligible employee for this payrun batch.');
      return;
    }

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Payrun Batch — 2-Step Wizard"
      description="Step 1: Period & Structure → Step 2: Explicit Employee Selection"
      maxWidth="2xl"
    >
      {/* Step Indicator Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
          <span className={step === 1 ? 'text-[#714B67]' : 'text-slate-400'}>
            Step 1: Structure & Period
          </span>
          <span className={step === 2 ? 'text-[#714B67]' : 'text-slate-400'}>
            Step 2: Employee Selection ({selectedEmpIds.length} chosen)
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
          <div
            className={`h-full transition-all duration-300 ${
              step === 1 ? 'w-1/2 bg-[#714B67]' : 'w-full bg-teal-600'
            }`}
          />
        </div>
      </div>

      {/* STEP 1: Structure & Period Dates */}
      {step === 1 && (
        <form onSubmit={handleStep1Continue} className="space-y-4">
          <Select
            label="Salary Structure"
            value={structureId}
            onChange={(e) => setStructureId(Number(e.target.value))}
            placeholder="Select Structure..."
            options={structures.map((s) => ({ value: s.id, label: s.name }))}
            required
            helperText="The calculation rules defined in this structure will execute in strict sequence order"
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

          <div className="p-3.5 bg-purple-50 rounded-xl border border-purple-100 text-xs text-purple-900 flex items-start gap-2.5">
            <Users className="w-4 h-4 text-[#714B67] flex-shrink-0 mt-0.5" />
            <div>
              <strong>Server-Side Eligibility Verification:</strong>
              <div className="text-2xs text-purple-700 mt-0.5">
                Continuing will query the live backend for employees with active contracts covering this exact period linked to{' '}
                <strong>{selectedStructureObj?.name || 'the selected structure'}</strong>.
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

      {/* STEP 2: Eligible Employees Checkbox Selection */}
      {step === 2 && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Eligible Employees ({eligibleEmployees.length} Found)
              </h4>
              <p className="text-2xs text-slate-500">
                Explicitly check the employees to include in this payrun batch.
              </p>
            </div>
            {eligibleEmployees.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAllExplicitly}
                className="text-xs font-semibold text-[#714B67] hover:underline cursor-pointer"
              >
                {selectedEmpIds.length === eligibleEmployees.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>

          {eligibleEmployees.length === 0 ? (
            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-600">
              <ShieldAlert className="w-6 h-6 text-amber-500 mx-auto mb-2" />
              <div className="font-bold text-slate-800">No Eligible Employees Found</div>
              <p className="text-2xs text-slate-500 mt-1">
                No active contracts match structure "{selectedStructureObj?.name}" for dates {periodStart} to {periodEnd}.
              </p>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white shadow-2xs">
              {eligibleEmployees.map((emp) => {
                const isSelected = selectedEmpIds.includes(emp.id);
                return (
                  <label
                    key={emp.id}
                    className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-purple-50/60' : 'hover:bg-slate-50'
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
                    <span className="text-2xs font-mono font-medium text-slate-400">ID #{emp.id}</span>
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
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
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
                Create Payrun ({selectedEmpIds.length} Selected)
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
