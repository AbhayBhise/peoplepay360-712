# ⚡ PeoplePay360 — Enterprise HRMS & Autonomous Payroll Engine

![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=for-the-badge&logo=github)
![E2E Tests](https://img.shields.io/badge/E2E_Tests-34%2F34_Passed-success?style=for-the-badge&logo=jest)
![RBAC Security](https://img.shields.io/badge/RBAC_Security-5--Tier_Enforced-blue?style=for-the-badge&logo=shield)
![Seeded Scale](https://img.shields.io/badge/Seeded-250_Users_--_750_Payslips-orange?style=for-the-badge&logo=postgresql)
![License](https://img.shields.io/badge/License-Enterprise-purple?style=for-the-badge)

**PeoplePay360** is a full-stack, enterprise-grade Human Resource Management System (HRMS) and Autonomous Payroll Processing Engine built for modern organizations. Designed with a modular architecture, PeoplePay360 seamlessly handles workforce operations, attendance clocking, leave management, structured salary rule evaluation, and high-concurrency event ingestion.

---

## 📌 Executive Summary

PeoplePay360 solves enterprise payroll complexity and access governance through:
1. **Autonomous Salary Computation Engine**: Sequenced rule dependency evaluation (`BASIC` $\rightarrow$ `HRA` $\rightarrow$ `TRANSPORT` $\rightarrow$ `GROSS` $\rightarrow$ `PF` $\rightarrow$ `TAX` $\rightarrow$ `NET`).
2. **Maker-Checker Financial Controls**: Double-authorization governance preventing the same user who computes a payrun from validating or disbursing it.
3. **Smart Anti-Overlap Contract Guard**: Real-time contract overlap detection with 1-click automatic contract expiration.
4. **4-Layer RBAC Security Pipeline**: Defense-in-depth permission enforcement across UI navigation, React route guards, Express action middleware, and PostgreSQL relational constraints.

---

## 👑 User Hierarchy & Role Permission Matrix

PeoplePay360 enforces a strict 5-tier Role-Based Access Control (RBAC) permission hierarchy:

```
                          ┌───────────────────────────┐
                          │         1. ADMIN          │  (System Governance & User Provisioning)
                          └─────────────┬─────────────┘
                                        │
                          ┌─────────────┴─────────────┐
                          │   2. HR PAYROLL MANAGER   │  (Payroll Control, Rules & Maker-Checker)
                          └─────────────┬─────────────┘
                                        │
                          ┌─────────────┴─────────────┐
                          │    3. HR PAYROLL USER     │  (Payrun Execution & Payslip Generation)
                          └─────────────┬─────────────┘
                                        │
                          ┌─────────────┴─────────────┐
                          │       4. HR MANAGER       │  (Workforce, Contracts, Leaves, Attendance)
                          └─────────────┬─────────────┘
                                        │
                          ┌─────────────┴─────────────┐
                          │        5. EMPLOYEE        │  (Self-Service Portal, Clocking & Leave Requests)
                          └───────────────────────────┘
```

### 📊 Comprehensive Module Permission Matrix

| System Module / Feature | EMPLOYEE | HR MANAGER | HR PAYROLL USER | HR PAYROLL MANAGER | ADMIN |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Self-Service Portal (`/dashboard/me`)** | ✅ View Own | ✅ View Own | ✅ View Own | ✅ View Own | ✅ Full Access |
| **Employees Directory (`/employees`)** | ❌ No Access | ✅ Full CRUD | ✅ View Only | ✅ View Only | ✅ Full Access |
| **Contracts Management (`/contracts`)** | ❌ No Access | ✅ Full CRUD | ✅ View Only | ✅ View Only | ✅ Full Access |
| **Working Schedules (`/working-schedules`)** | ❌ No Access | ✅ Full CRUD | ✅ View Only | ✅ View Only | ✅ Full Access |
| **Attendance Clocking (`/attendance`)** | ⏱️ Self Check-In/Out | ✅ View & Correct All | ✅ View All | ✅ View All | ✅ Full Access |
| **Time Off Requests (`/timeoff`)** | 📝 Request Own | ✅ Approve/Refuse All | ✅ View All | ✅ View All | ✅ Full Access |
| **Time Off Allocations (`/timeoff`)** | 👁️ View Own Balance | ✅ Manage Allocations | ✅ View All | ✅ View All | ✅ Full Access |
| **Salary Structures & Rules (`/payroll/structures`)** | ❌ No Access | ❌ No Access | 👁️ View Only | ✅ Full CRUD | ✅ Full Access |
| **Payrun Execution (`/payroll/payruns`)** | ❌ No Access | ❌ No Access | ⚡ Create & Compute | ✅ Validate & Mark Paid | ✅ Full Access |
| **Payslips & PDF Export (`/payroll/payslips`)** | 📄 View Own Payslips | ❌ No Access | ✅ View & PDF Export | ✅ View, PDF & Email | ✅ Full Access |
| **User Provisioning (`/admin/users`)** | ❌ No Access | ❌ No Access | ❌ No Access | ❌ No Access | 🔒 Admin Only |
| **Audit Logs (`/admin/audit-logs`)** | ❌ No Access | ❌ No Access | ❌ No Access | ❌ No Access | 🔒 Admin Only |

---

## 🔐 Seeded Enterprise Test Credentials (250 Seeded Accounts)

The database is pre-populated with **250 test user accounts** across all 5 roles. Use any of the canonical logins below for immediate testing:

| Role Level | Role Name | Canonical Email Login | Password | Access Scope & Responsibilities |
| :--- | :--- | :--- | :--- | :--- |
| **1. ADMIN** | System Administrator | `admin@peoplepay360.dev` | `Admin@123` | User provisioning (`/admin/users`), audit logs, system roles (5 total admin accounts: `admin01`..`admin04`) |
| **2. HR_PAYROLL_MANAGER**| HR Payroll Manager | `payroll.manager@peoplepay360.dev` | `Payroll@123` | Maker-Checker validation, payrun marking as paid, salary structures (10 total accounts: `payrollmanager01`..`09`) |
| **3. HR_PAYROLL_USER** | HR Payroll Specialist | `payroll.user@peoplepay360.dev` | `Payroll@123` | Payrun wizard execution, draft payslip computation, PDF export (15 total accounts: `payrolluser01`..`14`) |
| **4. HR_MANAGER** | HR Manager | `hr.manager@peoplepay360.dev` | `Manager@123` | Workforce management, contracts, work schedules, time-off approvals (20 total accounts: `hrmanager01`..`19`) |
| **5. EMPLOYEE** | Standard Employee | `employee.demo@peoplepay360.dev` | `Employee@123` | Personal portal, attendance check-in/out, leave requests (200 total accounts: `emp001`..`emp199`) |

---

## 🛡️ 4-Layer RBAC Security Pipeline Architecture

Security is enforced independently across 4 distinct architectural layers:

```
[Layer 1: UI Navigation Filter] ───► Hides unauthorized sidebar menu links
                                            │
[Layer 2: React Route Guard]   ───► Blocks direct URL navigation (RoleProtectedRoute)
                                            │
[Layer 3: Express Action API]  ───► Middleware authorization (requireRole("ADMIN", ...))
                                            │
[Layer 4: PostgreSQL ACID]     ───► Maker-Checker rules (computedBy !== validatedBy)
```

| Security Layer | Implementation File | Functional Purpose |
| :--- | :--- | :--- |
| **Layer 1: Navigation** | [`Sidebar.tsx`](file:///f:/PROJECTS/Odoo%20Final%20Round/peoplepay360-712/frontend/src/components/layout/Sidebar.tsx) | Dynamically filters sidebar links based on authenticated user permissions. |
| **Layer 2: Route Guard** | [`RoleProtectedRoute`](file:///f:/PROJECTS/Odoo%20Final%20Round/peoplepay360-712/frontend/src/App.tsx) | Blocks direct URL navigation; redirects unauthorized users to `/dashboard` with toast alert. |
| **Layer 3: Action Middleware** | [`auth.ts Middleware`](file:///f:/PROJECTS/Odoo%20Final%20Round/peoplepay360-712/backend/src/middleware/auth.ts) | Backend Express authorization (`requireHRMPlus`, `requireHRPUPlus`, `requireAdmin`). |
| **Layer 4: Data Level** | Prisma + PostgreSQL Constraints | Enforces Maker-Checker rules (`computedBy !== validatedBy`) and prevents overlapping active contracts. |

---

## 🔒 Security Hardening Highlights

PeoplePay360 goes beyond basic RBAC to include enterprise-grade API defenses:

- **Strict CSP & Security Headers**: Enforced via custom Helmet directives.
- **XSS Sanitisation Pipeline**: Recursively cleans all incoming JSON request bodies, stripping executable tags and prototype pollution payloads (`__proto__`, `constructor`) without breaking valid data structures.
- **Strict Content-Type Enforcement**: Rejects any mutating request (`POST`/`PUT`/`PATCH`) that does not declare `application/json`, preventing blind text parsing.
- **HTTP Parameter Pollution (HPP)**: Safely collapses duplicate query parameters to scalar values, protecting against type-confusion logic flaws.
- **Tiered Rate Limiting**:
  - `Global`: 100 req/15min to prevent mass scraping and DoS.
  - `Login`: 5 req/15min to prevent brute-force and credential stuffing.
  - `Sensitive Ops`: 5 req/15min for password resets/changes.
  - `Admin Provisioning`: 20 req/15min to protect privileged actions.
- **Hardened Cryptography**: Pins JWT signing to `HS256` only, enforces `bcrypt` rounds (default 12 for payroll systems), and strictly validates CORS origins (no wildcards).

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite 6, Tailwind CSS v4, Lucide Icons, React Router v7
- **Backend**: Node.js, Express, TypeScript, Prisma ORM 5, Zod Schema Validation, Winston Logging, PDFKit
- **Database**: PostgreSQL 16 (Relational integrity, ACID compliance, exclusion constraints)
- **Quality Assurance**: Native E2E Test Suite (34/34 passing smoke tests)

---

## 🚀 Quick Start & Installation

### 1. Prerequisites
- Node.js `v18.x` or higher
- PostgreSQL `v14+` running locally on port `5432` (Database: `peoplepay360`)

### 2. Environment Setup
Clone the repository and install dependencies:

```bash
git clone https://github.com/AbhayBhise/peoplepay360-712.git
cd peoplepay360-712

# Install Backend Dependencies
cd backend
npm install

# Install Frontend Dependencies
cd ../frontend
npm install
```

### 3. Database Migration & High-Scale Seeding
Configure `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/peoplepay360?schema=public"
JWT_SECRET="super-secret-enterprise-key-360"
PORT=4000
```

Seed the 250 test users and 3 months of payroll records:
```bash
cd backend
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
```

### 4. Running Development Servers

In Terminal 1 (Backend Server):
```bash
cd backend
npm run dev
# Running on http://localhost:4000
```

In Terminal 2 (Frontend App):
```bash
cd frontend
npm run dev
# Running on http://localhost:3001
```

---

## 🧪 Automated Testing & Verification

Run the automated End-to-End test suite against the active backend server:

```bash
cd backend
npm run test:e2e
```

### 📈 Test Output Matrix (34/34 Passed):
```
PeoplePay360 E2E smoke test — target: http://localhost:4000/api

Auth
  OK   login as admin
  OK   GET /auth/me

Fixtures
  OK   create department
  OK   create employee 1
  OK   create employee 2
  OK   create salary structure
  OK   create BASIC rule (formula: WAGE)
  OK   create HRA rule (20% of BASIC)
  OK   create PF deduction rule (12% of BASIC)
  OK   create active contract for employee 1
  OK   create active contract for employee 2
  OK   reject overlapping active contract

Attendance
  OK   check-in employee 1
  OK   check-out computes workedHours

Time Off
  OK   create time off type
  OK   create allocation (10 days)
  OK   approve allocation
  OK   balance before request = 10
  OK   create request, duration=2 weekdays
  OK   approve request (atomic balance deduction)
  OK   balance after approval = 8 (10 - 2)
  OK   reject request exceeding remaining balance

Payroll
  OK   preview finds both employees eligible
  OK   create payrun with both employees
  OK   compute payrun
  OK   employee 1 payslip has positive net pay
  OK   employee 1 BASIC resolved from contract WAGE (50000)
  OK   gross = basic + allowances
  OK   net = gross - deductions
  OK   reject validate by the same user who computed

Admin User Provisioning
  OK   provision new user account as Admin
  OK   list user accounts as Admin

Dashboard
  OK   GET dashboard summary
  OK   GET salary-by-department

34 passed, 0 failed
```

---

## 📄 Documentation Index
- 📑 [Team Manual Testing & QA Guide](file:///f:/PROJECTS/Odoo%20Final%20Round/peoplepay360-712/docs/MANUAL_TESTING_GUIDE.md)
- 📐 [High-Scale System Design & Architecture](file:///f:/PROJECTS/Odoo%20Final%20Round/peoplepay360-712/docs/SYSTEM_DESIGN.md)
- 📊 [Database Schema & ERD Notes](file:///f:/PROJECTS/Odoo%20Final%20Round/peoplepay360-712/docs/03_DB_DESIGN_NOTES.md)
