import {
  BRAND,
  createDoc,
  dataTable,
  brandedHeader,
  formatDate,
  formatInr,
  kpiCards,
  renderToBuffer,
  sectionTitle,
  stampFooters,
  hairline,
  PAGE,
  CONTENT_WIDTH,
} from "../../utils/pdfBrand";

interface PayslipLineData {
  category: string;
  name: string;
  amount: number | string;
}

interface PayslipPdfData {
  employeeName: string;
  periodStart: Date;
  periodEnd: Date;
  status: string;
  workedDays: number | string;
  basic: number | string;
  allowances: number | string;
  deductions: number | string;
  gross: number | string;
  net: number | string;
  lines: PayslipLineData[];
  payslipNumber?: string | null;
  employeeCode?: string | null;
}

// Real itemized payslip (Category | Rule | Amount) sharing the same brand system as the
// payroll report, per docs/roles/FRONTEND.md's PDF requirement — never a blank template
// and never a screenshot of the web page.
export function generatePayslipPdf(data: PayslipPdfData): Promise<Buffer> {
  const doc = createDoc();

  return renderToBuffer(doc, () => {
    const meta = [`Pay period: ${formatDate(data.periodStart)} — ${formatDate(data.periodEnd)}`];
    if (data.payslipNumber) meta.push(`Payslip no: ${data.payslipNumber}`);

    brandedHeader(doc, {
      title: "Payslip",
      subtitle: data.employeeCode ? `${data.employeeName} · ${data.employeeCode}` : data.employeeName,
      meta,
    });

    kpiCards(doc, [
      { label: "Net Pay", value: formatInr(data.net) },
      { label: "Gross", value: formatInr(data.gross) },
      { label: "Deductions", value: formatInr(data.deductions) },
      { label: "Worked Days", value: String(data.workedDays) },
    ]);

    sectionTitle(doc, "Salary Computation");
    dataTable(
      doc,
      [
        { header: "Category", width: 0.24 },
        { header: "Rule", width: 0.48 },
        { header: "Amount", width: 0.28, align: "right" },
      ],
      data.lines.map((l) => [l.category, l.name, formatInr(l.amount)])
    );

    // Totals block, right-aligned under the table like a real payslip stub.
    const valWidth = 0.28 * CONTENT_WIDTH;
    const valX = PAGE.margin + 0.72 * CONTENT_WIDTH + 7;
    const labelWidth = 0.48 * CONTENT_WIDTH;
    const labelX = PAGE.margin + 0.24 * CONTENT_WIDTH + 7;

    const totals: [string, string, boolean][] = [
      ["Basic", formatInr(data.basic), false],
      ["Allowances", formatInr(data.allowances), false],
      ["Gross", formatInr(data.gross), false],
      ["Deductions", `- ${formatInr(data.deductions)}`, false],
      ["Net Pay", formatInr(data.net), true],
    ];

    for (const [label, value, emphasised] of totals) {
      if (emphasised) {
        doc.moveDown(0.2);
        hairline(doc);
        doc.moveDown(0.4);
      }
      const y = doc.y;
      doc
        .font(emphasised ? "Helvetica-Bold" : "Helvetica")
        .fontSize(emphasised ? 11 : 9.5)
        .fillColor(emphasised ? BRAND.primaryDark : BRAND.body)
        .text(label, labelX, y, { width: labelWidth - 14, align: "right", lineBreak: false, ellipsis: true })
        .text(value, valX, y, { width: valWidth - 14, align: "right", lineBreak: false, ellipsis: true });
      doc.y = y + (emphasised ? 16 : 14);
    }

    doc.moveDown(1);
    doc
      .font("Helvetica-Oblique")
      .fontSize(7.5)
      .fillColor(BRAND.muted)
      .text(
        `Status: ${data.status}. This is a system-generated payslip and does not require a signature.`,
        PAGE.margin,
        doc.y,
        { width: CONTENT_WIDTH }
      );

    stampFooters(doc);
  });
}
