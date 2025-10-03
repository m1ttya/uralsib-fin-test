// frontend/src/components/ResultsView.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Test } from '../data/mockTests';

type Props = {
  test: Test;
  answers: (number | null)[];
  onRestart?: () => void;
};

export default function ResultsView({
  test,
  answers,
  onRestart
}: Props) {
    const correctCount: number = answers.reduce((acc: number, ans: number | null, idx: number) => {
        if (ans === null) return acc;
        return ans === test.questions[idx].correctIndex ? acc + 1 : acc;
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
              className="modal-overlay"
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="modal-paper w-full flex flex-col"
              >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="relative flex flex-col h-full"
              >
        {/* Логотип в верхней части */}
        <div className="flex justify-center py-4 sm:py-6 md:py-8 px-4 sm:px-6 md:px-8">
          <img 
            src="./uralsib_logo.svg" 
            alt="Банк Уралсиб" 
            className="h-8 sm:h-9 md:h-10 lg:h-11 w-auto"
          />
        </div>

        <div className="text-center flex flex-col items-center justify-center flex-1 px-4 sm:px-6 md:px-8 pb-8 sm:pb-6 md:pb-8 visual-spacing">
          {/* Смайлик */}
          <div className="mb-6 sm:mb-6 md:mb-8 flex items-center justify-center">
            <div className="text-9xl sm:text-7xl md:text-8xl lg:text-9xl flex items-center justify-center">{getEmoji(score)}</div>
          </div>
          
          {/* Карточка с результатом */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 md:p-10 shadow-lg border border-gray-100 max-w-lg w-full mb-12 sm:mb-8 md:mb-10">
              <h2 className="text-xl sm:text-3xl md:text-4xl text-primary mb-2 sm:mb-4 md:mb-5 text-center" style={{
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                fontWeight: '700',
                letterSpacing: '-0.02em',
                lineHeight: '1.1'
              }}>
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent whitespace-nowrap">
                  Ваш результат: {score}%
                </span>
              </h2>
              {getMessage(score) === 'Попробуйте еще раз!' ? (
                <button
                  onClick={onRestart}
                  className="relative text-base sm:text-xl md:text-2xl text-gray-600 mb-2 sm:mb-4 md:mb-5 text-center premium-button hover:text-gray-800 transition-colors duration-200 cursor-pointer overflow-hidden"
                  style={{
                    animation: 'gentle-pulse 4s ease-in-out infinite',
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                    fontWeight: '600',
                    letterSpacing: '0.01em'
                  }}
                >
                  <span className="relative z-10">{getMessage(score)}</span>
                </button>
              ) : (
                <p className="text-base sm:text-xl md:text-2xl text-gray-600 mb-2 sm:mb-4 md:mb-5 text-center premium-text">{getMessage(score)}</p>
              )}
              <p className="text-sm sm:text-lg md:text-xl text-gray-500 text-center" style={{
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                fontWeight: '500',
                letterSpacing: '0.005em',
                lineHeight: '1.4'
              }}>
                Правильных ответов: {correctCount} из {test.questions.length}
              </p>
            </div>
          
          {/* Кнопка */}
          <div className="flex justify-center">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGoToBank}
              className="relative bg-gradient-to-r from-purple-800 to-purple-900 text-white rounded-full premium-button shadow-lg hover:shadow-purple-800/25 hover:from-purple-700 hover:to-purple-800 overflow-hidden group flex items-center justify-center whitespace-nowrap"
              style={{
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
        </div>
                        
                      </motion.div>
                      </motion.div>
                    </motion.div>
                  );
                }