# ConstLedger — Agent Guide

## Services (3-process architecture)

| Service | Dir | Stack | Port | Deploy | Role |
|---|---|---|---|---|---|
| **Frontend** | `frontend/` | React 18 + Vite + Tailwind (JSX, ESM) | 5173 | Vercel | UI |
| **Backend Core** | `backend-core/` | Node/Express (JS, ESM) | 3000 | Deno Deploy | Auth & user management ONLY |
| **Backend AI** | `backend-ai/` | Node/Express (TypeScript) | 5000 | Google Cloud Run | All business APIs (contracts, finance, reports, S3, OpenAI) |

`docker-compose.yml` at root orchestrates all three + MongoDB 7.

## Commands

```bash
# Frontend (port 5173, strictPort: true)
cd frontend && npm run dev

# Backend Core (port 3000)
cd backend-core && npm run dev      # nodemon src/index.js

# Backend AI (port 5000)
cd backend-ai && npm run dev         # tsx watch src/index.ts
cd backend-ai && npm run build       # tsc → dist/ + copy assets
cd backend-ai && npm start           # node dist/index.js

# Docker (starts everything)
docker compose up --build

# Health checks
curl localhost:3000/health   # {"status":"ok","service":"cpms-core"}
curl localhost:5000/health   # {"status":"ok","service":"cpms-ai"}
```

**Start order:** MongoDB → backend-core → backend-ai → frontend. No tests, no lint (no eslintrc), no CI/CD.

## Architecture

```
Browser
  │
  ▼
frontend :5173
  │  REST /api/*
  ▼
backend-core :3000  ─────────── MongoDB :27017
  │  internal (x-internal-secret header)
  ▼
backend-ai :5000  ───────────── MongoDB (same DB)
                    ───────────── AWS S3 (contract files)
                    ───────────── OpenAI GPT-4o-mini (AI extraction)
```

- **backend-core** signs JWTs (sets httpOnly cookie). **backend-ai** verifies them (same `JWT_SECRET`).
- **backend-ai** owns all business routes: `/api/contracts`, `/api/finance`, `/api/reports`, `/api/uploads`.
- **backend-core** only has `/api/auth` and `/api/users`.
- AI uses `gpt-4o-mini` by default (configurable via `OPENAI_MODEL`).
- Contract files stored on S3 via presigned URL flow (4 steps: sign → PUT → complete → create).
- backend-core has `deno.json` for Deno Deploy compatibility.

## Env Setup

```bash
cp frontend/.env.example        frontend/.env.local
cp backend-core/.env.example    backend-core/.env
cp backend-ai/.env.example      backend-ai/.env
```

**Critical:** `JWT_SECRET` and `AI_SERVICE_SECRET` must be **identical** in `backend-core/.env` and `backend-ai/.env`. Shared MongoDB (`cpms`), no separate DBs.

## Frontend (what an agent can actually work on)

| Area | Built | Stubs |
|---|---|---|
| **Upload page** | Full flow: dropzone, AI panel, 4-step stepper, progress bar, activity log. PDF + DOCX. `?demo=1` for mock processing. | S3 presigned URL flow being added (uncommitted) |
| **Progress simulation** | `fakeProgress.js` — all intermediate stepper/progress/log simulated locally. Backend only returns `active`/`analysis_failed`. Polls every 5s. | — |
| **Icons** | 29 SVG components in `components/icons/` | — |
| **Services** | `contractService.js` (6 methods: signUpload, completeUpload, createContract, getContracts, getContractById, updateContract), `authService.js` (3 methods) | `financeService.js`, `reportService.js` empty |
| **Auth** | `AuthProvider`, `PrivateRoute`, `RoleGuard`, `EditContractContext`, Axios 401 interceptor — all active | — |
| **Layout** | `Sidebar` (Dashboard, Projects→`/contracts`, Reports→`/reports`, Admin→`/admin`), `Navbar` (search, bell, profile dropdown with `useAuth()` + logout) | — |
| **Login page** | Full form: email/password, show/hide toggle, validation, error display, spinner. Calls `useAuth().login()` | — |
| **Dashboard** | Greeting card, date display, "Add Project" link to `/contracts/upload` | — |
| **Contracts list** | `/contracts` route, `ContractsPage` with search bar + contract cards | — |
| **Review/edit form** | `/contracts/:id/edit`, `ReviewEditFormPage` (221 lines), uses `components/contractDetails/` (10 files) | — |
| **Contract detail** | `ContractDetailPage` at `/contracts/:id` | Still a stub |
| **Other 6 pages** | — | Finance, BudgetVariance, ProgressList, ProgressForm, ReviewProgress, Reports — all stubs. AdminPage stub. |

## Route Quirks

- No `PerformancePage` — replaced by `ReportsPage` (tabs). Don't recreate.
- `/contracts/:id` is still a placeholder.
- Sidebar "Projects" → `/contracts` (list page), not `/contracts/upload`.

## Auth Architecture

```
api.js interceptor → 401? → onUnauthorized()
                              ↑
AuthProvider injects logout via setOnUnauthorized() (useEffect)
                              ↑
                    PrivateRoute / RoleGuard / useAuth()
```

- **httpOnly cookie** for JWT — no JS token in memory. `withCredentials: true` on Axios.
- **Callback injection** (not DOM events) — avoids circular import between api.js and AuthContext.
- Roles in code are **snake_case**: `contract_manager`, `finance_team`, `top_management`.

## Tailwind — Nested Keys

Config at `frontend/tailwind.config.js` uses **nested** color keys. Write `bg-bg-main`, `text-text-primary`, `bg-primary`, `text-status-risk`, `bg-status-track`. Don't guess flat class names like `bg-main`.

## References

- `.opencode/plans/routing-skeleton.md` — full route spec
- `Octagram_final_sprints.html` — original sprint plan
- `README.md` — deployment guide (Vercel, Cloud Run)

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
at specs/002-admin-foundation/plan.md
<!-- SPECKIT END -->
