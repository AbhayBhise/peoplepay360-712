import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const employeeSelect = { employee: { select: { id: true, name: true } } };
    await prisma.attendance.findMany({ include: employeeSelect });
    console.log('success');
  } catch (e: any) {
    console.error(e.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
