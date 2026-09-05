---
name: role-frontend
description: Frontend engineer role file for PeoplePay360 — navigation, forms, Payrun wizard, dashboard UI.
---

# Role: Frontend Engineer

Read `docs/00_PROJECT_BRIEF.md` first. Every screen below maps directly to a section of the original problem statement (`dev resources/PeoplePay360 HR & Payroll.pdf`) — don't simplify away the specific interaction patterns it calls out, judges compare against it.

## Roles & permissions — ground truth for Navigation-layer RBAC

`00_PROJECT_BRIEF.md` section 2 gives the plain-English RBAC matrix. This section is the verified, mechanical version — pulled directly from every `*.routes.ts` file's actual `requireRole(...)` calls (not from the docs, which can drift out of sync with the code). If this table and the brief ever disagree, trust this one and flag the brief for an update.

**How to gate the UI:** `POST /api/auth/login` and `GET /api/auth/me` return `roles: string[]` — an array of role *names* (e.g. `["HR_MANAGER"]`), pulled from `user_roles → roles.name`. That array is the only thing to gate on.

Do **not** build UI logic against the `roles`/`permissions`/`role_permissions` tables in `backend/prisma/schema.prisma`. They exist in the schema as a generic `(module, action, scope)` permission engine, but nothing in the backend reads them — not login, not any route. They're reference data for a future fine-grained system, deliberately not wired up yet (see `docs/03_DB_DESIGN_NOTES.md`, "Deliberately deferred"). If any part of the current frontend queries or assumes those tables drive access, that's the source of drift — replace it with the flat role-array check below.

Roles stack upward — checking "is one of my roles in this set" is the actual backend pattern, mirror it in the frontend rather than special-casing each role name:
- `HRM_PLUS` = `HR_MANAGER`, `HR_PAYROLL_USER`, `HR_PAYROLL_MANAGER`, `ADMIN`
- `HRPU_PLUS` = `HR_PAYROLL_USER`, `HR_PAYROLL_MANAGER`, `ADMIN`
- `HRPM_PLUS` = `HR_PAYROLL_MANAGER`, `ADMIN`

| Module | Employee (E) | HR Manager (HRM) | HR Payroll User (HRPU) | HR Payroll Manager (HRPM) | Admin (A) |
|---|---|---|---|---|---|
| Departments | view | view + create/edit/delete | (inherits HRM) | (inherits HRM) | full |
| Employees | view **self only** | view all + create/edit | (inherits HRM) | (inherits HRM) | full + **delete** |
| Contracts | view **self only** | view all + create/edit | (inherits HRM) | (inherits HRM) | full + **delete** |
| Working Schedules | view | view + create/edit/delete | (inherits HRM) | (inherits HRM) | full |
| Attendance | view/check-in-out **self** | view all + **correct past records** | (inherits HRM) | (inherits HRM) | full |
| Time Off Types | view | view + create/edit | (inherits HRM) | (inherits HRM) | full |
| Time Off Allocations | — | create + **approve** | (inherits HRM) | (inherits HRM) | full |
| Time Off Requests | create + view self | view all + **approve/refuse** | (inherits HRM) | (inherits HRM) | full |
| Salary Structures/Rules | — | — | **read-only** | full CRUD | full |
| Payrun (preview/create/read/compute/send) | — | — | full | (inherits HRPU) | full |
| Payrun validate / mark-paid | — | — | ✗ | ✓ **only** | full |
| Payslips | view **self only** | — | view all | (inherits HRPU) | full |
| Dashboard (all 5 endpoints) | — | ✓ | (inherits HRM) | (inherits HRM) | full |

Two mechanics that don't show up as a simple role check, so the UI has to know them explicitly:
- **"self only" rows are not route-level restrictions.** The route itself has no role requirement — an Employee can legally call `GET /api/employees`, `GET /api/contracts`, `GET /api/attendance`, `GET /api/payslips`. The backend service layer silently filters the result to `employeeId == auth.employeeId`. The frontend can't detect this from a 403; design these screens as "shows your own records" for Employee role, not "hidden/disabled."
- **Delete is Admin-only wherever it exists** (Employees, Contracts) — HR Manager can create/edit but never gets a delete action, even though HR Manager can do everything else on those resources.
- **Payrun validate/mark-paid is the one maker-checker gap**: an HR Payroll Manager who computed a payrun themselves still gets a 403 trying to validate it — the "Validate" button should be disabled (with an explanatory tooltip) when `payrun.computedBy === currentUser.id`, not just gated by role, or the user will hit a confusing rejection after clicking through.

