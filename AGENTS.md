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

## Auth Is Live

`AuthProvider`, `PrivateRoute`, `RoleGuard`, Axios 401 interceptor — **all active** in `App.jsx`. `LoginPage` at `/login`, `Navbar` shows real user name/role from context with profile dropdown + logout. `EditContractContext` wraps protected routes. Requires backend running.

## What Exists vs Stubs

| Area                    | Built                                                                                                                                                                                             | Stubs                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| **Upload page**         | Full flow: drag-drop dropzone (`UploadDropzone`), AI info panel (`AIExtractsPanel`), 4-step stepper (`ContractStepper`), progress bar, activity log (`ActivityLog`). Supports PDF + DOCX. `?demo=1` previews processing with mock data. | S3 presigned URL flow being added (uncommitted) |
| **Progress simulation** | `fakeProgress.js` — all intermediate stepper/progress/activity log simulated locally. Backend only returns terminal status (`active`/`analysis_failed`). Frontend still polls every 5s for that.  | —                                            |
| **Icons**               | 29 SVG components in `components/icons/` (extracted from inline SVGs)                                                                                                                             | —                                            |
| **Services**            | `contractService.js` (3 methods), `authService.js` (3 methods)                                                                                                                                    | `financeService.js`, `reportService.js` — empty |
| **Auth**                | `AuthProvider`, `PrivateRoute`, `RoleGuard`, `authService`, `EditContractContext`, Axios 401 interceptor — all active                                                                            | —                                            |
| **Layout**              | `Sidebar` (Dashboard→`/dashboard`, Projects→`/contracts`, Reports→`/reports`, Admin→`/admin`), `Navbar` (search, bell, profile dropdown with logout using `useAuth()`)                             | —                                            |
| **Login page**          | Full form UI: email/password inputs, show/hide toggle (`EyeIcon`/`EyeOffIcon`), validation, error display, spinner. Calls `useAuth().login()`                                                    | —                                            |
| **Dashboard**           | Greeting card, date display, "Add Project" link to `/contracts/upload`                                                                                                                            | —                                            |
| **Contracts list**      | `/contracts` route, `ContractsPage` with search bar + contract cards                                                                                                                              | —                                            |
| **Review/edit form**    | `/contracts/:id/edit`, `ReviewEditFormPage` (221 lines), uses `components/contractDetails/` (10 files: BasicInfoContent, FinancialTermsSection, ScheduleMilestonesSection, ContractCard, etc.)      | —                                            |
| **Contract detail**     | `ContractDetailPage`                                                                                                                                                                              | Still a stub (placeholder)                   |
| **Other 6 pages**       | —                                                                                                                                                                                                | Finance, BudgetVariance, ProgressList, ProgressForm, ReviewProgress, Reports — all stubs. AdminPage stub. |

## Route Quirks

- **No `PerformancePage`** — replaced by `ReportsPage` (tabs). Don't recreate.
- **`/contracts/:id`** is still a stub (placeholder)
- Sidebar label "Projects" links to `/contracts` (list page), not `/contracts/upload`

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
