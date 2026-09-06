import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  Calendar
} from 'lucide-react';
import { timeOffApi } from '../../api/timeoff';
import { employeesApi } from '../../api/employees';
import { TimeOffRequest, TimeOffAllocation, TimeOffType, Employee } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { SearchableSelect } from '../../components/common/SearchableSelect';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Pagination } from '../../components/common/Pagination';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { extractItems } from '../../utils/pagination';

export const TimeOffPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'requests' | 'allocations' | 'types'>('requests');
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [allocations, setAllocations] = useState<TimeOffAllocation[]>([]);
  const [types, setTypes] = useState<TimeOffType[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state for requests
  const [reqSearch, setReqSearch] = useState('');
  const [reqStatus, setReqStatus] = useState<'all' | 'draft' | 'validate' | 'refused'>('all');

  // Search & Filter state for allocations
  const [allocSearch, setAllocSearch] = useState('');
  const [allocStatus, setAllocStatus] = useState<'all' | 'validate' | 'draft'>('all');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [allocPage, setAllocPage] = useState(1);
  const [allocItemsPerPage, setAllocItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [reqSearch, reqStatus]);

  useEffect(() => {
    setAllocPage(1);
  }, [allocSearch, allocStatus]);

  // New Request Modal state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [reqEmpId, setReqEmpId] = useState<string>('');
  const [reqTypeId, setReqTypeId] = useState<string>('');
  const [reqDateFrom, setReqDateFrom] = useState('');
  const [reqDateTo, setReqDateTo] = useState('');
  const [reqReason, setReqReason] = useState('');
  const [submittingReq, setSubmittingReq] = useState(false);

  // New Allocation Modal state (HRM)
  const [isAllocModalOpen, setIsAllocModalOpen] = useState(false);
  const [allocEmpId, setAllocEmpId] = useState<string>('');
  const [allocTypeId, setAllocTypeId] = useState<string>('');
  const [allocDays, setAllocDays] = useState<number | ''>(10);
  const [allocFrom, setAllocFrom] = useState(new Date().getFullYear() + '-01-01');
  const [allocTo, setAllocTo] = useState(new Date().getFullYear() + '-12-31');
  const [submittingAlloc, setSubmittingAlloc] = useState(false);

  // New Leave Type Modal state (HRM)
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeUnit, setNewTypeUnit] = useState<'days' | 'hours'>('days');
  const [newTypeRequiresAlloc, setNewTypeRequiresAlloc] = useState(true);
  const [newTypePayroll, setNewTypePayroll] = useState(true);
  const [submittingType, setSubmittingType] = useState(false);

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
      setRequests(extractItems<TimeOffRequest>(reqList));
      setAllocations(extractItems<TimeOffAllocation>(allocList));
      setTypes(extractItems<TimeOffType>(typeList));
      setEmployees(extractItems<Employee>(empList));
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
  const selectedTypeObj = types.find((t) => String(t.id) === String(reqTypeId));
  const activeAllocForSelected = allocations.find(
    (a) => {
      const aEmpId = a.employee_id || (a as any).employeeId;
      const aTypeId = a.type_id || (a as any).typeId;
      return String(aEmpId) === String(reqEmpId) && String(aTypeId) === String(reqTypeId) && a.status === 'validate';
    }
  );

  const liveRemainingBalance = activeAllocForSelected
    ? (activeAllocForSelected.remaining !== undefined
        ? Number(activeAllocForSelected.remaining)
        : Number(activeAllocForSelected.allocated) - (Number(activeAllocForSelected.taken) || 0))
    : 0;

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

  // Build quota summary cards from real allocations (validate status, current user or all)
  const currentEmpId = user?.employee_id || (user as any)?.employeeId;
  const myAllocations = allocations.filter((a) => {
    if (!isHRMPlus() && currentEmpId) {
      const aEmpId = a.employee_id || (a as any).employeeId;
      return String(aEmpId) === String(currentEmpId) && a.status === 'validate';
    }
    return a.status === 'validate';
  });

  // Aggregate by type: sum allocated & taken across employees (for HR+) or show per type for employee
  const quotaByType = types.slice(0, 3).map((t) => {
    const relevant = myAllocations.filter((a) => {
      const aTypeId = a.type_id || (a as any).typeId;
      return String(aTypeId) === String(t.id);
    });
    const totalAllocated = relevant.reduce((s, a) => s + (Number(a.allocated) || 0), 0);
    const totalTaken = relevant.reduce((s, a) => s + (Number(a.taken) || 0), 0);
    const totalRemaining = relevant.reduce((s, a) => s + (a.remaining !== undefined ? Number(a.remaining) : (Number(a.allocated) - (Number(a.taken) || 0))), 0);
    return {
      type: t,
      allocated: totalAllocated,
      taken: totalTaken,
      remaining: totalRemaining,
      pct: totalAllocated > 0 ? Math.round((totalRemaining / totalAllocated) * 100) : 0,
      hasData: relevant.length > 0,
    };
  });

  const handleOpenRequest = () => {
    const defaultEmpId = user?.employee_id ? String(user.employee_id) : (employees[0]?.id ? String(employees[0].id) : '');
    const defaultTypeId = types[0]?.id ? String(types[0].id) : '';
    setReqEmpId(defaultEmpId);
    setReqTypeId(defaultTypeId);
    const today = new Date().toISOString().split('T')[0];
    setReqDateFrom(today);
    setReqDateTo(today);
    setReqReason('');
    setIsRequestModalOpen(true);
  };

  const handleOpenAlloc = () => {
    setAllocEmpId(employees[0]?.id ? String(employees[0].id) : '');
    setAllocTypeId(types[0]?.id ? String(types[0].id) : '');
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
        employee_id: reqEmpId,
        type_id: reqTypeId,
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

  const handleApproveRequest = async (id: string | number) => {
    try {
      await timeOffApi.approveRequest(id);
      success('Leave request approved.');
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to approve request.');
    }
  };

  const handleRefuseRequest = async (id: string | number) => {
    try {
      await timeOffApi.refuseRequest(id);
      success('Leave request refused.');
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to refuse request.');
    }
  };

  const handleApproveAlloc = async (id: string | number) => {
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
        employee_id: allocEmpId,
        type_id: allocTypeId,
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

  const handleOpenCreateType = () => {
    setNewTypeName('');
    setNewTypeUnit('days');
    setNewTypeRequiresAlloc(true);
    setNewTypePayroll(true);
    setIsTypeModalOpen(true);
  };

  const handleCreateTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) {
      error('Leave type name is required.');
      return;
    }
    setSubmittingType(true);
    try {
      await timeOffApi.createType({
        name: newTypeName.trim(),
        unit: newTypeUnit,
        requires_allocation: newTypeRequiresAlloc,
        payroll_integration: newTypePayroll,
      });
      success(`Leave type "${newTypeName}" created successfully.`);
      setIsTypeModalOpen(false);
      loadData();
    } catch (err: any) {
      error(err.message || 'Failed to create leave type.');
    } finally {
      setSubmittingType(false);
    }
  };

  // Filtered requests
  const filteredRequests = requests.filter((r) => {
    if (reqStatus !== 'all' && r.status !== reqStatus) return false;
    if (!reqSearch) return true;
    const q = reqSearch.toLowerCase().trim();
    const empId = r.employee_id || (r as any).employeeId;
    const emp = employees.find((e) => String(e.id) === String(empId));
    const empName = ((r as any).employee?.name || r.employee_name || (r as any).employeeName || emp?.name || '').toLowerCase();
    const reason = (r.reason || '').toLowerCase();
    const typeName = ((r as any).type?.name || r.type_name || (r as any).typeName || '').toLowerCase();
    return empName.includes(q) || reason.includes(q) || typeName.includes(q);
  });

  // Filtered allocations
  const filteredAllocations = allocations.filter((a) => {
    if (allocStatus !== 'all' && a.status !== allocStatus) return false;
    if (!allocSearch) return true;
    const q = allocSearch.toLowerCase().trim();
    const empId = a.employee_id || (a as any).employeeId;
    const emp = employees.find((e) => String(e.id) === String(empId));
    const empName = ((a as any).employee?.name || a.employee_name || (a as any).employeeName || emp?.name || '').toLowerCase();
    const typeName = ((a as any).type?.name || a.type_name || (a as any).typeName || '').toLowerCase();
    return empName.includes(q) || typeName.includes(q);
  });

  const totalReqPages = Math.max(1, Math.ceil(filteredRequests.length / itemsPerPage));
  const paginatedRequests = filteredRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalAllocPages = Math.max(1, Math.ceil(filteredAllocations.length / allocItemsPerPage));
  const paginatedAllocations = filteredAllocations.slice((allocPage - 1) * allocItemsPerPage, allocPage * allocItemsPerPage);

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Time Off & Leave Balance Experience</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Submit leave requests with real-time balance checks, review quota allocations, and process approvals
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isHRMPlus() && (
            <>
              <Button variant="outline" icon={<Plus className="w-4 h-4" />} onClick={handleOpenCreateType}>
                New Leave Type
              </Button>
              <Button variant="outline" icon={<Plus className="w-4 h-4" />} onClick={handleOpenAlloc}>
                Grant Quota Allocation
              </Button>
            </>
          )}
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleOpenRequest}>
            Request Time Off
          </Button>
        </div>
      </div>

      {/* VISUAL QUOTA BALANCE METERS — driven by live allocation data */}
      {quotaByType.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quotaByType.map((q, idx) => {
            const colors = [
              { badge: 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800/60', bar: 'bg-teal-600 dark:bg-teal-500', rem: 'text-teal-800 dark:text-teal-300' },
              { badge: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60', bar: 'bg-indigo-600 dark:bg-indigo-500', rem: 'text-indigo-900 dark:text-indigo-300' },
              { badge: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60', bar: 'bg-amber-500', rem: 'text-amber-800 dark:text-amber-300' },
            ];
            const c = colors[idx % colors.length];
            return (
              <div key={q.type.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{q.type.name}</span>
                  {q.hasData ? (
                    <span className={`px-2 py-0.5 rounded-full text-2xs font-bold font-mono border shrink-0 ${c.badge}`}>
                      {q.remaining} / {q.allocated} {q.type.unit === 'hours' ? 'Hrs' : 'Days'} Left
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-2xs font-bold font-mono border bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 shrink-0">
                      No Quota
                    </span>
                  )}
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className={`${c.bar} h-full rounded-full transition-all duration-500`} style={{ width: `${q.hasData ? q.pct : 0}%` }} />
                </div>
                <div className="flex items-center justify-between text-2xs text-slate-500 dark:text-slate-400">
                  <span>Taken: {q.taken} {q.type.unit === 'hours' ? 'hrs' : 'days'}</span>
                  <span className={`font-bold ${c.rem}`}>
                    {q.hasData ? `Remaining: ${q.remaining} ${q.type.unit === 'hours' ? 'hrs' : 'days'}` : 'No allocation yet'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <div className="flex space-x-6">
          <button
            onClick={() => setActiveTab('requests')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              activeTab === 'requests'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Leave Requests ({requests.length})
          </button>
          <button
            onClick={() => setActiveTab('allocations')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              activeTab === 'allocations'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Allocations & Quotas ({allocations.length})
          </button>
          <button
            onClick={() => setActiveTab('types')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              activeTab === 'types'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
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
        <div className="space-y-4">
          {/* Requests Filter Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <input
                type="text"
                placeholder="Search requests by employee name, reason, or leave type..."
                value={reqSearch}
                onChange={(e) => setReqSearch(e.target.value)}
                className="w-full sm:max-w-md px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={reqStatus}
                  onChange={(e) => setReqStatus(e.target.value as any)}
                  className="w-full sm:w-48 px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="all">All Statuses ({requests.length})</option>
                  <option value="draft">Pending Approval ({requests.filter(r => r.status === 'draft').length})</option>
                  <option value="validate">Approved ({requests.filter(r => r.status === 'validate').length})</option>
                  <option value="refused">Refused ({requests.filter(r => r.status === 'refused').length})</option>
                </select>

                {(reqSearch || reqStatus !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setReqSearch('');
                      setReqStatus('all');
                    }}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {filteredRequests.length === 0 ? (
            <EmptyState
              title="No Leave Requests Found"
              description={reqSearch || reqStatus !== 'all' ? "No requests matched your filter criteria." : "There are currently no active or historical time off requests."}
              actionLabel={reqSearch || reqStatus !== 'all' ? "Clear Filters" : "Request Time Off"}
              onAction={reqSearch || reqStatus !== 'all' ? () => { setReqSearch(''); setReqStatus('all'); } : handleOpenRequest}
            />
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Employee</th>
                      <th className="py-3.5 px-4">Leave Type</th>
                      <th className="py-3.5 px-4">Requested Dates</th>
                      <th className="py-3.5 px-4">Duration</th>
                      <th className="py-3.5 px-4">Status</th>
                      {isHRMPlus() && <th className="py-3.5 px-4 text-right">Approval Decision</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paginatedRequests.map((r) => {
                      const empId = r.employee_id || (r as any).employeeId;
                      const typeId = r.type_id || (r as any).typeId;
                      const emp = employees.find((e) => String(e.id) === String(empId));
                      const tObj = types.find((t) => String(t.id) === String(typeId));
                      const empDisplayName = (r as any).employee?.name || r.employee_name || (r as any).employeeName || emp?.name || ((r as any).employee?.employeeCode || (emp as any)?.employeeCode || (empId && empId !== 'undefined' ? `Employee #${String(empId).substring(0, 8)}` : 'Staff Member'));
                      const typeDisplayName = (r as any).type?.name || r.type_name || (r as any).typeName || tObj?.name || (typeId && typeId !== 'undefined' ? `Type #${String(typeId).substring(0, 8)}` : 'Leave Type');

                      return (
                        <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 dark:text-white text-sm">
                              {empDisplayName}
                            </div>
                            {r.reason && <div className="text-2xs text-slate-500 dark:text-slate-400 italic mt-0.5">"{r.reason}"</div>}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                            {typeDisplayName}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                            {r.date_from} → {r.date_to}
                          </td>
                          <td className="py-3.5 px-4 font-financial font-extrabold text-slate-900 dark:text-white text-sm">
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

              <Pagination
                currentPage={currentPage}
                totalPages={totalReqPages}
                totalItems={filteredRequests.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(size) => {
                  setItemsPerPage(size);
                  setCurrentPage(1);
                }}
              />
            </div>
          )}
        </div>
      ) : activeTab === 'allocations' ? (
        /* TAB 2: ALLOCATIONS */
        <div className="space-y-4">
          {/* Allocations Filter Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <input
                type="text"
                placeholder="Search allocations by employee or leave type..."
                value={allocSearch}
                onChange={(e) => setAllocSearch(e.target.value)}
                className="w-full sm:max-w-md px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={allocStatus}
                  onChange={(e) => setAllocStatus(e.target.value as any)}
                  className="w-full sm:w-48 px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="all">All Allocations ({allocations.length})</option>
                  <option value="validate">Validated ({allocations.filter(a => a.status === 'validate').length})</option>
                  <option value="draft">Pending Validation ({allocations.filter(a => a.status === 'draft').length})</option>
                </select>

                {(allocSearch || allocStatus !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setAllocSearch('');
                      setAllocStatus('all');
                    }}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {filteredAllocations.length === 0 ? (
            <EmptyState
              title="No Allocations Found"
              description={allocSearch || allocStatus !== 'all' ? "No quota allocations matched your filters." : "There are currently no leave quota allocations configured."}
              actionLabel={allocSearch || allocStatus !== 'all' ? "Clear Filters" : (isHRMPlus() ? "Grant Quota Allocation" : undefined)}
              onAction={allocSearch || allocStatus !== 'all' ? () => { setAllocSearch(''); setAllocStatus('all'); } : handleOpenAlloc}
            />
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
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
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paginatedAllocations.map((a) => {
                      const empId = a.employee_id || (a as any).employeeId;
                      const typeId = a.type_id || (a as any).typeId;
                      const emp = employees.find((e) => String(e.id) === String(empId));
                      const tObj = types.find((t) => String(t.id) === String(typeId));
                      const remaining = a.remaining !== undefined ? a.remaining : (Number(a.allocated) - (Number(a.taken) || 0));
                      const empDisplayName = (a as any).employee?.name || a.employee_name || (a as any).employeeName || emp?.name || ((a as any).employee?.employeeCode || (emp as any)?.employeeCode || (empId && empId !== 'undefined' ? `Employee #${String(empId).substring(0, 8)}` : 'Staff Member'));
                      const typeDisplayName = (a as any).type?.name || a.type_name || (a as any).typeName || tObj?.name || (typeId && typeId !== 'undefined' ? `Type #${String(typeId).substring(0, 8)}` : 'Leave Type');

                      return (
                        <tr key={a.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white text-sm">
                            {empDisplayName}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">{typeDisplayName}</td>
                          <td className="py-3.5 px-4 font-financial font-semibold text-slate-900 dark:text-white">{a.allocated} days</td>
                          <td className="py-3.5 px-4 font-financial text-slate-500 dark:text-slate-400">{a.taken || 0} days</td>
                          <td className="py-3.5 px-4 font-financial font-extrabold text-teal-800 dark:text-teal-300 text-sm">
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

              <Pagination
                currentPage={allocPage}
                totalPages={totalAllocPages}
                totalItems={filteredAllocations.length}
                itemsPerPage={allocItemsPerPage}
                onPageChange={setAllocPage}
                onItemsPerPageChange={(size) => {
                  setAllocItemsPerPage(size);
                  setAllocPage(1);
                }}
              />
            </div>
          )}
        </div>
      ) : (
        /* TAB 3: LEAVE TYPES */
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Configured Leave Types</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Rules determining quota requirements and payroll deduction integration</p>
            </div>
            {isHRMPlus() && (
              <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={handleOpenCreateType}>
                New Leave Type
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {types.map((t) => (
              <div key={t.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">{t.name}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-2xs font-bold border border-indigo-100 dark:border-indigo-800/60 uppercase">
                      {t.unit}
                    </span>
                  </div>
                  <p className="text-2xs text-slate-500 dark:text-slate-400 mt-1">
                    {t.requires_allocation ? 'Requires approved quota allocation' : 'Open / Unallocated leave'}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-2xs flex items-center justify-between text-slate-400">
                  <span>Payroll Integration:</span>
                  <span className="font-semibold text-teal-700 dark:text-teal-400">
                    {t.payroll_integration ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            ))}
          </div>
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
            <SearchableSelect
              label="Employee"
              value={reqEmpId}
              onChange={(val) => setReqEmpId(val)}
              placeholder="Select Employee..."
              options={employees.map((e) => ({
                value: String(e.id),
                label: e.name,
                sublabel: e.job_position,
              }))}
              required
            />

            <Select
              label="Leave Type"
              value={reqTypeId}
              onChange={(e) => setReqTypeId(e.target.value)}
              placeholder="Select Type..."
              options={types.map((t) => ({ value: String(t.id), label: `${t.name} (${t.unit})` }))}
              required
            />
          </div>

          {/* DYNAMIC REAL-TIME BALANCE PROJECTOR BOX */}
          <div
            className={`p-4 rounded-2xl border text-xs transition-all space-y-2 ${
              isInsufficient
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-950 dark:text-rose-200'
                : 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/60 text-teal-950 dark:text-teal-200'
            }`}
          >
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1.5">
                {isInsufficient ? (
                  <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                )}
                <span>Real-Time Balance Projection</span>
              </span>
              <span className="font-financial font-extrabold text-sm">
                {estimatedDays} Days Requested
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-teal-200/60 dark:border-teal-800/40 text-2xs">
              <div>
                <span className="opacity-75 block">Current Available:</span>
                <strong className="text-xs font-financial">{liveRemainingBalance} Days</strong>
              </div>
              <div className="text-right">
                <span className="opacity-75 block">Projected Remaining:</span>
                <strong
                  className={`text-xs font-financial font-bold ${
                    isInsufficient ? 'text-rose-700 dark:text-rose-300' : 'text-teal-800 dark:text-teal-300'
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
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setReqDateFrom(e.target.value)}
              required
              helperText="Cannot select past dates"
            />

            <Input
              label="End Date"
              type="date"
              value={reqDateTo}
              min={reqDateFrom || new Date().toISOString().split('T')[0]}
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

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
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
          <SearchableSelect
            label="Employee"
            value={allocEmpId}
            onChange={(val) => setAllocEmpId(val)}
            placeholder="Select Employee..."
            options={employees.map((e) => ({
              value: String(e.id),
              label: e.name,
              sublabel: e.job_position,
            }))}
            required
          />

          <Select
            label="Leave Type"
            value={allocTypeId}
            onChange={(e) => setAllocTypeId(e.target.value)}
            placeholder="Select Type..."
            options={types.map((t) => ({ value: String(t.id), label: t.name }))}
            required
          />

          <Input
            label="Allocated Days"
            type="number"
            value={allocDays}
            onChange={(e) => setAllocDays(e.target.value ? Number(e.target.value) : '')}
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

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsAllocModalOpen(false)} disabled={submittingAlloc}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submittingAlloc}>
              Grant Allocation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Leave Type Modal */}
      <Modal
        isOpen={isTypeModalOpen}
        onClose={() => setIsTypeModalOpen(false)}
        title="Create New Leave Type"
        description="Define a new policy for annual, sick, casual, or compensatory leave"
      >
        <form onSubmit={handleCreateTypeSubmit} className="space-y-4">
          <Input
            label="Leave Type Name"
            placeholder="e.g. Parental Leave, Sabbatical, Work From Home"
            value={newTypeName}
            onChange={(e) => setNewTypeName(e.target.value)}
            required
          />

          <Select
            label="Unit of Measurement"
            value={newTypeUnit}
            onChange={(e) => setNewTypeUnit(e.target.value as 'days' | 'hours')}
            options={[
              { value: 'days', label: 'Days (Standard full/half-day requests)' },
              { value: 'hours', label: 'Hours (Hourly time-off/permissions)' },
            ]}
          />

          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-3 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={newTypeRequiresAlloc}
                onChange={(e) => setNewTypeRequiresAlloc(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800"
              />
              <div>
                <span className="font-semibold block">Requires Quota Allocation</span>
                <span className="text-2xs text-slate-500 dark:text-slate-400">Employees must be granted quota balances before they can submit requests</span>
              </div>
            </label>

            <label className="flex items-center gap-3 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={newTypePayroll}
                onChange={(e) => setNewTypePayroll(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800"
              />
              <div>
                <span className="font-semibold block">Payroll Integration</span>
                <span className="text-2xs text-slate-500 dark:text-slate-400">Factor unapproved or unpaid leave instances directly into payslip salary computations</span>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsTypeModalOpen(false)} disabled={submittingType}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submittingType}>
              Create Leave Type
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TimeOffPage;
