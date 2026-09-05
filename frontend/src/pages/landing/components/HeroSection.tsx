import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Users, 
  CalendarCheck, 
  Calculator, 
  TrendingUp, 
  CheckCircle2, 
  Clock
} from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';

export const HeroSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative pt-12 sm:pt-20 pb-16 sm:pb-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Hero Text & Call to Actions */}
          <div className="lg:col-span-6 text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs sm:text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-teal-500 dark:bg-teal-400 animate-pulse" />
              <span>Next-Generation HRMS & Payroll Automation</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.12]">
              One Platform for Your{' '}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-600 via-teal-500 to-cyan-500 dark:from-indigo-400 dark:via-teal-300 dark:to-cyan-400">
                Entire Workforce
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed font-normal">
              Manage employees, contracts, attendance, time off and payroll from one intelligent HR platform.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl text-base font-bold bg-linear-to-r from-indigo-600 via-indigo-500 to-teal-500 text-white shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/40 hover:brightness-110 active:scale-98 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-base font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200/80 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                Sign In
              </button>
            </div>
          </div>

          {/* Right Column: Decorative Dashboard UI Preview */}
          <div className="lg:col-span-6 relative">
            {/* Ambient Backlight */}
            <div className="absolute -inset-1 bg-linear-to-r from-indigo-500/20 to-teal-500/20 rounded-3xl blur-2xl opacity-75 pointer-events-none" />

            <div className="relative rounded-2xl sm:rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/15 p-5 sm:p-6 backdrop-blur-2xl shadow-xl dark:shadow-2xl space-y-4">
              {/* Window Header Badge */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400 ml-2">peoplepay360 // overview</span>
                </div>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-500/20">
                  Live Operations
                </span>
              </div>

              {/* Workforce KPI Mini Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Employees</span>
                  </div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">128 Active</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <CalendarCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>Attendance</span>
                  </div>
                  <div className="text-lg font-bold text-teal-600 dark:text-teal-300 mt-1">98.4% Health</div>
                </div>

                <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <Calculator className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span>Payrun Status</span>
                  </div>
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">Validated</div>
                </div>
              </div>

              {/* Decorative Payrun Execution Stepper */}
              <div className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Current Payrun Cycle</span>
                  <span className="font-mono text-teal-600 dark:text-teal-400 font-bold">BATCH-2026-09</span>
                </div>
                <div className="flex items-center gap-2 pt-1 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 font-medium border border-indigo-200 dark:border-indigo-500/30">1. Draft</span>
                  <span className="text-slate-400 dark:text-slate-600">→</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 font-medium border border-indigo-200 dark:border-indigo-500/30">2. Computed</span>
                  <span className="text-slate-400 dark:text-slate-600">→</span>
                  <span className="px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 font-bold border border-teal-200 dark:border-teal-500/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    3. Validated
                  </span>
                </div>
              </div>

              {/* Decorative Payslip Sample Strip */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                    ₹
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Monthly Salary Disbursal</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Formula Rule: Standard Engineering (India)</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(69000)}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Net Calculated</div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
