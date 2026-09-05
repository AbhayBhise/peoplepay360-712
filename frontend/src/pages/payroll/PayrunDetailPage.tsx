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

export const PayrunDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isHRPUPlus, isHRPMPlus } = useAuth();
  const { success, error, warning } = useToast();

  const [payrun, setPayrun] = useState<Payrun | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadPayrun = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await payrollApi.getPayrunById(Number(id));
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
      const updated = await payrollApi.computePayrun(Number(id));
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
      const updated = await payrollApi.validatePayrun(Number(id));
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
      const updated = await payrollApi.markPaidPayrun(Number(id));
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
      await payrollApi.sendPayslips(Number(id));
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
    <div className="space-y-6 animate-fade-in">
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
          <span className="text-slate-400">/</span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
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

          {payrun.status === 'computed' && isHRPMPlus() && (
            <Button
              variant="secondary"
              size="sm"
              icon={<CheckCircle2 className="w-4 h-4" />}
              onClick={handleValidate}
              isLoading={actionLoading}
            >
              Validate Payrun
            </Button>
          )}

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
              icon={<Send className="w-4 h-4 text-teal-600" />}
              onClick={handleSendPayslips}
              isLoading={actionLoading}
            >
              Send Payslips (Email/PDF)
            </Button>
          )}

          {payrun.status === 'paid' && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              Locked / Paid
            </div>
          )}
        </div>
      </div>

      {/* VISIBLE STATUS PROGRESSION STEPPER */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="text-2xs font-bold uppercase tracking-wider text-slate-400 mb-4">
          Payrun Workflow State Progression
        </div>
        <div className="relative flex items-center justify-between">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 z-0" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-teal-600 transition-all duration-500 z-0"
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
                      ? 'bg-[#714B67] text-white ring-4 ring-purple-100'
                      : isCompleted
                      ? 'bg-teal-600 text-white'
                      : 'bg-white text-slate-400 border-2 border-slate-200'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>
                <span
                  className={`text-xs mt-2 font-semibold ${
                    isCurrent ? 'text-[#714B67]' : isCompleted ? 'text-teal-800' : 'text-slate-400'
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
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2 animate-fade-in shadow-xs">
          <div className="flex items-center gap-2 font-bold text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Pre-Validation Operational Warnings ({warningsList.length})</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-2xs text-amber-900/90 pl-1">
            {warningsList.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Payrun Metadata Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4! shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#714B67] flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xs font-semibold uppercase text-slate-400">Salary Structure</div>
              <div className="text-sm font-bold text-slate-900">
                {payrun.structure_name || `Structure #${payrun.structure_id}`}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4! shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xs font-semibold uppercase text-slate-400">Payroll Period</div>
              <div className="text-sm font-bold text-slate-900">
                {payrun.period_start} to {payrun.period_end}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4! shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CircleDollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xs font-semibold uppercase text-slate-400">Total Net Amount</div>
              <div className="text-base font-extrabold text-emerald-800 font-mono">
                {payrun.total_net ? `$${payrun.total_net.toLocaleString()}` : 'Pending Computation'}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Itemized Payslips Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[#714B67]" />
            <span>Generated Payslips ({payslipsList.length})</span>
          </h3>
        </div>

        {payslipsList.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No payslips attached to this batch.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
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
              <tbody className="divide-y divide-slate-100">
                {payslipsList.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {p.employee_name || `Employee #${p.employee_id}`}
                    </td>
                    <td className="py-3 px-4">{p.worked_days ?? '—'}</td>
                    <td className="py-3 px-4 font-mono">${p.basic?.toLocaleString() ?? '—'}</td>
                    <td className="py-3 px-4 font-mono text-teal-700">
                      +${p.allowances?.toLocaleString() ?? 0}
                    </td>
                    <td className="py-3 px-4 font-mono text-rose-700">
                      -${p.deductions?.toLocaleString() ?? 0}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-800 text-sm">
                      ${p.net?.toLocaleString() ?? '—'}
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
                        className="text-xs font-semibold text-[#714B67] hover:underline"
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
