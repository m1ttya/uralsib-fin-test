import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FaqItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 py-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left text-lg font-semibold text-gray-800"
      >
        <span>{question}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </motion.span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="mt-4 text-gray-600"
          >
            {answer}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FaqSection: React.FC = () => {
  const faqs = [
    {
      question: 'Как долго длится тест?',
      answer: 'Тест рассчитан на 15-20 минут. Этого времени достаточно, чтобы вдумчиво ответить на все вопросы без спешки.',
    },
    {
      question: 'Нужно ли мне регистрироваться?',
      answer: 'Регистрация не обязательна для прохождения теста, но она позволит вам сохранять результаты и отслеживать свой прогресс.',
    },
    {
      question: 'Это бесплатно?',
      answer: 'Да, наш тест на финансовую грамотность абсолютно бесплатный. Мы хотим, чтобы как можно больше людей имели доступ к этим знаниям.',
    },
    {
      question: 'Что я получу после прохождения теста?',
      answer: 'Вы получите оценку вашего уровня финансовой грамотности, а также персональные рекомендации и ссылки на полезные материалы для дальнейшего обучения.',
    },
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl premium-heading font-bold text-center text-gray-800 mb-12">
            Часто задаваемые вопросы
          </h2>
        </motion.div>
        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <FaqItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
