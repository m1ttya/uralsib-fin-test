import React from 'react';
<<<<<<< HEAD
import { motion } from 'framer-motion';
=======
>>>>>>> 9df0eb0 (Apply patch /tmp/75dc8bf5-18b6-49bb-8c0e-cf098e20c633.patch)

type Props = {
  onStartTest: () => void;
};

const HeroSection: React.FC<Props> = ({ onStartTest }) => {
  return (
    <section className="w-full flex flex-col items-center justify-center text-center pt-24 md:pt-32 pb-16 md:pb-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
<<<<<<< HEAD
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
=======
        <h1
>>>>>>> 9df0eb0 (Apply patch /tmp/75dc8bf5-18b6-49bb-8c0e-cf098e20c633.patch)
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl premium-heading font-bold text-gray-800 mb-6"
        >
          <span className="bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent">
            Проверьте свою финансовую грамотность
          </span>
<<<<<<< HEAD
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-2xl mx-auto text-lg md:text-xl text-gray-600 mb-10"
        >
          Наш тест поможет вам оценить свои знания в области финансов и получить персональные рекомендации по их улучшению.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
=======
        </h1>
        <p
          className="max-w-2xl mx-auto text-lg md:text-xl text-gray-600 mb-10"
        >
          Наш тест поможет вам оценить свои знания в области финансов и получить персональные рекомендации по их улучшению.
        </p>
        <div>
>>>>>>> 9df0eb0 (Apply patch /tmp/75dc8bf5-18b6-49bb-8c0e-cf098e20c633.patch)
          <button
            onClick={onStartTest}
            className="premium-button text-lg px-8 py-4"
          >
            Пройти тест
          </button>
<<<<<<< HEAD
        </motion.div>
=======
        </div>
>>>>>>> 9df0eb0 (Apply patch /tmp/75dc8bf5-18b6-49bb-8c0e-cf098e20c633.patch)
      </div>
    </section>
  );
};

export default HeroSection;
