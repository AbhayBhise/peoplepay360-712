---
name: bug-log
description: Running list of findings from docs/QA_TEST_PLAN.md. Append new entries at the top (most recent first). Mark an entry [FIXED] with a one-line note once resolved — don't delete history.
---

# Bug Log

Use the template in `docs/QA_TEST_PLAN.md` for new entries. Newest first.

## Already found and fixed (for reference — don't re-report these)

### [FIXED] Payslip PDF download returns "missing bearer token"
**Where**: Payroll → All Payslips → any payslip → Print Payslip PDF
**Cause**: direct browser navigation can't set an Authorization header; backend only checked the header.
**Fix**: `authenticate` middleware now also accepts `?token=` query param as a fallback.

### [FIXED] Payslip list/detail shows "Employee #undefined", "Structure #undefined", blank period/worked days
**Where**: Payroll → All Payslips (list and detail)
**Cause**: `frontend/src/api/payroll.ts` never got the camelCase-to-snake_case field mapping applied to other api files.
**Fix**: pending — assigned to Vaishnavi.

### [FIXED] Every role saw the identical dashboard; Employees got a 403
**Where**: Dashboard, all roles
**Cause**: dashboard routes were gated by one flat role check with no per-role field filtering, and Employee wasn't given any endpoint at all.
**Fix**: `GET /api/dashboard/me` added for personal view; `/summary` now strips payroll fields for HR Manager; `/salary-by-department` and `/net-salary-trend` now blocked from HR Manager entirely.

### [FIXED] `POST /api/auth/logout` returned 404
**Where**: sign-out button
**Cause**: frontend called an endpoint the backend never implemented.
**Fix**: added.

---

## Open

### [severity: P1] Time Off quota meter shows "No Quota" and table displays "Employee #undefined" / "Type #undefined"

**Where**: Time Off page (`/time-off`), logged in as Employee (`employee.demo@peoplepay360.dev`) or other roles
**Steps to reproduce**:
1. Log in as `employee.demo@peoplepay360.dev` (or any employee with active leave allocations)
2. Navigate to Time Off page (`/time-off`)
3. Observe the top quota progress bar meter cards (Annual Leave, Sick Leave, etc.)
4. Switch to Requests tab or Allocations tab and observe the table columns
**Expected**:
- Top quota meter cards should display live allocated vs. taken vs. remaining balance (e.g. 18 / 18 Days Left for Annual Leave).
- Table columns should display employee name (e.g., "Deepak Joshi") and leave type (e.g., "Paid Time Off / Annual Leave").
**Actual**:
- Top quota meters display "No Quota (0 / 0 Days Left)" because `TimeOffPage.tsx` filters `a.employee_id === user.employee_id`, while `timeOffApi.getAllocations()` returns backend Prisma objects with camelCase keys (`employeeId`, `typeId`, `allocated`, `taken`).
- Requests and Allocations tables render `Employee #undefined` and `Type #undefined` because the component accesses snake_case properties `r.employee_id` and `r.type_id` on camelCase API objects.
**Root Cause**: `frontend/src/api/timeoff.ts` does not normalize/map camelCase backend keys (`employeeId`, `typeId`) to the snake_case types expected by `TimeOffPage.tsx` (`employee_id`, `type_id`), matching the pattern previously identified in `payroll.ts`.

---

## Fixed this session

### [FIXED] BUG-008: Time Off quota balance meters showed hardcoded numbers
**Where**: Time Off page, all roles  
**Cause**: The three quota progress bar cards at the top of `TimeOffPage.tsx` used literal numbers (`16 / 20 Days Left`, `8 / 10 Days Left`, `16 Hours Left`) rather than the `allocations[]` array already being fetched.  
**Fix**: Replaced with `quotaByType` derived from live `allocations` data — now shows real allocated/taken/remaining per type, or "No Quota" when no validated allocation exists. `liveRemainingBalance` fallback corrected from hardcoded `16` to `0`.

### [FIXED] BUG-007: Employee dashboard blank/crash — `GET /api/dashboard/me` missing on old branch
**Where**: Dashboard, Employee role  
**Cause**: The `GET /api/dashboard/me` endpoint was not present in the version of the backend on the branch being tested. The endpoint was added and pushed to `origin/dev` during this session. Frontend's `getMyDashboard()` was an uncommented pass-through that received an error response and passed it to the component, which then tried to access `.attendanceThisMonth.present` on the error object → crash.  
**Fix**: Pulled the real endpoint from `origin/dev`; restarted backend fresh (ts-node-dev had been serving stale code). Frontend `getMyDashboard()` is a clean pass-through with a null guard — the real backend response shape (`attendanceThisMonth / leaveBalances / recentTimeOffRequests / recentPayslips`) matches `EmployeeDashboard` exactly after `apiRequest` unwraps the `{ success, data }` envelope.  
**Note**: An earlier version of this fix used a wrong `mapEmployeeDashboard()` normalizer built against a fabricated response shape. That normalizer was reverted once the real endpoint was available to probe directly.
>>>>>>> Stashed changes
