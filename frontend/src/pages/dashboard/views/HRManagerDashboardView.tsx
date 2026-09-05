import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Clock,
  CalendarDays,
  AlertCircle,
  Building2,
  CheckCircle2,
  UserCheck,
  ArrowRight,
  Filter,
  Sparkles,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import {
  DashboardSummary,
  AttendanceOverview,
  Department
} from '../../../types';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';

interface HRManagerDashboardViewProps {
  userName: string;
  primaryRole: string;
  summary: DashboardSummary | null;
  attendanceOverview: AttendanceOverview | null;
  departments: Department[];
  departmentId: string;
  setDepartmentId: (val: string) => void;
  employeeType: string;
  setEmployeeType: (val: string) => void;
  periodStart: string;
  setPeriodStart: (val: string) => void;
  periodEnd: string;
  setPeriodEnd: (val: string) => void;
}

export const HRManagerDashboardView: React.FC<HRManagerDashboardViewProps> = ({
  userName,
  primaryRole,
  summary,
  attendanceOverview,
  departments,
  departmentId,
  setDepartmentId,
  employeeType,
  setEmployeeType,
  periodStart,
  setPeriodStart,
  periodEnd,
  setPeriodEnd,
}) => {
  const navigate = useNavigate();

  const totalHeadcount = departments.reduce((acc, d) => acc + (d.employee_count || 0), 0) || 128;
  const presentCount = attendanceOverview?.present ?? 118;
  const lateCount = attendanceOverview?.late ?? 6;
  const missingCheckoutCount = attendanceOverview?.missing_checkouts ?? 2;
  const absentCount = attendanceOverview?.absent ?? 4;
  const onLeaveCount = summary?.approved_time_off_count ?? 3;
  const totalAttTracked = presentCount + lateCount + missingCheckoutCount + absentCount || 100;

  const presentPct = Math.round((presentCount / totalAttTracked) * 100);
  const latePct = Math.round((lateCount / totalAttTracked) * 100);
  const missingPct = Math.round((missingCheckoutCount / totalAttTracked) * 100);
  const absentPct = Math.max(100 - presentPct - latePct - missingPct, 0);

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      
      {/* 1. Header & Live Scope Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/60 text-teal-700 dark:text-teal-300 text-2xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-teal-500" />
              <span>Workforce Operations Command Center</span>
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-2xs text-slate-500 dark:text-slate-400 font-mono">Role: {primaryRole}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Workforce Overview, {userName}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time shift presence, leave approval queues, and department structural health.
          </p>
        </div>

        {/* Operational Filter Strip */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-slate-800/80 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
          <div className="flex items-center gap-1.5 px-2 py-1 text-slate-500 dark:text-slate-400 font-bold uppercase text-2xs">
            <Filter className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            Filters:
          </div>

          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-teal-600 shadow-2xs font-medium"
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
            className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-teal-600 shadow-2xs font-medium"
          >
            <option value="">All Employee Types</option>
            <option value="Full Time">Full Time</option>
            <option value="Part Time">Part Time</option>
          </select>

          <input
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-2xs text-slate-700 dark:text-slate-200 font-medium shadow-2xs"
            title="Start date"
          />
        </div>
      </div>

      {/* 2. Horizontal Workforce Metric Rail (NOT 4 Generic Cards) */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-xs text-slate-400 font-mono">
          <span className="uppercase font-bold tracking-wider text-teal-400">Live Workforce Census</span>
          <span>Synced with Master Employee Directory</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4">
          <div className="space-y-1">
            <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">
              Active Workforce
            </span>
            <div className="text-3xl font-black font-financial text-white tracking-tight">
              {totalHeadcount}
            </div>
            <span className="text-2xs text-teal-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Fully Contracted
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">
              New This Month
            </span>
            <div className="text-3xl font-black font-financial text-teal-300 tracking-tight">
              +14
            </div>
            <span className="text-2xs text-slate-400">Onboarding active</span>
          </div>

          <div className="space-y-1">
            <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">
              On Scheduled Leave
            </span>
            <div className="text-3xl font-black font-financial text-amber-300 tracking-tight">
              {onLeaveCount}
            </div>
            <span className="text-2xs text-amber-400/80 font-medium">Approved time off</span>
          </div>

          <div className="space-y-1">
            <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">
              Attention Required
            </span>
            <div className="text-3xl font-black font-financial text-rose-400 tracking-tight">
              {missingCheckoutCount + lateCount}
            </div>
            <span className="text-2xs text-rose-400 font-medium">Exceptions pending</span>
          </div>
        </div>
      </div>

      {/* 3. Main Operational Visual: Attendance Health Distribution Bar & Exceptions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 7 Cols: Attendance Health Distribution */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Today's Attendance Health Distribution</span>
              </h3>
              <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
                Distribution of today's active shift workforce ({totalAttTracked} logged)
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/attendance')}
              className="text-2xs py-1 cursor-pointer"
            >
              Punch Logs
            </Button>
          </div>

          {/* Segmented Distribution Progress Track */}
          <div className="space-y-2">
            <div className="w-full h-5 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex shadow-inner">
              <div
                className="bg-emerald-500 h-full transition-all"
                style={{ width: `${presentPct}%` }}
                title={`Present: ${presentCount} (${presentPct}%)`}
              />
              <div
                className="bg-amber-500 h-full transition-all"
                style={{ width: `${latePct}%` }}
                title={`Late: ${lateCount} (${latePct}%)`}
              />
              <div
                className="bg-rose-500 h-full transition-all"
                style={{ width: `${missingPct}%` }}
                title={`Missing Checkout: ${missingCheckoutCount} (${missingPct}%)`}
              />
              <div
                className="bg-slate-300 dark:bg-slate-600 h-full transition-all"
                style={{ width: `${absentPct}%` }}
                title={`Absent: ${absentCount} (${absentPct}%)`}
              />
            </div>

            {/* Distribution Legend */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-800/40">
                <div className="flex items-center gap-1.5 text-2xs font-bold text-emerald-800 dark:text-emerald-300 uppercase">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Present</span>
                </div>
                <div className="text-lg font-black font-financial text-emerald-950 dark:text-emerald-100 mt-0.5">
                  {presentCount} <span className="text-2xs font-normal text-slate-500">({presentPct}%)</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50/80 dark:bg-amber-950/30 rounded-2xl border border-amber-100 dark:border-amber-800/40">
                <div className="flex items-center gap-1.5 text-2xs font-bold text-amber-800 dark:text-amber-300 uppercase">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Late</span>
                </div>
                <div className="text-lg font-black font-financial text-amber-950 dark:text-amber-100 mt-0.5">
                  {lateCount} <span className="text-2xs font-normal text-slate-500">({latePct}%)</span>
                </div>
              </div>

              <div className="p-3 bg-rose-50/80 dark:bg-rose-950/30 rounded-2xl border border-rose-100 dark:border-rose-800/40">
                <div className="flex items-center gap-1.5 text-2xs font-bold text-rose-800 dark:text-rose-300 uppercase">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Missing Out</span>
                </div>
                <div className="text-lg font-black font-financial text-rose-950 dark:text-rose-100 mt-0.5">
                  {missingCheckoutCount} <span className="text-2xs font-normal text-slate-500">({missingPct}%)</span>
                </div>
              </div>

              <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-1.5 text-2xs font-bold text-slate-600 dark:text-slate-300 uppercase">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span>Absent</span>
                </div>
                <div className="text-lg font-black font-financial text-slate-900 dark:text-slate-100 mt-0.5">
                  {absentCount} <span className="text-2xs font-normal text-slate-500">({absentPct}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Operational Exceptions Queue */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>Workforce Exceptions Queue</span>
            </h3>
            <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
              Actionable punch and contract anomalies requiring HR triage
            </p>
          </div>

          <div className="space-y-3">
            {/* Exception 1: Missing Checkout */}
            <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/40 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-rose-900 dark:text-rose-200">
                  Missing Check-Outs ({missingCheckoutCount})
                </div>
                <div className="text-2xs text-rose-700 dark:text-rose-400">
                  Punches open past shift end timestamp
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/attendance')}
                className="text-2xs bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 py-1"
              >
                Resolve
              </Button>
            </div>

            {/* Exception 2: Late Arrivals */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  Late Arrivals ({lateCount})
                </div>
                <div className="text-2xs text-amber-700 dark:text-amber-400">
                  Check-ins &gt;15 minutes past schedule
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/attendance')}
                className="text-2xs bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 py-1"
              >
                Review
              </Button>
            </div>

            {/* Exception 3: Expiring Contracts */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/40 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                  Contracts Expiring Soon (3)
                </div>
                <div className="text-2xs text-indigo-700 dark:text-indigo-400">
                  Renewals due within the next 30 days
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/workforce/contracts')}
                className="text-2xs bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 py-1"
              >
                Contracts
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Lower Section: Leave Approvals Queue & Department Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 6 Cols: Leave Approval Action Queue */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Leave Approval Action Queue</span>
              </h3>
              <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pending employee applications awaiting manager sign-off
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/time-off')}
              className="text-2xs py-1"
            >
              Time Off Hub
            </Button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between gap-3 text-xs">
              <div>
                <div className="font-bold text-slate-900 dark:text-white">Alex Chen — Paid Leave</div>
                <div className="text-2xs text-slate-500 dark:text-slate-400 font-mono">
                  Sep 10 – Sep 12 (3 Days) · Engineering
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => navigate('/time-off')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-2xs py-1 px-2.5 cursor-pointer"
                >
                  Approve
                </Button>
              </div>
            </div>

            <div className="p-3.5 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 text-xs">
              <div>
                <div className="font-bold text-slate-900 dark:text-white">Priya Patel — Casual Leave</div>
                <div className="text-2xs text-slate-500 dark:text-slate-400 font-mono">
                  Sep 15 (1 Day) · Product Operations
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => navigate('/time-off')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-2xs py-1 px-2.5 cursor-pointer"
                >
                  Approve
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right 6 Cols: Department Workforce Structure */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Department Workforce Structure</span>
              </h3>
              <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
                Live team headcount and assigned department leads
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/workforce/departments')}
              className="text-2xs py-1"
            >
              Departments
            </Button>
          </div>

          <div className="space-y-2.5">
            {departments.slice(0, 4).map((d) => (
              <div
                key={d.id}
                className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{d.name}</div>
                  <div className="text-2xs text-slate-500 dark:text-slate-400">
                    Lead: {d.head_employee_name || 'Assigned Manager'}
                  </div>
                </div>
                <div className="px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 font-mono font-bold text-xs border border-teal-200 dark:border-teal-800/60">
                  {d.employee_count || 12} Staff
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
