import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function LogoWithSecretClicks({ onClose }: { onClose?: () => void }) {
  const navigate = useNavigate();
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (count === 0) return;
    const t = setTimeout(() => setCount(0), 1500);
    return () => clearTimeout(t);
  }, [count]);
  const onClick = () => {
    const next = count + 1;
    if (next >= 5) {
      setCount(0);
      // Сначала закрываем модал, потом навигация
      if (onClose) onClose();
      setTimeout(() => {
        navigate('/admin');
      }, 100);
      return;
    }
    setCount(next);
  };
  return (
    <div className="flex flex-col items-center mb-6 select-none">
      <img
        onClick={onClick}
        src="./uralsib_logo_square_white.svg"
        alt="Банк Уралсиб"
        className="w-32 h-32 sm:w-32 sm:h-32 cursor-default select-none"
      />
    </div>
  );
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSkip?: () => void;
  fromStartTest?: boolean;
};

type Mode = 'login' | 'register';

export default function LoginModal({ isOpen, onClose, onSkip, fromStartTest = false }: Props) {
  const [mode, setMode] = useState<Mode>('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    termsAccepted: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [shouldRender, setShouldRender] = useState(false);
  const [showPassword, setShowPassword] = useState(true);
  const [showConfirmPassword, setShowConfirmPassword] = useState(true);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const { login, register } = useAuth();

  const emailInputRef = useRef<HTMLInputElement>(null);
  const validationTimeoutRef = useRef<number | null>(null);
  const emailCheckTimeoutRef = useRef<number | null>(null);

  // Проверка уникальности email при регистрации
  const checkEmailUnique = async (email: string) => {
    if (!email || mode !== 'register') return;

    // Проверяем формат перед отправкой запроса
    const isEmailFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isEmailFormat) {
      return; // Не проверяем уникальность для неполных email
    }

    try {
      // В dev используем прокси, в проде - API_URL из env
      const apiUrl = import.meta.env.VITE_API_URL;
      const url = apiUrl
        ? `${apiUrl}/users/check-email?email=${encodeURIComponent(email)}`
        : `/api/users/check-email?email=${encodeURIComponent(email)}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.exists) {
        setErrors(prev => ({ ...prev, email: 'Пользователь с таким email уже существует' }));
      }
      // Если email уникален, не удаляем ошибку (может быть ошибка формата)
      // validateField сам управляет ошибками при onChange
    } catch (error) {
      console.error('Email check error:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setMode('login'); // Сбрасываем режим на логин при каждом открытии
      // Блокируем скролл страницы под модалом
      document.body.style.overflow = 'hidden';
    } else {
      // Восстанавливаем скролл
      document.body.style.overflow = 'auto';
    }

    // Очистка при размонтировании
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Синхронизация shouldRender с isOpen
  useEffect(() => {
    if (!isOpen && shouldRender) {
      // При закрытии модала через внешний вызов onClose
      setShouldRender(false);
    }
  }, [isOpen, shouldRender]);

  useEffect(() => {
    if (mode === 'login' && shouldRender) {
      emailInputRef.current?.focus();
    }
  }, [mode, shouldRender]);

  // Очистка таймеров при размонтировании
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        window.clearTimeout(validationTimeoutRef.current);
      }
      if (emailCheckTimeoutRef.current) {
        window.clearTimeout(emailCheckTimeoutRef.current);
      }
    };
  }, []);

  const handleClose = () => {
    setShouldRender(false);
    setTimeout(() => {
      onClose();
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        termsAccepted: false
      });
      setErrors({});
      setMessage('');
      setShowPassword(true);
      setShowConfirmPassword(true);
    }, 200);
  };

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      termsAccepted: false
    });
    setErrors({});
    setMessage('');
    setShowPassword(true);
    setShowConfirmPassword(true);
    setTouchedFields(new Set());
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Обязательное поле';
    }
    // В режиме регистрации проверяем формат email
    else if (mode === 'register' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Некорректный email';
    }

    if (!formData.password || formData.password.length < 8) {
      newErrors.password = 'Минимум 8 символов';
    } else if (!/[a-zA-Z]/.test(formData.password) || !/\d/.test(formData.password)) {
      newErrors.password = 'Минимум 1 буква и 1 цифра';
    }

    if (mode === 'register') {
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Пароли не совпадают';
      }

      if (!formData.name || formData.name.length < 2) {
        newErrors.name = 'Минимум 2 символа';
      } else if (formData.name.length > 50) {
        newErrors.name = 'Максимум 50 символов';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Проверка только "тронутых" полей
  const validateTouchedFields = () => {
    const newErrors: Record<string, string> = {};

    // Проверяем email если он был изменен
    if (touchedFields.has('email')) {
      if (!formData.email) {
        newErrors.email = 'Обязательное поле';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Некорректный email';
      }
    }

    // Проверяем password если он был изменен
    if (touchedFields.has('password')) {
      if (!formData.password || formData.password.length < 8) {
        newErrors.password = 'Минимум 8 символов';
      } else if (!/[a-zA-Z]/.test(formData.password) || !/\d/.test(formData.password)) {
        newErrors.password = 'Минимум 1 буква и 1 цифра';
      }
    }

    // В режиме регистрации проверяем дополнительные поля
    if (mode === 'register') {
      // Проверяем name если он был изменен
      if (touchedFields.has('name')) {
        if (!formData.name || formData.name.length < 2) {
          newErrors.name = 'Минимум 2 символа';
        } else if (formData.name.length > 50) {
          newErrors.name = 'Максимум 50 символов';
        }
      }

      // Проверяем confirmPassword если он был изменен или если password был изменен
      if (touchedFields.has('confirmPassword') || touchedFields.has('password')) {
        // Проверяем совпадение только если оба поля не пустые
        if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Пароли не совпадают';
        }
      }
    }

    setErrors(newErrors);
  };

  // Проверка одного поля (мгновенная)
  const validateField = (fieldName: string, value?: string) => {
    // Если значение не передано, берем из formData
    const currentValue = value !== undefined ? value : (formData[fieldName as keyof typeof formData] as string);

    // Всегда удаляем ошибку для этого поля сначала
    const newErrors = { ...errors };
    delete newErrors[fieldName];

    // Если поле пустое, просто удаляем ошибку и выходим
    if (!currentValue) {
      setErrors(newErrors);
      return;
    }

    // Проверяем только если поле не пустое
    if (mode === 'register') {
      // Все проверки - только в режиме регистрации
      if (fieldName === 'email') {
        // Проверяем формат сразу при вводе (если введено больше 1 символа)
        if (currentValue.length > 1 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentValue)) {
          newErrors.email = 'Некорректный email';
        }
      } else if (fieldName === 'password') {
        if (currentValue.length < 8) {
          newErrors.password = 'Минимум 8 символов';
        } else if (!/[a-zA-Z]/.test(currentValue) || !/\d/.test(currentValue)) {
          newErrors.password = 'Минимум 1 буква и 1 цифра';
        }
      } else if (fieldName === 'name') {
        if (currentValue.length < 2) {
          newErrors.name = 'Минимум 2 символа';
        } else if (currentValue.length > 50) {
          newErrors.name = 'Максимум 50 символов';
        }
      } else if (fieldName === 'confirmPassword') {
        if (currentValue && formData.password && formData.password !== currentValue) {
          newErrors.confirmPassword = 'Пароли не совпадают';
        }
      }
    }

    setErrors(newErrors);
  };

  // Валидация в реальном времени с debounce (только для регистрации)
  const validateFormDebounced = useCallback(() => {
    if (mode !== 'register') return;

    if (validationTimeoutRef.current) {
      window.clearTimeout(validationTimeoutRef.current);
    }
    validationTimeoutRef.current = window.setTimeout(() => {
      validateTouchedFields();
    }, 500);
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!validateForm()) {
      return;
    }

    // Проверка уникальности email при регистрации перед отправкой
    if (mode === 'register' && formData.email) {
      try {
        // В dev используем прокси, в проде - API_URL из env
        const apiUrl = import.meta.env.VITE_API_URL;
        const url = apiUrl
          ? `${apiUrl}/users/check-email?email=${encodeURIComponent(formData.email)}`
          : `/api/users/check-email?email=${encodeURIComponent(formData.email)}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.exists) {
          setErrors(prev => ({ ...prev, email: 'Пользователь с таким email уже существует' }));
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error('Email check error:', error);
        // При ошибке проверки продолжаем отправку формы
      }
    }

    try {
      if (mode === 'login') {
        await login(formData.email, formData.password);
        setMessage('Вход выполнен успешно!');
        if (fromStartTest) {
          // Если пользователь пришел с кнопки "начать тест", очищаем redirectUrl и переходим к тестам
          sessionStorage.removeItem('redirectUrl');
          setTimeout(() => {
            handleClose();
            setTimeout(() => {
              window.location.href = '/test';
            }, 200);
          }, 500);
        } else {
          // Иначе просто закрываем модал
          setTimeout(() => handleClose(), 1000);
        }
      } else {
        await register({
          email: formData.email,
          password: formData.password,
          name: formData.name
        });
        setMessage('Регистрация успешна!');
        if (fromStartTest) {
          // Если пользователь пришел с кнопки "начать тест", очищаем redirectUrl и переходим к тестам
          sessionStorage.removeItem('redirectUrl');
          setTimeout(() => {
            handleClose();
            setTimeout(() => {
              window.location.href = '/test';
            }, 200);
          }, 500);
        } else {
          // Иначе просто закрываем модал
          setTimeout(() => handleClose(), 1000);
        }
      }
    } catch (error: any) {
      setMessage(error.message || 'Произошла ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {shouldRender && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-start sm:items-center justify-center z-50 p-0"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="h-screen sm:h-auto w-full sm:w-auto sm:max-w-[420px] sm:mx-4 rounded-none sm:rounded-3xl p-5 flex flex-col relative"
            style={{ backgroundColor: '#252030' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <LogoWithSecretClicks onClose={onClose} />

            <h2 className="text-2xl sm:text-3xl text-white text-center mb-3 sm:mb-4 font-bold">
              {mode === 'login' ? 'Вход в систему' : 'Регистрация'}
            </h2>

            <p className="text-white text-center mb-6 sm:mb-8 text-sm sm:text-base">
              {mode === 'login'
                ? 'Получите персональные рекомендации и полезные материалы'
                : 'Создайте аккаунт для доступа ко всем функциям'}
            </p>

            {message && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${
                message.includes('успешн') || message.includes('Вход') || message.includes('Регистрация')
                  ? 'bg-green-600 text-white'
                  : 'bg-red-600 text-white'
              }`}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  ref={emailInputRef}
                  type="email"
                  placeholder={mode === 'login' ? 'Email или имя пользователя' : 'Email'}
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    setTouchedFields(prev => new Set(prev).add('email'));
                    setMessage(''); // очищаем сообщение при вводе
                    validateField('email', e.target.value);

                    // Проверка уникальности email при регистрации (с debounce)
                    if (mode === 'register') {
                      if (emailCheckTimeoutRef.current) {
                        clearTimeout(emailCheckTimeoutRef.current);
                      }
                      emailCheckTimeoutRef.current = window.setTimeout(() => {
                        checkEmailUnique(e.target.value);
                      }, 500);
                    }
                  }}
                  onBlur={() => {
                    setTouchedFields(prev => new Set(prev).add('email'));
                    // В режиме регистрации проверяем формат и уникальность email
                    if (mode === 'register' && formData.email) {
                      validateField('email'); // Показываем ошибку формата если есть
                      checkEmailUnique(formData.email); // Проверяем уникальность (только для полных email)
                    }
                  }}
                  autoComplete={mode === 'login' ? 'username' : 'email'}
                  className="w-full px-4 py-3 rounded-2xl bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              {(errors.email || errors.general) && (
                <div className="mt-0 pl-3">
                  {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
                  {errors.general && <p className="text-red-500 text-xs">{errors.general}</p>}
                </div>
              )}

              {mode === 'register' && (
                <div>
                  <input
                    type="text"
                    placeholder="Имя"
                    maxLength={50}
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      setTouchedFields(prev => new Set(prev).add('name'));
                      validateField('name', e.target.value);
                    }}
                    onBlur={() => {
                      setTouchedFields(prev => new Set(prev).add('name'));
                      validateField('name');
                    }}
                    autoComplete="name"
                    className="w-full px-4 py-3 rounded-2xl bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}
              {mode === 'register' && errors.name && (
                <p className="text-red-500 text-xs mt-0 pl-3">{errors.name}</p>
              )}

              <div className="relative">
                <input
                  type={showPassword ? "password" : "text"}
                  placeholder="Пароль"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    setTouchedFields(prev => new Set(prev).add('password'));
                    setMessage(''); // очищаем сообщение при вводе
                    validateField('password', e.target.value);
                    // Если изменяем пароль, проверяем и подтверждение
                    if (touchedFields.has('confirmPassword')) {
                      validateField('confirmPassword');
                    }
                  }}
                  onBlur={() => {
                    setTouchedFields(prev => new Set(prev).add('password'));
                    validateField('password');
                    // Если изменяем пароль, проверяем и подтверждение
                    if (touchedFields.has('confirmPassword')) {
                      validateField('confirmPassword');
                    }
                  }}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="w-full px-4 py-3 pr-12 rounded-2xl bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                  style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif !important', fontSize: '16px !important' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-[52px] text-gray-400 hover:text-white"
                  aria-label={showPassword ? "Показать пароль" : "Скрыть пароль"}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-0 pl-3">{errors.password}</p>}

              {mode === 'register' && (
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "password" : "text"}
                    placeholder="Подтвердите пароль"
                    value={formData.confirmPassword}
                    onChange={(e) => {
                      setFormData({ ...formData, confirmPassword: e.target.value });
                      setTouchedFields(prev => new Set(prev).add('confirmPassword'));
                      validateField('confirmPassword', e.target.value);
                    }}
                    onBlur={() => {
                      setTouchedFields(prev => new Set(prev).add('confirmPassword'));
                      validateField('confirmPassword');
                    }}
                    autoComplete="new-password"
                    className="w-full px-4 py-3 pr-12 rounded-2xl bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif !important', fontSize: '16px !important' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-[52px] text-gray-400 hover:text-white"
                    aria-label={showConfirmPassword ? "Показать пароль" : "Скрыть пароль"}
                  >
                    {showConfirmPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              )}
              {mode === 'register' && errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-0 pl-3">{errors.confirmPassword}</p>
              )}

              <button
                type="submit"
                disabled={isLoading || (mode === 'register' && !formData.termsAccepted)}
                className="w-full py-4 rounded-3xl bg-[#3B175C] hover:bg-[#452066] hover:shadow-md hover:shadow-primary/30 text-white font-semibold transition-all duration-500 ease-out disabled:opacity-50 disabled:hover:bg-[#3B175C] disabled:hover:shadow-none"
              >
                {isLoading ? 'Загрузка...' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => handleModeChange(mode === 'login' ? 'register' : 'login')}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                {mode === 'login'
                  ? 'Нет аккаунта? Зарегистрироваться'
                  : 'Уже есть аккаунт? Войти'}
              </button>
            </div>


            {mode === 'register' && (
              <div>
                <div className="mt-6 flex items-start">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={formData.termsAccepted}
                    onChange={(e) => {
                      setFormData({ ...formData, termsAccepted: e.target.checked });
                    }}
                    className="mt-0.5 mr-3 w-4 h-4"
                  />
                  <label htmlFor="terms" className="text-gray-400 text-xs leading-tight">
                    Я принимаю{' '}
                    <a href="#" className="underline hover:text-gray-300 transition-colors">
                      условия использования сайта
                    </a>
                    , согласен с{' '}
                    <a href="#" className="underline hover:text-gray-300 transition-colors">
                      политикой обработки персональных данных
                    </a>
                  </label>
                </div>
                {errors.termsAccepted && <p className="text-red-500 text-xs mt-0 pl-3">{errors.termsAccepted}</p>}
              </div>
            )}

            {onSkip && mode === 'login' && (
              <div className="mt-4 pt-4 border-t border-white/10 flex justify-center">
                <div className="relative group">
                  <button
                    onClick={() => {
                      onClose();
                      onSkip();
                    }}
                    className="text-xs text-gray-400 hover:text-white transition-colors underline inline-flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Пропустить авторизацию
                  </button>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1.5 bg-gray-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50" style={{
                    fontFamily: 'Uralsib-Light, sans-serif',
                    textRendering: 'geometricPrecision',
                    WebkitFontSmoothing: 'antialiased',
                    MozOsxFontSmoothing: 'grayscale',
                    fontFeatureSettings: '"kern" 1',
                    letterSpacing: '0.01em'
                  }}>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-800"></div>
                    ⚠️ Ваши результаты не сохранятся
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
