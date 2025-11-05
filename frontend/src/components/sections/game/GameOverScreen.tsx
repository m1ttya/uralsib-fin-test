interface GameOverScreenProps {
  score: number;
  onRestart: () => void;
  onBackToMenu: () => void;
}

export default function GameOverScreen({ score, onRestart, onBackToMenu }: GameOverScreenProps) {
  
  // Определяем уровень достижения
  const getScoreLevel = (score: number) => {
    if (score >= 50) return { emoji: '🏆', title: 'Финансовый эксперт!', message: 'Отличное понимание финансов!' };
    if (score >= 30) return { emoji: '🥇', title: 'Финансово грамотный!', message: 'Хорошие знания финансов!' };
    if (score >= 15) return { emoji: '🥈', title: 'На правильном пути!', message: 'Продолжайте изучать финансы!' };
    if (score >= 5) return { emoji: '🥉', title: 'Начинающий!', message: 'Есть куда расти!' };
    return { emoji: '📚', title: 'Нужно учиться!', message: 'Изучите основы финансов!' };
  };

  const level = getScoreLevel(score);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 z-10">
      
      {/* Компактный заголовок */}
      <div className="mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-white mb-2 drop-shadow-lg">
          Игра окончена!
        </h2>
        <div className="text-base font-bold text-white mb-1 drop-shadow">
          {level.title}
        </div>
        <div className="text-sm text-white/90 font-sans drop-shadow">
          {level.message}
        </div>
      </div>

      {/* Компактный счет */}
      <div className="mb-6 p-4 rounded-xl bg-white/80 backdrop-blur shadow-sm border border-white/60">
        <div className="text-sm text-gray-700 mb-1 font-sans">Ваш результат:</div>
        <div className="text-2xl font-bold text-primary">{score}</div>
        <div className="text-xs text-gray-600 mt-1 font-sans">
          {score === 1 ? 'очко' : score < 5 ? 'очка' : 'очков'}
        </div>
      </div>

      {/* Компактные кнопки */}
      <div className="flex gap-3 w-full max-w-xs mb-4">
        <button
          onClick={onRestart}
          className="flex-1 px-4 py-2 rounded-lg text-primary font-bold shadow-lg bg-white hover:bg-gray-50 transition-all text-sm"
        >
          Играть снова
        </button>
        <button
          onClick={onBackToMenu}
          className="flex-1 px-4 py-2 rounded-lg bg-white/20 text-white font-bold border border-white/30 hover:bg-white/30 transition-all backdrop-blur-md text-sm"
        >
          В меню
        </button>
      </div>

      {/* Компактный совет */}
      <div className="p-3 rounded-lg bg-white/60 backdrop-blur shadow-sm border border-white/40 max-w-sm">
        <div className="text-xs text-gray-800 font-sans">
          <strong>Совет:</strong> Изучите банковские продукты Уралсиб для улучшения финансовой грамотности!
        </div>
      </div>

    </div>
  );
}