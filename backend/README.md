# PeoplePay360 Backend

Node.js + Express + TypeScript + Prisma + PostgreSQL. Contracts: `../docs/02_API_CONTRACTS.md`. Schema: `../docs/01_DATABASE_SCHEMA.md`.

## Setup

```
npm install
cp .env.example .env      # then set a real DATABASE_URL pointing at your local Postgres
npm run prisma:migrate    # creates the tables
npm run prisma:seed       # creates 5 roles + an admin login
npm run dev                # starts on http://localhost:4000
```

Login with `admin@peoplepay360.dev` / `Admin@123` against `POST /api/auth/login` to get a token, then send it as `Authorization: Bearer <token>` on everything else.

## What's implemented (feat/backend-employee-crud)

- Auth: login, `/me`
- Departments: CRUD (HRM+)
- Employees: list/detail (role-filtered: HRM+ see everyone, Employee sees only self), create/update (HRM+), soft-delete (Admin), smart-button sub-resources (`/contracts`, `/attendance`, `/time-off`, `/payslips`)

## Not yet built (future branches, per docs/02_API_CONTRACTS.md)

Contracts, Working Schedules, Attendance, Time Off, Salary Structures/Rules, Payrun, Payslips, Dashboard. Add each as its own module under `src/modules/`, register its router in `src/routes/index.ts`.
