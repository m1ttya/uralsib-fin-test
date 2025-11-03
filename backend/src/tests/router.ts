import { Router } from 'express';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs/promises';

type Question = {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  // Optional: explanation only for the correct answer (from DOCX)
  correctExplanation?: string;
  tags?: any[];
};

type TestData = {
  id: string;
  title: string;
  category: string; // backend folder name (e.g., adults, children, pensioners, or custom)
  variant: string; // file base name (e.g., general, level_1, ...)
  questions: Question[];
};

type Session = {
  sessionId: string;
  testId: string;
  shuffledQuestionIds: string[];
  shuffledOptionsByQid: Record<string, number[]>; // maps newIndex -> originalIndex
  answers: Record<string, number | undefined>; // selected newIndex
  createdAt: number;
  seed: number;
  user?: { authenticated: boolean; age?: number };
};

const dataRoot = path.resolve(__dirname, '../../data/tests');

const sessions = new Map<string, Session>();

export const testsRouter = Router();

// Utility: Fisher–Yates with seed
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = arr.slice();
  let s = seed;
  const random = () => {
    // xorshift32
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    // ensure positive
    return (s >>> 0) / 4294967296;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function readTestById(testId: string): Promise<TestData> {
  // Resolve <category>_<variant> robustly:
  // - Try all possible splits at underscores and pick the one where <category> is an existing folder
  // - Support UI aliases (school -> children, seniors -> pensioners)
  if (!testId.includes('_')) throw new Error('Invalid testId');

  const aliasToFolder: Record<string, string> = {
    school: 'children',
    seniors: 'pensioners',
  };

  const entries = await fs.readdir(dataRoot, { withFileTypes: true });
  const folders = new Set(entries.filter(e => e.isDirectory()).map(e => e.name));

  const underscoreIdxs: number[] = [];
  for (let i = 0; i < testId.length; i++) if (testId[i] === '_') underscoreIdxs.push(i);

  const tried: string[] = [];
  for (const idx of underscoreIdxs) {
    if (idx <= 0 || idx >= testId.length - 1) continue;
    const rawCategory = testId.slice(0, idx);
    const variant = testId.slice(idx + 1);
    const folder = aliasToFolder[rawCategory] || rawCategory;

    // Prefer only valid folders under dataRoot
    if (!folders.has(folder)) continue;

    const relPath = `${folder}/${variant}.json`;
    const fullPath = path.join(dataRoot, relPath);
    tried.push(relPath);
    try {
      const raw = await fs.readFile(fullPath, 'utf-8');
      const data = JSON.parse(raw) as TestData;
      const normalizedCategory = folder;
      data.category = normalizedCategory;
      data.variant = variant;
      const normalizedId = `${normalizedCategory}_${variant}`;
      (data as any).id = normalizedId;
      if (!data.title || typeof data.title !== 'string') {
        (data as any).title = normalizedId;
      }
      return data;
    } catch {
      // continue trying other splits
    }
  }

  // As a last resort, try interpreting variant underscores as nested path segments
  const firstIdx = testId.indexOf('_');
  const rawCategory = testId.slice(0, firstIdx);
  const variant = testId.slice(firstIdx + 1);
  const folder = aliasToFolder[rawCategory] || rawCategory;

  // Try both flat and nested variant paths
  const candidateRelPaths = [
    `${folder}/${variant}.json`,
    `${folder}/${variant.replace(/_/g, '/')}.json`,
  ];

  for (const relPath of candidateRelPaths) {
    tried.push(relPath);
    try {
      const raw = await fs.readFile(path.join(dataRoot, relPath), 'utf-8');
      const data = JSON.parse(raw) as TestData;
      data.category = folder;
      data.variant = variant;
      (data as any).id = `${folder}_${variant}`;
      if (!data.title || typeof data.title !== 'string') {
        (data as any).title = `${folder}_${variant}`;
      }
      return data;
    } catch {}
  }

  throw new Error(`Unable to resolve testId '${testId}'. Tried: ${tried.join(', ')}`);
}

function sanitizeTestForClient(test: TestData, session: Session) {
  // apply shuffled order
  const questionById: Record<string, Question> = {};
  test.questions.forEach(q => (questionById[q.id] = q));
  const questions = session.shuffledQuestionIds.map(qid => {
    const q = questionById[qid];
    const map = session.shuffledOptionsByQid[qid];
    const shuffledOptions = map.map(idx => q.options[idx]);
    return { id: q.id, text: q.text, options: shuffledOptions, tags: (q as any).tags };
  });
  return { id: test.id, title: test.title, category: test.category, variant: test.variant, questions };
}

testsRouter.get('/', async (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  // Returns list of available tests (metadata only), discovered recursively
  try {
    const list: Array<{ id: string; title: string; category: string; variant: string }> = [];
    const skipped: Array<{ id: string; reason: string }> = [];

    async function walk(dir: string, rel: string[] = []) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const e of entries) {
        if (e.isDirectory()) {
          await walk(path.join(dir, e.name), [...rel, e.name]);
        } else if (e.isFile() && /\.json$/i.test(e.name)) {
          // rel[0] is category, rest form variant path + filename stem
          if (rel.length === 0) continue; // skip files directly under dataRoot (shouldn't happen)
          const category = rel[0];
          const inner = [...rel.slice(1), e.name.replace(/\.json$/i, '')];
          const variant = inner.length ? inner.join('_') : e.name.replace(/\.json$/i, '');
          const id = `${category}_${variant}`;
          try {
            const t = await readTestById(id);
            list.push({ id: t.id, title: t.title, category: t.category, variant: t.variant });
          } catch (err: any) {
            skipped.push({ id, reason: err?.message || 'parse/read error' });
          }
        }
      }
    }

    await walk(dataRoot, []);
    res.json({ tests: list, skipped });
  } catch (e) {
    res.status(500).json({ error: 'Failed to list tests' });
  }
});

