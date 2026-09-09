# PeoplePay360

PeoplePay360 is a full-stack HR management and payroll platform for managing employees, contracts, attendance, time off, salary structures, pay runs, payslips, reports, audit logs, and administrative access control in one system.

It is designed as a production-oriented portfolio project: the UI is role-aware, the API is independently protected, payroll actions are governed by maker-checker controls, database writes are transactional, and the project includes local, Docker, and free-tier deployment paths.

[![Frontend build](https://img.shields.io/badge/frontend-Vite%20%2B%20React-646CFF)](./frontend)
[![Backend build](https://img.shields.io/badge/backend-Node%20%2B%20Express-339933)](./backend)
[![Database](https://img.shields.io/badge/database-PostgreSQL-4169E1)](./backend/prisma/schema.prisma)

## Product summary

PeoplePay360 covers the operational lifecycle of an employee:

1. Create an employee and place them in a department and reporting hierarchy.
2. Assign a working schedule and employment contract.
3. Track attendance, late arrivals, check-outs, corrections, and emergency check-outs.
4. Allocate and approve time off, then process employee requests against available balances.
5. Define salary structures and ordered salary rules.
6. Preview, compute, validate, and pay a payroll run.
7. Generate payslips and PDFs, optionally queue email delivery, and expose reporting dashboards.
8. Record privileged changes in an audit log for administrative review.

## Core capabilities

### Workforce management

- Employee directory with employee codes, job positions, departments, managers, status, and profile details.
- Department hierarchy and department-head relationships.
- Working schedules with weekly hours and per-day start/end times.
- Employment contracts with draft, active, expired, and cancelled states.
- Active-contract overlap protection for the same employee.
- Contract-to-salary-structure association for payroll eligibility.

### Attendance

- Employee self-service check-in and check-out.
- HR-authorized backfill and attendance correction.
- Server-side timestamps; client input cannot spoof attendance time.
- Schedule-aware check-in windows with configurable early/late tolerance in the service logic.
- Late and missing-checkout exception classification.
- Emergency checkout with reason, optional evidence upload, review, approval, and rejection.
- HR visibility across employees while standard employees remain scoped to their own records.

### Time off

- Configurable time-off types.
- Allocation management and approval.
- Employee request creation, editing, deletion, approval, refusal, and balance views.
- Weekday-aware duration calculations.
- Balance validation before approval.
- Transactional balance deduction so an approved request cannot partially update the system.

### Payroll

- Salary structures with ordered salary rules.
- Fixed, percentage, and formula-based rule computation.
- Rule dependency evaluation using named values such as `WAGE`, `BASIC`, and `WORKED_DAYS`.
- Payrun lifecycle: `draft → computed → validated → paid`.
- Contract and period eligibility checks before a payrun is created.
- Payslip line generation for basic pay, allowances, deductions, gross, and net pay.
- Maker-checker control: the user who computes a payrun cannot validate the same payrun.
- Payslip PDF generation with PDFKit.
- Bulk payslip email workflow with attachments.
- Employee self-service payslip access and HR/payroll-wide access according to role.

### Dashboards and reporting

- Role-specific dashboard views for administrators, HR managers, payroll users, payroll managers, and employees.
- Workforce, attendance, payroll, and salary-by-department summaries.
- Paginated list endpoints for larger datasets.
- Reports and downloadable PDF output.

## Roles and authorities

The system uses five application roles. Authorization is enforced in the backend; frontend navigation and route guards are usability layers, not the security boundary.

| Role | Primary authority | Typical access |
| --- | --- | --- |
| `EMPLOYEE` | Self-service | Own profile, attendance, time-off requests and balance, own contracts, own payslips, own dashboard |
| `HR_MANAGER` | Workforce operations | Employees, departments, contracts, schedules, attendance review/correction, emergency review, time-off types/allocations/approvals, workforce dashboards |
| `HR_PAYROLL_USER` | Payroll execution | Payroll structures/rules read access, payrun preview/create/compute, payslip generation and sending, payroll dashboards; also HRM-level operational access through the HRM+ group |
| `HR_PAYROLL_MANAGER` | Payroll control | Payroll rule and structure administration, payrun validation and mark-paid actions, maker-checker approval, payroll and HRM-level access |
| `ADMIN` | System governance | User provisioning, role assignment, activation/deactivation, audit log access, all HR and payroll capabilities |

### Permission groups used by the API

- `HRM_PLUS`: `HR_MANAGER`, `HR_PAYROLL_USER`, `HR_PAYROLL_MANAGER`, `ADMIN`
- `HRPU_PLUS`: `HR_PAYROLL_USER`, `HR_PAYROLL_MANAGER`, `ADMIN`
- `HRPM_PLUS`: `HR_PAYROLL_MANAGER`, `ADMIN`
- `ADMIN`: administrator-only routes

### Important authority boundaries

- Only `ADMIN` can list users, create users, change roles, deactivate/reactivate users, and read audit logs.
- `HR_MANAGER` can manage workforce operations but cannot configure salary rules or validate/pay payroll runs.
- `HR_PAYROLL_USER` can create and compute payruns but cannot validate or mark them paid.
- `HR_PAYROLL_MANAGER` can validate and mark payruns paid, subject to the maker-checker rule.
- Employees can create and manage their own requests, but cannot approve requests, correct historical attendance, or access another employee's payroll data.
- List endpoints that expose shared data apply service-layer visibility rules in addition to route-level role checks.

## Security architecture

PeoplePay360 uses defense in depth across the browser, API, service, and database layers:

1. **Navigation filtering** hides unavailable modules from the sidebar.
2. **React route guards** prevent normal direct navigation to unauthorized pages.
3. **JWT authentication** validates bearer tokens with an explicitly pinned `HS256` algorithm.
4. **Express role middleware** protects API actions independently of the frontend.
5. **Service-layer scoping** restricts employee-visible data to the authenticated employee.
6. **Zod validation** validates request payloads and query parameters before business logic.
7. **PostgreSQL and Prisma constraints** enforce uniqueness, foreign keys, status relationships, and payroll invariants.
8. **Audit logging** captures privileged changes with user, module, action, record, before/after values, and IP metadata.

### API hardening implemented

- Helmet security headers with a restrictive Content Security Policy.
- HSTS, referrer policy, frame-ancestor protection, and removal of the Express fingerprint.
- Explicit CORS origins; no wildcard CORS configuration.
- Recursive XSS sanitization of request bodies.
- Prototype-pollution key filtering for `__proto__`, `constructor`, and `prototype`.
- JSON content-type enforcement for mutating requests.
- HTTP parameter pollution protection using both `hpp` and scalar normalization.
- Compression for API responses.
- Structured error envelopes that do not expose stack traces or internal exception details.
- Tiered rate limiting for general API traffic, login, sensitive account actions, and admin provisioning.
- Bcrypt password hashing with configurable cost and password reset tokens with expiry/used state.
- Sensitive request fields are redacted from frontend debug logging.
- No-store response headers for sensitive API responses.

## Technology stack

### Frontend

- React 18
- TypeScript
- Vite
- React Router 6
- TanStack React Query
- Tailwind CSS 4 with the Vite plugin
- Axios
- Framer Motion
- Recharts
- Lucide React
- React Hot Toast
- `date-fns`, `clsx`, and `loglevel`

### Backend

- Node.js 20+
- Express 4
- TypeScript
- Prisma ORM 5
- PostgreSQL
- Zod
- JWT with `jsonwebtoken`
- `bcryptjs`
- BullMQ and `ioredis`
- Nodemailer
- PDFKit
- Multer
- Helmet, CORS, HPP, compression, and Express Rate Limit
- Winston and Morgan logging
- `isolated-vm` for controlled formula evaluation

### Tooling and delivery

- npm lockfiles for repeatable installs
- Prisma migrations and seed scripts
- Dockerfiles for frontend and backend
- Docker Compose for local PostgreSQL and Redis
- Render Blueprint configuration for the API
- Vercel SPA configuration for the frontend
- Free-tier deployment guide using Vercel, Render, Neon, and optional Upstash Redis

## Performance and optimization work

### Frontend optimization

- Route-level lazy loading with `React.lazy` and `Suspense` so large application pages are not loaded on the landing page.
- Vite production bundling and chunk generation.
- React Query caching with a five-minute stale window, one retry, and disabled refetch-on-focus for predictable dashboard behavior.
- Reusable API client with centralized authentication, error normalization, and response-envelope handling.
- Centralized loading, empty, error, modal, pagination, toast, and error-boundary components.
- Responsive layout with reusable navigation, cards, tables, forms, badges, and dialogs.
- Theme context and dark-mode support.
- Frontend logging with sensitive values redacted.
- Vercel rewrite configuration so BrowserRouter routes continue to work after refresh or direct navigation.

### Backend and database optimization

- Consistent pagination with server-side `skip`, `take`, total counts, and a maximum page size of 100.
- Selective Prisma relation loading instead of relying on implicit joins.
- Parallelized independent database reads using `Promise.all` in dashboard and list services.
- Transactional workflows for time-off approval, payroll writes, and other multi-record updates.
- Buffered audit writes with bulk insertion to reduce database round trips under concurrency.
- Compression and structured logging at the HTTP boundary.
- Graceful shutdown that closes the HTTP server, email worker, and Prisma connection.
- Database indexes on common foreign-key and lookup paths.
- Unique constraints for email, employee codes, payslip numbers, salary-rule ordering, and employee/payrun pairs.
- Prisma migration deployment during production startup.
- Email queue integration with an optional Redis-free fallback for free deployments.
- Lazy creation of upload directories for clean containers and fresh environments.

## Architecture

```text
                         ┌────────────────────────┐
                         │ Vercel Static Frontend  │
                         │ React + Vite + Router   │
                         └───────────┬────────────┘
                                     │ HTTPS / JSON / JWT
                         ┌───────────▼────────────┐
                         │ Render Node API         │
                         │ Express + RBAC + Zod   │
                         └──────┬────────┬─────────┘
                                │        │
                   ┌────────────▼──┐  ┌──▼──────────────┐
                   │ Neon Postgres │  │ Upstash Redis   │
                   │ Prisma + SQL  │  │ optional BullMQ │
                   └───────────────┘  └─────────────────┘
```

The backend follows a modular structure:

```text
backend/src
├── config          environment configuration
├── middleware      auth, security, rate limiting, errors
├── modules         auth, admin, employees, payroll, attendance, etc.
├── queues          email queue and worker
├── routes          API composition
└── utils           audit, mail, PDF, upload, pagination, logging
```

The frontend follows a feature-oriented structure:

```text
frontend/src
├── api              Axios API modules
├── components       reusable UI and layout components
├── context          auth, theme, and toast state
├── hooks            data-fetching hooks
├── pages            auth, landing, dashboard, HR, payroll, reports
├── types             shared frontend types
└── utils             logging, currency, pagination helpers
```

## API modules

All application endpoints are mounted below `/api` and use a consistent `{ success, data, error }` response envelope.

| API area | Responsibility |
| --- | --- |
| `/api/auth` | Login, current-user lookup, password change, password reset |
| `/api/departments` | Department hierarchy and management |
| `/api/employees` | Employee directory and profiles |
| `/api/contracts` | Employment contracts and overlap protection |
| `/api/working-schedules` | Working schedule definitions and assignments |
| `/api/attendance` | Check-in/out, corrections, emergencies, evidence uploads |
| `/api/time-off` | Types, allocations, balances, requests, approvals |
| `/api/salary-structures` | Salary structures and rule configuration |
| `/api/payruns` | Preview, create, compute, validate, pay, and email payslips |
| `/api/payslips` | Payslip list, detail, and PDF access |
| `/api/dashboard` | Role-aware operational summaries |
| `/api/reports` | Report data and PDF output |
| `/api/admin` | User administration and audit logs |

The health endpoint is available at `/health` and is intentionally outside the API rate limit.

## Data model

The Prisma schema models the main business relationships:

- Access control: `Role`, `Permission`, `RolePermission`, `User`, `UserRole`, `AuditLog`.
- HR core: `Department`, `Employee`, `WorkingSchedule`, `ScheduleLine`, `Contract`.
- Attendance: `Attendance` with emergency state and evidence metadata.
- Time off: `TimeOffType`, `TimeOffAllocation`, `TimeOffRequest`.
- Payroll: `SalaryStructure`, `SalaryRule`, `Payrun`, `Payslip`, `PayslipLine`.
- Authentication recovery: `PasswordResetToken`.

The schema uses UUID identifiers, PostgreSQL decimal fields for monetary values, mapped snake_case database columns, foreign keys, indexes, unique constraints, and migration history under `backend/prisma/migrations`.

## Local development

### Prerequisites

- Node.js 20 or newer
- npm
- PostgreSQL 14 or newer
- Redis only if you want durable BullMQ email jobs locally; the application can run without Redis using the in-process fallback

### Install

```bash
git clone <repository-url>
cd peoplepay360-712

cd backend
npm ci
npx prisma generate

cd ../frontend
npm ci
```

### Configure the backend

Copy `backend/.env.example` to `backend/.env` and set at least:

```env
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/peoplepay360?schema=public
JWT_SECRET=replace-with-a-long-random-secret
```

Set `CORS_ORIGIN` when the frontend runs on a different origin. Set `REDIS_URL` when durable email jobs are needed.

### Migrate and seed

```bash
cd backend
npx prisma migrate dev
npm run prisma:seed
```

The seed script creates demo roles, users, employees, departments, schedules, contracts, attendance, leave, salary structures, payruns, and payslip data. Seed data is for demonstration only and must not be used as production credentials.

### Run the application

Terminal 1:

```bash
cd backend
npm run dev
```

Terminal 2:

```bash
cd frontend
npm run dev
```

The backend runs on `http://localhost:4000`. Vite runs on its configured development port and proxies `/api` requests to the backend.

## Demo accounts

The seed data includes representative accounts for each role. The exact seed credentials are maintained in `backend/prisma/seed.ts` and should be changed before sharing a deployed demo.

| Role | Example account |
| --- | --- |
| Admin | `admin@peoplepay360.dev` |
| HR Manager | `hr.manager@peoplepay360.dev` |
| HR Payroll User | `payroll.user@peoplepay360.dev` |
| HR Payroll Manager | `payroll.manager@peoplepay360.dev` |
| Employee | `employee.demo@peoplepay360.dev` |

Do not publish real passwords, production secrets, database URLs, SMTP credentials, or JWT secrets in the repository. The committed `.env.example` files contain placeholders only.

## Testing and verification

Backend TypeScript build:

```bash
cd backend
npm run build
```

Frontend production build:

```bash
cd frontend
npm run build
```

End-to-end smoke test, against a running backend and seeded database:

```bash
cd backend
npm run test:e2e
```

The smoke suite covers authentication, employee and department setup, salary rules, contract overlap rejection, attendance, time off, payroll computation, payslip math, maker-checker enforcement, admin provisioning, and dashboard summaries.

## Deployment

The recommended zero-cost portfolio deployment is:

- Vercel for the Vite frontend.
- Render Free for the Node/Express API.
- Neon Free for PostgreSQL.
- Upstash Redis optionally for persistent email jobs.

Read the complete deployment checklist in [DEPLOYMENT.md](./DEPLOYMENT.md). The repository includes:

- `render.yaml` for Render Blueprint deployment.
- `frontend/vercel.json` for Vite build output and SPA rewrites.
- `backend/Dockerfile` and `frontend/Dockerfile` for container deployment.
- `docker-compose.yml` for local PostgreSQL, Redis, backend, and frontend services.
- `backend/.env.example` and `frontend/.env.example` for configuration templates.

### Production considerations

- Render Free instances sleep when idle.
- Render Free Postgres is intentionally not used because it expires after 30 days.
- Local evidence uploads are ephemeral on free web instances; durable object storage should be added for a production HR deployment.
- Redis is optional, but durable queues are recommended for production email delivery.
- Configure an SMTP provider and an allowed SMTP port or replace the mailer with an HTTPS email provider adapter.
- Rotate all seeded credentials and generated secrets before exposing a deployment publicly.

## Repository guide

| Path | Purpose |
| --- | --- |
| `backend/src/modules` | Domain modules and business services |
| `backend/src/middleware` | Authentication, authorization, security, rate limiting, error handling |
| `backend/prisma/schema.prisma` | Database source of truth |
| `backend/prisma/migrations` | Versioned database migrations |
| `backend/prisma/seed.ts` | Demo and test data generation |
| `frontend/src/pages` | Application screens and role-specific views |
| `frontend/src/components` | Reusable UI and layout primitives |
| `frontend/src/api` | Typed API access modules |
| `docs` | Architecture, API contracts, QA, schema, and role documentation |
| `DEPLOYMENT.md` | Free-tier deployment instructions |

## Documentation

- [Free deployment guide](./DEPLOYMENT.md)
- [Project brief](./docs/00_PROJECT_BRIEF.md)
- [Database schema](./docs/01_DATABASE_SCHEMA.md)
- [API contracts](./docs/02_API_CONTRACTS.md)
- [Database design notes](./docs/03_DB_DESIGN_NOTES.md)
- [System design](./docs/SYSTEM_DESIGN.md)
- [QA test plan](./docs/QA_TEST_PLAN.md)
- [Manual testing guide](./docs/MANUAL_TESTING_GUIDE.md)
- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)

## Engineering highlights

PeoplePay360 demonstrates practical full-stack engineering across:

- Domain-driven modular API design.
- Secure multi-role authorization with data-level visibility rules.
- Transactional business workflows for finance and leave management.
- Explainable payroll formulas and ordered rule evaluation.
- PDF generation and asynchronous email delivery.
- Responsive, role-aware React application design.
- Database migrations, deterministic seeding, and repeatable builds.
- Production-oriented observability, error handling, and graceful shutdown.
- Containerized local development and free-tier cloud deployment.
