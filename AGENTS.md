# ConstLedger — Agent Guide

## Project Context

- **CPMS** — Construction Project Management System. ITI graduation project, Team Octagram.
- **Stack:** React 18 + Vite + Tailwind (JSX, ESM) ← **frontend only, ignore backend**
- **Current sprint:** Sprint 2 (May 31–Jun 6) — contract upload screen.
- **Font:** Lexend (loaded via `<link>` in `index.html` + `@import` in `index.css`; use `font-sans` class)
- **Env vars:** `VITE_API_URL` and `VITE_AI_API_URL` via `import.meta.env` (see `frontend/.env.example`)

## Commands

```bash
npm run dev       # → :5173 (strictPort: true — kill prior vite if port taken)
npm run build     # vite build → dist/
npm run preview   # vite preview (also :5173)
npm run lint      # eslint — fails (no .eslintrc*). Skip it.
```

Run all from `frontend/`. No tests, no CI/CD, no monorepo manager.

## What's Built vs Stubs

| Area                    | Built (Sprint 2)                                                                                                                                                                                      | Stubs (future sprints)                                                                                                |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Pages**               | `UploadContractPage` — full upload flow with drag-drop dropzone, AI info panel, 4-step stepper, progress bar, activity log, 5s polling. `?demo=1` URL param previews processing state with mock data. | 10 other pages are stubs returning placeholders                                                                       |
| **Contract components** | `UploadDropzone`, `AIExtractsPanel`, `ProcessingCard`, `ContractStepper`, `ActivityLog`                                                                                                               | —                                                                                                                     |
| **Auth infra**          | `AuthContext`, `PrivateRoute`, `RoleGuard`, `authService`, Axios 401 interceptor with callback injection                                                                                              | **All commented out** in `App.jsx` — enable when integrating auth. `Navbar` also has `useAuth()` calls commented out. |
| **Layout**              | `Sidebar` (3 items: Dashboard, Projects→`/contracts/upload`, Admin→`/reports`), `Navbar` (search placeholder, notification bell, profile card with hardcoded "Yousef Hany / Contract Manager")        | —                                                                                                                     |
| **Icons**               | 16 SVG icon components in `components/icons/`                                                                                                                                                         | —                                                                                                                     |
| **Services**            | `contractService.js` (3 methods: upload, getById, getProgress), `authService.js` (3 methods)                                                                                                          | `financeService.js` & `reportService.js` are empty                                                                    |

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

## Route Table

| Path                                                                    | Component                                                      | Guard             | Sprint |
| ----------------------------------------------------------------------- | -------------------------------------------------------------- | ----------------- | ------ |
| `/login`                                                                | `LoginPage`                                                    | public            | S3     |
| `/`                                                                     | → redirect `/dashboard`                                        | —                 | S3     |
| `/dashboard`                                                            | `DashboardPage`                                                | all               | S3–S4  |
| `/contracts/upload`                                                     | `UploadContractPage`                                           | `contractManager` | **S2** |
| `/contracts/:id`                                                        | `ContractDetailPage`                                           | all               | S2     |
| `/contracts/:id/edit`                                                   | `ReviewEditFormPage`                                           | `contractManager` | S3     |
| `/finance`                                                              | `FinancePage`                                                  | all               | S3     |
| `/finance/:contractId/variance`                                         | `BudgetVariancePage`                                           | all               | S3     |
| `/finance/:contractId/progress[/new\|/:entryId/edit\|/:entryId/review]` | `ProgressListPage` / `ProgressFormPage` / `ReviewProgressPage` | varies            | S4     |
| `/reports`                                                              | `ReportsPage` (tabs)                                           | all               | S4     |
| `*`                                                                     | `NotFoundPage`                                                 | all               | S2     |

No `/contracts` list route. No `PerformancePage`.

## Tailwind Design Tokens (`frontend/tailwind.config.js`)

Config uses **nested** keys. Class names follow the nesting — use `bg-bg-main`, `text-text-primary`, `bg-primary`, `text-status-risk`, `bg-status-track`.

```ts
colors: {
  primary: "#FF4800",
  bg: { main: "#FAF8F6", cards1: "#FFFFFF", cards2: "#FF4800",
        onTrak: "#D9ECDB", atRisk100: "#FDEFE7", atRisk200: "#FFD9D9",
        watch: "#FEF2E3", processing: "#DDE9F8", grey: "#EEEEEE", mainColor: "#FFE4D9" },
  status: { risk: "#FF0000", track: "#007D0F", processing: "#1D6CD3" },
  text: { primary: "#242424", secondary: "#6C6B6B", light: "#FAF8F6", placeholder: "#A5A4A3" },
  gray: { 100: "#EBEBEB", 200: "#CCCCCC", 300: "#A5A4A3" },
  watch: { 1: "#A47339", 2: "#F69521" },
}
borderRadius: { sm: "2px", md: "4px", lg: "8px", xl: "16px", "2xl": "28px" }
boxShadow: { DEFAULT: "0 4px 16px rgba(36, 36, 36, 0.40)" }
```

## Epic Execution Order

1. Epic 2 — Upload & AI (**Sprint 2 → now**)
2. Epic 3 — Contract Data Review (Sprint 2)
3. Epic 1 — Auth Infra (Sprint 3)
4. Epic 4 — Planned Budget (Sprint 3)
5. Epic 5 — Actual Progress (Sprint 4)
6. Epic 6 — Reports & KPIs (Sprint 4)

## Reference

- Full route spec: `.opencode/plans/routing-skeleton.md`
- Sprint breakdown: `Octagram_final_sprints.html`
