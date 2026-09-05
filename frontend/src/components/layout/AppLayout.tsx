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
    <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar (Desktop Persistent + Mobile Drawer) */}
      <Sidebar
        isOpen={sidebarMobileOpen}
        onClose={() => setSidebarMobileOpen(false)}
      />

      {/* Backdrop for Mobile Sidebar */}
      {sidebarMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-20 md:hidden"
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
        <div className="bg-white/80 backdrop-blur-xs border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-2.5 shadow-2xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <nav className="flex items-center space-x-1.5 text-xs text-slate-500">
              <Link to="/dashboard" className="hover:text-slate-900 flex items-center gap-1 font-medium">
                <Home className="w-3.5 h-3.5 text-slate-400" />
                <span>Command Center</span>
              </Link>
              {pathSegments.map((seg, idx) => {
                const url = `/${pathSegments.slice(0, idx + 1).join('/')}`;
                const isLast = idx === pathSegments.length - 1;
                return (
                  <React.Fragment key={url}>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    {isLast ? (
                      <span className="font-bold text-[#714B67] truncate">{getSegmentTitle(seg)}</span>
                    ) : (
                      <Link to={url} className="hover:text-slate-900 font-medium truncate">
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
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-3.5 text-center text-2xs text-slate-400 font-medium">
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
