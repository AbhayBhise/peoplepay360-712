import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
    navigate('/login', { replace: true });
  };

  const primaryRole = user?.roles?.[0] || 'User';

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
      {/* Left: Mobile Toggle & Global Search Trigger */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Global Command Palette Trigger Bar */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-100/80 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-xl border border-slate-200/80 transition-all text-xs w-48 sm:w-72 lg:w-96 cursor-pointer text-left shadow-2xs group"
        >
          <Search className="w-4 h-4 text-slate-400 group-hover:text-[#714B67] transition-colors" />
          <span className="flex-1 truncate text-slate-400 group-hover:text-slate-600">
            Search or jump to...
          </span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-2xs font-mono font-bold text-slate-500 bg-white rounded border border-slate-200 shadow-2xs">
            <Command className="w-3 h-3" />K
          </kbd>
        </button>
      </div>

      {/* Right: Quick Actions + System Environment Pill + Profile */}
      <div className="flex items-center gap-3">
        {/* Role-Aware Global Quick Action */}
        {isHRMPlus() && (
          <button
            onClick={onOpenQuickActions || onOpenCommandPalette}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#714B67] hover:bg-[#5a3b52] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Quick Action</span>
          </button>
        )}

        {/* System Status Pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-2xs font-bold font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>LIVE CONNECTED</span>
        </div>

        {/* User Role Pill */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-100 text-[#714B67] text-xs font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{primaryRole}</span>
        </div>

        {/* Quick Sign Out Header Button */}
        <button
          onClick={handleLogout}
          title="Sign out of PeoplePay360"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/80 hover:border-rose-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-500" />
          <span className="hidden sm:inline">Sign out</span>
        </button>

        {/* User Avatar & Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-[#714B67] to-[#008784] text-white font-bold flex items-center justify-center text-xs shadow-xs border border-white">
              {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-60 rounded-2xl shadow-xl bg-white text-slate-800 border border-slate-200 py-1.5 z-50 animate-command">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900 truncate">{user?.name || 'Authorized User'}</p>
                <p className="text-2xs text-slate-500 truncate">{user?.email}</p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {user?.roles?.map((r) => (
                    <span
                      key={r}
                      className="text-2xs bg-purple-50 text-[#714B67] px-1.5 py-0.5 rounded-md font-semibold border border-purple-100"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    navigate('/dashboard');
                    setDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-purple-50 hover:text-[#714B67] flex items-center justify-between cursor-pointer"
                >
                  <span>Workforce Dashboard</span>
                </button>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={handleLogout}
                  className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
