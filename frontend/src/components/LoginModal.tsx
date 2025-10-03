import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
  onSkip: () => void;
};

export default function LoginModal({ isOpen, onClose, onLogin, onSkip }: Props) {
  const [isChecked, setIsChecked] = useState(true);
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
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="rounded-2xl p-8 max-w-sm w-full relative"
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

            {/* Логотип Уралсиб */}
            <div className="flex justify-center mb-6">
              <img 
                src="./uralsib_logo_square_white.svg"
                alt="Банк Уралсиб" 
                className="w-32 h-32"
              />
            </div>

            {/* Заголовок */}
            <h2 className="text-2xl text-white text-center mb-4" style={{
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              fontWeight: '700',
              letterSpacing: '-0.02em',
              lineHeight: '1.1'
            }}>
              Вход в Уралсиб
            </h2>

            {/* Описание */}
            <p className="text-white text-center mb-8 text-sm premium-text">
              Получайте бонусы и кэшбэк за прохождение тестов и развитие финансовой грамотности
            </p>

            {/* Кнопка входа */}
            <button
              onClick={onLogin}
              disabled={!isChecked}
              className={`w-full py-3 px-4 rounded-3xl premium-button transition-all duration-300 text-white ${
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
              className="w-full py-3 rounded-3xl premium-button text-white bg-button-skip hover:bg-button-skip-hover transition-all duration-300 mt-3"
            >
              Пропустить
            </button>

            {/* Чекбокс согласия */}
            <div className="flex items-start mt-6">
              <input
                type="checkbox"
                id="consent"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
                className="mt-1 mr-3"
              />
              <label htmlFor="consent" className="text-gray-400 text-xs premium-text">
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
