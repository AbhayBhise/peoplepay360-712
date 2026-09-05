import React from 'react';
import { Users, ShieldCheck, Calculator, TrendingUp } from 'lucide-react';

export const ValueStrip: React.FC = () => {
  const benefits = [
    {
      icon: Users,
      title: 'Unified Workforce Management',
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    },
    {
      icon: ShieldCheck,
      title: 'Secure Role-Based Access',
      color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
    },
    {
      icon: Calculator,
      title: 'Automated Payroll Processing',
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    },
    {
      icon: TrendingUp,
      title: 'Real-Time Workforce Insights',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
  ];

  return (
    <section className="py-8 sm:py-12 border-y border-white/10 bg-slate-900/60 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6 sm:mb-8">
          <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
            Everything HR needs. One connected platform.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {benefits.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div 
                key={idx}
                className="flex items-center gap-3.5 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border shrink-0 ${b.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-slate-200">
                  {b.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
