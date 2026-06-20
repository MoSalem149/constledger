# syntax=docker/dockerfile:1.7

# ───────────────────────────────────────────────────────────────────────
# Stage 1 — compile TypeScript and copy static assets into dist/
# ───────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Manifests first so npm ci is cached unless deps change
COPY package.json package-lock.json tsconfig.json ./

# Full install (dev deps included — needed for tsc)
RUN npm ci

# Source
COPY src ./src

# tsc + asset copy (see "build" script in package.json)
RUN npm run build


# ───────────────────────────────────────────────────────────────────────
# Stage 2 — runtime image
# ───────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

# dumb-init = correct PID 1 signal handling (SIGTERM -> graceful shutdown).
# wget    = lightweight HTTP client used by HEALTHCHECK below.
RUN apk add --no-cache dumb-init wget

ENV NODE_ENV=production \
    PORT=8080

WORKDIR /app

# Production-only deps, cleanly. --ignore-scripts blocks any postinstall code.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Compiled JS from the builder stage — owned by the unprivileged `node` user
COPY --from=builder --chown=node:node /app/dist ./dist

USER node

# Cloud Run defaults to 8080. Locally the app falls back to PORT if set.
EXPOSE 8080

# Health probe — hits /health every 30 seconds
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:${PORT}/health || exit 1

# dumb-init in front of node so signals reach the process correctly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
