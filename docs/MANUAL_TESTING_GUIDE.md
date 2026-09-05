# PeoplePay360 — Team Manual Testing & QA Workflow Guide

This document contains step-by-step test workflows, role credentials, actions, and expected outputs to verify every core module of the **PeoplePay360** HR & Payroll Platform. Share this guide with teammates and mentors for manual testing.

---

## 🔑 Test Credentials Summary (All 5 System Roles)

The database is seeded with **250 test user accounts** across all 5 roles. Use any of the following canonical accounts for quick role-based testing:

| Role | Email | Password | Access Rights & Scope |
|---|---|---|---|
| **ADMIN** | `admin@peoplepay360.dev` | `Admin@123` | Full system access, User Management, Role Assignment |
| **HR_MANAGER** | `hr.manager@peoplepay360.dev` | `Manager@123` | Employees, Contracts, Working Schedules, Attendance, Time Off Approvals |
| **HR_PAYROLL_USER** | `payroll.user@peoplepay360.dev` | `Payroll@123` | View HR data, Run Payrun Wizard, Compute draft payslips |
| **HR_PAYROLL_MANAGER**| `payroll.manager@peoplepay360.dev` | `Payroll@123` | Full Payroll CRUD, Salary Structures & Rules, Validate & Mark Payruns Paid |
| **EMPLOYEE** | `employee.demo@peoplepay360.dev` | `Employee@123` | Self-Service Portal: View profile, Check-In/Out Attendance, Request Time Off |

*(Additional role logins available: `admin01@peoplepay360.dev` to `admin04@peoplepay360.dev`, `hrmanager01@peoplepay360.dev` to `hrmanager19@peoplepay360.dev`, `payrolluser01@peoplepay360.dev` to `payrolluser14@peoplepay360.dev`, `payrollmanager01@peoplepay360.dev` to `payrollmanager09@peoplepay360.dev`, `emp001@peoplepay360.dev` to `emp199@peoplepay360.dev`).*

---

## 🧪 Module Workflows & Step-by-Step Test Scenarios

### Workflow 1: System Admin & User Provisioning
**Goal**: Verify that Admins can provision new accounts, assign system roles, and audit users.

1. **Login**: Go to `http://localhost:3001/login` and log in as `admin@peoplepay360.dev` (`Admin@123`).
2. **Navigate**: Click **Admin** in the side navbar $\rightarrow$ **User Management** (`/admin/users`).
3. **Verify Table**:
   - Check pagination controls at bottom of table (Page 1 of 25, items per page: 10/25/50/100).
   - Test search box (type "Rahul" or "Priya").
4. **Provision User**:
   - Click **+ New User** button.
   - Select an existing Employee, enter email `newhr@peoplepay360.dev`, password `Password@123`, role `HR_MANAGER`.
   - Click **Save**.
5. **Expected Output**:
   - ✅ Toast notification: *"User created successfully."*
   - ✅ New user appears in table with `HR_MANAGER` badge.
   - ✅ Audit log records user creation.

---

### Workflow 2: Employee & Contract Management (Smart Overlap Detection)
**Goal**: Verify employee creation, active contract anti-overlap protection, and auto-expiry workflow.

1. **Login**: Log in as `hr.manager@peoplepay360.dev` (`Manager@123`).
2. **View Employees**: Navigate to **Employees** (`/employees`).
   - Switch between **List View** and **Kanban View**.
   - Search by name or filter by department.
3. **Create Employee**:
   - Click **+ Add Employee**.
   - Fill in: Name = `Aniket Deshmukh`, Department = `Engineering`, Position = `Software Engineer`.
   - Click **Save**.
4. **Test Contract Overlap Protection**:
   - Navigate to **Contracts** (`/contracts`) $\rightarrow$ Click **+ New Contract**.
   - Select employee `Arjun Mehta` (who already has an active contract).
   - Select Wage = `95000`, Start Date = Today. Status = `Active`.
   - Click **Create Contract**.
   - **Expected Output**:
     - 🛑 Error notification: *"This employee already has an active contract. An employee can only have one active contract at a time. Please end or expire the current active contract first..."* (No raw UUIDs or technical codes).
5. **Test Smart Auto-Expire**:
   - In the same modal, an warning banner highlights the current active contract.
   - Check the box: **"Set current active contract to Expired automatically"**.
   - Click **Create Contract**.
   - **Expected Output**:
     - ✅ Contract created successfully.
     - ✅ Old contract status automatically transitions to `Expired`, new contract becomes `Active`.

---

### Workflow 3: Attendance Check-In / Check-Out & Hours Calculation
**Goal**: Verify self-service check-in/out and automatic `worked_hours` calculation.

1. **Login**: Log in as Employee `employee.demo@peoplepay360.dev` (`Employee@123`).
2. **Navigate**: Go to **Attendance** (`/attendance`).
3. **Check-In**:
   - Click **Check In** button.
   - **Expected Output**: Timestamp recorded, live indicator shows "Checked In".
4. **Check-Out**:
   - Click **Check Out** button.
   - **Expected Output**:
     - ✅ `worked_hours` is automatically calculated from `(checkOut - checkIn)`.
     - ✅ Attendance row appears in list marked `Present`.
     - ✅ No manual entry of worked hours is allowed or required.

---

### Workflow 4: Time Off Allocation & Request Approval Loop
**Goal**: Verify leave allocation balance check, request submission, and atomic balance deduction upon approval.

