import React from 'react';
import { 
  Users, 
  FileText, 
  CalendarCheck, 
  Clock, 
  Calculator, 
  TrendingUp 
} from 'lucide-react';

export const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: Users,
      title: 'Employee Management',
      description: 'Centralize employee profiles, departments, managers and workforce information.',
      accent: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20 group-hover:border-indigo-500/40',
    },
    {
      icon: FileText,
      title: 'Contracts & Schedules',
      description: 'Manage employment contracts, wage structures and working schedules.',
      accent: 'text-teal-400 bg-teal-500/10 border-teal-500/20 group-hover:border-teal-500/40',
    },
    {
      icon: CalendarCheck,
      title: 'Attendance',
      description: 'Track check-ins, check-outs, worked hours and attendance exceptions.',
      accent: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20 group-hover:border-cyan-500/40',
    },
    {
      icon: Clock,
      title: 'Time Off',
      description: 'Manage leave requests, approvals and employee leave balances.',
      accent: 'text-amber-400 bg-amber-500/10 border-amber-500/20 group-hover:border-amber-500/40',
    },
    {
      icon: Calculator,
      title: 'Payroll',
      description: 'Compute, validate and manage payroll through a structured payroll workflow.',
      accent: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 group-hover:border-emerald-500/40',
    },
    {
      icon: TrendingUp,
      title: 'Reports & Analytics',
      description: 'Understand salary costs, attendance health and workforce trends.',
      accent: 'text-purple-400 bg-purple-500/10 border-purple-500/20 group-hover:border-purple-500/40',
    },
  ];

  return (
    <section id="features" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <h2 className="text-xs sm:text-sm uppercase tracking-widest text-teal-400 font-semibold mb-3">
          Core Platform Capabilities
        </h2>
        <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Everything you need to manage your workforce
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, idx) => {
          const Icon = f.icon;
          return (
            <div 
              key={idx}
              className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/8 backdrop-blur-xl transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border mb-5 transition-transform group-hover:scale-105 ${f.accent}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{f.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
