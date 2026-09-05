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

_(New findings from the QA sweep go here, newest first, using the template in QA_TEST_PLAN.md)_
