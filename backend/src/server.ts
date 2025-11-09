import express from 'express';
import cors from 'cors';
import path from 'path';
import jwt from 'jsonwebtoken';
import { testsRouter } from './tests/router';
import articlesRouter from './articles/router';
import { attachAuth, ensureAdmin } from './auth';
import usersRouter from './users';
import testResultsRouter from './tests/results';
import fs from 'fs/promises';
import multer from 'multer';
import mammoth from 'mammoth';
import * as cheerio from 'cheerio';


const app = express();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
attachAuth(app);

// Middleware to set x-authenticated header based on JWT token
// This is used by the tests router to check if user is authenticated
app.use((req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded) {
        req.headers['x-authenticated'] = 'true';
      }
    } catch (e) {
      // Token is invalid, don't set the header
    }
  }
  next();
});
   
// Health check endpoint
app.get('/api/health', (_req, res) => {
   res.json({ status: 'ok' });
});

app.use('/api/tests', testsRouter);
app.use('/api/articles', articlesRouter);
app.use('/api/users', usersRouter);
app.use('/api/tests', testResultsRouter);

// Static for articles storage (moved to backend/uploads/articles)
const ARTICLES_DIR = path.resolve(__dirname, '../uploads/articles');
const ARTICLES_META = path.resolve(__dirname, '../uploads/articles_meta.json');
// ensure directory exists (no top-level await)
fs.mkdir(ARTICLES_DIR, { recursive: true }).catch(() => {});
app.use('/articles', cors({ origin: true }), express.static(ARTICLES_DIR));

async function readMeta() {
  try {
    const txt = await fs.readFile(ARTICLES_META, 'utf8');
    const json = JSON.parse(txt);
    if (json && typeof json === 'object') return json;
  } catch {}
  return { titles: {} as Record<string, string> };
}
async function writeMeta(meta: any) {
  const data = { titles: {}, ...(typeof meta === 'object' && meta ? meta : {}) };
  await fs.writeFile(ARTICLES_META, JSON.stringify(data, null, 2), 'utf8');
}

function sanitizeBaseName(input: string) {
  const s = (input || '').toString()
    .replace(/[\u0000-\u001f\u007f]+/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[^\p{L}\p{N}._\- ]+/gu, '')
    .trim();
  return s;
}

// Публичный список статей (группы по базовому имени; берём HTML, если есть)
app.get('/api/articles', async (_req, res) => {
  try {
    await fs.mkdir(ARTICLES_DIR, { recursive: true }).catch(() => {});
    const files = await fs.readdir(ARTICLES_DIR);
    type FileItem = { name: string; size: number; mtime: number };
    const full: FileItem[] = await Promise.all(files.map(async (name) => {
      const fp = path.join(ARTICLES_DIR, name);
      const st = await fs.stat(fp);
      return { name, size: st.size, mtime: st.mtimeMs };
    }));

    type Group = { base: string; docx?: FileItem; html?: FileItem; pdf?: FileItem; others: FileItem[] };
    const map = new Map<string, Group>();

    for (const f of full) {
      const m = f.name.match(/^(.*?)(\.(docx|html?|pdf))$/i);
      const base = m ? m[1].trim() : f.name.trim();
      const ext = m ? (m[3] || '').toLowerCase() : '';
      const g = map.get(base) || { base, others: [] };
      if (ext === 'pdf') g.pdf = f;
      if (ext === 'docx') g.docx = f;
      else if (ext === 'html' || ext === 'htm') g.html = f;
      else g.others.push(f);
      map.set(base, g);
    }

    const meta = await readMeta();
    const items: { base: string; title: string; htmlName?: string; url?: string; hasPdf?: boolean; pdfUrl?: string }[] = [];
    for (const g of map.values()) {
      const hasHtml = !!g.html || !!g.docx; // docx можно сконвертировать, но для лендинга берём только готовый HTML
      const hasPdf = !!g.pdf || (g.others || []).some(f => /\.pdf$/i.test(f.name));
      // Показываем группу на лендинге, если есть HTML или PDF
      if (!hasHtml && !hasPdf) continue;
      let title = meta?.titles?.[g.base] || g.base;
      if (!meta?.titles?.[g.base] && g.html) {
        try {
          const htmlPath = path.join(ARTICLES_DIR, g.html.name);
          const html = await fs.readFile(htmlPath, 'utf8');
          const $ = cheerio.load(html);
          const h1 = $('h1').first().text().trim();
          if (h1) title = h1;
        } catch {}
      }
      const item: any = { base: g.base, title };
      if (g.html) {
        item.htmlName = g.html.name;
        item.url = `/articles/${g.html.name}`;
      }
      if (hasPdf) {
        const pdfFile = g.pdf || (g.others || []).find(f => /\.pdf$/i.test(f.name));
        if (pdfFile) item.pdfUrl = `/articles/${pdfFile.name}`;
        item.hasPdf = true;
      }
      items.push(item);
    }

    items.sort((a, b) => a.base.localeCompare(b.base, 'ru'));
    res.json(items);
  } catch (e: any) {
    res.status(500).json({ error: 'Не удалось прочитать список статей', details: e?.message });
  }
});

