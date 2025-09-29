// frontend/src/components/ResultsView.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Test } from '../data/mockTests';

type Props = {
  test: Test;
  answers: (number | null)[];
  userData: { fullName: string; email: string };
  onUserDataChange: ({ fullName, email }: { fullName: string; email: string }) => void;
  onSubmit: (e: React.FormEvent) => void;
};

export default function ResultsView({
  test,
  answers,
  userData,
  onUserDataChange,
  onSubmit
}: Props) {
    const correctCount: number = answers.reduce((acc: number, ans: number | null, idx: number) => {
        if (ans === null) return acc;
        return ans === test.questions[idx].correctIndex ? acc + 1 : acc;
      }, 0);

  const score = Math.round((correctCount / test.questions.length) * 100);

  return (
    <div className="w-full max-w-4xl px-2 sm:px-4"> {/* ← Карточка пошире */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-3xl shadow-lg p-5 sm:p-6 relative"
      >
        {/* Логотип в верхнем левом углу */}
        <div className="absolute top-4 left-6">
          <img 
            src="./uralsib-logo.svg" 
            alt="Банк Уралсиб" 
            className="h-9 w-auto"
          />
        </div>

        <div className="mt-10">
          {/* Заголовок и процент в одной строке */}
          <div className="flex items-start gap-4 mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-primary mt-1">Ваш результат: {score}%</h2>
          </div>

          <p className="text-base sm:text-lg text-gray-600 mb-6">
            Правильных ответов: {correctCount} из {test.questions.length}
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-primary">ФИО</label>
              <input
                type="text"
                required
                value={userData.fullName}
                onChange={(e) => onUserDataChange({ ...userData, fullName: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-primary">Email</label>
              <input
                type="email"
                required
                value={userData.email}
                onChange={(e) => onUserDataChange({ ...userData, email: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-[#6440bf] text-white py-3 px-4 rounded-xl font-medium hover:bg-opacity-90 transition ring-2 ring-[#6440bf]/30 text-base leading-6"
              >
                Отправить результаты
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}