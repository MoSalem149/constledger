# CPMS — Backend AI Service (`cpms-backend-ai`)

Node.js + Express (TypeScript) service for contract upload, parsing, OCR, and LLM-based field extraction. Pairs with **backend-core**, which handles authentication and finance planning. Both services share the same MongoDB database (`cpms`) and the same `JWT_SECRET`.

This service only **verifies** JWTs issued by backend-core — it never issues them.

**Default port:** `5000` local · `8080` Cloud Run &nbsp;·&nbsp; **TypeScript strict mode**

---

## Getting started

```bash
cp .env.example .env       # fill in real values before running
npm install
npm run dev                # http://localhost:5000 (tsx watch)
npm test                   # run focused Vitest tests once
npm run test:watch         # re-run tests while files change
npm run build              # compiles TS to dist/ and copies assets
npm start                  # runs dist/index.js
```

`GET /health` returns `{ "status": "ok", "service": "cpms-ai" }` for liveness probes.

The tests in `tests/` focus on extraction validation, including valid data,
soft review notes, and hard failures. They do not call MongoDB, S3, OCR, or an
external AI provider.

---

## Running with Docker

The Dockerfile is a multi-stage build: `builder` compiles TypeScript, `runtime` ships a small image with no toolchain. The runtime image runs as the non-root `node` user, uses `dumb-init` as PID 1 for proper signal handling, and includes a `HEALTHCHECK` that hits `/health`.

```bash
docker build -t cpms-backend-ai .
docker run --rm -p 8080:8080 --env-file .env cpms-backend-ai
```

### Deploying to Cloud Run

```bash
gcloud auth configure-docker
docker build -t gcr.io/<YOUR_PROJECT_ID>/cpms-backend-ai:test .
docker push gcr.io/<YOUR_PROJECT_ID>/cpms-backend-ai:test

gcloud run deploy cpms-backend-ai \
  --image gcr.io/<YOUR_PROJECT_ID>/cpms-backend-ai:test \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080
```

Then attach env vars (or Secret Manager refs) via `--set-env-vars` / `--set-secrets`. `PORT` is set automatically by Cloud Run — do not pass it manually. Prefer **Secret Manager** for `JWT_SECRET`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY`, and AWS credentials in production.

---

## Environment variables

See `.env.example` for the canonical list with descriptions. Required at minimum:

| Variable                                                                | Description                                          |
| ----------------------------------------------------------------------- | ---------------------------------------------------- |
| `NODE_ENV`                                                              | `development` or `production`                        |
| `MONGODB_URI`                                                           | Shared MongoDB connection string (database: `cpms`)  |
| `JWT_SECRET`                                                            | Must match backend-core exactly                      |
| `GEMINI_API_KEY` _or_ `OPENROUTER_API_KEY`                              | At least one — matching your primary/fallback choice |
| `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET` | S3 access                                            |
| `FRONTEND_URL`                                                          | CORS allowed origin (your Vercel URL in prod)        |

Optional AI tuning: `AI_PRIMARY_PROVIDER`, `AI_PRIMARY_MODEL`, `AI_FALLBACK_PROVIDER`, `AI_FALLBACK_MODEL`, `AI_REQUEST_TIMEOUT_MS`, `AI_MAX_RETRIES`, `AI_ENABLE_PAID_FALLBACK`, `AI_SCAN_INPUT_MODE` (`vision` or `ocr`).

> `JWT_EXPIRES_IN` and `AI_SERVICE_SECRET` appear in `.env.example` but are **not read anywhere in `src/`** — they look like leftovers from an in-progress internal-auth feature. Either wire them up (e.g. an `internalAuth` middleware reading `AI_SERVICE_SECRET`) or remove them from `.env.example` to avoid confusion.

---

## API endpoints

All endpoints require a valid JWT cookie set by backend-core login.

### Uploads — `/api/uploads`

| Method | Path        | Roles                 | Description                                                                                |
| ------ | ----------- | --------------------- | ------------------------------------------------------------------------------------------ |
| POST   | `/sign`     | contract_manager, pmo | Returns a presigned S3 PUT URL — the browser uploads the contract file directly to S3      |
| POST   | `/complete` | contract_manager, pmo | Records a successful upload as an UploadJob (idempotent — upsert on `(s3Key, uploadedBy)`) |

Upload flow:

1. Call `/sign` with `filename`, `mimeType`, and `size`.
2. Upload the bytes directly to the returned S3 URL with `PUT`.
3. Call `/complete` with `s3Key`, `fileName`, `mimeType`, and `size`.
4. Call `/api/contracts/upload` with the returned `uploadId`.

Clients should omit the optional `contractId` field from `/sign`; see the
known limitation below.

### Contracts — `/api/contracts`

| Method | Path           | Roles                 | Description                                                                             |
| ------ | -------------- | --------------------- | --------------------------------------------------------------------------------------- |
| GET    | `/`            | any                   | List contracts. Filters: `status`, `year`, `name`/`search`. Pagination: `limit`, `skip` |
| POST   | `/upload`      | contract_manager, pmo | Link an UploadJob to a new contract and kick off background AI analysis (202)           |
| GET    | `/:id`         | any                   | Full contract details, including a short-lived presigned PDF URL                        |
| PUT    | `/:id`         | contract_manager, pmo | Update contract fields                                                                  |
| POST   | `/:id/analyze` | contract_manager, pmo | Re-trigger AI analysis on the already-linked document                                   |

---

## Contract analysis pipeline

```
POST /api/contracts/upload
        │
        ▼
  1. Link the UploadJob to a new Contract (status: processing) and respond
     IMMEDIATELY — analysis runs in the background
        │
        ▼
  2. parseContractFile.ts
     • pdf.js extracts the text layer where present
     • scanned pages -> @napi-rs/canvas rasterizer -> tesseract.js (or skip
       OCR and feed images directly to the model, per AI_SCAN_INPUT_MODE)
        │
        ▼
  3. extractContractDataSinglePass.ts
     • Single LLM call against the full contract using assets/OrderSchema.md
     • Visual evidence (page images) attached for scanned + table pages
     • One repair pass if critical fields (parties / value / dates) are missing
        │
        ▼
  4. validateExtraction.ts  →  rules V1–V9 (hard violations throw; soft
     issues are stored as validation notes)
        │
        ▼
  5. ContractModel.findByIdAndUpdate(...)     ← user-facing record
     saveExtraction (ContractExtraction)      ← strict audit copy
