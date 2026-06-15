# CPMS — Backend AI Service

Node.js + Express (TypeScript) — **all SRS business APIs** powered by AI models.  
**Deployed to:** Google Cloud Run  
**Local dev port:** `5000`

Authentication is handled by **backend-core**. This service only **verifies** JWTs issued by core — it never issues them.

---

## Getting Started

```bash
npm install
npm run dev       # → http://localhost:5000
npm run build     # compiles TS → dist/
npm start         # runs dist/index.js
```

---

## Deploying to Cloud Run (branch: test)

### 1. Build and push the image

```bash
# Authenticate with GCP
gcloud auth configure-docker

# Build the production image
docker build -t gcr.io/<YOUR_PROJECT_ID>/cpms-backend-ai:test .

# Push to Container Registry
docker push gcr.io/<YOUR_PROJECT_ID>/cpms-backend-ai:test
```

### 2. Deploy to Cloud Run

```bash
gcloud run deploy cpms-backend-ai \
  --image gcr.io/<YOUR_PROJECT_ID>/cpms-backend-ai:test \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars NODE_ENV=production \
  --set-env-vars MONGODB_URI="mongodb+srv://..." \
  --set-env-vars OPENAI_API_KEY="sk-..." \
  --set-env-vars OPENAI_MODEL="gpt-4o-mini" \
  --set-env-vars JWT_SECRET="..." \
  --set-env-vars FRONTEND_URL="https://<your-app>.vercel.app" \
  --set-env-vars AI_SERVICE_SECRET="..." \
  --set-env-vars AWS_REGION="us-east-1" \
  --set-env-vars AWS_ACCESS_KEY_ID="..." \
  --set-env-vars AWS_SECRET_ACCESS_KEY="..." \
  --set-env-vars S3_BUCKET="cpms-prod" \
  --set-env-vars S3_UPLOAD_URL_TTL="300" \
  --set-env-vars S3_DOWNLOAD_URL_TTL="900" \
  --set-env-vars S3_MAX_FILE_SIZE="52428800"
```

> **PORT** is set automatically by Cloud Run — do not pass it manually.  
> Prefer using **Secret Manager** for sensitive values (`OPENAI_API_KEY`, `JWT_SECRET`, etc.) instead of `--set-env-vars` in production.

---

## Environment Variables

See `.env.example` for full descriptions of every variable.

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Auto-set by Cloud Run (8080). Defaults to `5000` locally. |
| `NODE_ENV` | Yes | `development` or `production` |
| `MONGODB_URI` | Yes | Shared MongoDB Atlas URI — database name: `cpms` |
| `OPENAI_API_KEY` | Yes | OpenAI secret key |
| `OPENAI_MODEL` | No | Model name (default `gpt-4o-mini`) |
| `JWT_SECRET` | Yes | Must match `JWT_SECRET` in backend-core exactly |
| `FRONTEND_URL` | Yes | CORS allowed origin (Vercel URL in production) |
| `AI_SERVICE_SECRET` | Yes | Shared secret for internal backend-core → backend-ai calls |
| `AWS_REGION` | Yes | S3 bucket region |
| `AWS_ACCESS_KEY_ID` | Yes | IAM key with S3 read/write access |
| `AWS_SECRET_ACCESS_KEY` | Yes | IAM secret |
| `S3_BUCKET` | Yes | Bucket name for contract file storage |
| `S3_UPLOAD_URL_TTL` | No | Presigned upload URL TTL in seconds (default `300`) |
| `S3_DOWNLOAD_URL_TTL` | No | Presigned download URL TTL in seconds (default `900`) |
| `S3_MAX_FILE_SIZE` | No | Max upload size in bytes (default `52428800` = 50 MB) |

---

## API Endpoints (SRS)

All endpoints require a valid JWT cookie set by backend-core login.

### Upload — `/api/uploads`
| Method | Path | Roles | Description |
|---|---|---|---|
| POST | `/sign` | contract_manager, pmo | Get a presigned S3 URL to upload a contract PDF |
| POST | `/complete` | contract_manager, pmo | Confirm upload done and trigger AI analysis pipeline |

### Contracts — `/api/contracts`
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/` | Any | List all contracts |
| GET | `/:id` | Any | Get full contract details |
| PUT | `/:id` | contract_manager, pmo | Update contract fields |
| GET | `/:id/timeline` | Any | Get milestones timeline |
| POST | `/:id/analyze` | contract_manager, pmo | Re-trigger AI analysis |

### Finance — `/api/finance`
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/:contractId/planned` | Any | Get AI-generated planned budget |
| PUT | `/:contractId/planned` | pmo | Edit planned budget |
| GET | `/:contractId/actual` | Any | List actual reports |
| POST | `/:contractId/actual` | finance_team, pmo | Submit actual report |
| PUT | `/:contractId/actual/:id` | finance_team, pmo | Edit pending report |
| POST | `/:contractId/actual/:id/approve` | pmo | Approve report |
| POST | `/:contractId/actual/:id/reject` | pmo | Reject report |
| GET | `/:contractId/comparison` | Any | Planned vs actual comparison |

### Reports — `/api/reports`
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/contracts` | Any | All contracts summary report |
| GET | `/monthly` | Any | Monthly planned vs actual |
| GET | `/quarterly` | Any | Quarterly report |
| GET | `/project/:id/performance` | Any | Per-project KPIs (SPI, CPI) |
| GET | `/penalties` | Any | Penalties report |
| POST | `/export` | Any | Export report |

### Internal (backend-core only) — `/api/internal`
| Method | Path | Description |
|---|---|---|
| POST | `/contracts/:contractId/analyze` | Trigger AI contract analysis (requires `AI_SERVICE_SECRET` header) |

---

## Contract Analysis Pipeline

```
POST /api/uploads/complete
        │
        ▼
  1. Confirm S3 upload → create contract record (status: processing)
        │
        ▼
  2. Parse PDF → rasterize pages + Arabic OCR (tesseract.js)
        │
        ▼
  3. GPT-4o vision → extract SRS §3.3 fields against OrderSchema
        │
        ▼
  4. Validate extraction → update contract (status: completed | analysis_failed)
        │
        ▼
  5. Auto-generate planned budget (generateBudgetPlan)
```

---

## Project Structure

```
src/
├── app.ts                          # Express app setup, middleware, route mounting
├── index.ts                        # Entry point — starts HTTP server
├── config/
│   ├── aiConfig.ts                 # OpenAI client setup
│   ├── database.ts                 # MongoDB connection
│   └── s3.ts                       # AWS S3 client setup
├── controllers/                    # Route handlers
├── middleware/
│   ├── jwtAuth.ts                  # Verify JWT cookie from backend-core
│   ├── authorize.ts                # Role-based access control
│   ├── internalAuth.ts             # Validate AI_SERVICE_SECRET header
│   └── errorMiddleware.ts          # Global error handler
├── models/                         # Mongoose schemas
├── routes/                         # Express routers
├── services/
│   └── contract-analysis/          # Full AI analysis pipeline
│       ├── parseContractFile.ts    # PDF rasterization + OCR
│       ├── extractContractData.ts  # GPT-4o extraction
│       ├── validateExtraction.ts   # Schema validation
│       ├── saveExtraction.ts       # Persist to MongoDB
│       └── assets/OrderSchema.md   # Field schema fed to GPT
├── types/                          # Shared TypeScript types
└── utils/
    ├── s3Access.ts                 # Presigned download URLs
    ├── s3Storage.ts                # S3 object operations
    └── s3Upload.ts                 # Presigned upload URLs
```