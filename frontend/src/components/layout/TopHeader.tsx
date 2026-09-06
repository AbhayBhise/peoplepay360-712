import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../common/ThemeToggle';
import {
  Search,
  Plus,
  Bell,
  LogOut,
  ChevronDown,
  Menu,
  Sparkles,
  ShieldCheck,
  Command,
} from 'lucide-react';

interface TopHeaderProps {
  onToggleSidebar?: () => void;
  onOpenCommandPalette: () => void;
  onOpenQuickActions?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onToggleSidebar,
  onOpenCommandPalette,
  onOpenQuickActions,
}) => {
  const { user, logout, isHRMPlus } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleLogout = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setDropdownOpen(false);
    try {
      await logout();
    } catch {
      // Ignore
    }
    navigate('/', { replace: true });
  };

  const primaryRole = user?.roles?.[0] || 'User';

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-2xs transition-colors duration-200">
      {/* Left: Mobile Toggle & Global Search Trigger */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Global Command Palette Trigger Bar */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-100/80 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl border border-slate-200/80 dark:border-slate-700/80 transition-all text-xs w-48 sm:w-72 lg:w-96 cursor-pointer text-left shadow-2xs group"
        >
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
          <span className="flex-1 truncate text-slate-400 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200">
            Search or jump to...
          </span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-2xs font-mono font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 shadow-2xs">
            <Command className="w-3 h-3" />K
          </kbd>
        </button>
      </div>

      {/* Right: Quick Actions + Theme Toggle + System Environment Pill + Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Role-Aware Global Quick Action */}
        {isHRMPlus() && (
          <button
            onClick={onOpenQuickActions || onOpenCommandPalette}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Quick Action</span>
          </button>
        )}

        {/* Global Light / Dark Theme Toggle */}
        <ThemeToggle />

        {/* System Status Pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-2xs font-bold font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>LIVE CONNECTED</span>
        </div>

        {/* User Role Pill */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{primaryRole}</span>
        </div>

        {/* User Avatar & Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-600 to-teal-500 text-white font-bold flex items-center justify-center text-xs shadow-xs border border-white dark:border-slate-700">
              {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-60 rounded-2xl shadow-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 py-1.5 z-50 animate-command">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/60">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name || 'Authorized User'}</p>
                <p className="text-2xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {user?.roles?.map((r) => (
                    <span
                      key={r}
                      className="text-2xs bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-md font-semibold border border-indigo-100 dark:border-indigo-800/60"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>

              <div className="py-1 space-y-0.5">
                <button
                  onClick={() => {
                    navigate('/dashboard');
                    setDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-700 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center justify-between cursor-pointer"
                >
                  <span>Workforce Dashboard</span>
                </button>
                <button
                  onClick={() => {
                    navigate('/profile');
                    setDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 flex items-center justify-between cursor-pointer"
                >
                  <span>My Profile & Settings</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
