import express from 'express';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

const router = express.Router();

// Use env variables or fallbacks for dev
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || 'root';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const COOKIE_NAME = 'admin_token';

export interface JwtPayload {
  sub: string; // login
  role: 'admin';
}

export function attachAuth(app: express.Express) {
  app.use(cookieParser());
  app.use('/api/auth', router);
}

export function ensureAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    (req as any).user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

router.post('/login', (req, res) => {
  const { login, password } = req.body || {};
  if (login === ADMIN_LOGIN && password === ADMIN_PASSWORD) {
    const payload: JwtPayload = { sub: login, role: 'admin' };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'none', // Changed from 'lax' to 'none' to allow cross-site cookies
      secure: true, // Changed to always require HTTPS for cross-site cookies
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });
    return res.json({ ok: true, login });
  }
  return res.status(401).json({ error: 'Неверный логин или пароль' });
});

router.get('/me', (req, res) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    return res.json({ login: decoded.sub, role: decoded.role });
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ ok: true });
});
