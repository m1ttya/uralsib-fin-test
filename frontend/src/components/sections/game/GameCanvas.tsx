import { memo, useEffect, useRef } from 'react';
import { useGameEngine } from './useGameEngine';
import { Difficulty } from './types';

interface GameCanvasProps {
  isActive: boolean;
  difficulty: Difficulty;
  onScoreChange: (score: number) => void;
  onGameOver: (finalScore: number) => void;
}

function GameCanvas({ isActive, difficulty, onScoreChange, onGameOver }: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Используем кастомный хук для игрового движка
  const { startGame, stopGame: stopEngine, restartGame } = useGameEngine({
    containerRef,
    difficulty,
    onScoreChange,
    onGameOver,
  });

  // Управление состоянием игры
  useEffect(() => {
    if (isActive) {
      startGame();
    } else {
      stopEngine();
    }

    return () => {
      stopEngine();
    };
  }, [isActive, startGame, stopEngine]);

  // Перезапуск при смене сложности
  useEffect(() => {
    if (isActive) {
      restartGame();
    }
  }, [difficulty, isActive, restartGame]);

  return (
    <div className="absolute inset-0 w-full h-full">
      {/* Контейнер только для канваса Three.js. React не управляет его дочерними узлами */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* Индикатор загрузки 3D */}
      {isActive && (
        <div className="absolute bottom-4 right-4 text-white/70 text-xs">
          3D
        </div>
      )}
    </div>
  );
}

export default memo(GameCanvas);
