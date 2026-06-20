# syntax=docker/dockerfile:1.7

# ───────────────────────────────────────────────────────────────────────
# Stage 1 — install production dependencies in a clean layer
# ───────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy only manifest files first so npm ci is cached unless deps change
COPY package.json package-lock.json* ./

# --omit=dev drops nodemon and any future devDeps. --ignore-scripts avoids
# arbitrary postinstall code running during the build.
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force


# ───────────────────────────────────────────────────────────────────────
# Stage 2 — runtime image
# ───────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

# dumb-init forwards signals correctly (SIGTERM -> graceful shutdown).
# wget is alpine's lightweight HTTP client, used by HEALTHCHECK below.
RUN apk add --no-cache dumb-init wget

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app

# Bring the production node_modules over from the deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./

# Application source — owned by the unprivileged `node` user that ships with the image
COPY --chown=node:node src ./src

USER node

EXPOSE 3000

# Container health probe — hits /health every 30s
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:${PORT}/health || exit 1

# dumb-init -> node so PID 1 handles signals correctly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/index.js"]
