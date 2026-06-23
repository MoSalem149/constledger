# syntax=docker/dockerfile:1.7

# ───────────────────────────────────────────────────────────────────────
# Stage 1 — install dependencies and build the Vite app
# ───────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Manifests first so npm ci is cached unless deps change
COPY package.json package-lock.json ./

# Full install (vite and plugins are devDeps — needed for the build step)
RUN npm ci --ignore-scripts

# Application source
COPY . .

# VITE_API_URL must be set at BUILD TIME — Vite bakes it into the JS bundle.
# Pass it as: docker build --build-arg VITE_API_URL=/api ...
# For Docker deployments /api is correct; nginx proxies it to the backends.
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

# Produce the static bundle in dist/
RUN npm run build


# ───────────────────────────────────────────────────────────────────────
# Stage 2 — runtime image (nginx serves the static files + proxies /api)
# ───────────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Remove the default nginx page
RUN rm -rf /usr/share/nginx/html/*

# Copy the built assets from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy the nginx config template — it contains ${CORE_BACKEND_URL} and
# ${AI_BACKEND_URL} placeholders that envsubst fills in at container start.
COPY nginx.conf /etc/nginx/templates/default.conf.template

# nginx:alpine includes envsubst via gettext. When the container starts,
# the official nginx image automatically processes any *.template files in
# /etc/nginx/templates/ and writes the result to /etc/nginx/conf.d/.
# Set CORE_BACKEND_URL and AI_BACKEND_URL at runtime via docker run -e or
# docker-compose environment: section.

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]