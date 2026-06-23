# CPMS — Frontend (`cpms-frontend`)

React + Vite SPA for the Contract & Project Management System. Pairs with **backend-core** (port 3000) for auth, users, finance, and reports, and **backend-ai** (port 5000) for contract upload and AI extraction. In production, Vercel rewrites proxy all `/api/*` requests to the correct backend.

**Dev server:** `http://localhost:5173` &nbsp;·&nbsp; **Module system:** ESM &nbsp;·&nbsp; **Styling:** Tailwind CSS

---

## Getting started

```bash
cp .env.example .env       # no values needed for local dev — Vite proxy handles /api/*
npm install
npm run dev                # http://localhost:5173 (Vite HMR)
npm run build              # production bundle → dist/
npm run preview            # preview the production bundle locally
npm run lint               # ESLint check
```

The Vite dev server proxies `/api/*` to the backend services — see `vite.config.js` for the target URLs. No backend URL is needed in `.env` during local development.

---

## Running with Docker

The Dockerfile is a multi-stage build: `builder` produces the static bundle with Vite, `runtime` serves it with nginx. No Node.js process runs in production.

```bash
docker build -t cpms-frontend .
docker run --rm -p 80:80 cpms-frontend
```

> **Note:** The built bundle is static — there are no runtime env vars to inject. In production, backend routing is handled by Vercel rewrites (see `vercel.json`). If self-hosting with Docker, update `nginx.conf` with your own proxy rules.

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | no | API base path (default `/api`). Overridden by Vite proxy in dev and Vercel rewrites in prod. |

---

## Project structure

```
src/
├── App.jsx                          # Root router and route definitions
├── assets/                          # Static images and fonts
├── components/
│   ├── admin/                       # User management modals and table (PMO only)
│   ├── common/                      # Shared layout: Navbar, Sidebar, PrivateRoute, RoleGuard
│   ├── contractDetails/             # Contract detail page sections (BasicInfo, Financial, etc.)
│   ├── contracts/                   # Contract list, upload flow, processing card
│   ├── dashboard/                   # Dashboard sections (overview, projects, finance chart)
│   └── icons/                       # SVG icon components
├── pages/                           # Top-level page components (one per route)
├── services/
│   └── api.js                       # Axios instance with base URL and credential config
└── store/                           # Auth context / global state
```

---

## Routing

All routes are protected by `PrivateRoute` (requires a valid session) and optionally by `RoleGuard` (restricts to specific roles). The full route map is defined in `src/App.jsx`.

| Path | Description |
|---|---|
| `/login` | Public — login form |
| `/dashboard` | Overview cards, active projects, finance strategy chart |
| `/contracts` | Contract list with status filters |
| `/contracts/:id` | Contract detail — all extracted sections |
| `/admin/users` | User management (PMO only) |

---

## Tech stack

| Package | Purpose |
|---|---|
| `react` / `react-dom` | UI framework |
| `react-router-dom` | Client-side routing |
| `axios` | HTTP client |
| `recharts` | Finance strategy chart |
| `swiper` | Active-projects carousel on the dashboard |
| `react-spinners` | Loading indicator |
| `tailwindcss` | Utility-first CSS |
| `vite` | Dev server and bundler |
