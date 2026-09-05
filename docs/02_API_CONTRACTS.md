---
name: api-contracts
description: Endpoint-by-endpoint API contract for PeoplePay360 — method, URL, request/response shape, required role, key rules. Backend implements against this; frontend calls against this. Don't diverge without updating this file.
---

# PeoplePay360 — API Contracts

Companion to `01_DATABASE_SCHEMA.md`. Field names here match table columns 1:1 unless noted. All endpoints are under `/api`. All responses use the shared envelope:

```
success: { "success": true, "data": ... }
error:   { "success": false, "error": "field: reason" }
```

Roles referenced below: **Employee (E)**, **HR Manager (HRM)**, **HR Payroll User (HRPU)**, **HR Payroll Manager (HRPM)**, **Admin (A)**. "HRM+" means HRM and everything above it in the RBAC matrix (HRM, HRPU, HRPM, A) per `00_PROJECT_BRIEF.md`.

Every endpoint marked with a role requirement must reject at the **route/middleware layer**, not rely on the frontend hiding a button — see `roles/ARCHITECT.md` on the 4-layer RBAC pipeline.

---

## 0. Auth

### `POST /api/auth/login`
- Body: `{ email, password }`
- Response: `{ user: { id, employee_id, email, roles: [...] }, token }`
- No role required. Rate-limit or at least don't leak whether email vs password was wrong.

### `POST /api/auth/logout`
- Any authenticated user. Invalidate token/session.

### `GET /api/auth/me`
- Any authenticated user. Returns current user + resolved roles + permissions (used by frontend to drive Navigation-layer RBAC).

---

## 1. Departments

### `GET /api/departments`
- Role: any authenticated user (read-only for E).
- Query: `?parent_id=`
- Response: list of `{ id, name, parent_department_id, head_employee_id }`

### `POST /api/departments` · `PUT /api/departments/:id` · `DELETE /api/departments/:id`
- Role: HRM+
- Body: `{ name, parent_department_id?, head_employee_id? }`
- Validation: `name` required; `parent_department_id` cannot equal `id` (no self-parenting).

---

## 2. Employees

### `GET /api/employees`
- Role: HRM+ sees all; E sees only `self` (server filters by `employees.id == current_user.employee_id` — this is the **Data layer** of RBAC, not a frontend filter).
- Query: `?department_id=&status=&search=`
- Response: list with `id, name, department_id, manager_id, job_position, status, working_schedule_id`

### `GET /api/employees/:id`
- Role: HRM+ any employee; E only if `:id == self`.
- Response: full employee record + counts for smart buttons: `{ contracts_count, attendance_count, time_off_count, payslips_count }`

### `POST /api/employees` · `PUT /api/employees/:id`
- Role: HRM+
- Body: `{ name, department_id, manager_id?, job_position, status, working_schedule_id }`
- Validation: `department_id` must exist; `manager_id` must be a different employee (no self-management); `status` restricted to `active|inactive`.

### `DELETE /api/employees/:id`
- Role: A only. Soft-delete (`status = 'inactive'`) — never hard-delete, payroll/attendance history must survive.

### `GET /api/employees/:id/contracts` · `/attendance` · `/time-off` · `/payslips`
- Role: same visibility rule as `GET /api/employees/:id`. These back the Employee Form smart buttons — filtered list views, not separate data models.

---

## 3. Contracts

### `GET /api/contracts`
- Role: HRM+ (all); E (self only, read-only).
- Query: `?employee_id=&status=`
- Response includes `is_active_for_today` computed flag so the frontend can highlight the active contract without recomputing client-side.

### `POST /api/contracts` · `PUT /api/contracts/:id`
- Role: HRM+
- Body: `{ employee_id, department_id, position, wage, salary_structure_id, start_date, end_date?, status }`
- **Validation (reject with 409/422, not a 500):**
  - `end_date` null or `end_date > start_date`.
  - No existing **active** contract for the same `employee_id` with an overlapping `[start_date, end_date]` range. Error: `"contract: overlaps with active contract #<id> (<start_date> – <end_date>)"`.
- Write access is HRM+ (HR Manager, HR Payroll User, HR Payroll Manager, Admin) — the problem statement's role table says HR Payroll User/Manager get "all HR Manager permissions plus" payroll extras, i.e. they inherit full Contract CRUD, they aren't restricted to read-only here. **Resolved & implemented** — see `backend/src/modules/contracts/`.

### `DELETE /api/contracts/:id`
- Role: A only, and only if the contract has never been referenced by a computed payslip (payroll history integrity).

---

## 4. Working Schedules

### `GET /api/working-schedules` · `GET /api/working-schedules/:id`
- Role: HRM+ read; E read (to see own assigned schedule via employee record).
- Response includes `weekly_hours` (**server-computed** from `schedule_lines`, never trust a client-sent value even if present in the body).

