import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CircleDollarSign,
  ArrowLeft,
  Calculator,
  CheckCircle2,
  Send,
  CreditCard,
  AlertTriangle,
  Lock,
  Layers,
  Calendar,
  FileSpreadsheet,
} from 'lucide-react';
import { payrollApi } from '../../api/payroll';
import { Payrun, PayslipSummary } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/currency';

export const PayrunDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isHRPUPlus, isHRPMPlus } = useAuth();
  const { success, error, warning } = useToast();

  const [payrun, setPayrun] = useState<Payrun | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadPayrun = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await payrollApi.getPayrunById(id);
      setPayrun(data);
    } catch (err: any) {
      error(err.message || 'Failed to load payrun details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayrun();
  }, [id]);

  const handleCompute = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const updated = await payrollApi.computePayrun(id);
      success('Payrun computed successfully. Salary rules applied in strict sequence order.');
      setPayrun(updated);
    } catch (err: any) {
      error(err.message || 'Failed to compute payrun.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const updated = await payrollApi.validatePayrun(id);
      success('Payrun validated and approved by Payroll Manager.');
      setPayrun(updated);
    } catch (err: any) {
      error(err.message || 'Failed to validate payrun.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const updated = await payrollApi.markPaidPayrun(id);
      success('Payrun marked as Paid. Records are now locked against further edits.');
      setPayrun(updated);
    } catch (err: any) {
      error(err.message || 'Failed to mark payrun as paid.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendPayslips = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await payrollApi.sendPayslips(id);
      success('Payslip PDFs generated and emailed to all employees in the run.');
    } catch (err: any) {
      error(err.message || 'Failed to dispatch payslips.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <Spinner label="Loading payrun processing state..." />;
  }

  if (!payrun) {
    return (
      <EmptyState
        title="Payrun Not Found"
        description="The requested payrun record could not be loaded."
        actionLabel="Back to Payruns"
        onAction={() => navigate('/payroll/payruns')}
      />
    );
  }

  const steps = [
    { key: 'draft', label: 'Draft' },
    { key: 'computed', label: 'Computed' },
    { key: 'validated', label: 'Validated' },
    { key: 'paid', label: 'Paid' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === payrun.status);
  const payslipsList = payrun.payslips || [];
  const warningsList = payrun.warnings || [];

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      {/* Top Bar with Stepper & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/payroll/payruns')}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Payruns
          </Button>
          <span className="text-slate-400 dark:text-slate-600">/</span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {payrun.name || `Payrun Batch #${payrun.id}`}
          </h1>
          <Badge
            variant={
              payrun.status === 'paid'
                ? 'paid'
                : payrun.status === 'validated'
                ? 'validated'
                : payrun.status === 'computed'
                ? 'computed'
                : 'draft'
            }
          >
            {payrun.status.toUpperCase()}
          </Badge>
        </div>

        {/* WORKFLOW ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-2">
          {payrun.status === 'draft' && (
            <Button
              variant="primary"
              size="sm"
              icon={<Calculator className="w-4 h-4" />}
              onClick={handleCompute}
              isLoading={actionLoading}
            >
              Compute Payslips
            </Button>
          )}

          {/* Check Maker-Checker condition: same user who computed cannot validate */}
          {payrun.status === 'computed' && isHRPMPlus() && (() => {
            const computedByVal = payrun.computed_by ?? (payrun as any).computedBy;
            const isMakerCheckerBlocked = Boolean(
              computedByVal && user?.id && String(computedByVal) === String(user.id)
            );

            return (
              <div className="relative group">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<CheckCircle2 className="w-4 h-4" />}
                  onClick={handleValidate}
                  isLoading={actionLoading}
                  disabled={isMakerCheckerBlocked}
                  className={isMakerCheckerBlocked ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  Validate Payrun
                </Button>
                {isMakerCheckerBlocked && (
                  <div className="hidden group-hover:block absolute right-0 top-full mt-2 z-30 w-72 p-2.5 bg-slate-900 text-white text-2xs rounded-xl shadow-xl border border-slate-700">
                    <div className="font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Maker-Checker Segregation
                    </div>
                    You computed this payrun. To enforce audit compliance and segregation of duties, another HR Payroll Manager or Admin must review and validate it.
                  </div>
                )}
              </div>
            );
          })()}

          {payrun.status === 'validated' && isHRPMPlus() && (
            <Button
              variant="primary"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
              icon={<CreditCard className="w-4 h-4" />}
              onClick={handleMarkPaid}
              isLoading={actionLoading}
            >
              Mark as Paid
            </Button>
          )}

          {(payrun.status === 'validated' || payrun.status === 'paid') && (
            <Button
              variant="outline"
              size="sm"
              icon={<Send className="w-4 h-4 text-teal-600 dark:text-teal-400" />}
              onClick={handleSendPayslips}
              isLoading={actionLoading}
            >
              Send Payslips (Email/PDF)
            </Button>
          )}

          {payrun.status === 'paid' && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
              <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Locked / Paid
            </div>
          )}
        </div>
      </div>

      {/* VISIBLE STATUS PROGRESSION STEPPER */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs">
        <div className="text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">
          Payrun Workflow State Progression
        </div>
        <div className="relative flex items-center justify-between">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 dark:bg-slate-800 z-0" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-teal-600 dark:bg-teal-500 transition-all duration-500 z-0"
            style={{
              width: `${(Math.max(0, currentStepIndex) / (steps.length - 1)) * 100}%`,
            }}
          />

          {steps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div key={step.key} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-xs ${
                    isCurrent
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-950'
                      : isCompleted
                      ? 'bg-teal-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-2 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>
                <span
                  className={`text-xs mt-2 font-semibold ${
                    isCurrent ? 'text-indigo-600 dark:text-indigo-400' : isCompleted ? 'text-teal-800 dark:text-teal-300' : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* WARNINGS ALERT BOX */}
      {warningsList.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs space-y-2 animate-fade-in shadow-xs">
          <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Pre-Validation Operational Warnings ({warningsList.length})</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-2xs text-amber-900/90 dark:text-amber-300/90 pl-1">
            {warningsList.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* MAKER-CHECKER COMPLIANCE BANNER */}
      {payrun.status === 'computed' &&
        Boolean(
          (payrun.computed_by ?? (payrun as any).computedBy) &&
            user?.id &&
            String(payrun.computed_by ?? (payrun as any).computedBy) === String(user.id)
        ) && (
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-blue-900 dark:text-blue-200 text-xs flex items-start gap-3 animate-fade-in shadow-xs">
            <AlertTriangle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-blue-950 dark:text-blue-100">
                Maker-Checker Segregation of Duties Active
              </span>
              <p className="text-2xs text-blue-800 dark:text-blue-300 leading-relaxed">
                You computed this payrun batch. To maintain strict financial controls and regulatory audit integrity, this batch must be validated and authorized by a different HR Payroll Manager or Administrator.
              </p>
            </div>
          </div>
        )}

      {/* Payrun Metadata Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4! shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-800/60">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xs font-semibold uppercase text-slate-400 dark:text-slate-500">Salary Structure</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {payrun.structure_name || `Structure #${payrun.structure_id}`}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4! shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 flex items-center justify-center border border-teal-100 dark:border-teal-800/60">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xs font-semibold uppercase text-slate-400 dark:text-slate-500">Payroll Period</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {payrun.period_start} to {payrun.period_end}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4! shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/60">
              <CircleDollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xs font-semibold uppercase text-slate-400 dark:text-slate-500">Total Net Amount</div>
              <div className="text-base font-extrabold text-emerald-800 dark:text-emerald-300 font-financial">
                {payrun.total_net ? formatCurrency(payrun.total_net) : 'Pending Computation'}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Itemized Payslips Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Generated Payslips ({payslipsList.length})</span>
          </h3>
        </div>

        {payslipsList.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
            No payslips attached to this batch.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Worked Days</th>
                  <th className="py-3 px-4">Basic Wage</th>
                  <th className="py-3 px-4">Allowances</th>
                  <th className="py-3 px-4">Deductions</th>
                  <th className="py-3 px-4">Net Salary</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">View Breakdown</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payslipsList.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {p.employee_name || `Employee #${p.employee_id}`}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{p.worked_days !== undefined ? `${p.worked_days} Days` : '22 Days'}</td>
                    <td className="py-3 px-4 font-financial text-slate-800 dark:text-slate-200">{formatCurrency(p.basic)}</td>
                    <td className="py-3 px-4 font-financial text-teal-700 dark:text-teal-400">
                      +{formatCurrency(p.allowances || 0)}
                    </td>
                    <td className="py-3 px-4 font-financial text-rose-700 dark:text-rose-400">
                      -{formatCurrency(p.deductions || 0)}
                    </td>
                    <td className="py-3 px-4 font-financial font-bold text-emerald-800 dark:text-emerald-300 text-sm">
                      {formatCurrency(p.net)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          p.status === 'paid'
                            ? 'paid'
                            : p.status === 'validated'
                            ? 'validated'
                            : p.status === 'computed'
                            ? 'computed'
                            : 'draft'
                        }
                      >
                        {p.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/payroll/payslips/${p.id}`}
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        View Breakdown →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayrunDetailPage;
