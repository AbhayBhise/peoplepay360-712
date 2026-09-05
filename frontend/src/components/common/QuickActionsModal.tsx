import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Modal } from './Modal';
import { Users, Clock, CalendarDays, CircleDollarSign, Plus, ArrowRight } from 'lucide-react';

interface QuickActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (actionKey: string) => void;
}

export const QuickActionsModal: React.FC<QuickActionsModalProps> = ({
  isOpen,
  onClose,
  onSelectAction,
}) => {
  const { isHRMPlus, isHRPUPlus, hasRole } = useAuth();
  const navigate = useNavigate();

  const actions = [
    {
      key: 'new_employee',
      title: 'Add Employee',
      description: 'Register a new employee, assign job position and department',
      icon: <Users className="w-5 h-5 text-purple-600" />,
      roleAllowed: isHRMPlus(),
      path: '/employees',
    },
    {
      key: 'record_punch',
      title: 'Record Attendance Punch',
      description: 'Log time check-in / check-out with automatic hour calculation',
      icon: <Clock className="w-5 h-5 text-amber-600" />,
      roleAllowed: true,
      path: '/attendance',
    },
    {
      key: 'request_leave',
      title: 'Request Time Off',
      description: 'Submit annual or sick leave request with live balance check',
      icon: <CalendarDays className="w-5 h-5 text-emerald-600" />,
      roleAllowed: true,
      path: '/time-off',
    },
    {
      key: 'launch_payrun',
      title: 'Launch Payrun Wizard',
      description: 'Start 2-step payroll batch calculation for active employees',
      icon: <CircleDollarSign className="w-5 h-5 text-[#714B67]" />,
      roleAllowed: isHRPUPlus(),
      path: '/payroll/payruns',
    },
  ];

  const allowedActions = actions.filter((a) => a.roleAllowed);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Workforce Quick Actions"
      description="Trigger fast operational actions based on your active role permissions"
      maxWidth="lg"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {allowedActions.map((act) => (
          <div
            key={act.key}
            onClick={() => {
              onClose();
              onSelectAction(act.key);
            }}
            className="p-4 rounded-xl border border-slate-200 hover:border-[#714B67]/50 hover:bg-purple-50/40 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                {act.icon}
              </div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#714B67] transition-colors">
                {act.title}
              </h4>
              <p className="text-2xs text-slate-500 mt-1 leading-snug">{act.description}</p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-2xs font-semibold text-[#714B67]">
              <span>Open Action</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};
