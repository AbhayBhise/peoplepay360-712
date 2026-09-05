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
  const [activeTab, setActiveTab] = useState<'profile' | 'contracts' | 'attendance' | 'timeoff' | 'payslips'>('profile');

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
    if (!id || activeTab === 'profile') return;

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
    return <Spinner label="Loading employee profile and live metrics..." />;
  }

  if (!employee) {
    return (
      <EmptyState
        title="Employee Not Found"
        description="The requested employee record could not be loaded from the database."
        actionLabel="Back to Employees"
        onAction={() => navigate('/employees')}
      />
    );
  }

  // Count resolution from either snake_case or camelCase
  const contractsCount = employee.contracts_count ?? employee.contractsCount ?? 0;
  const attendanceCount = employee.attendance_count ?? employee.attendanceCount ?? 0;
  const timeOffCount = employee.time_off_count ?? employee.timeOffCount ?? 0;
  const payslipsCount = employee.payslips_count ?? employee.payslipsCount ?? 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header with Back button and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/employees')}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Employees
          </Button>
          <span className="text-slate-400">/</span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {employee.name}
          </h1>
          <Badge variant={employee.status === 'active' ? 'active' : 'inactive'}>
            {employee.status === 'active' ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        {isHRMPlus() && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<Edit className="w-4 h-4" />}
              onClick={() => setIsEditModalOpen(true)}
            >
              Edit Employee
            </Button>
          </div>
        )}
      </div>

      {/* Unified Employee Form Hub Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* SMART BUTTONS BAR */}
        <div className="bg-slate-50/80 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-end gap-2.5">
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
              <div className="text-sm font-bold">{contractsCount}</div>
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
              <div className="text-sm font-bold">{attendanceCount}</div>
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
              <div className="text-sm font-bold">{timeOffCount}</div>
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
              <div className="text-sm font-bold">{payslipsCount}</div>
            </div>
          </button>
        </div>

        {/* Tab Navigation Pill Header */}
        <div className="px-6 pt-4 border-b border-slate-200">
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'profile'
                  ? 'border-[#714B67] text-[#714B67]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Employee Profile
            </button>
            <button
              onClick={() => setActiveTab('contracts')}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'contracts'
                  ? 'border-[#714B67] text-[#714B67]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Contracts ({contractsCount})
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'attendance'
                  ? 'border-[#714B67] text-[#714B67]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Attendance ({attendanceCount})
            </button>
            <button
              onClick={() => setActiveTab('timeoff')}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'timeoff'
                  ? 'border-[#714B67] text-[#714B67]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Time Off ({timeOffCount})
            </button>
            <button
              onClick={() => setActiveTab('payslips')}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'payslips'
                  ? 'border-[#714B67] text-[#714B67]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Payslips ({payslipsCount})
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* TAB 1: Main Profile Info */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-[#714B67] to-[#008784] text-white font-black text-2xl flex items-center justify-center shadow-md">
                    {employee.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{employee.name}</h2>
                    <p className="text-sm font-medium text-purple-800">{employee.job_position}</p>
                    {employee.email && (
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Mail className="w-3.5 h-3.5" />
                        {employee.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-1">
                    Organizational Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 block">Department</span>
                      <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5 mt-0.5">
                        <Building2 className="w-4 h-4 text-purple-600" />
                        {employee.department_name || `Dept #${employee.department_id || 'N/A'}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Manager</span>
                      <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5 mt-0.5">
                        <UserCheck className="w-4 h-4 text-teal-600" />
                        {employee.manager_name || (employee.manager_id ? `Manager #${employee.manager_id}` : 'None (Top Level)')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-1">
                    Work & Schedule Assignment
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 block">Working Schedule</span>
                      <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-4 h-4 text-amber-600" />
                        {employee.working_schedule_name || (employee.working_schedule_id ? `Schedule #${employee.working_schedule_id}` : 'Standard 40h/week')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Employee Status</span>
                      <div className="mt-1">
                        <Badge variant={employee.status === 'active' ? 'active' : 'inactive'}>
                          {employee.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 text-xs text-purple-900 flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-purple-100 text-[#714B67] mt-0.5">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold">Operational Central Hub</div>
                    <div className="text-purple-700 text-2xs mt-0.5">
                      All contracts, attendance logs, time-off requests, and payslip runs are automatically linked to this employee ID.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Contracts Subview (GET /api/employees/:id/contracts) */}
          {activeTab === 'contracts' && (
            <div>
              {subLoading ? (
                <Spinner label="Loading contracts..." />
              ) : contracts.length === 0 ? (
                <EmptyState
                  title="No Contracts Found"
                  description={`No contract records found for ${employee.name}.`}
                  actionLabel="Go to Contracts"
                  onAction={() => navigate('/contracts')}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Position</th>
                        <th className="py-2.5 px-4">Wage</th>
                        <th className="py-2.5 px-4">Salary Structure</th>
                        <th className="py-2.5 px-4">Period</th>
                        <th className="py-2.5 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {contracts.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/80">
                          <td className="py-3 px-4 font-semibold text-slate-800">{c.position}</td>
                          <td className="py-3 px-4 font-mono font-medium text-slate-900">${c.wage.toLocaleString()}</td>
                          <td className="py-3 px-4 text-slate-600">{c.salary_structure_name || `Structure #${c.salary_structure_id}`}</td>
                          <td className="py-3 px-4 text-slate-600">
                            {c.start_date} {c.end_date ? `to ${c.end_date}` : '(Ongoing)'}
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

          {/* TAB 3: Attendance Subview (GET /api/employees/:id/attendance) */}
          {activeTab === 'attendance' && (
            <div>
              {subLoading ? (
                <Spinner label="Loading attendance logs..." />
              ) : attendance.length === 0 ? (
                <EmptyState
                  title="No Attendance Logs"
                  description={`No attendance punches recorded for ${employee.name}.`}
                  actionLabel="View Attendance Page"
                  onAction={() => navigate('/attendance')}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Check In</th>
                        <th className="py-2.5 px-4">Check Out</th>
                        <th className="py-2.5 px-4">Worked Hours</th>
                        <th className="py-2.5 px-4">Status / Exception</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {attendance.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50/80">
                          <td className="py-3 px-4 font-mono text-slate-800">{a.check_in}</td>
                          <td className="py-3 px-4 font-mono text-slate-800">{a.check_out || '—'}</td>
                          <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                            {a.worked_hours !== undefined ? `${a.worked_hours}h` : '—'}
                          </td>
                          <td className="py-3 px-4">
                            {a.exception === 'missing_checkout' ? (
                              <Badge variant="danger" icon={<AlertCircle className="w-3 h-3" />}>
                                Missing Check-Out
                              </Badge>
                            ) : a.exception === 'late' ? (
                              <Badge variant="warning">Late Arrival</Badge>
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

          {/* TAB 4: Time Off Subview (GET /api/employees/:id/time-off) */}
          {activeTab === 'timeoff' && (
            <div>
              {subLoading ? (
                <Spinner label="Loading time off requests..." />
              ) : timeOff.length === 0 ? (
                <EmptyState
                  title="No Time Off Requests"
                  description={`No leave requests submitted for ${employee.name}.`}
                  actionLabel="Request Time Off"
                  onAction={() => navigate('/time-off')}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Leave Type</th>
                        <th className="py-2.5 px-4">Dates</th>
                        <th className="py-2.5 px-4">Duration</th>
                        <th className="py-2.5 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {timeOff.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/80">
                          <td className="py-3 px-4 font-semibold text-slate-800">{t.type_name || `Type #${t.type_id}`}</td>
                          <td className="py-3 px-4 text-slate-600">{t.date_from} to {t.date_to}</td>
                          <td className="py-3 px-4 font-mono font-medium">{t.duration || '—'} days</td>
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
                              {t.status}
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

          {/* TAB 5: Payslips Subview (GET /api/employees/:id/payslips) */}
          {activeTab === 'payslips' && (
            <div>
              {subLoading ? (
                <Spinner label="Loading payslips..." />
              ) : payslips.length === 0 ? (
                <EmptyState
                  title="No Payslips Found"
                  description={`No generated payslips found for ${employee.name}.`}
                  actionLabel="View Payruns"
                  onAction={() => navigate('/payroll/payruns')}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Payslip ID</th>
                        <th className="py-2.5 px-4">Worked Days</th>
                        <th className="py-2.5 px-4">Basic</th>
                        <th className="py-2.5 px-4">Net Salary</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payslips.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/80">
                          <td className="py-3 px-4 font-mono font-bold text-[#714B67]">#{p.id}</td>
                          <td className="py-3 px-4">{p.worked_days ?? '—'}</td>
                          <td className="py-3 px-4 font-mono">${p.basic?.toLocaleString() ?? '—'}</td>
                          <td className="py-3 px-4 font-mono font-bold text-emerald-700">
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
                              className="text-2xs font-semibold text-[#714B67] hover:underline"
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
