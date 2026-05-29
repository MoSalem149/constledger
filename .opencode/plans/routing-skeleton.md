# CPMS-105: Client-Side Component Tree & Routing Documentation

## Overview

This document defines the React application structure for ConstLedger: page-level components, route paths, role-based access control (RBAC), auth context shape, protected route mechanics, and Figma-to-route mapping. This is the routing skeleton that D1 implements in Sprint 2+.

---

## Roles

Three roles (camelCase enum):

| Role | Capabilities |
|---|---|
| `contractManager` | Upload contracts, view/edit contract data, approve/reject actual progress |
| `financeTeam` | Submit & edit pending actual progress reports, view-only elsewhere |
| `topManagement` | Read-only access to all data and reports |

---

## Route Table

### Public

| Path | Component | Access | Sprint |
|---|---|---|---|
| `/login` | `LoginPage` | No auth required | S3 |

### Protected (all roles authenticated)

| Path | Component | Roles | Sprint |
|---|---|---|---|
| `/` | → redirect `/dashboard` | All | S3 |
| `/dashboard` | `DashboardPage` | All | S3 shell, S4 live |
| `/contracts` | `ContractsPage` | All | S2 |
| `/contracts/upload` | `UploadContractPage` | `contractManager` | S2 |
| `/contracts/:id` | `ContractDetailPage` | All | S2 |
| `/contracts/:id/edit` | `ReviewEditFormPage` | `contractManager` | S3 |
| `/finance` | `FinancePage` | All | S3 |
| `/finance/:contractId/variance` | `BudgetVariancePage` | All | S3 |
| `/finance/:contractId/progress` | `ProgressListPage` | All | S4 |
| `/finance/:contractId/progress/new` | `ProgressFormPage` (create mode) | `financeTeam` | S4 |
| `/finance/:contractId/progress/:entryId/edit` | `ProgressFormPage` (edit mode) | `financeTeam` | S4 |
| `/finance/:contractId/progress/:entryId/review` | `ReviewProgressPage` | `contractManager` | S4 |
| `/reports` | `ReportsPage` (tabs: monthly, quarterly, performance, penalties) | All | S4 |
| `*` | `NotFoundPage` | All | S2 |

---

## Component Tree

```
<App>
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route element={<PrivateRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />

            <Route path="/contracts" element={<ContractsPage />} />
            <Route path="/contracts/upload" element={
              <RoleGuard roles={['contractManager']}>
                <UploadContractPage />
              </RoleGuard>
            } />
            <Route path="/contracts/:id" element={<ContractDetailPage />} />
            <Route path="/contracts/:id/edit" element={
              <RoleGuard roles={['contractManager']}>
                <ReviewEditFormPage />
              </RoleGuard>
            } />

            <Route path="/finance" element={<FinancePage />} />
            <Route path="/finance/:contractId/variance" element={<BudgetVariancePage />} />
            <Route path="/finance/:contractId/progress" element={<ProgressListPage />} />
            <Route path="/finance/:contractId/progress/new" element={
              <RoleGuard roles={['financeTeam']}>
                <ProgressFormPage />
              </RoleGuard>
            } />
            <Route path="/finance/:contractId/progress/:entryId/edit" element={
              <RoleGuard roles={['financeTeam']}>
                <ProgressFormPage />
              </RoleGuard>
            } />
            <Route path="/finance/:contractId/progress/:entryId/review" element={
              <RoleGuard roles={['contractManager']}>
                <ReviewProgressPage />
              </RoleGuard>
            } />

            <Route path="/reports" element={<ReportsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  </AuthProvider>
</App>
```

---

## Auth Context

### Shape (`AuthContext.jsx`)

```js
const auth = {
  user: { name, email, role } | null,
  loading: boolean,
  isAuthenticated: boolean,
  login: (email, password) => Promise,
  logout: () => void,
  hasRole: (...roles) => boolean,
}
```

### Auth Flow

1. **App mount:** `AuthProvider` calls `GET /api/auth/me`. `loading=true` until response. Valid cookie → `user` populated. No cookie → `user=null`.
2. **Login:** `login(email, password)` → `POST /api/auth/login` → server sets httpOnly cookie, returns `{user}` → set `user`.
3. **Logout:** `logout()` → `POST /api/auth/logout` → server clears cookie → `user=null` → navigate to `/login`.
4. **Token:** httpOnly cookie only. No JS memory or localStorage. XSS-safe.

### PrivateRoute

```
loading → <FullPageSpinner />
!isAuthenticated → <Navigate to="/login" replace />
ok → <Outlet />
```

