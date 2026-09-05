import React from 'react';
import { 
  Users, 
  FileText, 
  Calendar, 
  Clock, 
  Calculator, 
  BarChart3, 
  ArrowRight, 
  Check 
} from 'lucide-react';

export const EcosystemSection: React.FC = () => {
  const nodes = [
    { title: 'Employees', desc: 'Master Profiles', icon: Users, color: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10' },
    { title: 'Contracts', desc: 'Wages in ₹', icon: FileText, color: 'text-teal-400 border-teal-500/30 bg-teal-500/10' },
    { title: 'Working Schedules', desc: 'Shifts & Hours', icon: Calendar, color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' },
    { title: 'Attendance & Time Off', desc: 'Worked Days', icon: Clock, color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
    { title: 'Payroll Engine', desc: '2-Step Payruns', icon: Calculator, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
    { title: 'Payslips & Reports', desc: 'Disbursal & PDFs', icon: BarChart3, color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
  ];

  return (
    <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <h2 className="text-xs sm:text-sm uppercase tracking-widest text-teal-400 font-semibold mb-3">
          Connected Architecture
        </h2>
        <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          The Connected PeoplePay360 Ecosystem
        </p>
        <p className="text-sm sm:text-base text-slate-300 mt-3">
          Every workforce event flows seamlessly into automated payroll calculations.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 relative">
        {nodes.map((n, idx) => {
          const Icon = n.icon;
          return (
            <div 
              key={idx}
              className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 backdrop-blur-xl flex flex-col items-center text-center justify-center transition-all group"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center border mb-3 transition-transform group-hover:scale-110 ${n.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">{n.title}</h4>
              <p className="text-[11px] text-slate-400">{n.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
