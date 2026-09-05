# ⚡ PeoplePay360 — Enterprise HRMS & Autonomous Payroll Engine

![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=for-the-badge&logo=github)
![E2E Tests](https://img.shields.io/badge/E2E_Tests-34%2F34_Passed-success?style=for-the-badge&logo=jest)
![RBAC Pipeline](https://img.shields.io/badge/RBAC_Security-5--Tier_Enforced-blue?style=for-the-badge&logo=shield)
![High Scale](https://img.shields.io/badge/WriteBuffer-High_RPS_Batching-orange?style=for-the-badge&logo=postgresql)
![License](https://img.shields.io/badge/License-Enterprise-purple?style=for-the-badge)

**PeoplePay360** is a full-stack, enterprise-grade Human Resource Management System (HRMS) and Autonomous Payroll Processing Engine built for modern organizations. Designed with a modular architecture, PeoplePay360 seamlessly handles workforce operations, attendance clocking, leave management, structured salary rule evaluation, and high-concurrency event ingestion.

---

## 📌 Executive Summary

PeoplePay360 solves enterprise payroll complexity and access governance through:
1. **Autonomous Salary Computation Engine**: Sequenced rule dependency evaluation (`BASIC` -> `HRA` -> `PF` -> `GROSS` -> `TAX` -> `NET`).
2. **Maker-Checker Financial Controls**: Double-authorization governance preventing the same user who computes a payrun from validating or disbursing it.
3. **High-Throughput Write-Buffer Architecture**: In-memory request batching (50-item threshold / 1000ms timer) to process high-frequency attendance punches and audit logs without PostgreSQL pool exhaustion.
4. **4-Layer RBAC Security Pipeline**: Defense-in-depth permission enforcement across UI navigation, React route guards, Express action middleware, and PostgreSQL relational constraints.

---

## 🏗 System Architecture & Microservices Readiness

PeoplePay360 is built as a **Modular Monolith**, designed for clear domain separation and microservice extraction:

```
                                  ┌────────────────────────┐
                                  │   Vite + React SPA     │
                                  │   (Tailwind CSS v4)    │
                                  └───────────┬────────────┘
                                              │ REST API (Stateless JWT)
                                              ▼
                                  ┌────────────────────────┐
                                  │   Express API Gateway  │
                                  │  (Zod Input Validation)│
                                  └───────────┬────────────┘
                                              │
         ┌───────────────────┬────────────────┼───────────────────┬───────────────────┐
         ▼                   ▼                ▼                   ▼                   ▼
┌──────────────────┐┌──────────────────┐┌──────────────────┐┌──────────────────┐┌──────────────────┐
│  Auth Service    ││  Employee Hub    ││ Attendance &     ││  Payroll Engine  ││ Audit & Batch    │
│  (JWT, 5-Tier    ││  (Contracts,     ││  TimeOff Service ││  (Rule DAG,      ││ WriteBuffer      │
│   RBAC Pipeline) ││   Departments)   ││  (Atomic Quota) ││   Maker-Checker) ││ (High RPS Queue) │
└────────┬─────────┘└────────┬─────────┘└────────┬─────────┘└────────┬─────────┘└────────┬─────────┘
         │                   │                   │                   │                   │
         └───────────────────┴───────────────────┼───────────────────┴───────────────────┘
                                                 ▼
                                ┌─────────────────────────────────┐
                                │   Prisma ORM + PostgreSQL       │
                                │   (ACID Transactions, Relational│
                                │    Exclusion Constraints)       │
                                └─────────────────────────────────┘
```

---

## ⚡ High-Scale Write Buffering Strategy (Millions RPS)

To sustain extreme request traffic (e.g., thousands of simultaneous employee morning clock-ins or system audit logging), PeoplePay360 implements an **In-Memory Write Buffer Queue**:

```
[ High Concurrency Ingestion (Attendance / Audit Logs) ]
                       │
                       ▼
         ┌──────────────────────────┐
         │     WriteBuffer Queue    │
         │  (Max Capacity: 50 items)│
         └─────────────┬────────────┘
                       │
                       ├────── Count Threshold (50) OR Timer (1000ms)
                       ▼
         ┌──────────────────────────┐
         │ Bulk SQL Transaction     │
         │ (1 Roundtrip createMany) │
         └──────────────────────────┘
```

- **Efficiency**: Converts $N$ sequential single-row database queries into $1$ bulk `createMany` operation.
- **Connection Preservation**: Eliminates connection pool starvation during peak operational surges.

---

## 🛡️ 4-Layer RBAC Security Pipeline

Security is enforced independently across 4 layers:

| Security Layer | Implementation Mechanism | Functional Purpose |
| :--- | :--- | :--- |
| **Layer 1: Navigation** | [`Sidebar.tsx`](file:///f:/PROJECTS/Odoo%20Final%20Round/peoplepay360-712/frontend/src/components/layout/Sidebar.tsx) | Dynamically filters sidebar links based on authenticated user permissions. |
| **Layer 2: Route Guard** | [`RoleProtectedRoute`](file:///f:/PROJECTS/Odoo%20Final%20Round/peoplepay360-712/frontend/src/App.tsx) | Blocks direct URL navigation; redirects unauthorized users to `/dashboard` with toast alert. |
| **Layer 3: Action Middleware** | [`auth.ts Middleware`](file:///f:/PROJECTS/Odoo%20Final%20Round/peoplepay360-712/backend/src/middleware/auth.ts) | Backend Express authorization (`requireHRMPlus`, `requireHRPUPlus`, `requireAdmin`). |
| **Layer 4: Data Level** | Prisma + PostgreSQL Constraints | Enforces Maker-Checker rules (`computedBy !== validatedBy`) and prevents overlapping active contracts. |

---

## 🔐 Seeded Enterprise Test Credentials

The database contains 5 pre-configured accounts representing each system role:

| Role Level | Role Name | Email Address | Password | Access Rights |
| :--- | :--- | :--- | :--- | :--- |
| **1. Admin** | System Administrator | `admin@peoplepay360.dev` | `Admin@123` | User provisioning (`/admin/users`), audit logs, system roles |
| **2. HR Manager** | HR Manager | `hr.manager@peoplepay360.dev` | `Manager@123` | Employees, Departments, Work Schedules, Attendance, Time-off approvals |
| **3. Payroll User** | HR Payroll Specialist | `payroll.user@peoplepay360.dev` | `Payroll@123` | Payrun preview, computation, salary structures, payslip generation |
| **4. Payroll Manager**| HR Payroll Manager | `payroll.manager@peoplepay360.dev` | `Payroll@123` | Maker-Checker validation, payrun marking as paid, disbursement |
| **5. Employee** | Standard Employee | `employee.demo@peoplepay360.dev` | `Employee@123` | Personal portal (`/dashboard/me`), self check-in/out, leave requests, own payslips |

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite 6, Tailwind CSS v4, Lucide Icons, React Router v7
- **Backend**: Node.js, Express, TypeScript, Prisma ORM 5, Zod Schema Validation, PDFKit
- **Database**: PostgreSQL 16 (Relational integrity, ACID compliance, exclusion constraints)
- **Quality Assurance**: Native E2E Test Suite (TypeScript runner hitting live HTTP server)

---

## 🚀 Quick Start & Installation

### 1. Prerequisites
- Node.js `v18.x` or higher
- PostgreSQL `v14+` running locally on port `5432` (Database: `peoplepay360`)

### 2. Environment Setup
Clone the repository and install dependencies for both backend and frontend:

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

### 3. Database Migration & Seeding
Configure `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/peoplepay360?schema=public"
JWT_SECRET="super-secret-enterprise-key-360"
PORT=4000
```

Initialize database tables and seed test data:
```bash
cd backend
npx prisma db push --force-reset
npx ts-node prisma/seed.ts
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

### 📈 Test Output Matrix:
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
- 📑 [Comprehensive Test Suite Specification](file:///f:/PROJECTS/Odoo%20Final%20Round/peoplepay360-712/docs/TEST_CASES.md)
- 📐 [High-Scale System Design & Architecture](file:///f:/PROJECTS/Odoo%20Final%20Round/peoplepay360-712/docs/SYSTEM_DESIGN.md)
- 📊 [Database Schema & ERD Notes](file:///f:/PROJECTS/Odoo%20Final%20Round/peoplepay360-712/docs/03_DB_DESIGN_NOTES.md)
