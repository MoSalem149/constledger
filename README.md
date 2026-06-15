<div align="center">

# ConstLedger

**AI-Powered Contract & Project Management System**

> Graduation Project — Information Technology Institute (ITI) · May 2026

[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com)

</div>

---

## What is ConstLedger?

ConstLedger replaces Excel-based construction project management with a unified web platform featuring AI-powered contract analysis, financial tracking, and real-time performance reporting.

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

### Service Responsibilities

| Service | Responsibility |
| --- | --- |
| `backend-core` | Authentication & user management only. Issues JWTs; deployed on Deno Deploy. |
| `backend-ai` | All SRS business APIs (contracts, finance, performance, reports). Verifies JWTs; deployed on Google Cloud Run. |
| `frontend` | React SPA; calls both backends directly from the browser. |

### Service Communication

```
Browser
  │  HTTPS
  ▼
frontend :5173
  │  REST /api/auth, /api/users
  ├──────────────────────────────► backend-core :3000  ──── MongoDB :27017
  │
  │  REST /api/contracts, /api/finance, /api/reports, /api/uploads
  └──────────────────────────────► backend-ai   :5000  ──── MongoDB :27017
                                        │
                                        ├── OpenAI GPT-4o-mini (contract AI)
                                        └── AWS S3 (contract file storage)
```

> `backend-core` also calls `backend-ai` internally for AI-triggered actions,
> authenticating with the shared `AI_SERVICE_SECRET` header.

---

## Modules

| Module                    | Description                                                                                  | AI?                      |
| ------------------------- | -------------------------------------------------------------------------------------------- | ------------------------ |
| **Contracts**             | Upload PDF/DOCX contracts — AI extracts key data as JSON, user reviews & confirms            | ✅ GPT-4o-mini           |
| **Finance**               | Auto-generate planned budget from contract; site teams submit actual progress; PMO approves  | ✅ Budget generation     |
| **Performance & Reports** | SPI / CPI KPIs, monthly/quarterly reports, PDF & Excel export                                | ❌ Aggregation only      |

---

## User Roles

| Role               | Permissions                                                  |
| ------------------ | ------------------------------------------------------------ |
| `contract_manager` | Upload contracts, review AI extractions, edit contract data  |
| `pmo`              | Everything above + approve/reject reports, manage users      |
| `finance_team`     | Submit actual progress reports                               |
| `top_management`   | Read-only dashboards and reports                             |

---

## Tech Stack

| Layer             | Technology                                    |
| ----------------- | --------------------------------------------- |
| Frontend          | React 18, Vite, Tailwind CSS, React Router v6 |
| Core Backend      | Node.js 20, Express, Mongoose (JavaScript)    |
| AI Backend        | Node.js 20, Express, Mongoose (TypeScript)    |
| Database          | MongoDB 7 (shared between both backends)      |
| File Storage      | AWS S3 (presigned URLs for upload/download)   |
| LLM               | OpenAI GPT-4o-mini (contract & finance AI)    |
| Auth              | JWT (httpOnly cookie) + RBAC                  |
| Dev Orchestration | Docker Compose                                |
| AI Deployment     | Google Cloud Run                              |
| Core Deployment   | Deno Deploy                                   |
| Frontend Deploy   | Vercel                                        |

---

## Quick Start

### Option A — Docker (recommended)

**Prerequisites:** Docker Desktop, AWS S3 bucket, OpenAI API key.

```bash
# 1. Clone
git clone https://github.com/your-org/constledger.git && cd constledger

# 2. Create env files from examples
cp frontend/.env.example        frontend/.env.local
cp backend-core/.env.example    backend-core/.env
cp backend-ai/.env.example      backend-ai/.env

# 3. Fill in secrets — minimum required values:
#
#   backend-core/.env
#     JWT_SECRET=<long random string>          # openssl rand -hex 64
#     JWT_EXPIRES_IN=8h
#     FRONTEND_URL=http://localhost:5173
#
#   backend-ai/.env
#     JWT_SECRET=<same value as backend-core>  # ⚠️  must match
#     AI_SERVICE_SECRET=<shared secret>        # ⚠️  must match backend-core
#     OPENAI_API_KEY=sk-...
#     OPENAI_MODEL=gpt-4o-mini
#     AWS_REGION=us-east-1
#     AWS_ACCESS_KEY_ID=...
#     AWS_SECRET_ACCESS_KEY=...
#     S3_BUCKET=cpms-dev
#     FRONTEND_URL=http://localhost:5173

# 4. Start everything
docker-compose up --build
```

| Service      | URL                             |
| ------------ | ------------------------------- |
| Frontend     | http://localhost:5173           |
| Backend Core | http://localhost:3000           |
| Backend AI   | http://localhost:5000           |
| MongoDB      | mongodb://localhost:27017/cpms  |

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
cp .env.example .env   # set MONGODB_URI, JWT_SECRET, JWT_EXPIRES_IN
npm install
npm run dev
```

#### 3. backend-ai (port 5000)

```bash
cd backend-ai
cp .env.example .env   # set MONGODB_URI, JWT_SECRET (same as core),
                        # AI_SERVICE_SECRET, OPENAI_API_KEY, AWS_*, S3_*