1. **Check Balance & Request Leave** (As Employee):
   - Log in as `employee.demo@peoplepay360.dev` (`Employee@123`).
   - Navigate to **Time Off** (`/timeoff`).
   - Observe Leave Allocation Summary (e.g. Annual Leave: 18 Days Total, 0 Taken, 18 Remaining).
   - Click **+ Request Time Off**.
   - Select Type = `Annual Leave`, Start Date = Tomorrow, End Date = Day after tomorrow (2 weekdays), Duration = 2 days.
   - Click **Submit Request**.
   - **Expected Output**: Request created with status `Draft / Pending`. Balance remains 18 days (deduction occurs only on approval).
2. **Approve Leave Request** (As HR Manager):
   - Log in as `hr.manager@peoplepay360.dev` (`Manager@123`).
   - Navigate to **Time Off** (`/timeoff`) $\rightarrow$ Pending Requests tab.
   - Click **Approve** on Arjun Mehta's request.
   - **Expected Output**:
     - ✅ Request status changes to `Approved`.
     - ✅ Employee's Annual Leave balance is atomically deducted from 18 to 16 days.

---

### Workflow 5: Salary Structures, Rules & Payrun Execution Pipeline
**Goal**: Verify payrun state machine (`Draft` $\rightarrow$ `Computed` $\rightarrow$ `Validated` $\rightarrow$ `Paid`), rule calculation, and PDF export.

1. **Review Salary Rules** (As HR Payroll Manager):
   - Log in as `payroll.manager@peoplepay360.dev` (`Payroll@123`).
   - Go to **Payroll** $\rightarrow$ **Salary Structures** (`/payroll/structures`).
   - Click **Standard Corporate Structure** to view rule sequence:
     - `BASIC` (Seq 10, Formula: `WAGE / 30 * WORKED_DAYS`)
     - `HRA` (Seq 20, 20% of BASIC)
     - `TRANSPORT` (Seq 30, Fixed 2500)
     - `GROSS` (Seq 40, `BASIC + HRA + TRANSPORT`)
     - `PF` (Seq 50, 12% of BASIC)
     - `TAX` (Seq 60, 10% of GROSS)
     - `NET` (Seq 70, `GROSS - PF - TAX`)
2. **Execute Payrun Wizard** (As HR Payroll User):
   - Log in as `payroll.user@peoplepay360.dev` (`Payroll@123`).
   - Go to **Payroll** $\rightarrow$ **Payruns** (`/payroll/payruns`).
   - Click **+ New Payrun**.
   - Step 1: Select Structure = `Standard Corporate Structure`, Period = `Current Month`.
   - Step 2: Select Employees $\rightarrow$ Click **Compute Payrun**.
   - **Expected Output**:
     - ✅ Payrun created with status `COMPUTED`.
     - ✅ 250 payslips generated. Clicking any payslip shows complete salary line items matching mathematical formulas.
3. **Validate & Mark Paid** (As HR Payroll Manager):
   - Log in as `payroll.manager@peoplepay360.dev` (`Payroll@123`).
   - Open the computed Payrun $\rightarrow$ Click **Validate Payrun** (State becomes `VALIDATED`).
   - Click **Mark as Paid** (State becomes `PAID`).
   - **Expected Output**:
     - ✅ Payrun state locked as `PAID`.
     - ✅ PDF Payslip generator creates official payslip document.
     - ✅ Email dispatch triggered for employee pay stubs.

---

### Workflow 6: Payroll Dashboard & Dynamic Analytics
**Goal**: Verify real-time payroll metrics, department cost breakdowns, and period filtering.

1. **Login**: Log in as `admin@peoplepay360.dev` or `payroll.manager@peoplepay360.dev`.
2. **Navigate**: Go to **Dashboard** (`/dashboard`).
3. **Verify KPIs**:
   - Total Net Paid ($) across organization.
   - Total Payslips Generated (750 payslips from July, August, September payruns).
   - Average Monthly Salary.
   - Attendance Health % and Approved Time Off Days.
4. **Test Filters**:
   - Filter by Department = `Engineering`.
   - Filter by Period = `August 2026`.
   - **Expected Output**:
     - ✅ All KPI cards and "Salary Cost by Department" chart instantly recalculate based on selected filters.

---

## 📋 Comprehensive Verification Checklist

| # | Feature / Test Scenario | Role | Expected Result | Status |
|---|---|---|---|---|
| 1 | Login with valid role credentials | All Roles | Redirected to role dashboard; JWT stored safely | PASS |
| 2 | Table Pagination (10, 25, 50, 100 per page) | All Roles | Smooth page switching across all 8 tables | PASS |
| 3 | Provision User Account | Admin | User created & linked to employee with RBAC role | PASS |
| 4 | Employee Search & Kanban View | HR Manager | Instant filtering and view toggle | PASS |
| 5 | Active Contract Overlap Error Guard | HR Manager | Humanized error message displayed; no UUIDs | PASS |
| 6 | Auto-Expire Previous Contract Option | HR Manager | Old contract expired, new contract set active | PASS |
| 7 | Attendance Check-In / Check-Out | Employee | `worked_hours` computed automatically | PASS |
| 8 | Leave Allocation Balance Check | Employee | Request blocked if duration > remaining balance | PASS |
| 9 | Time Off Approval & Atomic Balance Deduction | HR Manager | Balance deducted immediately upon approval | PASS |
| 10| Sequenced Salary Rule Calculation | Payroll Mgr | Rules execute strictly in sequence order | PASS |
| 11| Payrun State Machine (`Draft` $\rightarrow$ `Paid`) | Payroll Mgr | Strict state transitions enforced | PASS |
| 12| Payslip PDF & Bulk Email Dispatch | Payroll User | PDF generated & email sent upon completion | PASS |
| 13| Payroll Dashboard Filtering | Admin/Payroll | Dynamic recalculation by Dept and Period | PASS |
