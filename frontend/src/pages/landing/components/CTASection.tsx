import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export const CTASection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="relative rounded-3xl bg-linear-to-r from-indigo-950/80 via-slate-900/90 to-teal-950/80 border border-white/15 p-8 sm:p-14 text-center overflow-hidden shadow-2xl backdrop-blur-xl">
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Ready to simplify workforce management?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Bring employee management, attendance, time off and payroll together with PeoplePay360.
          </p>
          <div className="pt-4 flex justify-center">
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-base font-bold bg-linear-to-r from-indigo-600 via-indigo-500 to-teal-500 text-white shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/40 hover:brightness-110 active:scale-98 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
