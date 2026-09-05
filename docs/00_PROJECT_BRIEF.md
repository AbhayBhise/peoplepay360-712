---
name: project-brief
description: Shared context every coding agent (Claude Code, Antigravity, etc.) must read first. Problem statement, roles, modules, end-to-end flow.
---

# PeoplePay360 — HR & Payroll Platform

Odoo Hackathon Final Round. 24 hours. Read this file before touching any code — every role file in `docs/roles/` assumes this context.

## 1. What we are building

An integrated HR + Payroll platform, not a set of disconnected CRUD screens. The **Employee** record is the central hub. Everything else hangs off it and must stay connected:

- **Employee** → **Contracts** (historical, but payroll only ever uses the ONE contract active for the payroll period)
- **Employee** → **Working Schedule** (weekly pattern → auto-computed weekly hours)
- **Employee** → **Attendance** (check-in/out, worked hours, corrections)
- **Employee** → **Time Off** (Types → Allocations → Requests, approval consumes balance)
- **Contract** → **Salary Structure** → **Salary Rules** (sequenced) → **Payslip lines**
- **Payrun** (period + structure + selected employees) → **Payslips** → PDF + bulk email
- **Payroll Dashboard** aggregates all of the above, live, filtered by period/department/employee type

The single biggest evaluation risk is **treating these as separate, disconnected tables**. Every module must resolve real relationships (e.g., "payroll must use the contract that applies to the payroll period," not just "the employee's contract").

## 2. User Roles (RBAC) — from the problem statement, authoritative

| Role | Access |
|---|---|
| **Employee** | View own details, attendance, leave balances. Create attendance entries and Time Off Requests. No HR/payroll admin access. |
| **HR Manager** | Full CRUD on Employees, Attendance, Contracts, Working Schedules, Time Off. Approve/refuse Time Off. **No payroll access.** |
| **HR Payroll User** | All HR Manager permissions + Create/Read/Update on Payruns & Payslips. Read-only on Salary Structures/Rules. |
| **HR Payroll Manager** | All HR Payroll User permissions + full CRUD on Payruns, Payslips, Salary Structures, Salary Rules. |
| **Admin** | Full access to everything, including user management and role assignment. |

Hierarchy is a **permission hierarchy**, not an org chart — an employee's manager is a separate field on the Employee record, unrelated to system role. See `PeoplePay360_RBAC_Workflow.png` in `dev resources/` for the enforcement pipeline: **Navigation → Routes → Actions → Data**, all four layers must independently enforce role, and the backend is always the source of truth (never trust a hidden frontend button as security).

## 3. End-to-end flow (this is what the 5-minute demo must show)

1. HR Manager creates an Employee → assigns Department, Manager, Working Schedule, Job Position.
2. HR Manager creates a Contract for that employee (dates, wage, salary structure) — system blocks overlapping active contracts for the same employee.
3. Employee/HR logs Attendance (check-in/check-out → worked_hours auto-computed, never entered manually).
4. Employee requests Time Off → balance checked against Allocation → Manager approves → balance deducted.
5. HR Payroll Manager defines Salary Structure + sequenced Salary Rules (Basic, Allowances, Deductions, Gross, Net).
6. HR Payroll User/Manager runs the **Payrun wizard**: Step 1 = structure + period → Step 2 = explicit employee selection → creates Payrun + draft Payslips.
7. System computes each Payslip: resolve the period's active contract → pull worked days from attendance/schedule → run salary rules in sequence order → produce line items → Gross/Net.
8. Warnings surfaced before finalization: missing bank details, duplicate payslips, no active contract, incomplete data.
9. Payrun: Draft → Computed → Validated → Paid (never skip a state). Payslip PDF generated, bulk email sent.
10. Payroll Dashboard shows live KPIs (Total Net Paid, Payslips Generated, Average Salary, Attendance Health, Approved Time Off), charts (Salary Cost by Department, Monthly Net Trend), and operational alerts — filterable by Period, Department, Employee Type.

## 4. Non-negotiable technical guardrails (apply to every role)

These come from `.agents/agents_updated/rules/*.md` — every coding agent should also load those files directly, they are enforced project-wide:

- **No Firebase/Supabase/MongoDB Atlas/BaaS.** PostgreSQL only, proper relational schema, real foreign keys.
- **No static JSON as a final data source.** Everything dynamic, read/written through real backend APIs.
- **Validate on the backend, always** — frontend validation alone is a guaranteed deduction.
- **No hardcoded salary values, IDs, or credentials anywhere.**
- **Never compute a payslip without resolving the period-applicable active contract first.**
- **Salary Rules execute in strict `sequence` order** — never randomly, never skipped.
- **Attendance `worked_hours` is always computed** from check_in/check_out, never manually entered.
- **Leave allocation and leave request are separate tables** — allocation grants balance, request consumes it.
- Passwords hashed (bcrypt), secrets in `.env`, parameterized queries only, structured error responses (`{"success": false, "error": "field: reason"}`).

Full detail: `input-validation.md`, `security.md`, `database-design.md`, `anti-patterns.md`, `git-workflow.md`, `ui-standards.md`, `coding-standards.md`.

## 5. Reference material in `dev resources/`

- `PeoplePay360 HR & Payroll.pdf` — full original problem statement (source of truth for scope/requirements)
- `disha 1st draft db schema.png` / `PeoplePay360_DB_Schema.excalidraw` — entity schema, see `docs/01_DATABASE_SCHEMA.md` for the written-out version
- `peoplepay360_system_architecture.png` — layered architecture (Client → API layer [Auth/RBAC] → HR&Attendance / Time-Off / Payroll engines → PostgreSQL → PDF/Email service)
- `PeoplePay360_RBAC_Workflow.png` — 4-layer RBAC enforcement pipeline
- `PeoplePay360_Core_Business_Workflow.png`, `PeoplePay360_Frontend_Workflow.png`, `PeoplePay360_Proper_Flowchart.pdf`, `HRMS OXP - 24 hours.excalidraw/.png` — supporting flow/UI sketches

## 6. Role files

Give each coding agent exactly one file from `docs/roles/` plus this brief:

- `roles/ARCHITECT.md` — system design, module boundaries, API contracts, integration review
- `roles/DATABASE.md` — schema, migrations, constraints, seed data
- `roles/BACKEND.md` — API implementation, business logic, payroll engine
- `roles/FRONTEND.md` — UI, navigation, forms, dashboard
- `roles/QA_INTEGRATION.md` — validation pass, git hygiene, demo-readiness, judging-criteria review

Each role file is self-contained: it repeats the guardrails relevant to that role so the agent doesn't need to cross-reference constantly.
