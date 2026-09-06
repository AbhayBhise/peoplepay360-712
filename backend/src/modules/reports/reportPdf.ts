import {
  BRAND,
  barChart,
  brandedHeader,
  createDoc,
  dataTable,
  ensureSpace,
  formatDate,
  formatInr,
  kpiCards,
  renderToBuffer,
  sectionTitle,
  stampFooters,
} from "../../utils/pdfBrand";
import { PayrollReportData } from "./report.service";

function periodLabel(data: PayrollReportData): string {
  const { periodStart, periodEnd } = data.filters;
  if (!periodStart && !periodEnd) return "All time";
  return `${periodStart ? formatDate(periodStart) : "Beginning"} — ${periodEnd ? formatDate(periodEnd) : "Today"}`;
}

// A real generated document: brand band, KPI cards, vector charts, zebra tables,
// page numbering. Explicitly not a screenshot of the web page — this is composed
// server-side from the same aggregates the dashboard reads.
export function generatePayrollReportPdf(data: PayrollReportData): Promise<Buffer> {
  const doc = createDoc();

  return renderToBuffer(doc, () => {
    const s = data.summary as Record<string, unknown>;

    brandedHeader(doc, {
      title: "Payroll & Workforce Report",
      subtitle: data.departmentName ? `Department: ${data.departmentName}` : "All departments",
      meta: [
        `Reporting period: ${periodLabel(data)}`,
        `Generated: ${formatDate(data.generatedAt)} · by ${data.generatedBy}`,
      ],
    });

    kpiCards(doc, [
      { label: "Total Net Paid", value: formatInr(s.totalNetPaid as number) },
      { label: "Payslips", value: String(s.payslipsGenerated ?? 0) },
      { label: "Avg Salary", value: formatInr(s.averageSalary as number) },
      { label: "Attendance", value: `${Number(s.attendanceHealthPct ?? 0).toFixed(1)}%` },
    ]);

    sectionTitle(doc, "Salary Cost by Department");
    barChart(
      doc,
      data.salaryByDepartment.map((d) => ({ label: d.departmentName, value: d.totalSalary })),
      { valueFormatter: (n) => formatInr(n) }
    );

    dataTable(
      doc,
      [
        { header: "Department", width: 0.46 },
        { header: "Headcount", width: 0.18, align: "right" },
        { header: "Total Salary", width: 0.36, align: "right" },
      ],
      data.salaryByDepartment.map((d) => [d.departmentName, String(d.headcount), formatInr(d.totalSalary)])
    );

    sectionTitle(doc, "Monthly Net Salary Trend");
    barChart(
      doc,
      data.netSalaryTrend.map((t) => ({ label: t.month, value: t.netTotal })),
      { valueFormatter: (n) => formatInr(n) }
    );

    sectionTitle(doc, "Payruns in Period");
    dataTable(
      doc,
      [
        { header: "Period", width: 0.3 },
        { header: "Structure", width: 0.26 },
        { header: "Status", width: 0.14 },
        { header: "Payslips", width: 0.12, align: "right" },
        { header: "Net Total", width: 0.18, align: "right" },
      ],
      data.payruns.map((p) => [
        `${formatDate(p.periodStart)} – ${formatDate(p.periodEnd)}`,
        p.structureName,
        p.status,
        String(p.payslipCount),
        formatInr(p.netTotal),
      ])
    );

    const att = data.attendance as Record<string, unknown>;
    sectionTitle(doc, "Attendance Overview");
    dataTable(
      doc,
      [
        { header: "Metric", width: 0.6 },
        { header: "Value", width: 0.4, align: "right" },
      ],
      [
        ["Present", String(att.present ?? 0)],
        ["Late", String(att.late ?? 0)],
        ["Missing check-outs", String(att.missingCheckouts ?? 0)],
        ["Manual edits", String(att.manualEdits ?? 0)],
        ["Coverage", `${Number(att.coveragePct ?? 0).toFixed(1)}%`],
      ]
    );

    if (data.alerts.length) {
      ensureSpace(doc, 60);
      sectionTitle(doc, "Operational Alerts");
      doc.font("Helvetica").fontSize(9).fillColor(BRAND.danger);
      for (const alert of data.alerts) {
        doc.text(`•  ${alert}`, { width: 495, paragraphGap: 3 });
      }
      doc.fillColor(BRAND.body);
    }

    stampFooters(doc);
  });
}
