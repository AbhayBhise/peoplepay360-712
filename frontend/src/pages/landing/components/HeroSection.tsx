import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Users, 
  FileText,
  Clock,
  CalendarDays,
  CircleDollarSign,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export const HeroSection: React.FC = () => {
  const navigate = useNavigate();

  const workflowSteps = [
    {
      id: 'emp',
      label: 'EMPLOYEE',
      desc: 'Master Identity & Profile',
      icon: Users,
      badge: 'Active: 1,248',
      color: 'from-blue-600 to-indigo-600',
      tagColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      active: true,
    },
    {
      id: 'contract',
      label: 'CONTRACT',
      desc: 'Wage & Structure Binding',
      icon: FileText,
      badge: '100% Assigned',
      color: 'from-indigo-600 to-teal-600',
      tagColor: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
      active: true,
    },
    {
      id: 'schedule',
      label: 'SCHEDULE',
      desc: 'Shift Calendar & Hours',
      icon: Clock,
      badge: '40h Standard',
      color: 'from-teal-600 to-emerald-600',
      tagColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      active: true,
    },
    {
      id: 'attendance',
      label: 'ATTENDANCE',
      desc: 'Live Punch In/Out Logs',
      icon: CheckCircle2,
      badge: '98.4% On-Time',
      color: 'from-emerald-600 to-amber-600',
      tagColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      active: true,
    },
    {
      id: 'leave',
      label: 'TIME OFF',
      desc: 'Quota & LOP Deductions',
      icon: CalendarDays,
      badge: 'Auto-Synced',
      color: 'from-amber-600 to-rose-600',
      tagColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      active: true,
    },
    {
      id: 'payroll',
      label: 'PAYROLL',
      desc: 'Salary Rule Engine',
      icon: CircleDollarSign,
      badge: 'Batch Validated',
      color: 'from-rose-600 to-emerald-600',
      tagColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      active: true,
    },
    {
      id: 'payslip',
      label: 'PAYSLIP',
      desc: 'Signed Financial Statements',
      icon: FileSpreadsheet,
      badge: 'PDF Ready',
      color: 'from-emerald-600 to-cyan-600',
      tagColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      active: true,
    }
  ];

  return (
    <section className="relative pt-12 sm:pt-20 pb-16 sm:pb-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Header & Core Value Prop */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs sm:text-sm font-semibold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            <span>Autonomous Workforce & Financial Operations Engine</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.12]">
            Every employee. Every hour.{' '}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-600 via-teal-500 to-emerald-500 dark:from-indigo-400 dark:via-teal-300 dark:to-emerald-400">
              Every rupee. Connected.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            PeoplePay360 brings workforce management, attendance, time off and payroll together in one intelligent HR platform.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-base font-bold bg-linear-to-r from-indigo-600 via-indigo-500 to-teal-500 text-white shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/40 hover:brightness-110 active:scale-98 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center justify-center px-7 py-4 rounded-xl text-base font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200/80 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Custom PeoplePay360 Workflow Data-Rail Pipeline Visual */}
        <div className="mt-14 sm:mt-18 relative">
          {/* Ambient Glow */}
          <div className="absolute -inset-2 bg-linear-to-r from-indigo-500/15 via-teal-500/15 to-emerald-500/15 rounded-3xl blur-2xl opacity-80 pointer-events-none" />

          <div className="relative rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-6">
            
            {/* Top Pipeline Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800/60">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>The Connected PeoplePay360 Pipeline</span>
                    <span className="text-2xs font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-semibold">
                      End-to-End Operational Integrity
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Real-time data synchronization from employee onboarding to ledger-grade payslip disbursals
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-2xs font-mono text-slate-400 dark:text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>Deterministic Computation Engine</span>
              </div>
            </div>

            {/* Horizontal Workflow Track (7 Nodes Connected) */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3 relative">
              {workflowSteps.map((step, idx) => {
                const IconComponent = step.icon;
                return (
                  <div 
                    key={step.id} 
                    className="relative group p-4 rounded-2xl bg-slate-50/90 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 hover:border-indigo-500/50 dark:hover:border-indigo-400/50 hover:bg-white dark:hover:bg-slate-800/80 transition-all shadow-2xs hover:shadow-md flex flex-col justify-between"
                  >
                    <div>
                      {/* Step Indicator & Icon */}
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-9 h-9 rounded-xl bg-linear-to-br ${step.color} text-white flex items-center justify-center shadow-xs`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <span className="text-2xs font-mono font-bold text-slate-400 dark:text-slate-400">
                          0{idx + 1}
                        </span>
                      </div>

                      {/* Title & Desc */}
                      <div className="text-xs font-black text-slate-900 dark:text-white tracking-wide">
                        {step.label}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                        {step.desc}
                      </div>
                    </div>

                    {/* Step Metric / Status Tag */}
                    <div className="mt-4 pt-2.5 border-t border-slate-200/60 dark:border-white/10">
                      <span className={`inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${step.tagColor}`}>
                        {step.badge}
                      </span>
                    </div>

                    {/* Right Connection Chevron on desktop (between steps) */}
                    {idx < workflowSteps.length - 1 && (
                      <div className="hidden md:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-4 h-4 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 items-center justify-center text-slate-400 pointer-events-none shadow-xs">
                        <ChevronRight className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Real-time Operational Stream Bar */}
            <div className="p-4 rounded-2xl bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-ping" />
                <div className="space-y-0.5">
                  <div className="font-bold text-white tracking-tight">Active Engine Synchronization</div>
                  <div className="text-2xs text-slate-300">
                    Attendance logs & approved leaves automatically flow into active payrun batches without manual exports
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-2xs shrink-0 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Launch Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

