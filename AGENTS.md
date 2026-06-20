# ConstLedger — Agent Guide

`docker-compose.yml` at root orchestrates all three services + MongoDB 7.

| Service | Dir | Stack | Port | Deploy | Role |
|---|---|---|---|---|---|
| **Frontend** | `frontend/` | React 18 + Vite + Tailwind (JSX, ESM) | 5173 | Vercel | UI |
| **Backend Core** | `backend-core/` | Node/Express (JS, ESM) | 3000 | Deno Deploy | Auth + users + finance — `/api/auth`, `/api/users`, `/api/finance` |
| **Backend AI** | `backend-ai/` | Node/Express (TypeScript) | 5000 | Google Cloud Run | Contracts + uploads — `/api/contracts`, `/api/uploads` |

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

- `JWT_SECRET` must be **identical** in `backend-core/.env` and `backend-ai/.env`. Both backends share the same `cpms` MongoDB. Auth breaks if they mismatch.
- `VITE_API_URL=/api` in `.env.example` (relative path). In dev, **Vite proxy** routes `/api/auth` + `/api/users` + `/api/finance` → `:3000` (backend-core) and all other `/api/*` → `:5000` (backend-ai) (defined in `frontend/vite.config.js:12-18`). The Cookie domain is `localhost:5173` in dev, so there's no CORS issue.
- Auth is **httpOnly cookie only** — never a Bearer token. Axios has `withCredentials: true`. The 401 interceptor uses a **callback injection** pattern (`setOnUnauthorized`) to avoid circular imports between `api.js` and `AuthContext`.
- Roles use **snake_case**: `contract_manager`, `finance_team`, `top_management`, `pmo`.
- `frontend/tailwind.config.js` uses **nested color keys**. Write `bg-bg-main`, not `bg-main`. Write `text-text-primary`, `text-status-risk`. Other key paths: `bg-status-track`, `bg-processing`, `text-text-secondary`.
- Filename **typo**: `EditContaractContext` (missing `c`). Import from `./context/EditContaractContext`, not `EditContractContext`.
- **Typo**: `ContarctDetailsSections` (file + export) and `ContarctCard` (export only, file is `ContractCard.jsx`). Both used in `ContractDetailPage` and `ReviewEditFormPage`.
- Sidebar "Projects" links to `/contracts` (list page), not `/contracts/upload`.
- **Duplicate routes bug**: `App.jsx` defines `/reports` TWICE — once with RoleGuard (lines 101-113) and once without (line 125). Last definition wins, so `/reports` has no guard. Only unguarded route: `/contracts/:id`.
- `fakeProgress.js` simulates all intermediate stepper/progress/log locally. Backend only returns `active`/`analysis_failed`. Upload flow is 4-step S3 presigned URL with async polling — see `contractService.js:4-18`.

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
at specs/007-admin-polish-cross-cutting/plan.md
<!-- SPECKIT END -->
