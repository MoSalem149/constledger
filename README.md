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

### Service Communication

```
Browser
  │  HTTPS
  ▼
frontend :5173
  │  REST /api/*
  ▼
backend-core :3000  ──────────  MongoDB :27017
  │  internal (x-internal-secret)
  ▼
backend-ai :5000
```

---

## Modules

| Module                    | Description                                                                                 | AI?                 |
| ------------------------- | ------------------------------------------------------------------------------------------- | ------------------- |
| **Contracts**             | Upload PDF/DOCX contracts — AI extracts key data as JSON, user reviews & confirms           | ✅ GPT-4o           |
| **Finance**               | Auto-generate planned budget from contract; site teams submit actual progress; PMO approves | Partial             |
| **Performance & Reports** | SPI / CPI KPIs, monthly/quarterly reports, PDF & Excel export                               | ❌ Aggregation only |

---

## User Roles

| Role               | Permissions                                                 |
| ------------------ | ----------------------------------------------------------- |
| `contract_manager` | Upload contracts, review AI extractions, edit contract data |
| `pmo`              | Everything above + approve/reject reports, manage users     |
| `finance_team`     | Submit actual progress reports                              |
| `top_management`   | Read-only dashboards and reports                            |

---

## Tech Stack

| Layer             | Technology                                    |
| ----------------- | --------------------------------------------- |
| Frontend          | React 18, Vite, Tailwind CSS, React Router v6 |
| Core Backend      | Node.js, Express, Mongoose                    |
| AI Backend        | Node.js, Express, TypeScript                  |
| Database          | MongoDB (Mongoose ODM)                        |
| File Storage      | Cloudinary                                    |
| LLM               | OpenAI GPT-4o                                 |
| Auth              | JWT + RBAC                                    |
| Dev Orchestration | Docker Compose                                |

---

## Quick Start

### Option A — Docker (recommended)

**Prerequisites:** Docker Desktop, Cloudinary account, OpenAI API key.

```bash
# 1. Clone
git clone https://github.com/your-org/constledger.git && cd constledger

# 2. Create env files
cp frontend/.env.example        frontend/.env.local
cp backend-core/.env.example    backend-core/.env
cp backend-ai/.env.example      backend-ai/.env

# 3. Fill in secrets
#    backend-core/.env  →  JWT_SECRET, CLOUDINARY_*, AI_SERVICE_SECRET
#    backend-ai/.env    →  OPENAI_API_KEY, INTERNAL_SECRET

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
                             # set CORE_SERVICE_URL=http://localhost:3000
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

> Start order: MongoDB → backend-core → backend-ai → frontend

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
#   VITE_API_URL = https://your-core-service.run.app/api
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

# backend-ai (private — not accessible from browser)
cd backend-ai
gcloud builds submit --tag gcr.io/YOUR_PROJECT/constledger-backend-ai
gcloud run deploy constledger-backend-ai \
  --image gcr.io/YOUR_PROJECT/constledger-backend-ai \
  --platform managed --region us-central1 \
  --no-allow-unauthenticated \
  --set-env-vars MONGODB_URI=...,OPENAI_API_KEY=...,INTERNAL_SECRET=...
```

---

<div align="center">
Made with ❤️ by <strong>Team Octagram</strong> · ITI Graduation Project 2026
</div>
