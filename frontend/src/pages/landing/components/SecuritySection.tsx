import React from 'react';
import { ShieldCheck, KeyRound, Lock, CheckCircle2 } from 'lucide-react';

export const SecuritySection: React.FC = () => {
  const securityPillars = [
    {
      icon: ShieldCheck,
      title: 'Role-Based Access Control',
      description: 'Strict authorization barriers ensuring users access only endpoints and data appropriate for their role.',
    },
    {
      icon: KeyRound,
      title: 'Secure Authentication',
      description: 'JWT-backed token authentication with stateless API verification and automated session management.',
    },
    {
      icon: Lock,
      title: 'Protected Payroll Information',
      description: 'Confidential salary figures and tax withholdings are blocked from unauthorized organizational tiers.',
    },
    {
      icon: CheckCircle2,
      title: 'Controlled Payroll Authorization',
      description: 'Mandatory Maker-Checker workflow separates payrun computation from managerial validation and payout.',
    },
  ];

  return (
    <section id="security" className="py-16 sm:py-24 border-t border-white/10 bg-slate-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-xs sm:text-sm uppercase tracking-widest text-indigo-400 font-semibold mb-3">
            Enterprise Security
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Built for secure workforce management
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {securityPillars.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 backdrop-blur-xl transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
