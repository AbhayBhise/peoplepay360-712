import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit, ChevronRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import { payrollApi } from '../../api/payroll';
import { SalaryStructure, SalaryRule } from '../../types';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Pagination } from '../../components/common/Pagination';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/currency';

export const SalaryStructuresPage: React.FC = () => {
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [selectedStructure, setSelectedStructure] = useState<SalaryStructure | null>(null);
  const [rules, setRules] = useState<SalaryRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [rulesLoading, setRulesLoading] = useState(false);

  // Pagination state for rules
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStructure]);

  // Modal: New Structure
  const [isStructModalOpen, setIsStructModalOpen] = useState(false);
  const [structName, setStructName] = useState('');
  const [structActive, setStructActive] = useState(true);
  const [submittingStruct, setSubmittingStruct] = useState(false);

  // Modal: New / Edit Rule
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [ruleCode, setRuleCode] = useState('');
  const [ruleCategory, setRuleCategory] = useState<'Basic' | 'Allowance' | 'Deduction' | 'Gross' | 'Net'>('Basic');
  const [ruleSequence, setRuleSequence] = useState(10);
  const [ruleCompMethod, setRuleCompMethod] = useState<'fixed' | 'percentage' | 'formula'>('fixed');
  const [ruleFixedAmount, setRuleFixedAmount] = useState<number | ''>('');
  const [rulePercentage, setRulePercentage] = useState<number | ''>('');
  const [ruleBaseField, setRuleBaseField] = useState('wage');
  const [submittingRule, setSubmittingRule] = useState(false);

  const { isHRPMPlus } = useAuth();
  const { success, error } = useToast();

  const loadStructures = async () => {
    setLoading(true);
    try {
      const list = await payrollApi.getStructures();
      setStructures(list || []);
      if (list && list.length > 0 && !selectedStructure) {
        setSelectedStructure(list[0]);
      }
    } catch (err: any) {
      error(err.message || 'Failed to load salary structures.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStructures();
  }, []);

  // Load rules when selectedStructure changes
  useEffect(() => {
    if (!selectedStructure) return;
    const loadRules = async () => {
      setRulesLoading(true);
      try {
        const ruleList = await payrollApi.getRules(selectedStructure.id);
        // Ensure strictly sorted by sequence
        const sorted = (ruleList || []).sort((a, b) => a.sequence - b.sequence);
        setRules(sorted);
      } catch (err: any) {
        error(err.message || 'Failed to load rules for structure.');
      } finally {
        setRulesLoading(false);
      }
    };

    loadRules();
  }, [selectedStructure]);

  const handleCreateStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!structName.trim()) {
      error('Structure name is required.');
      return;
    }

    setSubmittingStruct(true);
    try {
      const created = await payrollApi.createStructure({
        name: structName.trim(),
        active: structActive,
      });

      success(`Salary structure "${created.name}" created.`);
      setIsStructModalOpen(false);
      setStructName('');
      loadStructures();
      setSelectedStructure(created);
    } catch (err: any) {
      error(err.message || 'Failed to create structure.');
    } finally {
      setSubmittingStruct(false);
    }
  };

  const handleOpenCreateRule = () => {
    setRuleName('');
    setRuleCode('');
    setRuleCategory('Basic');
    setRuleSequence((rules.length + 1) * 10);
    setRuleCompMethod('fixed');
    setRuleFixedAmount('');
    setRulePercentage('');
    setRuleBaseField('wage');
    setIsRuleModalOpen(true);
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStructure || !ruleName || !ruleCode) {
      error('Name and Code are required.');
      return;
    }

    // Check sequence uniqueness in current structure
    if (rules.some((r) => r.sequence === Number(ruleSequence))) {
      error(`Sequence ${ruleSequence} already exists in this structure. Please use a unique sequence order.`);
      return;
    }

    setSubmittingRule(true);
    try {
      await payrollApi.createRule({
        structure_id: selectedStructure.id,
        name: ruleName.trim(),
        code: ruleCode.trim().toUpperCase(),
        category: ruleCategory,
        sequence: Number(ruleSequence),
        computation_method: ruleCompMethod,
        fixed_amount: ruleFixedAmount ? Number(ruleFixedAmount) : undefined,
        percentage: rulePercentage ? Number(rulePercentage) : undefined,
        base_field: ruleBaseField,
      });

      success(`Salary rule "${ruleName}" added in sequence #${ruleSequence}.`);
      setIsRuleModalOpen(false);
      // Refresh rules
      const ruleList = await payrollApi.getRules(selectedStructure.id);
      setRules((ruleList || []).sort((a, b) => a.sequence - b.sequence));
    } catch (err: any) {
      error(err.message || 'Failed to save salary rule.');
    } finally {
      setSubmittingRule(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Salary Structures & Sequenced Rules</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure salary formulas and strict execution sequences (Basic → Allowances → Deductions → Gross → Net)
          </p>
        </div>

        {isHRPMPlus() && (
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setStructName('');
              setStructActive(true);
              setIsStructModalOpen(true);
            }}
          >
            New Structure
          </Button>
        )}
      </div>

      {loading ? (
        <Spinner label="Loading salary structures..." />
      ) : structures.length === 0 ? (
        <EmptyState
          title="No Salary Structures"
          description="Create your first salary structure (e.g. Standard Executive Salary Structure)."
          actionLabel={isHRPMPlus() ? 'Create Salary Structure' : undefined}
          onAction={() => setIsStructModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Structures Selector List */}
          <div className="lg:col-span-4 space-y-2">
            <div className="text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Salary Structures ({structures.length})
            </div>
            <div className="space-y-2">
              {structures.map((s) => {
                const isSelected = selectedStructure?.id === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedStructure(s)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-600 dark:border-indigo-500 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">{s.name}</div>
                      <div className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">Structure ID: #{s.id}</div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-300 dark:text-slate-600'}`}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rules in Selected Structure */}
          <div className="lg:col-span-8">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedStructure?.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Rules execute in strict <span className="font-semibold text-indigo-900 dark:text-indigo-300">Sequence order</span> from lowest to highest.
                  </p>
                </div>
                {isHRPMPlus() && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Plus className="w-3.5 h-3.5" />}
                    onClick={handleOpenCreateRule}
                  >
                    Add Salary Rule
                  </Button>
                )}
              </div>

              {rulesLoading ? (
                <Spinner label="Loading rules..." />
              ) : rules.length === 0 ? (
                <EmptyState
                  title="No Salary Rules Defined"
                  description="Add rules (e.g. Basic Wage, HRA Allowance, Tax Deduction) to this structure."
                  actionLabel={isHRPMPlus() ? 'Add Salary Rule' : undefined}
                  onAction={handleOpenCreateRule}
                />
              ) : (
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Seq</th>
                        <th className="py-2.5 px-3">Rule Name</th>
                        <th className="py-2.5 px-3">Code</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Method</th>
                        <th className="py-2.5 px-3 text-right">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {rules.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                          <td className="py-2.5 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            #{r.sequence}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">{r.name}</td>
                          <td className="py-2.5 px-3 font-mono text-indigo-900 dark:text-indigo-300 text-2xs">{r.code}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-2xs font-semibold ${
                                r.category === 'Deduction'
                                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                                  : r.category === 'Allowance'
                                  ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300'
                                  : r.category === 'Basic'
                                  ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300'
                              }`}
                            >
                              {r.category}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 capitalize">{r.computation_method}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900 dark:text-slate-100">
                            {r.computation_method === 'fixed'
                              ? formatCurrency(r.fixed_amount ?? 0)
                              : r.computation_method === 'percentage'
                              ? `${r.percentage}% of ${r.base_field || 'wage'}`
                              : 'Formula'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <Pagination
                    currentPage={currentPage}
                    totalPages={Math.max(1, Math.ceil(rules.length / itemsPerPage))}
                    totalItems={rules.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={(size) => {
                      setItemsPerPage(size);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Structure Modal */}
      <Modal
        isOpen={isStructModalOpen}
        onClose={() => setIsStructModalOpen(false)}
        title="Create Salary Structure"
        description="Defines a collection of sequenced salary calculation rules"
        maxWidth="md"
      >
        <form onSubmit={handleCreateStructure} className="space-y-4">
          <Input
            label="Structure Name"
            placeholder="e.g. Executive & Management Structure"
            value={structName}
            onChange={(e) => setStructName(e.target.value)}
            required
          />

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="structActive"
              checked={structActive}
              onChange={(e) => setStructActive(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="structActive" className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Active Structure (Available for contract assignment)
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setIsStructModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={submittingStruct}>
              Create Structure
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Rule Modal */}
      <Modal
        isOpen={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
        title="Add Salary Rule to Structure"
        description={`Define a formula or fixed component for "${selectedStructure?.name}"`}
        maxWidth="lg"
      >
        <form onSubmit={handleCreateRule} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Rule Name"
              placeholder="e.g. Basic Wage / House Rent Allowance"
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              required
            />

            <Input
              label="Rule Code (Uppercase)"
              placeholder="e.g. BASIC / HRA / PF"
              value={ruleCode}
              onChange={(e) => setRuleCode(e.target.value.toUpperCase())}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Category"
              value={ruleCategory}
              onChange={(e) => setRuleCategory(e.target.value as any)}
              options={[
                { value: 'Basic', label: 'Basic' },
                { value: 'Allowance', label: 'Allowance (+)' },
                { value: 'Deduction', label: 'Deduction (-)' },
              ]}
            />

            <Input
              label="Sequence Order (10, 20, 30...)"
              type="number"
              value={ruleSequence}
              onChange={(e) => setRuleSequence(Number(e.target.value))}
              required
              helperText="Determines execution order (must be unique in structure)"
            />
          </div>

          <Select
            label="Computation Method"
            value={ruleCompMethod}
            onChange={(e) => setRuleCompMethod(e.target.value as any)}
            options={[
              { value: 'fixed', label: 'Fixed Amount (₹)' },
              { value: 'percentage', label: 'Percentage (%) of Base' },
              { value: 'formula', label: 'Dynamic Formula' },
            ]}
          />

          {ruleCompMethod === 'fixed' && (
            <Input
              label="Fixed Amount (₹)"
              type="number"
              placeholder="e.g. 5000"
              value={ruleFixedAmount}
              onChange={(e) => setRuleFixedAmount(Number(e.target.value))}
              required
            />
          )}

          {ruleCompMethod === 'percentage' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Percentage (%)"
                type="number"
                placeholder="e.g. 15"
                value={rulePercentage}
                onChange={(e) => setRulePercentage(Number(e.target.value))}
                required
              />
              <Input
                label="Base Field"
                value={ruleBaseField}
                onChange={(e) => setRuleBaseField(e.target.value)}
                placeholder="e.g. wage, basic"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsRuleModalOpen(false)} disabled={submittingRule}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submittingRule}>
              Save Rule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
