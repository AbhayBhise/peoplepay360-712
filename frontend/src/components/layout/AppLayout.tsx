import React, { useState } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';
import { CommandPalette } from '../common/CommandPalette';
import { QuickActionsModal } from '../common/QuickActionsModal';
import { ChevronRight, Home } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Generate breadcrumb items
  const pathSegments = location.pathname.split('/').filter(Boolean);

  const getSegmentTitle = (segment: string) => {
    if (segment === 'dashboard') return 'Overview';
    if (segment === 'employees') return 'Employees';
    if (segment === 'departments') return 'Departments';
    if (segment === 'contracts') return 'Contracts';
    if (segment === 'attendance') return 'Attendance';
    if (segment === 'time-off') return 'Time Off';
    if (segment === 'working-schedules') return 'Working Schedules';
    if (segment === 'payroll') return 'Payroll';
    if (segment === 'payruns') return 'Payruns';
    if (segment === 'payslips') return 'Payslips';
    if (segment === 'salary-structures') return 'Salary Structures';
    if (segment === 'reports') return 'Reports';
    if (!isNaN(Number(segment))) return `#${segment}`;
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  const handleTriggerAction = (actionKey: string) => {
    if (actionKey === 'new_employee') navigate('/employees');
    else if (actionKey === 'record_punch') navigate('/attendance');
    else if (actionKey === 'request_leave') navigate('/time-off');
    else if (actionKey === 'launch_payrun') navigate('/payroll/payruns');
  };

  return (
    <div className="min-h-screen flex bg-transparent text-slate-900 dark:text-slate-100 font-sans relative overflow-x-hidden">
      {/* Ambient background decoration glow orbs */}
      <div className="fixed pointer-events-none -top-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
      <div className="fixed pointer-events-none top-1/3 -left-28 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -z-10" />
      <div className="fixed pointer-events-none -bottom-24 right-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl -z-10" />

      {/* Sidebar (Desktop Persistent + Mobile Drawer) */}
      <Sidebar
        isOpen={sidebarMobileOpen}
        onClose={() => setSidebarMobileOpen(false)}
      />

      {/* Backdrop for Mobile Sidebar */}
      {sidebarMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-20 md:hidden animate-fade-in"
          onClick={() => setSidebarMobileOpen(false)}
        />
      )}

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <TopHeader
          onToggleSidebar={() => setSidebarMobileOpen(!sidebarMobileOpen)}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          onOpenQuickActions={() => setQuickActionsOpen(true)}
        />

        {/* Sub-Header Context Bar with Breadcrumb */}
        <div className="bg-white/75 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 lg:px-8 py-2.5 shadow-2xs transition-colors duration-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <nav className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Link to="/dashboard" className="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 font-medium transition-colors">
                <Home className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                <span>Command Center</span>
              </Link>
              {pathSegments.map((seg, idx) => {
                const url = `/${pathSegments.slice(0, idx + 1).join('/')}`;
                const isLast = idx === pathSegments.length - 1;
                return (
                  <React.Fragment key={url}>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                    {isLast ? (
                      <span className="font-bold text-indigo-600 dark:text-indigo-300 truncate bg-indigo-50/80 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-800/60">
                        {getSegmentTitle(seg)}
                      </span>
                    ) : (
                      <Link to={url} className="hover:text-indigo-600 dark:hover:text-indigo-400 font-medium truncate transition-colors">
                        {getSegmentTitle(seg)}
                      </Link>
                    )}
                  </React.Fragment>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Routed Page Container */}
        <main
          key={location.pathname}
          className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-slide-up"
        >
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="bg-white/60 backdrop-blur-xs border-t border-slate-200/80 py-3.5 text-center text-2xs text-slate-400 font-medium">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>PeoplePay360 HR & Financial Operations · Odoo Hackathon Final Round</span>
            <span className="font-mono text-slate-400">v1.2.0-enterprise</span>
          </div>
        </footer>
      </div>

      {/* Global Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onTriggerQuickAction={handleTriggerAction}
      />

      {/* Global Quick Action Drawer */}
      <QuickActionsModal
        isOpen={quickActionsOpen}
        onClose={() => setQuickActionsOpen(false)}
        onSelectAction={handleTriggerAction}
      />
    </div>
  );
};
