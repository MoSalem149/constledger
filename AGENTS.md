# ConstLedger — Agent Guide

`docker-compose.yml` at root orchestrates all three services + MongoDB 7.

| Service | Dir | Stack | Port | Deploy | Role |
|---|---|---|---|---|---|
| **Frontend** | `frontend/` | React 18 + Vite + Tailwind (JSX, ESM) | 5173 | Vercel | UI |
| **Backend Core** | `backend-core/` | Node/Express (JS, ESM) | 3000 | Deno Deploy | Auth + users + **planning/finance** — `/api/auth`, `/api/users`, `/api/finance` |
| **Backend AI** | `backend-ai/` | Node/Express (TypeScript) | 5000 | Google Cloud Run | Business APIs — `/api/contracts`, `/api/reports`, `/api/uploads` |

## Dev commands

```bash
# Start order: MongoDB → backend-core → backend-ai → frontend
cd frontend && npm run dev          # vite on :5173, strictPort:true
cd backend-core && npm run dev      # nodemon src/index.js on :3000
cd backend-ai && npm run dev        # tsx watch src/index.ts on :5000
cd backend-ai && npm run build      # tsc + copies assets/ dir to dist/
docker compose up --build           # everything at once
```

## Critical gotchas

- `JWT_SECRET` and `AI_SERVICE_SECRET` must be **identical** in `backend-core/.env` and `backend-ai/.env`. Both backends share the same `cpms` MongoDB. Auth breaks if they mismatch.
- There is a **second shared secret** for internal backend-core → backend-ai calls. The env var is `AI_SERVICE_SECRET` in `.env.example` but the middleware (`internalAuth.ts:9`) reads `process.env.INTERNAL_SECRET` — one of these names is wrong. Make sure the `.env` file has the var set to match what the code reads.
- No `eslintrc` is committed — `npm run lint` will fail.
- `VITE_API_URL=/api` in `.env.example` (relative path). In dev, **Vite proxy** routes `/api/auth` + `/api/users` + `/api/finance` → `:3000` (backend-core) and all other `/api/*` → `:5000` (backend-ai) (defined in `frontend/vite.config.js:12-18`). The Cookie domain is `localhost:5173` in dev, so there's no CORS issue.
- Auth is **httpOnly cookie only** — never a Bearer token. Axios has `withCredentials: true`. The 401 interceptor uses a **callback injection** pattern (`setOnUnauthorized`) to avoid circular imports between `api.js` and `AuthContext`.
- Roles use **snake_case**: `contract_manager`, `finance_team`, `top_management`, `pmo`.
- `frontend/tailwind.config.js` uses **nested color keys**. Write `bg-bg-main`, not `bg-main`. Write `text-text-primary`, `text-status-risk`. Other key paths: `bg-status-track`, `bg-processing`, `text-text-secondary`.
- Filename **typo**: `EditContaractContext` (missing `c`). Import from `./context/EditContaractContext`, not `EditContractContext`.
- Sidebar "Projects" links to `/contracts` (list page), not `/contracts/upload`.

## Route guard map

Routes with NO RoleGuard (any authenticated user): `/contracts/:id` (detail). All others are guarded by role.

## Frontend state at a glance

| Area | Built | Stubs |
|---|---|---|
| **Upload** | Full flow: dropzone, 4-step stepper, progress bar, activity log, `?demo=1` mock mode | — |
| **Progress simulation** | `fakeProgress.js` — all intermediate stepper/progress/log simulated locally. Backend only returns `active`/`analysis_failed`. | — |
| **Services** | `contractService.js` (6 methods), `authService.js` (3), `userService.js` (5), `financeService.js` (6 methods) | `reportService.js` — **empty file** (0 lines) |
| **Icons** | 35 SVG components in `components/icons/` | — |
| **Pages built** | Login, Dashboard, ContractsList, Upload, ReviewEditForm, Contract detail (with Planned Progress tab) | Reports, Admin (stubs) |

## Upload flow (4-step S3 presigned URL)

1. `POST /api/uploads/sign` → receives `{ uploadUrl, s3Key }`
2. Browser PUTs file directly to S3 via `uploadUrl`
3. `POST /api/uploads/complete` → notifies backend file is stored
4. `POST /api/contracts/upload` → backend reads from S3, runs AI analysis (blocks 20-30s)

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
at specs/007-admin-polish-cross-cutting/plan.md
<!-- SPECKIT END -->
