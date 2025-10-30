// frontend/src/components/TestPlayer.tsx
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import QuestionCard from './QuestionCard';
import ResultsView from './ResultsView';
import { Test } from '../data/mockTests';

type Props = {
  test: Test;
  onRestart?: () => void;
};

export default function TestPlayer({ test, onRestart }: Props) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(test.questions.length).fill(null));
  const [showResults, setShowResults] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const currentQuestion = test.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / test.questions.length) * 100;

  const handleOptionSelect = (index: number) => {
    setSelectedOption(index);
    setShowFeedback(true);
  };

  const handleNext = () => {
    if (selectedOption !== null) {
      const newAnswers = [...answers];
      newAnswers[currentQuestionIndex] = selectedOption;
      setAnswers(newAnswers);

      if (currentQuestionIndex < test.questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedOption(null);
        setShowFeedback(false);
      } else {
        setShowResults(true);
      }
    }
  };

  if (showResults) {
    return (
      <ResultsView
        test={test}
        answers={answers}
        onRestart={onRestart}
      />
    );
  }

  return (
            <div className="modal-overlay">
              <div className="test-modal-paper flex flex-col" style={{ width: 'min(900px, 94vw)' }}>
        {/* Логотип в верхней части - БЕЗ анимации */}
        <div className="flex justify-center py-4 sm:py-6 md:py-8 px-4 sm:px-6 md:px-8">
            <img 
            src="./uralsib_logo.svg" 
            alt="Банк Уралсиб" 
            className="h-8 sm:h-9 md:h-10 lg:h-11 w-auto"
            />
        </div>

        {/* Progress bar - на всю ширину модального окна, без отступов */}
        <div className="w-full bg-gray-200 h-2.5 mb-7 progress-bar-container relative z-20" style={{ marginLeft: 0, marginRight: 0 }}>
            <motion.div
            className="bg-primary h-2.5"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            />
        </div>

        {/* Счетчик вопросов - БЕЗ анимации */}
        <p className="text-sm sm:text-base md:text-lg text-gray-500 mb-6 sm:mb-8 text-center px-4 sm:px-6 md:px-8 premium-text">
            Вопрос {currentQuestionIndex + 1} из {test.questions.length}
        </p>

        {/* Контент с анимацией - только для вопросов */}
        <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="relative flex flex-col h-full"
        >

        <div className="flex-1 px-4 sm:px-6 md:px-8 pb-4 sm:pb-6 md:pb-8">
        <AnimatePresence mode="wait">
            <QuestionCard
            key={currentQuestionIndex}
            question={currentQuestion.text}
            options={currentQuestion.options}
            selectedOption={selectedOption}
            onOptionSelect={handleOptionSelect}
            showFeedback={showFeedback}
            correctIndex={currentQuestion.correctIndex}
            onNext={handleNext}
            canProceed={selectedOption !== null}
            />
        </AnimatePresence>
        </div>
                
                </motion.div>
              </div>
            </div>
          );
        }