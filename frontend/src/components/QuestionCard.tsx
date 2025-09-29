// frontend/src/components/QuestionCard.tsx
import { motion } from 'framer-motion';

type Props = {
  question: string;
  options: string[];
  selectedOption: number | null;
  onOptionSelect: (index: number) => void;
  showFeedback?: boolean;
  correctIndex?: number;
};

export default function QuestionCard({
  question,
  options,
  selectedOption,
  onOptionSelect,
  showFeedback = false,
  correctIndex
}: Props) {
  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold mb-5 sm:mb-6 text-primary">{question}</h2>
      <div className="space-y-4 sm:space-y-4">
        {options.map((option, idx) => {
          let bgColor = 'bg-white border-gray-200';
          let textColor = 'text-text';
          let ringColor = 'ring-transparent';

          if (selectedOption === idx) {
            if (showFeedback) {
              if (idx === correctIndex) {
                bgColor = 'bg-success/10 border-success';
                textColor = 'text-success';
                ringColor = 'ring-success';
              } else {
                bgColor = 'bg-error/10 border-error';
                textColor = 'text-error';
                ringColor = 'ring-error';
              }
            } else {
              bgColor = 'bg-primary/10 border-primary';
              textColor = 'text-primary';
              ringColor = 'ring-primary';
            }
          }

          return (
            <motion.button
              key={idx}
              whileTap={{ scale: 0.98 }}
              onClick={() => !showFeedback && onOptionSelect(idx)}
              disabled={showFeedback}
              className={`w-full text-left py-4 px-5 sm:py-4 sm:px-5 rounded-xl border ${bgColor} ${textColor} transition-colors ring-2 ${ringColor} hover:bg-opacity-90 font-medium text-base sm:text-lg`}
            >
              {option}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}