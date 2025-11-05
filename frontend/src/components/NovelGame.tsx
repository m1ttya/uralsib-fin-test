import React, { useState, useEffect } from 'react';

// Типы для визуальной новеллы
interface Character {
  id: string;
  name: string;
  avatar: string; // SVG или emoji
  color: string;
}

interface Choice {
  text: string;
  points: number; // Очки репутации
  nextScene?: string;
}

interface Scene {
  id: string;
  text: string;
  character?: string;
  background?: string;
  choices?: Choice[];
  onComplete?: (points: number) => void;
}

interface GameState {
  currentScene: string;
  reputation: number;
  chapter: number;
  scenes: Record<string, Scene>;
}

// Данные игры - 4 главы
const GAME_DATA: GameState = {
  currentScene: 'intro',
  reputation: 0,
  chapter: 1,
  scenes: {
    // ===== ГЛАВА 1: ПЕРВЫЙ ВКЛАД =====
    intro: {
      id: 'intro',
      text: 'Добро пожаловать в мир финансов! Вы - молодой специалист, который только начинает изучать банковское дело. Сегодня вам предстоит сделать свой первый крупный вклад и выбрать банк.',
      background: 'bank',
      choices: [
        { text: 'Посмотреть банки с государственным участием', points: 2, nextScene: 'bank1_success' },
        { text: 'Выбрать банк с максимальной процентной ставкой', points: -1, nextScene: 'bank1_risky' },
        { text: 'Открыть счет в знакомом банке родителей', points: 0, nextScene: 'bank1_normal' },
      ],
    },
    bank1_success: {
      id: 'bank1_success',
      text: '✅ Отличный выбор! Государственные банки имеют государственное страхование вкладов до 1,4 млн рублей. Ваши деньги в безопасности!',
      character: 'system',
      choices: [
        { text: 'Продолжить', points: 0, nextScene: 'chapter1_end' },
      ],
    },
    bank1_risky: {
      id: 'bank1_risky',
      text: '⚠️ Опасно! Высокая процентная ставка часто означает высокие риски. Некоторые банки могут не иметь лицензии или быть мошенническими.',
      character: 'system',
      choices: [
        { text: 'Понять ошибку и выбрать надежный банк', points: 1, nextScene: 'bank1_success' },
      ],
    },
    bank1_normal: {
      id: 'bank1_normal',
      text: '👍 Неплохо! Знакомый банк - это удобно, но не всегда выгодно. Важно сравнивать условия разных банков.',
      character: 'system',
      choices: [
        { text: 'Продолжить', points: 0, nextScene: 'chapter1_end' },
      ],
    },
    chapter1_end: {
      id: 'chapter1_end',
      text: 'Глава 1 завершена! Вы сделали свой первый вклад и узнали о важности выбора надежного банка. Продолжайте изучать финансы!',
      character: 'system',
      choices: [
        { text: 'Перейти к главе 2: Семейный бюджет', points: 0, nextScene: 'chapter2_intro' },
      ],
    },

    // ===== ГЛАВА 2: КРИЗИС И ДОЛГИ =====
    chapter2_intro: {
      id: 'chapter2_intro',
      text: '💳 Через полгода у вас возникли финансовые трудности - срочно нужны 80 000 рублей на лечение мамы. Зарплата только через две недели. Что делать?',
      character: 'worried',
      background: 'office',
      choices: [
        {
          text: 'Взять микрозайм - быстро и без справок',
          points: -2,
          nextScene: 'woman_wise',
        },
        {
          text: 'Оформить кредитную карту с льготным периодом',
          points: 2,
          nextScene: 'woman_card',
        },
        {
          text: 'Обратиться в банк за потребительским кредитом',
          points: 2,
          nextScene: 'woman_bad',
        },
      ],
    },
    woman_wise: {
      id: 'woman_wise',
      text: '⚠️ Берете микрозайм 80 000 ₽ под 1% в день. Через месяц сумма вырастает до 104 000 ₽, а через три - уже 152 000 ₽! Нужно срочно что-то предпринимать!',
      character: 'worried',
      choices: [
        { text: 'Попытаться погасить долг', points: 0, nextScene: 'chapter2_success' },
      ],
    },
    woman_card: {
      id: 'woman_card',
      text: '✅ Отличное решение! Кредитная карта с льготным периодом 100 дней. За это время вы спокойно погасите долг без процентов. Кризис пройден, мама здорова!',
      character: 'player',
      choices: [
        { text: 'Продолжить', points: 0, nextScene: 'chapter2_success' },
      ],
    },
    woman_bad: {
      id: 'woman_bad',
      text: '✅ Банк одобрил кредит под 18% годовых. Это дороже карты, но намного безопаснее микрозайма. Зато есть время на лечение и можно спокойно восстановить финансы.',
      character: 'player',
      choices: [
        { text: 'Продолжить', points: 0, nextScene: 'chapter2_success' },
      ],
    },
    chapter2_success: {
      id: 'chapter2_success',
      text: 'Глава 2 завершена. Вы научились различать финансовые продукты и избежали долговой ямы!',
      character: 'system',
      choices: [
        { text: 'Перейти к главе 3: Накопления', points: 0, nextScene: 'chapter3_intro' },
      ],
    },

    // ===== ГЛАВА 3: НАКОПЛЕНИЯ =====
    chapter3_intro: {
      id: 'chapter3_intro',
      text: '📈 Прошло два года. У вас стабильная работа и появились свободные 300 000 рублей. Хотите их приумножить, но не знаете как. Куда инвестировать?',
      character: 'player',
      background: 'office',
      choices: [
        {
          text: 'Положить всё на банковский депозит под 8% годовых',
          points: 1,
          nextScene: 'invest_deposit',
        },
        {
          text: 'Вложить в ПИФы (паевые инвестиционные фонды)',
          points: 2,
          nextScene: 'invest_wise',
        },
        {
          text: 'Купить криптовалюту - она растет быстрее всего!',
          points: -2,
          nextScene: 'invest_bad',
        },
      ],
    },
    invest_wise: {
      id: 'invest_wise',
      text: '✅ Отличный выбор! ПИФы позволяют диверсифицировать вложения - ваши деньги распределяются по множеству акций и облигаций. Через год ваши 300 000 превращаются в 360 000!',
      character: 'success',
      choices: [
        { text: 'Продолжить', points: 0, nextScene: 'chapter3_success' },
      ],
    },
    invest_deposit: {
      id: 'invest_deposit',
      text: '✅ Надежный выбор! Депозит дает стабильный, хоть и небольшой доход. Через год у вас будет 324 000 ₽ - это больше, чем было, и никаких рисков!',
      character: 'neutral',
      choices: [
        { text: 'Продолжить', points: 0, nextScene: 'chapter3_success' },
      ],
    },
    invest_bad: {
      id: 'invest_bad',
      text: '⚠️ Рынок криптовалют обвалился! Ваши 300 000 рублей превратились в 90 000. Инвестиции в один инструмент - слишком рискованно. Нужно учиться на ошибках.',
      character: 'fail',
      choices: [
        { text: 'Извлечь урок и продолжить', points: 0, nextScene: 'chapter3_success' },
      ],
    },
    chapter3_success: {
      id: 'chapter3_success',
      text: 'Глава 3 завершена. Вы научились основам инвестирования и создали пассивный доход!',
      character: 'system',
      choices: [
        { text: 'Перейти к финальной главе: Финансовый план', points: 0, nextScene: 'final_exam' },
      ],
    },

    // ===== ФИНАЛЬНАЯ ГЛАВА: ФИНАНСОВЫЙ ПЛАН =====
    final_exam: {
      id: 'final_exam',
      text: '🏠 Теперь у вас есть стабильный доход и накопления. Пора планировать будущее! Что важнее всего для финансовой стабильности?',
      character: 'success',
      background: 'office',
      choices: [
        {
          text: 'Создать подушку безопасности на 6 месячных доходов',
          points: 3,
          nextScene: 'ending_good',
        },
        {
          text: 'Всё тратить на текущие потребности - зачем копить?',
          points: -3,
          nextScene: 'ending_bad',
        },
        {
          text: 'Взять кредит на дорогую машину - заслужил!',
          points: -1,
          nextScene: 'ending_neutral',
        },
      ],
    },
    ending_good: {
      id: 'ending_good',
      text: '🏆 Превосходно! Вы прошли путь от новичка до финансово грамотного человека. Ваш финансовый рейтинг: 8-10 очков. У вас есть подушка безопасности, правильные инвестиции и четкий план на будущее. Финансовая свобода достигнута!',
      character: 'success',
      choices: [
        { text: 'Пройти игру снова', points: 0, nextScene: 'intro' },
      ],
    },
    ending_neutral: {
      id: 'ending_neutral',
      text: '👍 Неплохой результат! Ваш рейтинг: 5-7 очков. Вы многому научились, но стоит больше внимания уделять планированию и накоплениям. Продолжайте развиваться!',
      character: 'neutral',
      choices: [
        { text: 'Попробовать лучший исход', points: 0, nextScene: 'intro' },
      ],
    },
    ending_bad: {
      id: 'ending_bad',
      text: '💭 Есть над чем работать. Ваш рейтинг: 0-4 очка. Помните: финансовая грамотность - это не только заработок, но и умение планировать, копить и инвестировать. Попробуйте еще раз!',
      character: 'fail',
      choices: [
        { text: 'Начать заново', points: 0, nextScene: 'intro' },
      ],
    },
  },
};

