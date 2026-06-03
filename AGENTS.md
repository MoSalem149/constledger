# ConstLedger — Agent Guide

## Project Context

- **CPMS** — Construction Project Management System. ITI graduation project, Team Octagram.
- **Stack:** React 18 + Vite + Tailwind (JSX, ESM) ← **frontend only, ignore backend**
- **Current sprint:** Sprint 2 (May 31–Jun 6) — contract upload screen.
- **Font:** Lexend (loaded from Google Fonts in `index.html`)
- **Env vars:** `VITE_API_URL` and `VITE_AI_API_URL` via `import.meta.env`

## Frontend Scaffolding (already built, not stubs)

All infra is wired and compiling:

- `App.jsx` — full route tree with `AuthProvider` → `PrivateRoute` → `DashboardLayout` → pages
- `services/api.js` — Axios instance, `withCredentials: true`, callback-injection 401 handler (`setOnUnauthorized`)
- `context/AuthContext.jsx` — `AuthProvider` + `useAuth()`, injects `logout` into Axios via `setOnUnauthorized` (no DOM events, no circular deps)
- `components/common/` — `PrivateRoute`, `RoleGuard`, `DashboardLayout`, `FullPageSpinner`, `NotFoundPage`
- `Sidebar.jsx` + `Navbar.jsx` — fully built with SVG icons, not stubs
- 11 page stubs in `pages/` + `NotFoundPage` = 12 route-able components (to be filled per sprint)
- `components/icons/` — exists but empty (add component icons here)
- `contractService.js`, `financeService.js`, `reportService.js` — exist but are **empty** (need API method implementations)

### Quirks

- **`AuthProvider` and `PrivateRoute` are commented out** in `App.jsx` — the full auth infra exists but is disabled so design work doesn't crash. Enable them when integrating auth. The `Navbar` also has `useAuth()` calls commented out.
- **No `ContractsPage`** — no Figma screen for a contract list; "Add Project" goes to `/contracts/upload`
- **`PerformancePage.jsx` deleted** — replaced by `ReportsPage` (tabs). Do not recreate.
- **No `.eslintrc*`** — `npm run lint` will fail. Ignore it.
- **No tests, no CI/CD**
- **No proxy in Vite** — API calls go to `VITE_API_URL` env var. Dev must run backend separately or set up mock.
- **`strictPort: true`** on port 5173 — crashes if port is taken. Kill any prior vite process if needed.
- **Sidebar nav** labels "Projects" but links to `/contracts/upload`

## Commands

```bash
npm run dev       # → :5173 (strictPort: true)
npm run build     # vite build — produces dist/
npm run preview   # vite preview (also :5173)
npm run lint      # eslint — fails (no .eslintrc*). Skip it.
```

## Tailwind Design Tokens (`tailwind.config.js`)

Config uses **nested** keys. Class names follow the nesting:

```ts
colors: {
  primary: "#FF4800",
  bg: { main, cards1, cards2, onTrak, atRisk100, atRisk200, watch, processing, grey, mainColor },
  status: { risk: "#FF0000", track: "#007D0F", processing: "#1D6CD3" },
  text: { primary: "#242424", secondary: "#6C6B6B", light: "#FAF8F6", placeholder: "#A5A4A3" },
  gray: { 100, 200, 300 },
  watch: { 1, 2 },
}
borderRadius: { sm: "2px", md: "4px", lg: "8px", xl: "16px", "2xl": "28px" }
boxShadow: { DEFAULT: "0 4px 16px rgba(36, 36, 36, 0.40)" }
```

Use: `bg-bg-main`, `text-text-primary`, `text-status-risk`, `bg-status-track`, `bg-primary`.

## Route Table

| Path                                            | Component                   | Role Guard        | Sprint |
| ----------------------------------------------- | --------------------------- | ----------------- | ------ |
| `/login`                                        | `LoginPage`                 | public            | S3     |
| `/`                                             | → redirect `/dashboard`     | —                 | S3     |
| `/dashboard`                                    | `DashboardPage`             | all               | S3–S4  |
| `/contracts/upload`                             | `UploadContractPage`        | `contractManager` | S2     |
| `/contracts/:id`                                | `ContractDetailPage`        | all               | S2     |
| `/contracts/:id/edit`                           | `ReviewEditFormPage`        | `contractManager` | S3     |
| `/finance`                                      | `FinancePage`               | all               | S3     |
| `/finance/:contractId/variance`                 | `BudgetVariancePage`        | all               | S3     |
| `/finance/:contractId/progress`                 | `ProgressListPage`          | all               | S4     |
| `/finance/:contractId/progress/new`             | `ProgressFormPage` (create) | `financeTeam`     | S4     |
| `/finance/:contractId/progress/:entryId/edit`   | `ProgressFormPage` (edit)   | `financeTeam`     | S4     |
| `/finance/:contractId/progress/:entryId/review` | `ReviewProgressPage`        | `contractManager` | S4     |
| `/reports`                                      | `ReportsPage` (tabs)        | all               | S4     |
| `*`                                             | `NotFoundPage`              | all               | S2     |

No `/contracts` list route. No `PerformancePage` route.

## Auth Architecture

```
Axios interceptor (api.js)
    401? → onUnauthorized()
            │
     AuthProvider injects logout via setOnUnauthorized()
            │
     PrivateRoute / RoleGuard / useAuth()
```

- **httpOnly cookie** for JWT — no JS token storage
- `withCredentials: true` on Axios — sends cookie automatically
- **Callback injection** (not DOM events) — `AuthProvider` calls `setOnUnauthorized(logout)` in `useEffect`, interceptor calls it on 401. No circular dependency.
- Roles (camelCase): `contractManager`, `financeTeam`, `topManagement`

## Epic Execution Order

1. Epic 2 — Upload & AI (**Sprint 2**)
2. Epic 3 — Contract Data Review (Sprint 2)
3. Epic 1 — Auth Infra (Sprint 3)
4. Epic 4 — Planned Budget (Sprint 3)
5. Epic 5 — Actual Progress (Sprint 4)
6. Epic 6 — Reports & KPIs (Sprint 4)

## Reference

- Full route spec: `.opencode/plans/routing-skeleton.md`
- Sprint breakdown: `Octagram_final_sprints.html`
