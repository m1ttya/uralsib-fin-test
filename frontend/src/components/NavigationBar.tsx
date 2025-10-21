import React from 'react';

const NavigationBar: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md shadow-sm transition-all duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <img className="h-8 w-auto" src="./uralsib_logo.svg" alt="Банк Уралсиб" />
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex md:space-x-8">
            <a href="#" className="font-semibold text-gray-600 hover:text-primary transition-colors">
              Обучение
            </a>
            <a href="#" className="font-semibold text-gray-600 hover:text-primary transition-colors">
              Тесты
            </a>
            <a href="#" className="font-semibold text-gray-600 hover:text-primary transition-colors">
              FAQ
            </a>
          </nav>

          {/* Login Button */}
          <div className="flex items-center">
            <button className="premium-button">
              Войти
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default NavigationBar;
