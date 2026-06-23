<div align="center">

# ConstLedger

**AI-assisted contract extraction, finance planning, and reporting**

> Graduation Project — Information Technology Institute (ITI) · May 2026

[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com)

</div>

---

## What is ConstLedger?

ConstLedger currently has two implemented backend services and a React frontend
scaffold. Backend AI handles S3 uploads, PDF parsing, AI extraction, validation,
and contract storage. Backend Core handles authentication, users, finance
planning, reporting, and XLSX exports.

The frontend currently contains routing, API clients, authentication state, and
placeholder pages. Its service modules still include endpoints from an older
API design and need alignment before the UI is fully functional.

---

## Team Octagram

| Name                             | Role                 |
| -------------------------------- | -------------------- |
| Yousef Hany Mahmoud              | MERN Stack Developer |
| Mohamed Elshahat Amer            | MERN Stack Developer |
| Mohamed Nasr Mansour El Khoreby  | MERN Stack Developer |
| Abdalla Mohamed Ragheb Elhagar   | MERN Stack Developer |
| Mohamed Wael Mohamed Salem       | MERN Stack Developer |
| Nagwa Mahmoud Roshdy             | Testing & QA         |
| Sarah Tarek Mohamed              | Testing & QA         |
| Rahma Emad Mohamed Mohamed Farid | UI/UX Design         |

---

## Architecture

```
constledger/
├── frontend/          React 18 + Vite (JSX)   →  port 5173
├── backend-core/      Node/Express (JS)        →  port 3000
├── backend-ai/        Node/Express (TS)        →  port 5000
├── docker-compose.yml Local dev orchestration
└── README.md
```

### Service Communication

The browser talks to both backend services. Core owns `/api/auth`,
`/api/users`, `/api/finance`, and `/api/reports`; AI owns `/api/uploads` and
`/api/contracts`. Both services use the same MongoDB database and verify the
same HTTP-only JWT cookie. There is no active `x-internal-secret` service call
between them.

```
Browser
  ├── /api/auth, /api/users, /api/finance, /api/reports
  │      └── backend-core :3000
  └── /api/uploads, /api/contracts
         └── backend-ai :5000

backend-core ──┐
              ├── shared MongoDB :27017
backend-ai  ───┘
      └── Amazon S3
      └── Gemini, OpenRouter, or Groq
```

---

## Modules

| Module                    | Description                                                                                 | AI?                 |
| ------------------------- | ------------------------------------------------------------------------------------------- | ------------------- |
| **Contracts** | Direct-to-S3 upload, background PDF extraction, validation, human review, editing, and re-analysis | Gemini, OpenRouter, or Groq |
| **Finance** | Straight-line, S-curve, and milestone-weighted plans; manual edits; confirmation; payment schedule | Deterministic |
| **Reports** | Contract, planned-budget, payment-schedule, and project-summary JSON/XLSX reports | Aggregation |
| **Frontend** | React/Vite routes and service scaffold; page implementations are placeholders | Not complete |

---

## User Roles

| Role               | Permissions                                                 |
| ------------------ | ----------------------------------------------------------- |
| `contract_manager` | Upload contracts, review AI extractions, edit contract data |
| `pmo`              | Everything above + manage users and all finance operations  |
| `finance_team`     | Read finance plans and reports                              |
| `top_management`   | Read finance plans and reports                              |

---

## Tech Stack

| Layer             | Technology                                    |
| ----------------- | --------------------------------------------- |
| Frontend          | React 18, Vite, Tailwind CSS, React Router v6 |
| Core Backend      | Node.js, Express, Mongoose                    |
| AI Backend        | Node.js, Express, TypeScript                  |
| Database          | MongoDB (Mongoose ODM)                        |
| File Storage      | Amazon S3                                     |
| LLM               | Gemini, OpenRouter, or Groq                   |
| Auth              | JWT in HTTP-only cookie + RBAC                |
| Testing           | Vitest                                        |
| Dev Orchestration | Docker Compose                                |

---

## Quick Start

### Option A — Docker (recommended)

