import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircleDollarSign, Plus, ChevronRight, Calendar, Users, AlertTriangle } from 'lucide-react';
import { payrollApi } from '../../api/payroll';
import { Payrun, SalaryStructure } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import { PayrunWizardModal } from './PayrunWizardModal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const PayrunsPage: React.FC = () => {
  const [payruns, setPayruns] = useState<Payrun[]>([]);
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

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
      setPayruns(runList || []);
      setStructures(structList || []);
    } catch (err: any) {
      error(err.message || 'Failed to load payruns.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CircleDollarSign className="w-6 h-6 text-[#714B67]" />
            <span>Payroll Runs (Payruns)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
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

      {/* Payrun List */}
      {loading ? (
        <Spinner label="Loading payrun batches..." />
      ) : payruns.length === 0 ? (
        <EmptyState
          title="No Payruns Found"
          description="Launch the 2-Step Payrun Wizard to calculate and generate draft payslips."
          actionLabel={isHRPUPlus() ? 'Launch Payrun Wizard' : undefined}
          onAction={() => setIsWizardOpen(true)}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
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
              <tbody className="divide-y divide-slate-100">
                {payruns.map((pr) => (
                  <tr
                    key={pr.id}
                    onClick={() => navigate(`/payroll/payruns/${pr.id}`)}
                    className="hover:bg-purple-50/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">
                        {pr.name || `Payrun #${pr.id}`}
                      </div>
                      <div className="text-2xs text-slate-400 font-mono">ID: #{pr.id}</div>
                    </td>
                    <td className="py-3 px-4 text-purple-900 font-semibold">
                      {pr.structure_name || `Structure #${pr.structure_id}`}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {pr.period_start} → {pr.period_end}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {pr.employee_count ?? pr.payslips?.length ?? '—'} Employees
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                      {pr.total_net ? `$${pr.total_net.toLocaleString()}` : '—'}
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
                      <span className="text-xs font-semibold text-[#714B67] hover:underline">
                        Open Processing →
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
