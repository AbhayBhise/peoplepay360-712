---
name: role-qa-integration
description: QA / integration engineer role file for PeoplePay360 — cross-module validation, git hygiene, demo readiness.
---

# Role: QA & Integration Engineer

Read `docs/00_PROJECT_BRIEF.md` first. This role doesn't own a module — it owns the seams between modules, and whether the thing judges actually see works.

## Mission

Find the gaps between what backend, frontend, and database each assumed the others would do, before the judges do.

## Responsibilities

1. **Run the 2 required demo scenarios end-to-end, repeatedly, from a clean-ish DB state**: (a) full employee-to-payslip flow, (b) leave allocation-to-request flow. Any break in either is P0.
2. **Verify cross-module business rules actually hold**, not just that each module's unit behavior looks right in isolation:
   - Create two overlapping active contracts for one employee via the API directly (not just the UI) — confirm rejection.
   - Run a payrun for a period where an employee has no active contract — confirm a clear error, not a crash or a silently-wrong payslip.
   - Approve a leave request that exceeds remaining balance — confirm rejection with the correct remaining-balance number in the message.
   - Refuse a leave request — confirm the allocation balance is unchanged.
   - Compute a payslip twice for the same payrun/employee — confirm duplicate detection triggers the warning, not a duplicate payslip.
   - Try to skip payrun states (e.g., call "mark paid" on a draft payrun directly via API) — confirm it's blocked server-side, not just hidden in the UI.
3. **RBAC verification, per role, per the 4-layer pipeline** (`PeoplePay360_RBAC_Workflow.png`): log in as each of Employee / HR Manager / HR Payroll User / HR Payroll Manager / Admin and confirm — nav items hidden appropriately, direct URL access to a forbidden route is blocked, forbidden action buttons are absent/disabled, and (most important) hitting the API endpoint directly with a lower-privileged token is rejected server-side. The UI hiding a button is not a pass condition.
4. **Data integrity spot checks**: dashboard numbers actually match a manual SUM/COUNT against the DB for at least one filter combination; worked_hours/weekly_hours/remaining balances are computed, not stale/manually edited.
5. **Git hygiene** (`git-workflow.md`): confirm every team member has commits, branch naming follows `feat/backend-*` / `feat/frontend-*` / `feat/db-*`, nothing pushed directly to `main`, commit messages are conventional and legible in `git log` — reviewers read this.
6. **Anti-pattern sweep** before final submission, using `.agents/agents_updated/rules/anti-patterns.md` and `workflows/review-code.md`: no `print()` debugging left in, no TODOs in demo code, no hardcoded secrets/IDs, no bare `except: pass`, no string-formatted SQL.
7. **Demo script**: write the actual click-by-click script for the 5-minute walkthrough covering both required scenarios, so the presenting teammate isn't improvising live. Include the future-roadmap summary the deliverables section asks for.

## Severity triage for anything found

- **P0 (fix before demo)**: crashes, wrong payroll numbers, RBAC bypass via direct API call, broken end-to-end scenario.
- **P1 (fix if time)**: missing warning surfacing, inconsistent UI state, minor validation gaps on secondary forms.
- **P2 (note in future roadmap)**: polish, edge cases far from the demo path.

## Deliverables checklist

- [ ] Both required demo scenarios pass end-to-end at least twice in a row
- [ ] Contract-overlap, no-contract-payroll, leave-balance-exceeded, and duplicate-payslip cases all verified via direct API calls (not just UI)
- [ ] RBAC verified for all 5 roles at all 4 enforcement layers, direct-API-bypass attempts specifically tested
- [ ] Git log reviewed: all members present, branch/commit conventions followed, nothing direct-to-main
- [ ] Anti-pattern sweep completed on backend and frontend
- [ ] Demo script written and rehearsed once with the presenter
