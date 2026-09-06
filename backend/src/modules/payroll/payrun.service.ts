import { z } from "zod";
import { prisma } from "../../prisma";
import { ApiError } from "../../utils/ApiError";
import { AuthPayload } from "../../middleware/auth";
import { previewPayrunSchema, createPayrunSchema } from "./payrun.validation";
import { evaluateFormula } from "./formulaEvaluator";
import { generatePayslipPdf } from "./payslipPdf";
import { sendMail } from "../../utils/mailer";

type PreviewInput = z.infer<typeof previewPayrunSchema>;
type CreateInput = z.infer<typeof createPayrunSchema>;

// "Eligible" = an active contract that fully covers the requested period AND is on the
// requested salary structure — docs/02_API_CONTRACTS.md section 8, "payroll processes only
// the contract applicable to the selected period" (00_PROJECT_BRIEF.md section 1).
async function findEligibleEmployees(structureId: string, periodStart: Date, periodEnd: Date) {
  const contracts = await prisma.contract.findMany({
    where: {
      salaryStructureId: structureId,
      status: "active",
      startDate: { lte: periodStart },
      OR: [{ endDate: null }, { endDate: { gte: periodEnd } }],
    },
    include: { employee: true },
  });

  return contracts.map((c) => ({
    employeeId: c.employeeId,
    employeeName: c.employee.name,
    contractId: c.id,
    wage: c.wage,
  }));
}

export async function previewPayrun(input: PreviewInput) {
  const structure = await prisma.salaryStructure.findUnique({ where: { id: input.structureId } });
  if (!structure) throw ApiError.badRequest(`structureId: no salary structure with id ${input.structureId}`);

  return findEligibleEmployees(input.structureId, input.periodStart, input.periodEnd);
}

export async function createPayrun(auth: AuthPayload, input: CreateInput) {
  const eligible = await findEligibleEmployees(input.structureId, input.periodStart, input.periodEnd);
  const eligibleIds = new Set(eligible.map((e) => e.employeeId));

  const invalid = input.employeeIds.filter((id) => !eligibleIds.has(id));
  if (invalid.length > 0) {
    throw ApiError.badRequest(
      `employeeIds: not eligible for this structure/period: ${invalid.join(", ")}`
    );
  }

  return prisma.$transaction(async (tx) => {
    const payrun = await tx.payrun.create({
      data: {
        structureId: input.structureId,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        status: "draft",
      },
    });

    for (const employeeId of input.employeeIds) {
      const eligibleEmployee = eligible.find((e) => e.employeeId === employeeId)!;
      await tx.payslip.create({
        data: {
          payrunId: payrun.id,
          employeeId,
          contractId: eligibleEmployee.contractId,
          status: "draft",
        },
      });
    }

    return tx.payrun.findUnique({ where: { id: payrun.id }, include: { payslips: true } });
  });
}

export async function getPayrun(id: string) {
  const payrun = await prisma.payrun.findUnique({
    where: { id },
    include: { payslips: true, structure: true },
  });
  if (!payrun) throw ApiError.notFound(`payrun: no payrun with id ${id}`);

  const warnings = await collectWarnings(payrun.id);
  return { ...payrun, warnings };
}

export function listPayruns() {
  return prisma.payrun.findMany({
    include: { _count: { select: { payslips: true } }, structure: true },
    orderBy: { createdAt: "desc" },
  });
}

async function collectWarnings(payrunId: string): Promise<string[]> {
  const warnings: string[] = [];
  const payslips = await prisma.payslip.findMany({ where: { payrunId } });

  for (const payslip of payslips) {
    if (!payslip.contractId) {
      warnings.push(`Employee ${payslip.employeeId}: no active contract resolved for this period`);
    }
    const attendanceCount = await prisma.attendance.count({ where: { employeeId: payslip.employeeId } });
    if (attendanceCount === 0) {
      warnings.push(`Employee ${payslip.employeeId}: no attendance data found`);
    }
  }
  // Duplicate payslip for the same employee+payrun is already impossible at the DB level
  // (unique(payrunId, employeeId) — docs/01_DATABASE_SCHEMA.md), so no runtime check needed here.
  return warnings;
}

