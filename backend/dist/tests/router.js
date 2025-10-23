"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testsRouter = void 0;
const express_1 = require("express");
const crypto_1 = require("crypto");
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const dataRoot = path_1.default.resolve(__dirname, '../../data/tests');
const sessions = new Map();
exports.testsRouter = (0, express_1.Router)();
// Utility: Fisher–Yates with seed
function seededShuffle(arr, seed) {
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
async function readTestById(testId) {
    // map testId to file path
    // examples: adults_general, adults_level_1, children_level_2
    const [category, ...rest] = testId.split('_');
    const variant = rest.join('_');
    if (!category || !variant)
        throw new Error('Invalid testId');
    let relPath;
    if (category === 'adults') {
        relPath = variant === 'general' ? 'adults/general.json' : `adults/${variant}.json`;
    }
    else if (category === 'pensioners') {
        relPath = variant === 'general' ? 'pensioners/general.json' : `pensioners/${variant}.json`;
    }
    else if (category === 'children') {
        relPath = `children/${variant}.json`;
    }
    else {
        throw new Error('Unknown category');
    }
    const fullPath = path_1.default.join(dataRoot, relPath);
    const raw = await promises_1.default.readFile(fullPath, 'utf-8');
    return JSON.parse(raw);
}
function sanitizeTestForClient(test, session) {
    // apply shuffled order
    const questionById = {};
    test.questions.forEach(q => (questionById[q.id] = q));
    const questions = session.shuffledQuestionIds.map(qid => {
        const q = questionById[qid];
        const map = session.shuffledOptionsByQid[qid];
        const shuffledOptions = map.map(idx => q.options[idx]);
        return { id: q.id, text: q.text, options: shuffledOptions };
    });
    return { id: test.id, title: test.title, category: test.category, variant: test.variant, questions };
}
exports.testsRouter.get('/', async (req, res) => {
    // Returns list of available tests (metadata only)
    try {
        const categories = ['adults', 'pensioners', 'children'];
        const variantsByCat = {
            adults: ['general', 'level_1', 'level_2', 'level_3'],
            pensioners: ['general', 'level_1', 'level_2', 'level_3'],
            children: ['level_1', 'level_2', 'level_3']
        };
        const list = [];
        for (const cat of categories) {
            for (const variant of variantsByCat[cat]) {
                const id = `${cat}_${variant}`;
                try {
                    const t = await readTestById(id);
                    list.push({ id: t.id, title: t.title, category: t.category, variant: t.variant });
                }
                catch {
                    // skip missing files
                }
            }
        }
        res.json({ tests: list });
    }
    catch (e) {
        res.status(500).json({ error: 'Failed to list tests' });
    }
});
exports.testsRouter.post('/:testId/start', async (req, res) => {
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
        const shuffledOptionsByQid = {};
        for (const q of shuffledQuestions) {
            const optionIdxs = q.options.map((_, i) => i);
            const shuffledIdxs = seededShuffle(optionIdxs, seed ^ q.id.length);
            shuffledOptionsByQid[q.id] = shuffledIdxs;
        }
        const sessionId = (0, crypto_1.randomUUID)();
        const session = {
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
    }
    catch (e) {
        res.status(500).json({ error: 'Failed to start test' });
    }
});
exports.testsRouter.post('/:testId/answer', async (req, res) => {
    try {
        const { testId } = req.params;
        const { sessionId, questionId, selectedIndex } = req.body;
        const session = sessions.get(sessionId);
        if (!session || session.testId !== testId)
            return res.status(400).json({ error: 'Invalid session' });
        const test = await readTestById(testId);
        const q = test.questions.find(q => q.id === questionId);
        if (!q)
            return res.status(400).json({ error: 'Invalid question' });
        // Map selectedIndex (in shuffled options) back to original index
        const map = session.shuffledOptionsByQid[questionId];
        const originalIndex = map[selectedIndex];
        const correct = originalIndex === q.correctIndex;
        // Find shuffled index for correct option to reveal
        const correctOptionIndex = map.findIndex((orig) => orig === q.correctIndex);
        session.answers[questionId] = selectedIndex;
        const explanationForSelected = q.correctExplanation ?? null;
        res.json({ correct, correctOptionIndex, explanationForSelected });
    }
    catch (e) {
        res.status(500).json({ error: 'Failed to check answer' });
    }
});
exports.testsRouter.post('/:testId/submit', async (req, res) => {
    try {
        const { testId } = req.params;
        const { sessionId } = req.body;
        const session = sessions.get(sessionId);
        if (!session || session.testId !== testId)
            return res.status(400).json({ error: 'Invalid session' });
        const test = await readTestById(testId);
        let correctCount = 0;
        for (const q of test.questions) {
            const selectedShuffled = session.answers[q.id];
            if (selectedShuffled == null)
                continue;
            const map = session.shuffledOptionsByQid[q.id];
            const originalIndex = map[selectedShuffled];
            if (originalIndex === q.correctIndex)
                correctCount++;
        }
        const total = test.questions.length;
        const score = Math.round((correctCount / total) * 100);
        // Optionally cleanup session (or keep TTL)
        // sessions.delete(sessionId);
        res.json({ total, correct: correctCount, score });
    }
    catch (e) {
        res.status(500).json({ error: 'Failed to submit test' });
    }
});
