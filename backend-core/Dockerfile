# ── Stage 1: Production image ─────────────────────────────────────────
# Single-stage runtime image for plain JavaScript apps.
# Installs only production dependencies and runs source directly.
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy application source
COPY src ./src

# Expose the application port
EXPOSE 3000

# Run the app directly from source
CMD ["node", "src/index.js"]