FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Build
COPY tsconfig*.json ./
COPY src ./src
RUN npm run build

# Production
FROM node:18-alpine
WORKDIR /app
COPY --from=0 /app/dist ./dist
COPY --from=0 /app/node_modules ./node_modules
COPY package*.json ./

EXPOSE 4001
CMD ["npm", "start"]
