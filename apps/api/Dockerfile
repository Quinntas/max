FROM oven/bun:1.3.5-alpine AS base
WORKDIR /app

FROM base AS builder
COPY package.json bun.lock ./
COPY packages/contracts/package.json ./packages/contracts/
COPY apps/api/package.json ./apps/api/
RUN bun install --frozen-lockfile
COPY packages/contracts ./packages/contracts
COPY apps/api ./apps/api
WORKDIR /app/apps/api
RUN bun run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/apps/api/dist/server /app/server
USER bun
EXPOSE 5000
CMD ["/app/server"]
