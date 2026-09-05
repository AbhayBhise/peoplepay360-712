# PeoplePay360 — QA Test Plan & Validation Suite

**Project:** PeoplePay360 (HR & Payroll Platform)  
**Evaluation Scope:** Odoo Hackathon 2026 — Final Round  
**Standard Reference:** `docs/00_PROJECT_BRIEF.md`, `docs/roles/QA_INTEGRATION.md`, `docs/roles/ARCHITECT.md`

---

## 1. Scope & Test Objectives

The QA Test Plan validates the complete integration seams between database constraints, backend business logic, and frontend role-based UI execution.

### Key Objectives:
1. **End-to-End Scenarios:**
   - **Scenario A (Employee → Contract → Attendance → Payrun → Payslip):** Complete hire-to-pay workflow.
   - **Scenario B (Leave Allocation → Request → Manager Approval → Balance Deduction):** Atomic leave management workflow.
2. **4-Layer RBAC Pipeline Verification:**
   - Layer 1: Navigation visibility.
   - Layer 2: Route guards.
   - Layer 3: Action controls & maker-checker buttons.
   - Layer 4: Backend API authorization enforcement.
3. **Data Integrity & Non-Negotiable Guardrails:**
   - Strict `sequence` order execution of salary rules.
   - No overlapping active contracts for the same employee (`409 Conflict`).
   - Attendance `worked_hours` auto-calculated from check-in / check-out.
   - All financial amounts standardized to Indian Rupees (`₹`) via `formatCurrency`.

---

## 2. Test Execution Matrix

| Test ID | Module | Scenario / Test Case | Expected Outcome | Role Tested | Status |
|---|---|---|---|---|---|
| **AUTH-01** | Auth | Login with valid credentials | JWT returned, user roles saved in session, redirected to Dashboard | All Roles | ✅ PASS |
| **AUTH-02** | Auth | Login with invalid credentials | `401 Unauthorized` with structured error message | All Roles | ✅ PASS |
| **RBAC-01** | Navigation | Employee navigation visibility | Can only access Dashboard (Self), Attendance, Time Off, My Payslips | `EMPLOYEE` | ✅ PASS |
| **RBAC-02** | Navigation | HR Manager navigation | Can access Employees, Contracts, Attendance, Time Off, Schedules | `HR_MANAGER` | ✅ PASS |
| **RBAC-03** | Navigation | Payroll User navigation | Can access Payruns & Payslips in addition to HR modules | `HR_PAYROLL_USER` | ✅ PASS |
| **RBAC-04** | Security | Direct API access to `/api/payruns` by Employee | `403 Forbidden` returned from server | `EMPLOYEE` | ✅ PASS |
| **RBAC-05** | Security | Direct API access to `/api/salary-rules` by HR Manager | `403 Forbidden` returned from server | `HR_MANAGER` | ✅ PASS |
| **EMP-01** | Employees | Create employee with department and schedule | Employee record created, smart buttons initialized with zero counts | `HR_MANAGER`+ | ✅ PASS |
| **EMP-02** | Employees | Delete employee action restriction | Only `ADMIN` role can delete employee records | `HR_MANAGER` vs `ADMIN` | ✅ PASS |
| **CON-01** | Contracts | Create active contract with wage & structure | Active contract registered, wage formatted in `₹` | `HR_MANAGER`+ | ✅ PASS |
| **CON-02** | Contracts | Attempt overlapping active contract for same employee | Backend rejects with `409 Conflict`, UI displays conflict error | `HR_MANAGER`+ | ✅ PASS |
| **ATT-01** | Attendance | Check-in and check-out recording | `worked_hours` auto-computed from timestamps | All Roles | ✅ PASS |
| **ATT-02** | Attendance | Missing check-out triage | Flagged in Action Center radar and Attendance exceptions table | `HR_MANAGER`+ | ✅ PASS |
| **LEAVE-01** | Time Off | Allocate leave quota to employee | Allocation created, requires manager approval before use | `HR_MANAGER`+ | ✅ PASS |
| **LEAVE-02** | Time Off | Real-time balance preview in Request modal | Balance updates dynamically as type is selected before submit | `EMPLOYEE` | ✅ PASS |
| **LEAVE-03** | Time Off | Request approval and balance deduction | Status becomes `validate`, balance atomically reduced | `HR_MANAGER` | ✅ PASS |
| **LEAVE-04** | Time Off | Over-allocation leave request | Backend rejects with `409 Conflict`, UI blocks invalid submission | `EMPLOYEE` | ✅ PASS |
| **PAY-01** | Payroll | 2-Step Payrun Creation Wizard | Step 1 filters structure/period; Step 2 presents checkboxes | `HR_PAYROLL_USER`+ | ✅ PASS |
| **PAY-02** | Payroll | Salary Rule Execution | Rules execute in strict sequence: Basic → HRA (20%) → PF (12%) | `HR_PAYROLL_USER`+ | ✅ PASS |
| **PAY-03** | Payroll | Maker-Checker Validation Guardrail | Same user who computed payrun CANNOT validate it (`403`) | `HR_PAYROLL_MANAGER` | ✅ PASS |
| **PAY-04** | Payroll | Payslip camelCase Normalization | Displays employee name, structure name, worked days, line items | All Roles | ✅ PASS |
| **PAY-05** | Payroll | PDF Download via Token Query Param | Direct URL `/api/payslips/:id/pdf?token=...` serves binary PDF | All Roles | ✅ PASS |
| **DASH-01** | Dashboard | Employee Personal Dashboard (`/api/dashboard/me`) | Shows personal wage (`₹`), attendance health, leave quota, payslips | `EMPLOYEE` | ✅ PASS |
| **DASH-02** | Dashboard | Management Dashboard missing payroll fields | Gracefully displays `₹0` / HR View without `undefined` | `HR_MANAGER` | ✅ PASS |
| **DASH-03** | Dashboard | Management Dashboard full KPIs (`₹`) | Total Net Paid, Average Salary, Charts render in INR | `HRPU` / `HRPM` / `ADMIN` | ✅ PASS |

---

## 3. Automated & Manual Test Commands

### Backend E2E Smoke Test:
```bash
cd backend
npx ts-node scripts/e2e-smoke-test.ts
```

### Frontend Typecheck & Build:
```bash
cd frontend
npm run build
```
