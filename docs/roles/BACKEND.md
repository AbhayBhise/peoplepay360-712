---
name: role-backend
description: Backend engineer role file for PeoplePay360 — API implementation, business logic, payroll engine.
---

# Role: Backend Engineer

Read `docs/00_PROJECT_BRIEF.md` and `docs/01_DATABASE_SCHEMA.md` first. If `docs/02_API_CONTRACTS.md` exists (Architect-produced), implement against it exactly — don't invent your own request/response shapes.

## Mission

Every business rule in the problem statement lives in application logic here, not hardcoded, not skipped. This is the module judges will interrogate hardest.

## Module ownership

- **Auth & RBAC middleware**: JWT/session auth, role resolution, and the route/action/data enforcement layers (Navigation is frontend's job, the other 3 are yours). Every protected route checks role before touching data.
- **Employee / Department / Contract**: CRUD + the contract-overlap rule (reject a new active contract that overlaps an existing active one for the same employee — return a clear error naming the conflicting contract).
- **Working Schedule**: CRUD for schedule + schedule_lines; `weekly_hours` computed server-side from lines, never accepted as input.
- **Attendance**: check-in/out endpoints; `worked_hours` computed from `check_out - check_in`; corrections restricted to authorized roles (HR Manager+).
- **Time Off**: Types → Allocations → Requests lifecycle. Follow `.agents/agents_updated/workflows/manage-leave.md` exactly:
  - Allocation must be approved (`state='validate'`) before its balance is usable.
  - Request duration excludes weekends via the employee's working schedule.
  - Reject a request where `requested_days > remaining` — error message must state the remaining balance.
  - Balance deducts only on approval, never on request creation, never restored on refusal (since refusal never deducted).
- **Salary Structures & Rules**: CRUD; enforce unique `sequence` per structure; support `fixed`, `percentage`, `formula` computation types only — reject anything else.
- **Payroll engine (Payrun + Payslip compute)**: follow `.agents/agents_updated/workflows/create-payrun.md` and `compute-payslip.md` precisely:
  1. Payrun creation is a 2-step wizard server-side too — don't let the API create a Payrun before employees are explicitly selected.
  2. Only include employees with an active contract covering the payrun period.
  3. Resolve **the** active contract for that employee for that period — error clearly if none or if duplicates are found.
  4. Run salary rules in `sequence` order; support fixed/percentage/formula; formula evaluation must use a restricted context (no arbitrary `eval` of unsanitized input — see Security note below).
  5. Store one `payslip_lines` row per rule result — never collapse to a single total.
  6. Gross = sum(basic + allowance lines); Net = Gross − sum(deduction lines).
  7. Surface warnings (missing bank details, duplicate payslip, no attendance data) before allowing Validate.
  8. State machine: `draft → computed → validated → paid`, never skip a state, never allow edits to a `paid` payrun.
- **Payslip PDF + bulk email**: PDF must include employee name, period, company name, itemized breakdown (not a blank template); bulk send triggered from the parent Payrun.
- **Dashboard aggregation endpoints**: real aggregate queries (SUM/AVG/GROUP BY) over live tables, filterable by period/department/employee type — never a cached or precomputed static payload.

## Validation you must implement (backend-level, not just frontend)

From `input-validation.md`, PeoplePay360-specific:
- Contract: `end_date > start_date`; overlapping active contract → reject.
- Attendance: `check_out > check_in`; check_out not in the future.
- Payrun: `date_start < date_end`.
- Payslip: block compute if no active contract for the period — clear error naming the employee.
- Leave request: cannot exceed remaining balance — error states the remaining balance.
- Salary rule: unique sequence within structure; `amount_type` restricted to `fixed|percentage|formula`.
- Working schedule: `end_time > start_time` per line.
- Structured error responses everywhere: `{"success": false, "error": "field: reason"}` — never a bare 500 or a generic "something went wrong."

## Security (non-negotiable)

- Hash passwords (bcrypt), never store plaintext.
- Every protected route behind auth + role middleware — no route is "secure because the frontend hides it."
- Parameterized queries / ORM only.
- Formula evaluation for salary rules: use a restricted evaluation context (explicit allowed names/operators), not raw `eval()` on unrestricted input — this is a real code-injection surface since formulas may be user-configured.
- Secrets in `.env`, never in source.

## Deliverables checklist

- [ ] Every endpoint matches `docs/02_API_CONTRACTS.md` (or is added to it if the Architect hasn't covered it yet)
- [ ] Contract-overlap, sequence-uniqueness, and balance-check validations verified with a failing-case test each
- [ ] Payroll compute produces per-rule `payslip_lines`, not just totals
- [ ] Payrun state machine cannot be skipped or reversed via direct API calls
- [ ] All routes checked against the RBAC matrix in `00_PROJECT_BRIEF.md`
- [ ] Ran `.agents/agents_updated/workflows/review-code.md` checklist against payroll compute and auth middleware before calling them done
