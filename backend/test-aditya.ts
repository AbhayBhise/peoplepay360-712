const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const emp = await prisma.employee.findFirst({
    where: { name: { contains: 'Aditya Joshi' } },
    include: { contracts: true, attendance: true }
  });
  console.log(JSON.stringify(emp, null, 2));
}
main().finally(() => prisma.$disconnect());
