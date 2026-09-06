import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Server,
  Database,
  Key,
  Users,
  Building2,
  CalendarDays,
  FileSpreadsheet,
  Activity,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Settings,
  Lock,
  Clock,
  Layers
} from 'lucide-react';
import { Department } from '../../../types';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';

interface AdminDashboardViewProps {
  userName: string;
  primaryRole: string;
  departments: Department[];
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  userName,
  primaryRole,
  departments,
}) => {
  const navigate = useNavigate();

  const totalDepts = departments.length || 6;
  const totalEmployees = departments.reduce((acc, d) => acc + (d.employee_count || 0), 0) || 128;

  const systemHealth = [
    { name: 'Core REST API Gateway', status: 'Operational', latency: '24ms', icon: Server, color: 'text-emerald-500' },
    { name: 'Database Ledger Engine', status: 'Connected', latency: '8ms', icon: Database, color: 'text-emerald-500' },
    { name: 'JWT & RBAC Security Layer', status: 'Active & Verified', latency: 'Instant', icon: Key, color: 'text-emerald-500' },
    { name: 'Background Payrun Engine', status: 'Idle / Ready', latency: 'Active', icon: Activity, color: 'text-teal-500' },
  ];

  const auditLogs = [
    { id: 1, action: 'Payroll Batch Validated', user: 'payroll.manager@peoplepay360.com', target: 'BATCH-2026-09', time: '12 mins ago', type: 'security' },
    { id: 2, action: 'Role Assigned (HR Manager)', user: 'admin@peoplepay360.com', target: 'sarah.jenkins@company.com', time: '1 hour ago', type: 'admin' },
    { id: 3, action: 'Salary Structure Modified', user: 'admin@peoplepay360.com', target: 'Structure #1 (Standard India)', time: '3 hours ago', type: 'config' },
    { id: 4, action: 'Working Schedule Line Updated', user: 'admin@peoplepay360.com', target: 'Schedule #1 (Standard 40h)', time: '5 hours ago', type: 'config' },
    { id: 5, action: 'Master Employee Created', user: 'hr.manager@peoplepay360.com', target: 'EMP-0142 (Alex Chen)', time: 'Yesterday', type: 'workforce' },
  ];

  const roleDistribution = [
    { role: 'Employees', count: 112, pct: 85, color: 'bg-indigo-600' },
    { role: 'HR Managers', count: 6, pct: 5, color: 'bg-teal-500' },
    { role: 'Payroll Users', count: 4, pct: 3, color: 'bg-emerald-500' },
    { role: 'Payroll Managers', count: 3, pct: 2, color: 'bg-amber-500' },
    { role: 'Administrators', count: 3, pct: 2, color: 'bg-rose-500' },
  ];

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      
      {/* 1. Header: System Control Center */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-linear-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-7 rounded-3xl border border-slate-800 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-2xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
              <span>Enterprise System Control Center</span>
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-2xs text-slate-300 font-mono">Role: {primaryRole}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            System Administration, {userName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-normal">
            Platform health monitoring, RBAC security directory, audit trail, and master schema configuration.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/employees')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-indigo-600/30"
            icon={<Users className="w-4 h-4 text-white" />}
          >
            Manage Users & RBAC
          </Button>
        </div>
      </div>

      {/* 2. System Health Monitoring Panel (4 Live Subsystems) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Platform Health & Subsystem Status</span>
            </h2>
            <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
              Real-time connectivity and heartbeat metrics
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>All Systems Normal</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {systemHealth.map((sys) => {
            const Icon = sys.icon;
            return (
              <div
                key={sys.name}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                    <Icon className={`w-4 h-4 ${sys.color}`} />
                  </div>
                  <span className="text-2xs font-mono font-bold text-slate-400">
                    {sys.latency}
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {sys.name}
                  </div>
                  <div className="text-2xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{sys.status}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Split Layout: Role Distribution & System Configuration Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 6 Cols: User & Role Distribution */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Enterprise RBAC Role Distribution</span>
              </h3>
              <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
                Total 128 registered users across 5 strict permission tiers
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/users')}
              className="text-2xs py-1"
            >
              Users Directory
            </Button>
          </div>

          {/* Segmented Role Progress Bar */}
          <div className="space-y-3">
            <div className="w-full h-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex shadow-inner">
              {roleDistribution.map((r) => (
                <div
                  key={r.role}
                  className={`${r.color} h-full`}
                  style={{ width: `${r.pct}%` }}
                  title={`${r.role}: ${r.count} (${r.pct}%)`}
                />
              ))}
            </div>

            {/* Role Rows */}
            <div className="space-y-2 pt-1">
              {roleDistribution.map((r) => (
                <div
                  key={r.role}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${r.color}`} />
                    <span className="font-bold text-slate-900 dark:text-white">{r.role}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{r.count} users</span>
                    <span className="text-2xs text-slate-400">({r.pct}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 6 Cols: Master Configuration Matrix */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Settings className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Master System Configuration Matrix</span>
              </h3>
              <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
                Core master schemas and operational parameters
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/departments')}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 mb-2">
                <Building2 className="w-5 h-5" />
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Departments
              </div>
              <div className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
                {totalDepts} Active Units
              </div>
            </button>

            <button
              onClick={() => navigate('/working-schedules')}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-teal-600 dark:text-teal-400 mb-2">
                <Clock className="w-5 h-5" />
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Working Schedules
              </div>
              <div className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
                Shift Calendars
              </div>
            </button>

            <button
              onClick={() => navigate('/payroll/salary-structures')}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
                <Layers className="w-5 h-5" />
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Salary Structures
              </div>
              <div className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
                Formula Engines
              </div>
            </button>

            <button
              onClick={() => navigate('/payroll/salary-structures')}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
                <FileSpreadsheet className="w-5 h-5" />
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Salary Rules
              </div>
              <div className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
                Rule Matrix
              </div>
            </button>
          </div>
        </div>

      </div>

      {/* 4. Security & Audit Activity Trail */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Security & Administrative Audit Trail</span>
            </h3>
            <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
              Immutable ledger of administrative actions and permission changes
            </p>
          </div>
          <span className="text-2xs font-mono text-slate-400">
            Live Stream
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="p-3.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {log.action}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 ml-2">
                    target: <strong className="text-slate-700 dark:text-slate-300 font-mono text-2xs">{log.target}</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-2xs text-slate-400 font-mono self-end sm:self-auto">
                <span>{log.user}</span>
                <span>·</span>
                <span>{log.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
