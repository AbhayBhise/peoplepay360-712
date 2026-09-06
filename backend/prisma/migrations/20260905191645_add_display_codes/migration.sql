/*
  Warnings:

  - A unique constraint covering the columns `[employee_code]` on the table `employees` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[payslip_number]` on the table `payslips` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "employee_code" TEXT;

-- AlterTable
ALTER TABLE "payslips" ADD COLUMN     "payslip_number" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "employees_employee_code_key" ON "employees"("employee_code");

-- CreateIndex
CREATE UNIQUE INDEX "payslips_payslip_number_key" ON "payslips"("payslip_number");
