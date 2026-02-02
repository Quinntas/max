FROM oven/bun:1.3.5-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock ./
COPY apps/ui/package.json ./apps/ui/
COPY packages/contracts/package.json ./packages/contracts/
RUN bun install --frozen-lockfile

FROM base AS builder
COPY package.json bun.lock ./
COPY apps/ui/package.json ./apps/ui/
COPY packages/contracts/package.json ./packages/contracts/
RUN bun install --frozen-lockfile
COPY packages/contracts ./packages/contracts
COPY apps/ui ./apps/ui
WORKDIR /app/apps/ui
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN bun run build

FROM nginx:alpine AS runner
COPY --from=builder /app/apps/ui/dist /usr/share/nginx/html
COPY apps/ui/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
