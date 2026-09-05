---
name: db-design-notes
description: Database-layer decisions on top of 01_DATABASE_SCHEMA.md — what was ported into the Prisma migration, and what was deliberately deferred, with the reasoning for each.
---

# PeoplePay360 — DB Design Notes

Companion to `01_DATABASE_SCHEMA.md` and `roles/DATABASE.md`. `backend/prisma/schema.prisma` is the
implemented source of truth for table/column shape; this file records constraint-level decisions that
don't fit cleanly into that file or the Prisma DSL.

## Ported into `backend/prisma/migrations/*/migration.sql`

Prisma's schema DSL can't express exclusion constraints, `WHERE`-partial indexes, or multi-column
`CHECK`s, so these are hand-written directly into the generated migration SQL (see the comment block
at the bottom of `20260905093941_init/migration.sql`):

- **Contract-overlap exclusion constraint** — `EXCLUDE USING gist` on `contracts(employee_id, daterange(start_date, COALESCE(end_date,'infinity'), '[]'))` where `status = 'active'`, backed by the `btree_gist` extension. Stronger than an app-level check: holds under concurrent inserts, not just single-request validation. Verified manually (overlapping insert rejected, adjacent non-overlapping insert accepted).
- **`contracts.end_date > start_date`** and **`attendance.check_out > check_in`** CHECKs — explicit requirements in `roles/DATABASE.md`, cheap and orthogonal to everything else, so added alongside the exclusion constraint.
- **`user_roles` one-active-grant-per-role** — partial unique index on `(user_id, role_id) WHERE effective_to IS NULL`. Plain `@@unique([userId, roleId])` would have blocked re-granting a role after a past grant expired; the partial index only blocks *simultaneous* active duplicates, which is the actual rule `user_roles.effective_from/effective_to` exists to support.
- **`payruns` maker-checker** — CHECK `computed_by IS NULL OR validated_by IS NULL OR computed_by <> validated_by`. The person who runs payroll compute cannot also validate it. Not in the original schema doc; added because the RBAC model already separates HRPU (compute) from HRPM (validate) and the DB should enforce that separation isn't bypassed by one HRPM-role user doing both steps.

## Deliberately deferred / not ported

- **`role_permissions(module, action, scope)` as live enforcement.** The tables exist as reference data (see `roles`, `permissions`, `role_permissions` in `schema.prisma`), but nothing reads them at request time yet. Actual RBAC enforcement is the 5 named roles via `requireRole(...)` in `backend/src/middleware/auth.ts`, which is what the problem statement actually requires. Wiring a permission-lookup service with scope-based row filtering is a bigger piece of work than the 24-hour clock supports right now — revisit post-demo if time allows, don't block on it.
- **Integer/BIGSERIAL primary keys.** Considered switching from UUID to BIGSERIAL for smaller indexes/faster joins, but every service, controller, and validation file in `backend/src/` already assumes string ids end-to-end. Changing the PK type now would touch every module for no gain that matters at hackathon scale. Staying on UUID.
- **`working_schedules.weekly_hours` / `attendance.worked_hours` as generated columns.** Both are meant to be computed, never manually entered (`roles/DATABASE.md` item 3). No working-schedule or attendance service exists yet to enforce this at write time — whoever builds that module needs to compute these server-side (or as a Postgres generated column) rather than trust client input. Flagging here so it isn't missed, not implementing it now since it's outside the DB layer's reach without that service existing.

## Verified

- Two active contracts for the same employee with overlapping ranges → rejected (`contracts_no_overlapping_active_ranges`).
- Two active contracts for the same employee with adjacent, non-overlapping ranges → accepted.
- `end_date <= start_date` → rejected (`contracts_end_after_start`).
