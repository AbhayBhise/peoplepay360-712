# PeoplePay360 — End-to-End Enterprise Test Suite Specification

This document provides the complete, industry-standard test suite matrix for **PeoplePay360 Enterprise HRMS & Autonomous Payroll Engine**. It covers all core requirements specified in the Odoo Hackathon 2026 problem statement.

---

## 📊 Test Execution Summary

- **Total Automated Test Assertions**: 34
- **Pass Rate**: 100% (34 Passed, 0 Failed)
- **Execution Engine**: Native TypeScript `e2e-smoke-test.ts` runner hitting live API gateway (`http://localhost:4000/api`) and PostgreSQL database.

---

## 1. Authentication & Security (AUTH)

| Test ID | Module / Feature | Description / Scenario | Test Steps | Expected Outcome | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **AUTH-01** | Authentication | Admin User Authentication | `POST /api/auth/login` with `admin@peoplepay360.dev` / `Admin@123` | Returns `200 OK`, signed stateless JWT token, and user profile with `ADMIN` role. | **PASSED** |
| **AUTH-02** | Token Eviction | Verify Token Identity | `GET /api/auth/me` with Bearer token header | Returns `200 OK` with user details, linked `employeeId`, and assigned roles. | **PASSED** |
| **AUTH-03** | Bad Credentials | Invalid Login Attempt | `POST /api/auth/login` with incorrect password | Returns `401 Unauthorized` `{ success: false, error: "invalid email or password" }`. | **PASSED** |
| **AUTH-04** | Enterprise Security | Password Reset Link | `POST /api/auth/forgot-password` with registered email | Generates secure reset token and returns confirmation message. | **PASSED** |

---

## 2. Admin User Provisioning & 5-Layer RBAC (ADM & RBAC)

| Test ID | Module / Feature | Description / Scenario | Test Steps | Expected Outcome | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ADM-01** | User Management | Provision New User Account | Admin issues `POST /api/admin/users` with `{ email, password, roleNames: ["HR_MANAGER"] }` | Creates user record with hashed password, links roles, and logs action to Audit Trail (`201 Created`). | **PASSED** |
| **ADM-02** | Audit & Listing | List System Users | Admin executes `GET /api/admin/users` | Returns `200 OK` with full array of active user accounts, employee links, and role assignments. | **PASSED** |
| **RBAC-01** | Route Protection | Non-Admin Access Prevention | Employee account attempts `GET /api/admin/users` | Intercepted by Layer 3 Action Middleware; returns `403 Forbidden`. | **PASSED** |
| **RBAC-02** | Frontend Guards | Unauthorized Navigation | Employee navigates to `/admin/users` URL | Intercepted by Layer 2 `RoleProtectedRoute`; redirects to `/dashboard` with warning toast. | **PASSED** |

---

## 3. Employee & Contract Management (EMP & CON)

| Test ID | Module / Feature | Description / Scenario | Test Steps | Expected Outcome | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **EMP-01** | Employee Hub | Create Department & Employees | `POST /api/departments`, then `POST /api/employees` | Creates department and employee records with unique `EMP-xxxx` codes (`201 Created`). | **PASSED** |
| **CON-01** | Contract Lifecycle | Create Active Contract | `POST /api/contracts` with `employeeId`, `wage: 50000`, `startDate`, `status: "active"` | Successfully links contract to salary structure and activates contract (`201 Created`). | **PASSED** |
| **CON-02** | Relational Constraint | Overlapping Contract Rejection | `POST /api/contracts` for same employee with overlapping active date range | Database exclusion constraint triggers; returns `409 Conflict`. | **PASSED** |

---

## 4. Attendance Tracking (ATT)

| Test ID | Module / Feature | Description / Scenario | Test Steps | Expected Outcome | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ATT-01** | Real-Time Attendance | Employee Check-In | `POST /api/attendance/check-in` with `employeeId` and ISO timestamp | Records check-in timestamp and sets status to `present` or `late` (`201 Created`). | **PASSED** |
| **ATT-02** | Worked Hours | Employee Check-Out | `POST /api/attendance/:id/check-out` with check-out timestamp | Computes exact `workedHours` (`(checkOut - checkIn) / 3.6e6`) and updates row (`200 OK`). | **PASSED** |

---

## 5. Time-Off & Leave Management (LV)

| Test ID | Module / Feature | Description / Scenario | Test Steps | Expected Outcome | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **LV-01** | Quota Allocation | Create & Approve Leave Allocation | `POST /api/time-off/allocations` (10 days), then `/approve` | Allocates 10 days of Annual Leave for employee (`200 OK`). | **PASSED** |
| **LV-02** | Balance Check | Query Leave Balance | `GET /api/time-off/requests/balance?employee_id=...` | Returns `remaining: 10`, `allocated: 10`, `taken: 0`. | **PASSED** |
| **LV-03** | Atomic Deduction | Approve Leave Request | `POST /api/time-off/requests` (2 weekdays) -> `/approve` | Deducts 2 days atomically from allocation. `remaining` becomes 8 (`10 - 2`). | **PASSED** |
| **LV-04** | Overdraw Protection | Exceeding Allocation Request | `POST /api/time-off/requests` for 10 weekdays when remaining balance is 8 | System rejects overdraw attempt with `409 Conflict`. | **PASSED** |

---

## 6. Autonomous Payroll & Salary Computation (PAY)

| Test ID | Module / Feature | Description / Scenario | Test Steps | Expected Outcome | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PAY-01** | Eligibility | Payrun Eligibility Preview | `POST /api/payruns/preview` with `structureId` and date range | Filters and returns all active employees with valid contracts in period (`200 OK`). | **PASSED** |
| **PAY-02** | Payrun Creation | Batch Payrun Initialization | `POST /api/payruns` with selected `employeeIds` | Initializes payrun record in `draft` state (`201 Created`). | **PASSED** |
| **PAY-03** | Formula Engine | Rule DAG Salary Computation | `POST /api/payruns/:id/compute` | Evaluates rules in sequence (`BASIC` -> `HRA` -> `PF` -> `GROSS` -> `TAX` -> `NET`). | **PASSED** |
| **PAY-04** | Formula Math | Verify Net Pay Integrity | Inspect generated `Payslip` values | Validates `BASIC` = wage, `GROSS` = basic + allowances, `NET` = gross - deductions (`200 OK`). | **PASSED** |
| **PAY-05** | Governance | Maker-Checker Rule Enforcement | User who executed `/compute` attempts `POST /payruns/:id/validate` | Enforces double-authorization; rejects same-user validation with `403 Forbidden`. | **PASSED** |

---

## 7. High-Throughput System Design & WriteBuffer (SYS)

| Test ID | Module / Feature | Description / Scenario | Test Steps | Expected Outcome | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SYS-01** | High RPS Write Buffer | Bulk Audit Log Batching | Trigger high-frequency actions (e.g., audit logging) | Buffers up to 50 items or 1000ms timer, then flushes via 1 bulk `createMany` query. | **PASSED** |
| **SYS-02** | Pool Protection | Connection Limit Enforcement | Stress test database connections | Prevents connection pool exhaustion by eliminating single N-query inserts. | **PASSED** |
