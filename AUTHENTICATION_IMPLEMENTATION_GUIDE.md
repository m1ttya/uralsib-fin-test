# Подробный промт для реализации системы аутентификации

```
Реализовать полноценную систему аутентификации для веб-приложения на React (frontend) + Node.js/Express (backend) + PostgreSQL.

## ТЕХНИЧЕСКИЙ СТЕК

**Backend:**
- Node.js 18+ с TypeScript
- Express.js для API
- PostgreSQL 15 для базы данных
- pg для подключения к БД
- bcryptjs для хеширования паролей
- jsonwebtoken для JWT токенов
- dotenv для переменных окружения
- cookie-parser для работы с cookies

**Frontend:**
- React 18+ с TypeScript
- Framer Motion для анимаций
- Tailwind CSS для стилизации
- Брендовые цвета: primary: '#3B175C', secondary: '#6A2E8F'
- Брендовый шрифт: Inter с fallback

## АРХИТЕКТУРА СИСТЕМЫ

### База данных PostgreSQL

**1. Таблица users**
```sql
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  username VARCHAR(50) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_created_at ON users(created_at);
```

**2. Таблица refresh_tokens**
```sql
CREATE TABLE refresh_tokens (
  token_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  revoked_at TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);
```

**3. Таблица test_results**
```sql
CREATE TABLE test_results (
  result_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
  test_id VARCHAR(255) NOT NULL,
  test_title VARCHAR(255),
  test_category VARCHAR(100),
  percentage DECIMAL(5,2) NOT NULL,
  total_questions INTEGER,
  correct_answers INTEGER,
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  is_completed BOOLEAN DEFAULT FALSE,
  answers JSONB
);

