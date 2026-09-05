import React from 'react';
import { Users, CalendarCheck, Calculator, BarChart3 } from 'lucide-react';

export const WorkflowSection: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Manage Employees',
      description: 'Onboard personnel, define departments, and establish active contracts & schedules.',
      icon: Users,
      color: 'from-indigo-500 to-indigo-600',
    },
    {
      step: '02',
      title: 'Track Attendance & Time Off',
      description: 'Capture daily check-ins, record worked hours, and approve leave requests.',
      icon: CalendarCheck,
      color: 'from-teal-500 to-teal-600',
    },
    {
      step: '03',
      title: 'Process Payroll',
      description: 'Run 2-step payruns, evaluate salary rules, and validate payslip line items.',
      icon: Calculator,
      color: 'from-cyan-500 to-cyan-600',
    },
    {
      step: '04',
      title: 'Analyze Workforce',
      description: 'Review salary trends, department costs, and attendance health metrics.',
      icon: BarChart3,
      color: 'from-emerald-500 to-emerald-600',
    },
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-24 border-t border-white/10 bg-slate-900/40 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-xs sm:text-sm uppercase tracking-widest text-indigo-400 font-semibold mb-3">
            Seamless Lifecycle
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            From workforce activity to payroll — connected end to end
          </p>
        </div>

        {/* Desktop Horizontal Timeline & Mobile Vertical Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx} 
                className="relative p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 backdrop-blur-xl transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-white/10 text-slate-200 border border-white/10">
                      STEP {item.step}
                    </span>
                    <div className={`w-10 h-10 rounded-xl bg-linear-to-tr ${item.color} flex items-center justify-center text-white shadow-md`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Horizontal Indicator on Desktop */}
                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-slate-800 border border-white/20 text-slate-400 text-xs flex items-center justify-center font-bold">
                    →
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
