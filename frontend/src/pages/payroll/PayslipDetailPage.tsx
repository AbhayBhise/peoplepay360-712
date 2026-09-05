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
        description="The requested payslip record was not found."
        actionLabel="Back to Payruns"
        onAction={() => navigate('/payroll/payruns')}
      />
    );
  }

  const lines = payslip.lines || [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Back
          </Button>
          <span className="text-slate-400">/</span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Payslip #{payslip.id}
          </h1>
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

        <Button
          variant="primary"
          icon={<Printer className="w-4 h-4" />}
          onClick={handlePrint}
          className="shadow-md"
        >
          Print Payslip PDF
        </Button>
      </div>

      {/* Main Payslip Statement Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-6">
        {/* Company & Employee Identity Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
          <div>
            <div className="text-xl font-extrabold text-[#714B67] tracking-tight">
              People<span className="text-teal-600">Pay360</span>
            </div>
            <p className="text-xs text-slate-500">Official Monthly Earnings Statement</p>
          </div>
          <div className="text-right sm:text-right">
            <div className="text-xs text-slate-500">Payroll Period</div>
            <div className="text-sm font-bold text-slate-900">
              {payslip.period_start} to {payslip.period_end}
            </div>
          </div>
        </div>

        {/* Employee & Structure Summary Box */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 block">Employee</span>
            <span className="font-bold text-slate-900 text-sm">
              {payslip.employee_name || `ID #${payslip.employee_id}`}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Salary Structure</span>
            <span className="font-semibold text-slate-800">
              {payslip.structure_name || `Structure #${payslip.structure_id}`}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Worked Days</span>
            <span className="font-semibold text-slate-800 font-mono">{payslip.worked_days} Days</span>
          </div>
          <div>
            <span className="text-slate-500 block">Payrun Reference</span>
            <span className="font-semibold text-slate-800">
              {payslip.payrun_id ? `#${payslip.payrun_id}` : 'Manual'}
            </span>
          </div>
        </div>

        {/* STRUCTURED SALARY BREAKDOWN TABLE (Category | Rule Name | Amount) */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Itemized Salary Computation Breakdown
          </h3>
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Salary Rule Name</th>
                  <th className="py-3 px-4 text-right">Computed Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lines.length > 0 ? (
                  lines.map((line, idx) => {
                    const isDeduction = line.category === 'Deduction';
                    const isNet = line.category === 'Net';
                    const isGross = line.category === 'Gross';

                    return (
                      <tr
                        key={idx}
                        className={`hover:bg-slate-50 transition-colors ${
                          isNet ? 'bg-emerald-50/50 font-bold' : isGross ? 'bg-purple-50/40 font-semibold' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-2xs font-semibold ${
                              isDeduction
                                ? 'bg-rose-100 text-rose-800'
                                : line.category === 'Allowance'
                                ? 'bg-teal-100 text-teal-800'
                                : line.category === 'Basic'
                                ? 'bg-purple-100 text-[#714B67]'
                                : isNet
                                ? 'bg-emerald-100 text-emerald-900'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {line.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-800 font-medium">{line.name}</td>
                        <td
                          className={`py-3 px-4 text-right font-mono ${
                            isDeduction
                              ? 'text-rose-700 font-semibold'
                              : isNet
                              ? 'text-emerald-800 text-sm font-black'
                              : 'text-slate-900 font-semibold'
                          }`}
                        >
                          {isDeduction ? '-' : ''}${Math.abs(line.amount).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <>
                    <tr className="hover:bg-slate-50">
                      <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-purple-100 text-[#714B67] text-2xs font-semibold">Basic</span></td>
                      <td className="py-3 px-4 text-slate-800 font-medium">Basic Salary</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold">${payslip.basic?.toLocaleString()}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 text-2xs font-semibold">Allowance</span></td>
                      <td className="py-3 px-4 text-slate-800 font-medium">Allowances Total</td>
                      <td className="py-3 px-4 text-right font-mono text-teal-700 font-semibold">+${payslip.allowances?.toLocaleString() || 0}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-2xs font-semibold">Deduction</span></td>
                      <td className="py-3 px-4 text-slate-800 font-medium">Deductions Total</td>
                      <td className="py-3 px-4 text-right font-mono text-rose-700 font-semibold">-${payslip.deductions?.toLocaleString() || 0}</td>
                    </tr>
                  </>
                )}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold">
                <tr>
                  <td colSpan={2} className="py-3 px-4 text-slate-700 uppercase tracking-wider text-xs">
                    Gross Salary
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-purple-900 text-sm">
                    ${payslip.gross?.toLocaleString()}
                  </td>
                </tr>
                <tr className="bg-emerald-50 text-emerald-950 font-extrabold text-sm border-t border-emerald-200">
                  <td colSpan={2} className="py-3.5 px-4 uppercase tracking-wider">
                    Total Net Salary Payable
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-base text-emerald-800">
                    ${payslip.net?.toLocaleString()}
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
