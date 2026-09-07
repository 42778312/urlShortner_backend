# ---- base: shared package manifest + native build tools for sqlite3 ----
FROM node:20-bookworm-slim AS base
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package*.json ./

# ---- full dependencies (incl. devDependencies), used to build the app ----
FROM base AS dependencies
RUN npm ci

# ---- production-only dependencies, copied into the final image ----
FROM base AS prod-dependencies
RUN npm ci --omit=dev

# ---- compile TypeScript to JavaScript ----
FROM dependencies AS build
COPY . .
RUN npm run build

# ---- final runtime image: no compilers, just node + compiled output ----
FROM node:20-bookworm-slim AS production
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY --from=prod-dependencies /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", "dist/main.js"]
