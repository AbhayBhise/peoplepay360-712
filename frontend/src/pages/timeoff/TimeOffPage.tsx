import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ShieldAlert,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { timeOffApi } from '../../api/timeoff';
import { employeesApi } from '../../api/employees';
import { TimeOffType, TimeOffAllocation, TimeOffRequest, Employee } from '../../types';
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

export const TimeOffPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'requests' | 'allocations' | 'types'>('requests');
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [allocations, setAllocations] = useState<TimeOffAllocation[]>([]);
  const [types, setTypes] = useState<TimeOffType[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // New Request Modal state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [reqEmpId, setReqEmpId] = useState<number | ''>('');
  const [reqTypeId, setReqTypeId] = useState<number | ''>('');
  const [reqDateFrom, setReqDateFrom] = useState('');
  const [reqDateTo, setReqDateTo] = useState('');
  const [reqReason, setReqReason] = useState('');
  const [submittingReq, setSubmittingReq] = useState(false);

  // New Allocation Modal state (HRM)
  const [isAllocModalOpen, setIsAllocModalOpen] = useState(false);
  const [allocEmpId, setAllocEmpId] = useState<number | ''>('');
  const [allocTypeId, setAllocTypeId] = useState<number | ''>('');
  const [allocDays, setAllocDays] = useState<number | ''>(10);
  const [allocFrom, setAllocFrom] = useState(new Date().getFullYear() + '-01-01');
  const [allocTo, setAllocTo] = useState(new Date().getFullYear() + '-12-31');
  const [submittingAlloc, setSubmittingAlloc] = useState(false);

  const { user, isHRMPlus } = useAuth();
  const { success, error } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqList, allocList, typeList, empList] = await Promise.all([
        timeOffApi.getRequests().catch(() => []),
        timeOffApi.getAllocations().catch(() => []),
        timeOffApi.getTypes().catch(() => []),
        employeesApi.getEmployees().catch(() => []),
      ]);
      setRequests(reqList || []);
      setAllocations(allocList || []);
      setTypes(typeList || []);
      setEmployees(empList || []);
    } catch (err: any) {
      error(err.message || 'Failed to load time off data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute live remaining balance for selected employee & type in modal
  const selectedTypeObj = types.find((t) => t.id === Number(reqTypeId));
  const activeAllocForSelected = allocations.find(
    (a) => a.employee_id === Number(reqEmpId) && a.type_id === Number(reqTypeId) && a.status === 'validate'
  );

  const liveRemainingBalance = activeAllocForSelected
    ? (activeAllocForSelected.remaining !== undefined
        ? activeAllocForSelected.remaining
        : activeAllocForSelected.allocated - (activeAllocForSelected.taken || 0))
    : 16;

  // Compute estimated duration in days
  const computeEstimatedDays = () => {
    if (!reqDateFrom || !reqDateTo) return 0;
    const d1 = new Date(reqDateFrom);
    const d2 = new Date(reqDateTo);
    const diffTime = d2.getTime() - d1.getTime();
    if (diffTime < 0) return 0;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const estimatedDays = computeEstimatedDays();
  const projectedRemaining = Math.max(0, liveRemainingBalance - estimatedDays);
  const isInsufficient = selectedTypeObj?.requires_allocation && estimatedDays > liveRemainingBalance;

  const handleOpenRequest = () => {
    setReqEmpId(user?.employee_id ? Number(user.employee_id) : (employees[0]?.id || ''));
    setReqTypeId(types[0]?.id || 1);
    const today = new Date().toISOString().split('T')[0];
    setReqDateFrom(today);
    setReqDateTo(today);
    setReqReason('');
    setIsRequestModalOpen(true);
  };

  const handleOpenAlloc = () => {
    setAllocEmpId(employees[0]?.id || '');
    setAllocTypeId(types[0]?.id || '');
    setAllocDays(10);
    setIsAllocModalOpen(true);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqEmpId || !reqTypeId || !reqDateFrom || !reqDateTo) {
      error('Please complete all required fields.');
      return;
    }

    if (reqDateTo < reqDateFrom) {
      error('End Date cannot be before Start Date.');
      return;
    }

    if (isInsufficient) {
      error(`Insufficient leave balance: You only have ${liveRemainingBalance} days remaining.`);
      return;
    }

    setSubmittingReq(true);
    try {
      await timeOffApi.createRequest({
        employee_id: Number(reqEmpId),
        type_id: Number(reqTypeId),
        date_from: reqDateFrom,
        date_to: reqDateTo,
        reason: reqReason,
      });

      success('Time off request submitted successfully for approval.');
      setIsRequestModalOpen(false);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to submit time off request.');
    } finally {
      setSubmittingReq(false);
    }
  };

  const handleApproveRequest = async (id: number) => {
    try {
      await timeOffApi.approveRequest(id);
      success('Leave request approved and balance automatically deducted.');
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to approve request.');
    }
  };

  const handleRefuseRequest = async (id: number) => {
    try {
      await timeOffApi.refuseRequest(id);
      success('Leave request refused.');
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to refuse request.');
    }
  };

  const handleApproveAlloc = async (id: number) => {
    try {
      await timeOffApi.approveAllocation(id);
      success('Leave quota allocation validated.');
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to validate allocation.');
    }
  };

  const handleSubmitAlloc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocEmpId || !allocTypeId || !allocDays) {
      error('Please fill in all allocation fields.');
      return;
    }

    setSubmittingAlloc(true);
    try {
      await timeOffApi.createAllocation({
        employee_id: Number(allocEmpId),
        type_id: Number(allocTypeId),
        allocated: Number(allocDays),
        valid_from: allocFrom,
        valid_to: allocTo,
      });

      success('Leave quota allocation created.');
      setIsAllocModalOpen(false);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to create allocation.');
    } finally {
      setSubmittingAlloc(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-indigo-600" />
            <span>Time Off & Leave Balance Experience</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit leave requests with real-time balance checks, review quota allocations, and process approvals
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isHRMPlus() && (
            <Button variant="outline" icon={<Plus className="w-4 h-4" />} onClick={handleOpenAlloc}>
              Grant Quota Allocation
            </Button>
          )}
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleOpenRequest}>
            Request Time Off
          </Button>
        </div>
      </div>

      {/* VISUAL QUOTA BALANCE METERS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">Paid Annual Leave</span>
            <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 text-2xs font-bold font-mono">
              16 / 20 Days Left
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-teal-600 h-full rounded-full" style={{ width: '80%' }} />
          </div>
          <div className="flex items-center justify-between text-2xs text-slate-500">
            <span>Taken: 4 days</span>
            <span className="font-bold text-teal-800">Remaining: 16 days</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">Sick Leave</span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-2xs font-bold font-mono">
              8 / 10 Days Left
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-indigo-600 h-full rounded-full" style={{ width: '80%' }} />
          </div>
          <div className="flex items-center justify-between text-2xs text-slate-500">
            <span>Taken: 2 days</span>
            <span className="font-bold text-indigo-900">Remaining: 8 days</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">Compensatory Off</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-2xs font-bold font-mono">
              16 Hours Left
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: '100%' }} />
          </div>
          <div className="flex items-center justify-between text-2xs text-slate-500">
            <span>Earned from Overtime</span>
            <span className="font-bold text-amber-800">Available: 16 hrs</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex space-x-6">
          <button
            onClick={() => setActiveTab('requests')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              activeTab === 'requests'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Leave Requests ({requests.length})
          </button>
          <button
            onClick={() => setActiveTab('allocations')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              activeTab === 'allocations'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Allocations & Quotas ({allocations.length})
          </button>
          <button
            onClick={() => setActiveTab('types')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              activeTab === 'types'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Leave Types ({types.length})
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      {loading ? (
        <Spinner label="Loading time off records..." />
      ) : activeTab === 'requests' ? (
        /* TAB 1: REQUESTS */
        requests.length === 0 ? (
          <EmptyState
            title="No Leave Requests Found"
            description="There are currently no active or historical time off requests."
            actionLabel="Request Time Off"
            onAction={handleOpenRequest}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Employee</th>
                    <th className="py-3.5 px-4">Leave Type</th>
                    <th className="py-3.5 px-4">Requested Dates</th>
                    <th className="py-3.5 px-4">Duration</th>
                    <th className="py-3.5 px-4">Status</th>
                    {isHRMPlus() && <th className="py-3.5 px-4 text-right">Approval Decision</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.map((r) => {
                    const emp = employees.find((e) => e.id === r.employee_id);
                    const tObj = types.find((t) => t.id === r.type_id);

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 text-sm">
                            {r.employee_name || emp?.name || `Employee #${r.employee_id}`}
                          </div>
                          {r.reason && <div className="text-2xs text-slate-500 italic mt-0.5">"{r.reason}"</div>}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {r.type_name || tObj?.name || `Type #${r.type_id}`}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          {r.date_from} → {r.date_to}
                        </td>
                        <td className="py-3.5 px-4 font-financial font-extrabold text-slate-900 text-sm">
                          {r.duration || '—'} {tObj?.unit || 'days'}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge
                            variant={
                              r.status === 'validate'
                                ? 'validated'
                                : r.status === 'refused'
                                ? 'refused'
                                : 'draft'
                            }
                          >
                            {r.status === 'validate' ? 'Approved' : r.status}
                          </Badge>
                        </td>
                        {isHRMPlus() && (
                          <td className="py-3.5 px-4 text-right">
                            {r.status === 'draft' ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="success"
                                  size="sm"
                                  icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                                  onClick={() => handleApproveRequest(r.id)}
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  icon={<XCircle className="w-3.5 h-3.5" />}
                                  onClick={() => handleRefuseRequest(r.id)}
                                >
                                  Refuse
                                </Button>
                              </div>
                            ) : (
                              <span className="text-2xs text-slate-400 font-semibold font-mono">PROCESSED</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : activeTab === 'allocations' ? (
        /* TAB 2: ALLOCATIONS */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Leave Type</th>
                  <th className="py-3.5 px-4">Allocated Quota</th>
                  <th className="py-3.5 px-4">Consumed</th>
                  <th className="py-3.5 px-4">Available Balance</th>
                  <th className="py-3.5 px-4">Status</th>
                  {isHRMPlus() && <th className="py-3.5 px-4 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allocations.map((a) => {
                  const emp = employees.find((e) => e.id === a.employee_id);
                  const tObj = types.find((t) => t.id === a.type_id);
                  const remaining = a.remaining !== undefined ? a.remaining : a.allocated - (a.taken || 0);

                  return (
                    <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                        {a.employee_name || emp?.name || `Employee #${a.employee_id}`}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">{a.type_name || tObj?.name || `Type #${a.type_id}`}</td>
                      <td className="py-3.5 px-4 font-financial font-semibold">{a.allocated} days</td>
                      <td className="py-3.5 px-4 font-financial text-slate-500">{a.taken || 0} days</td>
                      <td className="py-3.5 px-4 font-financial font-extrabold text-teal-800 text-sm">
                        {remaining} days
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={a.status === 'validate' ? 'validated' : 'draft'}>
                          {a.status === 'validate' ? 'Validated' : 'Draft'}
                        </Badge>
                      </td>
                      {isHRMPlus() && (
                        <td className="py-3.5 px-4 text-right">
                          {a.status === 'draft' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleApproveAlloc(a.id)}
                            >
                              Validate
                            </Button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* TAB 3: LEAVE TYPES */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {types.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="font-bold text-slate-900 text-sm">{t.name}</h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-2xs font-bold border border-indigo-100 uppercase">
                  {t.unit}
                </span>
              </div>
              <p className="text-2xs text-slate-500 mt-1">
                {t.requires_allocation ? 'Requires approved quota allocation' : 'Open / Unallocated leave'}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* REQUEST MODAL WITH LIVE QUOTA PROJECTOR */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="Submit Time Off Request"
        description="Select dates. Your quota and projected balance update in real time."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitRequest} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Employee"
              value={reqEmpId}
              onChange={(e) => setReqEmpId(Number(e.target.value))}
              placeholder="Select Employee..."
              options={employees.map((e) => ({ value: e.id, label: `${e.name} (${e.job_position})` }))}
              required
            />

            <Select
              label="Leave Type"
              value={reqTypeId}
              onChange={(e) => setReqTypeId(Number(e.target.value))}
              placeholder="Select Type..."
              options={types.map((t) => ({ value: t.id, label: `${t.name} (${t.unit})` }))}
              required
            />
          </div>

          {/* DYNAMIC REAL-TIME BALANCE PROJECTOR BOX */}
          <div
            className={`p-4 rounded-2xl border text-xs transition-all space-y-2 ${
              isInsufficient
                ? 'bg-rose-50 border-rose-200 text-rose-950'
                : 'bg-teal-50/80 border-teal-200 text-teal-950'
            }`}
          >
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1.5">
                {isInsufficient ? (
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                )}
                <span>Real-Time Balance Projection</span>
              </span>
              <span className="font-financial font-extrabold text-sm">
                {estimatedDays} Days Requested
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-teal-200/60 text-2xs">
              <div>
                <span className="opacity-75 block">Current Available:</span>
                <strong className="text-xs font-financial">{liveRemainingBalance} Days</strong>
              </div>
              <div className="text-right">
                <span className="opacity-75 block">Projected Remaining:</span>
                <strong
                  className={`text-xs font-financial font-bold ${
                    isInsufficient ? 'text-rose-700' : 'text-teal-800'
                  }`}
                >
                  {isInsufficient ? 'Insufficient Quota' : `${projectedRemaining} Days Remaining`}
                </strong>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={reqDateFrom}
              onChange={(e) => setReqDateFrom(e.target.value)}
              required
            />

            <Input
              label="End Date"
              type="date"
              value={reqDateTo}
              onChange={(e) => setReqDateTo(e.target.value)}
              required
            />
          </div>

          <Input
            label="Reason / Notes (Optional)"
            placeholder="e.g. Scheduled Family Vacation"
            value={reqReason}
            onChange={(e) => setReqReason(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsRequestModalOpen(false)} disabled={submittingReq}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submittingReq} disabled={isInsufficient}>
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* Grant Allocation Modal */}
      <Modal
        isOpen={isAllocModalOpen}
        onClose={() => setIsAllocModalOpen(false)}
        title="Grant Leave Quota Allocation"
        description="Assign authorized annual/monthly leave days balance to an employee"
      >
        <form onSubmit={handleSubmitAlloc} className="space-y-4">
          <Select
            label="Employee"
            value={allocEmpId}
            onChange={(e) => setAllocEmpId(Number(e.target.value))}
            placeholder="Select Employee..."
            options={employees.map((e) => ({ value: e.id, label: `${e.name} (${e.job_position})` }))}
            required
          />

          <Select
            label="Leave Type"
            value={allocTypeId}
            onChange={(e) => setAllocTypeId(Number(e.target.value))}
            placeholder="Select Type..."
            options={types.map((t) => ({ value: t.id, label: t.name }))}
            required
          />

          <Input
            label="Allocated Days"
            type="number"
            value={allocDays}
            onChange={(e) => setAllocDays(Number(e.target.value))}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Valid From"
              type="date"
              value={allocFrom}
              onChange={(e) => setAllocFrom(e.target.value)}
              required
            />
            <Input
              label="Valid To"
              type="date"
              value={allocTo}
              onChange={(e) => setAllocTo(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsAllocModalOpen(false)} disabled={submittingAlloc}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submittingAlloc}>
              Grant Allocation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
