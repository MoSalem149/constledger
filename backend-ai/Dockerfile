FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* tsconfig.json ./
RUN npm ci
COPY src ./src
EXPOSE 5000
CMD ["npx", "ts-node-dev", "--respawn", "--transpile-only", "src/index.ts"]