### RoleGuard

```
user.role not in allowed → <Navigate to="/dashboard" replace />
ok → children
```

---

## Figma Screen → Route Mapping

| Figma Screen | Route | Sprint |
|---|---|---|
| Login screen | `/login` | S3 |
| Dashboard (role-aware nav + summary cards) | `/dashboard` | S3 shell, S4 live |
| Contract list (table + filters + badges) | `/contracts` | S2 |
| Contract upload (file picker + processing) | `/contracts/upload` | S2 |
| Contract detail (read-only + PDF + milestones) | `/contracts/:id` | S2 |
| Contract review/edit form (13 fields) | `/contracts/:id/edit` | S3 |
| Finance overview (budget status per contract) | `/finance` | S3 |
| Budget variance table | `/finance/:contractId/variance` | S3 |
| Progress entries timeline | `/finance/:contractId/progress` | S4 |
| Progress submission form | `/finance/:contractId/progress/new` | S4 |
| Progress edit form | `/finance/:contractId/progress/:entryId/edit` | S4 |
| Progress approve/reject | `/finance/:contractId/progress/:entryId/review` | S4 |
| Reports (monthly, quarterly, KPIs, penalties) | `/reports` | S4 |

---

## Directory Structure

```
frontend/src/
├── App.jsx                    ← Route tree
├── main.jsx                   ← Entry point
├── index.css                  ← Tailwind
├── context/
│   └── AuthContext.jsx         ← Provider + useAuth
├── components/
│   ├── common/
│   │   ├── PrivateRoute.jsx    ← Auth gate
│   │   ├── RoleGuard.jsx       ← Role gate
│   │   ├── DashboardLayout.jsx ← Sidebar + topbar + Outlet
│   │   ├── FullPageSpinner.jsx
│   │   └── NotFoundPage.jsx
│   ├── contracts/              ← S2
│   ├── finance/                ← S3-4
│   └── reports/                ← S4
├── pages/
│   ├── LoginPage.jsx           ← S3 (stub exists)
│   ├── DashboardPage.jsx       ← S3/4 (stub exists)
│   ├── ContractsPage.jsx       ← S2 (stub exists)
│   ├── UploadContractPage.jsx  ← S2 (new)
│   ├── ContractDetailPage.jsx  ← S2 (new)
│   ├── ReviewEditFormPage.jsx  ← S3 (new)
│   ├── FinancePage.jsx         ← S3 (stub exists)
│   ├── BudgetVariancePage.jsx  ← S3 (new)
│   ├── ProgressListPage.jsx    ← S4 (new)
│   ├── ProgressFormPage.jsx    ← S4 (new, create+edit via mode flag)
│   ├── ReviewProgressPage.jsx  ← S4 (new)
│   ├── ReportsPage.jsx         ← S4 (new, tabs)
│   └── NotFoundPage.jsx        ← S2 (new)
└── services/
    ├── api.js                  ← Axios instance
    ├── authService.js          ← login, logout, checkAuth
    ├── contractService.js      ← upload, list, getById, update
    ├── financeService.js       ← getPlanned, getProgress, submit, edit, approve, reject
    └── reportService.js        ← getMonthly, getQuarterly, getPerformance, getPenalties, export
```

---

## Implementation Order

| Sprint | Builds |
|---|---|
| **S2** | `NotFoundPage`, `UploadContractPage`, `ContractsPage`, `ContractDetailPage`, `api.js`, `contractService.js`. Routes unguarded. |
| **S3** | `AuthContext` (full), `PrivateRoute`, `RoleGuard`, `DashboardLayout`, `LoginPage`, `DashboardPage` (shell), `ReviewEditFormPage`, `FinancePage`, `BudgetVariancePage`, `authService.js`, `financeService.js`. Wrap all routes in guards. |
| **S4** | `ProgressListPage`, `ProgressFormPage`, `ReviewProgressPage`, `ReportsPage` (tabs), `reportService.js`. Dashboard live data. |

---

## Key Decisions

| Decision | Reason |
|---|---|
| `/` → redirect `/dashboard` | Single landing URL, no dual-render confusion |
| Reports as one page with tabs | Avoids 5 near-identical page files; tabs are sufficient UX |
| `ProgressFormPage` create+edit via mode flag | Same fields/validation/layout — only prefill and API call differ |
| Auth in Sprint 3 (per sprint doc) | S2 builds unguarded components; S3 adds wrappers — clean separation |
| httpOnly cookie for JWT | XSS-safe; `/auth/me` restores session on reload |
