import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileSpreadsheet,
  Clock,
  CalendarDays,
  CircleDollarSign,
  ArrowLeft,
  Edit,
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
import { EmployeeFormModal } from './EmployeeFormModal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isHRMPlus } = useAuth();
  const { error } = useToast();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
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
          <span className="text-xs font-bold text-[#714B67] uppercase font-mono">Employee 360</span>
        </div>

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
      </div>

      {/* EMPLOYEE 360 COMMAND BANNER */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="bg-linear-to-r from-slate-900 via-[#3a1d33] to-[#122b2a] p-6 sm:p-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-linear-to-tr from-[#714B67] to-teal-500 text-white font-black text-3xl flex items-center justify-center shadow-xl border-2 border-white/30 shrink-0">
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
                <p className="text-sm font-semibold text-purple-200 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-teal-400" />
                  <span>{employee.job_position}</span>
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-purple-400" />
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
        <div className="bg-slate-50/90 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="text-2xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-[#714B67]" />
            Live Operational Modules:
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Contracts Smart Button */}
            <button
              onClick={() => setActiveTab('contracts')}
              className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'contracts'
                  ? 'bg-[#714B67] text-white border-[#714B67] shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <FileSpreadsheet className={`w-4 h-4 ${activeTab === 'contracts' ? 'text-purple-200' : 'text-purple-600'}`} />
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
                  ? 'bg-[#714B67] text-white border-[#714B67] shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Clock className={`w-4 h-4 ${activeTab === 'attendance' ? 'text-teal-200' : 'text-teal-600'}`} />
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
                  ? 'bg-[#714B67] text-white border-[#714B67] shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <CalendarDays className={`w-4 h-4 ${activeTab === 'timeoff' ? 'text-amber-200' : 'text-amber-600'}`} />
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
                  ? 'bg-[#714B67] text-white border-[#714B67] shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <CircleDollarSign className={`w-4 h-4 ${activeTab === 'payslips' ? 'text-emerald-200' : 'text-emerald-600'}`} />
              <div className="text-left leading-tight">
                <div className="text-2xs uppercase tracking-wider opacity-80">Payslips</div>
                <div className="text-sm font-bold font-financial">{payslipsCount}</div>
              </div>
            </button>
          </div>
        </div>

        {/* Tab Navigation Ribbon */}
        <div className="px-6 pt-4 border-b border-slate-200">
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
                activeTab === 'overview'
                  ? 'border-[#714B67] text-[#714B67]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              360 Overview
            </button>
            <button
              onClick={() => setActiveTab('contracts')}
              className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
                activeTab === 'contracts'
                  ? 'border-[#714B67] text-[#714B67]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Contracts ({contractsCount})
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
                activeTab === 'attendance'
                  ? 'border-[#714B67] text-[#714B67]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Attendance ({attendanceCount})
            </button>
            <button
              onClick={() => setActiveTab('timeoff')}
              className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
                activeTab === 'timeoff'
                  ? 'border-[#714B67] text-[#714B67]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Time Off ({timeOffCount})
            </button>
            <button
              onClick={() => setActiveTab('payslips')}
              className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
                activeTab === 'payslips'
                  ? 'border-[#714B67] text-[#714B67]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
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
                <div className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-6 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#714B67]" />
                    <span>Organizational Placement</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block uppercase text-2xs font-semibold">Department</span>
                      <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                        {employee.department_name || `Dept #${employee.department_id || 'N/A'}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase text-2xs font-semibold">Reporting Manager</span>
                      <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                        {employee.manager_name || (employee.manager_id ? `Manager #${employee.manager_id}` : 'None (Top Executive)')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Card: Work Schedule */}
                <div className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-6 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-teal-600" />
                    <span>Shift & Calendar Schedule</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block uppercase text-2xs font-semibold">Schedule Plan</span>
                      <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                        {employee.working_schedule_name || 'Standard 40h (Mon-Fri)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase text-2xs font-semibold">Weekly Hours</span>
                      <span className="font-bold text-teal-700 text-sm mt-0.5 font-financial block">
                        40.0 Hours / Week
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* EMPLOYEE OPERATIONAL TIMELINE */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <History className="w-4 h-4 text-purple-600" />
                  <span>Workforce Lifecycle Timeline</span>
                </h3>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  <div className="relative">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-[#714B67] ring-4 ring-purple-100" />
                    <div className="text-xs font-bold text-slate-900">Active Contract Coverage</div>
                    <p className="text-2xs text-slate-500">
                      Contract active for current period under {employee.department_name || 'assigned department'}.
                    </p>
                  </div>

                  <div className="relative">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-teal-600 ring-4 ring-teal-100" />
                    <div className="text-xs font-bold text-slate-900">Attendance Compliance</div>
                    <p className="text-2xs text-slate-500">
                      {attendanceCount} punch logs logged with real-time worked hours computation.
                    </p>
                  </div>

                  <div className="relative">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-emerald-100" />
                    <div className="text-xs font-bold text-slate-900">Payroll Integration Ready</div>
                    <p className="text-2xs text-slate-500">
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
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Position</th>
                        <th className="py-3 px-4">Monthly Wage</th>
                        <th className="py-3 px-4">Salary Structure</th>
                        <th className="py-3 px-4">Contract Period</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {contracts.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/80">
                          <td className="py-3 px-4 font-bold text-slate-900">{c.position}</td>
                          <td className="py-3 px-4 font-financial font-extrabold text-slate-900">${c.wage.toLocaleString()}</td>
                          <td className="py-3 px-4 text-purple-900 font-semibold">{c.salary_structure_name || `Structure #${c.salary_structure_id}`}</td>
                          <td className="py-3 px-4 text-slate-600">
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
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Check In</th>
                        <th className="py-3 px-4">Check Out</th>
                        <th className="py-3 px-4">Worked Hours</th>
                        <th className="py-3 px-4">Attendance Exception Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {attendance.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50/80">
                          <td className="py-3 px-4 font-mono font-medium text-slate-800">{a.check_in}</td>
                          <td className="py-3 px-4 font-mono font-medium text-slate-800">{a.check_out || '—'}</td>
                          <td className="py-3 px-4 font-financial font-extrabold text-slate-900">
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
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Leave Type</th>
                        <th className="py-3 px-4">Dates</th>
                        <th className="py-3 px-4">Duration</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {timeOff.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/80">
                          <td className="py-3 px-4 font-bold text-slate-900">{t.type_name || `Type #${t.type_id}`}</td>
                          <td className="py-3 px-4 text-slate-600">{t.date_from} → {t.date_to}</td>
                          <td className="py-3 px-4 font-financial font-extrabold text-slate-900">{t.duration || '—'} Days</td>
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
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Payslip ID</th>
                        <th className="py-3 px-4">Worked Days</th>
                        <th className="py-3 px-4">Basic Wage</th>
                        <th className="py-3 px-4">Net Salary</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payslips.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/80">
                          <td className="py-3 px-4 font-mono font-bold text-[#714B67]">#{p.id}</td>
                          <td className="py-3 px-4">{p.worked_days ?? '—'}</td>
                          <td className="py-3 px-4 font-financial font-semibold">${p.basic?.toLocaleString() ?? '—'}</td>
                          <td className="py-3 px-4 font-financial font-extrabold text-emerald-800 text-sm">
                            ${p.net?.toLocaleString() ?? '—'}
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
                              className="text-xs font-bold text-[#714B67] hover:underline"
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
    </div>
  );
};
