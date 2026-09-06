import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileSpreadsheet, ArrowLeft, Printer, Download, User, Calendar, Layers } from 'lucide-react';
import { payrollApi } from '../../api/payroll';
import { PayslipDetail } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/currency';

export const PayslipDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { error } = useToast();

  const [payslip, setPayslip] = useState<PayslipDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await payrollApi.getPayslipById(id);
        setPayslip(data);
      } catch (err: any) {
        error(err.message || 'Failed to load payslip detail.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handlePrint = () => {
    if (!id) return;
    const pdfUrl = payrollApi.getPayslipPdfUrl(id);
    window.open(pdfUrl, '_blank');
  };

  if (loading) {
    return <Spinner label="Loading payslip breakdown..." />;
  }

  if (!payslip) {
    return (
      <EmptyState
        title="Payslip Not Found"
        description="The requested payslip record does not exist or has been removed."
        actionLabel="Back to Payslips"
        onAction={() => navigate('/payroll/payslips')}
      />
    );
  }

  const lines = payslip.lines || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/payroll/payslips')}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            All Payslips
          </Button>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-bold text-indigo-600 uppercase font-mono">
            Slip #{payslip.id}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            icon={<Printer className="w-4 h-4" />}
            onClick={handlePrint}
          >
            Download PDF Payslip
          </Button>
        </div>
      </div>

      {/* Main Payslip Statement Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6 sm:p-8 space-y-6">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                P
              </div>
              <span className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">PeoplePay360</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Official Payroll Salary Statement</p>
          </div>

          <div className="text-right">
            <div className="flex items-center justify-end gap-2">
              <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">Status:</span>
              <Badge
                variant={
                  payslip.status === 'paid'
                    ? 'paid'
                    : payslip.status === 'validated'
                    ? 'validated'
                    : payslip.status === 'computed'
                    ? 'computed'
                    : 'draft'
                }
              >
                {payslip.status}
              </Badge>
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">Pay Period:</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {payslip.period_start || '—'} to {payslip.period_end || '—'}
            </div>
          </div>
        </div>

        {/* Employee & Structure Summary Box */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
          <div>
            <span className="text-slate-500 dark:text-slate-400 block">Employee</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              {(payslip as any).employee?.name || payslip.employee_name || (payslip as any).employeeName || ((payslip as any).employee?.employeeCode || (payslip as any).employeeCode || ((payslip.employee_id || (payslip as any).employeeId) ? `Employee #${(payslip.employee_id || (payslip as any).employeeId).substring(0, 8)}` : 'Staff Member'))}
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block">Salary Structure</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {payslip.structure_name || (payslip.structure_id ? `Structure #${payslip.structure_id}` : 'Standard Structure')}
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block">Worked Days</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
              {payslip.worked_days !== undefined ? `${payslip.worked_days} Days` : '22 Days'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block">Payrun Reference</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {payslip.payrun_id ? `#${payslip.payrun_id}` : 'Standard Batch'}
            </span>
          </div>
        </div>

        {/* STRUCTURED SALARY BREAKDOWN TABLE (Category | Rule Name | Amount) */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Itemized Salary Computation Breakdown
          </h3>
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Salary Rule Name</th>
                  <th className="py-3 px-4 text-right">Computed Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {lines.length > 0 ? (
                  lines.map((line, idx) => {
                    const isDeduction = line.category === 'Deduction';
                    const isNet = line.category === 'Net';

                    return (
                      <tr
                        key={idx}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                          isNet ? 'bg-emerald-50/50 dark:bg-emerald-950/40 font-bold' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-2xs font-semibold ${
                              line.category === 'Basic'
                                ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                                : line.category === 'Allowance'
                                ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300'
                                : line.category === 'Deduction'
                                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {line.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-medium">{line.name}</td>
                        <td
                          className={`py-3 px-4 text-right font-mono ${
                            isDeduction
                              ? 'text-rose-700 dark:text-rose-400 font-semibold'
                              : isNet
                              ? 'text-emerald-800 dark:text-emerald-300 text-sm font-black'
                              : 'text-slate-900 dark:text-white font-semibold'
                          }`}
                        >
                          {isDeduction ? '-' : ''}{formatCurrency(Math.abs(line.amount))}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-2xs font-semibold">Basic</span></td>
                      <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-medium">Basic Salary</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 dark:text-white">{formatCurrency(payslip.basic)}</td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 text-2xs font-semibold">Allowance</span></td>
                      <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-medium">Allowances Total</td>
                      <td className="py-3 px-4 text-right font-mono text-teal-700 dark:text-teal-300 font-semibold">+{formatCurrency(payslip.allowances || 0)}</td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 text-2xs font-semibold">Deduction</span></td>
                      <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-medium">Deductions Total</td>
                      <td className="py-3 px-4 text-right font-mono text-rose-700 dark:text-rose-400 font-semibold">-{formatCurrency(payslip.deductions || 0)}</td>
                    </tr>
                  </>
                )}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-800/80 border-t-2 border-slate-200 dark:border-slate-700 font-bold">
                <tr>
                  <td colSpan={2} className="py-3 px-4 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-xs">
                    Gross Salary
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-indigo-900 dark:text-indigo-300 text-sm">
                    {formatCurrency(payslip.gross)}
                  </td>
                </tr>
                <tr className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-200 font-extrabold text-sm border-t border-emerald-200 dark:border-emerald-800">
                  <td colSpan={2} className="py-3.5 px-4 uppercase tracking-wider">
                    Total Net Salary Payable
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-base text-emerald-800 dark:text-emerald-300">
                    {formatCurrency(payslip.net)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
