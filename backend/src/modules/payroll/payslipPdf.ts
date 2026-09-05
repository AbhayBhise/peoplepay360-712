import PDFDocument from "pdfkit";

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
}

const COMPANY_NAME = process.env.COMPANY_NAME ?? "PeoplePay360 Inc.";

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Real itemized PDF (Category | Rule Name | Amount) — not a blank/placeholder template,
// per docs/roles/FRONTEND.md's PDF requirement.
export function generatePayslipPdf(data: PayslipPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).text(COMPANY_NAME, { align: "left" });
    doc.moveDown(0.2);
    doc.fontSize(14).text("Payslip", { align: "left" });
    doc.moveDown();

    doc.fontSize(10);
    doc.text(`Employee: ${data.employeeName}`);
    doc.text(`Period: ${formatDate(data.periodStart)} to ${formatDate(data.periodEnd)}`);
    doc.text(`Status: ${data.status}`);
    doc.text(`Worked Days: ${data.workedDays}`);
    doc.moveDown();

    doc.fontSize(12).text("Salary Computation", { underline: true });
    doc.moveDown(0.5);

    const colX = { category: 50, name: 160, amount: 420 };
    doc.fontSize(10).text("Category", colX.category, doc.y, { continued: false });
    doc.text("Rule", colX.name, doc.y - doc.currentLineHeight());
    doc.text("Amount", colX.amount, doc.y - doc.currentLineHeight());
    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.3);

    for (const line of data.lines) {
      const y = doc.y;
      doc.text(line.category, colX.category, y);
      doc.text(line.name, colX.name, y);
      doc.text(Number(line.amount).toFixed(2), colX.amount, y);
      doc.moveDown(0.4);
    }

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    doc.fontSize(10).text(`Basic: ${Number(data.basic).toFixed(2)}`);
    doc.text(`Allowances: ${Number(data.allowances).toFixed(2)}`);
    doc.text(`Deductions: ${Number(data.deductions).toFixed(2)}`);
    doc.moveDown(0.3);
    doc.fontSize(12).text(`Gross: ${Number(data.gross).toFixed(2)}`, { continued: false });
    doc.fontSize(12).text(`Net: ${Number(data.net).toFixed(2)}`);

    doc.end();
  });
}
