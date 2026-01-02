# React Frontend Production Dockerfile
# Multi-stage build for optimized production image

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Build production bundle
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config as template (uses $PORT variable)
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Railway provides PORT env var; default to 3000 for local dev
ENV PORT=3000

# nginx:alpine image auto-runs envsubst on /etc/nginx/templates/*.template files
# and outputs to /etc/nginx/conf.d/

CMD ["nginx", "-g", "daemon off;"]
