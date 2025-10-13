// frontend/src/components/ResultsView.tsx
import { motion } from 'framer-motion';
type BackendQuestion = { id: string; text: string; options: string[] };
type BackendTest = { id: string; title: string; category: string; variant: string; questions: BackendQuestion[] };

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
    const q = test.questions[idx];
    const correctShuffled = correctByQ ? correctByQ[q.id] : undefined;
    if (typeof correctShuffled === 'number') {
      return ans === correctShuffled ? acc + 1 : acc;
    }
    return acc; // если нет данных, считаем как неверный
  }, 0);

  const score = Math.round((correctCount / test.questions.length) * 100);

  const handleGoToBank = () => {
    window.open('https://uralsib.ru/', '_blank');
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="relative flex flex-col h-full"
    >
      <div className="flex flex-col items-center justify-between sm:justify-center md:justify-center flex-1 px-2 sm:px-3 md:px-2 pt-0 sm:pt-8 md:pt-4 pb-[120px] sm:pb-4 md:pb-2 lg:pb-2 xl:pb-2 2xl:pb-2">
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
          onClick={handleGoToBank}
          className="fixed left-1/2 -translate-x-1/2 z-10 sm:relative sm:left-auto sm:translate-x-0 bg-gradient-to-r from-primary to-primary text-white rounded-full premium-button shadow-lg hover:shadow-purple-900/25 hover:from-secondary hover:to-secondary overflow-hidden group flex items-center justify-center whitespace-nowrap"
          style={{
            bottom: window.innerWidth < 640 ? `calc(env(safe-area-inset-bottom, 0px) + 84px)` : undefined,
            padding: window.innerWidth < 640 ? '20px 60px' : '18px 36px',
            fontSize: window.innerWidth < 640 ? '22px' : '20px',
            minHeight: window.innerWidth < 640 ? '64px' : '60px',
            maxWidth: window.innerWidth < 640 ? '360px' : '260px',
            width: 'auto'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          <span className="relative z-10">Перейти в банк</span>
        </motion.button>
      </div>
    </motion.div>
  );
                }