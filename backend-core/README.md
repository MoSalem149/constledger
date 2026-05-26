# CPMS — Backend Core

Node.js + Express (JavaScript) REST API — the main application server.  
**Deployed to:** Google Cloud Run  
**Local dev port:** `3000`

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server (hot-reload)
npm run dev    # → http://localhost:3000

# Start production server
npm start
```

> In Docker, this is handled automatically by `docker-compose up` from the project root.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in values:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default `3000`) |
| `NODE_ENV` | Yes | `development` or `production` |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Long random string for signing tokens |
| `JWT_EXPIRES_IN` | No | Token lifetime (default `7d`) |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary account cloud name |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret |
| `AI_SERVICE_URL` | Yes | Internal URL of the AI backend |
| `AI_SERVICE_SECRET` | Yes | Shared secret for AI service calls |
| `FRONTEND_URL` | No | Allowed CORS origin in production |

---

## Project Structure

```
src/
├── index.js              # Entry point — connects DB, starts server
├── app.js                # Express app — registers middleware & routes
│
├── config/
│   └── database.js       # Mongoose connection
│
├── middleware/
│   ├── authMiddleware.js  # JWT verification + role authorization
│   └── errorMiddleware.js # Global error handler + 404
│
├── models/               # Mongoose schemas
│   ├── User.js           # User with role-based access
│   ├── Contract.js       # Contract + AI-extracted fields
│   ├── PlannedBudget.js  # Auto-generated budget schedule per contract
│   └── ActualReport.js   # Site-submitted progress reports
│
├── controllers/          # Request handlers (thin — business logic in services/)
│   ├── authController.js
│   ├── contractController.js
│   ├── financeController.js
│   └── reportController.js
│
├── routes/               # Express routers
│   ├── authRoutes.js
│   ├── contractRoutes.js
│   ├── financeRoutes.js
│   ├── reportRoutes.js
│   └── userRoutes.js
│
├── services/             # Business logic, third-party calls (add as needed)
└── utils/                # Pure helpers (date math, formatting, etc.)
```

---

## API Endpoints

### Auth — `/api/auth`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | Public | Create new user |
| POST | `/login` | Public | Login, returns JWT |
| GET | `/me` | Any role | Get current user |

### Contracts — `/api/contracts`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Any role | List contracts (filter: status, year, search) |
| POST | `/upload` | contract_manager, pmo | Upload contract file + trigger AI |
| GET | `/:id` | Any role | Get full contract |
| PUT | `/:id` | contract_manager, pmo | Update contract fields |
| POST | `/:id/analyze` | contract_manager, pmo | Re-trigger AI analysis |
| GET | `/:id/timeline` | Any role | Get milestones as timeline |

### Finance — `/api/finance`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/planned/:contractId` | Any role | Get planned budget for a contract |
| PUT | `/planned/:contractId` | pmo | Edit planned budget periods |
| GET | `/actual` | Any role | List actual reports (filter: contractId, status) |
| POST | `/actual` | finance_team, pmo | Submit actual progress report |
| PUT | `/actual/:id/approve` | pmo | Approve submitted report |
| PUT | `/actual/:id/reject` | pmo | Reject with reason |

### Reports — `/api/reports`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/contracts` | Any role | All contracts report (filter: year, status) |
| GET | `/monthly` | Any role | Monthly planned vs actual |
| GET | `/performance/:projectId` | Any role | Per-project KPIs (SPI, CPI, variance) |

### Users — `/api/users`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | pmo | List all users |

---

## Data Models

### Contract — key fields
```
status: processing → pending_review → active
         analysis_failed (on LLM error)
```

### ActualReport — status flow
```
pending → approved   (by PMO)
        → rejected   (by PMO, with reason)
```

---

## AI Integration

When a contract is uploaded or re-analyzed, `contractController` fires a **fire-and-forget** POST to the AI service:

```
POST http://backend-ai:5000/api/ai/contracts/:id/analyze
Headers: x-internal-secret: <AI_SERVICE_SECRET>
```

The AI service processes asynchronously and writes results back to MongoDB directly. The frontend polls `GET /api/contracts/:id` to detect when `status` changes from `processing` to `pending_review`.

---

## Deployment (Google Cloud Run)

```bash
# Build and push Docker image
gcloud builds submit --tag gcr.io/YOUR_PROJECT/cpms-backend-core

# Deploy
gcloud run deploy cpms-backend-core \
  --image gcr.io/YOUR_PROJECT/cpms-backend-core \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,MONGODB_URI=...,JWT_SECRET=...
```
