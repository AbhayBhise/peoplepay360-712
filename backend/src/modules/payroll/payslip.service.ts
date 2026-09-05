import { prisma } from "../../prisma";
import { ApiError } from "../../utils/ApiError";
import { AuthPayload, isHrmPlus } from "../../middleware/auth";
import { generatePayslipPdf } from "./payslipPdf";

export function listPayslips(auth: AuthPayload, filters: { payrunId?: string; employeeId?: string }) {
  const visibilityFilter = isHrmPlus(auth.roles)
    ? {}
    : { employeeId: auth.employeeId ?? "__no_self_employee__" };

  return prisma.payslip.findMany({
    where: {
      ...visibilityFilter,
      payrunId: filters.payrunId || undefined,
      employeeId: filters.employeeId || undefined,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPayslip(auth: AuthPayload, id: string) {
  const payslip = await prisma.payslip.findUnique({
    where: { id },
    include: { lines: { include: { rule: true } }, employee: true, payrun: true, contract: true },
  });
  if (!payslip) throw ApiError.notFound(`payslip: no payslip with id ${id}`);
  if (!isHrmPlus(auth.roles) && payslip.employeeId !== auth.employeeId) {
    throw ApiError.forbidden("you may only view your own payslips");
  }
  return payslip;
}

export async function getPayslipPdfBuffer(auth: AuthPayload, id: string): Promise<Buffer> {
  const payslip = await getPayslip(auth, id);
  return generatePayslipPdf({
    employeeName: payslip.employee.name,
    periodStart: payslip.payrun.periodStart,
    periodEnd: payslip.payrun.periodEnd,
    status: payslip.status,
    workedDays: Number(payslip.workedDays),
    basic: Number(payslip.basic),
    allowances: Number(payslip.allowances),
    deductions: Number(payslip.deductions),
    gross: Number(payslip.gross),
    net: Number(payslip.net),
    lines: payslip.lines.map((l) => ({ category: l.category, name: l.name, amount: Number(l.amount) })),
  });
}
