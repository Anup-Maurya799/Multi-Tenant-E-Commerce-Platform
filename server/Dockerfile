# Multi-stage build: install dependencies in a full image, run in a lean one.
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
# Omit devDependencies (jest, nodemon, etc.) — not needed at runtime.
RUN npm ci --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Run as a non-root user — a container running as root is a real privilege-
# escalation risk if the app is ever compromised.
RUN addgroup -S nodegrp && adduser -S nodeuser -G nodegrp
COPY --from=deps /app/node_modules ./node_modules
COPY . .
USER nodeuser

EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "require('http').get('http://localhost:5000/api/v1/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "src/server.js"]