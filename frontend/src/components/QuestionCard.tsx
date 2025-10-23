// frontend/src/components/QuestionCard.tsx
import { motion } from 'framer-motion';
import CollapseText from './CollapseText';
import { useState } from 'react';

type Props = {
  question: string;
  options: string[];
  selectedOption: number | null;
  onOptionSelect: (index: number) => void;
  showFeedback?: boolean;
  correctIndex?: number;
  correctShuffledIndex?: number;
  onNext?: () => void;
  canProceed?: boolean;
  explanation?: string;
};

export default function QuestionCard({
  question,
  options,
  selectedOption,
  onOptionSelect,
  showFeedback = false,
  correctIndex,
  correctShuffledIndex,
  onNext,
  canProceed = false,
  explanation
}: Props) {
  const capitalizeFirst = (s: string) => (s && s.length > 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  return (
    <div>
      <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 text-primary text-left font-bold">{question}</h2>
      <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
        {options.map((option, idx) => {
          let bgColor = 'bg-white border-gray-200';
          let textColor = 'text-text';

          if (showFeedback) {
            // Показываем правильный ответ зеленым (по индексу в перетасованном порядке)
            if (idx === (typeof correctShuffledIndex === 'number' ? correctShuffledIndex : correctIndex)) {
              bgColor = 'bg-success-bg border-gray-200';
              textColor = 'text-success';
            }
            // Показываем выбранный неправильный ответ красным
            else if (selectedOption === idx && idx !== (typeof correctShuffledIndex === 'number' ? correctShuffledIndex : correctIndex)) {
              bgColor = 'bg-error-bg border-gray-200';
              textColor = 'text-error';
            }
          } else if (selectedOption === idx) {
            bgColor = 'bg-primary/5 border-primary/30';
            textColor = 'text-primary';
          }

          return (
            <motion.button
              key={idx}
              whileTap={!showFeedback ? { scale: 0.98 } : {}}
              onClick={() => !showFeedback && onOptionSelect(idx)}
              disabled={showFeedback}
              className={`w-full max-w-[360px] mx-auto sm:max-w-none text-left px-4 sm:px-6 py-3 sm:py-4 rounded-3xl border-2 ${bgColor} ${textColor} transition-all duration-300 ${
                !showFeedback 
                  ? 'hover:bg-opacity-90 hover:shadow-lg hover:shadow-button-primary/20 hover:scale-[1.02]' 
                  : showFeedback && selectedOption === idx && idx !== correctIndex
                  ? 'shadow-lg'
                  : ''
              } premium-text text-base sm:text-lg md:text-xl flex items-start justify-start`}
              style={{ width: window.innerWidth < 640 ? 'min(360px, calc(100vw - 32px))' : undefined }}
            >
              <span className="leading-snug break-words whitespace-normal w-full">
                {capitalizeFirst(option)}
              </span>
            </motion.button>
          );
        })}
      </div>
      
      {showFeedback && explanation && (
        <CollapseText title="Почему так" text={explanation} />
      )}

      {/* Кнопка далее: скрыта на мобильных (там отрисовывается глобально), в потоке на sm+ */}
      <div className="hidden sm:flex h-16 justify-center items-center">
        {onNext && (
          <div className="flex justify-center w-full">
          <motion.button
            whileTap={canProceed ? { scale: 0.95 } : {}}
            onClick={onNext}
            disabled={!canProceed}
            className={`relative w-12 h-12 rounded-full premium-button transition-all duration-500 shadow-lg flex items-center justify-center ${
              canProceed
                ? 'bg-primary text-white hover:bg-secondary hover:shadow-xl hover:shadow-primary/30'
                : 'bg-gray-100 text-gray-300'
            }`}
          >
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              className="transition-transform duration-300 w-4 h-4"
            >
              <path 
                d="M9 18L15 12L9 6" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}