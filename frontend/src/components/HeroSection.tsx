import React from 'react';

type Props = {
  onStartTest: () => void;
};

const HeroSection: React.FC<Props> = ({ onStartTest }) => {
  return (
    <section className="w-full flex flex-col items-center justify-center text-center pt-24 md:pt-32 pb-16 md:pb-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl premium-heading font-bold text-gray-800 mb-6"
        >
          <span className="bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent">
            Проверьте свою финансовую грамотность
          </span>
        </h1>
        <p
          className="max-w-2xl mx-auto text-lg md:text-xl text-gray-600 mb-10"
        >
          Наш тест поможет вам оценить свои знания в области финансов и получить персональные рекомендации по их улучшению.
        </p>
        <div>
          <button
            onClick={onStartTest}
            className="premium-button text-lg px-8 py-4"
          >
            Пройти тест
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
