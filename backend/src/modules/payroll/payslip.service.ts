import { prisma } from "../../prisma";
import { ApiError } from "../../utils/ApiError";
import { AuthPayload, isHrmPlus } from "../../middleware/auth";

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
