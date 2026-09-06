import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircleDollarSign, Plus, ChevronRight, Calendar, Users, AlertTriangle } from 'lucide-react';
import { payrollApi } from '../../api/payroll';
import { Payrun, SalaryStructure } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Pagination } from '../../components/common/Pagination';
import { PayrunWizardModal } from './PayrunWizardModal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/currency';
import { extractItems } from '../../utils/pagination';

export const PayrunsPage: React.FC = () => {
  const [payruns, setPayruns] = useState<Payrun[]>([]);
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Filter and search state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'computed' | 'validated' | 'paid'>('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { isHRPUPlus } = useAuth();
  const { error } = useToast();
  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    try {
      const [runList, structList] = await Promise.all([
        payrollApi.getPayruns().catch(() => []),
        payrollApi.getStructures().catch(() => []),
      ]);
      setPayruns(extractItems<Payrun>(runList));
      setStructures(extractItems<SalaryStructure>(structList));
    } catch (err: any) {
      error(err.message || 'Failed to load payruns.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const filteredPayruns = payruns.filter((pr) => {
    if (statusFilter !== 'all' && pr.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    const name = (pr.name || '').toLowerCase();
    const struct = (pr.structure_name || '').toLowerCase();
    const id = String(pr.id).toLowerCase();
    return name.includes(q) || struct.includes(q) || id.includes(q);
  });

  const totalDisbursed = payruns.filter(p => p.status === 'paid').reduce((sum, p) => sum + (Number(p.total_net) || 0), 0);
  const validatedCount = payruns.filter(p => p.status === 'validated').length;
  const inProgressCount = payruns.filter(p => p.status === 'draft' || p.status === 'computed').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <CircleDollarSign className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Payroll Runs (Payruns)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Execute batch payroll computation, review line-item rules, validate and disburse salary
          </p>
        </div>

        {isHRPUPlus() && (
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsWizardOpen(true)}
          >
            Launch Payrun Wizard
          </Button>
        )}
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          onClick={() => setStatusFilter('all')}
          className={`bg-white dark:bg-slate-900 p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'border-indigo-600 ring-2 ring-indigo-500/20 dark:border-indigo-500'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="text-2xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Batches</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{payruns.length}</div>
          <div className="text-2xs text-slate-400 mt-1">Payroll periods</div>
        </div>

        <div
          onClick={() => setStatusFilter('paid')}
          className={`bg-white dark:bg-slate-900 p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'paid'
              ? 'border-teal-600 ring-2 ring-teal-500/20 dark:border-teal-500'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="text-2xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">Total Paid Out</div>
          <div className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-1">{payruns.filter(p => p.status === 'paid').length}</div>
          <div className="text-2xs text-teal-500/80 mt-1">{formatCurrency(totalDisbursed)}</div>
        </div>

        <div
          onClick={() => setStatusFilter('validated')}
          className={`bg-white dark:bg-slate-900 p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'validated'
              ? 'border-blue-600 ring-2 ring-blue-500/20 dark:border-blue-500'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="text-2xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Validated Batches</div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{validatedCount}</div>
          <div className="text-2xs text-blue-500/80 mt-1">Ready for finance release</div>
        </div>

        <div
          onClick={() => setStatusFilter('computed')}
          className={`bg-white dark:bg-slate-900 p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'computed' || statusFilter === 'draft'
              ? 'border-amber-600 ring-2 ring-amber-500/20 dark:border-amber-500'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="text-2xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">In Computation / Draft</div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{inProgressCount}</div>
          <div className="text-2xs text-amber-500/80 mt-1">Awaiting review/validation</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <input
            type="text"
            placeholder="Search payrun batches by name, structure, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:max-w-md px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {(['all', 'draft', 'computed', 'validated', 'paid'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer shrink-0 ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payrun List */}
      {loading ? (
        <Spinner label="Loading payrun batches..." />
      ) : filteredPayruns.length === 0 ? (
        <EmptyState
          title="No Payruns Found"
          description={search || statusFilter !== 'all' ? 'No batches match your filter criteria.' : 'Launch the 2-Step Payrun Wizard to calculate and generate draft payslips.'}
          actionLabel={isHRPUPlus() ? 'Launch Payrun Wizard' : undefined}
          onAction={() => setIsWizardOpen(true)}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Payrun Batch</th>
                  <th className="py-3 px-4">Salary Structure</th>
                  <th className="py-3 px-4">Payroll Period</th>
                  <th className="py-3 px-4">Employees</th>
                  <th className="py-3 px-4">Total Net Paid</th>
                  <th className="py-3 px-4">Status Progression</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPayruns.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((pr) => (
                  <tr
                    key={pr.id}
                    onClick={() => navigate(`/payroll/payruns/${pr.id}`)}
                    className="hover:bg-indigo-50/40 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {pr.name || `Payrun #${pr.id}`}
                      </div>
                      <div className="text-2xs text-slate-400 dark:text-slate-500 font-mono">ID: #{pr.id}</div>
                    </td>
                    <td className="py-3 px-4 text-indigo-900 dark:text-indigo-300 font-semibold">
                      {pr.structure_name || `Structure #${pr.structure_id}`}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {pr.period_start} → {pr.period_end}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {pr.employee_count ?? pr.payslips?.length ?? '—'} Employees
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {pr.total_net ? formatCurrency(pr.total_net) : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          pr.status === 'paid'
                            ? 'paid'
                            : pr.status === 'validated'
                            ? 'validated'
                            : pr.status === 'computed'
                            ? 'computed'
                            : 'draft'
                        }
                      >
                        {pr.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                        Open Processing →
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={Math.max(1, Math.ceil(filteredPayruns.length / itemsPerPage))}
            totalItems={filteredPayruns.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(size) => {
              setItemsPerPage(size);
              setCurrentPage(1);
            }}
          />
        </div>
      )}

      {/* Payrun Wizard Modal */}
      <PayrunWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        structures={structures}
        onSuccess={(created) => {
          navigate(`/payroll/payruns/${created.id}`);
        }}
      />
    </div>
  );
};
