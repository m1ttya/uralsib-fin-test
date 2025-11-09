// frontend/src/components/ResultsView.tsx
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
type BackendQuestion = { id: string; text: string; options: string[]; tags?: Array<{ category?: string; linkUrl?: string; title?: string }> };
// Допускаем моковую модель: может быть correctIndex
type MockQuestion = { text: string; options: string[]; correctIndex: number };
type BackendTest = { id: string; title: string; category: string; variant?: string; questions: (BackendQuestion | MockQuestion)[] };

type Props = {
  test: BackendTest; // допускаем как бэкенд-версию теста
  answers: (number | null)[]; // индексы в ПЕРЕТАСОВАННОМ порядке
  correctByQ?: Record<string, number>; // правильные индексы в ПЕРЕТАСОВАННОМ порядке по questionId
  onRestart?: () => void;
  onToggleArticle?: (open: boolean) => void;
};

export default function ResultsView({ test, answers, correctByQ, onRestart, onToggleArticle }: Props) {
  // CSS для плавного появления рекомендаций без мерцания скроллбара
  const recommendationsStyles = `
    .recommendations-container {
      scrollbar-width: thin;
      scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
    }
    .recommendations-container::-webkit-scrollbar {
      width: 6px;
    }
    .recommendations-container::-webkit-scrollbar-track {
      background: transparent;
    }
    .recommendations-container::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 3px;
    }
    .recommendations-container::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.5);
    }
  `;

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

  // Загружаем только продукты (как было, когда работала карточка «Рекомендуем продукт»)
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

  // Набираем статистику по тегам и темам (fallback)
  const tagStats = new Map<string, { total: number; correct: number; tag: any }>();
  const topicStats = new Map<string, { total: number; correct: number }>();
  test.questions.forEach((q: any, idx: number) => {
    const ans = answers[idx];
    const correctShuffled = correctByQ && q?.id ? correctByQ[q.id] : (typeof (q as any)?.correctIndex === 'number' ? (q as any).correctIndex : undefined);
    const isCorrect = typeof ans === 'number' && typeof correctShuffled === 'number' && ans === correctShuffled;

    // Теги
    const tags: any[] = Array.isArray(q?.tags) ? q.tags : [];
    if (tags.length > 0) {
      tags.forEach((t:any) => {
        const key = t?.linkUrl || `${t?.category || ''}:${t?.title || ''}`;
        const s = tagStats.get(key) || { total: 0, correct: 0, tag: t };
        s.total += 1;
        if (isCorrect) s.correct += 1;
        tagStats.set(key, s);
      });
    } else {
      // Fallback на темы по ключевым словам
      const topic = detectTopic(q.text || '');
      const s = topicStats.get(topic) || { total: 0, correct: 0 };
      s.total += 1;
      if (isCorrect) s.correct += 1;
      topicStats.set(topic, s);
    }
  });

  // Лучший/худший тег
  const scoredTags = Array.from(tagStats.values()).map(v => ({ key: v.tag?.linkUrl || `${v.tag?.category || ''}:${v.tag?.title || ''}`, score: v.correct / Math.max(1, v.total), tag: v.tag, total: v.total }))
    .sort((a,b)=>b.score-a.score);
  const bestTag = scoredTags[0] || null;
  const worstTag = scoredTags[scoredTags.length-1] || null;

  // Рекомендации по продуктам: лучший тег -> продукт той же категории/ссылки
  let productRecommendation: Product | null = null;
  if (bestTag?.tag) {
    const t = bestTag.tag;
    if (t.linkUrl) {
      productRecommendation = { title: t.title || 'Подходящий продукт', linkUrl: t.linkUrl, linkText: t.linkText };
    } else if (t.category && byTopic[t.category]) {
      const found = byTopic[t.category].find(p => p.title === t.title) || byTopic[t.category][0];
      if (found) productRecommendation = found;
    }
  }
  if (!productRecommendation) {
    // Fallback на темы
    const scoredTopics = Array.from(topicStats.entries()).map(([k, v]) => ({ key: k, score: v.correct / Math.max(1, v.total) }))
      .sort((a,b)=>b.score-a.score);
    const topTopics = scoredTopics.filter(t=>t.score >= 0.4).slice(0,2).map(t=>t.key);
    const pool = topTopics.flatMap(t => byTopic[t] || []);
    const recs = (pool.length ? pool : (byTopic['budgeting'] || [])).slice(0,1);
    productRecommendation = recs[0] || null;
  }

  // Загрузка опубликованных статей для рекомендаций
  type ArticleMeta = { id: string; title: string; tags?: any[] };
  const [articles, setArticles] = useState<ArticleMeta[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetch(`${import.meta.env.BASE_URL}api/articles`, { cache: 'no-store' })
      .then(r => r.json())
      .then((list) => { if (!cancelled) setArticles(Array.isArray(list) ? list : []); })
      .catch(()=> { if (!cancelled) setArticles([]); });
    return () => { cancelled = true; };
  }, []);

  // Рекомендации по статьям: худший тег -> статья, у которой совпадает тег
  let articleRecommendation: { id: string; title: string } | null = null;
  if (worstTag?.tag && articles.length > 0) {
    const t = worstTag.tag;
    const matchByLink = (a:any) => Array.isArray(a.tags) && a.tags.some((at:any)=> at?.linkUrl && at.linkUrl === t.linkUrl);
    const matchByCategory = (a:any) => Array.isArray(a.tags) && a.tags.some((at:any)=> !t.linkUrl && t.category && at?.category === t.category);
    const found = articles.find(a => matchByLink(a) || matchByCategory(a));
    if (found) articleRecommendation = { id: found.id, title: found.title };
  }

  const [articleContent, setArticleContent] = useState<{ id: string; title: string; html: string } | null>(null);
  useEffect(() => {
    if (onToggleArticle) onToggleArticle(!!articleContent);
    // Do not modify modal container overflow; manage scrolling inside the article view itself
  }, [!!articleContent]);

  const openArticleSafely = async (id: string, title?: string) => {
    const base = import.meta.env.BASE_URL || '/';
    try {
      const res = await fetch(`${base}api/articles/${id}/html`, { cache: 'no-store' });
      if (res.ok) {
        const html = await res.text();
        setArticleContent({ id, title: title || 'Статья', html });
        return;
      }
    } catch {}
    // Фоллбек на content?format=html
    try {
      const res2 = await fetch(`${base}api/articles/${id}/content?format=html`, { cache: 'no-store' });
      if (res2.ok) {
        const html2 = await res2.text();
        setArticleContent({ id, title: title || 'Статья', html: html2 });
        return;
      }
    } catch {}
    // Если не удалось загрузить внутрь окна, можно последним шагом открыть в новой вкладке
    try { window.open(`${base}api/articles/${id}/content?format=html`, '_blank', 'noopener,noreferrer'); } catch {}
  };

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

  // Если открыта статья для "Развития" — показываем её вместо окна результатов
  if (articleContent) {
    return (
      <motion.div
        key="article-view"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25 }}
        className="relative flex flex-col bg-white rounded-2xl shadow-xl border border-gray-100"
      >
        {/* Заголовок вне области скролла, всегда виден */}
        <div className="bg-white border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="text-lg font-bold truncate mr-3 text-secondary">{articleContent.title}</h1>
            <button
              type="button"
              onClick={() => setArticleContent(null)}
              className="px-4 py-2 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors font-medium"
            >
              Назад
            </button>
          </div>
        </div>
        <div className="max-h-[80vh] overflow-y-auto modal-scroll-area">
          <div className="px-5 pb-5">
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: articleContent.html }}
            />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <style>{recommendationsStyles}</style>
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
      <div className="relative flex-1 overflow-y-auto results-scroll pb-24">
        
        {/* Декоративные фоновые элементы */}
        {/* лаконичный фон без декоративных элементов */}

        {/* Убран персонаж для лаконичности */}

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 sm:gap-6 sm:p-6 h-full">
          
          {/* Левая колонка - результаты и кнопки */}
          <div className="flex flex-col h-full min-h-0 py-4 pb-5 sm:pb-6 relative z-10">
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
              <div className="mx-auto w-fit bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                <div className="text-white/70 text-sm mb-1">Правильных ответов</div>
                <div className="text-white text-xl font-bold">{correctCount} из {test.questions.length}</div>
              </div>
            </div>

            {/* Декоративные элементы и достижения */}
            <div className="my-6 flex-1 min-h-0">
              {/* Убрали декоративные плитки */}

              {/* Стильные достижения */}
              <div className="flex flex-col gap-3 w-full overflow-y-auto pr-1">
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
            <div className="flex flex-col gap-3 w-full max-w-none relative z-50">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Клик по кнопке банка');
                  handleGoToBank('https://uralsib.ru/');
                }}
                className="w-full bg-white text-primary rounded-xl py-3 px-6 font-semibold shadow-md hover:shadow-lg hover:bg-white/95 transition-all duration-200 cursor-pointer relative z-50 pointer-events-auto"
                type="button"
                style={{ pointerEvents: 'auto' }}
              >
                Открыть счёт в Уралсиб
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
                  className="w-full bg-white/20 text-white rounded-xl py-3 px-6 font-semibold hover:bg-white/25 transition-all duration-200 border border-white/30 cursor-pointer relative z-50 pointer-events-auto"
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
            className="flex flex-col bg-white/10 backdrop-blur-md rounded-3xl p-6 min-h-0"
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
            
            {/* Сетка рекомендаций: 1 продукт (лучший тег) + 1 статья (худший тег) + персональные */}
            <div
              className="recommendations-container h-full overflow-y-auto pr-1 flex flex-col gap-4"
              style={{
                transition: 'all 0.3s ease-in-out',
                minHeight: '400px'
              }}
            >
              {/* Рекомендованный продукт по лучшему тегу */}
              {productRecommendation && (
                <motion.div
                  key={`best-product-${productRecommendation.linkUrl}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/30 transition-all duration-300 group cursor-pointer backdrop-blur-sm"
                  onClick={() => handleGoToBank(productRecommendation.linkUrl)}
                >
                  <div className="text-2xl flex-shrink-0">🏦</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full font-medium">Рекомендуем продукт</span>
                    </div>
                    <h4 className="text-white font-semibold text-base mb-1 group-hover:text-white/90 transition-colors">
                      {productRecommendation.title}
                    </h4>
                    <p className="text-white/70 text-sm leading-relaxed">Рекомендуем продукт на основе ваших сильных ответов</p>
                  </div>
                </motion.div>
              )}

              {/* Рекомендованная статья по худшему тегу */}
              {articleRecommendation && (
                <motion.div
                  key={`worst-article-${articleRecommendation.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/30 transition-all duration-300 group cursor-pointer backdrop-blur-sm"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); openArticleSafely(articleRecommendation.id, articleRecommendation.title); }}
                >
                  <div className="text-2xl flex-shrink-0">📖</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full font-medium">Развитие</span>
                    </div>
                    <h4 className="text-white font-semibold text-base mb-1 group-hover:text-white/90 transition-colors">
                      {articleRecommendation.title}
                    </h4>
                    <p className="text-white/70 text-sm leading-relaxed">Рекомендуем материал для подтягивания слабой темы</p>
                  </div>
                </motion.div>
              )}

              {/* Остальные персональные рекомендации (оставляем одну карточку) */}
              {personalRecommendations.slice(0, 1).map((rec, idx) => {
                const typedRec = rec as { title: string; description: string; icon: string; category: string };
                return (
                  <motion.div
                    key={typedRec.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 + idx * 0.1 }}
                    className="flex items-start gap-4 p-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/30 transition-all duration-300 group cursor-pointer backdrop-blur-sm"
                    onClick={() => handleGoToBank('https://uralsib.ru/')}
                  >
                    <div className="text-2xl flex-shrink-0">{typedRec.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full font-medium">
                          {typedRec.category}
                        </span>
                      </div>
                      <h4 className="text-white font-semibold text-base mb-2 group-hover:text-white/90 transition-colors">
                        {typedRec.title}
                      </h4>
                      <p className="text-white/70 text-sm leading-relaxed">
                        {typedRec.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}

              {articleContent && (
                <div className="mt-6 p-4 bg-white rounded-2xl text-gray-900 max-h-[60vh] overflow-auto">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold mr-4 truncate">{(articleContent as any).title}</h3>
                    <button
                      type="button"
                      onClick={() => setArticleContent(null)}
                      className="px-4 py-2 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors font-medium"
                    >
                      Назад
                    </button>
                  </div>
                  <div
                    className="article-content text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: (articleContent as any).html }}
                  />
                </div>
              )}

            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
    </>
  );
}