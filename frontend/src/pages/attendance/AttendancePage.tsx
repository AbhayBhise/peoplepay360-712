import React, { useState, useEffect } from 'react';
import { Clock, LogIn, LogOut, AlertTriangle, AlertCircle, CheckCircle2, Edit, Plus } from 'lucide-react';
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
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const AttendancePage: React.FC = () => {
  const [attendanceLogs, setAttendanceLogs] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick punch modal
  const [isPunchModalOpen, setIsPunchModalOpen] = useState(false);
  const [punchEmpId, setPunchEmpId] = useState<number | ''>('');
  const [punchCheckInTime, setPunchCheckInTime] = useState('');
  const [punchCheckOutTime, setPunchCheckOutTime] = useState('');
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
    setPunchEmpId(user?.employee_id ? Number(user.employee_id) : (employees[0]?.id || ''));
    setPunchCheckInTime(currentIso);
    setPunchCheckOutTime('');
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
        employee_id: Number(punchEmpId),
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-[#714B67]" />
            <span>Attendance & Worked Hours</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log time punches, auto-calculate worked hours, and monitor attendance exceptions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="primary" icon={<LogIn className="w-4 h-4" />} onClick={handleOpenPunch}>
            Record Check-In
          </Button>
        </div>
      </div>

      {/* Attendance Logs Table */}
      {loading ? (
        <Spinner label="Loading attendance logs..." />
      ) : attendanceLogs.length === 0 ? (
        <EmptyState
          title="No Attendance Logs"
          description="There are no attendance punch logs recorded for the selected period."
          actionLabel="Record Check-In"
          onAction={handleOpenPunch}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Check-In</th>
                  <th className="py-3 px-4">Check-Out</th>
                  <th className="py-3 px-4">Worked Hours</th>
                  <th className="py-3 px-4">Attendance Health</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendanceLogs.map((log) => {
                  const emp = employees.find((e) => e.id === log.employee_id);
                  const isMissingCheckout = !log.check_out || log.exception === 'missing_checkout';
                  const isLate = log.exception === 'late';

                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isMissingCheckout ? 'bg-rose-50/20' : isLate ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {log.employee_name || emp?.name || `Employee #${log.employee_id}`}
                        </div>
                        <div className="text-2xs text-slate-400">Punch ID: #{log.id}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">{log.check_in}</td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {log.check_out || (
                          <span className="text-rose-500 font-medium italic">Pending Check-Out</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {log.worked_hours !== undefined ? `${Number(log.worked_hours).toFixed(1)} hrs` : '—'}
                      </td>
                      <td className="py-3 px-4">
                        {isMissingCheckout ? (
                          <Badge variant="danger" icon={<AlertCircle className="w-3.5 h-3.5 text-rose-600" />}>
                            Missing Check-Out
                          </Badge>
                        ) : isLate ? (
                          <Badge variant="warning" icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}>
                            Late Entry
                          </Badge>
                        ) : (
                          <Badge variant="active" icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}>
                            Normal
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
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
                              className="p-1 text-slate-400 hover:text-[#714B67] hover:bg-purple-50 rounded cursor-pointer"
                              title="HR Correction"
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
        </div>
      )}

      {/* Check In Modal */}
      <Modal
        isOpen={isPunchModalOpen}
        onClose={() => setIsPunchModalOpen(false)}
        title="Record Attendance Check-In"
        description="Punches will automatically calculate worked hours on check-out"
      >
        <form onSubmit={handlePunchSubmit} className="space-y-4">
          <Select
            label="Employee"
            value={punchEmpId}
            onChange={(e) => setPunchEmpId(Number(e.target.value))}
            placeholder="Select Employee..."
            options={employees.map((e) => ({ value: e.id, label: `${e.name} (${e.job_position})` }))}
            required
          />

          <Input
            label="Check-In Timestamp"
            type="datetime-local"
            value={punchCheckInTime}
            onChange={(e) => setPunchCheckInTime(e.target.value)}
            required
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
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
        title="Attendance Correction"
        description="HR adjustment for punch timestamps (server will recompute worked hours)"
      >
        <form onSubmit={handleCorrectionSubmit} className="space-y-4">
          <Input
            label="Corrected Check-In"
            type="datetime-local"
            value={corrCheckIn}
            onChange={(e) => setCorrCheckIn(e.target.value)}
            required
          />

          <Input
            label="Corrected Check-Out"
            type="datetime-local"
            value={corrCheckOut}
            onChange={(e) => setCorrCheckOut(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setEditingLog(null)} disabled={corrSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={corrSubmitting}>
              Save Correction
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
