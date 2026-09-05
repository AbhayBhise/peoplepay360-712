import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  CircleDollarSign,
  FileSpreadsheet,
  TrendingUp,
  CalendarDays,
  HeartPulse,
  AlertTriangle,
  Building2,
  Users,
  Filter,
  CheckCircle2,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { dashboardApi } from '../../api/dashboard';
import { departmentsApi } from '../../api/departments';
import {
  DashboardSummary,
  SalaryByDepartment,
  NetSalaryTrend,
  AttendanceOverview,
  Department,
} from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [salaryByDept, setSalaryByDept] = useState<SalaryByDepartment[]>([]);
  const [netTrend, setNetTrend] = useState<NetSalaryTrend[]>([]);
  const [attendanceOverview, setAttendanceOverview] = useState<AttendanceOverview | null>(null);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [employeeType, setEmployeeType] = useState<string>('');

  const { isHRPUPlus } = useAuth();
  const { error } = useToast();

  const loadDashboard = async () => {
    setLoading(true);
    try {
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
    } catch (err: any) {
      error(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [periodStart, periodEnd, departmentId, employeeType]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-[#714B67]" />
            <span>Payroll & HR Executive Dashboard</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time live aggregation of company payroll expenses, attendance health, and operational alerts
          </p>
        </div>

        {/* Global Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs text-xs">
          <div className="flex items-center gap-1.5 px-2 py-1 text-slate-500 font-semibold uppercase text-2xs">
            <Filter className="w-3.5 h-3.5 text-[#714B67]" />
            Filters:
          </div>

          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-[#714B67]"
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
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-[#714B67]"
          >
            <option value="">All Employee Types</option>
            <option value="Full Time">Full Time</option>
            <option value="Part Time">Part Time</option>
          </select>

          <input
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-2xs text-slate-700"
            title="Filter from date"
          />

          <input
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-2xs text-slate-700"
            title="Filter to date"
          />
        </div>
      </div>

      {loading ? (
        <Spinner label="Aggregating live payroll and attendance data from database..." />
      ) : (
        <>
          {/* OPERATIONAL ALERTS BANNER */}
          {alerts.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Operational Alerts & Action Items ({alerts.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-amber-900/90">
                {alerts.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white/70 p-2 rounded-lg border border-amber-200/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5 CORE KPI CARDS (Real dynamic numbers) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* KPI 1: Total Net Paid */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">Total Net Paid</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <CircleDollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xl font-extrabold text-slate-900 font-mono">
                  ${(summary?.total_net_paid ?? 0).toLocaleString()}
                </div>
                <div className="text-2xs text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Disbursed Net Wages
                </div>
              </div>
            </div>

            {/* KPI 2: Payslips Generated */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">Payslips Generated</span>
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-[#714B67] flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xl font-extrabold text-slate-900 font-mono">
                  {summary?.payslips_generated ?? 0}
                </div>
                <div className="text-2xs text-purple-700 font-medium mt-0.5">Calculated in Batches</div>
              </div>
            </div>

            {/* KPI 3: Average Salary */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">Average Salary</span>
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#008784] flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xl font-extrabold text-slate-900 font-mono">
                  ${Math.round(summary?.average_salary ?? 0).toLocaleString()}
                </div>
                <div className="text-2xs text-teal-700 font-medium mt-0.5">Mean Compensation</div>
              </div>
            </div>

            {/* KPI 4: Approved Time Off */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">Approved Time Off</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                  <CalendarDays className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xl font-extrabold text-slate-900 font-mono">
                  {summary?.approved_time_off_count ?? 0}
                </div>
                <div className="text-2xs text-amber-700 font-medium mt-0.5">Validated Requests</div>
              </div>
            </div>

            {/* KPI 5: Attendance Health */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-2xs font-bold uppercase tracking-wider text-slate-400">Attendance Health</span>
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
                  <HeartPulse className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xl font-extrabold text-slate-900 font-mono">
                  {summary?.attendance_health_pct ?? 100}%
                </div>
                <div className="text-2xs text-sky-700 font-medium mt-0.5">On-Time Punch Rate</div>
              </div>
            </div>
          </div>

          {/* TWO MAIN CHARTS & BREAKDOWNS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart 1: Salary Cost by Department */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#714B67]" />
                    <span>Salary Cost Distribution by Department</span>
                  </h3>
                  <p className="text-2xs text-slate-500 mt-0.5">
                    Live department payroll expenses and active headcount
                  </p>
                </div>
              </div>

              {salaryByDept.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                  No department salary data found for selected period.
                </div>
              ) : (
                <div className="space-y-3">
                  {salaryByDept.map((dept) => {
                    const maxSal = Math.max(...salaryByDept.map((d) => d.total_salary), 1);
                    const pct = Math.round((dept.total_salary / maxSal) * 100);

                    return (
                      <div key={dept.department_id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">{dept.department_name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-2xs text-slate-500">{dept.headcount} employees</span>
                            <span className="font-mono font-bold text-slate-900">
                              ${dept.total_salary.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-linear-to-r from-[#714B67] to-[#008784] h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(pct, 5)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Attendance Overview Card */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-600" />
                  <span>Attendance Health Breakdown</span>
                </h3>
                <p className="text-2xs text-slate-500 mt-0.5">Punch metrics and exception rates</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <span className="text-emerald-700 text-2xs block font-semibold">Present Today</span>
                  <span className="font-bold font-mono text-emerald-900 text-base">
                    {attendanceOverview?.present ?? 0}
                  </span>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <span className="text-amber-700 text-2xs block font-semibold">Late Arrivals</span>
                  <span className="font-bold font-mono text-amber-900 text-base">
                    {attendanceOverview?.late ?? 0}
                  </span>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                  <span className="text-rose-700 text-2xs block font-semibold">Missing Check-Outs</span>
                  <span className="font-bold font-mono text-rose-900 text-base">
                    {attendanceOverview?.missing_checkouts ?? 0}
                  </span>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <span className="text-blue-700 text-2xs block font-semibold">Coverage Rate</span>
                  <span className="font-bold font-mono text-blue-900 text-base">
                    {attendanceOverview?.coverage_pct ?? 100}%
                  </span>
                </div>
              </div>

              {/* Monthly Net Trend list */}
              {netTrend.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-2xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Monthly Net Payroll Trend
                  </div>
                  <div className="space-y-1.5">
                    {netTrend.slice(-3).map((item) => (
                      <div key={item.month} className="flex items-center justify-between text-xs py-1">
                        <span className="text-slate-600 font-medium">{item.month}</span>
                        <span className="font-mono font-bold text-emerald-800">
                          ${item.net_total.toLocaleString()}
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
    </div>
  );
};
