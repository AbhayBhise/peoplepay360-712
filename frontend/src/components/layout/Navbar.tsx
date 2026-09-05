import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Building2,
  FileSpreadsheet,
  Clock,
  CalendarDays,
  CircleDollarSign,
  LayoutDashboard,
  CalendarCheck,
  LogOut,
  ChevronDown,
  Layers,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, hasRole, isHRMPlus, isHRPUPlus, isHRPMPlus } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [payrollMenuOpen, setPayrollMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
      visible: isHRMPlus() || hasRole(['Admin']),
    },
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
      label: 'Attendance',
      path: '/attendance',
      icon: <Clock className="w-4 h-4" />,
      visible: true,
    },
    {
      label: 'Time Off',
      path: '/time-off',
      icon: <CalendarDays className="w-4 h-4" />,
      visible: true,
    },
    {
      label: 'Schedules',
      path: '/working-schedules',
      icon: <CalendarCheck className="w-4 h-4" />,
      visible: isHRMPlus(),
    },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const userRoles = user?.roles || [];
  const primaryRole = userRoles[0] || 'User';

  return (
    <header className="sticky top-0 z-40 bg-[#714B67] text-white shadow-md border-b border-[#5d3b54]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand / Logo */}
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-2.5 font-bold text-lg tracking-tight hover:opacity-90">
              <div className="w-8 h-8 rounded-lg bg-[#008784] flex items-center justify-center text-white font-black shadow-xs">
                P
              </div>
              <span className="text-white">People<span className="text-teal-300">Pay360</span></span>
            </Link>

            {/* Main Nav Links */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems
                .filter((item) => item.visible)
                .map((item) => {
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        active
                          ? 'bg-white/20 text-white shadow-xs font-semibold'
                          : 'text-purple-100 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  );
                })}

              {/* Payroll Dropdown (HRPU / HRPM / Admin) */}
              {isHRPUPlus() && (
                <div className="relative">
                  <button
                    onClick={() => setPayrollMenuOpen(!payrollMenuOpen)}
                    onBlur={() => setTimeout(() => setPayrollMenuOpen(false), 200)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      location.pathname.startsWith('/payroll') || location.pathname.startsWith('/salary')
                        ? 'bg-white/20 text-white font-semibold'
                        : 'text-purple-100 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <CircleDollarSign className="w-4 h-4" />
                    <span>Payroll</span>
                    <ChevronDown className="w-3 h-3 ml-0.5 opacity-70" />
                  </button>

                  {payrollMenuOpen && (
                    <div className="absolute left-0 mt-2 w-52 rounded-xl shadow-xl bg-white text-slate-800 border border-slate-200 py-1 z-50 animate-fade-in">
                      <Link
                        to="/payroll/payruns"
                        className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-purple-50 hover:text-[#714B67]"
                      >
                        <CircleDollarSign className="w-4 h-4 text-purple-600" />
                        <span>Payruns</span>
                      </Link>
                      <Link
                        to="/payroll/payslips"
                        className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-purple-50 hover:text-[#714B67]"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                        <span>All Payslips</span>
                      </Link>
                      {isHRPMPlus() && (
                        <>
                          <div className="h-px bg-slate-100 my-1" />
                          <Link
                            to="/payroll/salary-structures"
                            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-purple-50 hover:text-[#714B67]"
                          >
                            <Layers className="w-4 h-4 text-amber-600" />
                            <span>Salary Structures & Rules</span>
                          </Link>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </nav>
          </div>

          {/* User Profile & Quick Actions */}
          <div className="flex items-center gap-3">
            {/* Role Badge */}
            <div className="hidden sm:flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-full text-2xs font-semibold text-purple-100 border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{primaryRole}</span>
            </div>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-teal-500 text-white font-bold flex items-center justify-center text-xs shadow-xs border border-white/30">
                  {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="hidden lg:inline text-xs font-medium text-purple-50 max-w-[120px] truncate">
                  {user?.name || user?.email}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-purple-200" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-2xl bg-white text-slate-800 border border-slate-200 py-1.5 z-50 animate-fade-in">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">{user?.name || 'Logged in user'}</p>
                    <p className="text-2xs text-slate-500 truncate">{user?.email}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {userRoles.map((r) => (
                        <span key={r} className="text-2xs bg-purple-50 text-[#714B67] px-1.5 py-0.5 rounded font-semibold border border-purple-100">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
