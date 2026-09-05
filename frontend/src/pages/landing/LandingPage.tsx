import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/currency';
import { 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  Users, 
  Calculator, 
  CalendarCheck, 
  Lock, 
  FileText, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Layers, 
  Building2, 
  FileSpreadsheet,
  ChevronRight,
  Database,
  Cpu,
  BadgeCheck
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'payslip' | 'payrun' | 'rbac'>('payslip');

  const handleCta = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Dynamic Background Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-indigo-900/15 rounded-full blur-3xl" />
      </div>

      {/* Top Navigation */}
      <header className="relative z-10 border-b border-white/10 bg-slate-950/60 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 border border-white/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg sm:text-xl tracking-tight text-white flex items-center gap-1.5">
                PeoplePay<span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-teal-400">360</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">HR & Payroll Suite</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Platform Pillars</a>
            <a href="#showcase" className="hover:text-white transition-colors">Interactive Preview</a>
            <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
          </nav>

          <div>
            <button
              onClick={handleCta}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-linear-to-r from-indigo-500 to-teal-500 text-white shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:brightness-110 active:scale-98 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {isAuthenticated ? 'Open Workspace' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-16 sm:pb-24 flex flex-col items-center text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs sm:text-sm font-medium mb-6">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Maker-Checker Payroll Engine • Enterprise RBAC • INR Standardized</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight max-w-4xl leading-[1.15]">
            Unified HR Operations &{' '}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 via-teal-300 to-cyan-400">
              Autonomous Payroll Engine
            </span>
          </h1>

          {/* Subhead */}
          <p className="mt-6 text-base sm:text-lg lg:text-xl text-slate-300 max-w-2xl leading-relaxed font-normal">
            From hire to disbursement: automated worked-hour tracking, atomic leave management, formula-driven salary structures, and maker-checker payrun validation.
          </p>

          {/* Primary CTA Button */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={handleCta}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-base font-bold bg-linear-to-r from-indigo-600 via-indigo-500 to-teal-500 text-white shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/40 hover:brightness-110 active:scale-98 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              <span>{isAuthenticated ? 'Go to Workspace Dashboard' : 'Launch Demo Workspace'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* KPI Ribbon */}
          <div className="mt-14 sm:mt-18 w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">4 Roles</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">Granular RBAC Pipeline</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-center">
              <div className="text-2xl sm:text-3xl font-bold text-teal-400 tracking-tight">2 Steps</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">Draft → Compute → Validate</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-center">
              <div className="text-2xl sm:text-3xl font-bold text-indigo-400 tracking-tight">100%</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">Audit Trail Precision</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-center">
              <div className="text-2xl sm:text-3xl font-bold text-emerald-400 tracking-tight">INR (₹)</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">Indian Rupee Currency</div>
            </div>
          </div>
        </section>

        {/* 4 Core Value Propositions */}
        <section id="features" className="py-16 sm:py-24 border-t border-white/10 bg-slate-900/40 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <h2 className="text-xs sm:text-sm uppercase tracking-widest text-teal-400 font-semibold mb-2">
                Engineered for Modern Enterprise
              </h2>
              <p className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Complete Workforce & Payroll Lifecycle Management
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1 */}
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/40 backdrop-blur-xl transition-all flex flex-col justify-between group hover:-translate-y-1">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Centralized Employee Hub</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Complete master employee dossiers with auto-generated badge IDs, department hierarchy, contract histories, and working schedule linkages.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/5 text-xs text-indigo-400 font-medium flex items-center gap-1">
                  <span>Contracts & Schedules</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Card 2 */}
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-teal-500/40 backdrop-blur-xl transition-all flex flex-col justify-between group hover:-translate-y-1">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <Calculator className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">2-Step Payrun Engine</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Automated batch salary computation with customizable rule structures (Basic, HRA, DA, PF, ESIC, Tax) and strict Maker-Checker approval workflow.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/5 text-xs text-teal-400 font-medium flex items-center gap-1">
                  <span>Draft → Compute → Validate</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Card 3 */}
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/40 backdrop-blur-xl transition-all flex flex-col justify-between group hover:-translate-y-1">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <CalendarCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Atomic Time & Leave Sync</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Biometric check-in/out tracking, missing checkout detection, annual leave allocations, and automatic worked-day salary deduction sync.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/5 text-xs text-cyan-400 font-medium flex items-center gap-1">
                  <span>Attendance Health Radar</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Card 4 */}
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/40 backdrop-blur-xl transition-all flex flex-col justify-between group hover:-translate-y-1">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">4-Layer RBAC Security</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Strict role segregation (Employee, HR Manager, Payroll User, Payroll Manager, Admin) ensuring zero financial data leaks to unauthorized tiers.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/5 text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <span>Backend & UI Enforced</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Live Screen Showcase */}
        <section id="showcase" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="text-xs sm:text-sm uppercase tracking-widest text-indigo-400 font-semibold mb-2">
              Real System Experience
            </h2>
            <p className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Interactive Product Workflow Showcase
            </p>
            <p className="text-sm sm:text-base text-slate-400 mt-3">
              Explore how PeoplePay360 executes payroll operations with mathematical precision.
            </p>
          </div>

          {/* Interactive Showcase Container */}
          <div className="rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-2xl shadow-2xl overflow-hidden">
            {/* Showcase Tab Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-slate-950/60 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs font-mono text-slate-400 ml-2">peoplepay360-engine // live-ui</span>
              </div>

              {/* Selector Tabs */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10 text-xs font-medium">
                <button
                  onClick={() => setActiveTab('payslip')}
                  className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeTab === 'payslip'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Payslip Breakdown
                </button>
                <button
                  onClick={() => setActiveTab('payrun')}
                  className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeTab === 'payrun'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Payrun Maker-Checker
                </button>
                <button
                  onClick={() => setActiveTab('rbac')}
                  className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeTab === 'rbac'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Role Matrix
                </button>
              </div>
            </div>

            {/* Showcase Viewport */}
            <div className="p-6 sm:p-8">
              {activeTab === 'payslip' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
                          SLIP-2026-0042
                        </span>
                        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Validated
                        </span>
                      </div>
                      <h4 className="text-xl font-bold text-white mt-2">Aarav Sharma — Senior Software Engineer</h4>
                      <p className="text-xs text-slate-400">Structure: Engineering Standard (India) • Worked Days: 22 / 22</p>
                    </div>

                    <div className="text-left sm:text-right bg-white/5 p-3 sm:p-4 rounded-xl border border-white/10">
                      <div className="text-xs text-slate-400 font-medium">Net Disbursable Amount</div>
                      <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
                        {formatCurrency(69000)}
                      </div>
                    </div>
                  </div>

                  {/* Earnings & Deductions Breakdown Table */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Earnings */}
                    <div className="rounded-xl bg-slate-950/50 border border-white/10 p-4">
                      <div className="text-xs font-bold uppercase tracking-wider text-teal-400 mb-3 flex items-center justify-between">
                        <span>Earnings (Allowances)</span>
                        <span>Amount</span>
                      </div>
                      <div className="space-y-2.5 text-sm">
                        <div className="flex justify-between py-1 border-b border-white/5">
                          <span className="text-slate-300">Basic Salary</span>
                          <span className="font-semibold text-white">{formatCurrency(50000)}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-white/5">
                          <span className="text-slate-300">House Rent Allowance (HRA) (40%)</span>
                          <span className="font-semibold text-white">{formatCurrency(20000)}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-white/5">
                          <span className="text-slate-300">Special Allowance</span>
                          <span className="font-semibold text-white">{formatCurrency(10000)}</span>
                        </div>
                        <div className="flex justify-between pt-2 text-base font-bold text-teal-300">
                          <span>Gross Earnings</span>
                          <span>{formatCurrency(80000)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Deductions */}
                    <div className="rounded-xl bg-slate-950/50 border border-white/10 p-4">
                      <div className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-3 flex items-center justify-between">
                        <span>Deductions & Withholdings</span>
                        <span>Amount</span>
                      </div>
                      <div className="space-y-2.5 text-sm">
                        <div className="flex justify-between py-1 border-b border-white/5">
                          <span className="text-slate-300">Provident Fund (PF - 12%)</span>
                          <span className="font-semibold text-rose-300">{formatCurrency(6000)}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-white/5">
                          <span className="text-slate-300">Tax Deducted at Source (TDS)</span>
                          <span className="font-semibold text-rose-300">{formatCurrency(4500)}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-white/5">
                          <span className="text-slate-300">Professional Tax (PT)</span>
                          <span className="font-semibold text-rose-300">{formatCurrency(500)}</span>
                        </div>
                        <div className="flex justify-between pt-2 text-base font-bold text-rose-300">
                          <span>Total Deductions</span>
                          <span>{formatCurrency(11000)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'payrun' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-md border border-teal-500/20">
                          BATCH-2026-09
                        </span>
                        <span className="text-xs text-slate-400">September 2026 Monthly Payrun</span>
                      </div>
                      <h4 className="text-xl font-bold text-white mt-2">2-Step Maker-Checker Payrun Pipeline</h4>
                    </div>
                  </div>

                  {/* 4 Step Stepper Pipeline */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-indigo-500/30 text-left">
                      <div className="flex items-center justify-between mb-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">1</span>
                        <CheckCircle2 className="w-4 h-4 text-teal-400" />
                      </div>
                      <div className="font-bold text-white text-sm">Draft</div>
                      <div className="text-xs text-slate-400 mt-1">Payrun initialized by Payroll User</div>
                    </div>

                    <div className="p-4 rounded-xl bg-white/5 border border-indigo-500/30 text-left">
                      <div className="flex items-center justify-between mb-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">2</span>
                        <CheckCircle2 className="w-4 h-4 text-teal-400" />
                      </div>
                      <div className="font-bold text-white text-sm">Computed</div>
                      <div className="text-xs text-slate-400 mt-1">Formula engine processed 48 payslips in 240ms</div>
                    </div>

                    <div className="p-4 rounded-xl bg-white/5 border border-teal-500/50 bg-teal-500/5 text-left">
                      <div className="flex items-center justify-between mb-2">
                        <span className="w-6 h-6 rounded-full bg-teal-500 text-slate-950 text-xs font-bold flex items-center justify-center">3</span>
                        <ShieldCheck className="w-4 h-4 text-teal-400" />
                      </div>
                      <div className="font-bold text-teal-300 text-sm">Validated</div>
                      <div className="text-xs text-slate-400 mt-1">Audited & approved by Payroll Manager</div>
                    </div>

                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-left opacity-70">
                      <div className="flex items-center justify-between mb-2">
                        <span className="w-6 h-6 rounded-full bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center">4</span>
                        <Clock className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="font-bold text-slate-300 text-sm">Paid</div>
                      <div className="text-xs text-slate-400 mt-1">Disbursed via bank transfer file</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/60 border border-white/10 flex items-center justify-between text-xs text-slate-300">
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-teal-400" />
                      Strict Maker-Checker protocol: Payroll User generates; only Payroll Manager can validate and authorize.
                    </span>
                    <span className="font-mono text-slate-400">Audited via PostgreSQL Ledger</span>
                  </div>
                </div>
              )}

              {activeTab === 'rbac' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="pb-4 border-b border-white/10">
                    <h4 className="text-xl font-bold text-white">4-Tier Strict Access Partitioning</h4>
                    <p className="text-xs text-slate-400 mt-1">Zero financial leakage to unauthorized personnel.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="font-bold text-indigo-400 mb-2 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Employee (Self-Service)
                      </div>
                      <ul className="text-xs text-slate-300 space-y-1.5">
                        <li>• View personal monthly attendance</li>
                        <li>• Request time off & track balance</li>
                        <li>• View own payslips in INR (₹)</li>
                        <li className="text-rose-400 font-medium">✗ Zero access to peer/company finances</li>
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="font-bold text-teal-400 mb-2 flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        HR Manager
                      </div>
                      <ul className="text-xs text-slate-300 space-y-1.5">
                        <li>• Manage employee master directory</li>
                        <li>• Review attendance & approve leaves</li>
                        <li>• Company attendance health radar</li>
                        <li className="text-rose-400 font-medium">✗ Financial KPIs & Salary charts blocked (403)</li>
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="font-bold text-emerald-400 mb-2 flex items-center gap-2">
                        <Calculator className="w-4 h-4" />
                        Payroll Manager & Admin
                      </div>
                      <ul className="text-xs text-slate-300 space-y-1.5">
                        <li>• Configure dynamic salary rule trees</li>
                        <li>• Run 2-step automated payruns</li>
                        <li>• Validate payouts & generate PDF slips</li>
                        <li className="text-emerald-400 font-medium">✓ Full company financial dashboard access</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Technical Architecture Highlights */}
        <section id="architecture" className="py-16 sm:py-24 border-t border-white/10 bg-slate-900/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <h2 className="text-xs sm:text-sm uppercase tracking-widest text-teal-400 font-semibold mb-2">
                Engineering Standard
              </h2>
              <p className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Deterministic, Secure, and Production-Ready
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <Database className="w-8 h-8 text-indigo-400 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Relational PostgreSQL Core</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  ACID-compliant transactions for payruns and attendance logs with strictly enforced foreign keys and audit timestamping.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <Cpu className="w-8 h-8 text-teal-400 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Formula Evaluation Engine</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Salary rules evaluate expressions against base contract wages and worked days in sub-millisecond execution time.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <FileText className="w-8 h-8 text-cyan-400 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Token-Secured PDF Engine</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  High-fidelity PDF payslip generation with JWT-authenticated stream endpoints and secure client-side blob handling.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl bg-linear-to-r from-indigo-900/60 via-slate-900/90 to-teal-950/60 border border-white/15 p-8 sm:p-14 text-center overflow-hidden shadow-2xl backdrop-blur-xl">
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Experience Autonomous Payroll Accuracy
              </h2>
              <p className="mt-4 text-sm sm:text-base text-slate-300">
                Explore the platform live with instant pre-configured demo logins for every enterprise role.
              </p>
              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleCta}
                  className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-base font-bold bg-linear-to-r from-indigo-500 to-teal-500 text-white shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/40 hover:brightness-110 active:scale-98 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <span>{isAuthenticated ? 'Open Workspace Dashboard' : 'Launch Demo Workspace'}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Semantic Footer */}
      <footer className="border-t border-white/10 bg-slate-950 py-10 relative z-10 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-linear-to-tr from-indigo-600 to-teal-500 flex items-center justify-center text-white">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-200">PeoplePay360</span>
            <span className="text-slate-400">• High-Integrity HR & Payroll Suite</span>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Platform Online • PostgreSQL + Node.js + Vite</span>
          </div>

          <div>
            © 2026 PeoplePay360. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