// Admin endpoints: products_by_topic
const PRODUCTS_FILE = path.resolve(__dirname, '../../frontend/public/api/products_by_topic.json');

// ===== Admin: Tests =====
const TESTS_ROOT = path.resolve(__dirname, '../data/tests');
const TESTS_META = path.resolve(__dirname, '../data/tests_meta.json');

async function readTestsMeta() {
  try {
    const txt = await fs.readFile(TESTS_META, 'utf8');
    const json = JSON.parse(txt);
    if (json && typeof json === 'object') return json;
  } catch {}
  return { titles: {} as Record<string, string> };
}
async function writeTestsMeta(meta: any) {
  const data = { titles: {}, ...(typeof meta === 'object' && meta ? meta : {}) };
  await fs.writeFile(TESTS_META, JSON.stringify(data, null, 2), 'utf8');
}

function isInside(root: string, p: string) {
  const rel = path.relative(root, p);
  return !!rel && !rel.startsWith('..') && !path.isAbsolute(rel);
}

app.get('/api/admin/tests/list', ensureAdmin, async (_req, res) => {
  try {
    const walk = async (dir: string): Promise<any> => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const folders: Record<string, any> = {};
      const files: string[] = [];
      for (const e of entries) {
        if (e.isDirectory()) folders[e.name] = await walk(path.join(dir, e.name));
        else if (e.isFile() && e.name.endsWith('.json')) files.push(e.name);
      }
      return { files, folders };
    };
    const tree = await walk(TESTS_ROOT);
    res.json(tree);
  } catch (e: any) {
    res.status(500).json({ error: 'Не удалось прочитать список тестов', details: e?.message });
  }
});

// Tests meta (titles for top-level folders)
app.get('/api/admin/tests/meta', ensureAdmin, async (_req, res) => {
  try {
    const meta = await readTestsMeta();
    res.json(meta);
  } catch (e: any) {
    res.status(500).json({ error: 'Не удалось прочитать метаданные тестов', details: e?.message });
  }
});

app.put('/api/admin/tests/meta', ensureAdmin, async (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object') return res.status(400).json({ error: 'Ожидается JSON' });
    await writeTestsMeta(body);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: 'Не удалось сохранить метаданные тестов', details: e?.message });
  }
});

// Public categories list for landing
// Scan top-level folders under tests and map to categories dynamically.
// Special UI aliases:
// - children -> school
// - pensioners -> seniors
app.get('/api/tests/categories', async (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const meta = await readTestsMeta();
    const titles: Record<string, string> = (meta as any)?.titles || {};

    const entries = await fs.readdir(TESTS_ROOT, { withFileTypes: true });
    const folders = entries.filter(e => e.isDirectory()).map(e => e.name);

    const toBase = (name: string) => {
      if (name === 'children' || name.startsWith('children_')) return 'children';
      if (name === 'adults' || name.startsWith('adults_')) return 'adults';
      if (name === 'pensioners' || name.startsWith('pensioners_')) return 'pensioners';
      return name;
    };

    const mapFolderToKey = (base: string) => base === 'children' ? 'school' : base === 'pensioners' ? 'seniors' : base;
    const mapFolderToTitle = (base: string) => {
      if (base === 'children') return titles.children || 'Школьники';
      if (base === 'adults') return titles.adults || 'Взрослые';
      if (base === 'pensioners') return titles.pensioners || 'Пенсионеры';
      return titles[base] || base;
    };

    const bases = Array.from(new Set(folders.map(toBase)));
    const items = bases.map((b) => ({ key: mapFolderToKey(b), title: mapFolderToTitle(b) }));
    res.json(items);
  } catch (e: any) {
    res.status(500).json({ error: 'Не удалось получить категории тестов', details: e?.message });
  }
});

