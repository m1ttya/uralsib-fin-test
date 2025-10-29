import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export default function AboutSection() {
  const items = [
    {
      title: 'Кто мы',
      body: `Уралсиб — российский банк с фокусом на удобные финансовые сервисы для частных лиц и бизнеса. Мы верим в понятные продукты и поддержку на каждом этапе финансового пути.`
    },
    {
      title: 'Что здесь можно сделать',
      body: `Пройти короткий тест по финансовой грамотности, получить базовые рекомендации и подобрать материалы для самостоятельного изучения.`
    },
    {
      title: 'Почему это полезно',
      body: `Тест помогает быстро оценить текущий уровень знаний, увидеть пробелы и получить простые шаги, с которых удобно начать.`
    },
    {
      title: 'Материалы и статьи',
      body: `Мы собрали понятные статьи про акции, вклады, кредиты и инвестиционное страхование жизни. Открывайте материалы прямо на сайте в удобном формате.`
    },
    {
      title: 'Безопасность и приватность',
      body: `Мы заботимся о безопасности данных. Авторизация через банк будет добавлена позже; сейчас можно пройти тест без входа.`
    },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="about" className="py-12 md:py-20 scroll-mt-24">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="text-2xl md:text-4xl font-bold text-primary text-center mb-10">О нас</h2>
        <div className="space-y-4">
          {items.map((it, idx) => {
            const open = openIndex === idx;
            const panelId = `about-panel-${idx}`;
            const btnId = `about-button-${idx}`;
            return (
              <div key={it.title} className="rounded-3xl bg-white/70 backdrop-blur border border-white/60 shadow-md transition-shadow">
                <button
                  id={btnId}
                  aria-controls={panelId}
                  aria-expanded={open}
                  onClick={() => setOpenIndex(open ? null : idx)}
                  className="w-full text-left p-6 md:p-7 flex items-center justify-between"
                >
                  <span className="font-semibold text-gray-900 text-xl md:text-2xl">{it.title}</span>
                  <span className={`ml-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      id={panelId}
                      role="region"
                      aria-labelledby={btnId}
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 md:px-7 pb-6 md:pb-7 text-gray-700 prose prose-neutral max-w-none">
                        <p>{it.body}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
