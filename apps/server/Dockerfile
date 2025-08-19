# ================================================================
# Optimized Dockerfile with proper layer caching
# ================================================================

# Stage 1: Dependencies
# This stage only rebuilds when package files change
FROM node:22-alpine AS deps
WORKDIR /app

# Install pnpm and bun
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN npm install -g bun@1.2.15

# Copy only package files for dependency resolution
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/*/package.json ./packages/*/
COPY apps/server/package.json ./apps/server/

# Install dependencies with frozen lockfile
# This layer is cached and only rebuilds when dependencies change
RUN pnpm install --frozen-lockfile --ignore-scripts --no-optional

# ================================================================
# Stage 2: Builder
# This stage rebuilds when source code changes
FROM node:22-alpine AS builder
WORKDIR /app

# Install pnpm and bun
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN npm install -g bun@1.2.15

# Set build environment
ENV DOCKER_BUILD=true
ENV CI=true
ARG TURBO_TOKEN
ARG TURBO_TEAM
ARG COMMIT_SHA
ARG BUILD_DATE

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/*/node_modules ./packages/*/node_modules
COPY --from=deps /app/apps/server/node_modules ./apps/server/node_modules

# Copy all source files
COPY . .

# Build with Turbo (uses remote cache if available)
RUN if [ -n "$TURBO_TOKEN" ] && [ -n "$TURBO_TEAM" ]; then \
      echo "Building with Turbo remote cache" && \
      turbo run build --filter=@buster-app/server; \
    else \
      echo "Building without Turbo remote cache" && \
      turbo run build --filter=@buster-app/server --force; \
    fi

# Build the final server bundle
WORKDIR /app/apps/server
RUN bun build src/index.ts --outdir ./dist --target bun --external pino-pretty && \
    echo "Build complete - output:" && \
    ls -la dist/

# ================================================================
# Stage 3: Production Runtime
# Minimal image with only what's needed to run
FROM oven/bun:1.2.15-alpine AS runtime
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Add build metadata as labels
ARG COMMIT_SHA
ARG BUILD_DATE
LABEL org.opencontainers.image.revision="${COMMIT_SHA}"
LABEL org.opencontainers.image.created="${BUILD_DATE}"

# Create non-root user
RUN addgroup --system --gid 1001 bunuser && \
    adduser --system --uid 1001 bunuser

# Copy only the necessary files from builder
COPY --from=builder --chown=bunuser:bunuser /app/apps/server/dist ./dist
COPY --from=builder --chown=bunuser:bunuser /app/apps/server/package.json ./
COPY --from=builder --chown=bunuser:bunuser /app/node_modules ./node_modules

# Show image size info
RUN echo "=== Production image size ===" && \
    du -sh /app && \
    echo "Commit: ${COMMIT_SHA:-unknown}" && \
    echo "Built: ${BUILD_DATE:-unknown}"

USER bunuser
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun -e "fetch('http://localhost:' + (process.env.SERVER_PORT || 3002) + '/healthcheck').then(r => r.ok ? process.exit(0) : process.exit(1))"

# Start the application
CMD ["bun", "run", "dist/index.js"]