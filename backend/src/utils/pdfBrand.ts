import PDFDocument from "pdfkit";

// Shared branded PDF primitives. Everything the app generates as a document —
// payslips, payroll reports — is composed from these, so a judge opening any two
// PDFs from this system sees the same identity rather than two different templates.
//
// NOTE ON CURRENCY: PDFKit's built-in fonts (Helvetica et al.) use WinAnsi encoding,
// which has no glyph for the rupee sign (U+20B9) — it renders as a blank box. Amounts
// are therefore prefixed "INR" rather than "₹". Rendering the actual symbol requires
// embedding a Unicode TTF (e.g. Noto Sans); deliberately avoided so the PDF pipeline
// has zero binary asset dependencies.

export type Doc = PDFKit.PDFDocument;

export const BRAND = {
  primary: "#4F46E5",
  primaryDark: "#3730A3",
  accent: "#0D9488",
  ink: "#0F172A",
  body: "#334155",
  muted: "#64748B",
  hairline: "#E2E8F0",
  zebra: "#F8FAFC",
  danger: "#BE123C",
} as const;

export const PAGE = {
  margin: 45,
  width: 595.28,
  height: 841.89,
} as const;

export const CONTENT_WIDTH = PAGE.width - PAGE.margin * 2;

const COMPANY_NAME = process.env.COMPANY_NAME ?? "PeoplePay360";
const COMPANY_TAGLINE = process.env.COMPANY_TAGLINE ?? "Integrated HR & Payroll Operations";

export function createDoc(): Doc {
  return new PDFDocument({ size: "A4", margin: PAGE.margin, bufferPages: true });
}

