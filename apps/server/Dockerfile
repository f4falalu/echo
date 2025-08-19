# Fresh build Dockerfile without caching layers
# ================================================================
# This Dockerfile handles:
# - Fresh dependency installation (no cached base image)
# - Source code building  
# - Production runtime

FROM node:22-alpine AS builder
WORKDIR /app

# Install pnpm and bun
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN npm install -g bun@1.2.15

# Set build environment to skip runtime validation
ENV DOCKER_BUILD=true
ENV CI=true

RUN echo "=== FRESH BUILD START ==="

# Copy all package files for fresh install
COPY package.json pnpm-lock.yaml* turbo.json* pnpm-workspace.yaml* ./
COPY packages/ ./packages/
COPY apps/server/ ./apps/server/

# Fresh install - no caching, clean install every time
RUN START=$(date +%s) && \
    echo "=== Starting fresh dependency installation ===" && \
    rm -rf node_modules && \
    rm -rf ~/.pnpm-store && \
    time pnpm install --frozen-lockfile --ignore-scripts --no-optional && \
    END=$(date +%s) && \
    echo "Finished fresh dependency installation in $((END - START)) seconds"

# Force fresh turbo build without cache
RUN START=$(date +%s) && \
    echo "=== Starting fresh turbo build ===" && \
    rm -rf .turbo && \
    time turbo run build --filter=@buster-app/server --force && \
    END=$(date +%s) && \
    echo "Finished fresh turbo build in $((END - START)) seconds"


# Build the application (fresh bun build)
RUN START=$(date +%s) && \
    echo "=== Starting fresh application build ===" && \
    cd apps/server && \
    rm -rf dist && \
    time bun build src/index.ts --outdir ./dist --target bun --external pino-pretty && \
    echo "Build complete - output:" && \
    ls -la dist/ && \
    END=$(date +%s) && \
    echo "Finished fresh application build in $((END - START)) seconds"

# Production runtime (minimal bun image)
FROM oven/bun:1.2.15-alpine AS runtime
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 bunuser && \
    adduser --system --uid 1001 bunuser

# Copy built application and dependencies
COPY --from=builder --chown=bunuser:bunuser /app/apps/server/dist ./dist
COPY --from=builder --chown=bunuser:bunuser /app/apps/server/package.json ./
COPY --from=builder --chown=bunuser:bunuser /app/node_modules ./node_modules

# Show final stats
RUN echo "=== Fresh production image prepared ===" && \
    du -sh /app && \
    echo "Ready to run with no cached artifacts!"

USER bunuser
EXPOSE 3002

# Health check for production
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun -e "fetch('http://localhost:' + (process.env.SERVER_PORT || 3002) + '/healthcheck').then(r => r.ok ? process.exit(0) : process.exit(1))"

# Start the application
CMD ["bun", "run", "dist/index.js"] 