```

The frontend polls `GET /api/contracts/:id` until `status` leaves `processing`.
Every successful AI run is intentionally saved as `pending_review`; the AI
never activates a contract automatically.

---

## Project structure

```
src/
├── app.ts                          # Express setup, middleware, route mounting
├── index.ts                        # Bootstrap: connect Mongo, listen
├── config/
│   ├── aiConfig.ts                 # Provider-neutral AI config (Gemini, OpenRouter, Groq)
│   ├── database.ts                 # MongoDB connection + legacy index migration
│   └── s3.ts                       # AWS S3 client
├── controllers/                    # Route handlers
├── middleware/
│   ├── jwtAuth.ts                  # Verifies the JWT cookie issued by backend-core
│   ├── authorize.ts                # Role-based access
│   └── errorMiddleware.ts          # Centralized error handler
├── models/                         # Mongoose schemas (see "Contract vs ContractExtraction" below)
├── routes/                         # Express routers
├── services/
│   └── contract-analysis/
│       ├── parseContractFile.ts                # PDF text layer + bounded OCR / vision fallback
│       ├── aiModelClient.ts                    # Provider retries, timeout, paid fallback
│       ├── extractContractDataSinglePass.ts    # Active extraction + repair pass
│       ├── validateExtraction.ts               # SRS §3.3 rules V1–V9
│       ├── saveExtraction.ts                   # Persist to MongoDB
│       ├── loadOrderSchema.ts                  # Loads the prompt schema below
│       └── assets/OrderSchema.md               # Field schema injected into every LLM prompt
├── types/                          # Shared TypeScript types (ContractExtraction etc.)
└── utils/
    ├── s3Access.ts                 # Per-user S3 key ownership check
    ├── s3Storage.ts                # Object download + presigned download URLs
    └── s3Upload.ts                 # Presigned upload URLs + key naming
```

### `Contract` vs `ContractExtraction`

Both live in `src/models/` and store the same extracted fields, but they serve different purposes:

|                   | `Contract.model.ts`                                                                                                                 | `ContractExtraction.model.ts`                                                                    |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Collection        | `contracts`                                                                                                                         | `contract_extractions`                                                                           |
| Role              | The live, user-facing contract record — what the API reads/writes/displays. `status` drives the upload → analyze → review workflow. | An audit/history copy of each extraction run, plus extraction-specific metadata.                 |
| Identity          | Has its own `_id`; referenced by `uploadedBy` (User) and `contractDocId` (UploadJob).                                               | Keyed by `contractId` (string FK to the `Contract` document) and upserted on every analysis run. |
| Extra fields      | `contractNumber` (sparse-unique, `CPMS-<uuid>`), `status: processing \| analysis_failed \| pending_review \| active`.               | `isScanned`, `validationNotes`, `status: active \| needs_review \| approved \| analysis_failed`. |
| Schema strictness | Loosely typed sub-schemas (most fields are plain `String`/`Number`).                                                                | Strictly typed sub-schemas with `required`, `min`, `enum`, `trim`.                               |
| Updated by        | `runContractAnalysis.ts` via `ContractModel.findByIdAndUpdate(...)`.                                                                | `saveExtraction.ts` via `findOneAndUpdate(..., { upsert: true })`.                               |

In short: `Contract` is what the rest of the app treats as "the contract"; `ContractExtraction` is a stricter, separately-versioned record of what the AI pipeline actually produced for it. Users can edit `Contract` directly via `PUT /api/contracts/:id`, so the two can drift over time — `ContractExtraction` is the more trustworthy source if you ever need to re-run analysis and compare.

---

## Current limitations

- The upload MIME allow-list accepts PDF, DOC, and DOCX, but
  `parseContractFile.ts` currently processes PDF only. Word documents will
  fail during analysis and move the contract to `analysis_failed`.
- `utils/s3Upload.ts:buildObjectKey` accepts a `contractId` argument and uses it
  in the S3 key prefix. `utils/s3Access.ts:assertUserOwnsS3Key` expects the
  prefix to be `contracts/{userId}/`. If a client passes `contractId` to
  `/api/uploads/sign`, `/complete` rejects the resulting key. Omit
  `contractId`.
- `JWT_EXPIRES_IN` and `AI_SERVICE_SECRET` remain in `.env.example`, but this
  service does not read them.
- Extraction computes review indicators, but the workflow deliberately sends
  every successful analysis to human review.
