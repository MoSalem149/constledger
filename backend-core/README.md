# CPMS — Backend Core (`cpms-backend-core`)

Node.js + Express REST API for authentication, user management, finance planning, and reporting. Pairs with **backend-ai** (port 5000), which handles AI-assisted contract upload and field extraction. Both services share the same MongoDB database (`cpms`) and the same `JWT_SECRET`.

**Default port:** `3000` &nbsp;·&nbsp; **Module system:** ESM &nbsp;·&nbsp; **Database:** MongoDB

---

## Getting started

```bash
cp .env.example .env       # then fill in JWT_SECRET, MONGODB_URI
npm install
npm run dev                # http://localhost:3000 (nodemon)
npm test                   # run focused Vitest tests once
npm run test:watch         # re-run tests while files change
npm start                  # production mode
```

`GET /health` returns `{ "status": "ok", "service": "cpms-core" }` for liveness probes.

The tests in `tests/` cover the main finance planning invariants and report
aggregation helpers. They are intentionally database-free, so no MongoDB
instance or environment file is required to run them.

---

## Running with Docker

The Dockerfile is a multi-stage build that produces a small, non-root, signal-safe runtime image with a built-in healthcheck.

```bash
docker build -t cpms-backend-core .
docker run --rm -p 3000:3000 --env-file .env cpms-backend-core
```

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | no | Server port (default `3000`) |
| `NODE_ENV` | yes | `development` or `production` — controls log format and cookie security flags |
| `MONGODB_URI` | yes | MongoDB connection string (shared with backend-ai) |
| `JWT_SECRET` | yes | Long random secret used to sign JWTs; **must match backend-ai** |
| `JWT_EXPIRES_IN` | no | Token lifetime (default `8h`) |
| `FRONTEND_URL` | no | Extra origin allowed by CORS (localhost:5173 always allowed) |

Generate a strong `JWT_SECRET` with `openssl rand -hex 64`.

---

## Project structure

```
src/
├── app.js                  # Express app: middleware, CORS, rate limit, routes, error handler
├── index.js                # Bootstrap: load env, connect Mongo, listen
├── config/database.js      # MongoDB connection
├── controllers/            # HTTP layer — thin glue between routes and services
├── middleware/             # protect, authorize, notFound, errorHandler
├── models/                 # Mongoose schemas
├── routes/                 # Express routers (mounted under /api/*)
└── services/               # Business logic
    ├── planningService.js   # plan generation strategies + balance invariants
    ├── reportingService.js  # report aggregations + typed ReportError
    └── exportService.js     # ExcelJS workbook builders
```

---

## API endpoints

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/login` | public | Login, returns JWT via httpOnly cookie |
| POST | `/logout` | protected | Clear auth cookie |
| GET | `/me` | protected | Get current user |

### Users — `/api/users` (PMO only)

| Method | Path | Description |
|---|---|---|
| POST | `/` | Create user |
| GET | `/` | List users (excludes protected admin) |
| GET | `/:id` | Get user |
| PUT | `/:id` | Update name / email / role / isActive / password |
| DELETE | `/:id` | Hard-delete user |

> The oldest active PMO account is treated as a **protected admin** — it cannot be listed, fetched, modified, or deleted via the API.

### Finance planning — `/api/finance`

| Method | Path | Description |
|---|---|---|
| POST | `/:contractId/plans/generate` | Generate or regenerate a plan using a strategy |
| GET | `/:contractId/plan` | Read the current plan + periods + KPIs |
| PUT | `/:contractId/plan` | Manually edit periods (sum must equal contract value) |
| POST | `/:contractId/plan/confirm` | Move plan from draft to confirmed |
| GET | `/:contractId/payment-schedule` | Payment schedule view |
| GET | `/:contractId/plan/export` | XLSX export of the plan |

Supported plan strategies: `straight_line`, `s_curve` (params: `kSteepness` 3–10, default 6), `milestone_weighted` (falls back to `s_curve` if no priced milestones land in range).

Plans can only be generated for contracts with `status: active`. Regenerating
or manually editing a plan snapshots the previous plan and period rows in
`finance_plan_versions`. Manual period updates must sum to the contract value
within `0.01`.

### Reports — `/api/reports`

| Method | Path | Description |
|---|---|---|
| GET | `/contracts` | All contracts report (filters: `?year`, `?status`) |
| GET | `/contracts/export` | XLSX |
| GET | `/planned-budget` | Requires `?contractId=<id>&year=YYYY` |
| GET | `/planned-budget/export` | Same query; XLSX |
| GET | `/payment-schedule` | Requires `?contractId=<id>` |
| GET | `/payment-schedule/export` | Same query; XLSX |
| GET | `/project/:id/summary` | Plan + KPIs + payment schedule in one shape |
| GET | `/project/:id/summary/export` | 3-sheet XLSX |

Reports only operate on **confirmed** plans. Draft plans return HTTP 409 `plan_not_confirmed`.

The implemented KPIs are `peakCash` (maximum cumulative planned value) and
`burnRate` (contract value divided by contract duration in months). SPI, CPI,
actual-progress approval, monthly/quarterly reports, and PDF export are not
mounted by the current application.

---

## Auth & tokens

JWTs are issued as **httpOnly cookies** named `token` and default to an 8-hour lifetime. The payload is `{ id, role }`, which lets backend-ai authorize its own endpoints without a round-trip to core. The cookie is `sameSite=none; secure` in production so it can travel cross-site from the Vercel frontend.

---

## Roles

| Role | Access |
|---|---|
| `pmo` | Full access to `/api/users` + all finance and reporting endpoints |
| `contract_manager` | Generate / edit / confirm / export plans |
| `top_management` | Read finance + reports |

Every authenticated user can read finance and reporting data; only `contract_manager` and `pmo` can mutate plans.

