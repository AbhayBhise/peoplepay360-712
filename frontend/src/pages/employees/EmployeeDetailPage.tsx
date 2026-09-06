import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileSpreadsheet,
  Clock,
  CalendarDays,
  CircleDollarSign,
  ArrowLeft,
  Edit,
  Trash2,
  Mail,
  Building2,
  UserCheck,
  Calendar,
  AlertCircle,
  Plus,
  History,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Phone,
  Briefcase,
} from 'lucide-react';
import { employeesApi } from '../../api/employees';
import { Employee, Contract, Attendance, TimeOffRequest, PayslipSummary } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { EmployeeFormModal } from './EmployeeFormModal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/currency';

export const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isHRMPlus, isAdmin } = useAuth();
  const { success, error } = useToast();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'contracts' | 'attendance' | 'timeoff' | 'payslips'>('overview');

  // Sub-view data for smart buttons
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [timeOff, setTimeOff] = useState<TimeOffRequest[]>([]);
  const [payslips, setPayslips] = useState<PayslipSummary[]>([]);
  const [subLoading, setSubLoading] = useState(false);

  // Edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchEmployeeData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await employeesApi.getEmployeeById(id);
      setEmployee(data);
    } catch (err: any) {
      error(err.message || 'Failed to load employee details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, [id]);

  // Fetch smart button sub-view data when active tab changes
  useEffect(() => {
    if (!id || activeTab === 'overview') return;

    const loadSubView = async () => {
      setSubLoading(true);
      try {
        if (activeTab === 'contracts') {
          const list = await employeesApi.getEmployeeContracts(id);
          setContracts(list || []);
        } else if (activeTab === 'attendance') {
          const list = await employeesApi.getEmployeeAttendance(id);
          setAttendance(list || []);
        } else if (activeTab === 'timeoff') {
          const list = await employeesApi.getEmployeeTimeOff(id);
          setTimeOff(list || []);
        } else if (activeTab === 'payslips') {
          const list = await employeesApi.getEmployeePayslips(id);
          setPayslips(list || []);
        }
      } catch (err: any) {
        error(err.message || `Failed to fetch ${activeTab} records`);
      } finally {
        setSubLoading(false);
      }
    };

    loadSubView();
  }, [id, activeTab]);

  if (loading) {
    return <Spinner label="Loading employee 360 profile and live metrics..." />;
  }

  if (!employee) {
    return (
      <EmptyState
        title="Employee Record Not Found"
        description="The requested employee record could not be loaded from the database."
        actionLabel="Back to Directory"
        onAction={() => navigate('/employees')}
      />
    );
  }

  // Count resolution
  const contractsCount = employee.contracts_count ?? employee.contractsCount ?? 0;
  const attendanceCount = employee.attendance_count ?? employee.attendanceCount ?? 0;
  const timeOffCount = employee.time_off_count ?? employee.timeOffCount ?? 0;
  const payslipsCount = employee.payslips_count ?? employee.payslipsCount ?? 0;

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await employeesApi.deleteEmployee(id);
      success('Employee profile removed successfully.');
      navigate('/employees');
    } catch (err: any) {
      error(err.message || 'Failed to delete employee profile.');
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/employees')}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Employees Directory
          </Button>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-bold text-indigo-600 uppercase font-mono">Employee 360</span>
        </div>

        <div className="flex items-center gap-2.5">
          {isHRMPlus() && (
            <Button
              variant="outline"
              size="sm"
              icon={<Edit className="w-4 h-4" />}
              onClick={() => setIsEditModalOpen(true)}
            >
              Edit Profile
            </Button>
          )}

          {isAdmin() && (
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 className="w-4 h-4" />}
              onClick={() => setDeleteConfirmOpen(true)}
            >
              Delete Employee
            </Button>
          )}
        </div>
      </div>

      {/* EMPLOYEE 360 COMMAND BANNER */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="bg-linear-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-linear-to-tr from-indigo-600 to-teal-500 text-white font-black text-3xl flex items-center justify-center shadow-xl border-2 border-white/30 shrink-0">
                {employee.name.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                    {employee.name}
                  </h1>
                  <Badge variant={employee.status === 'active' ? 'active' : 'inactive'} size="sm">
                    {employee.status === 'active' ? 'Active Employee' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-sm font-semibold text-indigo-200 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-teal-400" />
                  <span>{employee.job_position}</span>
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                    {employee.department_name || `Department #${employee.department_id || '—'}`}
                  </span>
                  {employee.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-teal-400" />
                      {employee.email}
                    </span>
                  )}
                  {employee.manager_name && (
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                      Reports to: <strong className="text-white">{employee.manager_name}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SMART BUTTONS BAR WITH LIVE METRICS */}
        <div className="bg-slate-50/90 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            Live Operational Modules:
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Contracts Smart Button */}
            <button
              onClick={() => setActiveTab('contracts')}
              className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'contracts'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <FileSpreadsheet className={`w-4 h-4 ${activeTab === 'contracts' ? 'text-indigo-200' : 'text-indigo-600 dark:text-indigo-400'}`} />
              <div className="text-left leading-tight">
                <div className="text-2xs uppercase tracking-wider opacity-80">Contracts</div>
                <div className="text-sm font-bold font-financial">{contractsCount}</div>
              </div>
            </button>

            {/* Attendance Smart Button */}
            <button
              onClick={() => setActiveTab('attendance')}
              className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'attendance'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <Clock className={`w-4 h-4 ${activeTab === 'attendance' ? 'text-teal-200' : 'text-teal-600 dark:text-teal-400'}`} />
              <div className="text-left leading-tight">
                <div className="text-2xs uppercase tracking-wider opacity-80">Attendance</div>
                <div className="text-sm font-bold font-financial">{attendanceCount}</div>
              </div>
            </button>

            {/* Time Off Smart Button */}
            <button
              onClick={() => setActiveTab('timeoff')}
              className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'timeoff'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <CalendarDays className={`w-4 h-4 ${activeTab === 'timeoff' ? 'text-amber-200' : 'text-amber-600 dark:text-amber-400'}`} />
              <div className="text-left leading-tight">
                <div className="text-2xs uppercase tracking-wider opacity-80">Time Off</div>
                <div className="text-sm font-bold font-financial">{timeOffCount}</div>
              </div>
            </button>

            {/* Payslips Smart Button */}
            <button
              onClick={() => setActiveTab('payslips')}
              className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'payslips'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <CircleDollarSign className={`w-4 h-4 ${activeTab === 'payslips' ? 'text-emerald-200' : 'text-emerald-600 dark:text-emerald-400'}`} />
              <div className="text-left leading-tight">
                <div className="text-2xs uppercase tracking-wider opacity-80">Payslips</div>
                <div className="text-sm font-bold font-financial">{payslipsCount}</div>
              </div>
            </button>
          </div>
        </div>

        {/* Tab Navigation Ribbon */}
        <div className="px-6 pt-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
                activeTab === 'overview'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              360 Overview
            </button>
            <button
              onClick={() => setActiveTab('contracts')}
              className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
                activeTab === 'contracts'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Contracts ({contractsCount})
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
                activeTab === 'attendance'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Attendance ({attendanceCount})
            </button>
            <button
              onClick={() => setActiveTab('timeoff')}
              className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
                activeTab === 'timeoff'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Time Off ({timeOffCount})
            </button>
            <button
              onClick={() => setActiveTab('payslips')}
              className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
                activeTab === 'payslips'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Payslips ({payslipsCount})
            </button>
          </div>
        </div>

        {/* Tab Content Panel */}
        <div className="p-6 sm:p-8">
          {/* TAB 1: 360 OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Card: Organizational Architecture */}
                <div className="bg-slate-50/70 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-6 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Organizational Placement</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block uppercase text-2xs font-semibold">Department</span>
                      <span className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 block">
                        {employee.department_name || `Dept #${employee.department_id || 'N/A'}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block uppercase text-2xs font-semibold">Reporting Manager</span>
                      <span className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 block">
                        {employee.manager_name || (employee as any).managerName || (employee.manager_id || (employee as any).managerId ? `Manager #${(employee.manager_id || (employee as any).managerId).substring(0, 8)}` : 'None (Top Executive)')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Card: Work Schedule */}
                <div className="bg-slate-50/70 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-6 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>Shift & Calendar Schedule</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block uppercase text-2xs font-semibold">Schedule Plan</span>
                      <span className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 block">
                        {employee.working_schedule_name || 'Standard 40h (Mon-Fri)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block uppercase text-2xs font-semibold">Weekly Hours</span>
                      <span className="font-bold text-teal-700 dark:text-teal-300 text-sm mt-0.5 font-financial block">
                        40.0 Hours / Week
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* EMPLOYEE OPERATIONAL TIMELINE */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Workforce Lifecycle Timeline</span>
                </h3>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                  <div className="relative">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-indigo-100 dark:ring-indigo-950" />
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Active Contract Coverage</div>
                    <p className="text-2xs text-slate-500 dark:text-slate-400">
                      Contract active for current period under {employee.department_name || 'assigned department'}.
                    </p>
                  </div>

                  <div className="relative">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-teal-600 ring-4 ring-teal-100 dark:ring-teal-950" />
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Attendance Compliance</div>
                    <p className="text-2xs text-slate-500 dark:text-slate-400">
                      {attendanceCount} punch logs logged with real-time worked hours computation.
                    </p>
                  </div>

                  <div className="relative">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-emerald-100 dark:ring-emerald-950" />
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Payroll Integration Ready</div>
                    <p className="text-2xs text-slate-500 dark:text-slate-400">
                      Eligible for automated payrun batches and sequenced salary rule execution.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONTRACTS SUBVIEW */}
          {activeTab === 'contracts' && (
            <div>
              {subLoading ? (
                <Spinner label="Loading contracts..." />
              ) : contracts.length === 0 ? (
                <EmptyState
                  title="No Contracts Found"
                  description={`No contract records found for ${employee.name}.`}
                  actionLabel="Create Contract"
                  onAction={() => navigate('/contracts')}
                />
              ) : (
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Position</th>
                        <th className="py-3 px-4">Monthly Wage</th>
                        <th className="py-3 px-4">Salary Structure</th>
                        <th className="py-3 px-4">Contract Period</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {contracts.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{c.position}</td>
                          <td className="py-3 px-4 font-financial font-extrabold text-slate-900 dark:text-white">{formatCurrency(c.wage)}</td>
                          <td className="py-3 px-4 text-indigo-900 dark:text-indigo-300 font-semibold">{c.salary_structure_name || (c as any).salaryStructureName || (c.salary_structure_id ? `Structure #${c.salary_structure_id}` : 'Standard Structure')}</td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                            {c.start_date} {c.end_date ? `to ${c.end_date}` : '→ Permanent'}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={c.status === 'active' ? 'active' : 'draft'}>
                              {c.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ATTENDANCE SUBVIEW */}
          {activeTab === 'attendance' && (
            <div>
              {subLoading ? (
                <Spinner label="Loading attendance history..." />
              ) : attendance.length === 0 ? (
                <EmptyState
                  title="No Attendance Logs"
                  description={`No attendance punch records logged for ${employee.name}.`}
                  actionLabel="Record Attendance"
                  onAction={() => navigate('/attendance')}
                />
              ) : (
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Check In</th>
                        <th className="py-3 px-4">Check Out</th>
                        <th className="py-3 px-4">Worked Hours</th>
                        <th className="py-3 px-4">Attendance Exception Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {attendance.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                          <td className="py-3 px-4 font-mono font-medium text-slate-800 dark:text-slate-200">{a.check_in}</td>
                          <td className="py-3 px-4 font-mono font-medium text-slate-800 dark:text-slate-200">{a.check_out || '—'}</td>
                          <td className="py-3 px-4 font-financial font-extrabold text-slate-900 dark:text-white">
                            {a.worked_hours !== undefined ? `${a.worked_hours}h` : '—'}
                          </td>
                          <td className="py-3 px-4">
                            {a.exception === 'missing_checkout' ? (
                              <Badge variant="danger" icon={<AlertCircle className="w-3.5 h-3.5 text-rose-600" />}>
                                Missing Check-Out
                              </Badge>
                            ) : a.exception === 'late' ? (
                              <Badge variant="warning">Late Entry</Badge>
                            ) : (
                              <Badge variant="active">Normal</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: TIME OFF SUBVIEW */}
          {activeTab === 'timeoff' && (
            <div>
              {subLoading ? (
                <Spinner label="Loading leave requests..." />
              ) : timeOff.length === 0 ? (
                <EmptyState
                  title="No Time Off Requests"
                  description={`No leave requests submitted for ${employee.name}.`}
                  actionLabel="Request Time Off"
                  onAction={() => navigate('/time-off')}
                />
              ) : (
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Leave Type</th>
                        <th className="py-3 px-4">Dates</th>
                        <th className="py-3 px-4">Duration</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {timeOff.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{t.type_name || (t as any).typeName || (t.type_id || (t as any).typeId ? `Leave Type #${t.type_id || (t as any).typeId}` : 'Standard Leave')}</td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{t.date_from} → {t.date_to}</td>
                          <td className="py-3 px-4 font-financial font-extrabold text-slate-900 dark:text-white">{t.duration || '—'} Days</td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={
                                t.status === 'validate'
                                  ? 'validated'
                                  : t.status === 'refused'
                                  ? 'refused'
                                  : 'draft'
                              }
                            >
                              {t.status === 'validate' ? 'Approved' : t.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PAYSLIPS SUBVIEW */}
          {activeTab === 'payslips' && (
            <div>
              {subLoading ? (
                <Spinner label="Loading payslips..." />
              ) : payslips.length === 0 ? (
                <EmptyState
                  title="No Payslips Generated"
                  description={`No payslips found for ${employee.name}.`}
                  actionLabel="View Payruns"
                  onAction={() => navigate('/payroll/payruns')}
                />
              ) : (
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Payslip ID</th>
                        <th className="py-3 px-4">Worked Days</th>
                        <th className="py-3 px-4">Basic Wage</th>
                        <th className="py-3 px-4">Net Salary</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {payslips.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                          <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">#{p.id}</td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{p.worked_days ?? '—'}</td>
                          <td className="py-3 px-4 font-financial font-semibold text-slate-800 dark:text-slate-200">{p.basic !== undefined ? formatCurrency(p.basic) : '—'}</td>
                          <td className="py-3 px-4 font-financial font-extrabold text-emerald-800 dark:text-emerald-300 text-sm">
                            {p.net !== undefined ? formatCurrency(p.net) : '—'}
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={
                                p.status === 'paid'
                                  ? 'paid'
                                  : p.status === 'validated'
                                  ? 'validated'
                                  : p.status === 'computed'
                                  ? 'computed'
                                  : 'draft'
                              }
                            >
                              {p.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Link
                              to={`/payroll/payslips/${p.id}`}
                              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                              View Breakdown →
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Employee Modal */}
      <EmployeeFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        employeeToEdit={employee}
        onSuccess={(updated) => {
          setEmployee(updated);
        }}
      />

      {/* Admin Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Delete Employee Profile"
        description="Are you sure you want to delete this employee record?"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="space-y-2 text-xs text-slate-600">
            <p>
              You are about to delete <strong>{employee?.name || 'this employee'}</strong> ({(employee as any)?.employee_code || (employee as any)?.employeeCode || (employee?.id ? `ID #${employee.id.substring(0, 8)}` : 'Employee')}).
            </p>
            <p className="text-rose-600 text-2xs bg-rose-50 p-2.5 rounded-lg border border-rose-200 font-medium">
              This action requires System Administrator authority. Associated records, attendance logs, and contracts will be deactivated or removed per retention policies.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              isLoading={isDeleting}
            >
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
