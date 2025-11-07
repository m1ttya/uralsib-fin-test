import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createHash } from 'crypto';
import { query } from './db';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const ACCESS_TOKEN_EXPIRES_IN = parseInt(process.env.ACCESS_TOKEN_EXPIRES_IN || '1800');
const REFRESH_TOKEN_EXPIRES_IN = parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN || '604800');

interface RegisterData {
  email: string;
  username?: string;
  password: string;
  name: string;
}

interface LoginData {
  login: string;
  password: string;
}

// Валидация email
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Валидация username
const isValidUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,50}$/;
  return usernameRegex.test(username);
};

// Валидация пароля
const isValidPassword = (password: string): boolean => {
  // Минимум 8 символов, минимум 1 буква, 1 цифра
  return password.length >= 8 && /[a-zA-Z]/.test(password) && /\d/.test(password);
};

// Генерация JWT токенов
const generateTokens = (user: any) => {
  const accessToken = jwt.sign(
    {
      sub: user.user_id.toString(),
      email: user.email,
      username: user.username,
      role: 'user',
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );

  const refreshToken = uuidv4() + uuidv4();

  return { accessToken, refreshToken };
};

// POST /api/users/register
router.post('/register', async (req, res) => {
  try {
    const { email, username, password, name }: RegisterData = req.body;

    // Валидация
    if (!name || name.length < 2 || name.length > 100) {
      return res.status(400).json({
        ok: false,
        error: 'Некорректные данные',
        details: { name: 'Имя должно содержать от 2 до 100 символов' }
      });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        ok: false,
        error: 'Некорректные данные',
        details: { password: 'Пароль должен содержать минимум 8 символов, минимум 1 букву и 1 цифру' }
      });
    }

    if (!email) {
      return res.status(400).json({
        ok: false,
        error: 'Некорректные данные',
        details: { email: 'Обязательное поле' }
      });
    }

    if (email && !isValidEmail(email)) {
      return res.status(400).json({
        ok: false,
        error: 'Некорректные данные',
        details: { email: 'Некорректный email' }
      });
    }

    if (username && !isValidUsername(username)) {
      return res.status(400).json({
        ok: false,
        error: 'Некорректные данные',
        details: { username: 'Имя пользователя должно содержать 3-50 символов (только буквы, цифры, _ и -)' }
      });
    }

    // Проверка уникальности email
    const existingEmail = await query(
      'SELECT user_id FROM users WHERE email = $1',
      [email]
    );

    if (existingEmail.rows.length > 0) {
      return res.status(409).json({
        ok: false,
        error: 'Некорректные данные',
        details: { email: 'Пользователь с таким email уже существует' }
      });
    }

    // Проверка уникальности username (если указан)
    if (username) {
      const existingUsername = await query(
        'SELECT user_id FROM users WHERE username = $1',
        [username]
      );

      if (existingUsername.rows.length > 0) {
        return res.status(409).json({
          ok: false,
          error: 'Некорректные данные',
          details: { username: 'Пользователь с таким именем пользователя уже существует' }
        });
      }
    }

    // Хеширование пароля
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Создание пользователя
    const newUser = await query(
      'INSERT INTO users (email, username, password_hash, name) VALUES ($1, $2, $3, $4) RETURNING user_id, email, username, name',
      [email || null, username || null, passwordHash, name]
    );

    const user = newUser.rows[0];

    // Генерация токенов
    const { accessToken, refreshToken } = generateTokens(user);

    // Сохранение refresh токена
    const refreshHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN * 1000);

    await query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.user_id, refreshHash, expiresAt]
    );

    // Установка cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: REFRESH_TOKEN_EXPIRES_IN * 1000,
      path: '/'
    });

    return res.json({
      ok: true,
      message: 'Регистрация успешна',
      user: {
        user_id: user.user_id,
        email: user.email,
        username: user.username,
        name: user.name
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ ok: false, error: 'Ошибка сервера' });
  }
});

// GET /api/users/check-email
router.get('/check-email', async (req, res) => {
  try {
    const email = req.query.email as string;

    if (!email) {
      return res.status(400).json({ ok: false, error: 'Email не указан' });
    }

    // Проверка уникальности email
    const result = await query(
      'SELECT user_id FROM users WHERE email = ?',
      [email]
    );

    return res.json({
      ok: true,
      exists: result.rows.length > 0
    });

  } catch (error) {
    console.error('Check email error:', error);
    return res.status(500).json({ ok: false, error: 'Ошибка сервера' });
  }
});

