---
name: qa-test-plan
description: Module-by-module test checklist for a full app sweep. Log every finding in BUG_LOG.md using the template at the bottom of this file — don't fix anything while testing, just record it, so nothing gets silently patched without the team knowing it was broken.
---

# PeoplePay360 — Full QA Sweep

Run through every section below against the **live app** (both servers running, real Postgres — not the mock fallback). For each numbered item: do the action, compare actual vs. expected, and if they differ, log it in `docs/BUG_LOG.md` immediately using the template at the end of this file. Don't skip ahead to fix something you find — note it and keep testing, so the sweep produces a complete list rather than stopping at the first bug.

Test as **each of the 5 roles** where a section says "per role" — the whole point of RBAC is that the same click does different things depending on who's logged in.

Seeded logins:
| Role | Email | Password |
|---|---|---|
| Admin | admin@peoplepay360.dev | Admin@123 |
| HR Manager | hr.manager@peoplepay360.dev | Manager@123 |
| HR Payroll User | payroll.user@peoplepay360.dev | Payroll@123 |
| HR Payroll Manager | payroll.manager@peoplepay360.dev | Payroll@123 |
| Employee | employee.demo@peoplepay360.dev | Employee@123 |

## 1. Auth
- [ ] Login with each of the 5 accounts above — correct role-based landing page/nav for each
- [ ] Login with a wrong password — clear error message, not a raw stack trace
- [ ] Login 11 times rapidly with a wrong password — 11th attempt should be rate-limited (clear "too many attempts" message, not a generic error)
- [ ] Sign out — redirects to login, and going back in the browser doesn't show cached authenticated pages
- [ ] Refresh the page while logged in — session persists (not kicked back to login)

## 2. Dashboard — per role, this is the section most likely to reveal something (see docs/02_API_CONTRACTS.md's revised decision)
- [ ] **Employee**: sees a personal view (own attendance/leave/payslips) — NOT the company-wide KPI dashboard, NOT a 403 error page — **`GET /api/dashboard/me` was missing on old branch; now pushed to dev. DASH-04.**
- [ ] **HR Manager**: sees attendance/leave KPIs — confirm NO salary/payroll figures appear anywhere on the page
- [ ] **HR Payroll User / Manager / Admin**: sees full dashboard including Total Net Paid, Average Salary, Salary by Department chart
- [ ] Change the date filter — numbers actually change (proves it's live data, not a static render)
- [ ] Change the department filter — numbers actually change

## 3. Employees
- [ ] List loads, search by name works, filter by department works, filter by status works
- [ ] Kanban and List view both show the same data
- [ ] Create a new employee — appears in the list immediately without a manual refresh
- [ ] Open an employee — all 4 smart buttons (Contracts/Attendance/Time Off/Payslips) show a count and open the right filtered list
- [ ] **Employee role**: can only see their own record, not the full list (or is blocked from this page entirely — confirm which is intended)
- [ ] Edit an employee, save — changes reflected immediately
- [ ] Deactivate an employee — status updates, record isn't deleted (soft delete)

## 4. Departments
- [ ] Create, edit, delete all work
- [ ] Try to set a department as its own parent — rejected with a clear message
- [ ] Delete a department that has employees assigned — rejected, not silently orphaning employees

## 5. Contracts
- [ ] Create a contract — "Active Today" badge shows correctly based on real dates
- [ ] Try to create a second active contract overlapping an existing one for the same employee — rejected with a clear message naming the conflicting contract
- [ ] End date before start date — rejected at the form level before even hitting the API

## 6. Working Schedules
- [ ] Create a schedule with multiple day/time rows — weekly hours total computes automatically and updates live as rows change
- [ ] Try an end time before a start time on one row — rejected

## 7. Attendance
- [ ] Check in — appears in the list with the correct timestamp
- [ ] Check out — worked hours computed correctly (verify the math: (checkout − checkin) in hours)
- [ ] Try to check in twice without checking out first — rejected with a clear message
- [ ] A record with no check-out shows a visible "missing checkout" flag, not just a blank cell
- [ ] **Employee role**: can check themselves in/out but cannot edit past records (no correction control visible)
- [ ] **HR Manager**: can open the correction modal on any employee's record

## 8. Time Off
- [ ] Create a leave type, create an allocation, approve the allocation
- [ ] Request leave for a date range spanning a weekend — duration excludes the weekend days
- [ ] Balance shown on the request form matches what was allocated, live, before submitting
- [ ] Approve a request — balance decreases by exactly the request's duration, immediately visible
- [ ] Refuse a request — balance is unchanged (never touched by a refusal)
- [ ] Request more days than remaining balance — rejected, error states the actual remaining number

## 9. Payroll — Salary Structures/Rules
- [ ] Create a structure, add rules with different computation methods (fixed, percentage, formula)
- [ ] Try two rules in the same structure with the same sequence number — rejected
- [ ] **HR Payroll User**: read-only on this screen (no create/edit controls visible or enabled)
- [ ] **HR Payroll Manager**: full CRUD

## 10. Payroll — Payrun wizard and processing
- [ ] Wizard is genuinely two steps — cannot reach employee selection without completing Step 1 first
- [ ] Step 2 shows only eligible employees (active contract covering the period, matching structure) — not everyone
- [ ] Create the payrun — draft payslips created, nothing computed yet
- [ ] Compute — payslip numbers appear, status changes to Computed
- [ ] Try to Validate as the same user who just Computed — rejected (maker-checker)
- [ ] Validate as a different HR Payroll Manager user — succeeds
- [ ] Mark Paid — status updates, and no further edits are possible on this payrun (try editing a payslip after — should be blocked)
- [ ] Print Payslip PDF — opens/downloads a real PDF with the itemized breakdown, employee name, correct amounts (not blank, not "undefined")
- [ ] Send Payslips — shows which employees were sent vs. skipped (e.g. no email on file), doesn't silently claim success for everyone

## 11. Reports
- [ ] Numbers on this page match the Dashboard's numbers for the same filters (cross-check one figure manually)
- [ ] Export CSV actually downloads a file with real rows, not a no-op toast

## 12. Admin (once the Admin Users page is built)
- [ ] Create a user with a role — can immediately log in as that user
- [ ] Change a user's role — their access changes accordingly on next login
- [ ] Deactivate a user — they can no longer log in
- [ ] **Only Admin** can reach this page — every other role, including HR Payroll Manager, is blocked

## 13. Cross-cutting
- [ ] Open DevTools Network tab, click through every page once — confirm every page fires real requests to localhost:4000 (not silently using mock fallback data)
- [ ] Every form shows a clear success or error message after submitting — never a silent no-op
- [ ] Every list shows an empty state ("No records found") when filtered to nothing, never a blank page
- [ ] No raw error objects, stack traces, or `[object Object]` visible anywhere in the UI

---

## Bug log entry template — copy this into docs/BUG_LOG.md for each finding

```
### [severity: P0/P1/P2] Short title

**Where**: page/screen + role logged in as
**Steps to reproduce**: 1. ... 2. ... 3. ...
**Expected**: what should have happened
**Actual**: what actually happened (paste the exact error message/console output if any)
**Screenshot**: (if applicable, path or description)
```

Severity guide: **P0** = blocks a demo scenario or shows wrong data. **P1** = wrong behavior but workaroundable. **P2** = cosmetic/polish.
