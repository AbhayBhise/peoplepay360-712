import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Navbar } from './Navbar';
import { ChevronRight } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const location = useLocation();

  // Generate breadcrumb items from path
  const pathSegments = location.pathname.split('/').filter(Boolean);

  const getSegmentTitle = (segment: string) => {
    if (segment === 'dashboard') return 'Dashboard';
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
    if (!isNaN(Number(segment))) return `#${segment}`;
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <Navbar />

      {/* Sub-header / Breadcrumb Bar */}
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-2.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <nav className="flex items-center space-x-1.5 text-xs text-slate-500">
            <Link to="/" className="hover:text-slate-800 font-medium">
              Home
            </Link>
            {pathSegments.map((seg, idx) => {
              const url = `/${pathSegments.slice(0, idx + 1).join('/')}`;
              const isLast = idx === pathSegments.length - 1;
              return (
                <React.Fragment key={url}>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                  {isLast ? (
                    <span className="font-semibold text-[#714B67]">{getSegmentTitle(seg)}</span>
                  ) : (
                    <Link to={url} className="hover:text-slate-800">
                      {getSegmentTitle(seg)}
                    </Link>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          PeoplePay360 HR & Payroll — Odoo Hackathon Edition
        </div>
      </footer>
    </div>
  );
};
