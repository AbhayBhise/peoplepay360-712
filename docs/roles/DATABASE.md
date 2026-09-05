---
name: role-database
description: Database engineer role file for PeoplePay360 — schema, migrations, constraints, seed data.
---

# Role: Database Engineer

Read `docs/00_PROJECT_BRIEF.md` and `docs/01_DATABASE_SCHEMA.md` first — that file is your schema, implement it as-is unless you flag a change to the Architect.

> **Status update:** the backend already exists on `feat/backend-employee-crud` (Node/Express/TypeScript), and it already has a working, typechecked Prisma implementation of this schema at `backend/prisma/schema.prisma` — UUID primary keys, `payslip_lines` added, the salary-rule unique-sequence constraint, decimal money types. **`backend/prisma/schema.prisma` is now the canonical live schema, not this markdown file.** Your job is not to write a competing schema — it's to review that file against this doc, harden it with a real migration + raw-SQL constraints Prisma can't express natively, and expand the seed data. If you already drafted a standalone `.sql` schema before reading this: don't apply it directly — treat it as a design-notes document and cherry-pick the specific improvements listed below into the existing Prisma schema instead. Save your original draft under `dev resources/` or a new `docs/03_DB_DESIGN_NOTES.md` so the good ideas in it aren't lost, but the running code stays on one schema.
>
> **Specific upgrades to pull from a from-scratch SQL draft into `backend/prisma/schema.prisma`, if you wrote one:**
> - The contract-overlap **exclusion constraint** (`EXCLUDE USING gist` with `btree_gist`) is strictly better than the app-level check currently in `employee`/contract services — add it via a raw-SQL block in the Prisma migration (Prisma migrations can carry hand-written SQL alongside the generated DDL).
> - A partial **unique index** preventing the same user holding the same role twice while both are active (`user_roles`) — worth adding.
> - The **maker-checker check** on `payruns` (`computed_by <> validated_by`) is a nice touch — add it.
> - `attendance.corrected_by`, `audit_log.ip_address` — fine additions, add the columns to the Prisma schema.
> - **Do not** switch primary keys from UUID to `BIGSERIAL`/integer — the backend code, validation, and API contracts are already written and tested against string/UUID ids; changing the PK type now ripples into every existing file for no functional benefit with a 24-hour clock running.
> - **Do not** implement the fine-grained `role_permissions(module, action, scope)` permission-resolution engine as the live enforcement mechanism. It's a reasonable design, but it requires a permission-lookup service and scope-based row filtering (`own`/`department`/`all`) that doesn't exist yet, and the problem statement's actual RBAC requirement is fully satisfied by the 5 named roles already enforced in `backend/src/middleware/auth.ts` (`requireRole(...)`). Keep `roles`/`permissions`/`role_permissions` tables as reference data (useful later for an Admin "what can this role do" screen) but don't block current modules on wiring real enforcement through them.
> - Raw SQL is fine **inside a Prisma migration file** for things Prisma can't express (exclusion constraints, generated columns) — that's consistent with the security rule (no hand-written string-formatted queries at the *application* layer), migrations aren't the same risk surface.

## Mission

PostgreSQL schema that makes bad data **impossible to insert**, not just discouraged. Judges specifically evaluate database design — constraints belong in the schema, not only in application code.

## Responsibilities

1. **Implement every table in `01_DATABASE_SCHEMA.md`** with real types: DATE/TIMESTAMP for dates, DECIMAL/NUMERIC for money, proper FK constraints everywhere a `_id` appears.
2. **Add the constraints the schema doc calls out explicitly**:
   - No overlapping active contracts per employee — implement via an exclusion constraint (`EXCLUDE USING gist`) or an enforced trigger/service check plus a UNIQUE partial index on `(employee_id) WHERE status='active'` if only one active contract is allowed at a time.
   - `salary_rules`: UNIQUE `(structure_id, sequence)`.
   - `payslips`/`payruns`: CHECK constraint on `status` restricting to the valid state list (`draft|computed|validated|paid`), never a free-text column.
   - `contracts`: CHECK `end_date IS NULL OR end_date > start_date`.
   - `attendance`: CHECK `check_out IS NULL OR check_out > check_in`.
3. **Never store derivable values as free columns without a computation path.** `working_schedules.weekly_hours`, `attendance.worked_hours`, `time_off_allocations.remaining` must be computed (generated column, view, or always recalculated in the service layer that writes them) — don't let another dev's form let a user type these in directly.
4. **Add `payslip_lines`** (not on the original ERD, required by the compute workflow — see `01_DATABASE_SCHEMA.md` for exact columns) so salary rule breakdowns are stored per-line, not just as aggregate totals on `payslips`.
5. **Write migrations, not one big schema dump** — one migration per logical table group (access control, HR core, time off, payroll), so the team can apply incrementally and roll back cleanly if a hackathon-hour mistake happens.
6. **Seed realistic demo data**: enough departments/employees/contracts/attendance/leave/payroll history that the dashboard charts and the 2 demo scenarios have real numbers to show — an empty or single-row database makes the whole platform look fake in the live demo.
7. **Indexes**: FK columns used in frequent filters (`employees.department_id`, `attendance.employee_id`, `payslips.payrun_id`, `payslips.employee_id`) should be indexed — the dashboard aggregates across all of these.

## Must-enforce guardrails

- PostgreSQL only, real relational schema — no Firebase/Supabase/Mongo/BaaS, no static JSON as the final store.
- Every table has a real primary key and a meaningful name (already satisfied by the schema doc — don't rename casually).
- UNIQUE/CHECK constraints live in the database, not only in app code.
- Parameterized queries / ORM only, anywhere raw SQL is used — no string-formatted SQL, ever (SQL injection).
- Normalize — no duplicate columns, no storing what can be derived.

## Deliverables checklist

- [ ] All tables from `01_DATABASE_SCHEMA.md` created with correct types
- [ ] Contract-overlap constraint verified with a manual test (insert two overlapping active contracts, confirm rejection)
- [ ] `salary_rules` unique-sequence constraint verified
- [ ] `payslip_lines` table added and wired to the compute flow
- [ ] Seed script producing realistic multi-department, multi-employee, multi-period data
- [ ] Migrations checked into git in small, reviewable commits per `git-workflow.md`
