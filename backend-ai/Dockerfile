# ── Stage 1: Build ────────────────────────────────────────────────────
# Compile TypeScript to JS and copy static assets into dist/
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer cached unless package files change)
COPY package.json package-lock.json tsconfig.json ./
RUN npm ci

# Copy source and compile
COPY src ./src
RUN npm run build


# ── Stage 2: Production image ─────────────────────────────────────────
# Lean runtime image — no TypeScript toolchain, no dev dependencies
FROM node:20-alpine AS runner

WORKDIR /app

# Install production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled output from builder stage
COPY --from=builder /app/dist ./dist

# Cloud Run sets PORT automatically (default 8080).
# The app reads process.env.PORT so no hardcoded value is needed here.
EXPOSE 8080

# Run compiled JS — never use ts-node-dev in production
CMD ["node", "dist/index.js"]