// POST /api/users/login
router.post('/login', async (req, res) => {
  try {
    const { login, password }: LoginData = req.body;

    if (!login || !password) {
      return res.status(400).json({
        ok: false,
        error: 'Некорректные данные'
      });
    }

    // Поиск пользователя по email или username
    const userResult = await query(
      'SELECT user_id, email, username, password_hash, name, phone, avatar_url FROM users WHERE email = $1 OR username = $1',
      [login]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        ok: false,
        error: 'Неверный логин или пароль'
      });
    }

    const user = userResult.rows[0];

    // Проверка пароля
    const isValidPasswordCheck = await bcrypt.compare(password, user.password_hash);
    if (!isValidPasswordCheck) {
      return res.status(401).json({
        ok: false,
        error: 'Неверный логин или пароль'
      });
    }

    // Генерация токенов
    const { accessToken, refreshToken } = generateTokens(user);

    // Сохранение refresh токена
    const refreshHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN * 1000);

    await query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.user_id, refreshHash, expiresAt]
    );

    // Установка cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: REFRESH_TOKEN_EXPIRES_IN * 1000,
      path: '/'
    });

    return res.json({
      ok: true,
      message: 'Успешный вход',
      user: {
        user_id: user.user_id,
        email: user.email,
        username: user.username,
        name: user.name,
        avatar_url: user.avatar_url
      },
      accessToken
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ ok: false, error: 'Ошибка сервера' });
  }
});

// POST /api/users/refresh
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ ok: false, error: 'Недействительный токен' });
    }

    // Поиск токена в БД
    const tokenResult = await query(
      'SELECT rt.user_id, rt.token_hash, rt.expires_at, rt.revoked_at, u.user_id as valid_user ' +
      'FROM refresh_tokens rt ' +
      'JOIN users u ON rt.user_id = u.user_id ' +
      'WHERE rt.expires_at > NOW() AND rt.revoked_at IS NULL',
      []
    );

    // Проверяем каждый токен (в реальном проекте лучше хешировать в БД)
    let validToken = null;
    for (const tokenRow of tokenResult.rows) {
      const isMatch = await bcrypt.compare(refreshToken, tokenRow.token_hash);
      if (isMatch) {
        validToken = tokenRow;
        break;
      }
    }

    if (!validToken) {
      return res.status(401).json({ ok: false, error: 'Недействительный токен' });
    }

    // Генерация нового access токена
    const userResult = await query(
      'SELECT user_id, email, username FROM users WHERE user_id = $1',
      [validToken.user_id]
    );

    const user = userResult.rows[0];
    const newAccessToken = jwt.sign(
      {
        sub: user.user_id.toString(),
        email: user.email,
        username: user.username,
        role: 'user',
      },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
    );

    return res.json({
      ok: true,
      accessToken: newAccessToken
    });

  } catch (error) {
    console.error('Refresh error:', error);
    return res.status(500).json({ ok: false, error: 'Ошибка сервера' });
  }
});

// POST /api/users/logout
router.post('/logout', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      // Отзыв токена
      const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
      await query(
        'UPDATE refresh_tokens SET revoked_at = datetime("now") WHERE token_hash = ? AND revoked_at IS NULL',
        [tokenHash]
      );
    }

    res.clearCookie('refreshToken', { path: '/' });

    return res.json({
      ok: true,
      message: 'Выход выполнен'
    });

  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ ok: false, error: 'Ошибка сервера' });
  }
});

// GET /api/users/me
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ ok: false, error: 'Неавторизован' });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const userId = parseInt(decoded.sub);

      const userResult = await query(
        'SELECT user_id, email, username, name, phone, avatar_url, created_at FROM users WHERE user_id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ ok: false, error: 'Пользователь не найден' });
      }

      return res.json({
        ok: true,
        user: userResult.rows[0]
      });

    } catch (jwtError) {
      return res.status(401).json({ ok: false, error: 'Недействительный токен' });
    }

  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ ok: false, error: 'Ошибка сервера' });
  }
});

