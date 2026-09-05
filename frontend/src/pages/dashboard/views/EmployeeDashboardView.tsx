import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  CalendarDays,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  UserCheck,
  TrendingUp,
  FileText
} from 'lucide-react';
import { EmployeeDashboard } from '../../../types';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { formatCurrency } from '../../../utils/currency';
import { payrollApi } from '../../../api/payroll';

interface EmployeeDashboardViewProps {
  userName: string;
  primaryRole: string;
  data: EmployeeDashboard | null;
}

export const EmployeeDashboardView: React.FC<EmployeeDashboardViewProps> = ({
  userName,
  primaryRole,
  data,
}) => {
  const navigate = useNavigate();

  const presentDays = data?.attendanceThisMonth.present ?? 0;
  const totalDays = data?.attendanceThisMonth.totalDays ?? 22;
  const latePunches = data?.attendanceThisMonth.late ?? 0;
  const missingCheckouts = data?.attendanceThisMonth.missingCheckouts ?? 0;
  const leaveBalances = data?.leaveBalances || [];
  const recentRequests = data?.recentTimeOffRequests || [];
  const recentPayslips = data?.recentPayslips || [];
  const latestPayslip = recentPayslips[0];

  const totalRemainingLeaves = leaveBalances.reduce(
    (acc, b) => acc + (b.remaining || 0),
    0
  );

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      
      {/* 1. Header: Personal Self-Service Welcome */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-7 rounded-3xl border border-slate-800 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-2xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-teal-400" />
              <span>Personal Self-Service Hub</span>
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-2xs text-slate-300 font-mono">Role: {primaryRole}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Good day, {userName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-normal">
            Here's your workday at a glance — attendance tracking, leave quotas, and salary statements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/attendance')}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold cursor-pointer"
            icon={<Clock className="w-4 h-4 text-teal-300" />}
          >
            Log Punch
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/time-off')}
            className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs cursor-pointer shadow-lg shadow-teal-500/20"
            icon={<CalendarDays className="w-4 h-4 text-slate-950" />}
          >
            Request Time Off
          </Button>
        </div>
      </div>

      {/* 2. Main Feature: Workday Progress Rail */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-200 dark:border-teal-800/60 font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Today's Workday Schedule & Progress
              </h2>
              <p className="text-2xs text-slate-500 dark:text-slate-400">
                Live shift tracking based on active working schedule
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 text-xs font-bold font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Shift Active</span>
            </span>
          </div>
        </div>

        {/* Progress Rail Track */}
        <div className="p-5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono font-bold">
            <div className="flex items-center gap-1.5 text-slate-900 dark:text-white">
              <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>09:00 AM (Check In)</span>
            </div>
            <div className="text-teal-700 dark:text-teal-400 font-financial font-black text-sm">
              Worked: ~6h 15m
            </div>
            <div className="text-slate-500 dark:text-slate-400">
              06:00 PM (Scheduled Exit)
            </div>
          </div>

          <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden relative">
            <div
              className="bg-linear-to-r from-teal-500 via-indigo-500 to-indigo-600 h-full rounded-full transition-all duration-700"
              style={{ width: '70%' }}
            />
          </div>

          <div className="flex items-center justify-between text-2xs text-slate-500 dark:text-slate-400 pt-1">
            <span>Standard Working Hours: 8h 00m</span>
            <span>Estimated Out: 06:00 PM</span>
          </div>
        </div>
      </div>

      {/* 3. Operational Strip: Attendance & Quotas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Present Days */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 border-t-4 border-t-emerald-500 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">Present This Month</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-financial">
              {presentDays} Days
            </div>
            <div className="text-2xs text-emerald-700 dark:text-emerald-400 font-semibold mt-1">
              Out of {totalDays} scheduled working days
            </div>
          </div>
        </div>

        {/* Late Entries */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 border-t-4 border-t-amber-500 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">Late Punches</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-financial">
              {latePunches}
            </div>
            <div className="text-2xs text-amber-700 dark:text-amber-400 font-semibold mt-1">
              Late punch-ins logged this month
            </div>
          </div>
        </div>

        {/* Missing Checkouts */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 border-t-4 border-t-rose-500 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">Missing Check-Outs</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-financial">
              {missingCheckouts}
            </div>
            <div className="text-2xs text-rose-700 dark:text-rose-400 font-semibold mt-1">
              Punches awaiting evening sign-out
            </div>
          </div>
        </div>

        {/* Remaining Leaves */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 border-t-4 border-t-teal-500 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">Remaining Quota</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-financial">
              {totalRemainingLeaves} Days
            </div>
            <div className="text-2xs text-teal-700 dark:text-teal-400 font-semibold mt-1">
              Across {leaveBalances.length} active leave types
            </div>
          </div>
        </div>
      </div>

      {/* 4. Split Grid: Leave Quota Rails & Financial Payslip Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Leave Balances & Allocations */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>My Leave Quota Balances</span>
              </h3>
              <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
                Available vs consumed days per category
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/time-off')}
              className="text-2xs py-1 cursor-pointer"
            >
              Apply Leave
            </Button>
          </div>

          {leaveBalances.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              No leave balances allocated yet.
            </div>
          ) : (
            <div className="space-y-3.5">
              {leaveBalances.map((bal) => {
                const pct = bal.allocated > 0 ? Math.round((bal.taken / bal.allocated) * 100) : 0;
                return (
                  <div
                    key={bal.typeName}
                    className="p-4 bg-slate-50/90 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {bal.typeName}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-financial font-extrabold text-teal-700 dark:text-teal-400">
                          {bal.remaining} / {bal.allocated} days available
                        </span>
                      </div>
                    </div>
                    
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-linear-to-r from-teal-500 to-indigo-600 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-2xs text-slate-400">
                      <span>{bal.taken} days consumed</span>
                      <span>{bal.remaining} days remaining</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Recent Applications Feed */}
          {recentRequests.length > 0 && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                Recent Leave Applications
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                {recentRequests.slice(0, 3).map((r, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 flex items-center justify-between text-xs bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {r.typeName}
                      </div>
                      <div className="text-2xs text-slate-500 dark:text-slate-400 font-mono">
                        {r.dateFrom} to {r.dateTo} ({r.duration} days)
                      </div>
                    </div>
                    <Badge variant={r.status === 'validate' ? 'validate' : r.status === 'refused' ? 'refused' : 'draft'}>
                      {r.status === 'validate' ? 'Approved' : r.status === 'refused' ? 'Refused' : 'Pending'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Latest Payslip Financial Statement & History */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>My Latest Payslip & Statements</span>
              </h3>
              <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
                Official salary statement breakdown and PDF archives
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/payroll/payslips')}
              className="text-2xs py-1 cursor-pointer"
            >
              All Payslips
            </Button>
          </div>

          {/* Highlighted Latest Payslip Hero Block */}
          {latestPayslip ? (
            <div className="p-5 rounded-2xl bg-linear-to-br from-indigo-950 via-slate-900 to-slate-950 text-white border border-indigo-900/60 space-y-4 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-2xs font-mono px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold uppercase">
                  Latest Disbursal
                </span>
                <Badge variant={latestPayslip.status === 'paid' ? 'paid' : 'validated'}>
                  {latestPayslip.status}
                </Badge>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <div className="text-2xs text-slate-300 uppercase tracking-wider font-semibold">
                    Net Take-Home Pay
                  </div>
                  <div className="text-3xl font-black font-financial text-emerald-400 tracking-tight mt-1">
                    {formatCurrency(latestPayslip.net)}
                  </div>
                </div>

                <a
                  href={payrollApi.getPayslipPdfUrl(latestPayslip.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>View Payslip</span>
                </a>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-2xs text-slate-400">
                <span>Payslip #{latestPayslip.id}</span>
                <span>Direct Bank Disbursal</span>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              No payslips generated for your profile yet.
            </div>
          )}

          {/* Recent History List */}
          {recentPayslips.length > 1 && (
            <div className="space-y-3 pt-2">
              <div className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                Previous Salary Statements
              </div>
              <div className="space-y-2.5">
                {recentPayslips.slice(1, 4).map((ps) => (
                  <div
                    key={ps.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100/80 dark:hover:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div>
                      <div className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                        Payslip #{ps.id}
                      </div>
                      <div className="text-2xs text-slate-500 dark:text-slate-400">
                        Net: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(ps.net)}</strong>
                      </div>
                    </div>
                    <a
                      href={payrollApi.getPayslipPdfUrl(ps.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-2xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      PDF <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
};
