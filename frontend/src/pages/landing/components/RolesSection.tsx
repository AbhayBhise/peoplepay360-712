import React from 'react';
import { 
  User, 
  UserCheck, 
  Calculator, 
  ShieldCheck, 
  Sliders 
} from 'lucide-react';

export const RolesSection: React.FC = () => {
  const roles = [
    {
      title: 'Employee',
      icon: User,
      badge: 'Self-Service',
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      items: [
        'Personal attendance & worked hours',
        'Time off requests & quota balance',
        'Personal payslips with PDF download',
      ],
    },
    {
      title: 'HR Manager',
      icon: UserCheck,
      badge: 'People Ops',
      badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
      items: [
        'Master employee directory & dossiers',
        'Attendance supervision & missing check-outs',
        'Leave request review & approvals',
      ],
    },
    {
      title: 'HR Payroll User',
      icon: Calculator,
      badge: 'Payrun Maker',
      badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      items: [
        'Payrun batch creation & scheduling',
        'Batch payslip formula computation',
        'Line-item inspection & draft management',
      ],
    },
    {
      title: 'HR Payroll Manager',
      icon: ShieldCheck,
      badge: 'Payrun Checker',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      items: [
        'Payroll audit & validation authorization',
        'Salary structures & rule configurations',
        'Disbursal finalization & compliance',
      ],
    },
    {
      title: 'Admin',
      icon: Sliders,
      badge: 'Full Access',
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      items: [
        'Complete system administration',
        'Department & organization setup',
        'Cross-module security & record controls',
      ],
    },
  ];

  return (
    <section id="solutions" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <h2 className="text-xs sm:text-sm uppercase tracking-widest text-teal-400 font-semibold mb-3">
          Role-Based Access Control
        </h2>
        <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Tailored experiences for every organizational role
        </p>
        <p className="text-sm sm:text-base text-slate-300 mt-3">
          Enforced across the API layer and user interface with zero data leakage.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        {roles.map((r, idx) => {
          const Icon = r.icon;
          return (
            <div 
              key={idx}
              className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 backdrop-blur-xl transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${r.badgeColor}`}>
                    {r.badge}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mb-3">{r.title}</h3>

                <ul className="space-y-2 text-xs text-slate-300">
                  {r.items.map((item, itemIdx) => (
                    <li key={itemIdx} className="flex items-start gap-1.5">
                      <span className="text-teal-400 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
