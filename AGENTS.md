# ConstLedger — Agent Guide

**Stack:** React 18 + Vite + Tailwind (JSX, ESM). Ignore backend dirs.
**Font:** Lexend via `font-sans` class (loaded in `index.html` + `index.css`).
**Env:** `VITE_API_URL`, `VITE_AI_API_URL` via `import.meta.env` (see `frontend/.env.example`).

## Commands (run from `frontend/`)

```bash
npm run dev       # :5173 — strictPort: true (kill prior vite if port taken)
npm run build     # vite build → dist/
npm run preview   # also :5173
npm run lint      # fails (no eslintrc). No tests, no CI/CD.
```

## Auth Infra — All Commented Out

`AuthProvider`, `PrivateRoute`, `RoleGuard`, Axios 401 interceptor with callback injection — **fully built but disabled** in `App.jsx`. `Navbar` `useAuth()` calls also commented. Enable when integrating auth. Uncommenting without a running backend will crash the app.

## What Exists vs Stubs

| Area                    | Built                                                                                                                                               | Stubs                                           |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| **Upload page**         | Full flow: drag-drop dropzone (`UploadDropzone`), AI info panel (`AIExtractsPanel`), 4-step stepper (`ContractStepper`), progress bar, activity log (`ActivityLog`). Supports PDF + DOCX. Accepts `.pdf`, `.docx`. `?demo=1` previews processing with mock data. | — |
| **Progress simulation** | `fakeProgress.js` — all intermediate stepper/progress/activity log simulated locally. Backend only returns terminal status (`active`/`analysis_failed`). Frontend still polls every 5s for that. | — |
| **Icons**               | 16 SVG components in `components/icons/` (extracted from inline SVGs) | — |
| **Services**            | `contractService.js` (3 methods), `authService.js` (3 methods) | `financeService.js`, `reportService.js` — empty |
| **Auth**                | `AuthContext`, `PrivateRoute`, `RoleGuard`, `authService`, Axios interceptor with `setOnUnauthorized` callback injection | All commented out in App.jsx |
| **Layout**              | `Sidebar` (4 items: Dashboard, Projects→`/contracts/upload`, Reports→`/reports`, Admin→`/admin`), `Navbar` (search placeholder, bell, profile) | — |
| **Other 10 pages**      | — | Placeholder stubs; `AdminPage` at `/admin` exists but is a stub |

## Route Quirks

- **No `/contracts` list** — "Add Project" on dashboard goes to `/contracts/upload`
- **No `PerformancePage`** — replaced by `ReportsPage` (tabs). Don't recreate.
- **`/contracts/:id`** and **`/contracts/:id/edit`** exist but are stubs
- Sidebar label "Projects" links to `/contracts/upload`, not `/projects`
- All routes in `src/App.jsx`

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
- Roles in code are **snake_case**: `contract_manager`, `finance_team`, `top_management`

## Tailwind — Nested Keys

Config at `frontend/tailwind.config.js` uses **nested** color keys. Write `bg-bg-main`, `text-text-primary`, `bg-primary`, `text-status-risk`, `bg-status-track`. Don't guess flat class names like `bg-main`.

## Sprints

| Epic | Sprint       | Content                                         |
| ---- | ------------ | ----------------------------------------------- |
| 2    | **S2 (now)** | Upload & AI — contract upload, stepper, polling |
| 3    | S2           | Contract data review form                       |
| 1    | S3           | Auth (login, guards, roles)                     |
| 4    | S3           | Planned budget                                  |
| 5    | S4           | Actual progress                                 |
| 6    | S4           | Reports & KPIs                                  |

## References

- `.opencode/plans/routing-skeleton.md` — full route spec
- `Octagram_final_sprints.html` — original sprint plan
