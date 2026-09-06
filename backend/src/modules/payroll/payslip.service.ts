import { prisma } from "../../prisma";
import { ApiError } from "../../utils/ApiError";
import { AuthPayload, isHrmPlus } from "../../middleware/auth";
import { generatePayslipPdf } from "./payslipPdf";
import { PaginationParams, paginatedResult } from "../../utils/pagination";

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

// Pagination is opt-in — see employee.service.ts for the same pattern and why.
export async function listPayslips(
  auth: AuthPayload,
  filters: { payrunId?: string; employeeId?: string },
  pagination?: PaginationParams
) {
  const visibilityFilter = isHrmPlus(auth.roles)
    ? {}
    : { employeeId: auth.employeeId ?? "__no_self_employee__" };

  const where = {
    ...visibilityFilter,
    payrunId: filters.payrunId || undefined,
    employeeId: filters.employeeId || undefined,
  };

  if (!pagination) {
    return prisma.payslip.findMany({ where, orderBy: { createdAt: "desc" }, include: payslipInclude });
  }

  const [rows, total] = await Promise.all([
    prisma.payslip.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
      include: payslipInclude,
    }),
    prisma.payslip.count({ where }),
  ]);
  return paginatedResult(rows, total, pagination);
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
    employeeCode: payslip.employee.employeeCode,
    payslipNumber: payslip.payslipNumber,
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
