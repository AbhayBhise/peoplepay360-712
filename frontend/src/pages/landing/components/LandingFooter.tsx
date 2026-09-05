import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export const LandingFooter: React.FC = () => {
  const navigate = useNavigate();

  return (
    <footer className="border-t border-slate-200/80 dark:border-white/10 bg-slate-100/60 dark:bg-slate-950 py-12 relative z-10 text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-200/80 dark:border-white/10">
          
          {/* Brand */}
          <div className="flex flex-col items-center md:items-start gap-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-linear-to-tr from-indigo-600 to-teal-500 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-bold text-base text-slate-900 dark:text-white">PeoplePay360</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Workforce management, simplified.</p>
          </div>

          {/* Nav Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-slate-900 dark:hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-slate-900 dark:hover:text-white transition-colors">How It Works</a>
            <a href="#solutions" className="hover:text-slate-900 dark:hover:text-white transition-colors">Solutions</a>
            <a href="#security" className="hover:text-slate-900 dark:hover:text-white transition-colors">Security</a>
            <button 
              onClick={() => navigate('/login')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Sign In
            </button>
          </nav>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Integrated HRMS & Autonomous Payroll Engine</span>
          </div>
          <div>
            © {new Date().getFullYear()} PeoplePay360. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