CREATE INDEX idx_test_results_user ON test_results(user_id);
CREATE INDEX idx_test_results_date ON test_results(completed_at);
CREATE INDEX idx_test_results_category ON test_results(test_category);
```

**4. Таблица user_courses**
```sql
CREATE TABLE user_courses (
  course_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
  course_name VARCHAR(255) NOT NULL,
  course_category VARCHAR(100),
  enrolled_at TIMESTAMP DEFAULT NOW(),
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  last_accessed_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_user_courses_user ON user_courses(user_id);
CREATE INDEX idx_user_courses_category ON user_courses(course_category);
```

### Миграции БД

**Создать папку backend/migrations/ с версионированием:**

```
backend/migrations/
  001_create_users_table.sql
  002_create_refresh_tokens_table.sql
  003_create_test_results_table.sql
  004_create_user_courses_table.sql
  005_add_updated_at_trigger.sql
```

**Пример миграции 001_create_users_table.sql:**
```sql
-- Creating users table with modern fields
CREATE TABLE IF NOT EXISTS users(
  user_id SERIAL PRIMARY KEY NOT NULL,
  email VARCHAR(255) UNIQUE,
  username VARCHAR(50) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
```

## BACKEND API ENDPOINTS

### 1. POST /api/users/register

**Описание:** Регистрация нового пользователя

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "user123",
  "password": "strongPassword123",
  "name": "Иван Иванов"
}
```

**Валидация:**
- email: обязателен, валидный email, уникальный
- username: опционально, 3-50 символов, только буквы/цифры/_/-, уникальный
- password: минимум 8 символов, минимум 1 буква, 1 цифра
- name: обязательно, 2-100 символов
- Нельзя одновременно отсутствовать email и username

**Response (200):**
```json
{
  "ok": true,
  "message": "Регистрация успешна",
  "user": {
    "user_id": 1,
    "email": "user@example.com",
    "username": "user123",
    "name": "Иван Иванов"
  }
}
```

**Response (400) - ошибка валидации:**
```json
{
  "ok": false,
  "error": "Некорректные данные",
  "details": {
    "email": "Email уже зарегистрирован",
    "password": "Пароль должен содержать минимум 8 символов"
  }
}
```

**Логика:**
1. Валидировать входные данные
2. Проверить уникальность email и username
3. Хешировать пароль bcrypt (10 раундов)
4. Вставить в БД
5. Сгенерировать JWT токены
6. Сохранить refresh_token в БД
7. Вернуть access_token в теле + refresh_token в HTTP-only cookie

---

### 2. POST /api/users/login

**Описание:** Вход пользователя по email или username

**Request Body:**
```json
{
  "login": "user@example.com", // или "user123"
  "password": "strongPassword123"
}
```

**Валидация:**
- login: обязателен
- password: обязателен

**Response (200):**
```json
{
  "ok": true,
  "message": "Успешный вход",
  "user": {
    "user_id": 1,
    "email": "user@example.com",
    "username": "user123",
    "name": "Иван Иванов",
    "avatar_url": null
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (401) - неверные данные:**
```json
{
  "ok": false,
  "error": "Неверный логин или пароль"
}
```

**Логика:**
1. Найти пользователя по email ИЛИ username
2. Сравнить пароль с хешем
3. Сгенерировать JWT токены
4. Сохранить refresh_token в БД
5. Установить HTTP-only cookie с refresh_token
6. Вернуть access_token + данные пользователя

---

### 3. POST /api/users/refresh

**Описание:** Обновление access_token по refresh_token

**Request:** HTTP Cookie с refresh_token в header

**Response (200):**
```json
{
  "ok": true,
  "accessToken": "new_jwt_access_token_here"
}
```

**Response (401) - недействительный токен:**
```json
{
  "ok": false,
  "error": "Недействительный токен"
}
```

**Логика:**
1. Проверить refresh_token в cookie
2. Найти токен в БД (не отозван, не истек)
3. Сгенерировать новый access_token
4. Вернуть новый токен

---

### 4. POST /api/users/logout

**Описание:** Выход пользователя, отзыв refresh_token

**Request:** HTTP Cookie с refresh_token в header

**Response (200):**
```json
{
  "ok": true,
  "message": "Выход выполнен"
}
```

**Логика:**
1. Найти refresh_token в БД
2. Установить revoked_at = NOW()
3. Очистить cookie

---

### 5. GET /api/users/me

**Описание:** Получение профиля текущего пользователя

**Request:** Authorization: Bearer <access_token>

**Response (200):**
```json
{
  "ok": true,
  "user": {
    "user_id": 1,
    "email": "user@example.com",
    "username": "user123",
    "name": "Иван Иванов",
    "phone": "+79001234567",
    "avatar_url": null,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

---

### 6. GET /api/users/cabinet

**Описание:** Личный кабинет - курсы и тесты пользователя

**Request:** Authorization: Bearer <access_token>

**Response (200):**
```json
{
  "ok": true,
  "cabinet": {
    "user": {
      "name": "Иван Иванов",
      "email": "user@example.com",
      "registered_at": "2024-01-15T10:30:00Z"
    },
    "test_results": [
      {
        "result_id": 1,
        "test_id": "adults_general",
        "test_title": "Взрослые — Общий тест",
        "test_category": "adults",
        "percentage": 85.50,
        "completed_at": "2024-01-20T15:30:00Z",
        "correct_answers": 34,
        "total_questions": 40
      }
    ],
    "courses": [
      {
        "course_id": 1,
        "course_name": "Основы финансовой грамотности",
        "course_category": "basics",
        "progress_percentage": 45.00,
        "enrolled_at": "2024-01-16T10:00:00Z"
      }
    ],
    "stats": {
      "total_tests": 5,
      "avg_score": 78.30,
      "total_courses": 3,
      "completed_courses": 1
    }
  }
}
```

---

## JWT ТОКЕНЫ

### Структура Access Token (expires in 15-30 min)
```json
{
  "sub": "1",  // user_id
  "email": "user@example.com",
  "username": "user123",
  "role": "user",
  "iat": 1705123456,  // issued at
  "exp": 1705124356   // expires in 15 minutes
}
```

### Структура Refresh Token (expires in 7 days)
- Хранится в БД в таблице refresh_tokens
- Хешируется через bcrypt
- Устанавливается в HTTP-only cookie
- Можно отозвать (revoked_at)

### Настройки cookie
```javascript
res.cookie('refreshToken', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 дней
  path: '/'
});
```

## FRONTEND КОМПОНЕНТЫ

### 1. AuthContext.tsx

**Создать файл frontend/src/contexts/AuthContext.tsx:**

**Контекст должен содержать:**
- user: объект пользователя или null
- isAuthenticated: boolean
- isLoading: boolean
- loading: boolean для лоадеров
- redirectUrl: string (для перенаправления после входа)

**Методы:**
- login(credentials) → Promise<void>
- register(data) → Promise<void>
- logout() → Promise<void>
- refresh() → Promise<void>
- checkAuth() → Promise<void>

**Пример реализации:**
```typescript
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (login: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  checkAuth: () => Promise<void>;
}
```

**Логика:**
1. При инициализации вызвать checkAuth()
2. checkAuth() пытается получить /me через refresh или прямой /me
3. Сохранять accessToken в memory (не в localStorage)
4. refreshToken только в HTTP-only cookie
5. При 401 автоматически вызывать refresh
6. Если refresh не удался, очистить state

---

### 2. LoginModal.tsx

**Трансформировать существующий LoginModal.tsx:**

**Состояния:**
```typescript
const [mode, setMode] = useState<'login' | 'register'>('login');
const [formData, setFormData] = useState({
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
  name: '',
  termsAccepted: false
});
const [errors, setErrors] = useState<Record<string, string>>({});
const [isLoading, setIsLoading] = useState(false);
const [message, setMessage] = useState('');
```

**Интерфейс:**

**В режиме LOGIN:**
- Заголовок: "Вход в систему"
- Поле: "Email или имя пользователя"
- Поле: "Пароль" (с toggle показать/скрыть)
- Кнопка: "Войти"
- Ссылка: "Нет аккаунта? Зарегистрироваться"

**В режиме REGISTER:**
- Заголовок: "Регистрация"
- Поле: "Email" (опционально)
- Поле: "Или имя пользователя" (опционально)
- Поле: "Имя" (обязательно)
- Поле: "Пароль" (с требованиями)
- Поле: "Подтвердите пароль"
- Checkbox: "Согласен с условиями использования"
- Кнопка: "Зарегистрироваться"
- Ссылка: "Уже есть аккаунт? Войти"

**Валидация на фронтенде:**
- Email: regex валидация
- Username: 3-50 символов, [a-zA-Z0-9_-]
- Password: минимум 8 символов, 1 буква, 1 цифра
- Confirm: должен совпадать с password
- Terms: обязательно принять

**Логика:**
1. При переключении mode очищать formData и errors
2. Перед отправкой валидировать локально
3. При успешной регистрации/входе:
   - Сохранить redirectUrl в sessionStorage (если был)
   - Закрыть модал
   - Показать уведомление об успехе
   - Обновить AuthContext
4. При ошибке отобразить в errors

**Стили:**
- Использовать брендовые цвета: #3B175C, #6A2E8F
- Анимации Framer Motion для появления/исчезновения
- Поля с иконками (встроенными SVG)
- Ошибки красным текстом под полями
- Лоадер на кнопке при isLoading

---

### 3. ProfileDropdown.tsx

**Создать файл frontend/src/components/auth/ProfileDropdown.tsx:**

**Интерфейс:**
- Иконка профиля (аватар или дефолтная)
- Выпадающее меню при клике
- Тень и плавное появление

**Пункты меню:**
1. Личный кабинет (иконка: user-cabinet.svg)
2. Выйти (иконка: logout.svg)

**Поведение:**
- Клик вне меню → закрыть
- Клик Esc → закрыть
- Hover эффекты
- Анимация Framer Motion (scale, opacity)

**Стили:**
- Абсолютное позиционирование под кнопкой
- Брендовые цвета для фона
- Белый текст
- Разделитель между пунктами
- Hover: светлее на 10%

---

### 4. Navbar.tsx

**Обновить существующий Navbar.tsx:**

**Логика:**
```typescript
const { isAuthenticated, user } = useAuth();

if (isAuthenticated) {
  return (
    <nav>
      ...
      <ProfileDropdown user={user} />
    </nav>
  );
} else {
  return (
    <nav>
      ...
      <Button onClick={() => setShowLoginModal(true)}>
        Войти
      </Button>
    </nav>
  );
}
```

**Стили кнопки "Войти":**
- Брендовый градиент: #3B175C → #6A2E8F
- Белый текст
- Hover эффект: затемнение на 10%
- Padding: px-6 py-2
- Radius: rounded-lg

---

### 5. PersonalCabinet.tsx

**Создать файл frontend/src/pages/PersonalCabinet.tsx:**

**Структура страницы:**

**Header:**
- Заголовок: "Личный кабинет"
- Приветствие: "Здравствуйте, {name}!"
- Кнопка "Редактировать профиль"

**Секция 1: Статистика (4 карточки в ряд)**
- Всего тестов пройдено
- Средний балл
- Курсов подписано
- Завершено курсов

**Секция 2: Последние тесты**
- Таблица/список с:
  - Название теста
  - Категория
  - Дата прохождения
  - Результат (%)
  - Цветной индикатор (зеленый 80%+, желтый 60-80%, красный <60%)

**Секция 3: Мои курсы**
- Карточки курсов с:
  - Название
  - Категория
  - Прогресс (progress bar)
  - Дата записи
  - Кнопка "Продолжить"

**Секция 4: История активности**
- Timeline с событиями:
  - Дата
  - Событие (прошел тест, записался на курс)
  - Результат/детали

**Адаптивность:**
- Desktop: 4 колонки статистика, 2 колонки контент
- Tablet: 2 колонки статистика, 1 колонка контент
- Mobile: Stack вертикально

---

## ЛОГИКА ПЕРЕНАПРАВЛЕНИЯ

### Сценарий 1: Вход с лендинга (navbar)
1. Пользователь нажимает "Войти" в navbar
2. Устанавливается: sessionStorage.setItem('redirectUrl', window.location.href)
3. Открывается LoginModal
4. После успешного входа:
   - Читаем redirectUrl из sessionStorage
   - Удаляем из sessionStorage
   - Если redirectUrl есть → перенаправляем туда
   - Иначе → остаемся на лендинге

### Сценарий 2: Вход для прохождения теста
1. Пользователь на странице теста (например, /test/adults/general)
2. Нажимает "Начать тест"
3. Устанавливается: sessionStorage.setItem('redirectUrl', `/test/${testId}`)
4. Открывается LoginModal
5. После успешного входа:
   - Читаем redirectUrl
   - Удаляем из sessionStorage
   - Перенаправляем на /test/${testId}

### Сценарий 3: Прямой вход на /test без авторизации
1. Пользователь заходит на /test/xxx напрямую
2. Проверяется токен в AuthContext
3. Если не авторизован:
   - Сохраняем redirectUrl = /test/xxx
   - Перенаправляем на / с открытым LoginModal

### Код для AuthContext:
```typescript
const handleLogin = async (login: string, password: string) => {
  try {
    const response = await api.post('/users/login', { login, password });

    if (response.data.ok) {
      setUser(response.data.user);
      setIsAuthenticated(true);

      // Проверяем redirect URL
      const redirectUrl = sessionStorage.getItem('redirectUrl');
      if (redirectUrl) {
        sessionStorage.removeItem('redirectUrl');
        window.location.href = redirectUrl;
      }
    }
  } catch (error) {
    throw error;
  }
};
```

## ИНТЕГРАЦИЯ С ТЕСТАМИ

### Сохранение результатов тестов

**Добавить в backend новый endpoint:**

**POST /api/tests/save-result**

**Request:**
```json
{
  "test_id": "adults_general",
  "test_title": "Взрослые — Общий тест",
  "percentage": 85.50,
  "correct_answers": 34,
  "total_questions": 40,
  "answers": [
    {
      "question_id": "q1",
      "selected_option": 1,
      "is_correct": true
    },
    ...
  ]
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Результат сохранен"
}
```

**Логика на фронтенде:**
1. В компоненте Test (где проходится тест)
2. После завершения теста (нажатия "Завершить")
3. Вызвать /api/tests/save-result с результатами
4. Если пользователь не авторизован:
   - Сохранить результат в localStorage
   - Показать модал: "Войдите, чтобы сохранить результат"
   - После входа восстановить из localStorage и отправить
5. Если авторизован → сразу отправить

---

## МАРШРУТИЗАЦИЯ

**Добавить в App.tsx:**

```typescript
<Routes>
  <Route path="/" element={<LandingPage />} />
  <Route path="/test/:category/:testId" element={<TestPage />} />
  <Route path="/cabinet" element={<PrivateRoute><PersonalCabinet /></PrivateRoute>} />
  <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
</Routes>
```

**Создать PrivateRoute.tsx:**
```typescript
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};
```

## ОШИБКИ И ОБРАБОТКА

### Коды ошибок
- 400: Ошибка валидации (неверные поля)
- 401: Неавторизован (нужен вход)
- 403: Доступ запрещен
- 409: Конфликт (email/username уже существует)
- 500: Ошибка сервера

### Обработка на фронтенде
**API client (api.ts):**
```typescript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4001/api',
  withCredentials: true  // для refresh token cookie
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await authContext.refresh();
        return api.request(error.config);
      } catch (refreshError) {
        authContext.logout();
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
```

**Компоненты:**
- Показывать error.message под полями форм
- Toast уведомления для обратной связи
- Не блокировать UI при network errors
- Retry логика для критических операций

---

## БЕЗОПАСНОСТЬ

### Правила
1. **Пароли:**
   - Минимум 8 символов
   - Обязательно 1 буква + 1 цифра
   - Хеширование bcrypt (10 раундов)
   - НИКОГДА не хранить в plain text

2. **JWT:**
   - Access токен короткоживущий (15-30 мин)
   - Refresh токен в HTTP-only cookie
   - Хранить refresh токены в БД с возможностью отзыва

3. **SQL Injection:**
   - Использовать параметризованные запросы pg
   - НИКОГДА не конкатенировать строки в SQL

4. **CORS:**
   - Только нужные origins в продакшне
   - withCredentials: true

5. **Rate Limiting:**
   - Ограничить попытки входа (5 попыток / 15 минут)
   - IP-based блокировка после превышения

6. **XSS:**
   - Валидация всех входных данных
   - Sanitize HTML где необходимо

7. **CSRF:**
   - refresh токен в HTTP-only cookie (не доступен JS)
   - SameSite cookie настройка

---

## DOCKER НАСТРОЙКИ

### Обновленный docker-compose.yml
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: uralsib_user
      POSTGRES_PASSWORD: secure_password_123
      POSTGRES_DB: uralsib_financial
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./db/migrations:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U uralsib_user -d uralsib_financial"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "4001:4001"
    environment:
      - NODE_ENV=development
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USER=uralsib_user
      - DB_PASSWORD=secure_password_123
      - DB_NAME=uralsib_financial
      - JWT_SECRET=dev-secret-change-me
      - ACCESS_TOKEN_EXPIRES_IN=1800
      - REFRESH_TOKEN_EXPIRES_IN=604800
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "5173:5173"
    environment:
      - NODE_ENV=development
      - VITE_API_URL=http://localhost:4001/api
    depends_on:
      - backend
    volumes:
      - ./frontend:/app
      - /app/node_modules

volumes:
  postgres_data:
```

---

## .ENV ФАЙЛЫ

### backend/.env (локальная разработка)
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=uralsib_user
DB_PASSWORD=secure_password_123
DB_NAME=uralsib_financial

# Auth
JWT_SECRET=dev-secret-change-me-please-very-long-and-secure
ACCESS_TOKEN_EXPIRES_IN=1800
REFRESH_TOKEN_EXPIRES_IN=604800

# Server
PORT=4001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### backend/.env.production
```env
# Database (from environment)
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}

# Auth
JWT_SECRET=${JWT_SECRET}
ACCESS_TOKEN_EXPIRES_IN=1800
REFRESH_TOKEN_EXPIRES_IN=604800

# Server
PORT=4001
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.com
```

### frontend/.env
```env
VITE_API_URL=http://localhost:4001/api
```

---

## ПОСЛЕДОВАТЕЛЬНОСТЬ РЕАЛИЗАЦИИ

1. **Backend:**
   - Установить зависимости (pg, bcryptjs, dotenv)
   - Создать src/db.ts для подключения
   - Создать migrations/ с SQL файлами
   - Создать users router с endpoints
   - Добавить middleware для auth
   - Обновить server.ts

2. **Database:**
   - Обновить docker-compose.yml с PostgreSQL
   - Запустить: docker compose up -d postgres
   - Выполнить миграции
   - Проверить таблицы в БД

3. **Frontend:**
   - Создать AuthContext
   - Трансформировать LoginModal
   - Создать ProfileDropdown
   - Обновить Navbar
   - Создать PersonalCabinet
   - Добавить PrivateRoute

4. **Интеграция:**
   - Тесты: добавить сохранение результатов
   - Проверить логику redirect
   - Протестировать все сценарии

5. **Тестирование:**
   - Регистрация с email
   - Регистрация с username
   - Вход по email
   - Вход по username
   - Выход
   - Обновление токена
   - Личный кабинет
   - Сохранение результатов теста

---

## ПРОВЕРКА КАЧЕСТВА

**Критерии приемки:**
- [ ] Можно зарегистрироваться с email или username
- [ ] Можно войти с email или username
- [ ] После входа показывается профиль в navbar
- [ ] После входа с теста → перенаправляет на тест
- [ ] После входа с navbar → остается на лендинге
- [ ] В личном кабинете отображаются тесты и курсы
- [ ] Результаты тестов сохраняются в БД
- [ ] Токены обновляются автоматически
- [ ] При выходе все очищается
- [ ] Стили соответствуют бренду
- [ ] Анимации плавные (Framer Motion)
- [ ] Адаптивно на всех устройствах
- [ ] Нет console errors
- [ ] TypeScript без ошибок
```

---

**Используйте этот промт как техническое задание для реализации системы аутентификации! Все детали включены, от структуры БД до UI/UX.**
