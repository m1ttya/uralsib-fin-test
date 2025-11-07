import express from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

interface SaveTestResultData {
  test_id: string;
  test_title?: string;
  test_category?: string;
  percentage: number;
  correct_answers: number;
  total_questions: number;
  answers: any[];
  is_completed?: boolean;
}

// Middleware для проверки токена
const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false, error: 'Неавторизован' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).userId = parseInt(decoded.sub);
    next();
  } catch (error) {
    return res.status(401).json({ ok: false, error: 'Недействительный токен' });
  }
};

// POST /api/tests/save-result
router.post('/save-result', authenticateToken, async (req, res) => {
  try {
    const { test_id, test_title, test_category, percentage, correct_answers, total_questions, answers, is_completed = true }: SaveTestResultData = req.body;

    // Валидация
    if (!test_id) {
      return res.status(400).json({
        ok: false,
        error: 'Некорректные данные',
        details: { test_id: 'ID теста обязателен' }
      });
    }

    if (percentage < 0 || percentage > 100) {
      return res.status(400).json({
        ok: false,
        error: 'Некорректные данные',
        details: { percentage: 'Процент должен быть от 0 до 100' }
      });
    }

    if (correct_answers < 0 || total_questions < 0) {
      return res.status(400).json({
        ok: false,
        error: 'Некорректные данные'
      });
    }

    const userId = (req as any).userId;

    // Проверяем, есть ли уже результат для этого теста
    const existingResult = await query(
      'SELECT result_id FROM test_results WHERE user_id = $1 AND test_id = $2',
      [userId, test_id]
    );

    if (existingResult.rows.length > 0) {
      // Обновляем существующий результат
      await query(
        `UPDATE test_results
         SET test_title = $1,
             test_category = $2,
             percentage = $3,
             correct_answers = $4,
             total_questions = $5,
             completed_at = NOW(),
             is_completed = $6,
             answers = $7
         WHERE user_id = $8 AND test_id = $9`,
        [
          test_title || null,
          test_category || null,
          percentage,
          correct_answers,
          total_questions,
          is_completed,
          JSON.stringify(answers),
          userId,
          test_id
        ]
      );
    } else {
      // Создаем новый результат
      await query(
        `INSERT INTO test_results
         (user_id, test_id, test_title, test_category, percentage, correct_answers, total_questions, is_completed, answers)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          userId,
          test_id,
          test_title || null,
          test_category || null,
          percentage,
          correct_answers,
          total_questions,
          is_completed,
          JSON.stringify(answers)
        ]
      );
    }

    return res.json({
      ok: true,
      message: 'Результат сохранен'
    });

  } catch (error) {
    console.error('Save test result error:', error);
    return res.status(500).json({ ok: false, error: 'Ошибка сервера' });
  }
});

// GET /api/tests/results
router.get('/results', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).userId;

    const results = await query(
      'SELECT result_id, test_id, test_title, test_category, percentage, ' +
      'correct_answers, total_questions, completed_at, is_completed ' +
      'FROM test_results ' +
      'WHERE user_id = $1 ' +
      'ORDER BY completed_at DESC',
      [userId]
    );

    return res.json({
      ok: true,
      results: results.rows
    });

  } catch (error) {
    console.error('Get test results error:', error);
    return res.status(500).json({ ok: false, error: 'Ошибка сервера' });
  }
});

export default router;
