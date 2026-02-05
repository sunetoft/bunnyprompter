FROM node:18-alpine AS base

# 1. Install dependencies only when needed
FROM base AS deps
# Add build dependencies for sqlite3 and other native modules
RUN apk add --no-cache libc6-compat python3 py3-pip make g++ tzdata
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN \
  if [ -f package-lock.json ]; then npm ci; \
  else echo "Lockfile not found." && exit 1; \
  fi

# 2. Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# 3. Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Install runtime dependencies: Python for stock data scripts
RUN apk add --no-cache python3 py3-pip tzdata
RUN pip3 install --no-cache-dir yfinance pandas numpy --break-system-packages

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set up data directories
RUN mkdir -p data st-analysis
RUN chown -R nextjs:nodejs data st-analysis

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Copy scripts only (user data excluded via .dockerignore)
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

USER nextjs

EXPOSE 3000

ENV PORT 3000

# Server.js is created by next build from the standalone output
CMD ["node", "server.js"]
