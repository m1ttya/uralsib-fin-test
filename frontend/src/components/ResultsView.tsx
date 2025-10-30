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
  // Ensure modal container width is controlled when showing results
  useEffect(() => {
    // Try to find the nearest test modal container and adjust its width
    const paper = document.querySelector('.results-modal-paper') as HTMLElement | null;
    if (!paper) return;
    const prevWidth = paper.style.width;
    const prevMaxWidth = paper.style.maxWidth;
    // Apply desired width for results view
    paper.style.width = 'min(900px, 94vw)';
    paper.style.maxWidth = 'none';
    return () => {
      // Restore on unmount
      paper.style.width = prevWidth;
      paper.style.maxWidth = prevMaxWidth;
    };
  }, []);
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
    console.log('Открываем банк:', url);
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Ошибка открытия банка:', error);
      // Fallback - прямое перенаправление
      window.location.href = url;
    }
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

  const getResultMessage = () => {
    if (score >= 90) return 'Превосходно!';
    if (score >= 80) return 'Отлично!';
    if (score >= 70) return 'Хорошо!';
    if (score >= 60) return 'Неплохо!';
    return 'Есть куда расти!';
  };

  const getResultDescription = () => {
    if (score >= 90) return 'Ваши знания в области финансов на высоком уровне! Продолжайте в том же духе.';
    if (score >= 80) return 'Вы демонстрируете хорошее понимание финансовых вопросов. Совсем немного до совершенства!';
    if (score >= 70) return 'Неплохой результат! У вас есть базовое понимание финансов, но есть пространство для роста.';
    if (score >= 60) return 'Вы на правильном пути! Рекомендуем изучить дополнительные материалы для улучшения результата.';
    return 'Не расстраивайтесь! Каждый начинает с малого. Изучите наши материалы и попробуйте снова.';
  };

  // Генерируем персональные рекомендации на основе результатов (заглушка)
  const getPersonalRecommendations = () => {
    const recommendations = [];
    
    // Анализируем результат и добавляем соответствующие рекомендации
    if (score < 70) {
      recommendations.push({
        title: 'Изучите основы финансовой грамотности',
        description: 'Базовый курс поможет вам понять ключевые принципы управления деньгами',
        icon: '📚',
        category: 'Обучение'
      });
    }
    
    if (score >= 60) {
      recommendations.push({
        title: 'Откройте накопительный счёт',
        description: 'Начните формировать финансовую подушку безопасности с выгодной ставкой',
        icon: '💰',
        category: 'Накопления'
      });
    }
    
    if (score >= 70) {
      recommendations.push({
        title: 'Рассмотрите инвестиционные продукты',
        description: 'Готовы к следующему шагу? Изучите возможности приумножения капитала',
        icon: '📈',
        category: 'Инвестиции'
      });
    }
    
    if (score >= 80) {
      recommendations.push({
        title: 'Оптимизируйте налоги с ИИС',
        description: 'Индивидуальный инвестиционный счёт поможет получить налоговые льготы',
        icon: '🎯',
        category: 'Налогообложение'
      });
    }
    
    // Добавляем универсальные рекомендации
    if (correctCount < test.questions.length) {
      recommendations.push({
        title: 'Изучите материалы по слабым темам',
        description: `Проработайте ${test.questions.length - correctCount} вопрос(ов), где были ошибки`,
        icon: '🔍',
        category: 'Развитие'
      });
    }
    
    recommendations.push({
      title: 'Подключите мобильный банк',
      description: 'Управляйте финансами удобно через приложение Уралсиб',
      icon: '📱',
      category: 'Сервисы'
    });
    
    // Возвращаем первые 4 рекомендации
    return recommendations.slice(0, 4);
  };

  const personalRecommendations = getPersonalRecommendations();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="relative flex flex-col h-full overflow-hidden bg-gradient-to-br from-primary via-secondary to-purple-600"
    >
      {/* Логотип для результатов */}
      <div className="flex justify-center py-4 sm:py-6 md:py-8 px-4 sm:px-6 md:px-8">
        <img src="./uralsib_logo_white.svg" alt="Банк Уралсиб" className="h-8 sm:h-9 md:h-10 lg:h-11 w-auto" />
      </div>

      {/* Единая карточка результатов с рекомендациями */}
      <div className="relative flex-1 overflow-hidden">
        
        {/* Декоративные фоновые элементы */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-8 right-12 w-24 h-24 bg-white rounded-full blur-xl"></div>
          <div className="absolute bottom-16 left-8 w-32 h-32 bg-white rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-white rounded-full blur-lg"></div>
        </div>

        {/* 3D персонаж */}
        <div className="absolute right-8 top-8 opacity-80">
          <img src="/images/img/3_image10.png" alt="character" className="w-24 h-24 object-contain drop-shadow-lg" 
               onError={(e)=>{(e.currentTarget as HTMLImageElement).style.display='none'}}/>
        </div>

        {/* CSS декоративные элементы */}
        <div className="absolute left-8 bottom-8 opacity-30">
          <div className="w-12 h-12 bg-white/20 rounded-full blur-sm"></div>
        </div>
        <div className="absolute right-1/4 bottom-12 opacity-20">
          <div className="w-8 h-8 bg-white/30 rounded-full blur-lg"></div>
        </div>
        <div className="absolute left-1/4 top-1/2 opacity-15">
          <div className="w-6 h-6 bg-white/25 rounded-full blur-md"></div>
        </div>

        {/* Горизонтальная компоновка - компактная */}
        <div className="flex flex-col lg:flex-row gap-6 p-6 h-full">
          
          {/* Левая колонка - результаты и кнопки */}
          <div className="flex-1 flex flex-col justify-between py-4 relative z-10">
            <div className="relative z-10">
              <div className="text-white/70 text-sm font-medium mb-2 uppercase tracking-wider">
                Результат теста
              </div>
              
              <div className="flex items-baseline gap-3 mb-4">
                <div className="text-white text-5xl lg:text-6xl font-black">{score}</div>
                <div className="text-white/90 text-3xl font-bold">%</div>
              </div>
              
              <h2 className="text-white text-2xl lg:text-3xl font-bold mb-4">{getResultMessage()}</h2>
              
              <p className="text-white/90 text-base lg:text-lg leading-relaxed max-w-md mb-6">
                {getResultDescription()}
              </p>

              {/* Статистика */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 inline-block">
                <div className="text-white/70 text-sm mb-1">Правильных ответов</div>
                <div className="text-white text-xl font-bold">{correctCount} из {test.questions.length}</div>
              </div>
            </div>

            {/* Декоративные элементы и достижения */}
            <div className="my-6">
              {/* Стильные декоративные элементы */}
              <div className="flex items-center justify-center mb-6">
                <div className="flex items-center gap-6">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8, rotate: -45 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="w-16 h-16 bg-gradient-to-br from-yellow-400/30 to-orange-500/30 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20"
                  >
                    <span className="text-3xl">💰</span>
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8, rotate: 45 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    className="w-20 h-20 bg-gradient-to-br from-green-400/30 to-blue-500/30 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20"
                  >
                    <span className="text-4xl">📈</span>
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8, rotate: -45 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ delay: 0.7, duration: 0.6 }}
                    className="w-16 h-16 bg-gradient-to-br from-purple-400/30 to-pink-500/30 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20"
                  >
                    <span className="text-3xl">🎯</span>
                  </motion.div>
                </div>
              </div>

              {/* Стильные достижения */}
              <div className="flex flex-col gap-3 max-w-md">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                  className="flex items-center gap-3 text-white/90 text-base bg-white/10 rounded-xl p-3 backdrop-blur-sm"
                >
                  <div className="w-3 h-3 bg-green-400 rounded-full shadow-lg"></div>
                  <span className="font-medium">Базовые знания освоены</span>
                </motion.div>
                
                {score >= 70 && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 }}
                    className="flex items-center gap-3 text-white/90 text-base bg-white/10 rounded-xl p-3 backdrop-blur-sm"
                  >
                    <div className="w-3 h-3 bg-blue-400 rounded-full shadow-lg"></div>
                    <span className="font-medium">Готовы к инвестициям</span>
                  </motion.div>
                )}
                
                {score >= 90 && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.0 }}
                    className="flex items-center gap-3 text-white/90 text-base bg-white/10 rounded-xl p-3 backdrop-blur-sm"
                  >
                    <div className="w-3 h-3 bg-purple-400 rounded-full shadow-lg"></div>
                    <span className="font-medium">Эксперт финансов</span>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Кнопки действий в левой колонке */}
            <div className="flex flex-col gap-3 max-w-sm relative z-50">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Клик по кнопке банка');
                  handleGoToBank('https://uralsib.ru/');
                }}
                className="w-full bg-white text-primary rounded-xl py-3 px-6 font-semibold shadow-lg hover:shadow-xl hover:bg-white/90 transition-all duration-300 cursor-pointer relative z-50 pointer-events-auto"
                type="button"
                style={{ pointerEvents: 'auto' }}
              >
                Открыть счёт в Уралсибе
              </button>
              
              {score < 80 && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Клик по кнопке рестарта', onRestart);
                    if (onRestart) {
                      onRestart();
                    } else {
                      console.error('onRestart не определен!');
                    }
                  }}
                  className="w-full bg-white/20 text-white rounded-xl py-3 px-6 font-semibold hover:bg-white/30 transition-all duration-300 border border-white/30 cursor-pointer relative z-50 pointer-events-auto"
                  type="button"
                  style={{ pointerEvents: 'auto' }}
                >
                  Пройти ещё раз
                </button>
              )}
            </div>
          </div>

          {/* Правая колонка - только рекомендации */}
          <motion.div 
            className="flex-1 bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-white text-lg font-bold">Персональные рекомендации</h3>
                <span className="text-white/70 text-sm">На основе ваших ответов</span>
              </div>
            </div>
            
            {/* Сетка рекомендаций */}
            <div className="space-y-4">
              {personalRecommendations.slice(0, 3).map((rec, idx) => (
                <motion.div
                  key={rec.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/30 transition-all duration-300 group cursor-pointer backdrop-blur-sm"
                  onClick={() => handleGoToBank('https://uralsib.ru/')}
                >
                  <div className="text-2xl flex-shrink-0">{rec.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full font-medium">
                        {rec.category}
                      </span>
                    </div>
                    <h4 className="text-white font-semibold text-base mb-2 group-hover:text-white/90 transition-colors">
                      {rec.title}
                    </h4>
                    <p className="text-white/70 text-sm leading-relaxed">
                      {rec.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
                }