## Navigation & screens to build

- **Top nav**: Employees, Contracts, Attendance, Time Off, Payroll, Reports — visibility per role (Employee sees a reduced set; see the "Roles & permissions" table above). This is Navigation-layer RBAC — hide what a role can't use, but never rely on hiding alone (backend still enforces).
- **Employees**: Kanban + List views, both opening the same unified **Employee Form** (the operational hub). Form shows identity, role, department, manager, schedule, active status, and **smart buttons** with live counts: Contracts (N), Attendance (N), Time Off (N), Payslips (N) — each opens a filtered list of that employee's records.
- **Contracts**: list view highlights the active contract clearly (badge/color, not just a status column); form captures duration, department, position, wage, salary structure.
- **Working Schedule**: list shows name/type/weekly hours (computed, read-only); form defines Day/Start/End/Break rows and shows the auto-computed weekly total live as rows change.
- **Attendance**: list shows Check In, Check Out, Worked Hours, Status — **visually flag exceptions** (missing check-out, late entry) with color/icon, don't bury them in a plain table. Form supports corrections, but only renders the correction control for authorized roles.
- **Time Off**:
  - Types/Allocations/Requests all under **Time Off** in top nav (Requests are accessed *only* here, not scattered elsewhere).
  - Request form must show **remaining balance for the selected leave type in real time**, before submission — fetch it as the user picks a type/date range, don't let them submit blind.
  - Request list: Employee, Type, Dates, Duration, Status. Approve/refuse is a simple two-action workflow on the form.
- **Payrun Creation Wizard** — must be an actual two-step wizard, not one collapsed form:
  - Step 1: Salary Structure + Period. "Continue" does **not** create a record yet.
  - Step 2: filtered eligible-employee list, explicit checkbox selection (never auto-select all).
  - "Create Payrun" only then creates the batch and opens the processing screen.
- **Payrun Processing screen**: shows run name, structure, period, **status progression as a visible stepper/badge** (Draft → Computed → Validated → Paid), action buttons (Compute, Validate, Mark Paid, Send Payslips), and a payslip summary list. Warnings (missing bank details, duplicates) rendered prominently *before* the Validate button is usable.
- **Payslip screen**: Employee, Structure, Pay Run, Period, Status, Worked Days up top; salary breakdown as a **structured table** — Category | Rule Name | Amount — never a flat unlabeled list. "Print Payslip" generates the PDF.
- **Payroll Dashboard**: KPI cards (Total Net Salary Paid, Payslips Generated, Average Salary, Approved Time Off, Attendance Health) driven by **real numbers from the API** — never hardcoded placeholders, even during development (fetch from day one, even against a mostly-empty DB). Charts: Salary Cost by Department, Monthly Net Salary Trend. Filters: Period, Department, Employee Type, all live-refreshing the same page.

## UI standards (apply everywhere, from `ui-standards.md`)

- Consistent color scheme, spacing, and typography across every screen — don't let each page look like a different app.
- Every form action gives success/error feedback — never a silent no-op.
- Loading states on every async call; empty states ("No records found") instead of blank pages.
- Never show a raw error object or stack trace to the user — surface the backend's structured `{success, error}` message instead.
- Responsive enough to demo cleanly on a laptop; a clean partial UI beats a broken full one — if a screen won't be finished, cut scope rather than ship it half-wired.

## Integration discipline

- Call the API per `docs/02_API_CONTRACTS.md` — don't invent request shapes and force backend to match after the fact.
- Every list/detail screen must reflect live backend state; no local mock arrays left in "temporarily" and forgotten.
- Respect role-based navigation, but treat it as UX polish, not security — the backend route/action/data checks are what actually protects anything.

## Deliverables checklist

- [ ] Employee Form with working smart-button counts and filtered navigation to related records
- [ ] Payrun wizard is genuinely two-step (verify: can't reach employee selection without completing Step 1)
- [ ] Payrun status shown as a clear progression, not just a text field
- [ ] Payslip breakdown rendered as Category | Rule Name | Amount table
- [ ] Time Off request form shows live remaining balance before submit
- [ ] Attendance exceptions visually flagged
- [ ] Dashboard KPIs and charts confirmed pulling from live API responses (check network tab, not just visually)
- [ ] No hardcoded/mock data left in any shipped screen
