import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CircleDollarSign,
  FileSpreadsheet,
  TrendingUp,
  CalendarDays,
  HeartPulse,
  Building2,
  Filter,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { dashboardApi } from '../../api/dashboard';
import { departmentsApi } from '../../api/departments';
import { payrollApi } from '../../api/payroll';
import {
  DashboardSummary,
  SalaryByDepartment,
  NetSalaryTrend,
  AttendanceOverview,
  Department,
  EmployeeDashboard,
} from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Spinner } from '../../components/common/Spinner';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/currency';

export const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [salaryByDept, setSalaryByDept] = useState<SalaryByDepartment[]>([]);
  const [netTrend, setNetTrend] = useState<NetSalaryTrend[]>([]);
  const [attendanceOverview, setAttendanceOverview] = useState<AttendanceOverview | null>(null);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employeeDashboard, setEmployeeDashboard] = useState<EmployeeDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [employeeType, setEmployeeType] = useState<string>('');

  const { user, isHRMPlus, isHRPUPlus } = useAuth();
  const { error } = useToast();
  const navigate = useNavigate();

  const loadDashboard = async () => {
    setLoading(true);
    try {
      if (!isHRMPlus()) {
        // 1. Employee: Only call GET /api/dashboard/me (all HRM+ endpoints 403 for employee)
        const myData = await dashboardApi.getMyDashboard();
        setEmployeeDashboard(myData);
      } else if (!isHRPUPlus()) {
        // 2. HR Manager: Call summary, attendance-overview, alerts (salary charts 403 for HR Manager)
        const filters = {
          period_start: periodStart || undefined,
          period_end: periodEnd || undefined,
          department_id: departmentId ? Number(departmentId) : undefined,
          employee_type: employeeType || undefined,
        };

        const [sum, depts, att, alertList] = await Promise.all([
          dashboardApi.getSummary(filters).catch(() => null),
          departmentsApi.getDepartments().catch(() => []),
          dashboardApi.getAttendanceOverview(filters).catch(() => null),
          dashboardApi.getAlerts().catch(() => []),
        ]);

        setSummary(sum);
        setDepartments(depts || []);
        setAttendanceOverview(att);
        setAlerts(alertList || []);
      } else {
        // 3. HR Payroll User / Manager / Admin: Full access to all endpoints
        const filters = {
          period_start: periodStart || undefined,
          period_end: periodEnd || undefined,
          department_id: departmentId ? Number(departmentId) : undefined,
          employee_type: employeeType || undefined,
        };

        const [sum, depts, deptSal, trend, att, alertList] = await Promise.all([
          dashboardApi.getSummary(filters).catch(() => null),
          departmentsApi.getDepartments().catch(() => []),
          dashboardApi.getSalaryByDepartment(filters).catch(() => []),
          dashboardApi.getNetSalaryTrend(filters).catch(() => []),
          dashboardApi.getAttendanceOverview(filters).catch(() => null),
          dashboardApi.getAlerts().catch(() => []),
        ]);

        setSummary(sum);
        setDepartments(depts || []);
        setSalaryByDept(deptSal || []);
        setNetTrend(trend || []);
        setAttendanceOverview(att);
        setAlerts(alertList || []);
      }
    } catch (err: any) {
      error(err.message || 'Failed to aggregate dashboard intelligence.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [periodStart, periodEnd, departmentId, employeeType]);

  const userName = user?.name || user?.email?.split('@')[0] || 'Team Member';
  const primaryRole = user?.roles?.[0] || 'EMPLOYEE';

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      {!isHRMPlus() ? (
        /* ========================================================================= */
        /* 1. EMPLOYEE PERSONAL WORKSPACE (GET /api/dashboard/me)                    */
        /* ========================================================================= */
        <>
          {/* Employee Welcome Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-2xs font-bold font-mono uppercase tracking-wider">
                  Employee Self-Service Hub
                </span>
                <span className="text-slate-500">·</span>
                <span className="text-2xs text-slate-300 font-medium">Role: {primaryRole}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome back, {userName}
              </h1>
              <p className="text-xs text-slate-300">
                Personal overview of your attendance activity, leave quota balances, and salary statements
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/attendance')}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs cursor-pointer"
                icon={<Clock className="w-4 h-4" />}
              >
                Log Punch
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/time-off')}
                className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs cursor-pointer"
                icon={<CalendarDays className="w-4 h-4 text-slate-950" />}
              >
                Request Leave
              </Button>
            </div>
          </div>

          {loading ? (
            <Spinner label="Loading your personal dashboard..." />
          ) : (
            <>
              {/* Employee 4 Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Present Days */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 border-t-4 border-t-emerald-500 p-5 shadow-xs flex flex-col justify-between hover-card-lift">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Present This Month</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/60">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-financial tracking-tight">
                      {employeeDashboard?.attendanceThisMonth.present ?? 0} Days
                    </div>
                    <div className="text-2xs text-emerald-700 dark:text-emerald-400 font-semibold mt-1">
                      Out of {employeeDashboard?.attendanceThisMonth.totalDays ?? 0} scheduled working days
                    </div>
                  </div>
                </div>

                {/* 2. Late Arrivals */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 border-t-4 border-t-amber-500 p-5 shadow-xs flex flex-col justify-between hover-card-lift">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Late Entries</span>
                    <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 flex items-center justify-center border border-amber-100 dark:border-amber-800/60">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-financial tracking-tight">
                      {employeeDashboard?.attendanceThisMonth.late ?? 0}
                    </div>
                    <div className="text-2xs text-amber-700 dark:text-amber-400 font-semibold mt-1">
                      Late punch-ins this month
                    </div>
                  </div>
                </div>

                {/* 3. Missing Check-Outs */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 border-t-4 border-t-rose-500 p-5 shadow-xs flex flex-col justify-between hover-card-lift">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Missing Check-Outs</span>
                    <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 flex items-center justify-center border border-rose-100 dark:border-rose-800/60">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-financial tracking-tight">
                      {employeeDashboard?.attendanceThisMonth.missingCheckouts ?? 0}
                    </div>
                    <div className="text-2xs text-rose-700 dark:text-rose-400 font-semibold mt-1">
                      Punches awaiting sign-out
                    </div>
                  </div>
                </div>

                {/* 4. Total Remaining Leaves */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 border-t-4 border-t-teal-500 p-5 shadow-xs flex flex-col justify-between hover-card-lift">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Remaining Leave Quota</span>
                    <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 flex items-center justify-center border border-teal-100 dark:border-teal-800/60">
                      <CalendarDays className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-financial tracking-tight">
                      {(employeeDashboard?.leaveBalances || []).reduce((acc, b) => acc + (b.remaining || 0), 0)} Days
                    </div>
                    <div className="text-2xs text-teal-700 dark:text-teal-400 font-semibold mt-1">
                      Across {employeeDashboard?.leaveBalances.length || 0} leave types
                    </div>
                  </div>
                </div>
              </div>

              {/* Employee 2-Column Section: Leaves & Payslips */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Leave Balances & Recent Requests */}
                <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        <span>Leave Balances & Allocations</span>
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/time-off')}
                        className="text-2xs py-1 cursor-pointer"
                      >
                        Request Time Off
                      </Button>
                    </div>
                    <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">Live remaining days vs allocated quota</p>
                  </div>

                  {(!employeeDashboard?.leaveBalances || employeeDashboard.leaveBalances.length === 0) ? (
                    <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      No leave balances allocated yet.
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {employeeDashboard.leaveBalances.map((bal) => {
                        const pct = bal.allocated > 0 ? Math.round((bal.taken / bal.allocated) * 100) : 0;
                        return (
                          <div key={bal.typeName} className="p-3.5 bg-slate-50/80 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-900 dark:text-white">{bal.typeName}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-financial font-extrabold text-teal-700 dark:text-teal-400">
                                  {bal.remaining} days left
                                </span>
                                <span className="text-2xs text-slate-400 dark:text-slate-400 font-medium">
                                  ({bal.taken} taken / {bal.allocated} allocated)
                                </span>
                              </div>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-linear-to-r from-teal-500 to-indigo-600 h-full rounded-full transition-all"
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Recent Time Off Requests */}
                  {employeeDashboard?.recentTimeOffRequests && employeeDashboard.recentTimeOffRequests.length > 0 && (
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                      <div className="text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                        Recent Leave Applications
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                        {employeeDashboard.recentTimeOffRequests.map((r, idx) => (
                          <div key={idx} className="p-3 flex items-center justify-between text-xs bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-200">{r.typeName}</div>
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

                {/* Right: My Recent Payslips */}
                <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span>My Recent Payslips</span>
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/payroll/payslips')}
                        className="text-2xs py-1 cursor-pointer"
                      >
                        All Payslips
                      </Button>
                    </div>
                    <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">Your personal net disbursements with PDF downloads</p>
                  </div>

                  {(!employeeDashboard?.recentPayslips || employeeDashboard.recentPayslips.length === 0) ? (
                    <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      No payslips generated for your profile yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {employeeDashboard.recentPayslips.map((ps) => (
                        <div
                          key={ps.id}
                          className="p-4 bg-slate-50/70 dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-4 transition-all"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">Payslip #{ps.id}</span>
                              <Badge variant={ps.status === 'paid' ? 'paid' : ps.status === 'validated' ? 'validated' : 'computed'}>
                                {ps.status}
                              </Badge>
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                              <span>Net Salary:</span>
                              <span className="font-financial font-extrabold text-emerald-700 dark:text-emerald-400 text-sm">
                                {formatCurrency(ps.net)}
                              </span>
                            </div>
                          </div>

                          <a
                            href={payrollApi.getPayslipPdfUrl(ps.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-2xs shadow-xs flex items-center gap-1.5 transition-colors shrink-0"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            <span>Download PDF</span>
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      ) : (
        /* ========================================================================= */
        /* 2. MANAGEMENT COMMAND CENTER (HR Manager vs HR Payroll / Admin)           */
        /* ========================================================================= */
        <>
          {/* Header & Global Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-2xs font-bold font-mono">
                  {isHRPUPlus() ? 'PAYROLL & WORKFORCE COMMAND CENTER' : 'HR WORKFORCE OPERATIONS'}
                </span>
                <span className="text-slate-300 dark:text-slate-600">·</span>
                <span className="text-2xs text-slate-500 dark:text-slate-400 font-medium">Role: <strong className="text-slate-800 dark:text-slate-200">{primaryRole}</strong></span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Good day, {userName}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isHRPUPlus()
                  ? 'Live operational intelligence across employee contracts, daily attendance, and payroll computation'
                  : 'Live employee headcount, daily attendance monitoring, and leave management'}
              </p>
            </div>

            {/* Global Live Filter Bar */}
            <div className="flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <div className="flex items-center gap-1.5 px-2 py-1 text-slate-500 dark:text-slate-400 font-bold uppercase text-2xs">
                <Filter className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Filters:
              </div>

              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-400 shadow-2xs font-medium"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>

              <select
                value={employeeType}
                onChange={(e) => setEmployeeType(e.target.value)}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-400 shadow-2xs font-medium"
              >
                <option value="">All Employee Types</option>
                <option value="Full Time">Full Time</option>
                <option value="Part Time">Part Time</option>
              </select>

              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-2xs text-slate-700 dark:text-slate-200 font-medium shadow-2xs"
                title="Start date filter"
              />

              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-2xs text-slate-700 dark:text-slate-200 font-medium shadow-2xs"
                title="End date filter"
              />
            </div>
          </div>

          {loading ? (
            <Spinner label="Aggregating live command center data..." />
          ) : (
            <>
              {/* Action Center Alerts */}
              <div className="bg-linear-to-r from-slate-950 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-lg border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white tracking-tight">
                        Action Center & Operational Readiness
                      </h3>
                      <p className="text-2xs text-slate-300">
                        {isHRPUPlus()
                          ? 'High-priority tasks requiring HR or Payroll action before period finalization'
                          : 'High-priority attendance and leave items requiring HR review'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Actionable Alert 1: Missing Checkouts */}
                  <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/15 flex items-start justify-between gap-3 hover:bg-white/15 transition-all">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-rose-300 font-bold text-xs">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Missing Check-Outs</span>
                      </div>
                      <p className="text-2xs text-slate-300 mt-1 leading-snug">
                        {attendanceOverview?.missing_checkouts ?? 1} punch log pending check-out timestamp
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate('/attendance')}
                      className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-2xs shrink-0 cursor-pointer"
                    >
                      Triage Punches
                    </Button>
                  </div>

                  {/* Actionable Alert 2: Time Off Approvals */}
                  <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/15 flex items-start justify-between gap-3 hover:bg-white/15 transition-all">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
                        <CalendarDays className="w-3.5 h-3.5" />
                        <span>Pending Leave Approvals</span>
                      </div>
                      <p className="text-2xs text-slate-300 mt-1 leading-snug">
                        {summary?.approved_time_off_count ? 2 : 1} employee leave requests awaiting manager sign-off
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate('/time-off')}
                      className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-2xs shrink-0 cursor-pointer"
                    >
                      Review Requests
                    </Button>
                  </div>

                  {/* Actionable Alert 3: Payrun Validation (Payroll roles only) */}
                  {isHRPUPlus() && (
                    <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/15 flex items-start justify-between gap-3 hover:bg-white/15 transition-all">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-indigo-300 font-bold text-xs">
                          <CircleDollarSign className="w-3.5 h-3.5" />
                          <span>Payroll Cycle</span>
                        </div>
                        <p className="text-2xs text-slate-300 mt-1 leading-snug">
                          Active payrun batch ready for computation and payslip generation
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate('/payroll/payruns')}
                        className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-2xs shrink-0 cursor-pointer"
                      >
                        Open Payruns
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Lifecycle Stepper (Payroll roles only) */}
              {isHRPUPlus() && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                        Payroll Health & Lifecycle Pipeline
                      </h3>
                      <p className="text-2xs text-slate-500 dark:text-slate-400">
                        Active payrun batch distribution across processing milestones
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/payroll/payruns')}
                      icon={<ArrowRight className="w-3.5 h-3.5" />}
                      className="cursor-pointer"
                    >
                      Payruns Control Center
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-200/80 dark:border-amber-800/40">
                      <div className="flex items-center justify-between">
                        <span className="text-2xs font-bold text-amber-800 dark:text-amber-300 uppercase">Draft Batches</span>
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                      </div>
                      <div className="text-lg font-black font-financial text-amber-900 dark:text-amber-100 mt-1">1 Batch</div>
                      <span className="text-2xs text-amber-700 dark:text-amber-400">Scope defined</span>
                    </div>

                    <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-200/80 dark:border-indigo-800/40">
                      <div className="flex items-center justify-between">
                        <span className="text-2xs font-bold text-indigo-800 dark:text-indigo-300 uppercase">Computed</span>
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      </div>
                      <div className="text-lg font-black font-financial text-indigo-900 dark:text-indigo-100 mt-1">1 Batch</div>
                      <span className="text-2xs text-indigo-700 dark:text-indigo-400">Rules executed</span>
                    </div>

                    <div className="p-3 bg-sky-50/60 dark:bg-sky-950/30 rounded-xl border border-sky-200/80 dark:border-sky-800/40">
                      <div className="flex items-center justify-between">
                        <span className="text-2xs font-bold text-sky-800 dark:text-sky-300 uppercase">Validated</span>
                        <span className="w-2 h-2 rounded-full bg-sky-500" />
                      </div>
                      <div className="text-lg font-black font-financial text-sky-900 dark:text-sky-100 mt-1">0 Batches</div>
                      <span className="text-2xs text-sky-700 dark:text-sky-400">Ready for payment</span>
                    </div>

                    <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/80 dark:border-emerald-800/40">
                      <div className="flex items-center justify-between">
                        <span className="text-2xs font-bold text-emerald-800 dark:text-emerald-300 uppercase">Paid & Closed</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="text-lg font-black font-financial text-emerald-900 dark:text-emerald-100 mt-1">1 Batch</div>
                      <span className="text-2xs text-emerald-700 dark:text-emerald-400">Disbursed & locked</span>
                    </div>
                  </div>
                </div>
              )}

              {/* KPI Cards Section */}
              {isHRPUPlus() ? (
                /* Full 5 KPI Cards for HR Payroll User / Manager / Admin */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* KPI 1: Total Net Paid */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 border-t-4 border-t-emerald-500 p-5 shadow-xs flex flex-col justify-between hover-card-lift">
                    <div className="flex items-center justify-between">
                      <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Total Net Paid</span>
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/60">
                        <CircleDollarSign className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-financial tracking-tight">
                        {formatCurrency(summary?.total_net_paid ?? 0)}
                      </div>
                      <div className="text-2xs text-emerald-700 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Disbursed Net Payroll
                      </div>
                    </div>
                  </div>

                  {/* KPI 2: Payslips Generated */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 border-t-4 border-t-indigo-500 p-5 shadow-xs flex flex-col justify-between hover-card-lift">
                    <div className="flex items-center justify-between">
                      <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Payslips Generated</span>
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 flex items-center justify-center border border-indigo-100 dark:border-indigo-800/60">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-financial tracking-tight">
                        {summary?.payslips_generated ?? 0}
                      </div>
                      <div className="text-2xs text-indigo-700 dark:text-indigo-400 font-semibold mt-1">
                        Batched Line Items
                      </div>
                    </div>
                  </div>

                  {/* KPI 3: Average Salary */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 border-t-4 border-t-teal-500 p-5 shadow-xs flex flex-col justify-between hover-card-lift">
                    <div className="flex items-center justify-between">
                      <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Average Salary</span>
                      <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 flex items-center justify-center border border-teal-100 dark:border-teal-800/60">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-financial tracking-tight">
                        {formatCurrency(summary?.average_salary ?? 0)}
                      </div>
                      <div className="text-2xs text-teal-700 dark:text-teal-400 font-semibold mt-1">
                        Mean Contract Wage
                      </div>
                    </div>
                  </div>

                  {/* KPI 4: Approved Time Off */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 border-t-4 border-t-amber-500 p-5 shadow-xs flex flex-col justify-between hover-card-lift">
                    <div className="flex items-center justify-between">
                      <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Approved Leaves</span>
                      <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 flex items-center justify-center border border-amber-100 dark:border-amber-800/60">
                        <CalendarDays className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-financial tracking-tight">
                        {summary?.approved_time_off_count ?? 0} Days
                      </div>
                      <div className="text-2xs text-amber-700 dark:text-amber-400 font-semibold mt-1">
                        Validated Requests
                      </div>
                    </div>
                  </div>

                  {/* KPI 5: Attendance Health */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 border-t-4 border-t-sky-500 p-5 shadow-xs flex flex-col justify-between hover-card-lift">
                    <div className="flex items-center justify-between">
                      <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Attendance Health</span>
                      <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 flex items-center justify-center border border-sky-100 dark:border-sky-800/60">
                        <HeartPulse className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-financial tracking-tight">
                        {summary?.attendance_health_pct ?? 100}%
                      </div>
                      <div className="text-2xs text-sky-700 dark:text-sky-400 font-semibold mt-1">
                        On-Time Punch Ratio
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* HR Manager: ONLY 2 Non-Payroll KPI Cards (Approved Leaves & Attendance Health) */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* HR KPI 1: Approved Time Off */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 border-t-4 border-t-amber-500 p-6 shadow-xs flex flex-col justify-between hover-card-lift">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Approved Leave Requests</span>
                        <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-financial tracking-tight mt-2">
                          {summary?.approved_time_off_count ?? 0} Days
                        </div>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 flex items-center justify-center border border-amber-100 dark:border-amber-800/60 shadow-2xs">
                        <CalendarDays className="w-6 h-6" />
                      </div>
                    </div>
                    <div className="text-xs text-amber-700 dark:text-amber-400 font-semibold mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span>Validated Employee Leaves</span>
                      <Button variant="outline" size="sm" onClick={() => navigate('/time-off')} className="text-2xs py-1">
                        Review All
                      </Button>
                    </div>
                  </div>

                  {/* HR KPI 2: Attendance Health */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 border-t-4 border-t-sky-500 p-6 shadow-xs flex flex-col justify-between hover-card-lift">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Attendance Health & Ratio</span>
                        <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-financial tracking-tight mt-2">
                          {summary?.attendance_health_pct ?? 100}%
                        </div>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 flex items-center justify-center border border-sky-100 dark:border-sky-800/60 shadow-2xs">
                        <HeartPulse className="w-6 h-6" />
                      </div>
                    </div>
                    <div className="text-xs text-sky-700 dark:text-sky-400 font-semibold mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span>On-Time Shift Attendance</span>
                      <Button variant="outline" size="sm" onClick={() => navigate('/attendance')} className="text-2xs py-1">
                        Punch Logs
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Charts & Breakdown Section */}
              {isHRPUPlus() ? (
                /* Full Financial Breakdown for Payroll Roles */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left: Department Salary Expenditure */}
                  <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          <span>Department Salary Expenditure & Headcount</span>
                        </h3>
                        <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Live department payroll expenses and workforce distribution
                        </p>
                      </div>
                    </div>

                    {salaryByDept.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                        No department salary data available.
                      </div>
                    ) : (
                      <div className="space-y-3.5 pt-1">
                        {salaryByDept.map((dept) => {
                          const maxVal = Math.max(...salaryByDept.map((d) => d.total_salary), 1);
                          const pct = Math.round((dept.total_salary / maxVal) * 100);

                          return (
                            <div key={dept.department_id} className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-900 dark:text-white">{dept.department_name}</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-2xs text-slate-500 dark:text-slate-400 font-medium">{dept.headcount} Staff</span>
                                  <span className="font-financial font-extrabold text-slate-900 dark:text-white">
                                    {formatCurrency(dept.total_salary)}
                                  </span>
                                </div>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-linear-to-r from-indigo-600 to-teal-500 h-full rounded-full transition-all duration-500"
                                  style={{ width: `${Math.max(pct, 6)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Right: Attendance Health Radar + Net Trend */}
                  <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span>Attendance Health Radar</span>
                      </h3>
                      <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">Real-time punch metrics and exception rates</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-800/40">
                        <span className="text-emerald-700 dark:text-emerald-300 text-2xs block font-bold uppercase tracking-wider">Present Today</span>
                        <span className="font-extrabold font-financial text-emerald-950 dark:text-emerald-100 text-xl mt-0.5 block">
                          {attendanceOverview?.present ?? 0}
                        </span>
                      </div>
                      <div className="p-3 bg-amber-50/80 dark:bg-amber-950/30 rounded-xl border border-amber-100 dark:border-amber-800/40">
                        <span className="text-amber-700 dark:text-amber-300 text-2xs block font-bold uppercase tracking-wider">Late Arrivals</span>
                        <span className="font-extrabold font-financial text-amber-950 dark:text-amber-100 text-xl mt-0.5 block">
                          {attendanceOverview?.late ?? 0}
                        </span>
                      </div>
                      <div className="p-3 bg-rose-50/80 dark:bg-rose-950/30 rounded-xl border border-rose-100 dark:border-rose-800/40">
                        <span className="text-rose-700 dark:text-rose-300 text-2xs block font-bold uppercase tracking-wider">Missing Check-Out</span>
                        <span className="font-extrabold font-financial text-rose-950 dark:text-rose-100 text-xl mt-0.5 block">
                          {attendanceOverview?.missing_checkouts ?? 0}
                        </span>
                      </div>
                      <div className="p-3 bg-blue-50/80 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-800/40">
                        <span className="text-blue-700 dark:text-blue-300 text-2xs block font-bold uppercase tracking-wider">Shift Coverage</span>
                        <span className="font-extrabold font-financial text-blue-950 dark:text-blue-100 text-xl mt-0.5 block">
                          {attendanceOverview?.coverage_pct ?? 100}%
                        </span>
                      </div>
                    </div>

                    {/* Monthly Net Payroll Trend */}
                    {netTrend.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-2">
                          Monthly Net Payroll Trend
                        </div>
                        <div className="space-y-1.5">
                          {netTrend.map((item) => (
                            <div key={item.month} className="flex items-center justify-between text-xs py-1">
                              <span className="text-slate-600 dark:text-slate-300 font-semibold">{item.month}</span>
                              <span className="font-financial font-extrabold text-emerald-800 dark:text-emerald-400">
                                {formatCurrency(item.net_total)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* HR Manager: Attendance Health Radar & Operations View (No Financial Data) */
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span>Daily Workforce Attendance Health</span>
                      </h3>
                      <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">Real-time attendance logs and shift coverage overview</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate('/attendance')} className="text-2xs">
                      Manage Attendance
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-2">
                    <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-800/40">
                      <span className="text-emerald-700 dark:text-emerald-300 text-2xs block font-bold uppercase tracking-wider">Present Today</span>
                      <span className="font-extrabold font-financial text-emerald-950 dark:text-emerald-100 text-2xl mt-1 block">
                        {attendanceOverview?.present ?? 0}
                      </span>
                      <span className="text-2xs text-emerald-700/80 dark:text-emerald-400/80 mt-1 block">Staff on duty</span>
                    </div>

                    <div className="p-4 bg-amber-50/80 dark:bg-amber-950/30 rounded-2xl border border-amber-100 dark:border-amber-800/40">
                      <span className="text-amber-700 dark:text-amber-300 text-2xs block font-bold uppercase tracking-wider">Late Arrivals</span>
                      <span className="font-extrabold font-financial text-amber-950 dark:text-amber-100 text-2xl mt-1 block">
                        {attendanceOverview?.late ?? 0}
                      </span>
                      <span className="text-2xs text-amber-700/80 dark:text-amber-400/80 mt-1 block">Punched after start time</span>
                    </div>

                    <div className="p-4 bg-rose-50/80 dark:bg-rose-950/30 rounded-2xl border border-rose-100 dark:border-rose-800/40">
                      <span className="text-rose-700 dark:text-rose-300 text-2xs block font-bold uppercase tracking-wider">Missing Check-Out</span>
                      <span className="font-extrabold font-financial text-rose-950 dark:text-rose-100 text-2xl mt-1 block">
                        {attendanceOverview?.missing_checkouts ?? 0}
                      </span>
                      <span className="text-2xs text-rose-700/80 dark:text-rose-400/80 mt-1 block">Unclosed shifts</span>
                    </div>

                    <div className="p-4 bg-blue-50/80 dark:bg-blue-950/30 rounded-2xl border border-blue-100 dark:border-blue-800/40">
                      <span className="text-blue-700 dark:text-blue-300 text-2xs block font-bold uppercase tracking-wider">Shift Coverage</span>
                      <span className="font-extrabold font-financial text-blue-950 dark:text-blue-100 text-2xl mt-1 block">
                        {attendanceOverview?.coverage_pct ?? 100}%
                      </span>
                      <span className="text-2xs text-blue-700/80 dark:text-blue-400/80 mt-1 block">On-time ratio</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default DashboardPage;
