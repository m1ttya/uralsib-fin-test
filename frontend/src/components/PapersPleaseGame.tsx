import React, { useState, useEffect, useCallback } from 'react';

// Типы для игры
interface Client {
  id: string;
  name: string;
  avatar: string;
  applicationType: 'deposit' | 'credit' | 'investment' | 'microloan' | 'card';
  documents: string[];
  hasFraud: boolean;
  income: number;
  rating: number; // 1-5
}

interface GameState {
  score: number;
  day: number;
  clientsProcessed: number;
  reputation: number;
  currentClient: Client | null;
  queue: Client[];
  timeRemaining: number;
  gameStatus: 'menu' | 'loading' | 'playing' | 'gameover';
}

// Пиксельные аватары (используем emoji для простоты)
const PIXEL_AVATARS = ['👨', '👩', '👴', '👵', '🧑', '👨‍💼', '👩‍💼', '👨‍🔧', '👩‍🎓', '👨‍🎨'];

// Генерация случайных клиентов
const generateClient = (id: string): Client => {
  const types: Client['applicationType'][] = ['deposit', 'credit', 'investment', 'microloan', 'card'];
  const type = types[Math.floor(Math.random() * types.length)];
  const hasFraud = Math.random() < 0.15; // 15% мошенников

  return {
    id,
    name: `Клиент #${id}`,
    avatar: PIXEL_AVATARS[Math.floor(Math.random() * PIXEL_AVATARS.length)],
    applicationType: type,
    documents: ['Паспорт', 'Справка о доходах', 'Заявление'],
    hasFraud,
    income: Math.floor(Math.random() * 150000) + 30000,
    rating: Math.floor(Math.random() * 5) + 1,
  };
};

// Проверка заявки
const validateApplication = (client: Client, decision: 'approve' | 'reject'): {
  correct: boolean;
  points: number;
  reason?: string;
} => {
  const isFraudulent = client.hasFraud;
  const isLowRating = client.rating <= 2;
  const income = client.income;
  const type = client.applicationType;

  // Логика проверки
  if (isFraudulent) {
    // Мошенника нужно отклонять
    if (decision === 'reject') {
      return { correct: true, points: 10 };
    } else {
      return { correct: false, points: -20, reason: 'Обнаружены признаки мошенничества!' };
    }
  }

  if (isLowRating) {
    // Низкий рейтинг - рискованно
    if (decision === 'reject') {
      return { correct: true, points: 5 };
    } else {
      return { correct: true, points: 2 };
    }
  }

  if (type === 'microloan' && income < 50000) {
    // Микрозайм при низком доходе
    if (decision === 'reject') {
      return { correct: true, points: 8 };
    } else {
      return { correct: false, points: -15, reason: 'Микрозайм при низком доходе - высокий риск!' };
    }
  }

  if (income > 100000) {
    // Хороший доход - одобряем
    if (decision === 'approve') {
      return { correct: true, points: 8 };
    } else {
      return { correct: false, points: -10, reason: 'Клиент с хорошим доходом - упущенная выгода!' };
    }
  }

  // Нейтральный случай
  if (decision === 'approve') {
    return { correct: true, points: 5 };
  } else {
    return { correct: true, points: 3 };
  }
};