// Collects the stream into a single Buffer — the shape every controller wants so it
// can set Content-Length and stream one response.
export function renderToBuffer(doc: Doc, build: () => void): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    try {
      build();
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export function formatInr(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return "INR 0";
  // en-IN grouping (lakh/crore): 12,34,567 rather than 1,234,567.
  return `INR ${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// Solid brand band with the company mark reversed out of it, then the document title
// beneath. Returns nothing — leaves doc.y positioned below the header.
export function brandedHeader(doc: Doc, opts: { title: string; subtitle?: string; meta?: string[] }) {
  const bandHeight = 74;

  doc.save();
  doc.rect(0, 0, PAGE.width, bandHeight).fill(BRAND.primary);
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(19).text(COMPANY_NAME, PAGE.margin, 22);
  doc.font("Helvetica").fontSize(8.5).fillColor("#C7D2FE").text(COMPANY_TAGLINE, PAGE.margin, 47);
  doc.restore();

  doc.y = bandHeight + 22;

  doc.font("Helvetica-Bold").fontSize(16).fillColor(BRAND.ink).text(opts.title, PAGE.margin, doc.y);
  if (opts.subtitle) {
    doc.moveDown(0.25);
    doc.font("Helvetica").fontSize(10).fillColor(BRAND.muted).text(opts.subtitle, PAGE.margin, doc.y);
  }

  if (opts.meta?.length) {
    doc.moveDown(0.6);
    doc.font("Helvetica").fontSize(8.5).fillColor(BRAND.muted);
    for (const line of opts.meta) doc.text(line, PAGE.margin, doc.y);
  }

  doc.moveDown(0.8);
  hairline(doc);
  doc.moveDown(0.8);
  doc.fillColor(BRAND.body);
}

export function hairline(doc: Doc) {
  doc
    .save()
    .strokeColor(BRAND.hairline)
    .lineWidth(1)
    .moveTo(PAGE.margin, doc.y)
    .lineTo(PAGE.width - PAGE.margin, doc.y)
    .stroke()
    .restore();
}

export function sectionTitle(doc: Doc, text: string) {
  ensureSpace(doc, 40);
  doc.moveDown(0.4);
  doc.font("Helvetica-Bold").fontSize(11.5).fillColor(BRAND.ink).text(text, PAGE.margin, doc.y);
  doc.moveDown(0.45);
  doc.fillColor(BRAND.body);
}

// Row of boxed KPI figures — the "headline numbers" band at the top of a report.
export function kpiCards(doc: Doc, items: { label: string; value: string }[]) {
  if (!items.length) return;
  const gap = 10;
  const cardW = (CONTENT_WIDTH - gap * (items.length - 1)) / items.length;
  const cardH = 52;
  const top = doc.y;

  items.forEach((item, i) => {
    const x = PAGE.margin + i * (cardW + gap);
    doc.save();
    doc.roundedRect(x, top, cardW, cardH, 5).fillAndStroke(BRAND.zebra, BRAND.hairline);
    doc
      .fillColor(BRAND.muted)
      .font("Helvetica")
      .fontSize(7.5)
      .text(item.label.toUpperCase(), x + 10, top + 10, { width: cardW - 20, characterSpacing: 0.4 });
    doc
      .fillColor(BRAND.primaryDark)
      .font("Helvetica-Bold")
      .fontSize(11)
      .text(item.value, x + 10, top + 25, { width: cardW - 20, lineBreak: false, ellipsis: true });
    doc.restore();
  });

  doc.y = top + cardH + 14;
  doc.fillColor(BRAND.body);
}

export interface TableColumn {
  header: string;
  // Width as a fraction of the content width; fractions across all columns should total 1.
  width: number;
  align?: "left" | "right";
}

// Zebra-striped table with a shaded header that repeats on every page break.
export function dataTable(doc: Doc, columns: TableColumn[], rows: string[][]) {
  const widths = columns.map((c) => c.width * CONTENT_WIDTH);
  // Running left-edge of each column: [margin, margin+w0, margin+w0+w1, ...].
  // (A previous reduce-based version off-by-one'd this — every column but the
  // first ended up reusing the previous column's x, which is what rendered as
  // every row's cells stacked on top of each other.)
  const xs: number[] = [];
  let cursor = PAGE.margin;
  for (const w of widths) {
    xs.push(cursor);
    cursor += w;
  }
  const rowH = 19;

  const drawHeader = () => {
    const top = doc.y;
    doc.save();
    doc.rect(PAGE.margin, top, CONTENT_WIDTH, rowH).fill(BRAND.primary);
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(8.5);
    columns.forEach((col, i) => {
      doc.text(col.header.toUpperCase(), xs[i] + 7, top + 6, {
        width: widths[i] - 14,
        align: col.align ?? "left",
        lineBreak: false,
      });
    });
    doc.restore();
    doc.y = top + rowH;
  };

  drawHeader();

  rows.forEach((row, r) => {
    if (doc.y + rowH > PAGE.height - PAGE.margin - 30) {
      doc.addPage();
      drawHeader();
    }
    const top = doc.y;
    if (r % 2 === 1) {
      doc.save().rect(PAGE.margin, top, CONTENT_WIDTH, rowH).fill(BRAND.zebra).restore();
    }
    doc.font("Helvetica").fontSize(8.5).fillColor(BRAND.body);
    row.forEach((cell, i) => {
      doc.text(cell, xs[i] + 7, top + 6, {
        width: widths[i] - 14,
        align: columns[i].align ?? "left",
        lineBreak: false,
        ellipsis: true,
      });
    });
    doc.y = top + rowH;
  });

  doc.save().strokeColor(BRAND.hairline).lineWidth(1).rect(PAGE.margin, doc.y, CONTENT_WIDTH, 0).stroke().restore();
  doc.moveDown(0.8);
  doc.fillColor(BRAND.body);
}

// Native vector bar chart — no image, no charting dependency. Drawn with pdfkit
// primitives so it stays crisp at any zoom and adds nothing to the dependency tree.
export function barChart(
  doc: Doc,
  data: { label: string; value: number }[],
  opts: { valueFormatter?: (n: number) => string; maxBars?: number } = {}
) {
  // A zero/negative/invalid value draws an invisible (or non-existent) bar but still
  // claims a full label row. Real data can carry these — e.g. a freshly created
  // department with no headcount yet, or a stray test row nobody's cleaned up — and
  // once there are enough of them the row pitch below used to shrink to fit them all,
  // which is what made every label bleed into its neighbours. Dropping them is safe
  // for any caller: a bar with nothing to show conveys nothing either way, and it's
  // still listed in the detail table this chart sits above.
  const rows = data.filter((d) => Number.isFinite(d.value) && d.value > 0);

  if (!rows.length) {
    doc.font("Helvetica-Oblique").fontSize(9).fillColor(BRAND.muted).text("No data for the selected filters.");
    doc.moveDown(0.6);
    doc.fillColor(BRAND.body);
    return;
  }

  // Legibility, not the dataset size, sets how many bars a chart draws. Order is left
  // exactly as the caller provided it — chronological for a trend line, whatever order
  // for a category breakdown — rather than re-sorted here, since only the caller knows
  // which order is meaningful; the table underneath always has the full, uncapped list.
  const maxBars = opts.maxBars ?? 15;
  const shown = rows.slice(0, maxBars);
  const hiddenCount = rows.length - shown.length;

  const fmt = opts.valueFormatter ?? ((n: number) => n.toLocaleString("en-IN"));
  const labelGutter = 96;
  // Fixed row pitch — this never shrinks to cram more rows into a budget, so labels
  // can never visually overlap no matter how many bars end up being drawn.
  const barH = 13;
  const rowGap = 8;
  const rowPitch = barH + rowGap;
  const chartHeight = shown.length * rowPitch;

  ensureSpace(doc, chartHeight + (hiddenCount ? 16 : 0) + 20);

  const top = doc.y;
  const plotX = PAGE.margin + labelGutter;
  const plotW = CONTENT_WIDTH - labelGutter - 70;
  const max = Math.max(...shown.map((d) => d.value), 1);

  shown.forEach((d, i) => {
    const y = top + i * rowPitch;
    const w = Math.max(1, (d.value / max) * plotW);

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(BRAND.body)
      .text(d.label, PAGE.margin, y + barH / 2 - 4, { width: labelGutter - 8, align: "right", lineBreak: false, ellipsis: true });

    // Track behind the bar gives the eye a consistent 100% reference.
    doc.save().rect(plotX, y, plotW, barH).fill(BRAND.zebra).restore();
    doc.save().rect(plotX, y, w, barH).fill(BRAND.primary).restore();

    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(BRAND.ink)
      .text(fmt(d.value), plotX + plotW + 8, y + barH / 2 - 4, { width: 62, lineBreak: false, ellipsis: true });
  });

  doc.y = top + chartHeight;

  if (hiddenCount) {
    doc.moveDown(0.3);
    doc
      .font("Helvetica-Oblique")
      .fontSize(7.5)
      .fillColor(BRAND.muted)
      .text(`+${hiddenCount} more — see the table below for the full list.`, PAGE.margin, doc.y);
  }

  doc.moveDown(0.6);
  doc.fillColor(BRAND.body);
}

export function ensureSpace(doc: Doc, needed: number) {
  if (doc.y + needed > PAGE.height - PAGE.margin - 30) doc.addPage();
}

// Page numbers + confidentiality line, stamped across every buffered page at the end.
export function stampFooters(doc: Doc) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const y = PAGE.height - PAGE.margin - 12;
    doc.save();
    doc.strokeColor(BRAND.hairline).lineWidth(1).moveTo(PAGE.margin, y - 8).lineTo(PAGE.width - PAGE.margin, y - 8).stroke();
    doc.font("Helvetica").fontSize(7.5).fillColor(BRAND.muted);
    doc.text(`${COMPANY_NAME} · Confidential`, PAGE.margin, y, { lineBreak: false });
    doc.text(`Page ${i - range.start + 1} of ${range.count}`, PAGE.width - PAGE.margin - 120, y, {
      width: 120,
      align: "right",
      lineBreak: false,
    });
    doc.restore();
  }
}