### `POST /api/working-schedules` · `PUT /api/working-schedules/:id`
- Role: HRM+
- Body: `{ name, type, lines: [{ day, start_time, end_time, break }] }`
- Validation: for each line, `end_time > start_time`; `weekly_hours` is computed server-side from `lines` and returned, any `weekly_hours` field in the request body is ignored.

---

## 5. Attendance

### `GET /api/attendance`
- Role: HRM+ (all); E (self only).
- Query: `?employee_id=&date_from=&date_to=&status=`
- Response includes an `exception` flag (`missing_checkout|late|none`) so frontend can flag it without recomputing.

### `POST /api/attendance/check-in`
- Role: E (self) or HRM+ (on behalf of an employee, for corrections/backfill).
- Body: `{ employee_id, check_in }`

### `POST /api/attendance/:id/check-out`
- Role: E (self) or HRM+.
- Body: `{ check_out }`
- Validation: `check_out > check_in`; `check_out` not in the future. `worked_hours` is computed server-side on save (`check_out - check_in`), never accepted from the client.

### `PUT /api/attendance/:id` (correction)
- Role: HRM+ only. Plain employees cannot edit past attendance, only create today's check-in/out.
- Recomputes `worked_hours` server-side after any edit.

---

## 6. Time Off

### `GET /api/time-off/types` · `POST` · `PUT /:id`
- Role: read = any authenticated; write = HRM+
- Body: `{ name, unit: 'days'|'hours', requires_allocation: bool, payroll_integration }`

### `GET /api/time-off/allocations`
- Role: HRM+ (all); E (self only).
- Query: `?employee_id=&type_id=&status=`
- Response includes computed `remaining = allocated - taken`.

### `POST /api/time-off/allocations`
- Role: HRM+
- Body: `{ employee_id, type_id, allocated, valid_from, valid_to }` → created with `status='draft'`.

### `POST /api/time-off/allocations/:id/approve`
- Role: HRM+
- Effect: `status → 'validate'`. Only after this does the balance become usable by a request.

### `GET /api/time-off/requests`
- Role: HRM+ (all); E (self only, plus creation).
- Query: `?employee_id=&status=`