**Prerequisites:** Docker Desktop, an Amazon S3 bucket, and at least one
Gemini, OpenRouter, or Groq API key.

```bash
# 1. Clone
git clone https://github.com/your-org/constledger.git && cd constledger

# 2. Create env files
cp frontend/.env.example        frontend/.env.local
cp backend-core/.env.example    backend-core/.env
cp backend-ai/.env.example      backend-ai/.env

# 3. Fill in secrets
#    use the same JWT_SECRET in both backend env files
#    backend-core/.env  → MONGODB_URI, JWT_SECRET
#    backend-ai/.env    → MONGODB_URI, JWT_SECRET, AWS_*, S3_BUCKET,
#                         and at least one AI provider API key

# 4. Start everything
docker-compose up --build
```

| Service      | URL                            |
| ------------ | ------------------------------ |
| Frontend     | http://localhost:5173          |
| Backend Core | http://localhost:3000          |
| Backend AI   | http://localhost:5000          |
| MongoDB      | mongodb://localhost:27017/cpms |

---

### Option B — Local (no Docker)

**Prerequisites:** Node.js 20+, MongoDB running locally.

#### 1. MongoDB

```bash
mongod --dbpath ~/data/db
# or use a MongoDB Atlas free cluster
```

#### 2. backend-core (port 3000)

```bash
cd backend-core
cp .env.example .env        # set MONGODB_URI=mongodb://localhost:27017/cpms
npm install
npm run dev
```

#### 3. backend-ai (port 5000)

```bash
cd backend-ai
cp .env.example .env        # set MONGODB_URI=mongodb://localhost:27017/cpms
                             # configure JWT_SECRET, S3, and an AI provider key
npm install
npm run dev
```

#### 4. frontend (port 5173)

```bash
cd frontend
cp .env.example .env.local  # already set for localhost
npm install
npm run dev
```

> Start order: MongoDB → backend-core and backend-ai → frontend

---

## Health Checks

```bash
curl http://localhost:3000/health   # {"status":"ok","service":"cpms-core"}
curl http://localhost:5000/health   # {"status":"ok","service":"cpms-ai"}
```

---

## Backend Tests

Focused Vitest suites cover the main backend business logic without requiring
MongoDB, AWS, OCR, or AI provider credentials.

```bash
cd backend-core && npm test
cd ../backend-ai && npm test
cd ../frontend && npm run build
```

Use `npm run test:watch` inside either backend while developing. Docker files
do not need test-specific changes because Vitest is a development dependency
and the runtime images continue to install production dependencies only.

---

## API Ownership

| Service | Mounted API prefixes |
|---|---|
| Backend Core | `/api/auth`, `/api/users`, `/api/finance`, `/api/reports` |
| Backend AI | `/api/uploads`, `/api/contracts` |

See [backend-core/README.md](backend-core/README.md) and
[backend-ai/README.md](backend-ai/README.md) for the current endpoints,
authorization rules, request shapes, and environment variables.

---

## Fixed: Frontend couldn't reach Backend AI under Docker Compose

`docker-compose up` used to bring up all four containers successfully, but
the frontend couldn't actually reach `backend-ai` once you started clicking
around (contract list, upload, analysis all failed) — even though
`npm run dev` for each service on the host (Option B) worked fine. Two
stacked issues caused it, and both are now fixed in `vite.config.js` and
`docker-compose.yml`:

1. **`vite.config.js`'s dev-server proxy targets were hardcoded to
   `localhost`.** That proxy runs *inside* whichever process is running
   Vite. When that process is the `frontend` container, `localhost`
   resolves to the container itself — not to `backend-core` or `backend-ai`,
   which are only reachable from `frontend` via their Compose service names
   (`http://backend-core:3000`, `http://backend-ai:5000`) on the `cpms-net`
   network. Running all three as plain host processes has no such
   isolation, so the same hardcoded targets happened to be correct there.

   **Fix:** the proxy targets are now read from `CORE_PROXY_TARGET` /
   `AI_PROXY_TARGET` env vars, defaulting to `localhost` for local dev.
   `docker-compose.yml` sets them to the service names instead.

