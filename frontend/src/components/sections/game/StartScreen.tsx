import { useState } from 'react';
import { Difficulty } from './types';

interface StartScreenProps {
  onStart: () => void;
  difficulty: Difficulty;
  onDifficultyChange: (difficulty: Difficulty) => void;
}

export default function StartScreen({ onStart, difficulty, onDifficultyChange }: StartScreenProps) {
  const [loading, setLoading] = useState(false);

  const handleStart = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onStart();
    }, 100);
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
      
      {/* Главный заголовок */}
      <div className="mb-10 flex flex-col items-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 drop-shadow-2xl text-center">
          Финансовый Трафик
        </h1>
        <p className="text-white/90 text-base font-sans leading-relaxed drop-shadow-xl text-center">
          Проверьте свою финансовую грамотность в городе
        </p>
      </div>

      {/* Центральная кнопка */}
      <div className="mb-10 flex justify-center">
        <button
          onClick={handleStart}
          disabled={loading}
          className="px-10 py-4 rounded-2xl text-primary shadow-2xl bg-white hover:bg-gray-50 transition-all duration-300 font-bold text-lg disabled:opacity-50 hover:scale-105"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
              Загрузка...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="mr-3">
                <path d="M8 5v14l11-7z"/>
              </svg>
              Начать игру
            </div>
          )}
        </button>
      </div>

      {/* Сложность - строго по центру */}
      <div className="mb-8 flex flex-col items-center">
        <div className="text-white text-sm font-medium mb-4 drop-shadow-xl">Сложность</div>
        <div className="flex gap-4">
          {(['easy', 'medium', 'hard'] as const).map((level) => (
            <button
              key={level}
              onClick={() => onDifficultyChange(level)}
              className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                difficulty === level
                  ? 'bg-white text-primary shadow-xl scale-105'
                  : 'bg-white/30 text-white hover:bg-white/50 backdrop-blur-sm border border-white/20'
              }`}
            >
              {level === 'easy' ? 'Легко' : level === 'medium' ? 'Средне' : 'Сложно'}
            </button>
          ))}
        </div>
      </div>

      {/* Подсказка - строго по центру */}
      <div className="flex justify-center">
        <div className="text-white/70 text-sm font-sans drop-shadow-xl text-center">
          Собирайте зеленые • Избегайте красные
        </div>
      </div>

    </div>
  );
}