const NovelGame: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GAME_DATA);
  const [currentScene, setCurrentScene] = useState<Scene>(GAME_DATA.scenes['intro']);

  const handleChoice = (choice: Choice) => {
    const newReputation = gameState.reputation + choice.points;
    const nextSceneId = choice.nextScene || 'intro';
    const nextScene = gameState.scenes[nextSceneId];

    setGameState(prev => ({
      ...prev,
      reputation: newReputation,
      currentScene: nextSceneId,
    }));

    setCurrentScene(nextScene);
  };

  const resetGame = () => {
    setGameState(GAME_DATA);
    setCurrentScene(GAME_DATA.scenes['intro']);
  };

  const startGame = () => {
    const firstChoice = GAME_DATA.scenes['intro'].choices?.[0];
    if (firstChoice) {
      handleChoice(firstChoice);
    }
  };

  return (
    <div className="novel-game" style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '20px',
      fontFamily: 'Uralsib-Regular, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      textRendering: 'optimizeLegibility',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
    }}>
      {/* Игровое окно */}
      <div style={{
        width: '100%',
        maxWidth: '1200px',
        background: 'white',
        borderRadius: '24px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        minHeight: '560px',
      }}>
        {/* Главное меню - показывается когда игра не запущена */}
        {currentScene.id === 'intro' && (
          <div style={{
            padding: '48px 40px',
            textAlign: 'center',
            minHeight: '560px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}>
            <h1 style={{
              margin: '0 0 16px 0',
              fontSize: '48px',
              fontWeight: 700,
              color: '#3B175C',
              letterSpacing: '-0.5px',
              fontFamily: 'Uralsib-Bold, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              textRendering: 'optimizeLegibility',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
            }}>
              Финансовая Грамотность
            </h1>
            <p style={{
              margin: '0 0 40px 0',
              fontSize: '18px',
              color: '#6C757D',
              fontFamily: 'Uralsib-Regular, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              textRendering: 'optimizeLegibility',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
            }}>
              Интерактивное обучение финансовой грамотности
            </p>
            <button
              onClick={startGame}
              style={{
                padding: '18px 56px',
                background: 'linear-gradient(135deg, #3B175C 0%, #5A2A8B 100%)',
                border: 'none',
                borderRadius: '16px',
                color: 'white',
                fontSize: '20px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                fontFamily: 'Uralsib-Bold, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                textRendering: 'optimizeLegibility',
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
                boxShadow: '0 10px 25px rgba(59, 23, 92, 0.3)',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
                e.currentTarget.style.boxShadow = '0 15px 35px rgba(59, 23, 92, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(59, 23, 92, 0.3)';
              }}
            >
              🚀 Начать игру
            </button>
          </div>
        )}

        {/* Игровой интерфейс */}
        {currentScene.id !== 'intro' && (
          <>
            {/* Шапка игры */}
            <div style={{
              padding: '24px 40px',
              background: 'linear-gradient(135deg, #3B175C 0%, #5A2A8B 100%)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <h1 style={{
                    margin: 0,
                    fontSize: '28px',
                    fontWeight: 700,
                    color: 'white',
                    letterSpacing: '-0.5px',
                    fontFamily: 'Uralsib-Bold, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    textRendering: 'optimizeLegibility',
                    WebkitFontSmoothing: 'antialiased',
                    MozOsxFontSmoothing: 'grayscale',
                  }}>
                    Финансовая Грамотность
                  </h1>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 20px',
                    background: 'rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: gameState.reputation >= 8 ? '#10B981' : gameState.reputation >= 5 ? '#F59E0B' : '#EF4444',
                      boxShadow: `0 0 12px ${gameState.reputation >= 8 ? 'rgba(16, 185, 129, 0.4)' : gameState.reputation >= 5 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                    }} />
                    <span style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'white',
                      fontFamily: 'Uralsib-Regular, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      textRendering: 'optimizeLegibility',
                      WebkitFontSmoothing: 'antialiased',
                      MozOsxFontSmoothing: 'grayscale',
                    }}>
                      {gameState.reputation} очков
                    </span>
                  </div>
                  <button
                    onClick={resetGame}
                    style={{
                      padding: '10px 20px',
                      background: 'rgba(255, 255, 255, 0.15)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '12px',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      backdropFilter: 'blur(10px)',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    }}
                  >
                    <span style={{
                      fontFamily: 'Uralsib-Regular, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      textRendering: 'optimizeLegibility',
                      WebkitFontSmoothing: 'antialiased',
                      MozOsxFontSmoothing: 'grayscale',
                    }}>
                      Начать заново
                    </span>
                  </button>
                </div>
              </div>
            </div>

        {/* Основная область игры */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
        }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '320px 1fr',
          gap: '32px',
          padding: '16px',
          minHeight: '560px',
        }}>
          {/* Боковая панель */}
          <div style={{
            background: '#f8f9fa',
            borderRadius: '16px',
            padding: '24px',
            height: 'fit-content',
            boxShadow: '0 1px 3px rgba(59, 23, 92, 0.05)',
            border: '1px solid rgba(59, 23, 92, 0.08)',
          }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px',
            paddingBottom: '20px',
            borderBottom: '2px solid rgba(59, 23, 92, 0.08)',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #3B175C 0%, #5A2A8B 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
            }}>
              📚
            </div>
            <div>
              <div style={{
                fontSize: '12px',
                color: '#6C757D',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '4px',
              }}>
                Глава
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#3B175C',
                fontFamily: 'Uralsib-Bold, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                textRendering: 'optimizeLegibility',
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
              }}>
                {gameState.chapter}
              </div>
            </div>
          </div>

          <div style={{
            fontSize: '14px',
            color: '#495057',
            lineHeight: 1.7,
            fontFamily: 'Uralsib-Regular, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            textRendering: 'optimizeLegibility',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
          }}>
            <p style={{ marginBottom: '16px' }}>
              Вы - молодой банковский консультант. Ваша задача - помочь клиентам принять правильные финансовые решения.
            </p>
            <p style={{ marginBottom: '20px', fontWeight: 500 }}>
              Зарабатывайте очки репутации, делая правильный выбор!
            </p>

            <div style={{
              marginTop: '28px',
              padding: '20px',
              background: 'linear-gradient(135deg, rgba(59, 23, 92, 0.05) 0%, rgba(90, 42, 139, 0.05) 100%)',
              borderRadius: '12px',
              border: '1px solid rgba(59, 23, 92, 0.1)',
            }}>
              <div style={{
                fontWeight: 600,
                marginBottom: '10px',
                color: '#3B175C',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: 'Uralsib-Bold, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                textRendering: 'optimizeLegibility',
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
              }}>
                <span style={{ fontSize: '18px' }}>💡</span>
                Подсказка
              </div>
              <div style={{
                fontSize: '13px',
                color: '#6C757D',
                fontFamily: 'Uralsib-Regular, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                textRendering: 'optimizeLegibility',
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
              }}>
                Всегда думайте о интересах клиента, а не только о прибыли банка.
              </div>
            </div>
          </div>
        </div>

          {/* Игровая область */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(59, 23, 92, 0.06)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid rgba(59, 23, 92, 0.08)',
          }}>
          {/* Фон сцены */}
          <div style={{
            flex: 1,
            background: 'linear-gradient(135deg, rgba(59, 23, 92, 0.03) 0%, rgba(90, 42, 139, 0.05) 100%)',
            padding: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '360px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Декоративные элементы */}
            <div style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              width: '300px',
              height: '300px',
              background: 'radial-gradient(circle, rgba(59, 23, 92, 0.08) 0%, transparent 70%)',
              borderRadius: '50%',
              filter: 'blur(20px)',
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-100px',
              left: '-100px',
              width: '400px',
              height: '400px',
              background: 'radial-gradient(circle, rgba(90, 42, 139, 0.06) 0%, transparent 60%)',
              borderRadius: '50%',
              filter: 'blur(24px)',
            }} />

            {/* Текст сцены */}
            <div style={{
              maxWidth: '800px',
              textAlign: 'center',
              position: 'relative',
              zIndex: 1,
            }}>
              <div style={{
                fontSize: '20px',
                lineHeight: 1.75,
                color: '#212529',
                marginBottom: '0',
                fontWeight: 400,
                fontFamily: 'Uralsib-Regular, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                textRendering: 'optimizeLegibility',
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
              }}>
                {currentScene.text}
              </div>
            </div>
          </div>

          {/* Область выбора */}
          {currentScene.choices && currentScene.choices.length > 0 && (
            <div style={{
              padding: '32px',
              background: 'white',
              borderTop: '1px solid rgba(59, 23, 92, 0.08)',
            }}>
              <div style={{
                display: 'grid',
                gap: '14px',
              }}>
                {currentScene.choices.map((choice, index) => {
                  const isPositive = choice.points > 0;
                  const isNegative = choice.points < 0;

                  return (
                    <button
                      key={index}
                      onClick={() => handleChoice(choice)}
                      style={{
                        padding: '20px 28px',
                        background: isPositive
                          ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                          : isNegative
                          ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                          : 'linear-gradient(135deg, #F8F9FA 0%, #E9ECEF 100%)',
                        border: 'none',
                        borderRadius: '14px',
                        color: isPositive || isNegative ? 'white' : '#3B175C',
                        fontSize: '15px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        textAlign: 'left',
                        boxShadow: isPositive || isNegative
                          ? '0 4px 12px rgba(0, 0, 0, 0.15)'
                          : '0 2px 8px rgba(59, 23, 92, 0.08)',
                        fontFamily: 'Uralsib-Regular, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        textRendering: 'optimizeLegibility',
                        WebkitFontSmoothing: 'antialiased',
                        MozOsxFontSmoothing: 'grayscale',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-3px) scale(1.01)';
                        e.currentTarget.style.boxShadow = isPositive || isNegative
                          ? '0 8px 20px rgba(0, 0, 0, 0.2)'
                          : '0 6px 16px rgba(59, 23, 92, 0.12)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        e.currentTarget.style.boxShadow = isPositive || isNegative
                          ? '0 4px 12px rgba(0, 0, 0, 0.15)'
                          : '0 2px 8px rgba(59, 23, 92, 0.08)';
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                      }}>
                        <div style={{
                          width: '28px',
                          height: '28px',
                          background: isPositive || isNegative
                            ? 'rgba(255, 255, 255, 0.25)'
                            : 'rgba(59, 23, 92, 0.1)',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '13px',
                          fontWeight: 700,
                          flexShrink: 0,
                          textRendering: 'optimizeLegibility',
                          WebkitFontSmoothing: 'antialiased',
                          MozOsxFontSmoothing: 'grayscale',
                        }}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span style={{
                          flex: 1,
                          textRendering: 'optimizeLegibility',
                          WebkitFontSmoothing: 'antialiased',
                          MozOsxFontSmoothing: 'grayscale',
                        }}>{choice.text}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          </div>
        </div>
        </div>
          </>
        )}

        {/* Прогресс-бар репутации */}
        <div style={{
          padding: '24px 32px',
          background: '#f8f9fa',
          borderTop: '1px solid rgba(59, 23, 92, 0.08)',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}>
            <span style={{
              fontSize: '13px',
              color: '#6C757D',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontFamily: 'Uralsib-Bold, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              textRendering: 'optimizeLegibility',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
            }}>
              Ваша репутация
            </span>
            <span style={{
              fontSize: '15px',
              color: '#3B175C',
              fontWeight: 700,
              fontFamily: 'Uralsib-Bold, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              textRendering: 'optimizeLegibility',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
            }}>
              {gameState.reputation} очков
            </span>
          </div>
          <div style={{
            height: '14px',
            background: 'linear-gradient(90deg, rgba(59, 23, 92, 0.08) 0%, rgba(90, 42, 139, 0.08) 100%)',
            borderRadius: '10px',
            overflow: 'hidden',
            position: 'relative',
          }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, (gameState.reputation / 10) * 100)}%`,
              background: gameState.reputation >= 8
                ? 'linear-gradient(90deg, #10B981 0%, #059669 100%)'
                : gameState.reputation >= 5
                ? 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)'
                : 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)',
              transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              borderRadius: '10px',
              boxShadow: gameState.reputation >= 8
                ? '0 0 20px rgba(16, 185, 129, 0.3)'
                : gameState.reputation >= 5
                ? '0 0 20px rgba(245, 158, 11, 0.3)'
                : '0 0 20px rgba(239, 68, 68, 0.3)',
            }} />
          </div>
          <div style={{
            marginTop: '16px',
            fontSize: '14px',
            color: '#495057',
            textAlign: 'center',
            fontWeight: 500,
            fontFamily: 'Uralsib-Regular, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            textRendering: 'optimizeLegibility',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
          }}>
            {gameState.reputation >= 8
              ? '🏆 Отличная работа! Вы настоящий профессионал!'
              : gameState.reputation >= 5
              ? '👍 Хорошо! Продолжайте развиваться'
              : '💭 Нужно больше практики'
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default NovelGame;