2. **`docker-compose.yml` overrode `VITE_API_URL` to an absolute URL**
   (`http://localhost:3000/api`) instead of the relative `/api` default in
   `frontend/.env.example`. `frontend/.dockerignore` excludes `.env.local`
   from the build context, so inside the container that Compose value was
   the *only* value Vite ever saw. Because `services/api.js` has a single
   Axios instance whose `baseURL` is `VITE_API_URL` — and `VITE_AI_API_URL`
   (also set in the old `docker-compose.yml`) was never read anywhere in the
   frontend code — every request, including ones for `/api/contracts` and
   `/api/uploads`, got sent to `backend-core`, which doesn't mount those
   routes, so they 404'd.

   In local/standalone dev, `VITE_API_URL` stayed relative (`/api`), so
   requests went through the Vite proxy from issue #1 instead — and that
   proxy *did* correctly split traffic by path between `:3000` and `:5000`,
   because in that mode `localhost` was unambiguous. That's why
   contracts/uploads worked outside Docker even though the frontend only
   ever had one configured API base URL.

   **Fix:** `docker-compose.yml` now sets `VITE_API_URL=/api` (relative,
   matching local dev), so every request goes through the now-correctly-
   targeted Vite proxy from fix #1. `VITE_AI_API_URL` was removed since
   nothing reads it.

If you pulled this repo before this fix landed: `docker-compose up --build`
again to pick up the new `frontend` environment variables, no other changes
needed.

---

## Current Limitations

- All frontend page components are placeholders.
- The frontend authentication client expects a response token and sends bearer
  tokens, while the backends use only an HTTP-only cookie. Axios also needs
  `withCredentials: true`.
- Several frontend finance and report URLs belong to an older API and are not
  mounted by the current backends.
- Upload signing accepts PDF, DOC, and DOCX MIME types, but active analysis
  supports PDF only. Word uploads currently end in `analysis_failed`.
- AI extraction always finishes in `pending_review`; a manager must activate
  the contract before finance-plan generation.
- `docker-compose.yml` still sets `AI_SERVICE_URL` / `CORE_SERVICE_URL` on
  the backends, and both `.env.example` files document `AI_SERVICE_SECRET` /
  an `x-internal-secret` header. None of these are read anywhere in `src/`
  for either backend — there is no service-to-service HTTP call today
  (matches the "Service Communication" note above). Safe to ignore or
  remove until that call is actually built.
- There are no automated frontend tests yet.

See [frontend/README.md](frontend/README.md) for the frontend integration work
that remains.

---

## Deployment

### Frontend → Vercel

```bash
cd frontend && npm run build
npx vercel --prod
# Set in Vercel dashboard:
#   VITE_API_URL = https://your-core-service.run.app/api
#   VITE_AI_API_URL = https://your-ai-service.run.app/api
```

### Backends → Google Cloud Run

```bash
# backend-core
cd backend-core
gcloud builds submit --tag gcr.io/YOUR_PROJECT/constledger-backend-core
gcloud run deploy constledger-backend-core \
  --image gcr.io/YOUR_PROJECT/constledger-backend-core \
  --platform managed --region us-central1 \
  --set-env-vars MONGODB_URI=...,JWT_SECRET=...

# backend-ai
cd backend-ai
gcloud builds submit --tag gcr.io/YOUR_PROJECT/constledger-backend-ai
gcloud run deploy constledger-backend-ai \
  --image gcr.io/YOUR_PROJECT/constledger-backend-ai \
  --platform managed --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars MONGODB_URI=...,JWT_SECRET=...,S3_BUCKET=...,AWS_REGION=...
```

The browser currently calls Backend AI directly, so a private Cloud Run
service would require an additional authenticated proxy architecture. Inject
JWT, database, S3, and AI-provider secrets through Secret Manager in production.

---

<div align="center">
Made with ❤️ by <strong>Team Octagram</strong> · ITI Graduation Project 2026
</div>
