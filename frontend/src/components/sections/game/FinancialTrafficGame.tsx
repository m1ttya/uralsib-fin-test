import { useCallback, useState } from 'react';
import GameCanvas from './GameCanvas';
import GameUI from './GameUI';
import StartScreen from './StartScreen';
import GameOverScreen from './GameOverScreen';
import { GameState } from './types';

export default function FinancialTrafficGame() {
  const [gameState, setGameState] = useState<GameState>('start');
  const [score, setScore] = useState(0);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const handleStartGame = useCallback(() => {
    setScore(0);
    setGameState('playing');
  }, []);

  const handleGameOver = useCallback((finalScore: number) => {
    setScore(finalScore);
    setGameState('gameOver');
  }, []);

  const handleRestart = useCallback(() => {
    setScore(0);
    setGameState('playing');
  }, []);

  const handleBackToMenu = useCallback(() => {
    setScore(0);
    setGameState('start');
  }, []);

  return (
    <section id="game" className="py-10 md:py-16 scroll-mt-24">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="relative">
          <div className="relative w-full rounded-2xl border border-white/10 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.2)]" style={{height: 460, background: 'linear-gradient(135deg, rgba(59,23,92,0.95) 0%, rgba(106,46,143,0.85) 100%)', backdropFilter: 'blur(10px)'}}>
            
            {/* Игровое полотно - всегда рендерим для инициализации */}
            <GameCanvas 
              isActive={gameState === 'playing'}
              difficulty={difficulty}
              onScoreChange={setScore}
              onGameOver={handleGameOver}
            />

            {/* Стартовый экран */}
            {gameState === 'start' && (
              <StartScreen 
                onStart={handleStartGame}
                difficulty={difficulty}
                onDifficultyChange={setDifficulty}
              />
            )}

            {/* Игровой интерфейс */}
            {gameState === 'playing' && (
              <GameUI 
                score={score}
                onPause={() => setGameState('paused')}
                onRestart={handleRestart}
              />
            )}

            {/* Экран окончания игры */}
            {gameState === 'gameOver' && (
              <GameOverScreen 
                score={score}
                onRestart={handleRestart}
                onBackToMenu={handleBackToMenu}
              />
            )}

            {/* Пауза */}
            {gameState === 'paused' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-20">
                <div className="text-2xl md:text-3xl font-bold text-white mb-4 drop-shadow-lg">Пауза</div>
                <div className="mb-8 text-white/90 font-sans drop-shadow">Игра приостановлена</div>
                <div className="flex flex-col gap-4 w-[min(320px,90%)]">
                  <button 
                    onClick={() => setGameState('playing')} 
                    className="px-8 py-4 rounded-xl text-primary font-bold shadow-xl bg-white hover:bg-gray-50 transition-all duration-300 hover:scale-105"
                  >
                    Продолжить
                  </button>
                  <button 
                    onClick={handleBackToMenu} 
                    className="px-8 py-4 rounded-xl bg-white/20 text-white font-bold border border-white/30 hover:bg-white/30 transition-all backdrop-blur-md"
                  >
                    Выход в меню
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </section>
  );
}