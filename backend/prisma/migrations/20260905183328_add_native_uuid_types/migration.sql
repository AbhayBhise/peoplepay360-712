/*
  Warnings:

  - The primary key for the `attendance` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `corrected_by` column on the `attendance` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `audit_log` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `user_id` column on the `audit_log` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `record_id` column on the `audit_log` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `contracts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `department_id` column on the `contracts` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `salary_structure_id` column on the `contracts` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `departments` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `parent_department_id` column on the `departments` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `head_employee_id` column on the `departments` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `employees` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `department_id` column on the `employees` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `manager_id` column on the `employees` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `working_schedule_id` column on the `employees` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `payruns` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `computed_by` column on the `payruns` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `validated_by` column on the `payruns` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `payslip_lines` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `payslips` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `contract_id` column on the `payslips` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `permissions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `role_permissions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `roles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `salary_rules` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `salary_structures` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `schedule_lines` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `time_off_allocations` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `time_off_requests` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `time_off_types` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `user_roles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `granted_by` column on the `user_roles` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `employee_id` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `working_schedules` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `id` on the `attendance` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `employee_id` on the `attendance` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `audit_log` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `contracts` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `employee_id` on the `contracts` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `departments` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `employees` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `payruns` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `structure_id` on the `payruns` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `payslip_lines` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `payslip_id` on the `payslip_lines` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `rule_id` on the `payslip_lines` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `payslips` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `payrun_id` on the `payslips` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `employee_id` on the `payslips` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `permissions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `role_permissions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `role_id` on the `role_permissions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `permission_id` on the `role_permissions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `roles` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `salary_rules` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `structure_id` on the `salary_rules` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `salary_structures` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `schedule_lines` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `schedule_id` on the `schedule_lines` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `time_off_allocations` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `employee_id` on the `time_off_allocations` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `type_id` on the `time_off_allocations` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `time_off_requests` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `employee_id` on the `time_off_requests` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `type_id` on the `time_off_requests` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `time_off_types` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `user_roles` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `user_id` on the `user_roles` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `role_id` on the `user_roles` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `working_schedules` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "attendance" DROP CONSTRAINT "attendance_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "audit_log" DROP CONSTRAINT "audit_log_user_id_fkey";

-- DropForeignKey
ALTER TABLE "contracts" DROP CONSTRAINT "contracts_department_id_fkey";

-- DropForeignKey
ALTER TABLE "contracts" DROP CONSTRAINT "contracts_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "contracts" DROP CONSTRAINT "contracts_salary_structure_id_fkey";

-- DropForeignKey
ALTER TABLE "departments" DROP CONSTRAINT "departments_head_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "departments" DROP CONSTRAINT "departments_parent_department_id_fkey";

-- DropForeignKey
ALTER TABLE "employees" DROP CONSTRAINT "employees_department_id_fkey";

-- DropForeignKey
ALTER TABLE "employees" DROP CONSTRAINT "employees_manager_id_fkey";

-- DropForeignKey
ALTER TABLE "employees" DROP CONSTRAINT "employees_working_schedule_id_fkey";

-- DropForeignKey
ALTER TABLE "payruns" DROP CONSTRAINT "payruns_computed_by_fkey";

-- DropForeignKey
ALTER TABLE "payruns" DROP CONSTRAINT "payruns_structure_id_fkey";

-- DropForeignKey
ALTER TABLE "payruns" DROP CONSTRAINT "payruns_validated_by_fkey";

-- DropForeignKey
ALTER TABLE "payslip_lines" DROP CONSTRAINT "payslip_lines_payslip_id_fkey";

-- DropForeignKey
ALTER TABLE "payslip_lines" DROP CONSTRAINT "payslip_lines_rule_id_fkey";

-- DropForeignKey
ALTER TABLE "payslips" DROP CONSTRAINT "payslips_contract_id_fkey";

-- DropForeignKey
ALTER TABLE "payslips" DROP CONSTRAINT "payslips_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "payslips" DROP CONSTRAINT "payslips_payrun_id_fkey";

-- DropForeignKey
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_permission_id_fkey";

-- DropForeignKey
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_role_id_fkey";

-- DropForeignKey
ALTER TABLE "salary_rules" DROP CONSTRAINT "salary_rules_structure_id_fkey";

-- DropForeignKey
ALTER TABLE "schedule_lines" DROP CONSTRAINT "schedule_lines_schedule_id_fkey";

-- DropForeignKey
ALTER TABLE "time_off_allocations" DROP CONSTRAINT "time_off_allocations_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "time_off_allocations" DROP CONSTRAINT "time_off_allocations_type_id_fkey";

-- DropForeignKey
ALTER TABLE "time_off_requests" DROP CONSTRAINT "time_off_requests_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "time_off_requests" DROP CONSTRAINT "time_off_requests_type_id_fkey";

-- DropForeignKey
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_role_id_fkey";

-- DropForeignKey
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_user_id_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_employee_id_fkey";

-- AlterTable
ALTER TABLE "attendance" DROP CONSTRAINT "attendance_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "employee_id",
ADD COLUMN     "employee_id" UUID NOT NULL,
DROP COLUMN "corrected_by",
ADD COLUMN     "corrected_by" UUID,
ADD CONSTRAINT "attendance_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "audit_log" DROP CONSTRAINT "audit_log_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "user_id",
ADD COLUMN     "user_id" UUID,
DROP COLUMN "record_id",
ADD COLUMN     "record_id" UUID,
ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "contracts" DROP CONSTRAINT "contracts_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "employee_id",
ADD COLUMN     "employee_id" UUID NOT NULL,
DROP COLUMN "department_id",
ADD COLUMN     "department_id" UUID,
DROP COLUMN "salary_structure_id",
ADD COLUMN     "salary_structure_id" UUID,
ADD CONSTRAINT "contracts_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "departments" DROP CONSTRAINT "departments_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "parent_department_id",
ADD COLUMN     "parent_department_id" UUID,
DROP COLUMN "head_employee_id",
ADD COLUMN     "head_employee_id" UUID,
ADD CONSTRAINT "departments_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "employees" DROP CONSTRAINT "employees_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "department_id",
ADD COLUMN     "department_id" UUID,
DROP COLUMN "manager_id",
ADD COLUMN     "manager_id" UUID,
DROP COLUMN "working_schedule_id",
ADD COLUMN     "working_schedule_id" UUID,
ADD CONSTRAINT "employees_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "payruns" DROP CONSTRAINT "payruns_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "structure_id",
ADD COLUMN     "structure_id" UUID NOT NULL,
DROP COLUMN "computed_by",
ADD COLUMN     "computed_by" UUID,
DROP COLUMN "validated_by",
ADD COLUMN     "validated_by" UUID,
ADD CONSTRAINT "payruns_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "payslip_lines" DROP CONSTRAINT "payslip_lines_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "payslip_id",
ADD COLUMN     "payslip_id" UUID NOT NULL,
DROP COLUMN "rule_id",
ADD COLUMN     "rule_id" UUID NOT NULL,
ADD CONSTRAINT "payslip_lines_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "payslips" DROP CONSTRAINT "payslips_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "payrun_id",
ADD COLUMN     "payrun_id" UUID NOT NULL,
DROP COLUMN "employee_id",
ADD COLUMN     "employee_id" UUID NOT NULL,
DROP COLUMN "contract_id",
ADD COLUMN     "contract_id" UUID,
ADD CONSTRAINT "payslips_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "permissions" DROP CONSTRAINT "permissions_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "permissions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "role_id",
ADD COLUMN     "role_id" UUID NOT NULL,
DROP COLUMN "permission_id",
ADD COLUMN     "permission_id" UUID NOT NULL,
ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "roles" DROP CONSTRAINT "roles_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "salary_rules" DROP CONSTRAINT "salary_rules_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "structure_id",
ADD COLUMN     "structure_id" UUID NOT NULL,
ADD CONSTRAINT "salary_rules_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "salary_structures" DROP CONSTRAINT "salary_structures_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "salary_structures_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "schedule_lines" DROP CONSTRAINT "schedule_lines_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "schedule_id",
ADD COLUMN     "schedule_id" UUID NOT NULL,
ADD CONSTRAINT "schedule_lines_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "time_off_allocations" DROP CONSTRAINT "time_off_allocations_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "employee_id",
ADD COLUMN     "employee_id" UUID NOT NULL,
DROP COLUMN "type_id",
ADD COLUMN     "type_id" UUID NOT NULL,
ADD CONSTRAINT "time_off_allocations_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "time_off_requests" DROP CONSTRAINT "time_off_requests_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "employee_id",
ADD COLUMN     "employee_id" UUID NOT NULL,
DROP COLUMN "type_id",
ADD COLUMN     "type_id" UUID NOT NULL,
ADD CONSTRAINT "time_off_requests_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "time_off_types" DROP CONSTRAINT "time_off_types_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "time_off_types_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "user_id",
ADD COLUMN     "user_id" UUID NOT NULL,
DROP COLUMN "role_id",
ADD COLUMN     "role_id" UUID NOT NULL,
DROP COLUMN "granted_by",
ADD COLUMN     "granted_by" UUID,
ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "users" DROP CONSTRAINT "users_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "employee_id",
ADD COLUMN     "employee_id" UUID,
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "working_schedules" DROP CONSTRAINT "working_schedules_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "working_schedules_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "attendance_employee_id_idx" ON "attendance"("employee_id");

-- CreateIndex
CREATE INDEX "contracts_employee_id_idx" ON "contracts"("employee_id");

-- CreateIndex
CREATE INDEX "contracts_department_id_idx" ON "contracts"("department_id");

-- CreateIndex
CREATE INDEX "contracts_salary_structure_id_idx" ON "contracts"("salary_structure_id");

-- CreateIndex
CREATE INDEX "departments_parent_department_id_idx" ON "departments"("parent_department_id");

-- CreateIndex
CREATE INDEX "employees_department_id_idx" ON "employees"("department_id");

-- CreateIndex
CREATE INDEX "employees_manager_id_idx" ON "employees"("manager_id");

-- CreateIndex
CREATE INDEX "payruns_structure_id_idx" ON "payruns"("structure_id");

-- CreateIndex
CREATE INDEX "payslips_payrun_id_idx" ON "payslips"("payrun_id");

-- CreateIndex
CREATE INDEX "payslips_employee_id_idx" ON "payslips"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "payslips_payrun_id_employee_id_key" ON "payslips"("payrun_id", "employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "salary_rules_structure_id_sequence_key" ON "salary_rules"("structure_id", "sequence");

-- CreateIndex
CREATE INDEX "time_off_allocations_employee_id_idx" ON "time_off_allocations"("employee_id");

-- CreateIndex
CREATE INDEX "time_off_requests_employee_id_idx" ON "time_off_requests"("employee_id");

-- CreateIndex
CREATE INDEX "user_roles_user_id_idx" ON "user_roles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_employee_id_key" ON "users"("employee_id");

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_parent_department_id_fkey" FOREIGN KEY ("parent_department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_head_employee_id_fkey" FOREIGN KEY ("head_employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_lines" ADD CONSTRAINT "schedule_lines_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "working_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_working_schedule_id_fkey" FOREIGN KEY ("working_schedule_id") REFERENCES "working_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_salary_structure_id_fkey" FOREIGN KEY ("salary_structure_id") REFERENCES "salary_structures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_off_allocations" ADD CONSTRAINT "time_off_allocations_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_off_allocations" ADD CONSTRAINT "time_off_allocations_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "time_off_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_off_requests" ADD CONSTRAINT "time_off_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_off_requests" ADD CONSTRAINT "time_off_requests_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "time_off_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_rules" ADD CONSTRAINT "salary_rules_structure_id_fkey" FOREIGN KEY ("structure_id") REFERENCES "salary_structures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payruns" ADD CONSTRAINT "payruns_structure_id_fkey" FOREIGN KEY ("structure_id") REFERENCES "salary_structures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payruns" ADD CONSTRAINT "payruns_computed_by_fkey" FOREIGN KEY ("computed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payruns" ADD CONSTRAINT "payruns_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_payrun_id_fkey" FOREIGN KEY ("payrun_id") REFERENCES "payruns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslip_lines" ADD CONSTRAINT "payslip_lines_payslip_id_fkey" FOREIGN KEY ("payslip_id") REFERENCES "payslips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslip_lines" ADD CONSTRAINT "payslip_lines_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "salary_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
