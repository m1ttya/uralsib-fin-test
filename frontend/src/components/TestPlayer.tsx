// frontend/src/components/TestPlayer.tsx
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import QuestionCard from './QuestionCard';
import ResultsView from './ResultsView';
import { Test } from '../data/mockTests';

type Props = {
  test: Test;
};

export default function TestPlayer({ test }: Props) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(test.questions.length).fill(null));
  const [showResults, setShowResults] = useState(false);
  const [userData, setUserData] = useState({ fullName: '', email: '' });

  const currentQuestion = test.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex) / test.questions.length) * 100;

  const handleOptionSelect = (index: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = index;
    setAnswers(newAnswers);

    setTimeout(() => {
      if (currentQuestionIndex < test.questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        setShowResults(true);
      }
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Отправка результатов:', { testId: test.id, answers, userData });
    alert('Результаты отправлены! Спасибо.');
  };

  if (showResults) {
    return (
      <ResultsView
        test={test}
        answers={answers}
        userData={userData}
        onUserDataChange={setUserData}
        onSubmit={handleSubmit}
      />
    );
  }

  return (
    <div className="w-full max-w-6xl px-2 sm:px-6">
      {/* Карточка с вопросом */}
        <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white rounded-3xl shadow-lg p-5 sm:p-6 relative"
        >
        {/* Логотип в верхнем левом углу карточки */}
        <div className="absolute top-4 left-6">
            <img 
            src="./uralsib-logo.svg" 
            alt="Банк Уралсиб" 
            className="h-9 w-auto"
            />
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6 mt-12">
            <motion.div
            className="bg-primary h-2.5 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            />
        </div>

        <p className="text-sm text-gray-500 mb-6">
            Вопрос {currentQuestionIndex + 1} из {test.questions.length}
        </p>

        <AnimatePresence mode="wait">
            <QuestionCard
            key={currentQuestionIndex}
            question={currentQuestion.text}
            options={currentQuestion.options}
            selectedOption={answers[currentQuestionIndex]}
            onOptionSelect={handleOptionSelect}
            />
        </AnimatePresence>
        </motion.div>
    </div>
  );
}