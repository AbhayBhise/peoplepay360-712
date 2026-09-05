---
name: database-schema
description: Written-out entity schema for PeoplePay360, transcribed from disha 1st draft db schema.png. Source of truth for table/column names.
---

# PeoplePay360 — Database Schema

Transcribed from `dev resources/disha 1st draft db schema.png`. Treat this as the agreed schema — if you need to change a column, update this file and tell the team, don't silently diverge.

## Access control

```
roles            (id PK, name, is_system_role)
permissions      (id PK, module, action)
role_permissions (role_id FK -> roles, permission_id FK -> permissions, scope)
users            (id PK, employee_id FK -> employees, email, password_hash, is_active)
user_roles       (id PK, user_id FK -> users, role_id FK -> roles, effective_from, effective_to, granted_by)
audit_log        (id PK, user_id FK -> users, module, action, record_id, before_value, after_value, created_at)
```

## HR core

```
departments        (id PK, name, parent_department_id FK -> departments, head_employee_id FK -> employees)
employees           (id PK, department_id FK -> departments, manager_id FK -> employees (self), name, job_position, status)
working_schedules   (id PK, name, type, weekly_hours [auto-computed, never manual])
schedule_lines      (id PK, schedule_id FK -> working_schedules, day, start_time, end_time, break)
contracts            (id PK, employee_id FK -> employees, department_id FK -> departments, position, wage,
                       salary_structure_id FK -> salary_structures, start_date, end_date, status)
attendance           (id PK, employee_id FK -> employees, check_in, check_out, worked_hours [computed], status)
```

## Time off

```
time_off_types       (id PK, name, unit [days|hours], requires_allocation [bool], payroll_integration)
time_off_allocations (id PK, employee_id FK -> employees, type_id FK -> time_off_types,
                        allocated, taken, remaining [computed], valid_from, valid_to, status)
time_off_requests    (id PK, employee_id FK -> employees, type_id FK -> time_off_types,
                        date_from, date_to, duration, status)
```

## Payroll

```
salary_structures (id PK, name, active)
salary_rules       (id PK, structure_id FK -> salary_structures, name, code, category, sequence, computation_method)
payruns            (id PK, structure_id FK -> salary_structures, period_start, period_end, status,
                      computed_by FK -> users, validated_by FK -> users)
payslips            (id PK, payrun_id FK -> payruns, employee_id FK -> employees, contract_id FK -> contracts,
                       basic, allowances, deductions, gross, net, status)
```

`payslips` should also carry a child `payslip_lines` table (one row per `salary_rule` execution: `rule_id`, `category`, `amount`) — the diagram shows aggregate columns on `payslips` but `database-design.md` and the payroll compute workflow both require per-rule line items, not just totals. **Add `payslip_lines (id PK, payslip_id FK, rule_id FK -> salary_rules, category, name, amount)` even though it isn't drawn on the ERD** — this is required by `compute-payslip.md` and by the "Salary Computation section details individual rule breakdowns" requirement in the problem statement.

## Relationships that matter (don't just wire FKs, enforce the rule)

- `contracts`: **no two active contracts for the same employee with overlapping date ranges.** Enforce with a DB constraint or a service-layer check before insert/update — this is called out explicitly as a required rule.
- `payruns.structure_id` determines which `salary_rules` run; `payslips.contract_id` must be the contract whose date range covers the payrun's period — resolve this at compute time, never just take "the employee's contract."
- `time_off_allocations.remaining` = `allocated - taken`, always computed, never stored as a manually-edited field.
- `time_off_requests` only deducts from `time_off_allocations` on **approval** (status → validated), never on creation, never on refusal.
- `working_schedules.weekly_hours` is derived by summing `schedule_lines` (end_time - start_time - break) — computed, not entered.
- `attendance.worked_hours` is derived from `check_out - check_in` — computed, not entered.
- `salary_rules.sequence` must be unique within a `structure_id` — reject duplicate sequence numbers within the same structure.
- `role_permissions.scope` and `user_roles.effective_from/effective_to` exist so role grants can be time-bound and scoped — use them rather than hardcoding role checks by name string everywhere.

## Column type discipline

- All dates/timestamps: proper DATE/TIMESTAMP columns, never VARCHAR.
- All money fields (`wage`, `basic`, `allowances`, `deductions`, `gross`, `net`, `amount`): DECIMAL/NUMERIC, never FLOAT (rounding errors compound across payslip lines).
- All FKs: real foreign key constraints, `ON DELETE` behavior considered explicitly (soft-delete via `status`/`is_active` for employees/users, not hard delete, since payroll history must survive).
- `status`/`state` columns: use a CHECK constraint or enum type restricting to the actual valid values (e.g., payrun status: `draft|computed|validated|paid`), not a free-text string.
