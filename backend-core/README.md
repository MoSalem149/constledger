# CPMS — Backend Core (`cpms-backend-core`)

Node.js + Express (JavaScript) REST API — **authentication & user management only**.  
**Deployed to:** Deno Deploy  
**Local dev port:** `3000`

All SRS business APIs (contracts, finance, performance, reports) live on **backend-ai** (port 5000).

---

## Getting Started

```bash
npm install
npm run dev    # → http://localhost:3000
npm start
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default `3000`) |
| `NODE_ENV` | Yes | `development` or `production` |
| `MONGODB_URI` | Yes | MongoDB connection string (shared with AI backend for user refs) |
| `JWT_SECRET` | Yes | Long random string for signing tokens |
| `JWT_EXPIRES_IN` | No | Token lifetime (default `8h`) |
| `FRONTEND_URL` | No | Allowed CORS origin in production |

---

## API Endpoints

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/login` | Public | Login, returns JWT via httpOnly cookie |
| POST | `/logout` | Protected | Clear auth cookie |
| GET | `/me` | Protected | Get current user |

### Users — `/api/users` *(PMO role only)*

| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Create user |
| GET | `/` | List users (excludes protected admin) |
| GET | `/:id` | Get user |
| PUT | `/:id` | Update user (name, email, role, isActive, password) |
| DELETE | `/:id` | Hard-delete user |

> The oldest active PMO account is a **protected admin** — it cannot be read, modified, or deleted via the API.

---

## JWT Token

Tokens are issued as **httpOnly cookies** (`token`) and expire in `8h` by default.  
The payload `{ id, role }` lets the AI backend authorize SRS endpoints without a round-trip to core.

---

## Health Check

```
GET /health  →  { "status": "ok", "service": "cpms-core" }
```

---

## Roles

| Role | Access |
|------|--------|
| `pmo` | Full access to `/api/users` |
| `contract_manager` | Auth endpoints only |
| `finance_team` | Auth endpoints only |
| `top_management` | Auth endpoints only |
