# Use Node.js LTS with Alpine for smaller image size
FROM node:22-alpine AS base

# Install pnpm globally
RUN npm install -g pnpm@9

# Set working directory
WORKDIR /app

# Install system dependencies for better compatibility
RUN apk add --no-cache libc6-compat

# Enable pnpm store directory
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Dependencies stage
FROM base AS deps

# Copy package manager files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies with pnpm
RUN pnpm config set store-dir /pnpm/.pnpm-store
RUN --mount=type=cache,id=pnpm,target=/pnpm/.pnpm-store \
    pnpm install --frozen-lockfile --prod=false

# Source build stage
FROM base AS builder

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy source files
COPY . .

# Build arguments for environment variables
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Generate documentation before build
RUN pnpm generate-docs

# Build the application
RUN pnpm build

# Production dependencies stage
FROM base AS prod-deps

COPY package.json pnpm-lock.yaml* ./

# Install only production dependencies
RUN pnpm config set store-dir /pnpm/.pnpm-store
RUN --mount=type=cache,id=pnpm,target=/pnpm/.pnpm-store \
    pnpm install --frozen-lockfile --prod

# Runtime stage
FROM node:22-alpine AS runner

WORKDIR /app

# Install dumb-init for better signal handling
RUN apk add --no-cache dumb-init

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy production dependencies
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/docs ./docs

# Create .next directory with proper permissions
RUN mkdir -p .next && chown -R nextjs:nodejs .next

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node --version || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]