# ==========================================
# Multi-stage Dockerfile for MathRoots
# ==========================================

# 1. Build Stage
FROM node:22-alpine AS builder
WORKDIR /app

# Install dependencies first for optimal Docker layer caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy application source
COPY . .

# Build Vite client assets and esbuild server bundle
RUN npm run build

# 2. Production Runtime Stage
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install curl for Docker healthcheck
RUN apk add --no-cache curl

# Create non-root system user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy dependencies manifest and install production-only packages
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy pre-compiled distribution assets from builder
COPY --from=builder /app/dist ./dist

# Set correct ownership for non-root execution
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 3000

# Container Healthcheck
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "dist/server.cjs"]
