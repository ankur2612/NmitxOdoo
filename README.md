# Dayflow

**Every workday, perfectly aligned.**

A multi-tenant Human Resource Management System built on the MERN stack. Companies
register themselves, admins onboard employees, and everyone tracks attendance, time off,
and payroll from one place.

Built for the NMIT × Odoo hackathon.

---

## What it does

| Module | Employee | Admin |
|---|---|---|
| **Directory** | Browse the team, see who's in the office | Add employees, edit any profile |
| **Profile** | Resume, private info, bank details, own password | Everything, plus salary |
| **Attendance** | Check in / out, month view with own totals | Day view across the whole company |
| **Time off** | Request leave, year calendar, live balances | Approve or reject, manage allocations |
| **Payroll** | — | Set a wage, components compute automatically |
| **Settings** | — | Departments, leave types, public holidays |

Employees never self-register. An admin creates the account, and Dayflow mints a Login ID
and a one-time password that must be replaced at first sign in.

### Login IDs

Every employee gets a readable, permanent identifier:

```
OI      JODO         2026        0001
│       │            │           └── joining number for that year
│       │            └────────────── year joined
│       └─────────────────────────── first two letters of first + last name
└─────────────────────────────────── two-letter company code
```

Sign in with either the Login ID or the work email.

### Salary components

Set a monthly wage and the structure derives itself. At ₹50,000:

| Component | Amount | Basis |
|---:|---:|---|
| Basic Salary | 25,000.00 | 50% of wage |
| House Rent Allowance | 12,500.00 | 50% of basic |
| Standard Allowance | 4,167.00 | fixed |
| Performance Bonus | 2,082.50 | 8.33% of basic |
| Leave Travel Allowance | 2,082.50 | 8.33% of basic |
| Fixed Allowance | 4,168.00 | the remainder |

Plus PF at 12% of basic (employee and employer) and ₹200 professional tax. Components
always total exactly the wage, and a structure that would exceed it is rejected.

---

## Stack

**Backend** — Node 20, Express 5, MongoDB Atlas via Mongoose 9, JWT auth, bcryptjs,
Cloudinary for uploads.

**Frontend** — React 19, Vite, Tailwind v4, React Router 7, axios.

---

## Getting started

**Prerequisites:** Node 20+, a MongoDB Atlas cluster, and a Cloudinary account (free tier
is fine).

```bash
git clone <repo-url> && cd hrms
```

### Backend

```bash
cd backend
npm install
cp .env.example .env      # then fill in the values below
npm run seed:demo         # optional: creates a demo company with data
npm run dev               # http://localhost:5000
```

`.env`:

```ini
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/dayflow
JWT_SECRET=a-long-random-string
JWT_EXPIRES_IN=7d

CLOUDINARY_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Frontend

```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```

The API base URL defaults to `http://localhost:5000/api`. Override it with
`VITE_API_URL` in `frontend/.env` if your backend runs elsewhere.

### Demo accounts

`npm run seed:demo` builds a company called **Dayflow** (`DF`) with four people, seeded
into different attendance states so no screen is empty:

| Role | Email | Login ID |
|---|---|---|
| Admin | `asha@dayflow.app` | `DFASME20260001` |
| Employee | `ravi@dayflow.app` | `DFRAKU20260002` |
| Employee | `priya@dayflow.app` | `DFPRNA20260003` |
| Employee | `imran@dayflow.app` | `DFIMSH20260004` |

Password for all four: **`Dayflow123`**

The seed is safe to rerun — it rebuilds only the `DF` company and leaves other data alone.

---

## Project layout

```
backend/
  config/        db connection, cloudinary
  models/        10 mongoose schemas
  middleware/    auth, uploads, error handling
  controllers/   one per module
  routes/        mounted under /api
  utils/         login IDs, salary engine, date keys, attendance math
  seed/          company defaults, demo data
  test/e2e.sh    181-check API suite
frontend/src/
  components/    layout shell, shared UI
  context/       auth provider
  lib/           api client, formatters, date helpers
  pages/         auth, employees, profile, attendance, timeoff, settings
```

### API

26 endpoints under `/api`:

| Group | Routes |
|---|---|
| `/auth` | `register-company`, `login`, `me`, `change-password` |
| `/employees` | list, create, read, update, avatar, salary read/write/preview |
| `/company` | read, logo upload |
| `/attendance` | `check-in`, `check-out`, `today`, `me`, day view |
| `/leaves` | apply, mine, list, approve, reject, cancel, balance |
| `/departments`, `/leave-types`, `/allocations`, `/holidays` | settings CRUD |

Every request is scoped to the caller's company, so two tenants can never see each
other's data.

---

## Testing

```bash
cd backend && npm run test:e2e     # 181 API checks, server must be running
cd frontend && npm run lint
cd frontend && npm run build
```

The E2E suite walks the real product flow — onboarding, permissions, attendance math,
leave balances, salary computation, and tenant isolation — and deletes its own data
afterwards, so it's safe to rerun.

For browser testing, [QA.md](QA.md) has a 163-check manual pass with demo credentials.

---

## Design

Dark by default, using warm graphite surfaces rather than the usual cold slate, with a
single amber accent. Instrument Serif for display, Geist for the interface, Geist Mono for
Login IDs and every number. Tables use tabular figures so columns align.

Tokens live in [`frontend/src/index.css`](frontend/src/index.css) as a Tailwind v4
`@theme` block — change a value there and it propagates everywhere.

---

## Notes

Dates are stored as `YYYY-MM-DD` strings keyed to a single app timezone, not as `Date`
objects. Storing them as dates puts a leave starting `2026-05-13` at UTC midnight, which
compares as *before* "today at midnight IST" — so the first day of every leave silently
falls outside its own range. Strings sidestep it, and because `YYYY-MM-DD` sorts
lexicographically the same way it sorts chronologically, range queries still work.
