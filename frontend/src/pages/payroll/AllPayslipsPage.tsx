import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileSpreadsheet, Printer, Search } from 'lucide-react';
import { payrollApi } from '../../api/payroll';
import { PayslipDetail } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Pagination } from '../../components/common/Pagination';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/currency';
import { extractItems } from '../../utils/pagination';

export const AllPayslipsPage: React.FC = () => {
  const [payslips, setPayslips] = useState<PayslipDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'validated' | 'computed' | 'draft'>('all');
  const { error } = useToast();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = extractItems(await payrollApi.getPayslips());
        setPayslips(data || []);
      } catch (err: any) {
        error(err.message || 'Failed to load payslips.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const filtered = payslips.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    const empName = (p.employee_name || (p as any).employee?.name || (p as any).employeeName || '').toLowerCase();
    return empName.includes(q) || String(p.id).toLowerCase().includes(q);
  });

  const totalNet = payslips.reduce((sum, p) => sum + (Number(p.net) || 0), 0);
  const paidCount = payslips.filter((p) => p.status === 'paid').length;
  const validatedCount = payslips.filter((p) => p.status === 'validated').length;
  const draftComputedCount = payslips.filter((p) => p.status === 'draft' || p.status === 'computed').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Employee Payslips</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            View computed earnings, itemized rule breakdown, and generate official printable PDF slips
          </p>
        </div>
      </div>

      {/* Summary KPI metric ribbon with click-filtering */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          onClick={() => setStatusFilter('all')}
          className={`bg-white dark:bg-slate-900 p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'border-indigo-600 ring-2 ring-indigo-500/20 dark:border-indigo-500'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="text-2xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Payslips</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{payslips.length}</div>
          <div className="text-2xs text-slate-400 mt-1">Disbursement: {formatCurrency(totalNet)}</div>
        </div>

        <div
          onClick={() => setStatusFilter('paid')}
          className={`bg-white dark:bg-slate-900 p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'paid'
              ? 'border-teal-600 ring-2 ring-teal-500/20 dark:border-teal-500'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="text-2xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">Paid Out</div>
          <div className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-1">{paidCount}</div>
          <div className="text-2xs text-teal-500/80 mt-1">Completed disbursement</div>
        </div>

        <div
          onClick={() => setStatusFilter('validated')}
          className={`bg-white dark:bg-slate-900 p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'validated'
              ? 'border-blue-600 ring-2 ring-blue-500/20 dark:border-blue-500'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="text-2xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Validated</div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{validatedCount}</div>
          <div className="text-2xs text-blue-500/80 mt-1">Ready for payment release</div>
        </div>

        <div
          onClick={() => setStatusFilter('computed')}
          className={`bg-white dark:bg-slate-900 p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'computed' || statusFilter === 'draft'
              ? 'border-amber-600 ring-2 ring-amber-500/20 dark:border-amber-500'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="text-2xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Draft / In Review</div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{draftComputedCount}</div>
          <div className="text-2xs text-amber-500/80 mt-1">Pending validation</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4! shadow-2xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search payslips by employee name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-400"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {(['all', 'paid', 'validated', 'computed', 'draft'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer shrink-0 ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {loading ? (
        <Spinner label="Loading payslips..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No Payslips Found"
          description="Try adjusting your search query or status filter."
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Payslip ID</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">Worked Days</th>
                  <th className="py-3 px-4">Basic Wage</th>
                  <th className="py-3 px-4">Gross</th>
                  <th className="py-3 px-4">Net Salary</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">#{p.id}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {(p as any).employee?.name || p.employee_name || (p as any).employeeName || ((p as any).employee?.employeeCode || (p as any).employeeCode || (p.employee_id || (p as any).employeeId ? `Employee #${(p.employee_id || (p as any).employeeId).substring(0, 8)}` : 'Staff Member'))}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {p.period_start} → {p.period_end}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{p.worked_days} Days</td>
                    <td className="py-3 px-4 font-mono text-slate-800 dark:text-slate-200">{formatCurrency(p.basic)}</td>
                    <td className="py-3 px-4 font-mono text-indigo-900 dark:text-indigo-300">{formatCurrency(p.gross)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-800 dark:text-emerald-300 text-sm">
                      {formatCurrency(p.net)}
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
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/payroll/payslips/${p.id}`}
                          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          View Breakdown
                        </Link>
                        <button
                          onClick={() => window.open(payrollApi.getPayslipPdfUrl(p.id), '_blank')}
                          className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                          title="Print PDF"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filtered.length / itemsPerPage)}
            totalItems={filtered.length}
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
  );
};