app.get('/api/admin/tests/get', ensureAdmin, async (req, res) => {
  try {
    const rel = String(req.query.path || '');
    if (!rel || rel.includes('..')) return res.status(400).json({ error: 'Некорректный путь' });
    const full = path.join(TESTS_ROOT, rel);
    if (!isInside(TESTS_ROOT, full)) return res.status(400).json({ error: 'Вне корня тестов' });
    const text = await fs.readFile(full, 'utf8');
    res.type('application/json').send(text);
  } catch (e: any) {
    res.status(500).json({ error: 'Не удалось прочитать файл', details: e?.message });
  }
});

app.put('/api/admin/tests/save', ensureAdmin, async (req, res) => {
  try {
    const rel = String(req.query.path || '');
    if (!rel || rel.includes('..')) return res.status(400).json({ error: 'Некорректный путь' });
    const full = path.join(TESTS_ROOT, rel);
    if (!isInside(TESTS_ROOT, full)) return res.status(400).json({ error: 'Вне корня тестов' });
    const body = req.body;
    if (typeof body !== 'object' || body === null) return res.status(400).json({ error: 'Ожидается JSON-объект' });
    const text = JSON.stringify(body, null, 2);
    // Ensure parent directory exists
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, text, 'utf8');
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: 'Не удалось сохранить файл', details: e?.message });
  }
});

// Delete a tests folder recursively (admin)
app.delete('/api/admin/tests/delete-folder', ensureAdmin, async (req, res) => {
  try {
    const rel = String(req.query.path || '').replace(/^\/+/, '');
    if (!rel || rel.includes('..')) return res.status(400).json({ error: 'Некорректный путь' });
    const full = path.join(TESTS_ROOT, rel);
    if (!isInside(TESTS_ROOT, full)) return res.status(400).json({ error: 'Вне корня тестов' });

    const st = await fs.stat(full).catch(() => null);
    if (!st) return res.status(404).json({ error: 'Папка не найдена' });
    if (!st.isDirectory()) return res.status(400).json({ error: 'Это не папка' });

    // Remove recursively
    // Node 20+ has fs.rm with recursive
    await (fs as any).rm(full, { recursive: true, force: true }).catch(async () => {
      // Fallback: manual delete
      const entries = await fs.readdir(full, { withFileTypes: true });
      for (const e of entries) {
        const p = path.join(full, e.name);
        if (e.isDirectory()) await (fs as any).rm(p, { recursive: true, force: true }).catch(()=>{});
        else await fs.unlink(p).catch(()=>{});
      }
      await fs.rmdir(full).catch(()=>{});
    });

    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: 'Не удалось удалить папку', details: e?.message });
  }
});

app.get('/api/admin/products_by_topic', ensureAdmin, async (_req, res) => {
  try {
    const data = await fs.readFile(PRODUCTS_FILE, 'utf8');
    res.type('application/json').send(data);
  } catch (e: any) {
    res.status(500).json({ error: 'Не удалось прочитать файл', details: e?.message });
  }
});

app.put('/api/admin/products_by_topic', ensureAdmin, async (req, res) => {
  try {
    const body = req.body;
    // Валидация: должен быть объект
    if (typeof body !== 'object' || body === null) {
      return res.status(400).json({ error: 'Ожидается JSON-объект' });
    }
    const text = JSON.stringify(body, null, 2);
    await fs.writeFile(PRODUCTS_FILE, text, 'utf8');
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: 'Не удалось сохранить файл', details: e?.message });
  }
});

// ===== Admin: Articles =====
const upload = multer({ storage: multer.memoryStorage() });

