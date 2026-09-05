import React, { useState, useEffect } from 'react';
import {
  Clock,
  LogIn,
  LogOut,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Edit,
  Plus,
  Filter,
  ShieldCheck,
  Search,
  ArrowRight,
} from 'lucide-react';
import { attendanceApi } from '../../api/attendance';
import { employeesApi } from '../../api/employees';
import { Attendance, Employee } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Pagination } from '../../components/common/Pagination';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const AttendancePage: React.FC = () => {
  const [attendanceLogs, setAttendanceLogs] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'all' | 'exceptions'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Quick punch modal
  const [isPunchModalOpen, setIsPunchModalOpen] = useState(false);
  const [punchEmpId, setPunchEmpId] = useState<string>('');
  const [punchCheckInTime, setPunchCheckInTime] = useState('');
  const [punching, setPunching] = useState(false);

  // Correction modal (HRM+)
  const [editingLog, setEditingLog] = useState<Attendance | null>(null);
  const [corrCheckIn, setCorrCheckIn] = useState('');
  const [corrCheckOut, setCorrCheckOut] = useState('');
  const [corrSubmitting, setCorrSubmitting] = useState(false);

  const { user, isHRMPlus } = useAuth();
  const { success, error } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [logs, empList] = await Promise.all([
        attendanceApi.getAttendance().catch(() => []),
        employeesApi.getEmployees().catch(() => []),
      ]);
      setAttendanceLogs(logs || []);
      setEmployees(empList || []);
    } catch (err: any) {
      error(err.message || 'Failed to fetch attendance logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenPunch = () => {
    const currentIso = new Date().toISOString().slice(0, 16);
    const defaultEmpId = user?.employee_id ? String(user.employee_id) : (employees[0]?.id ? String(employees[0].id) : '');
    setPunchEmpId(defaultEmpId);
    setPunchCheckInTime(currentIso);
    setIsPunchModalOpen(true);
  };

  const handlePunchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!punchEmpId || !punchCheckInTime) {
      error('Employee and Check-In time are required.');
      return;
    }

    setPunching(true);
    try {
      await attendanceApi.checkIn({
        employee_id: punchEmpId,
        check_in: punchCheckInTime,
      });

      success('Check-In recorded successfully.');
      setIsPunchModalOpen(false);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to punch check-in.');
    } finally {
      setPunching(false);
    }
  };

  const handleCheckOutNow = async (log: Attendance) => {
    try {
      const currentIso = new Date().toISOString().slice(0, 16);
      await attendanceApi.checkOut(log.id, { check_out: currentIso });
      success('Checked out successfully. Worked hours calculated.');
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to check out.');
    }
  };

  const handleOpenCorrection = (log: Attendance) => {
    setEditingLog(log);
    setCorrCheckIn(log.check_in ? log.check_in.slice(0, 16) : '');
    setCorrCheckOut(log.check_out ? log.check_out.slice(0, 16) : '');
  };

  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLog) return;

    if (corrCheckOut && corrCheckOut <= corrCheckIn) {
      error('Check-Out must be after Check-In.');
      return;
    }

    setCorrSubmitting(true);
    try {
      await attendanceApi.updateAttendance(editingLog.id, {
        check_in: corrCheckIn,
        check_out: corrCheckOut || undefined,
      });

      success('Attendance corrected and worked hours recomputed.');
      setEditingLog(null);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to update attendance.');
    } finally {
      setCorrSubmitting(false);
    }
  };

  // Metrics
  const totalPunches = attendanceLogs.length;
  const missingCheckoutsCount = attendanceLogs.filter(
    (l) => !l.check_out || l.exception === 'missing_checkout'
  ).length;
  const lateArrivalsCount = attendanceLogs.filter((l) => l.exception === 'late').length;
  const normalPunchesCount = totalPunches - (missingCheckoutsCount + lateArrivalsCount);

  const filteredLogs = attendanceLogs.filter((log) => {
    const isException = !log.check_out || log.exception === 'missing_checkout' || log.exception === 'late';
    if (filterMode === 'exceptions' && !isException) return false;

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (log.employee_name && log.employee_name.toLowerCase().includes(q)) ||
      String(log.employee_id).includes(q)
    );
  });

  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Attendance & Worked Hours Monitoring</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time punch logging, automated worked hours calculation, and exception triage
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="primary" icon={<LogIn className="w-4 h-4" />} onClick={handleOpenPunch}>
            Record Check-In Punch
          </Button>
        </div>
      </div>

      {/* OPERATIONAL METRICS RIBBON */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Punches</span>
            <CheckCircle2 className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          </div>
          <div className="text-2xl font-black font-financial text-slate-900 dark:text-white mt-2">{totalPunches}</div>
          <div className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">Recorded shift logs</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-950/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold text-rose-800 dark:text-rose-400 uppercase tracking-wider">Missing Check-Out</span>
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-2xl font-black font-financial text-rose-950 dark:text-rose-200 mt-2">{missingCheckoutsCount}</div>
          <div className="text-2xs text-rose-700 dark:text-rose-400 font-semibold mt-0.5">Requires check-out / fix</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">Late Arrivals</span>
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-black font-financial text-amber-950 dark:text-amber-200 mt-2">{lateArrivalsCount}</div>
          <div className="text-2xs text-amber-700 dark:text-amber-400 font-semibold mt-0.5">Logged past shift start</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">Normal Shifts</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-financial text-emerald-950 dark:text-emerald-200 mt-2">{normalPunchesCount}</div>
          <div className="text-2xs text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">On-time & completed</div>
        </div>
      </div>

      {/* FILTER TABS & SEARCH BAR */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Toggle between All vs Exceptions */}
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterMode === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            All Logs ({attendanceLogs.length})
          </button>
          <button
            onClick={() => setFilterMode('exceptions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterMode === 'exceptions'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Exceptions Only ({missingCheckoutsCount + lateArrivalsCount})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search by employee name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-400"
          />
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <Spinner label="Loading attendance logs..." />
      ) : filteredLogs.length === 0 ? (
        <EmptyState
          title="No Attendance Logs Found"
          description={
            filterMode === 'exceptions'
              ? 'Great news! There are zero active attendance exceptions in the system.'
              : 'No attendance logs have been recorded yet.'
          }
          actionLabel="Record First Punch"
          onAction={handleOpenPunch}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Check-In</th>
                  <th className="py-3.5 px-4">Check-Out</th>
                  <th className="py-3.5 px-4">Worked Duration</th>
                  <th className="py-3.5 px-4">Exception Triage Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedLogs.map((log) => {
                  const emp = employees.find((e) => String(e.id) === String(log.employee_id));
                  const isMissingCheckout = !log.check_out || log.exception === 'missing_checkout';
                  const isLate = log.exception === 'late';

                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                        isMissingCheckout
                          ? 'bg-rose-50/30 dark:bg-rose-950/20'
                          : isLate
                          ? 'bg-amber-50/30 dark:bg-amber-950/20'
                          : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                          {(log as any).employee?.name || log.employee_name || (log as any).employeeName || emp?.name || (log.employee_id || (log as any).employeeId ? `Employee #${(log.employee_id || (log as any).employeeId).substring(0, 8)}` : 'Staff Member')}
                        </div>
                        <div className="text-2xs text-slate-400 dark:text-slate-500 font-mono">Log #{log.id}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-800 dark:text-slate-200">{log.check_in}</td>
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-800 dark:text-slate-200">
                        {log.check_out || (
                          <span className="text-rose-600 dark:text-rose-400 font-bold italic bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800/60">
                            Check-Out Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-financial font-extrabold text-slate-900 dark:text-white text-sm">
                        {log.worked_hours !== undefined && log.worked_hours > 0
                          ? `${Number(log.worked_hours).toFixed(1)} hrs`
                          : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        {isMissingCheckout ? (
                          <Badge variant="danger" icon={<AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />}>
                            Missing Check-Out
                          </Badge>
                        ) : isLate ? (
                          <Badge variant="warning" icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}>
                            Late Entry
                          </Badge>
                        ) : (
                          <Badge variant="active" icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}>
                            Normal Shift
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!log.check_out && (
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<LogOut className="w-3.5 h-3.5" />}
                              onClick={() => handleCheckOutNow(log)}
                            >
                              Check Out
                            </Button>
                          )}
                          {isHRMPlus() && (
                            <button
                              onClick={() => handleOpenCorrection(log)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Audit/Correct Log"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredLogs.length / itemsPerPage)}
            totalItems={filteredLogs.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(size) => {
              setItemsPerPage(size);
              setCurrentPage(1);
            }}
          />
        </div>
      )}

      {/* Check In Modal */}
      <Modal
        isOpen={isPunchModalOpen}
        onClose={() => setIsPunchModalOpen(false)}
        title="Record Attendance Check-In"
        description="Punches will automatically calculate worked hours upon check-out"
      >
        <form onSubmit={handlePunchSubmit} className="space-y-4">
          <Select
            label="Employee"
            value={punchEmpId}
            onChange={(e) => setPunchEmpId(e.target.value)}
            placeholder="Select Employee..."
            options={employees.map((e) => ({ value: String(e.id), label: `${e.name} (${e.job_position})` }))}
            required
          />

          <Input
            label="Check-In Timestamp"
            type="datetime-local"
            value={punchCheckInTime}
            onChange={(e) => setPunchCheckInTime(e.target.value)}
            required
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsPunchModalOpen(false)} disabled={punching}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={punching}>
              Confirm Check-In
            </Button>
          </div>
        </form>
      </Modal>

      {/* HR Correction Modal */}
      <Modal
        isOpen={!!editingLog}
        onClose={() => setEditingLog(null)}
        title="HR Attendance Adjustment"
        description="Adjust punch timestamps (server will recalculate worked hours)"
      >
        <form onSubmit={handleCorrectionSubmit} className="space-y-4">
          <Input
            label="Adjusted Check-In"
            type="datetime-local"
            value={corrCheckIn}
            onChange={(e) => setCorrCheckIn(e.target.value)}
            required
          />

          <Input
            label="Adjusted Check-Out"
            type="datetime-local"
            value={corrCheckOut}
            onChange={(e) => setCorrCheckOut(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setEditingLog(null)} disabled={corrSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={corrSubmitting}>
              Save Adjustment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AttendancePage;