testsRouter.post('/:testId/start', async (req, res) => {
  try {
    const { testId } = req.params;
    const user = { authenticated: Boolean(req.headers['x-authenticated'] === 'true') };

    // Gate level tests if not authenticated (only for adults and pensioners, children are allowed)
    const categoryPrefix = testId.split('_')[0];
    if (!user.authenticated && /level_\d+$/.test(testId) && categoryPrefix !== 'children') {
      return res.status(403).json({ error: 'Authentication required for level tests' });
    }

    const test = await readTestById(testId);
    const seed = Date.now() ^ Math.floor(Math.random() * 1e9);

    // shuffle questions
    const shuffledQuestions = seededShuffle(test.questions, seed);
    const shuffledQuestionIds = shuffledQuestions.map(q => q.id);

    // shuffle options per question, store mapping from newIndex -> originalIndex
    const shuffledOptionsByQid: Record<string, number[]> = {};
    for (const q of shuffledQuestions) {
      const optionIdxs = q.options.map((_, i) => i);
      const shuffledIdxs = seededShuffle(optionIdxs, seed ^ q.id.length);
      shuffledOptionsByQid[q.id] = shuffledIdxs;
    }

    const sessionId = randomUUID();
    const session: Session = {
      sessionId,
      testId: test.id,
      shuffledQuestionIds,
      shuffledOptionsByQid,
      answers: {},
      createdAt: Date.now(),
      seed,
      user
    };
    sessions.set(sessionId, session);

    const clientTest = sanitizeTestForClient(test, session);
    res.json({ sessionId, test: clientTest });
  } catch (e: any) {
    const msg = e?.message || 'Failed to start test';
    // Distinguish not found vs other
    if (/Invalid testId|ENOENT|no such file or directory/i.test(msg)) {
      return res.status(404).json({ error: `Тест не найден: ${msg}` });
    }
    res.status(500).json({ error: msg });
  }
});

testsRouter.post('/:testId/answer', async (req, res) => {
  try {
    const { testId } = req.params;
    const { sessionId, questionId, selectedIndex } = req.body as { sessionId: string; questionId: string; selectedIndex: number };
    const session = sessions.get(sessionId);
    if (!session || session.testId !== testId) return res.status(400).json({ error: 'Invalid session' });

    const test = await readTestById(testId);
    const q = test.questions.find(q => q.id === questionId);
    if (!q) return res.status(400).json({ error: 'Invalid question' });

    // Map selectedIndex (in shuffled options) back to original index
    const map = session.shuffledOptionsByQid[questionId];
    const originalIndex = map[selectedIndex];
    const correct = originalIndex === q.correctIndex;

  // Find shuffled index for correct option to reveal
  const correctOptionIndex = map.findIndex((orig) => orig === q.correctIndex);

  session.answers[questionId] = selectedIndex;
  const explanationForSelected = q.correctExplanation ?? null;
  res.json({ correct, correctOptionIndex, explanationForSelected });
  } catch (e) {
    res.status(500).json({ error: 'Failed to check answer' });
  }
});

testsRouter.post('/:testId/submit', async (req, res) => {
  try {
    const { testId } = req.params;
    const { sessionId } = req.body as { sessionId: string };
    const session = sessions.get(sessionId);
    if (!session || session.testId !== testId) return res.status(400).json({ error: 'Invalid session' });

    const test = await readTestById(testId);
    let correctCount = 0;
    for (const q of test.questions) {
      const selectedShuffled = session.answers[q.id];
      if (selectedShuffled == null) continue;
      const map = session.shuffledOptionsByQid[q.id];
      const originalIndex = map[selectedShuffled];
      if (originalIndex === q.correctIndex) correctCount++;
    }
    const total = test.questions.length;
    const score = Math.round((correctCount / total) * 100);

    // Optionally cleanup session (or keep TTL)
    // sessions.delete(sessionId);

    res.json({ total, correct: correctCount, score });
  } catch (e) {
    res.status(500).json({ error: 'Failed to submit test' });
  }
});

// Admin endpoint for deleting tests
testsRouter.delete('/admin/delete', async (req, res) => {
  try {
    const { path: testPath } = req.query;
    if (typeof testPath !== 'string') {
      return res.status(400).json({ error: 'Путь не указан' });
    }
    
    // Sanitize path - allow only safe characters
    const safePath = testPath.replace(/[^a-zA-Zа-яёА-ЯЁ0-9_.\/-]/g, '');
    if (!safePath.endsWith('.json')) {
      return res.status(400).json({ error: 'Можно удалять только JSON файлы' });
    }
    
    const fullPath = path.join(dataRoot, safePath);
    
    // Ensure the file is within tests directory
    if (!fullPath.startsWith(dataRoot)) {
      return res.status(400).json({ error: 'Некорректный путь' });
    }
    
    // Check if file exists
    try {
      await fs.access(fullPath);
    } catch {
      return res.status(404).json({ error: 'Файл не найден' });
    }
    
    // Delete the file
    await fs.unlink(fullPath);
    
    res.json({ ok: true, message: 'Тест успешно удален' });
  } catch (e: any) {
    console.error('Error deleting test:', e);
    res.status(500).json({ error: 'Ошибка удаления теста', details: e?.message });
  }
});


