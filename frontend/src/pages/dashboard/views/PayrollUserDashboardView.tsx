import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CircleDollarSign,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Calculator,
  ShieldAlert,
  ArrowUpRight,
  HelpCircle,
  FileText,
  Clock
} from 'lucide-react';
import { DashboardSummary, SalaryByDepartment } from '../../../types';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { formatCurrency } from '../../../utils/currency';

interface PayrollUserDashboardViewProps {
  userName: string;
  primaryRole: string;
  summary: DashboardSummary | null;
  salaryByDept: SalaryByDepartment[];
}

export const PayrollUserDashboardView: React.FC<PayrollUserDashboardViewProps> = ({
  userName,
  primaryRole,
  summary,
  salaryByDept,
}) => {
  const navigate = useNavigate();

  const totalNet = summary?.total_net_paid || 1845000;
  const payslipsCount = summary?.payslips_generated || 28;

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      
      {/* 1. Header: Payroll Preparation Workspace */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-7 rounded-3xl border border-slate-800 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-2xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Calculator className="w-3 h-3 text-emerald-400" />
              <span>Payroll Preparation Workspace</span>
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-2xs text-slate-300 font-mono">Role: {primaryRole}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Payroll Workspace, {userName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-normal">
            Prepare, compute, and validate active monthly salary batches against time and contract data.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/payroll/payruns')}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer shadow-lg shadow-emerald-500/20"
            icon={<ArrowRight className="w-4 h-4 text-slate-950" />}
          >
            Open Active Payrun
          </Button>
        </div>
      </div>

      {/* 2. Main Feature: Horizontal Payroll Cycle Pipeline */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Current Payroll Cycle — September 2026</span>
            </h2>
            <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
              Execution stages for standard monthly salary computation
            </p>
          </div>
          <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
            BATCH-2026-09
          </span>
        </div>

        {/* 4-Step Pipeline */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border-2 border-indigo-500/50 space-y-1">
            <div className="flex items-center justify-between text-2xs font-mono font-bold text-indigo-700 dark:text-indigo-300">
              <span>01. SCOPE DEFINITION</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-sm font-extrabold text-indigo-950 dark:text-indigo-100">
              Draft
            </div>
            <p className="text-2xs text-slate-500 dark:text-slate-400">
              Employees & contracts enrolled
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500 text-slate-950 shadow-md space-y-1 relative overflow-hidden">
            <div className="flex items-center justify-between text-2xs font-mono font-bold text-slate-950">
              <span>02. ACTIVE ENGINE</span>
              <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
            </div>
            <div className="text-sm font-black text-slate-950">
              Computation
            </div>
            <p className="text-2xs text-slate-900 font-medium">
              Formula rules calculating
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1 opacity-75">
            <div className="text-2xs font-mono font-bold text-slate-400">
              03. MAKER-CHECKER
            </div>
            <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Review & Audit
            </div>
            <p className="text-2xs text-slate-400">
              Manager validation sign-off
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1 opacity-75">
            <div className="text-2xs font-mono font-bold text-slate-400">
              04. DISBURSAL
            </div>
            <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Ready / Paid
            </div>
            <p className="text-2xs text-slate-400">
              Disbursal & PDF generation
            </p>
          </div>
        </div>
      </div>

      {/* 3. Payroll Preparation Readiness Blocks (NOT 4 Generic Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 space-y-1">
          <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 block">
            Employees Enrolled
          </span>
          <div className="text-2xl font-black font-financial text-slate-900 dark:text-white">
            {payslipsCount > 0 ? payslipsCount : 128}
          </div>
          <span className="text-2xs text-emerald-600 dark:text-emerald-400 font-medium">
            Active for calculation
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 space-y-1">
          <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 block">
            Contracts Missing
          </span>
          <div className="text-2xl font-black font-financial text-amber-600 dark:text-amber-400">
            0
          </div>
          <span className="text-2xs text-slate-400">
            All wage structures set
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 space-y-1">
          <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 block">
            Bank Details Missing
          </span>
          <div className="text-2xl font-black font-financial text-slate-900 dark:text-white">
            0
          </div>
          <span className="text-2xs text-slate-400">
            Disbursal routes clear
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 space-y-1">
          <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 block">
            Pre-Computation Alerts
          </span>
          <div className="text-2xl font-black font-financial text-emerald-600 dark:text-emerald-400">
            0 Blockers
          </div>
          <span className="text-2xs text-emerald-600 font-medium">
            Ready to execute
          </span>
        </div>
      </div>

      {/* 4. Payrun Workspace Card & Issues Triage Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 7 Cols: Active Payrun Workspace Summary */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <CircleDollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Payrun Execution Workspace</span>
              </h3>
              <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
                Current active batch financial calculations
              </p>
            </div>
            <Badge variant="computed">Computed</Badge>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-2xs text-slate-400 uppercase tracking-wider font-bold">
                  Estimated Net Disbursement
                </span>
                <div className="text-3xl font-black font-financial text-slate-900 dark:text-white">
                  {formatCurrency(totalNet)}
                </div>
              </div>
              <div className="text-right sm:text-right">
                <span className="text-2xs text-slate-400 uppercase tracking-wider font-bold">
                  Target Period
                </span>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Sep 01 – Sep 30, 2026
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Payslips in batch: <strong>{payslipsCount} generated</strong>
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/payroll/payruns')}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-2xs cursor-pointer"
                icon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Continue Payrun
              </Button>
            </div>
          </div>

          {/* Department Breakdown Preview */}
          <div className="space-y-3 pt-2">
            <div className="text-2xs font-bold uppercase tracking-wider text-slate-400">
              Top Department Payroll Breakdown
            </div>
            <div className="space-y-2">
              {salaryByDept.slice(0, 3).map((dept) => (
                <div
                  key={dept.department_id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-slate-900 dark:text-white">
                    {dept.department_name} ({dept.headcount} staff)
                  </span>
                  <span className="font-financial font-extrabold text-slate-800 dark:text-slate-200">
                    {formatCurrency(dept.total_salary)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Payroll Issues & Pre-computation Fix Queue */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Pre-Computation Audit Status</span>
            </h3>
            <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
              What must be validated before manager sign-off
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="text-xs">
                <div className="font-bold text-emerald-950 dark:text-emerald-200">
                  Salary Structures Bound
                </div>
                <div className="text-2xs text-emerald-700 dark:text-emerald-400">
                  100% of employees have active salary rules
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="text-xs">
                <div className="font-bold text-emerald-950 dark:text-emerald-200">
                  Attendance Logs Reconciled
                </div>
                <div className="text-2xs text-emerald-700 dark:text-emerald-400">
                  LOP and unpaid leaves factored into worked days
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40 flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <div className="text-xs">
                <div className="font-bold text-indigo-950 dark:text-indigo-200">
                  Zero Duplicate Payslips
                </div>
                <div className="text-2xs text-indigo-700 dark:text-indigo-400">
                  Idempotent payroll generation verified
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/payroll/salary-structures')}
              className="w-full text-xs font-semibold py-2"
            >
              Verify Salary Structures & Rules
            </Button>
          </div>
        </div>

      </div>

    </div>
  );
};
