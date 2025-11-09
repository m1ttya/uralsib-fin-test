FROM node:20-alpine

WORKDIR /app

# Copy backend files
COPY backend/package*.json ./backend/
RUN cd backend && npm ci

# Build backend
COPY backend/tsconfig*.json ./backend/
COPY backend/src ./backend/src
COPY backend/migrations ./backend/migrations
COPY backend/data ./backend/data
RUN cd backend && npm run build

# Production
FROM node:20-alpine
WORKDIR /app
COPY --from=0 /app/backend/dist ./backend/dist
COPY --from=0 /app/backend/node_modules ./backend/node_modules
COPY backend/package*.json ./backend/
COPY --from=0 /app/backend/migrations ./backend/migrations
COPY --from=0 /app/backend/data ./backend/data

EXPOSE 4001
WORKDIR /app/backend
CMD ["npm", "start"]
