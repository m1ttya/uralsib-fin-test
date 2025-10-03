// frontend/src/components/QuestionCard.tsx
import { motion } from 'framer-motion';

type Props = {
  question: string;
  options: string[];
  selectedOption: number | null;
  onOptionSelect: (index: number) => void;
  showFeedback?: boolean;
  correctIndex?: number;
  onNext?: () => void;
  canProceed?: boolean;
};

export default function QuestionCard({
  question,
  options,
  selectedOption,
  onOptionSelect,
  showFeedback = false,
  correctIndex,
  onNext,
  canProceed = false
}: Props) {
  return (
    <div>
      <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl mb-6 sm:mb-8 text-primary text-center" style={{
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        fontWeight: '700',
        letterSpacing: '-0.02em',
        lineHeight: '1.1'
      }}>{question}</h2>
      <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
        {options.map((option, idx) => {
          let bgColor = 'bg-white border-gray-200';
          let textColor = 'text-text';

          if (showFeedback) {
            // Показываем правильный ответ зеленым
            if (idx === correctIndex) {
              bgColor = 'bg-success-bg border-gray-200';
              textColor = 'text-success';
            }
            // Показываем выбранный неправильный ответ красным
            else if (selectedOption === idx && idx !== correctIndex) {
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
              className={`w-full text-left py-3 sm:py-4 px-4 sm:px-6 rounded-3xl border-2 ${bgColor} ${textColor} transition-all duration-300 ${
                !showFeedback 
                  ? 'hover:bg-opacity-90 hover:shadow-lg hover:shadow-button-primary/20 hover:scale-[1.02]' 
                  : showFeedback && selectedOption === idx && idx !== correctIndex
                  ? 'shadow-lg'
                  : ''
              } premium-text text-base sm:text-lg md:text-xl flex items-center justify-start`}
            >
              {option}
            </motion.button>
          );
        })}
      </div>
      
      {/* Зарезервированное место для кнопки */}
      <div className="h-16 flex justify-center items-center">
        {onNext && (
          <div className="flex justify-center">
          <motion.button
            whileTap={canProceed ? { scale: 0.95 } : {}}
            onClick={onNext}
            disabled={!canProceed}
            className={`w-12 h-12 rounded-full premium-button transition-all duration-500 shadow-lg flex items-center justify-center ${
              canProceed
                ? 'bg-primary text-white hover:bg-secondary hover:shadow-xl hover:shadow-primary/30'
                : 'bg-gray-100 text-gray-300'
            }`}
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              className="transition-transform duration-300"
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