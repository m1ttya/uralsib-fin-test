import React from 'react';

const AboutSection: React.FC = () => {
  const features = [
    {
      title: 'Комплексная оценка',
      description: 'Тест охватывает ключевые аспекты финансовой грамотности, от бюджетирования до инвестирования.',
    },
    {
      title: 'Персональные рекомендации',
      description: 'Получите советы, основанные на ваших ответах, чтобы улучшить свои финансовые знания.',
    },
    {
      title: 'Отслеживание прогресса',
      description: 'Сохраняйте свои результаты и следите за своим прогрессом в обучении финансовой грамотности.',
    },
  ];

  return (
    <section className="bg-gray-50 py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl premium-heading font-bold text-center text-gray-800 mb-4">
            Что такое наш тест?
          </h2>
          <p className="max-w-3xl mx-auto text-center text-lg md:text-xl text-gray-600 mb-12">
            Это не просто проверка знаний, а ваш личный помощник в мире финансов. Мы разработали этот инструмент, чтобы помочь вам лучше понять свои сильные и слабые стороны.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
