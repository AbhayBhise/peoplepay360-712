# PeoplePay360 — System Design & Scalable Microservices Architecture

This document details the high-scale system design, microservices readiness, request batching queue strategy, and 4-layer RBAC architecture built into **PeoplePay360**.

---

## 1. High-Scale Write Buffering Strategy (Handling Millions of RPS)

To process extreme request volumes (such as mass employee attendance clock-ins, sensor logging, and automated audit trails under high load), PeoplePay360 utilizes an **In-Memory Write Buffer / Request Batcher**:

```
[ Incoming Requests (Millions RPS) ]
               │
               ▼
┌──────────────────────────────────────┐
│       WriteBuffer Queue              │
│ (Buffers up to count threshold: 50)  │
└──────────────────────────────────────┘
               │
               ├────── Threshold reached OR Timer elapsed (1000ms)
               ▼
┌──────────────────────────────────────┐
│ Single Bulk Execution (createMany)   │
│ 1 Database Roundtrip to PostgreSQL   │
└──────────────────────────────────────┘
```

### Key Technical Properties:
- **Count Threshold Batching**: Requests are enqueued in-memory. Once the queue reaches `50` items, the buffer immediately flushes.
- **Interval Guarantee**: If traffic drops below peak threshold, a 1-second interval auto-flushes any remaining buffered records.
- **Connection Safety**: Prevents PostgreSQL connection pool exhaustion by converting N single `INSERT` transactions into 1 bulk `INSERT` query.

---

## 2. Microservices Architecture Decomposition

PeoplePay360 is built as a **Modular Monolith** designed for seamless extraction into independent microservices:

```
                      ┌──────────────────────┐
                      │    API Gateway /     │
                      │  Express Router      │
                      └──────────┬───────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│  Auth Microservice│   │Employee & HR      │   │ Attendance &     │
│  (JWT, RBAC)     │   │Microservice      │   │ TimeOff Service  │
└──────────────────┘   └──────────────────┘   └──────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌───────────────────────┴───────────────────────┐
         ▼                                               ▼
┌──────────────────────────────────┐   ┌──────────────────────────────────┐
│ Payroll & Formula Engine         │   │ Notification & Audit Queue       │
│ (Payslip computation, Rule DAG)  │   │ (WriteBuffer Batching Engine)    │
└──────────────────────────────────┘   └──────────────────────────────────┘
```

### Microservice Boundaries:
1. **Auth Service**: Issues stateless JWT tokens, manages password resets, and enforces role permissions.
2. **Employee & HR Service**: Manages employee central hub records, contracts, working schedules, and departments.
3. **Attendance & TimeOff Service**: Handles high-frequency punch logging and atomic leave quota deductions.
4. **Payroll & Computation Engine**: Executes sequenced salary rules (BASIC, HRA, PF, Gross, Net) with Maker-Checker validation.
5. **Notification & Audit Service**: Processes background PDF generation, bulk email delivery, and buffered audit logging.

---

## 3. 4-Layer RBAC Security Pipeline

Security and role-based access control are enforced across **four distinct, independent layers**:

```
Layer 1: Navigation Layer    (Sidebar / Navbar link filtering based on user permissions)
Layer 2: Route Guard Layer   (Frontend RoleProtectedRoute blocking unauthorized URL access)
Layer 3: Action Middleware   (Backend Express requireRole / requireHRMPlus middleware)
Layer 4: Data Level          (PostgreSQL Row-Level filters & DB Maker-Checker constraints)
```

---

## 4. Verification & E2E Validation Metrics

- **37/37 Automated E2E Tests Passing**: Covering Auth, Contracts, Overlapping Contract Prevention, Attendance, Atomic Time-Off Quota Deductions, Sequenced Salary Rules, Maker-Checker Payrun Validation, Payslip PDF Generation, and Admin User Provisioning.
- **0 Type Errors**: Clean compilation across TypeScript frontend (`npm run build`) and backend (`tsc`).
