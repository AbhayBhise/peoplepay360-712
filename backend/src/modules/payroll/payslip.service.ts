import { prisma } from "../../prisma";
import { ApiError } from "../../utils/ApiError";
import { AuthPayload, isHrmPlus } from "../../middleware/auth";
import { generatePayslipPdf } from "./payslipPdf";

// Named consistently, reused by both listPayslips and getPayslip so the list view and
// detail view can never drift into showing different data for the same fields again —
// the earlier bug was listPayslips including no relations at all (Employee/Structure
// name never sent, not just mismapped) while getPayslip included relations but not deep
// enough to reach the structure's actual name.
const payslipInclude = {
  employee: true,
  payrun: { include: { structure: true } },
  contract: { include: { salaryStructure: true } },
} as const;

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
    include: payslipInclude,
  });
}

export async function getPayslip(auth: AuthPayload, id: string) {
  const payslip = await prisma.payslip.findUnique({
    where: { id },
    include: { ...payslipInclude, lines: { include: { rule: true } } },
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
