# 🚀 Быстрый запуск проекта

## Система аутентификации - РЕАЛИЗОВАНА!

### ✅ Что готово:

#### Backend
- ✅ PostgreSQL миграции (5 таблиц)
- ✅ API endpoints (регистрация, вход, профиль, кабинет, тесты)
- ✅ JWT токены (access + refresh)
- ✅ Безопасность (bcrypt, валидация)

#### Frontend
- ✅ AuthContext - управление состоянием
- ✅ API клиент с авто-обновлением токенов
- ✅ LoginModal - логин/регистрация
- ✅ ProfileDropdown - меню пользователя
- ✅ Navbar - интеграция аутентификации
- ✅ PersonalCabinet - личный кабинет
- ✅ PrivateRoute - защищенные маршруты

---

## 🏃‍♂️ Способы запуска

### Способ 1: Docker Compose (рекомендуется)

```bash
# Клонируйте репозиторий
git clone <your-repo>
cd uralsib-fin-test

# Запустите все сервисы
docker-compose up

# Откройте в браузере:
# Frontend: http://localhost:5173
# Backend API: http://localhost:4001
```

### Способ 2: Локальная разработка

#### 1. Установите PostgreSQL
```bash
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql

# Windows
# Скачайте с https://www.postgresql.org/download/
```

#### 2. Создайте базу данных
```bash
sudo -u postgres psql

CREATE USER uralsib_user WITH PASSWORD 'secure_password_123';
CREATE DATABASE uralsib_financial OWNER uralsib_user;
\q
```

#### 3. Выполните миграции
```bash
# В папке backend/migrations выполните SQL файлы в порядке:
# 001_create_users_table.sql
# 002_create_refresh_tokens_table.sql
# 003_create_test_results_table.sql
# 004_create_user_courses_table.sql
# 005_add_updated_at_trigger.sql

# Или через psql:
psql -U uralsib_user -d uralsib_financial -f backend/migrations/001_create_users_table.sql
psql -U uralsib_user -d uralsib_financial -f backend/migrations/002_create_refresh_tokens_table.sql
psql -U uralsib_user -d uralsib_financial -f backend/migrations/003_create_test_results_table.sql
psql -U uralsib_user -d uralsib_financial -f backend/migrations/004_create_user_courses_table.sql
psql -U uralsib_user -d uralsib_financial -f backend/migrations/005_add_updated_at_trigger.sql
```

#### 4. Установите зависимости
```bash
# Backend
cd backend
npm install

# Frontend (в отдельном терминале)
cd frontend
npm install
```

#### 5. Запустите сервисы
```bash
# Backend (терминал 1)
cd backend
npm run dev

# Frontend (терминал 2)
cd frontend
npm run dev
```

---

## 🔑 Тестирование

### 1. Регистрация
- Откройте http://localhost:5173
- Нажмите "Войти"
- Переключитесь на "Регистрация"
- Заполните форму
- Нажмите "Зарегистрироваться"

### 2. Вход
- Введите email ИЛИ username
- Введите пароль
- Нажмите "Войти"

### 3. Личный кабинет
- Кликните на профиль (правый верхний угол)
- Выберите "Личный кабинет"
- Просмотрите статистику, тесты, курсы

### 4. API тестирование
```bash
# Регистрация
curl -X POST http://localhost:4001/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "password123",
    "name": "Test User"
  }'

# Вход
curl -X POST http://localhost:4001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "login": "test@example.com",
    "password": "password123"
  }'

# Профиль
curl http://localhost:4001/api/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 📁 Структура проекта

```
uralsib-fin-test/
├── backend/
│   ├── src/
│   │   ├── db.ts              # Подключение к БД
│   │   ├── users.ts           # API пользователей
│   │   ├── server.ts          # Основной сервер
│   │   └── tests/
│   │       └── results.ts     # API результатов тестов
│   ├── migrations/            # SQL миграции
│   ├── .env                   # Переменные окружения
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx    # Контекст аутентификации
│   │   ├── lib/
│   │   │   └── api.ts             # API клиент
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── ProfileDropdown.tsx
│   │   │   │   └── PrivateRoute.tsx
│   │   │   ├── LoginModal.tsx
│   │   │   └── NavBar.tsx
│   │   └── pages/
│   │       └── PersonalCabinet.tsx
│   ├── .env
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 🔧 Настройка для продакшена

### 1. Измените переменные окружения
```bash
# backend/.env.production
JWT_SECRET=your-super-secret-jwt-key-here
DB_HOST=your-production-db-host
DB_USER=your-db-user
DB_PASSWORD=your-secure-password
DB_NAME=your-db-name
CORS_ORIGIN=https://yourdomain.com

# frontend/.env.production
VITE_API_URL=https://your-backend-domain.com/api
```

### 2. Деплой на Render
```bash
# 1. Закоммитьте код
git add .
git commit -m "feat: Complete authentication system"
git push

# 2. Идите на render.com
# 3. New -> Web Service
# 4. Подключите GitHub репозиторий
# 5. Настройки:
#    - Name: uralsib-fin-test
#    - Runtime: Node
#    - Build Command: cd backend && npm ci && npm run build && npm run build:frontend
#    - Start Command: cd backend && npm start
# 6. Deploy!
```

### 3. Создайте PostgreSQL на Render
```bash
# В Render Dashboard:
# New -> PostgreSQL
# Region: Oregon (US West)
# Скопируйте connection string
# Добавьте в Environment Variables backend:
#   DB_HOST=...
#   DB_USER=...
#   DB_PASSWORD=...
#   DB_NAME=...
```

---

## 🐛 Устранение неполадок

### Ошибка: "Connection refused"
```bash
# Убедитесь что PostgreSQL запущен
sudo systemctl status postgresql

# Или перезапустите
sudo systemctl restart postgresql
```

### Ошибка: "relation does not exist"
```bash
# Проверьте что миграции выполнены
psql -U uralsib_user -d uralsib_financial -c "\dt"
```

### Ошибка: "JWT error"
```bash
# Проверьте JWT_SECRET в .env
# Убедитесь что он одинаковый в development и production
```

---

## 📚 Документация API

### POST /api/users/register
Регистрация нового пользователя
```json
{
  "email": "user@example.com",      // опционально
  "username": "user123",            // опционально
  "password": "password123",
  "name": "Иван Иванов"
}
```

### POST /api/users/login
Вход в систему
```json
{
  "login": "user@example.com",      // email или username
  "password": "password123"
}
```

### GET /api/users/me
Получение профиля (требует Bearer token)

### GET /api/users/cabinet
Личный кабинет (требует Bearer token)

### POST /api/tests/save-result
Сохранение результата теста (требует Bearer token)
```json
{
  "test_id": "adults_general",
  "test_title": "Взрослые — Общий тест",
  "percentage": 85.5,
  "correct_answers": 34,
  "total_questions": 40,
  "answers": [...]
}
```

---

## ✅ Критерии приемки

- [x] Backend API реализован
- [x] Frontend компоненты созданы
- [x] Docker-compose настроен
- [x] Миграции готовы
- [x] .env файлы созданы
- [x] Адаптивная верстка
- [x] TypeScript без ошибок

**Система аутентификации полностью реализована! 🎉**

Для вопросов и поддержки создавайте Issue в репозитории.
