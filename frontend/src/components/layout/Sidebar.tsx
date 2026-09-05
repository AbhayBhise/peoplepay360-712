import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Building2,
  FileSpreadsheet,
  Clock,
  CalendarDays,
  CircleDollarSign,
  Layers,
  BarChart3,
  CalendarCheck,
  User,
  LogOut,
  ShieldCheck,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  visible: boolean;
  badge?: string | number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<{ isOpen?: boolean; onClose?: () => void }> = ({
  isOpen = true,
  onClose,
}) => {
  const { user, logout, isHRMPlus, isHRPUPlus, isHRPMPlus, hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const sections: NavSection[] = [
    {
      title: 'Overview',
      items: [
        {
          label: 'Dashboard',
          path: '/dashboard',
          icon: <LayoutDashboard className="w-4 h-4" />,
          visible: true,
        },
      ],
    },
    {
      title: 'Workforce',
      items: [
        {
          label: 'Employees',
          path: '/employees',
          icon: <Users className="w-4 h-4" />,
          visible: true,
        },
        {
          label: 'Departments',
          path: '/departments',
          icon: <Building2 className="w-4 h-4" />,
          visible: isHRMPlus(),
        },
        {
          label: 'Contracts',
          path: '/contracts',
          icon: <FileSpreadsheet className="w-4 h-4" />,
          visible: isHRMPlus() || hasRole('Employee'),
        },
        {
          label: 'Working Schedules',
          path: '/working-schedules',
          icon: <CalendarCheck className="w-4 h-4" />,
          visible: isHRMPlus(),
        },
      ],
    },
    {
      title: 'Time & Attendance',
      items: [
        {
          label: 'Attendance',
          path: '/attendance',
          icon: <Clock className="w-4 h-4" />,
          visible: true,
        },
        {
          label: 'Time Off & Leaves',
          path: '/time-off',
          icon: <CalendarDays className="w-4 h-4" />,
          visible: true,
        },
      ],
    },
    {
      title: 'Payroll & Finance',
      items: [
        {
          label: 'Payrun Batches',
          path: '/payroll/payruns',
          icon: <CircleDollarSign className="w-4 h-4" />,
          visible: isHRPUPlus(),
        },
        {
          label: 'All Payslips',
          path: '/payroll/payslips',
          icon: <FileSpreadsheet className="w-4 h-4" />,
          visible: true,
        },
        {
          label: 'Salary Structures',
          path: '/payroll/salary-structures',
          icon: <Layers className="w-4 h-4" />,
          visible: isHRPMPlus(),
        },
      ],
    },
    {
      title: 'Insights',
      items: [
        {
          label: 'Reports & Analytics',
          path: '/reports',
          icon: <BarChart3 className="w-4 h-4" />,
          visible: isHRPUPlus(),
        },
        {
          label: 'My Profile',
          path: '/profile',
          icon: <User className="w-4 h-4" />,
          visible: true,
        },
      ],
    },
    {
      title: 'Administration',
      items: [
        {
          label: 'User Management',
          path: '/admin/users',
          icon: <ShieldCheck className="w-4 h-4" />,
          visible: hasRole('Admin'),
        },
      ],
    },
  ];

  const primaryRole = user?.roles?.[0] || 'User';

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 backdrop-blur-md">
        <NavLink to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-indigo-600 via-indigo-500 to-teal-400 text-white flex items-center justify-center font-black text-lg shadow-md border border-white/20 group-hover:scale-105 group-hover:shadow-indigo-500/25 transition-all">
            P
          </div>
          <div className="leading-tight">
            <span className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">
              People<span className="text-teal-600 dark:text-teal-400">Pay360</span>
            </span>
            <span className="block text-2xs text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase">
              Command Center
            </span>
          </div>
        </NavLink>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {sections.map((section) => {
          const visibleItems = section.items.filter((item) => item.visible);
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="space-y-1">
              <div className="px-3 text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 flex items-center justify-between">
                <span>{section.title}</span>
              </div>
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const isActive =
                    item.path === '/dashboard'
                      ? location.pathname === '/dashboard' || location.pathname === '/'
                      : location.pathname.startsWith(item.path);

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                        isActive
                          ? 'bg-linear-to-r from-indigo-600 to-indigo-700 text-white font-semibold shadow-md shadow-indigo-500/20 border border-indigo-400/30'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:translate-x-0.5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`shrink-0 transition-all ${
                            isActive ? 'text-teal-300 scale-110' : 'text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                          }`}
                        >
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-2xs bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30 px-1.5 py-0.2 rounded-full font-mono">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User Role Card in Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/40">
        <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
          <div
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
            title="View Profile"
          >
            <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-indigo-600 to-teal-500 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs border border-white/20">
              {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name || user?.email?.split('@')[0]}</div>
              <div className="text-2xs text-teal-600 dark:text-teal-400 font-semibold truncate flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{primaryRole}</span>
              </div>
            </div>
          </div>
          <button
            onClick={async () => {
              await logout();
              window.location.href = '/';
            }}
            title="Sign out"
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
