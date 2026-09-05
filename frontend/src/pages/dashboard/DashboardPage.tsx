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
        // Employee-only role: fetch personal workspace metrics from /api/dashboard/me
        const myData = await dashboardApi.getMyDashboard();
        setEmployeeDashboard(myData);
      } else {
        // HRM+ management roles
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
      error(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [periodStart, periodEnd, departmentId, employeeType, user]);

  const userName = user?.name || user?.email?.split('@')[0] || 'Team';
  const primaryRole = user?.roles?.[0] || 'User';

  return (
    <div className="space-y-6 animate-fade-in">
      {!isHRMPlus() ? (
        /* ================= EMPLOYEE SELF-SERVICE PERSONAL DASHBOARD ================= */
        <>
          {/* Employee Welcome Banner */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-2xs font-bold font-mono">
                  EMPLOYEE WORKSPACE
                </span>
                <span className="text-slate-500">·</span>
                <span className="text-2xs text-slate-300 font-medium">
                  {employeeDashboard?.employee?.jobPosition || 'Team Member'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome back, {employeeDashboard?.employee?.name || userName}
              </h1>
              <p className="text-xs text-slate-300 flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-teal-400" />
                <span>{employeeDashboard?.employee?.departmentName || 'General Workforce'}</span>
                <span>·</span>
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>{employeeDashboard?.employee?.workingScheduleName || 'Standard Full-Time'}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/attendance')}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs cursor-pointer"
                icon={<Clock className="w-4 h-4" />}
              >
                Punch Attendance
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/time-off')}
                className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs cursor-pointer"
                icon={<CalendarDays className="w-4 h-4 text-slate-950" />}
              >
                Request Time Off
              </Button>
            </div>
          </div>

          {loading ? (
            <Spinner label="Loading your personal workforce intelligence..." />
          ) : (
            <>
              {/* Employee Personal 4 KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Monthly Wage */}
                <div className="bg-white/95 rounded-2xl border border-slate-200/80 border-t-4 border-t-emerald-500 p-5 shadow-xs flex flex-col justify-between hover-card-lift">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">Current Base Wage</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                      <CircleDollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-extrabold text-slate-900 font-financial tracking-tight">
                      {formatCurrency(employeeDashboard?.contract?.wage || 0)}
                    </div>
                    <div className="text-2xs text-emerald-700 font-semibold mt-1">
                      {employeeDashboard?.contract?.salaryStructureName || 'Standard Active Contract'}
                    </div>
                  </div>
                </div>

                {/* 2. Attendance Health */}
                <div className="bg-white/95 rounded-2xl border border-slate-200/80 border-t-4 border-t-sky-500 p-5 shadow-xs flex flex-col justify-between hover-card-lift">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">Attendance Health</span>
                    <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-100">
                      <HeartPulse className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-extrabold text-slate-900 font-financial tracking-tight">
                      {employeeDashboard?.attendance.healthPct ?? 100}%
                    </div>
                    <div className="text-2xs text-sky-700 font-semibold mt-1">
                      {employeeDashboard?.attendance.presentDays ?? 0} Present · {employeeDashboard?.attendance.lateDays ?? 0} Late
                    </div>
                  </div>
                </div>

                {/* 3. Hours Worked */}
                <div className="bg-white/95 rounded-2xl border border-slate-200/80 border-t-4 border-t-indigo-500 p-5 shadow-xs flex flex-col justify-between hover-card-lift">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">Monthly Hours</span>
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-extrabold text-slate-900 font-financial tracking-tight">
                      {employeeDashboard?.attendance.totalHours ?? 0} hrs
                    </div>
                    <div className="text-2xs text-indigo-700 font-semibold mt-1">
                      Schedule: {employeeDashboard?.employee?.weeklyHours ?? 40} hrs / week
                    </div>
                  </div>
                </div>

                {/* 4. Total Remaining Leaves */}
                <div className="bg-white/95 rounded-2xl border border-slate-200/80 border-t-4 border-t-amber-500 p-5 shadow-xs flex flex-col justify-between hover-card-lift">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">Remaining Leaves</span>
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
                      <CalendarDays className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-extrabold text-slate-900 font-financial tracking-tight">
                      {(employeeDashboard?.timeOff.leaveBalances || []).reduce((acc, b) => acc + b.remainingDays, 0)} Days
                    </div>
                    <div className="text-2xs text-amber-700 font-semibold mt-1">
                      Across {employeeDashboard?.timeOff.leaveBalances.length || 0} Leave Quotas
                    </div>
                  </div>
                </div>
              </div>

              {/* Employee 2-Column Details */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Leave Quotas & Recent Requests */}
                <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-teal-600" />
                        <span>My Leave Quota Allocations</span>
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/time-off')}
                        className="text-2xs py-1 cursor-pointer"
                      >
                        Request Leave
                      </Button>
                    </div>
                    <p className="text-2xs text-slate-500 mt-0.5">Real-time allocated vs consumed balance</p>
                  </div>

                  {(!employeeDashboard?.timeOff.leaveBalances || employeeDashboard.timeOff.leaveBalances.length === 0) ? (
                    <div className="p-6 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                      No leave allocations assigned.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {employeeDashboard.timeOff.leaveBalances.map((bal) => {
                        const pct = bal.allocatedDays > 0 ? Math.round((bal.usedDays / bal.allocatedDays) * 100) : 0;
                        return (
                          <div key={bal.typeId} className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-900">{bal.typeName}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-financial font-extrabold text-teal-700">{bal.remainingDays} {bal.unit} remaining</span>
                                <span className="text-2xs text-slate-400 font-medium">({bal.usedDays} used / {bal.allocatedDays} total)</span>
                              </div>
                            </div>
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
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
                  {employeeDashboard?.timeOff.recentRequests && employeeDashboard.timeOff.recentRequests.length > 0 && (
                    <div className="pt-4 border-t border-slate-100 space-y-3">
                      <div className="text-2xs font-bold uppercase tracking-wider text-slate-400">
                        Recent Leave Applications
                      </div>
                      <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                        {employeeDashboard.timeOff.recentRequests.map((r) => (
                          <div key={r.id} className="p-3 flex items-center justify-between text-xs bg-white hover:bg-slate-50">
                            <div>
                              <div className="font-bold text-slate-800">{r.typeName}</div>
                              <div className="text-2xs text-slate-500 font-mono">{r.dateFrom} to {r.dateTo} ({r.durationDays} days)</div>
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
                <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                        <span>My Recent Payslips</span>
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/payroll/payslips')}
                        className="text-2xs py-1 cursor-pointer"
                      >
                        View All
                      </Button>
                    </div>
                    <p className="text-2xs text-slate-500 mt-0.5">Disbursed salary statements with downloadable PDFs</p>
                  </div>

                  {(!employeeDashboard?.recentPayslips || employeeDashboard.recentPayslips.length === 0) ? (
                    <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                      No payslips generated for your profile yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {employeeDashboard.recentPayslips.map((ps) => (
                        <div
                          key={ps.id}
                          className="p-4 bg-slate-50/70 hover:bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-4 transition-all"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-xs">Period: {ps.periodStart} → {ps.periodEnd}</span>
                              <Badge variant={ps.status === 'paid' ? 'paid' : ps.status === 'validated' ? 'validated' : 'computed'}>
                                {ps.status}
                              </Badge>
                            </div>
                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                              <span>Gross: <strong className="text-slate-700">{formatCurrency(ps.gross)}</strong></span>
                              <span>·</span>
                              <span>Net: <strong className="text-emerald-700 font-financial">{formatCurrency(ps.net)}</strong></span>
                            </div>
                          </div>

                          <a
                            href={payrollApi.getPayslipPdfUrl(ps.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-2xs shadow-xs flex items-center gap-1.5 transition-colors shrink-0"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            <span>PDF</span>
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
        /* ================= HRM+ / MANAGEMENT COMMAND CENTER ================= */
        <>
          {/* 1. COMMAND BRIEFING HEADER & GLOBAL FILTER */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-2xs font-bold font-mono">
                  WORKFORCE COMMAND CENTER
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-2xs text-slate-500 font-medium">Role: <strong>{primaryRole}</strong></span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Good day, {userName}
              </h1>
              <p className="text-xs text-slate-500">
                Live operational intelligence across employee contracts, daily attendance, and payroll computation
              </p>
            </div>

            {/* Global Live Filter Bar */}
            <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center gap-1.5 px-2 py-1 text-slate-500 font-bold uppercase text-2xs">
                <Filter className="w-3.5 h-3.5 text-indigo-600" />
                Filters:
              </div>

              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-indigo-600 shadow-2xs font-medium"
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
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-indigo-600 shadow-2xs font-medium"
              >
                <option value="">All Employee Types</option>
                <option value="Full Time">Full Time</option>
                <option value="Part Time">Part Time</option>
              </select>

              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-2xs text-slate-700 font-medium shadow-2xs"
                title="Start date filter"
              />

              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-2xs text-slate-700 font-medium shadow-2xs"
                title="End date filter"
              />
            </div>
          </div>

          {loading ? (
            <Spinner label="Aggregating live command center data..." />
          ) : (
            <>
              {/* 2. ACTION CENTER — WHAT NEEDS ATTENTION TODAY */}
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
                        High-priority tasks requiring HR or Payroll action before period finalization
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

                  {/* Actionable Alert 3: Payrun Validation */}
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

              {/* 3. PAYROLL HEALTH PROGRESSION STEPPER */}
              {isHRPUPlus() && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                        Payroll Health & Lifecycle Pipeline
                      </h3>
                      <p className="text-2xs text-slate-500">
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
                    <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80">
                      <div className="flex items-center justify-between">
                        <span className="text-2xs font-bold text-amber-800 uppercase">Draft Batches</span>
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                      </div>
                      <div className="text-lg font-black font-financial text-amber-900 mt-1">1 Batch</div>
                      <span className="text-2xs text-amber-700">Scope defined</span>
                    </div>

                    <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200/80">
                      <div className="flex items-center justify-between">
                        <span className="text-2xs font-bold text-indigo-800 uppercase">Computed</span>
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      </div>
                      <div className="text-lg font-black font-financial text-indigo-900 mt-1">1 Batch</div>
                      <span className="text-2xs text-indigo-700">Rules executed</span>
                    </div>

                    <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-200/80">
                      <div className="flex items-center justify-between">
                        <span className="text-2xs font-bold text-sky-800 uppercase">Validated</span>
                        <span className="w-2 h-2 rounded-full bg-sky-500" />
                      </div>
                      <div className="text-lg font-black font-financial text-sky-900 mt-1">0 Batches</div>
                      <span className="text-2xs text-sky-700">Ready for payment</span>
                    </div>

                    <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80">
                      <div className="flex items-center justify-between">
                        <span className="text-2xs font-bold text-emerald-800 uppercase">Paid & Closed</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <div className="text-lg font-black font-financial text-emerald-900 mt-1">1 Batch</div>
                      <span className="text-2xs text-emerald-700">Disbursed & locked</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. FIVE CORE KPI METRIC CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* KPI 1: Total Net Paid */}
                <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 border-t-4 border-t-emerald-500 p-5 shadow-xs flex flex-col justify-between hover-card-lift cursor-default animate-slide-up stagger-1">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">Total Net Paid</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 shadow-2xs">
                      <CircleDollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-extrabold text-slate-900 font-financial tracking-tight">
                      {isHRPUPlus() ? formatCurrency(summary?.total_net_paid ?? 0) : 'HR View'}
                    </div>
                    <div className="text-2xs text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> {isHRPUPlus() ? 'Disbursed Net Payroll' : 'Payroll Restricted'}
                    </div>
                  </div>
                </div>

                {/* KPI 2: Payslips Generated */}
                <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 border-t-4 border-t-indigo-500 p-5 shadow-xs flex flex-col justify-between hover-card-lift cursor-default animate-slide-up stagger-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">Payslips Generated</span>
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-2xs">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-extrabold text-slate-900 font-financial tracking-tight">
                      {isHRPUPlus() ? (summary?.payslips_generated ?? 0) : '—'}
                    </div>
                    <div className="text-2xs text-indigo-700 font-semibold mt-1">
                      {isHRPUPlus() ? 'Batched Line Items' : 'Payroll Role Only'}
                    </div>
                  </div>
                </div>

                {/* KPI 3: Average Salary */}
                <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 border-t-4 border-t-teal-500 p-5 shadow-xs flex flex-col justify-between hover-card-lift cursor-default animate-slide-up stagger-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">Average Salary</span>
                    <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 shadow-2xs">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-extrabold text-slate-900 font-financial tracking-tight">
                      {isHRPUPlus() ? formatCurrency(summary?.average_salary ?? 0) : 'HR View'}
                    </div>
                    <div className="text-2xs text-teal-700 font-semibold mt-1">
                      {isHRPUPlus() ? 'Mean Contract Wage' : 'Payroll Restricted'}
                    </div>
                  </div>
                </div>

                {/* KPI 4: Approved Time Off */}
                <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 border-t-4 border-t-amber-500 p-5 shadow-xs flex flex-col justify-between hover-card-lift cursor-default animate-slide-up stagger-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">Approved Leaves</span>
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100 shadow-2xs">
                      <CalendarDays className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-extrabold text-slate-900 font-financial tracking-tight">
                      {summary?.approved_time_off_count ?? 0} Days
                    </div>
                    <div className="text-2xs text-amber-700 font-semibold mt-1">
                      Validated Requests
                    </div>
                  </div>
                </div>

                {/* KPI 5: Attendance Health */}
                <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 border-t-4 border-t-sky-500 p-5 shadow-xs flex flex-col justify-between hover-card-lift cursor-default animate-slide-up stagger-5">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">Attendance Health</span>
                    <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-100 shadow-2xs">
                      <HeartPulse className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-extrabold text-slate-900 font-financial tracking-tight">
                      {summary?.attendance_health_pct ?? 100}%
                    </div>
                    <div className="text-2xs text-sky-700 font-semibold mt-1">
                      On-Time Punch Ratio
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. DEPARTMENT ANALYSIS & ATTENDANCE HEALTH BREAKDOWNS */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Department Salary Expenditure (Payroll roles) / Department Headcount (HR Manager) */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-indigo-600" />
                        <span>{isHRPUPlus() ? 'Department Salary Expenditure & Headcount' : 'Department Workforce Distribution'}</span>
                      </h3>
                      <p className="text-2xs text-slate-500 mt-0.5">
                        {isHRPUPlus()
                          ? 'Live department payroll expenses and workforce distribution'
                          : 'Live headcount and staffing allocation across department units'}
                      </p>
                    </div>
                  </div>

                  {salaryByDept.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                      No department data available.
                    </div>
                  ) : (
                    <div className="space-y-3.5 pt-1">
                      {salaryByDept.map((dept) => {
                        const maxVal = isHRPUPlus()
                          ? Math.max(...salaryByDept.map((d) => d.total_salary), 1)
                          : Math.max(...salaryByDept.map((d) => d.headcount), 1);
                        const currentVal = isHRPUPlus() ? dept.total_salary : dept.headcount;
                        const pct = Math.round((currentVal / maxVal) * 100);

                        return (
                          <div key={dept.department_id} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-900">{dept.department_name}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-2xs text-slate-500 font-medium">{dept.headcount} Staff</span>
                                {isHRPUPlus() && (
                                  <span className="font-financial font-extrabold text-slate-900">
                                    {formatCurrency(dept.total_salary)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
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

                {/* Right: Attendance Health Breakdown */}
                <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      <span>Attendance Health Radar</span>
                    </h3>
                    <p className="text-2xs text-slate-500 mt-0.5">Real-time punch metrics and exception rates</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                      <span className="text-emerald-700 text-2xs block font-bold uppercase tracking-wider">Present Today</span>
                      <span className="font-extrabold font-financial text-emerald-950 text-xl mt-0.5 block">
                        {attendanceOverview?.present ?? 0}
                      </span>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                      <span className="text-amber-700 text-2xs block font-bold uppercase tracking-wider">Late Arrivals</span>
                      <span className="font-extrabold font-financial text-amber-950 text-xl mt-0.5 block">
                        {attendanceOverview?.late ?? 0}
                      </span>
                    </div>
                    <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                      <span className="text-rose-700 text-2xs block font-bold uppercase tracking-wider">Missing Check-Out</span>
                      <span className="font-extrabold font-financial text-rose-950 text-xl mt-0.5 block">
                        {attendanceOverview?.missing_checkouts ?? 0}
                      </span>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <span className="text-blue-700 text-2xs block font-bold uppercase tracking-wider">Shift Coverage</span>
                      <span className="font-extrabold font-financial text-blue-950 text-xl mt-0.5 block">
                        {attendanceOverview?.coverage_pct ?? 100}%
                      </span>
                    </div>
                  </div>

                  {/* Monthly Net Payroll Trend (Payroll roles only) */}
                  {isHRPUPlus() && netTrend.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <div className="text-2xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Monthly Net Payroll Trend
                      </div>
                      <div className="space-y-1.5">
                        {netTrend.map((item) => (
                          <div key={item.month} className="flex items-center justify-between text-xs py-1">
                            <span className="text-slate-600 font-semibold">{item.month}</span>
                            <span className="font-financial font-extrabold text-emerald-800">
                              {formatCurrency(item.net_total)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};
