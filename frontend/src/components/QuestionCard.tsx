// frontend/src/components/QuestionCard.tsx
import { motion } from 'framer-motion';
import CollapseText from './CollapseText';

const styles = `
  .question-card-content {
    position: relative;
    overflow: visible !important;
    overflow-x: visible !important;
  }
`;

type Props = {
  question: string;
  options: string[];
  selectedOption: number | null;
  onOptionSelect: (index: number) => void;
  showFeedback?: boolean;
  correctIndex?: number;
  correctShuffledIndex?: number;
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
  explanation
}: Props) {
  const capitalizeFirst = (s: string) => (s && s.length > 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  return (
    <div>
      <style>{styles}</style>
      <div className="question-card-content">
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
        <div className="mb-4 sm:mb-6">
          <CollapseText title="Почему так" text={explanation} />
        </div>
      )}
      </div>
    </div>
  );
}
