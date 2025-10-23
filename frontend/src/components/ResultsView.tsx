// frontend/src/components/ResultsView.tsx
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
type BackendQuestion = { id: string; text: string; options: string[] };
// Допускаем моковую модель: может быть correctIndex
type MockQuestion = { text: string; options: string[]; correctIndex: number };
type BackendTest = { id: string; title: string; category: string; variant?: string; questions: (BackendQuestion | MockQuestion)[] };

type Props = {
  test: BackendTest; // допускаем как бэкенд-версию теста
  answers: (number | null)[]; // индексы в ПЕРЕТАСОВАННОМ порядке
  correctByQ?: Record<string, number>; // правильные индексы в ПЕРЕТАСОВАННОМ порядке по questionId
  onRestart?: () => void;
};

export default function ResultsView({ test, answers, correctByQ, onRestart }: Props) {
  // Считаем правильные ответы, сравнивая выбранный индекс (перетасованный)
  // с правильным индексом (перетасованный) из correctByQ
  const correctCount: number = answers.reduce((acc: number, ans: number | null, idx: number) => {
    if (ans === null) return acc;
    const q: any = test.questions[idx];
    // Если есть correctByQ (шумфлированный индекс от бэкенда)
    const correctShuffled = correctByQ && q?.id ? correctByQ[q.id] : undefined;
    if (typeof correctShuffled === 'number') {
      return ans === correctShuffled ? acc + 1 : acc;
    }
    // Фоллбэк для моков: если у вопроса есть correctIndex и вариантов порядок не меняли
    if (typeof q?.correctIndex === 'number') {
      return ans === q.correctIndex ? acc + 1 : acc;
    }
    return acc;
  }, 0);

  const score = Math.round((correctCount / test.questions.length) * 100);

  const handleGoToBank = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Определяем смайлик в зависимости от результата
  const getEmoji = (score: number) => {
    if (score >= 80) return '🎉';
    if (score >= 60) return '😊';
    if (score >= 40) return '😐';
    return '😔';
  };

  const getMessage = (score: number) => {
    if (score >= 80) return 'Отлично!';
    if (score >= 60) return 'Хорошо!';
    if (score >= 40) return 'Неплохо!';
    return 'Попробуйте еще раз!';
  };

  type Product = { title: string; linkUrl: string; linkText?: string };
  const [byTopic, setByTopic] = useState<Record<string, Product[]>>({});

  useEffect(() => {
    const url = `${import.meta.env.BASE_URL}api/products_by_topic.json?v=${Date.now()}`;
    fetch(url, { cache: 'no-store' }).then(async (r) => {
      try {
        const data = await r.json();
        setByTopic(data || {});
      } catch {}
    }).catch(() => {});
  }, []);

  // Простая классификация темы вопроса по ключевым словам
  const detectTopic = (text: string): string => {
    const t = (text || '').toLowerCase();
    if (/вклад|депозит|накопит/.test(t)) return 'deposits';
    if (/ипотек/.test(t)) return 'mortgage';
    if (/кредит(?!ная карта)|займ/.test(t)) return 'credits';
    if (/карта|картой/.test(t)) return 'cards';
    if (/иис|инвест|акци|облигац|офз/.test(t)) return 'investments';
    if (/страхован/.test(t)) return 'insurance';
    if (/бюджет|подушка|копит|сбереж|расход|доход/.test(t)) return 'budgeting';
    return 'budgeting';
  };

  // Набираем статистику по темам
  const topicStats = new Map<string, { total: number; correct: number }>();
  test.questions.forEach((q: any, idx: number) => {
    const topic = detectTopic(q.text || '');
    const s = topicStats.get(topic) || { total: 0, correct: 0 };
    s.total += 1;
    const ans = answers[idx];
    const correctShuffled = correctByQ && q?.id ? correctByQ[q.id] : (typeof (q as any)?.correctIndex === 'number' ? (q as any).correctIndex : undefined);
    if (typeof ans === 'number' && typeof correctShuffled === 'number' && ans === correctShuffled) s.correct += 1;
    topicStats.set(topic, s);
  });
  const scoredTopics = Array.from(topicStats.entries()).map(([k, v]) => ({ key: k, score: v.correct / Math.max(1, v.total) }))
    .sort((a,b)=>b.score-a.score);

  const topTopics = scoredTopics.filter(t=>t.score >= 0.4).slice(0,2).map(t=>t.key);
  const pool = topTopics.flatMap(t => byTopic[t] || []);
  const recs = (pool.length ? pool : (byTopic['budgeting'] || [])).slice(0,3);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="relative flex flex-col h-full"
    >
      <div className="flex flex-col items-center justify-between sm:justify-center md:justify-center flex-1 px-2 sm:px-3 md:px-2 pt-0 sm:pt-8 md:pt-4 pb-[180px] sm:pb-4 md:pb-2 lg:pb-2 xl:pb-2 2xl:pb-2">
        {/* Контейнер для стикера и текста - на мобильной версии */}
        <div className="flex-1 flex flex-col items-center justify-center pt-16 sm:contents md:contents">
          {/* Смайлик */}
          <div className="mb-4 sm:mb-8 md:mb-10 flex justify-center sm:block md:block">
            <div className="text-8xl sm:text-8xl md:text-8xl">{getEmoji(score)}</div>
          </div>
          
          {/* Результат без контейнера */}
          <div className="text-center max-w-sm mx-auto sm:mb-8 md:mb-10">
          <h2 className="text-2xl sm:text-2xl md:text-3xl text-primary mb-2 sm:mb-2 md:mb-3 font-bold">
            Ваш результат: {score}%
          </h2>
          
          {getMessage(score) === 'Попробуйте еще раз!' ? (
            <button
              onClick={onRestart}
              className="relative text-lg sm:text-xl text-gray-600 mb-2 sm:mb-2 md:mb-3 hover:text-gray-800 transition-colors duration-200 cursor-pointer overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/80 to-white/0 translate-x-[-100%] animate-shimmer"></div>
              <span className="relative z-10">{getMessage(score)}</span>
            </button>
          ) : (
            <p className="text-xl sm:text-xl text-gray-600 mb-2 sm:mb-2 md:mb-3">{getMessage(score)}</p>
          )}
          
          <p className="text-lg sm:text-lg text-gray-500">
            Правильных ответов: {correctCount} из {test.questions.length}
          </p>
          </div>
        </div>
        
        {/* Кнопка - точно как на лендинге */}
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleGoToBank('https://uralsib.ru/')}
          className="relative bg-gradient-to-r from-primary to-primary text-white rounded-full shadow-lg hover:shadow-purple-900/25 hover:from-secondary hover:to-secondary overflow-hidden group inline-flex items-center justify-center px-8 py-4 sm:px-10 sm:py-5 text-base sm:text-lg mt-6 sm:mt-8"
          style={{
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          <span className="relative z-10">Перейти в банк</span>
        </motion.button>

        {/* Рекомендации по продуктам */}
        <div className="mt-6 w-full">
          <div className="rounded-2xl bg-white/80 backdrop-blur border border-white/60 shadow-md p-4">
            <div className="text-primary font-bold mb-3">Рекомендуем</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recs.slice(0, 3).map((p) => (
                <button key={p.linkUrl} onClick={() => handleGoToBank(p.linkUrl)} className="text-left rounded-xl p-4 bg-white/70 hover:bg-white shadow-sm hover:shadow-md transition-all">
                  <div className="text-gray-900 font-semibold mb-1 text-base">{p.title.replace(/^https?:\/\//,'')}</div>
                  <div className="text-primary text-sm">{p.linkText || 'Перейти'}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
                }