// The actual payroll math: resolve contract, pull worked days, run salary rules in
// sequence, write one payslip_lines row per rule (docs/00_PROJECT_BRIEF.md section 3,
// compute-payslip.md workflow).
export async function computePayrun(auth: AuthPayload, payrunId: string) {
  const payrun = await prisma.payrun.findUnique({ where: { id: payrunId }, include: { payslips: true } });
  if (!payrun) throw ApiError.notFound(`payrun: no payrun with id ${payrunId}`);
  if (payrun.status !== "draft") {
    throw ApiError.conflict(`payrun: cannot compute a payrun in status '${payrun.status}'`);
  }

  const rules = await prisma.salaryRule.findMany({
    where: { structureId: payrun.structureId },
    orderBy: { sequence: "asc" },
  });

  for (const payslip of payrun.payslips) {
    const contract = payslip.contractId
      ? await prisma.contract.findUnique({ where: { id: payslip.contractId } })
      : null;
    if (!contract) {
      // Surfaced as a warning via collectWarnings(); skip computing this payslip's lines.
      continue;
    }

    const workedDays = await prisma.attendance.count({
      where: {
        employeeId: payslip.employeeId,
        checkIn: { gte: payrun.periodStart, lte: payrun.periodEnd },
      },
    });

    // Contract-derived values usable as identifiers in any rule's formula, the same way an
    // earlier rule's own code (BASIC, HRA, ...) becomes usable once computed. Without this,
    // there is no way for a formula to express "basic = contract wage" at all (found by
    // Disha's compute smoke test against seed data — see docs/roles/ARCHITECT.md's
    // base-amount resolution convention note).
    const amounts: Record<string, number> = {
      WAGE: Number(contract.wage),
      WORKED_DAYS: workedDays,
    };
    const lines: { ruleId: string; category: typeof rules[number]["category"]; name: string; amount: number }[] = [];

    for (const rule of rules) {
      let amount = 0;
      if (rule.computationMethod === "fixed") {
        amount = Number(rule.fixedAmount ?? 0);
      } else if (rule.computationMethod === "percentage") {
        const base = rule.baseField && amounts[rule.baseField] !== undefined ? amounts[rule.baseField] : amounts["BASIC"] ?? 0;
        amount = (Number(rule.percentage ?? 0) / 100) * base;
      } else {
        amount = evaluateFormula(rule.formula ?? "0", amounts);
      }
      amount = Math.round(amount * 100) / 100;
      amounts[rule.code] = amount;
      lines.push({ ruleId: rule.id, category: rule.category, name: rule.name, amount });
    }

    const basic = lines.filter((l) => l.category === "basic").reduce((s, l) => s + l.amount, 0);
    const allowances = lines.filter((l) => l.category === "allowance").reduce((s, l) => s + l.amount, 0);
    const deductions = lines.filter((l) => l.category === "deduction").reduce((s, l) => s + l.amount, 0);
    const gross = basic + allowances;
    const net = gross - deductions;

    await prisma.$transaction([
      prisma.payslipLine.deleteMany({ where: { payslipId: payslip.id } }),
      prisma.payslipLine.createMany({
        data: lines.map((l) => ({ payslipId: payslip.id, ruleId: l.ruleId, category: l.category, name: l.name, amount: l.amount })),
      }),
      prisma.payslip.update({
        where: { id: payslip.id },
        data: { workedDays, basic, allowances, deductions, gross, net, status: "computed" },
      }),
    ]);
  }

  return prisma.payrun.update({
    where: { id: payrunId },
    data: { status: "computed", computedBy: auth.userId },
    include: { payslips: true },
  });
}

// Maker-checker: the same user who computed cannot validate (mirrors the DB CHECK constraint
// Disha added — this gives a clear error instead of a raw DB constraint violation).
export async function validatePayrun(auth: AuthPayload, payrunId: string) {
  const payrun = await prisma.payrun.findUnique({ where: { id: payrunId } });
  if (!payrun) throw ApiError.notFound(`payrun: no payrun with id ${payrunId}`);
  if (payrun.status !== "computed") {
    throw ApiError.conflict(`payrun: cannot validate a payrun in status '${payrun.status}'`);
  }
  if (payrun.computedBy && payrun.computedBy === auth.userId) {
    throw ApiError.forbidden("payrun: the user who computed this payrun cannot also validate it");
  }

  return prisma.payrun.update({
    where: { id: payrunId },
    data: { status: "validated", validatedBy: auth.userId },
  });
}

// Bulk email delivery from the Payrun workflow, per docs/00_PROJECT_BRIEF.md section 3
// and the "Send Payslips" action on the Payrun processing screen. Employees without a
// linked User account (no email on file) are surfaced as skipped, not silently dropped —
// same "surface missing required information" principle as the payrun warnings.
export async function sendPayslipsForPayrun(payrunId: string) {
  const payrun = await prisma.payrun.findUnique({
    where: { id: payrunId },
    include: {
      payslips: {
        include: { employee: true, lines: true },
      },
    },
  });
  if (!payrun) throw ApiError.notFound(`payrun: no payrun with id ${payrunId}`);
  if (payrun.status === "draft") {
    throw ApiError.conflict("payrun: compute the payrun before sending payslips");
  }

  const sent: string[] = [];
  const skipped: string[] = [];

  for (const payslip of payrun.payslips) {
    const user = await prisma.user.findUnique({ where: { employeeId: payslip.employeeId } });
    if (!user?.email) {
      skipped.push(`${payslip.employee.name}: no email on file`);
      continue;
    }

    const pdf = await generatePayslipPdf({
      employeeName: payslip.employee.name,
      periodStart: payrun.periodStart,
      periodEnd: payrun.periodEnd,
      status: payslip.status,
      workedDays: Number(payslip.workedDays),
      basic: Number(payslip.basic),
      allowances: Number(payslip.allowances),
      deductions: Number(payslip.deductions),
      gross: Number(payslip.gross),
      net: Number(payslip.net),
      lines: payslip.lines.map((l) => ({ category: l.category, name: l.name, amount: Number(l.amount) })),
    });

    await sendMail({
      to: user.email,
      subject: `Your payslip for ${payrun.periodStart.toISOString().slice(0, 10)} to ${payrun.periodEnd.toISOString().slice(0, 10)}`,
      text: `Hi ${payslip.employee.name}, your payslip is attached. Net pay: ${payslip.net}.`,
      attachments: [
        { filename: `Payslip-${payslip.employee.name.replace(/[^a-zA-Z0-9]/g, '_')}-${payrun.periodStart.toISOString().slice(0, 7)}.pdf`, content: pdf, contentType: "application/pdf" },
      ],
    });
    sent.push(payslip.employee.name);
  }

  return { sent, skipped };
}

export async function markPayrunPaid(payrunId: string) {
  const payrun = await prisma.payrun.findUnique({ where: { id: payrunId } });
  if (!payrun) throw ApiError.notFound(`payrun: no payrun with id ${payrunId}`);
  if (payrun.status !== "validated") {
    throw ApiError.conflict(`payrun: cannot mark paid a payrun in status '${payrun.status}'`);
  }

  return prisma.$transaction([
    prisma.payslip.updateMany({ where: { payrunId }, data: { status: "paid" } }),
    prisma.payrun.update({ where: { id: payrunId }, data: { status: "paid" } }),
  ]);
}