app.get('/api/admin/articles', ensureAdmin, async (_req, res) => {
  try {
    await fs.mkdir(ARTICLES_DIR, { recursive: true }).catch(() => {});
    const files = await fs.readdir(ARTICLES_DIR);
    const list = await Promise.all(files.map(async (name) => {
      const fp = path.join(ARTICLES_DIR, name);
      const st = await fs.stat(fp);
      return { name, size: st.size, mtime: st.mtimeMs };
    }));
    res.json(list.sort((a,b)=>a.name.localeCompare(b.name)));
  } catch (e: any) {
    res.status(500).json({ error: 'Не удалось прочитать список статей', details: e?.message });
  }
});

app.get('/api/admin/articles/html', ensureAdmin, async (req, res) => {
  try {
    const name = String(req.query.name || '').replace(/^\/+/, '');
    if (!name || name.includes('..') || name.includes('/') || name.includes('\\')) {
      return res.status(400).send('Некорректное имя файла');
    }
    const fp = path.join(ARTICLES_DIR, name);
    const st = await fs.stat(fp).catch(() => null);
    if (!st) return res.status(404).send('Не найдено');
    if (!/\.(html?|HTML?)$/.test(name)) return res.status(400).send('Не HTML файл');
    res.type('text/html; charset=utf-8');
    res.sendFile(fp);
  } catch (e: any) {
    res.status(500).send(e?.message || 'Ошибка');
  }
});

app.post('/api/admin/articles/upload', ensureAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Файл не получен' });
    await fs.mkdir(ARTICLES_DIR, { recursive: true }).catch(() => {});

    // Поправляем возможную порчу кодировки имени (latin1 -> utf8)
    const rawName = req.file.originalname || 'file';
    const decoded = Buffer.from(rawName, 'latin1').toString('utf8');

    // Разрешаем буквы/цифры любых языков, пробелы, дефисы, подчёркивания и точки
    const sanitize = (s: string) => s
      .replace(/[\u0000-\u001f\u007f]+/g, '') // control chars
      .replace(/\s+/g, ' ') // collapse spaces
      .replace(/[^\p{L}\p{N}._\- ]+/gu, ''); // drop other symbols

    const original = decoded.trim() || 'file';
    const sanitized = sanitize(original).trim() || 'file';

    // сохраняем расширение, если оно присутствовало
    const extMatch = original.match(/\.[^.]+$/);
    const ext = extMatch ? extMatch[0] : '';
    const baseName = ext ? sanitized.replace(/\.[^.]+$/, '') : sanitized;
    const safe = baseName + ext;

    const target = path.join(ARTICLES_DIR, safe);
    await fs.writeFile(target, req.file.buffer);

    let htmlPublicPath: string | null = null;
    if (/\.docx$/i.test(safe)) {
      const { value: html } = await mammoth.convertToHtml({ buffer: req.file.buffer });
      const base = safe.replace(/\.docx$/i, '');
      const htmlName = base + '.html';
      const htmlPath = path.join(ARTICLES_DIR, htmlName);
      await fs.writeFile(htmlPath, html, 'utf8');
      htmlPublicPath = `/articles/${htmlName}`;
    }

    res.json({ ok: true, name: safe, html: htmlPublicPath, pdf: /\.pdf$/i.test(safe) ? `/articles/${safe}` : null });
  } catch (e: any) {
    res.status(500).json({ error: 'Не удалось загрузить файл', details: e?.message });
  }
});

app.get('/api/admin/articles/convert', ensureAdmin, async (req, res) => {
  try {
    const name = String(req.query.name || '').replace(/^\/+/, '');
    if (!name || name.includes('..') || name.includes('/') || name.includes('\\')) {
      return res.status(400).json({ error: 'Некорректное имя файла' });
    }
    if (!/\.docx$/i.test(name)) return res.status(400).json({ error: 'Ожидается .docx' });
    const docxPath = path.join(ARTICLES_DIR, name);
    const st = await fs.stat(docxPath).catch(() => null);
    if (!st) return res.status(404).json({ error: 'DOCX не найден' });
    const buffer = await fs.readFile(docxPath);
    const { value: html } = await mammoth.convertToHtml({ buffer });
    const htmlName = name.replace(/\.docx$/i, '.html');
    const htmlPath = path.join(ARTICLES_DIR, htmlName);
    await fs.writeFile(htmlPath, html, 'utf8');
    return res.json({ ok: true, html: `/articles/${htmlName}` });
  } catch (e: any) {
    res.status(500).json({ error: 'Не удалось сконвертировать', details: e?.message });
  }
});

