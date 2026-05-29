# ConstLedger — Agent Guide

## Project Context
- **CPMS** — Construction Project Management System. ITI graduation project, Team Octagram.
- **Source of truth:** `Octagram_final_sprints.html` (sprint/feature breakdown).
- **Routing skeleton (CPMS-105):** `.opencode/plans/routing-skeleton.md` — complete route table, role guards, component tree, directory structure.
- **Current sprint:** Sprint 2 (May 31-Jun 6) — upload screen, contract list, detail view.
- **Stack:** MERN — React 18 + Vite + Tailwind (JSX, ESM), Node/Express, MongoDB/Mongoose. Node 20+.
- **All services in `/home/yousef_hany/projects/constledger`.** Docker Compose orchestrates everything.

## Role: D1 — Frontend only (team lead)
- **Your tasks across 4 sprints:**
  - **Sprint 1** (May 25-30): CPMS-105 — component tree/routing spec (blueprint, no code)
  - **Sprint 2** (May 31-Jun 6): CPMS-206 — upload screen with drag-drop + async polling + auth scaffolding
  - **Sprint 3** (Jun 9-13): CPMS-306 — 13-field review/edit form + login screen
  - **Sprint 4** (Jun 15-16): CPMS-405 — approvals list + approve/reject flow

## Frontend
```bash
cd frontend && npm install && npm run dev   # → :5173
npm run build         # vite build
npm run lint          # eslint (no .eslintrc exists yet)
```

### Current state
- `App.jsx`, all 5 pages (`LoginPage`, `DashboardPage`, `ContractsPage`, `FinancePage`, `PerformancePage`), all 5 services (`api.js`, `authService`, `contractService`, `financeService`, `reportService`), `AuthContext.jsx`, `PrivateRoute.jsx` — **all empty stubs**. Need full build.
- Config files exist: `vite.config.js`, `tailwind.config.js`, `postcss.config.js`, `index.html`
- Dependencies installed: React 18, react-router-dom v6, axios, Tailwind, Vite

### Routes (per CPMS-105 routing skeleton)
| Path | Page | Roles | Sprint |
|---|---|---|---|
| `/login` | `LoginPage` | public | S3 |
| `/` | → redirect `/dashboard` | all | S3 |
| `/dashboard` | `DashboardPage` | all | S3/S4 |
| `/contracts` | `ContractsPage` | all | S2 |
| `/contracts/upload` | `UploadContractPage` | `contractManager` | S2 |
| `/contracts/:id` | `ContractDetailPage` | all | S2 |
| `/contracts/:id/edit` | `ReviewEditFormPage` | `contractManager` | S3 |
| `/finance` | `FinancePage` | all | S3 |
| `/finance/:contractId/variance` | `BudgetVariancePage` | all | S3 |
| `/finance/:contractId/progress` | `ProgressListPage` | all | S4 |
| `/finance/:contractId/progress/new` | `ProgressFormPage` (create) | `financeTeam` | S4 |
| `/finance/:contractId/progress/:entryId/edit` | `ProgressFormPage` (edit) | `financeTeam` | S4 |
| `/finance/:contractId/progress/:entryId/review` | `ReviewProgressPage` | `contractManager` | S4 |
| `/reports` | `ReportsPage` (tabs) | all | S4 |
| `*` | `NotFoundPage` | all | S2

## Architecture (per sprint plan — existing backend scaffolding is initial recommendation, not team-authored)
- **Upload flow:** frontend → S3 pre-signed URL → backend saves key → direct server-to-LLM call → status `active` → frontend polls every 5s until done
- **Auth:** httpOnly cookie with JWT (8hr expiry), `verifyToken` + `requireRole` middleware
- **Roles (camelCase):** `contractManager`, `financeTeam`, `topManagement`
- **Contract statuses:** `processing` → `active` (or `analysis_failed`)
- **Budget:** triggered on `confirm` — splits contract value by milestone periods or evenly
- **No tests, no CI/CD**

## Epic Execution Order (Agile sequencing)
Auth (Epic 1) is intentionally **Sprint 3**. Build order is:
1. Epic 2 — Upload & AI (Sprint 2)
2. Epic 3 — Contract Data Review (Sprint 2)
3. Epic 1 — Auth Infra (Sprint 3)
4. Epic 4 — Planned Budget (Sprint 3)
5. Epic 5 — Actual Progress (Sprint 4)
6. Epic 6 — Reports & KPIs (Sprint 4)
