import { useEffect, useRef, useState } from 'react';

interface GameUIProps {
  score: number;
  onPause: () => void;
  onRestart: () => void;
}

export default function GameUI({ score, onPause, onRestart }: GameUIProps) {
  const [showPlusOne, setShowPlusOne] = useState(false);

  const prevScoreRef = useRef(0);
  useEffect(() => {
    const prev = prevScoreRef.current;
    if (score > prev) {
      setShowPlusOne(true);
      const t = setTimeout(() => setShowPlusOne(false), 500);
      prevScoreRef.current = score;
      return () => clearTimeout(t);
    }
    prevScoreRef.current = score;
  }, [score]);

  return (
    <>
      {/* Верхняя панель с очками и кнопками */}
      <div className="absolute top-3 left-3 right-3 flex items-center z-10">
        
        {/* Счет */}
        <div className="px-4 py-2 rounded-full bg-white/90 backdrop-blur text-text shadow-lg inline-flex items-center gap-2 border border-white/60">
          <span className="text-sm font-medium font-sans">Очки:</span>
          <span className="text-lg font-bold text-primary">{score}</span>
        </div>

        {/* Кнопки справа */}
        <div className="ml-auto flex items-center gap-2">
          
          {/* Пауза */}
          <button
            onClick={onPause}
            className="p-2 rounded-full bg-white/90 text-primary shadow-lg hover:bg-white transition-all border border-white/60"
            title="Пауза"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 5h4v14H6zM14 5h4v14h-4z"/>
            </svg>
          </button>

          {/* Рестарт */}
          <button
            onClick={onRestart}
            className="p-2 rounded-full bg-white/90 text-primary shadow-lg hover:bg-white transition-all border border-white/60"
            title="Начать заново"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 5V2L7 6l5 4V7a5 5 0 11-5 5H5a7 7 0 107-7z"/>
            </svg>
          </button>
          
        </div>
      </div>

      {/* Анимация +1 */}
      {showPlusOne && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 text-success font-bold text-xl animate-bounce z-20">
          +1
        </div>
      )}

      {/* Подсказки управления */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center z-10">
        <div className="px-3 py-1 bg-modal-bg/80 text-white text-xs rounded-full backdrop-blur font-sans">
          ← → или касания для управления
        </div>
      </div>
    </>
  );
}