// GET /api/users/cabinet
router.get('/cabinet', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ ok: false, error: 'Неавторизован' });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const userId = parseInt(decoded.sub);

      // Получаем пользователя
      const userResult = await query(
        'SELECT user_id, email, username, name, created_at FROM users WHERE user_id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ ok: false, error: 'Пользователь не найден' });
      }

      const user = userResult.rows[0];

      // Получаем результаты тестов
      const testResults = await query(
        'SELECT result_id, test_id, test_title, test_category, percentage, ' +
        'correct_answers, total_questions, completed_at ' +
        'FROM test_results ' +
        'WHERE user_id = $1 AND is_completed = true ' +
        'ORDER BY completed_at DESC ' +
        'LIMIT 10',
        [userId]
      );

      // Получаем курсы
      const courses = await query(
        'SELECT course_id, course_name, course_category, progress_percentage, enrolled_at ' +
        'FROM user_courses ' +
        'WHERE user_id = $1 AND is_active = true ' +
        'ORDER BY enrolled_at DESC',
        [userId]
      );

      // Статистика
      const stats = await query(
        'SELECT ' +
        'COUNT(*) as total_tests, ' +
        'AVG(percentage) as avg_score, ' +
        '(SELECT COUNT(*) FROM user_courses WHERE user_id = $1 AND is_active = true) as total_courses, ' +
        '(SELECT COUNT(*) FROM user_courses WHERE user_id = $1 AND is_active = true AND progress_percentage = 100) as completed_courses ' +
        'FROM test_results ' +
        'WHERE user_id = $1 AND is_completed = true',
        [userId]
      );

      return res.json({
        ok: true,
        cabinet: {
          user: {
            name: user.name,
            email: user.email,
            registered_at: user.created_at
          },
          test_results: testResults.rows,
          courses: courses.rows,
          stats: {
            total_tests: parseInt(stats.rows[0]?.total_tests || '0'),
            avg_score: parseFloat(stats.rows[0]?.avg_score || '0'),
            total_courses: parseInt(stats.rows[0]?.total_courses || '0'),
            completed_courses: parseInt(stats.rows[0]?.completed_courses || '0')
          }
        }
      });

    } catch (jwtError) {
      return res.status(401).json({ ok: false, error: 'Недействительный токен' });
    }

  } catch (error) {
    console.error('Get cabinet error:', error);
    return res.status(500).json({ ok: false, error: 'Ошибка сервера' });
  }
});

// Middleware для проверки суперюзера
const SUPER_USER_PASSWORD = 'rootroot';

function requireSuperUser(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false, error: 'Неавторизован' });
  }

  const token = authHeader.substring(7);
  if (token !== SUPER_USER_PASSWORD) {
    return res.status(403).json({ ok: false, error: 'Доступ запрещен' });
  }

  next();
}

// POST /api/users/admin/verify
router.post('/admin/verify', (req, res) => {
  const { password } = req.body || {};

  if (password === SUPER_USER_PASSWORD) {
    return res.json({ ok: true, valid: true });
  }

  return res.status(403).json({ ok: false, error: 'Неверный пароль' });
});

// GET /api/users/admin/list
router.get('/admin/list', requireSuperUser, async (req, res) => {
  try {
    const users = await query(`
      SELECT user_id, email, name, username, created_at
      FROM users
      ORDER BY created_at DESC
    `);

    return res.json({
      ok: true,
      users: users.rows
    });

  } catch (error) {
    console.error('Get users list error:', error);
    return res.status(500).json({ ok: false, error: 'Ошибка сервера' });
  }
});

// DELETE /api/users/admin/delete/:id
router.delete('/admin/delete/:id', requireSuperUser, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    if (!userId) {
      return res.status(400).json({ ok: false, error: 'Неверный ID пользователя' });
    }

    // Проверяем, что пользователь существует
    const check = await query('SELECT user_id FROM users WHERE user_id = ?', [userId]);
    if (check.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'Пользователь не найден' });
    }

    // Удаляем связанные данные
    await query('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);
    await query('DELETE FROM test_results WHERE user_id = ?', [userId]);
    await query('DELETE FROM user_courses WHERE user_id = ?', [userId]);

    // Удаляем пользователя
    await query('DELETE FROM users WHERE user_id = ?', [userId]);

    return res.json({
      ok: true,
      message: 'Пользователь удален'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ ok: false, error: 'Ошибка сервера' });
  }
});

export default router;
