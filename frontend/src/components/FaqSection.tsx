import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: 'Как часто мне следует проходить тест?',
      answer: 'Мы рекомендуем проходить тест каждые 6-12 месяцев, чтобы отслеживать свой прогресс и актуализировать знания.',
    },
    {
      question: 'Являются ли мои результаты конфиденциальными?',
      answer: 'Да, ваши результаты полностью конфиденциальны. Мы не передаем ваши данные третьим лицам.',
    },
    {
      question: 'Тест платный?',
      answer: 'Нет, наш тест на финансовую грамотность абсолютно бесплатный для всех пользователей.',
    },
    {
      question: 'Сколько времени занимает прохождение теста?',
      answer: 'В среднем, прохождение теста занимает от 10 до 15 минут.',
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="bg-white py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl premium-heading font-bold text-center text-gray-800 mb-4">
            Часто задаваемые вопросы
          </h2>
          <p className="max-w-3xl mx-auto text-center text-lg md:text-xl text-gray-600 mb-12">
            Не нашли ответа на свой вопрос? Свяжитесь с нами, и мы будем рады помочь.
          </p>
        </motion.div>
        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
              className="border-b border-gray-200 py-6"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full flex justify-between items-center text-left text-lg font-semibold text-gray-800 focus:outline-none"
              >
                <span>{faq.question}</span>
                <motion.span
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.span>
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="mt-4 text-gray-600"
                  >
                    {faq.answer}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