### `POST /api/time-off/requests`
- Role: E (self) or HRM+ (on behalf of).
- Body: `{ employee_id, type_id, date_from, date_to }`
- Server computes `duration` (excluding weekends via the employee's working schedule).
- **Validation:** if `type.requires_allocation`, look up the employee's validated allocation for that type; if `duration > remaining`, reject with `"time_off: insufficient balance, remaining X days"`. If `requires_allocation = false`, skip the balance check entirely.
- Created with `status='draft'`.

### `POST /api/time-off/requests/:id/approve` · `POST /api/time-off/requests/:id/refuse`
- Role: HRM+ (this is the "Time Off approval" permission — explicitly **not** granted to plain HRPU/HRPM beyond what HRM already has, per the role table; approval is an HR function, not a payroll function).
- Approve effect: `status → 'validate'`, then **atomically** deduct `duration` from the allocation's `taken` (same transaction — see `roles/ARCHITECT.md` on transaction boundary).
- Refuse effect: `status → 'refused'`, **no** balance change.

---

## 7. Salary Structures & Rules

### `GET /api/salary-structures` · `GET /:id`
- Role: HRPU (read-only) / HRPM+ (full). Response includes rule count and linked employee/contract count for the list view.

### `POST /api/salary-structures` · `PUT /:id`
- Role: HRPM+ only (HRPU is explicitly read-only on this resource per the role table).
- Body: `{ name, active }`

### `GET /api/salary-structures/:id/rules`
- Role: HRPU read / HRPM+ full. Ordered by `sequence` ascending — this order is load-bearing, don't let the API return unordered results.

### `POST /api/salary-rules` · `PUT /api/salary-rules/:id`
- Role: HRPM+ only.
- Body: `{ structure_id, name, code, category, sequence, computation_method: 'fixed'|'percentage'|'formula', fixed_amount?, percentage?, base_field?, formula? }`
- Validation: `computation_method` restricted to the three allowed values; `sequence` unique within `structure_id` (409 on conflict, name the clashing rule).

---

## 8. Payrun (2-step wizard, server enforces the steps too)

### `POST /api/payruns/preview` (Step 1 — no record created)
- Role: HRPU+
- Body: `{ structure_id, period_start, period_end }`
- Validation: `period_start < period_end`.
- Response: list of **eligible employees** — those with an active contract covering the full period **and** `contract.salary_structure_id == structure_id`. This response is what backs Step 2 of the wizard; nothing is persisted yet.

### `POST /api/payruns` (Step 2 — actually creates the batch)
- Role: HRPU+
- Body: `{ structure_id, period_start, period_end, employee_ids: [...] }` (must be a non-empty, explicit subset of the Step 1 preview — never "select all" implied by omission)
- Effect: creates `payruns` row (`status='draft'`) + one `payslips` row per selected employee (`status='draft'`).

### `GET /api/payruns` · `GET /api/payruns/:id`
- Role: HRPU+ (read); response includes `status`, summary payslip list, and a `warnings` array (see below).

### `POST /api/payruns/:id/compute`
- Role: HRPU+
- Effect: for each payslip in the run — resolve the period-applicable active contract (error per-employee if none/duplicate, don't fail the whole batch silently); pull worked days from attendance + schedule; run `salary_rules` for the structure in `sequence` order; write one `payslip_lines` row per rule; set `payslips.basic/allowances/deductions/gross/net`; set `payslips.status='computed'`. Sets `payruns.status='computed'`, `computed_by=current_user`.
- Response includes a `warnings` array: missing bank details, duplicate payslip for employee+period, no attendance data found, no active contract found.

### `POST /api/payruns/:id/validate`
- Role: HRPM+ (validation is a step up from HRPU's create/update per the role table — confirm against `00_PROJECT_BRIEF.md`; if the team decides HRPU may also validate, document that decision in `roles/ARCHITECT.md` rather than silently diverging).
- Precondition: `payruns.status == 'computed'`; reject with a clear error otherwise (no skipping states).
- Effect: `status → 'validated'`, `validated_by = current_user`.

### `POST /api/payruns/:id/mark-paid`
- Role: HRPM+
- Precondition: `status == 'validated'`.
- Effect: `status → 'paid'`. Once paid, the payrun and its payslips are read-only (no further edits via any endpoint — enforce this at the service layer for every mutating payslip/payrun route, not just this one).

### `POST /api/payruns/:id/send-payslips`
- Role: HRPU+
- Effect: generates PDF per payslip in the run and emails them (bulk). Only sensible once `status` is `validated` or `paid`.

---

## 9. Payslips

### `GET /api/payslips` · `GET /api/payslips/:id`
- Role: HRPU+ (all); E (self only).
- Response: `{ employee_id, structure_id, payrun_id, period_start, period_end, status, worked_days, basic, allowances, deductions, gross, net, lines: [{ rule_id, category, name, amount }] }` — `lines` is the structured breakdown the Payslip screen renders as Category | Rule Name | Amount.

### `GET /api/payslips/:id/pdf`
- Role: same as GET above. Streams a PDF containing employee name, period, company name, and the itemized `lines` table — never a blank/placeholder template.

---

## 10. Dashboard

### `GET /api/dashboard/summary`
- Role: HRM+ (Payroll-related KPI cards restricted to HRPU+; HRM sees HR-only KPIs — split the response or split the endpoint, document whichever you pick here).
- Query: `?period_start=&period_end=&department_id=&employee_type=`
- Response: live-aggregated KPIs — `total_net_paid, payslips_generated, average_salary, approved_time_off_count, attendance_health_pct` — computed via real SUM/AVG/COUNT queries against the filters, never a cached snapshot.

### `GET /api/dashboard/salary-by-department`
- Same filters. Response: `[{ department_id, department_name, headcount, total_salary }]`.

### `GET /api/dashboard/net-salary-trend`
- Same filters, response bucketed by month: `[{ month, net_total }]`.

### `GET /api/dashboard/attendance-overview`
- Response: `{ present, late, absent, overtime, missing_checkouts, manual_edits, coverage_pct }` for the filtered period.

### `GET /api/dashboard/alerts`
- Response: operational alerts array — payrun statuses needing attention, missing employee bank details, duplicate payslips, contracts expiring/needing renewal in the filtered period.

---

## Decisions (resolved during implementation)

- **Payrun `validate`/`mark-paid` role split**: HRPU+ can create/compute/read payruns; **HRPM+ only** can validate and mark-paid — this pairs with the maker-checker DB constraint (a payrun's `computedBy` and `validatedBy` must differ), giving a real two-person-integrity workflow rather than one role doing everything. Implemented in `backend/src/modules/payroll/payroll.routes.ts` and enforced again in `payrun.service.ts` (clear error if the same user tries both steps).
- **Dashboard endpoint shape**: one shared set of `/api/dashboard/*` endpoints for all HRM+ roles, no field-splitting between HR-only vs payroll-inclusive KPIs. Implemented in `backend/src/modules/dashboard/`.
- **`employee_type` dashboard filter**: accepted as a query param for forward compatibility but currently a no-op — no `employmentType`/similar field exists on `Employee`/`Contract` yet. Add a migration for it if this filter needs to be real before the demo; flagged in `dashboard.service.ts`.