app.get('/api/admin/articles/meta', ensureAdmin, async (_req, res) => {
  try {
    const meta = await readMeta();
    res.json(meta);
  } catch (e: any) {
    res.status(500).json({ error: 'Не удалось прочитать метаданные', details: e?.message });
  }
});

app.put('/api/admin/articles/meta', ensureAdmin, async (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object') return res.status(400).json({ error: 'Ожидается JSON' });
    await writeMeta(body);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: 'Не удалось сохранить метаданные', details: e?.message });
  }
});

app.post('/api/admin/articles/rename', ensureAdmin, async (req, res) => {
  try {
    const { oldBase, newBase } = req.body || {};
    const from = sanitizeBaseName(oldBase);
    const to = sanitizeBaseName(newBase);
    if (!from || !to) return res.status(400).json({ error: 'Некорректные имена' });

    await fs.mkdir(ARTICLES_DIR, { recursive: true }).catch(() => {});
    const files = await fs.readdir(ARTICLES_DIR);
    // соберём все файлы с базой from
    const affected = files.filter(n => n.startsWith(from + '.') || n === from);
    if (affected.length === 0) return res.status(404).json({ error: 'Файлы для переименования не найдены' });

    for (const name of affected) {
      const newName = name.replace(new RegExp('^' + from), to);
      await fs.rename(path.join(ARTICLES_DIR, name), path.join(ARTICLES_DIR, newName));
    }

    // правим html имя, если docx -> html
    const htmlOld = from + '.html';
    const htmlNew = to + '.html';
    const htmlOldPath = path.join(ARTICLES_DIR, htmlOld);
    const st = await fs.stat(htmlOldPath).catch(()=>null);
    if (st) {
      await fs.rename(htmlOldPath, path.join(ARTICLES_DIR, htmlNew)).catch(()=>{});
    }

    // обновим метаданные заголовков: переносим title с oldBase на newBase, если был
    const meta = await readMeta();
    if (meta.titles && meta.titles[from]) {
      meta.titles[to] = meta.titles[from];
      delete meta.titles[from];
      await writeMeta(meta);
    }

    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: 'Не удалось переименовать', details: e?.message });
  }
});

app.delete('/api/admin/articles/:name', ensureAdmin, async (req, res) => {
  try {
    const name = req.params.name;
    if (!name || name.includes('..') || name.includes('/') || name.includes('\\')) {
      return res.status(400).json({ error: 'Некорректное имя файла' });
    }
    const fp = path.join(ARTICLES_DIR, name);
    await fs.unlink(fp);
    const base = name.replace(/\.docx$/i, '');
    if (base !== name) {
      const html = path.join(ARTICLES_DIR, base + '.html');
      await fs.stat(html).then(()=>fs.unlink(html)).catch(()=>{});
    }
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: 'Не удалось удалить файл', details: e?.message });
  }
});
   
// Serve frontend only in development
if (process.env.NODE_ENV !== 'production') {
  // Serve Vite build or dev preview from frontend/dist or frontend directory
  const distDir = path.join(__dirname, '../../frontend/dist');
  const viteIndex = path.join(distDir, 'index.html');
  const fallbackPublicDir = path.join(__dirname, '../../frontend');

  app.use(express.static(distDir));
  app.use('/assets', express.static(path.join(distDir, 'assets')));

  app.get('*', (_req, res) => {
    // If dist index exists, serve it, otherwise fall back to frontend/index.html
    const candidate = fs
      .stat(viteIndex)
      .then(() => viteIndex)
      .catch(() => path.join(fallbackPublicDir, 'index.html'));

    candidate.then((file) => res.sendFile(file)).catch(() => {
      res.status(500).send('Frontend not built. Run frontend dev server separately.');
    });
  });
}
const port = process.env.PORT ? Number(process.env.PORT) : 4001;

// Vercel handler
const handler = app;

// Export for Vercel
export default handler;

// CommonJS export for local development
if (process.env.VERCEL !== '1') {
  app.listen(port, () => {
     console.log(`Server listening on http://localhost:${port}`);
  });
}