const PapersPleaseGame: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    day: 1,
    clientsProcessed: 0,
    reputation: 100,
    currentClient: null,
    queue: [],
    timeRemaining: 300, // 5 минут на день
    gameStatus: 'menu',
  });

  const [feedback, setFeedback] = useState<{message: string, points: number, type: 'success' | 'error' } | null>(null);
  const [savedScrollPosition, setSavedScrollPosition] = useState<number>(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 475);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 475);
    };
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Инициализация нового дня
  const startNewDay = useCallback(() => {
    const newQueue: Client[] = [];
    for (let i = 0; i < 5; i++) {
      newQueue.push(generateClient(`${gameState.day}-${i}`));
    }

    setGameState(prev => ({
      ...prev,
      currentClient: newQueue[0],
      queue: newQueue.slice(1),
      timeRemaining: 300,
      gameStatus: 'playing',
    }));
  }, [gameState.day]);

  // Начало игры
  const startGame = () => {
    // Сохраняем текущую позицию скролла
    setSavedScrollPosition(window.scrollY);

    // Плавное расширение - задержка для анимации (только на мобильных)
    const delay = isMobile ? 300 : 0;

    setTimeout(() => {
      setGameState({
        score: 0,
        day: 1,
        clientsProcessed: 0,
        reputation: 100,
        currentClient: null,
        queue: [],
        timeRemaining: 300,
        gameStatus: 'loading',
      });

      // Активируем полноэкранный режим только после нажатия START
      if (isMobile) {
        setIsFullscreen(true);
      }

      // Показываем экран загрузки на 3 секунды
      setTimeout(() => {
        startNewDay();
      }, 3000);
    }, delay);
  };

  // Выход из игры
  const exitGame = () => {
    // Небольшая задержка для плавного выхода
    setTimeout(() => {
      setGameState({
        score: 0,
        day: 1,
        clientsProcessed: 0,
        reputation: 100,
        currentClient: null,
        queue: [],
        timeRemaining: 300,
        gameStatus: 'menu',
      });
      setFeedback(null);
      // Выход из полноэкранного режима
      setIsFullscreen(false);
      // Восстанавливаем сохраненную позицию скролла с небольшой корректировкой
      // для точного позиционирования
      requestAnimationFrame(() => {
        window.scrollTo({ top: savedScrollPosition, behavior: 'instant' });
        // Дополнительная корректировка через один кадр для надежности
        requestAnimationFrame(() => {
          window.scrollTo({ top: savedScrollPosition, behavior: 'instant' });
        });
      });
    }, 200);
  };

  // Обработка решения
  const handleDecision = (dec: 'approve' | 'reject') => {
    if (!gameState.currentClient || gameState.gameStatus !== 'playing') return;

    const result = validateApplication(gameState.currentClient, dec);

    setFeedback({
      message: result.correct
        ? `✅ Правильно! +${result.points} очков`
        : `❌ Неверно! ${result.reason} (${result.points})`,
      points: result.points,
      type: result.correct ? 'success' : 'error'
    });

    setGameState(prev => ({
      ...prev,
      score: Math.max(0, prev.score + result.points),
      reputation: Math.max(0, Math.min(100, prev.reputation + (result.correct ? 2 : -5))),
      clientsProcessed: prev.clientsProcessed + 1,
    }));

    // Переход к следующему клиенту через 1.5 секунды
    setTimeout(() => {
      setFeedback(null);

      if (gameState.queue.length > 0) {
        setGameState(prev => ({
          ...prev,
          currentClient: prev.queue[0],
          queue: prev.queue.slice(1),
        }));
      } else {
        // День завершен
        setGameState(prev => ({
          ...prev,
          day: prev.day + 1,
          gameStatus: 'menu',
        }));
      }
    }, 1500);
  };

  // Таймер
  useEffect(() => {
    if (gameState.gameStatus === 'playing' && gameState.timeRemaining > 0) {
      const timer = setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          timeRemaining: prev.timeRemaining - 1,
        }));
      }, 1000);

      return () => clearTimeout(timer);
    } else if (gameState.timeRemaining === 0 && gameState.gameStatus === 'playing') {
      // Время вышло
      setGameState(prev => ({
        ...prev,
        gameStatus: 'gameover',
      }));
    }
  }, [gameState.timeRemaining, gameState.gameStatus]);

  // Форматирование времени
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Игровое окно - пиксельная стилистика */}
      {gameState.gameStatus === 'menu' && gameState.clientsProcessed === 0 && (
        <div
          className="game-window"
          style={{
            position: 'relative', // Always embedded in the page, not fullscreen
            width: '100%',
            maxWidth: '1000px',
            margin: '0 auto',
          }}
        >
          <style>{`
            .game-window {
              width: 100%;
              max-width: 1000px;
              margin: 0 auto;
              background: #d6c8a9;
              border: 4px solid #000;
              box-shadow: 0 0 0 4px #8b7355, 0 0 0 8px #000;
              overflow: hidden;
              min-height: 560px;
              image-rendering: pixelated;
            }

            @media (max-width: 475px) {
              .game-window {
                min-height: 400px;
              }
            }
          `}</style>
          {/* Главное меню - пиксельная стилистика */}
          <div className="game-menu">
            <style>{`
              .game-menu {
                padding: 60px 40px;
                text-align: center;
                min-height: 560px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                background: #d6c8a9;
                border: 3px solid #000;
              }

              @media (max-width: 475px) {
                .game-menu {
                  padding: 20px 12px;
                  min-height: 400px;
                }
              }

              @media (max-width: 640px) and (min-width: 476px) {
                .game-menu {
                  padding: 40px 24px;
                }
              }
            `}</style>
            <div className="menu-header">
              <style>{`
                .menu-header {
                  background: #e8d9b5;
                  border: 3px solid #000;
                  padding: 32px;
                  margin-bottom: 32px;
                  box-shadow: inset 0 0 0 3px #8b7355;
                }

                @media (max-width: 475px) {
                  .menu-header {
                    padding: 16px 12px;
                    margin-bottom: 16px;
                  }
                }

                @media (max-width: 640px) and (min-width: 476px) {
                  .menu-header {
                    padding: 24px 20px;
                  }
                }
              `}</style>
              <h1 className="menu-title">
                🏦 КРЕДИТНЫЙ ИНСПЕКТОР
              </h1>
              <style>{`
                .menu-title {
                  margin: 0 0 12px 0;
                  font-size: 32px;
                  font-weight: bold;
                  color: #000;
                  letter-spacing: 2px;
                  font-family: "Press Start 2P", monospace;
                  text-transform: uppercase;
                  image-rendering: pixelated;
                }

                @media (max-width: 475px) {
                  .menu-title {
                    font-size: 16px;
                    margin-bottom: 6px;
                  }
                }

                @media (max-width: 640px) and (min-width: 476px) {
                  .menu-title {
                    font-size: 24px;
                  }
                }
              `}</style>
              <div className="menu-subtitle">
                BUREAU OF CREDIT EVALUATION
              </div>
              <style>{`
                .menu-subtitle {
                  font-size: 12px;
                  color: #000;
                  font-family: "Press Start 2P", monospace;
                  text-transform: uppercase;
                  letter-spacing: 1px;
                  image-rendering: pixelated;
                }

                @media (max-width: 475px) {
                  .menu-subtitle {
                    font-size: 8px;
                  }
                }

                @media (max-width: 640px) and (min-width: 476px) {
                  .menu-subtitle {
                    font-size: 10px;
                  }
                }
              `}</style>
            </div>

            <div className="menu-instruction">
              <style>{`
                .menu-instruction {
                  margin-bottom: 32px;
                  padding: 24px;
                  background: #c0b08a;
                  border: 3px solid #000;
                  max-width: 600px;
                  margin-left: auto;
                  margin-right: auto;
                  margin-bottom: 32px;
                  box-shadow: inset 0 0 0 2px #8b7355;
                }

                @media (max-width: 475px) {
                  .menu-instruction {
                    padding: 16px;
                    margin-bottom: 24px;
                  }
                }
              `}</style>
              <p className="instruction-title">
                [ ИНСТРУКЦИЯ ]
              </p>
              <style>{`
                .instruction-title {
                  margin: 0 0 16px 0;
                  font-size: 16px;
                  color: #000;
                  font-family: "Press Start 2P", monospace;
                  font-weight: bold;
                  image-rendering: pixelated;
                }

                @media (max-width: 475px) {
                  .instruction-title {
                    font-size: 11px;
                    margin-bottom: 10px;
                  }
                }

                @media (max-width: 640px) and (min-width: 476px) {
                  .instruction-title {
                    font-size: 14px;
                  }
                }
              `}</style>
              <p className="instruction-text">
                Изучайте документы клиентов<br/>
                Нажимайте APPROVE или DENY<br/>
                Выявляйте мошенников и защищайте банк<br/>
                Зарабатывайте очки репутации
              </p>
              <style>{`
                .instruction-text {
                  margin: 0;
                  font-size: 13px;
                  color: #000;
                  font-family: "Press Start 2P", monospace;
                  line-height: 1.6;
                  image-rendering: pixelated;
                  text-align: left;
                }

                @media (max-width: 475px) {
                  .instruction-text {
                    font-size: 9px;
                    line-height: 1.4;
                  }
                }

                @media (max-width: 640px) and (min-width: 476px) {
                  .instruction-text {
                    font-size: 11px;
                  }
                }
              `}</style>
            </div>

            <button
              onClick={startGame}
              className="start-button"
            >
              [ START ]
            </button>
            <style>{`
              .start-button {
                padding: 20px 60px;
                background: #4a7c59;
                border: 4px solid #000;
                color: #fff;
                font-size: 18px;
                font-weight: bold;
                cursor: pointer;
                font-family: "Press Start 2P", monospace;
                text-transform: uppercase;
                letter-spacing: 2px;
                image-rendering: pixelated;
                box-shadow: inset -4px -4px 0 #2d4a35, inset 4px 4px 0 #6ba37a, 4px 4px 0 #000;
              }

              .start-button:hover {
                background: #5a8c69;
              }

              @media (max-width: 475px) {
                .start-button {
                  padding: 14px 32px;
                  font-size: 12px;
                  width: 90%;
                  max-width: 280px;
                  display: block;
                  margin-left: auto;
                  margin-right: auto;
                }
              }

              @media (max-width: 640px) and (min-width: 476px) {
                .start-button {
                  padding: 18px 50px;
                  font-size: 16px;
                }
              }
            `}</style>
          </div>
        </div>
      )}

      {/* Экран загрузки - пиксельная стилистика */}
      {gameState.gameStatus === 'loading' && (
        <div
          className="game-window"
          style={{
            position: isFullscreen ? 'fixed' : 'relative',
            top: isFullscreen ? '0' : undefined,
            left: isFullscreen ? '0' : undefined,
            width: isFullscreen ? '100vw' : '100%',
            height: isFullscreen ? '100vh' : 'auto',
            margin: '0 auto',
            maxWidth: '1000px',
            borderWidth: '4px',
            boxShadow: isFullscreen ? '0 0 0 4px #8b7355, 0 0 0 8px #000' : '0 0 0 4px #8b7355, 0 0 0 8px #000',
            zIndex: isFullscreen ? 9999 : 'auto',
            minHeight: '560px',
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <style>{`
            .game-window {
              width: 100%;
              max-width: 1000px;
              margin: 0 auto;
              background: #d6c8a9;
              border: 4px solid #000;
              box-shadow: 0 0 0 4px #8b7355, 0 0 0 8px #000;
              overflow: hidden;
              min-height: 560px;
              image-rendering: pixelated;
            }

            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: scale(0.95);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }
          `}</style>
          <div className="game-menu">
            <style>{`
              .game-menu {
                padding: 60px 40px;
                text-align: center;
                min-height: 560px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                background: #d6c8a9;
                border: 3px solid #000;
              }

              @media (max-width: 475px) {
                .game-menu {
                  padding: 32px 16px;
                  min-height: 100vh;
                }
              }

              @media (max-width: 640px) and (min-width: 476px) {
                .game-menu {
                  padding: 40px 24px;
                }
              }
            `}</style>
            <div className="loading-box">
              <style>{`
                .loading-box {
                  background: #e8d9b5;
                  border: 4px solid #000;
                  padding: 48px;
                  margin-bottom: 32px;
                  box-shadow: inset 0 0 0 3px #8b7355;
                  max-width: 90vw;
                }
                @media (max-width: 475px) {
                  .loading-box {
                    padding: 32px 24px;
                    margin-bottom: 24px;
                  }
                }
              `}</style>
              <h2 style={{
                margin: '0 0 32px 0',
                fontSize: '24px',
                color: '#000',
                fontFamily: '"Press Start 2P", monospace',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                imageRendering: 'pixelated',
              }}>
                ЗАГРУЗКА...
              </h2>

              {/* Анимированные точки */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '12px',
              }}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: '16px',
                      height: '16px',
                      background: '#4a7c59',
                      border: '3px solid #000',
                      imageRendering: 'pixelated',
                      animation: `loadingDot 1s ease-in-out ${i * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>

            <p style={{
              margin: '0',
              fontSize: '14px',
              color: '#000',
              fontFamily: 'VT323, monospace',
              imageRendering: 'pixelated',
            }}>
              Инициализация систем проверки...
            </p>
            <style>{`
              @media (max-width: 475px) {
                div + p {
                  font-size: 12px !important;
                }
              }
            `}</style>
          </div>
        </div>
      )}

      {/* Игровой интерфейс - пиксельная стилистика */}
      {gameState.gameStatus === 'playing' && gameState.currentClient && (
        <div
          className="game-window"
          style={{
            position: isFullscreen ? 'fixed' : 'relative',
            top: isFullscreen ? '0' : undefined,
            left: isFullscreen ? '0' : undefined,
            width: isFullscreen ? '100vw' : '100%',
            height: isFullscreen ? '100vh' : 'auto',
            margin: '0 auto',
            maxWidth: '1000px',
            borderWidth: '4px',
            boxShadow: '0 0 0 4px #8b7355, 0 0 0 8px #000',
            zIndex: isFullscreen ? 9999 : 'auto',
            minHeight: '560px',
          }}
        >
          <style>{`
            .game-window {
              width: 100%;
              max-width: 1000px;
              margin: 0 auto;
              background: #d6c8a9;
              border: 4px solid #000;
              box-shadow: 0 0 0 4px #8b7355, 0 0 0 8px #000;
              overflow: hidden;
              min-height: 560px;
              image-rendering: pixelated;
            }
          `}</style>
            {/* Шапка */}
            <div className="game-header">
              <style>{`
                .game-header {
                  padding: 20px;
                  background: #4a7c59;
                  border-bottom: 4px solid #000;
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  padding-top: 24px;
                }

                @media (max-width: 475px) {
                  .game-header {
                    padding: 12px;
                    padding-top: 16px;
                    flex-direction: column;
                    gap: 8px;
                  }
                }

                @media (max-width: 640px) and (min-width: 476px) {
                  .game-header {
                    padding: 16px;
                    padding-top: 20px;
                  }
                }
              `}</style>
              <div style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#fff',
                fontFamily: '"Press Start 2P", monospace',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                imageRendering: 'pixelated',
              }}>
                ДЕНЬ {gameState.day}
              </div>
              <div style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
              }}>
                <div style={{
                  padding: '12px 16px',
                  background: '#3a6c49',
                  border: '3px solid #000',
                  fontSize: '14px',
                  color: '#fff',
                  fontFamily: 'Pixel Cyr, monospace',
                  fontWeight: 'bold',
                  imageRendering: 'pixelated',
                }}>
                  TIME: {formatTime(gameState.timeRemaining)}
                </div>
                <div style={{
                  padding: '12px 16px',
                  background: '#3a6c49',
                  border: '3px solid #000',
                  fontSize: '14px',
                  color: '#fff',
                  fontFamily: 'Pixel Cyr, monospace',
                  fontWeight: 'bold',
                  imageRendering: 'pixelated',
                }}>
                  SCORE: {gameState.score}
                </div>
                <div style={{
                  padding: '12px 16px',
                  background: '#3a6c49',
                  border: '3px solid #000',
                  fontSize: '14px',
                  color: '#fff',
                  fontFamily: 'Pixel Cyr, monospace',
                  fontWeight: 'bold',
                  imageRendering: 'pixelated',
                }}>
                  REP: {gameState.reputation}
                </div>
                {/* Кнопка выхода */}
                <button
                  onClick={exitGame}
                  className="exit-button"
                >
                  ✕
                </button>
                <style>{`
                  .exit-button {
                    padding: 10px 16px;
                    background: #a03c3c;
                    border: 3px solid #000;
                    color: #fff;
                    font-size: 14px;
                    font-family: "Press Start 2P", monospace;
                    font-weight: bold;
                    cursor: pointer;
                    image-rendering: pixelated;
                    box-shadow: inset -3px -3px 0 #7a2d2d, inset 3px 3px 0 #c55555, 3px 3px 0 #000;
                    transition: background 0.1s ease;
                  }

                  .exit-button:hover {
                    background: #b44444;
                  }

                  @media (max-width: 475px) {
                    .exit-button {
                      padding: 12px;
                      font-size: 16px;
                      aspect-ratio: 1;
                      width: 100%;
                      max-width: 56px;
                    }
                  }

                  @media (max-width: 640px) and (min-width: 476px) {
                    .exit-button {
                      padding: 10px 16px;
                    }
                  }
                `}</style>
              </div>
            </div>

            {/* Основная область - пиксельная стилистика */}
            <div className="game-main-area">
              <style>{`
                .game-main-area {
                  padding: 32px;
                  display: flex;
                  gap: 24px;
                  min-height: 440px;
                  background: #d6c8a9;
                }

                @media (max-width: 475px) {
                  .game-main-area {
                    padding: 16px;
                    flex-direction: column;
                    gap: 16px;
                    min-height: auto;
                  }
                }

                @media (max-width: 640px) and (min-width: 476px) {
                  .game-main-area {
                    padding: 24px;
                    flex-direction: column;
                    gap: 20px;
                  }
                }
              `}</style>
              {/* Документы клиента */}
              <div style={{
                flex: 1,
                background: '#f0e5d0',
                border: '4px solid #000',
                padding: '24px',
                boxShadow: 'inset 0 0 0 2px #8b7355',
              }}>
                <div style={{
                  textAlign: 'center',
                  marginBottom: '20px',
                  background: '#e8d9b5',
                  border: '3px solid #000',
                  padding: '20px',
                  boxShadow: 'inset 0 0 0 2px #8b7355',
                }}>
                  <div style={{
                    fontSize: '64px',
                    marginBottom: '8px',
                    imageRendering: 'pixelated',
                  }}>
                    {gameState.currentClient.avatar}
                  </div>
                  <h2 style={{
                    margin: '0 0 8px 0',
                    fontSize: '18px',
                    color: '#000',
                    fontFamily: '"Press Start 2P", monospace',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    imageRendering: 'pixelated',
                  }}>
                    ЗАЯВЛЕНИЕ №{gameState.currentClient.id}
                  </h2>
                  <p style={{
                    margin: '0',
                    fontSize: '12px',
                    color: '#000',
                    fontFamily: 'Pixel Cyr, monospace',
                    imageRendering: 'pixelated',
                    textTransform: 'uppercase',
                  }}>
                    Тип: {
                      gameState.currentClient.applicationType === 'deposit' ? 'ВКЛАД' :
                      gameState.currentClient.applicationType === 'credit' ? 'КРЕДИТ' :
                      gameState.currentClient.applicationType === 'investment' ? 'ИНВЕСТИЦИИ' :
                      gameState.currentClient.applicationType === 'microloan' ? 'МИКРОЗАЙМ' :
                      'КАРТА'
                    }
                  </p>
                </div>

                {/* Документы */}
                <div style={{
                  marginTop: '20px',
                }}>
                  <h3 style={{
                    margin: '0 0 12px 0',
                    fontSize: '14px',
                    color: '#000',
                    fontFamily: '"Press Start 2P", monospace',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    imageRendering: 'pixelated',
                  }}>
                    [ ДОКУМЕНТЫ ]:
                  </h3>
                  {gameState.currentClient.documents.map((doc, idx) => (
                    <div key={idx} style={{
                      padding: '12px',
                      background: '#fff',
                      border: '2px solid #000',
                      marginBottom: '6px',
                      fontSize: '12px',
                      color: '#000',
                      fontFamily: 'Pixel Cyr, monospace',
                      imageRendering: 'pixelated',
                      boxShadow: '2px 2px 0 #8b7355',
                    }}>
                      {doc}
                    </div>
                  ))}
                </div>

                {/* Информация о клиенте */}
                <div style={{
                  marginTop: '20px',
                  padding: '16px',
                  background: '#c0b08a',
                  border: '3px solid #000',
                }}>
                  <div style={{
                    fontSize: '13px',
                    color: '#000',
                    fontFamily: 'Pixel Cyr, monospace',
                    lineHeight: '1.8',
                    imageRendering: 'pixelated',
                  }}>
                    <div style={{ marginBottom: '6px' }}>
                      Доход: <strong>{gameState.currentClient.income.toLocaleString()} РУБ/МЕС</strong>
                    </div>
                    <div style={{ marginBottom: '6px' }}>
                      Рейтинг: <strong>{gameState.currentClient.rating}/5</strong>
                    </div>
                    <div>
                      Статус: {
                        gameState.currentClient.hasFraud ? (
                          <span style={{ color: '#c41e3a', fontWeight: 'bold' }}>[ ПОДОЗРИТЕЛЬНО! ]</span>
                        ) : (
                          <span style={{ color: '#2d5016', fontWeight: 'bold' }}>[ НОРМАЛЬНО ]</span>
                        )
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* Панель решений - пиксельная стилистика */}
              <div className="decision-panel">
                <style>{`
                  .decision-panel {
                    width: 300px;
                    background: #f0e5d0;
                    border: 4px solid #000;
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    box-shadow: inset 0 0 0 2px #8b7355;
                  }

                  @media (max-width: 475px) {
                    .decision-panel {
                      width: 100%;
                      padding: 16px;
                      gap: 12px;
                    }
                  }

                  @media (max-width: 640px) and (min-width: 476px) {
                    .decision-panel {
                      width: 100%;
                      padding: 20px;
                    }
                  }
                `}</style>
                <h3 className="decision-title">
                  [ РЕШЕНИЕ ]
                </h3>
                <style>{`
                  .decision-title {
                    margin: 0 0 16px 0;
                    font-size: 16px;
                    color: #000;
                    font-family: "Press Start 2P", monospace;
                    font-weight: bold;
                    text-transform: uppercase;
                    text-align: center;
                    image-rendering: pixelated;
                  }

                  @media (max-width: 475px) {
                    .decision-title {
                      font-size: 14px;
                      margin-bottom: 12px;
                    }
                  }
                `}</style>

                <button
                  onClick={() => handleDecision('approve')}
                  disabled={!!feedback}
                  className="decision-button approve-button"
                >
                  APPROVE
                </button>
                <style>{`
                  .decision-button {
                    flex: 1;
                    padding: 20px;
                    border: 4px solid #000;
                    color: #fff;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    font-family: "Press Start 2P", monospace;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    image-rendering: pixelated;
                    box-shadow: inset -4px -4px 0 rgba(0,0,0,0.3), inset 4px 4px 0 rgba(255,255,255,0.3), 4px 4px 0 #000;
                  }

                  @media (max-width: 475px) {
                    .decision-button {
                      padding: 20px 16px;
                      font-size: 14px;
                    }
                  }

                  .approve-button {
                    background: #4a7c59;
                  }

                  .approve-button:hover:not(:disabled) {
                    background: #5a8c69;
                  }
                `}</style>

                <button
                  onClick={() => handleDecision('reject')}
                  disabled={!!feedback}
                  className="decision-button deny-button"
                >
                  DENY
                </button>
                <style>{`
                  .deny-button {
                    background: #a03c3c;
                  }

                  .deny-button:hover:not(:disabled) {
                    background: #b44444;
                  }

                  .decision-button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                  }
                `}</style>

                {/* Обратная связь */}
                {feedback && (
                  <div style={{
                    marginTop: '8px',
                    padding: '16px',
                    background: feedback.type === 'success' ? '#4a7c59' : '#a03c3c',
                    border: '3px solid #000',
                    textAlign: 'center',
                    fontSize: '13px',
                    color: '#fff',
                    fontFamily: '"Press Start 2P", monospace',
                    fontWeight: 'bold',
                    imageRendering: 'pixelated',
                    boxShadow: 'inset 0 0 0 2px #2d4a35',
                  }}>
                    {feedback.message}
                  </div>
                )}
              </div>
            </div>

            {/* Прогресс - пиксельная стилистика */}
            <div style={{
              padding: '20px',
              background: '#4a7c59',
              borderTop: '4px solid #000',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
              }}>
                <span style={{
                  fontSize: '13px',
                  color: '#fff',
                  fontFamily: '"Press Start 2P", monospace',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  imageRendering: 'pixelated',
                }}>
                  ПРОГРЕСС:
                </span>
                <span style={{
                  fontSize: '14px',
                  color: '#fff',
                  fontFamily: '"Press Start 2P", monospace',
                  fontWeight: 'bold',
                  imageRendering: 'pixelated',
                }}>
                  {gameState.clientsProcessed}/5
                </span>
              </div>
              <div style={{
                height: '20px',
                background: '#3a6c49',
                border: '3px solid #000',
                position: 'relative',
              }}>
                <div style={{
                  height: '100%',
                  width: `${(gameState.clientsProcessed % 5) * 20}%`,
                  background: '#2d5016',
                  transition: 'none',
                }} />
              </div>
            </div>
        </div>
      )}

      {/* Итоги дня - пиксельная стилистика */}
      {gameState.gameStatus === 'menu' && gameState.clientsProcessed > 0 && (
        <div style={{
          width: '100%',
          maxWidth: '1000px',
          margin: '0 auto',
          background: '#d6c8a9',
          border: '4px solid #000',
          boxShadow: '0 0 0 4px #8b7355, 0 0 0 8px #000',
          overflow: 'hidden',
          minHeight: '560px',
          imageRendering: 'pixelated',
        }}>
          <div style={{
            padding: '60px 40px',
            textAlign: 'center',
            minHeight: '560px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            background: '#d6c8a9',
            border: '3px solid #000',
          }}>
            <div style={{
              background: '#e8d9b5',
              border: '4px solid #000',
              padding: '40px',
              marginBottom: '32px',
              boxShadow: 'inset 0 0 0 3px #8b7355',
            }}>
              <h2 style={{
                margin: '0 0 24px 0',
                fontSize: '28px',
                color: '#000',
                fontFamily: '"Press Start 2P", monospace',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                imageRendering: 'pixelated',
              }}>
                ДЕНЬ {gameState.day - 1} ЗАВЕРШЕН!
              </h2>

            <div style={{
              padding: '24px',
              background: '#c0b08a',
              border: '4px solid #000',
              maxWidth: '500px',
              marginLeft: 'auto',
              marginRight: 'auto',
              marginBottom: '24px',
              boxShadow: 'inset 0 0 0 2px #8b7355',
            }}>
              <div style={{
                fontSize: '14px',
                color: '#000',
                fontFamily: 'Pixel Cyr, monospace',
                lineHeight: '2',
                imageRendering: 'pixelated',
                textAlign: 'left',
              }}>
                SCORE: <strong>{gameState.score}</strong><br/>
                REP: <strong>{gameState.reputation}</strong><br/>
                CLIENTS: <strong>{gameState.clientsProcessed}</strong>
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '16px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}>
              <button
                onClick={startNewDay}
                style={{
                  padding: '16px 48px',
                  background: '#4a7c59',
                  border: '4px solid #000',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontFamily: '"Press Start 2P", monospace',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  imageRendering: 'pixelated',
                  boxShadow: 'inset -4px -4px 0 #2d4a35, inset 4px 4px 0 #6ba37a, 4px 4px 0 #000',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#5a8c69';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#4a7c59';
                }}
              >
                [ СЛЕДУЮЩИЙ ДЕНЬ ]
              </button>

              <button
                onClick={() => {
                  setGameState({
                    score: 0,
                    day: 1,
                    clientsProcessed: 0,
                    reputation: 100,
                    currentClient: null,
                    queue: [],
                    timeRemaining: 300,
                    gameStatus: 'menu',
                  });
                  setIsFullscreen(false);
                }}
                style={{
                  padding: '16px 48px',
                  background: '#8b7355',
                  border: '4px solid #000',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontFamily: '"Press Start 2P", monospace',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  imageRendering: 'pixelated',
                  boxShadow: 'inset -4px -4px 0 #5c4835, inset 4px 4px 0 #a68965, 4px 4px 0 #000',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#9a8365';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#8b7355';
                }}
              >
                [ РЕСТАРТ ]
              </button>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Game Over - пиксельная стилистика */}
      {gameState.gameStatus === 'gameover' && (
        <div style={{
          width: '100%',
          maxWidth: '1000px',
          margin: '0 auto',
          background: '#d6c8a9',
          border: '4px solid #000',
          boxShadow: '0 0 0 4px #8b7355, 0 0 0 8px #000',
          overflow: 'hidden',
          minHeight: '560px',
          imageRendering: 'pixelated',
        }}>
          <div style={{
            padding: '60px 40px',
            textAlign: 'center',
            minHeight: '560px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            background: '#d6c8a9',
            border: '3px solid #000',
          }}>
            <div style={{
              background: '#e8d9b5',
              border: '4px solid #000',
              padding: '40px',
              marginBottom: '32px',
              boxShadow: 'inset 0 0 0 3px #8b7355',
            }}>
              <h2 style={{
                margin: '0 0 24px 0',
                fontSize: '32px',
                color: '#a03c3c',
                fontFamily: '"Press Start 2P", monospace',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                imageRendering: 'pixelated',
              }}>
                GAME OVER
              </h2>
              <div style={{
                fontSize: '14px',
                color: '#000',
                fontFamily: 'Pixel Cyr, monospace',
                imageRendering: 'pixelated',
              }}>
                ВРЕМЯ ВЫШЛО!
              </div>
            </div>

            <div style={{
              padding: '24px',
              background: '#c0b08a',
              border: '4px solid #000',
              maxWidth: '500px',
              marginLeft: 'auto',
              marginRight: 'auto',
              marginBottom: '32px',
              boxShadow: 'inset 0 0 0 2px #8b7355',
            }}>
              <div style={{
                fontSize: '14px',
                color: '#000',
                fontFamily: 'Pixel Cyr, monospace',
                lineHeight: '2',
                imageRendering: 'pixelated',
                textAlign: 'left',
              }}>
                ИТОГОВЫЙ SCORE: <strong>{gameState.score}</strong><br/>
                КЛИЕНТОВ ОБРАБОТАНО: <strong>{gameState.clientsProcessed}</strong>
              </div>
            </div>

            <button
              onClick={() => {
                setGameState({
                  score: 0,
                  day: 1,
                  clientsProcessed: 0,
                  reputation: 100,
                  currentClient: null,
                  queue: [],
                  timeRemaining: 300,
                  gameStatus: 'menu',
                });
                setIsFullscreen(false);
              }}
              style={{
                padding: '16px 48px',
                background: '#4a7c59',
                border: '4px solid #000',
                color: '#fff',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: '"Press Start 2P", monospace',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                imageRendering: 'pixelated',
                boxShadow: 'inset -4px -4px 0 #2d4a35, inset 4px 4px 0 #6ba37a, 4px 4px 0 #000',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#5a8c69';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = '#4a7c59';
              }}
            >
              [ ИГРАТЬ СНОВА ]
            </button>
          </div>
        </div>
        )}
    </>
  );
};

export default PapersPleaseGame;
