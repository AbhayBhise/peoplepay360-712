import { z } from "zod";
import { prisma } from "../../prisma";
import { ApiError } from "../../utils/ApiError";
import { AuthPayload } from "../../middleware/auth";
import { previewPayrunSchema, createPayrunSchema } from "./payrun.validation";
import { evaluateFormula } from "./formulaEvaluator";
import { generatePayslipPdf } from "./payslipPdf";
import { sendMail } from "../../utils/mailer";
import { emailQueue } from "../../queues/email.queue";
import { PaginationParams, paginatedResult } from "../../utils/pagination";

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
      startDate: { lte: periodEnd },
      OR: [{ endDate: null }, { endDate: { gte: periodStart } }],
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

export async function listPayruns(pagination?: PaginationParams) {
  const include = { _count: { select: { payslips: true } }, structure: true };
  const orderBy = { createdAt: "desc" as const };
  
  if (!pagination) {
    return prisma.payrun.findMany({ include, orderBy });
  }

  const [items, total] = await Promise.all([
    prisma.payrun.findMany({ include, orderBy, skip: pagination.skip, take: pagination.take }),
    prisma.payrun.count()
  ]);

  return paginatedResult(items, total, pagination);
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

    try {
      const periodStartStr = payrun.periodStart.toISOString().slice(0, 10);
      const periodEndStr = payrun.periodEnd.toISOString().slice(0, 10);
      
      const htmlTemplate = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4f46e5; margin: 0; font-size: 28px; font-weight: 800;">PeoplePay360</h1>
            <p style="color: #64748b; margin-top: 5px; font-size: 14px;">Your Trusted Payroll Partner</p>
          </div>
          <h2 style="color: #1e293b; margin-bottom: 20px; font-size: 22px;">Your Payslip is Ready! 🎉</h2>
          <p style="font-size: 16px; color: #334155; line-height: 1.6;">Hi <strong>${payslip.employee.name}</strong>,</p>
          <p style="font-size: 16px; color: #334155; line-height: 1.6;">
            Great news! Your payslip for the period of <strong style="color: #4f46e5;">${periodStartStr}</strong> to <strong style="color: #4f46e5;">${periodEndStr}</strong> is now available. We appreciate all the hard work and dedication you bring to the team every single day.
          </p>
          <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 20px; border-left: 4px solid #4f46e5; border-radius: 8px; margin: 25px 0;">
            <p style="font-size: 20px; margin: 0; color: #0f172a;"><strong>Net Pay:</strong> <span style="color: #10b981;">₹${payslip.net}</span></p>
          </div>
          <p style="font-size: 16px; color: #334155; line-height: 1.6;">
            We have securely attached your payslip document to this email. Please find the PDF attached for a detailed breakdown of your salary, including gross pay, allowances, and deductions.
          </p>
          <p style="font-size: 16px; color: #334155; line-height: 1.6;">
            Keep pushing boundaries and achieving greatness. We are proud to have you on board! 🚀
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 35px 0;" />
          <p style="font-size: 13px; color: #94a3b8; text-align: center;">
            Best regards,<br/>
            <strong style="color: #64748b;">PeoplePay360 Payroll Team</strong><br/>
            <br/>
            <em>This is an automated message, please do not reply directly.</em>
          </p>
        </div>
      `;

      await emailQueue.add("sendPayslipEmail", {
        to: user.email,
        subject: `Your PeoplePay360 Payslip (${periodStartStr} to ${periodEndStr})`,
        text: `Hi ${payslip.employee.name}, your payslip for ${periodStartStr} to ${periodEndStr} is attached. Net pay: ${payslip.net}.`,
        html: htmlTemplate,
        attachments: [
          { filename: `Payslip-${payslip.employee.name.replace(/[^a-zA-Z0-9]/g, '_')}-${payrun.periodStart.toISOString().slice(0, 7)}.pdf`, content: pdf, contentType: "application/pdf" },
        ],
      });

      sent.push(payslip.employee.name);
    } catch (err: any) {
      console.error(`Failed to queue payslip email for ${payslip.employee.name}:`, err);
      skipped.push(`${payslip.employee.name}: queueing failed (${err.message})`);
    }
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
