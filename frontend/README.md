# PeoplePay360 — Frontend Application (React + TypeScript)

This is the frontend client for the **PeoplePay360** HR & Payroll Platform built by Vaishnavi on the `frontend` branch for the Odoo Hackathon.

## Architecture & Features Built Against Live Backend API

### 1. Authentication & RBAC (`/login`)
- Authenticates directly against `POST /api/auth/login`.
- Automatically stores JWT in `localStorage` and injects `Authorization: Bearer <token>` on all requests via Axios interceptor.
- Validates session on mount via `GET /api/auth/me`.
- Role-based navigation with support for all 5 system roles: **Employee**, **HR Manager**, **HR Payroll User**, **HR Payroll Manager**, and **Admin**.
- Quick demo login switcher for evaluator testing.

### 2. Unified Employee Operational Hub (`/employees` & `/employees/:id`)
- **Kanban & List views** switchable via toggle button (`GET /api/employees?department_id=&status=&search=`).
- Unified Employee Form (`GET /api/employees/:id`) displaying full employee profile.
- **Smart Buttons** at the top with live counts from the API response:
  - **Contracts (N)** → links to `GET /api/employees/:id/contracts`
  - **Attendance (N)** → links to `GET /api/employees/:id/attendance`
  - **Time Off (N)** → links to `GET /api/employees/:id/time-off`
  - **Payslips (N)** → links to `GET /api/employees/:id/payslips`
- Create & Edit employee modal with department, manager, and working schedule pickers.

### 3. Departments Module (`/departments`)
- Department hierarchy table (`GET /api/departments`).
- Create and edit department modal with validation (name required, no self-parenting).
- Delete department confirmation modal.

### 4. Contracts Module (`/contracts`)
- Highlights active contracts with a distinct badge (`is_active_for_today`).
- Create contract modal linking employee, department, monthly wage, and salary structure.

### 5. Working Schedules (`/working-schedules`)
- List of shift patterns and standard weekly hours.
- Schedule editor with **real-time live weekly hours auto-calculator**.

### 6. Attendance & Worked Hours (`/attendance`)
- Attendance log table with **visual exception flags** (`Missing Check-Out`, `Late Entry`).
- Live check-in and check-out punches.
- HR attendance correction modal.

### 7. Time Off & Leave Management (`/time-off`)
- Types, Allocations, and Requests tabs.
- Leave Request Form with **real-time remaining quota balance lookup** before submission.
- HR Manager Approve and Refuse workflow.

### 8. Payroll Engine & Payrun 2-Step Wizard (`/payroll/payruns`, `/payroll/payslips`, `/payroll/salary-structures`)
- **Genuine 2-Step Payrun Wizard**:
  - **Step 1**: Structure + Period dates → calls `POST /api/payruns/preview` to query eligible employees covered by active contracts.
  - **Step 2**: Explicit employee checkboxes selection → `POST /api/payruns`.
- **Payrun Processing Screen**:
  - Visible status progression stepper: `Draft → Computed → Validated → Paid`.
  - Workflow action triggers: `Compute`, `Validate`, `Mark as Paid`, `Send Payslips`.
  - Operational warnings box surfaced before validation.
- **Payslip Screen**:
  - Structured itemized breakdown table: `Category | Rule Name | Amount`.
  - PDF Print / Export trigger.
- **Salary Structures & Sequenced Rules**:
  - Rule execution sequence configuration (Basic → Allowance → Deduction → Gross → Net).

### 9. Executive Dashboard (`/dashboard`)
- Live aggregated KPI cards: **Total Net Paid**, **Payslips Generated**, **Average Salary**, **Approved Time Off**, **Attendance Health**.
- Department Salary distribution chart, Attendance health metrics, and filter bar (Period, Department, Employee Type).

---

## Running Locally

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start development server (connected to http://localhost:4000)
npm run dev

# 4. Build for production
npm run build
```
