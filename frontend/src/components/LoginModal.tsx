import { useState, useEffect } from 'react';

function LogoWithSecretClicks() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (count === 0) return;
    const t = setTimeout(() => setCount(0), 1500); // окно сброса
    return () => clearTimeout(t);
  }, [count]);
  const onClick = () => {
    const next = count + 1;
    if (next >= 5) {
      // Переход в админ-панель
      window.location.hash = '#admin';
      setCount(0);
      return;
    }
    setCount(next);
  };
  return (
    <div className="flex flex-col items-center mb-6 sm:mb-6 pt-8 sm:pt-0 select-none">
      <img
        onClick={onClick}
        src="./uralsib_logo_square_white.svg"
        alt="Банк Уралсиб"
        className="w-32 h-32 sm:w-32 sm:h-32 cursor-default select-none"
      />
    </div>
  );
}
import { motion, AnimatePresence } from 'framer-motion';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
  onSkip: () => void;
};

export default function LoginModal({ isOpen, onClose, onLogin, onSkip }: Props) {
  const [isChecked, setIsChecked] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
    }
  }, [isOpen]);

  const handleClose = () => {
    setShouldRender(false);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const handleSkip = () => {
    setShouldRender(false);
    setTimeout(() => {
      onSkip();
    }, 200);
  };


  return (
    <AnimatePresence>
      {shouldRender && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-start sm:items-center justify-center z-50 p-0 sm:p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-screen h-[100dvh] sm:h-auto sm:w-full sm:max-w-sm rounded-none sm:rounded-2xl p-6 sm:p-8 relative"
            style={{ backgroundColor: '#252030' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Кнопка закрытия */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Логотип Уралсиб (5 кликов для входа в админку) */}
            <LogoWithSecretClicks />

            {/* Заголовок */}
            <h2 className="text-xl sm:text-2xl text-white text-center mb-3 sm:mb-4" style={{
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              fontWeight: '700',
              letterSpacing: '-0.02em',
              lineHeight: '1.1'
            }}>
              Вход в Уралсиб
            </h2>

            {/* Описание */}
            <p className="text-white text-center mb-6 sm:mb-8 text-xs sm:text-sm premium-text">
              Получайте бонусы и кэшбэк за прохождение тестов и развитие финансовой грамотности
            </p>

            {/* Кнопка входа */}
            <button
              onClick={onLogin}
              disabled={!isChecked}
              className={`w-full py-3 sm:py-3 px-5 rounded-3xl premium-button transition-all duration-300 text-white text-base sm:text-base ${
                isChecked 
                  ? 'bg-button-login hover:bg-button-login-hover ring-2 ring-button-login/30' 
                  : 'bg-button-login opacity-50'
              }`}
            >
              Войти
            </button>

            {/* Кнопка пропустить */}
            <button
              onClick={handleSkip}
              className="w-full py-3 sm:py-3 rounded-3xl premium-button text-white bg-button-skip hover:bg-button-skip-hover transition-all duration-300 mt-2 sm:mt-3 text-base sm:text-base"
            >
              Пропустить
            </button>

            {/* Чекбокс согласия */}
            <div className="flex items-start mt-4 sm:mt-6">
              <input
                type="checkbox"
                id="consent"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
                className="mt-1 mr-3"
              />
              <label htmlFor="consent" className="text-gray-400 text-xs sm:text-xs premium-text">
                Я принимаю{' '}
                <a href="#" className="underline hover:text-gray-300">
                  условия использования сайта
                </a>
                , согласен с{' '}
                <a href="#" className="underline hover:text-gray-300">
                  политикой обработки персональных данных
                </a>
              </label>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
