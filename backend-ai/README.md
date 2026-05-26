# CPMS — Backend AI Service

Node.js + Express (TypeScript) internal AI microservice.  
**Deployed to:** Google Cloud Run — **separate service, not publicly accessible**  
**Local dev port:** `5000`

---

## ⚠️ Internal Service Only

This service is **never called directly from the browser or frontend**. It is only called by `backend-core` using a shared secret header:

```
x-internal-secret: <INTERNAL_SECRET>
```

Any request without this header is rejected with `403 Forbidden`. In production, deploy with `--no-allow-unauthenticated` on Cloud Run.

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server (hot-reload with ts-node-dev)
npm run dev    # → http://localhost:5000

# Build TypeScript to JS
npm run build

# Run compiled output
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
| `PORT` | No | Server port (default `5000`) |
| `NODE_ENV` | Yes | `development` or `production` |
| `MONGODB_URI` | Yes | Same MongoDB as backend-core |
| `OPENAI_API_KEY` | Yes* | OpenAI API key for GPT-4o |
| `ANTHROPIC_API_KEY` | Yes* | Alternative: Anthropic Claude API key |
| `INTERNAL_SECRET` | Yes | Must match `AI_SERVICE_SECRET` in backend-core |
| `CORE_SERVICE_URL` | Yes | URL of backend-core (to write results back) |

*Set one LLM key — OpenAI or Anthropic, not both.

---

## Project Structure

```
src/
├── index.ts                  # Entry point — connects DB, starts server
├── app.ts                    # Express app — registers routes & middleware
│
├── config/
│   └── database.ts           # Mongoose connection (shared DB with core)
│
├── middleware/
│   ├── internalAuth.ts       # Validates x-internal-secret header
│   └── errorMiddleware.ts    # Global error handler + 404
│
├── types/
│   └── index.ts              # Shared TypeScript interfaces (ContractExtraction, etc.)
│
├── controllers/
│   └── contractAiController.ts  # Orchestrates the full analysis pipeline
│
├── routes/
│   ├── contractAiRoutes.ts   # POST /:contractId/analyze
│   ├── financeAiRoutes.ts    # AI finance forecasting (placeholder)
│   └── performanceAiRoutes.ts # AI performance analysis (placeholder)
│
├── services/
│   ├── contract-analysis/
│   │   ├── parseContractFile.ts    # Downloads file, extracts text (PDF + DOCX)
│   │   └── extractContractData.ts  # Sends text to LLM, returns typed JSON
│   │
│   ├── finance-ai/
│   │   └── generateBudgetPlan.ts   # Splits contract value into budget periods
│   │
│   └── performance-ai/             # Future: SPI/CPI predictions
│
└── utils/                    # Pure helpers
```

---

## AI Endpoints

### Contract Analysis — `/api/ai/contracts`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/:contractId/analyze` | Full pipeline: download → parse → LLM → write back to DB |

### Finance AI — `/api/ai/finance`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Service health check |

### Performance AI — `/api/ai/performance`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Service health check |

---

## Contract Analysis Pipeline

```
backend-core  →  POST /api/ai/contracts/:id/analyze
                        │
                        ▼
              1. Fetch contract record from backend-core
                        │
                        ▼
              2. Download file from Cloudinary URL
                        │
                        ▼
              3. Extract text
                 • PDF  → pdf-parse
                 • DOCX → mammoth
                        │
                        ▼
              4. Send text to GPT-4o
                 System: "Return ONLY valid JSON"
                 Fields: parties, contract_value, currency,
                         unit_prices, payment_terms,
                         payment_schedule, start_date,
                         end_date, duration_days,
                         reporting_period, milestones, penalties
                        │
                        ▼
              5. Parse JSON response (typed as ContractExtraction)
                        │
                        ▼
              6. PUT extracted fields back to backend-core
                 status → "pending_review"
                        │
                        ▼
              7. Auto-generate planned budget (generateBudgetPlan)
                 POST planned budget back to backend-core
```

**Error handling:** If any step fails, the contract status is set to `analysis_failed` and the error is logged. The user can trigger re-analysis from the UI.

---

## LLM Prompt Design

The prompt in `extractContractData.ts` enforces:
- Response format: `json_object` (OpenAI structured output)
- Temperature: `0` — deterministic, no creativity
- Missing fields → `null`, never guessed
- Context window guard: contract text is truncated at 80,000 characters

---

## TypeScript Key Types

```typescript
// The exact shape the LLM must return
interface ContractExtraction {
  parties:          { name: string; role: string }[] | null;
  contract_value:   number | null;
  currency:         string | null;
  unit_prices:      { item: string; unit: string; unit_price: number }[] | null;
  payment_terms:    string | null;
  payment_schedule: { date: string; amount: number }[] | null;
  start_date:       string | null;  // "YYYY-MM-DD"
  end_date:         string | null;
  duration_days:    number | null;
  reporting_period: 'weekly' | 'monthly' | null;
  milestones:       { name: string; due_date: string }[] | null;
  penalties:        { condition: string; penalty: string }[] | null;
}
```

---

## Deployment (Google Cloud Run — private)

```bash
# Build and push
gcloud builds submit --tag gcr.io/YOUR_PROJECT/cpms-backend-ai

# Deploy (no public access)
gcloud run deploy cpms-backend-ai \
  --image gcr.io/YOUR_PROJECT/cpms-backend-ai \
  --platform managed \
  --region us-central1 \
  --no-allow-unauthenticated \
  --set-env-vars NODE_ENV=production,MONGODB_URI=...,OPENAI_API_KEY=...,INTERNAL_SECRET=...
```

After deploying, copy the Cloud Run service URL and set it as `AI_SERVICE_URL` in backend-core's env.
