# CSIR IoT Simulator - Dockerfile

# =====================
# Stage 1: Build
# =====================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# =====================
# Stage 2: Production
# =====================
FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S simulator -u 1001

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built files
COPY --from=builder /app/dist ./dist

# Switch to non-root user
USER simulator

# Environment variables
ENV NODE_ENV=production
ENV MQTT_BROKER_URL=mqtt://mqtt-broker:1883
ENV SIMULATION_INTERVAL=5000

# Start the simulator
CMD ["node", "dist/index.js"]