npm install
npm run dev
```

#### 4. frontend (port 5173)

```bash
cd frontend
cp .env.example .env.local   # defaults point to localhost — no changes needed
npm install
npm run dev
```

> **Start order:** MongoDB → backend-core → backend-ai → frontend

---

## Environment Variables Reference

### backend-core

| Variable         | Required | Description |
| ---------------- | -------- | ----------- |
| `PORT`           | No       | Server port (default `3000`) |
| `NODE_ENV`       | Yes      | `development` or `production` |
| `MONGODB_URI`    | Yes      | Shared MongoDB URI — db name: `cpms` |
| `JWT_SECRET`     | Yes      | Long random string — **must match backend-ai** |
| `JWT_EXPIRES_IN` | No       | Token lifetime (default `8h`) |
| `FRONTEND_URL`   | No       | CORS allowed origin (Vercel URL in prod) |

### backend-ai

| Variable               | Required | Description |
| ---------------------- | -------- | ----------- |
| `PORT`                 | No       | Auto-set by Cloud Run (8080); defaults to `5000` locally |
| `NODE_ENV`             | Yes      | `development` or `production` |
| `MONGODB_URI`          | Yes      | Same shared MongoDB URI as backend-core |
| `JWT_SECRET`           | Yes      | **Must match backend-core** exactly |
| `JWT_EXPIRES_IN`       | No       | Token lifetime (default `8h`) |
| `OPENAI_API_KEY`       | Yes      | OpenAI secret key |
| `OPENAI_MODEL`         | No       | Model name (default `gpt-4o-mini`) |
| `FRONTEND_URL`         | Yes      | CORS allowed origin |
| `AI_SERVICE_SECRET`    | Yes      | Shared secret for internal backend-core → backend-ai calls |
| `AWS_REGION`           | Yes      | S3 bucket region |
| `AWS_ACCESS_KEY_ID`    | Yes      | IAM key with S3 read/write |
| `AWS_SECRET_ACCESS_KEY`| Yes      | IAM secret |
| `S3_BUCKET`            | Yes      | Bucket name for contract file storage |
| `S3_UPLOAD_URL_TTL`    | No       | Presigned upload URL TTL in seconds (default `300`) |
| `S3_DOWNLOAD_URL_TTL`  | No       | Presigned download URL TTL in seconds (default `900`) |
| `S3_MAX_FILE_SIZE`     | No       | Max upload size in bytes (default `52428800` = 50 MB) |

### frontend

| Variable          | Description |
| ----------------- | ----------- |
| `VITE_API_URL`    | Base URL of backend-core (no trailing `/api`) |
| `VITE_AI_API_URL` | Base URL of backend-ai (no trailing `/api`) |

---

## Health Checks

```bash
curl http://localhost:3000/health   # {"status":"ok","service":"cpms-core"}
curl http://localhost:5000/health   # {"status":"ok","service":"cpms-ai"}
```

---

## Deployment

### Frontend → Vercel

```bash
cd frontend && npm run build
npx vercel --prod
# Set in Vercel dashboard:
#   VITE_API_URL    = https://your-core-service.example.com
#   VITE_AI_API_URL = https://your-ai-service.run.app
```

### backend-core → Deno Deploy

```bash
# Push to the branch connected to your Deno Deploy project.
# Set env vars in the Deno Deploy dashboard:
#   NODE_ENV, MONGODB_URI, JWT_SECRET, JWT_EXPIRES_IN, FRONTEND_URL
```

### backend-ai → Google Cloud Run

```bash
cd backend-ai
gcloud builds submit --tag gcr.io/YOUR_PROJECT/constledger-backend-ai
gcloud run deploy constledger-backend-ai \
  --image gcr.io/YOUR_PROJECT/constledger-backend-ai \
  --platform managed --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars NODE_ENV=production \
  --set-env-vars MONGODB_URI="mongodb+srv://..." \
  --set-env-vars JWT_SECRET="..." \
  --set-env-vars JWT_EXPIRES_IN="8h" \
  --set-env-vars OPENAI_API_KEY="sk-..." \
  --set-env-vars OPENAI_MODEL="gpt-4o-mini" \
  --set-env-vars FRONTEND_URL="https://your-app.vercel.app" \
  --set-env-vars AI_SERVICE_SECRET="..." \
  --set-env-vars AWS_REGION="us-east-1" \
  --set-env-vars AWS_ACCESS_KEY_ID="..." \
  --set-env-vars AWS_SECRET_ACCESS_KEY="..." \
  --set-env-vars S3_BUCKET="cpms-prod" \
  --set-env-vars S3_UPLOAD_URL_TTL="300" \
  --set-env-vars S3_DOWNLOAD_URL_TTL="900" \
  --set-env-vars S3_MAX_FILE_SIZE="52428800"
```

> Prefer **Secret Manager** for sensitive values (`OPENAI_API_KEY`, `JWT_SECRET`, etc.) over `--set-env-vars` in production.

---

<div align="center">
Made with ❤️ by <strong>Team Octagram</strong> · ITI Graduation Project 2026
</div>