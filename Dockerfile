# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Копируем файлы зависимостей
COPY frontend/package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем исходный код
COPY frontend/ .

# Собираем проект
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Копируем package файлы
COPY frontend/package*.json ./

# Устанавливаем serve для статических файлов
RUN npm install -g serve

# Копируем собранные файлы из build stage
COPY --from=build /app/dist ./dist

# Открываем порт (Render передаст PORT автоматически)
EXPOSE 3000

# Запускаем статический сервер
CMD ["serve", "-s", "dist", "-l", "3000"]
