import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  LayoutDashboard,
  Users,
  Building2,
  FileSpreadsheet,
  Clock,
  CalendarDays,
  CircleDollarSign,
  Layers,
  BarChart3,
  Plus,
  ArrowRight,
  Sparkles,
  X,
  CornerDownLeft,
} from 'lucide-react';

interface CommandItem {
  id: string;
  category: 'Navigation' | 'Actions' | 'Employees' | 'Payroll';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
  roleAllowed: boolean;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerQuickAction?: (actionType: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onTriggerQuickAction,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { isHRMPlus, isHRPUPlus, isHRPMPlus, user } = useAuth();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const items: CommandItem[] = [
    // Navigation
    {
      id: 'nav-dashboard',
      category: 'Navigation',
      title: 'Executive Dashboard',
      subtitle: 'Real-time KPIs, Action Center, and Payroll Health',
      icon: <LayoutDashboard className="w-4 h-4 text-[#714B67]" />,
      action: () => { navigate('/dashboard'); onClose(); },
      roleAllowed: true,
    },
    {
      id: 'nav-employees',
      category: 'Navigation',
      title: 'Employees Directory',
      subtitle: 'Kanban & List views, Employee 360 Hub',
      icon: <Users className="w-4 h-4 text-purple-600" />,
      action: () => { navigate('/employees'); onClose(); },
      roleAllowed: true,
    },
    {
      id: 'nav-departments',
      category: 'Navigation',
      title: 'Departments & Hierarchy',
      subtitle: 'Organizational structures and department heads',
      icon: <Building2 className="w-4 h-4 text-teal-600" />,
      action: () => { navigate('/departments'); onClose(); },
      roleAllowed: isHRMPlus(),
    },
    {
      id: 'nav-contracts',
      category: 'Navigation',
      title: 'Contracts Management',
      subtitle: 'Active wage contracts & structure links',
      icon: <FileSpreadsheet className="w-4 h-4 text-blue-600" />,
      action: () => { navigate('/contracts'); onClose(); },
      roleAllowed: true,
    },
    {
      id: 'nav-attendance',
      category: 'Navigation',
      title: 'Attendance & Worked Hours',
      subtitle: 'Time punches, worked hours, and exception flags',
      icon: <Clock className="w-4 h-4 text-amber-600" />,
      action: () => { navigate('/attendance'); onClose(); },
      roleAllowed: true,
    },
    {
      id: 'nav-timeoff',
      category: 'Navigation',
      title: 'Time Off & Leaves',
      subtitle: 'Quota balances, request submission, and approvals',
      icon: <CalendarDays className="w-4 h-4 text-emerald-600" />,
      action: () => { navigate('/time-off'); onClose(); },
      roleAllowed: true,
    },
    {
      id: 'nav-payruns',
      category: 'Navigation',
      title: 'Payrun Batches',
      subtitle: '2-Step Wizard, batch computation, and validation',
      icon: <CircleDollarSign className="w-4 h-4 text-[#714B67]" />,
      action: () => { navigate('/payroll/payruns'); onClose(); },
      roleAllowed: isHRPUPlus(),
    },
    {
      id: 'nav-payslips',
      category: 'Navigation',
      title: 'All Itemized Payslips',
      subtitle: 'Structured salary breakdowns and PDF export',
      icon: <FileSpreadsheet className="w-4 h-4 text-teal-600" />,
      action: () => { navigate('/payroll/payslips'); onClose(); },
      roleAllowed: true,
    },
    {
      id: 'nav-structures',
      category: 'Navigation',
      title: 'Salary Structures & Rules',
      subtitle: 'Sequenced calculation rules (Basic → Net)',
      icon: <Layers className="w-4 h-4 text-indigo-600" />,
      action: () => { navigate('/payroll/salary-structures'); onClose(); },
      roleAllowed: isHRPMPlus(),
    },
    {
      id: 'nav-reports',
      category: 'Navigation',
      title: 'Insights & Analytics Reports',
      subtitle: 'Payroll expenditure, attendance compliance, leave metrics',
      icon: <BarChart3 className="w-4 h-4 text-sky-600" />,
      action: () => { navigate('/reports'); onClose(); },
      roleAllowed: isHRPUPlus(),
    },

    // Actions
    {
      id: 'act-new-employee',
      category: 'Actions',
      title: 'Add New Employee',
      subtitle: 'Create employee record and assign department',
      icon: <Plus className="w-4 h-4 text-purple-600" />,
      action: () => {
        onClose();
        if (onTriggerQuickAction) onTriggerQuickAction('new_employee');
        else navigate('/employees');
      },
      roleAllowed: isHRMPlus(),
    },
    {
      id: 'act-record-punch',
      category: 'Actions',
      title: 'Record Attendance Punch',
      subtitle: 'Check in or check out for today',
      icon: <Clock className="w-4 h-4 text-amber-600" />,
      action: () => {
        onClose();
        if (onTriggerQuickAction) onTriggerQuickAction('record_punch');
        else navigate('/attendance');
      },
      roleAllowed: true,
    },
    {
      id: 'act-request-leave',
      category: 'Actions',
      title: 'Request Time Off',
      subtitle: 'Check remaining balance and submit leave',
      icon: <CalendarDays className="w-4 h-4 text-emerald-600" />,
      action: () => {
        onClose();
        if (onTriggerQuickAction) onTriggerQuickAction('request_leave');
        else navigate('/time-off');
      },
      roleAllowed: true,
    },
    {
      id: 'act-launch-payrun',
      category: 'Actions',
      title: 'Launch Payrun Wizard',
      subtitle: 'Start 2-step period & employee selection',
      icon: <CircleDollarSign className="w-4 h-4 text-[#714B67]" />,
      action: () => {
        onClose();
        if (onTriggerQuickAction) onTriggerQuickAction('launch_payrun');
        else navigate('/payroll/payruns');
      },
      roleAllowed: isHRPUPlus(),
    },
  ];

  const allowedItems = items.filter((item) => item.roleAllowed);
  const filteredItems = allowedItems.filter((item) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
      item.category.toLowerCase().includes(q)
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20 flex justify-center items-start animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Palette Dialog */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-command">
        {/* Search Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Search screens, actions, employees, or payroll tools..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            autoFocus
            className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md text-xs mr-2"
            >
              Clear
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-2xs font-semibold text-slate-400 bg-slate-200/60 rounded border border-slate-300/60">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-100/60">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              <Search className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              No commands or screens found matching "{query}"
            </div>
          ) : (
            <div className="space-y-1">
              {filteredItems.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={item.id}
                    onClick={item.action}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-purple-50 text-[#714B67] border border-purple-100 shadow-2xs'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-white shadow-2xs' : 'bg-slate-100'
                        }`}
                      >
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-2">
                          <span>{item.title}</span>
                          <span className="text-2xs font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded uppercase">
                            {item.category}
                          </span>
                        </div>
                        {item.subtitle && (
                          <div className="text-2xs text-slate-500 truncate mt-0.5">
                            {item.subtitle}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-2xs text-slate-400 font-medium">
                      <span>Jump</span>
                      <CornerDownLeft className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-2xs text-slate-500">
          <div className="flex items-center gap-3">
            <span>Navigation & Actions</span>
            <span>·</span>
            <span className="text-slate-400">Role: <strong>{user?.roles?.[0] || 'User'}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span>Press <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 font-semibold text-slate-700">↵</kbd> to execute</span>
          </div>
        </div>
      </div>
    </div>
  );
};
