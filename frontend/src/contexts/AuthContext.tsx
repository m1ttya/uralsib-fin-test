import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api, { setAccessToken } from '../lib/api';

interface User {
  user_id: number;
  email: string | null;
  username: string | null;
  name: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface RegisterData {
  email: string;
  username?: string;
  password: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (login: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Вспомогательная функция для установки токена
  const setToken = (token: string | null) => {
    setAccessToken(token);
  };

  // Проверка аутентификации
  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/users/me');

      if (response.data.ok) {
        setUser(response.data.user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Check auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Обновление токена
  const refresh = async (): Promise<void> => {
    try {
      const response = await api.post('/users/refresh', {});

      if (response.data.ok && response.data.accessToken) {
        setToken(response.data.accessToken);
        await checkAuth();
      } else {
        throw new Error('Refresh failed');
      }
    } catch (error) {
      // Refresh не удался, очищаем состояние
      setUser(null);
      setIsAuthenticated(false);
      setToken(null);
      throw error;
    }
  };

  // Вход
  const login = async (login: string, password: string): Promise<void> => {
    const response = await api.post('/users/login', { login, password });

    const data = response.data;

    if (!response.data.ok) {
      throw new Error(data.error || 'Ошибка входа');
    }

    // Сохраняем access токен
    if (data.accessToken) {
      setToken(data.accessToken);
    }

    setUser(data.user);
    setIsAuthenticated(true);

    // Проверяем redirect URL
    const redirectUrl = sessionStorage.getItem('redirectUrl');
    if (redirectUrl) {
      sessionStorage.removeItem('redirectUrl');
      window.location.href = redirectUrl;
    }
  };

  // Регистрация
  const register = async (data: RegisterData): Promise<void> => {
    const response = await api.post('/users/register', data);

    const result = response.data;

    if (!result.ok) {
      const error = result.error || 'Ошибка регистрации';
      if (result.details) {
        // Формируем сообщение об ошибке из details
        const errorMessages = Object.values(result.details).join(', ');
        throw new Error(errorMessages);
      }
      throw new Error(error);
    }

    // Регистрация прошла успешно, но пользователь не авторизован
    // Нужно войти в систему
    await login(data.email, data.password);
  };

  // Выход
  const logout = async (): Promise<void> => {
    try {
      await api.post('/users/logout', {});
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setToken(null);
    }
  };

  // Инициализация при загрузке
  useEffect(() => {
    checkAuth();
  }, []);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refresh,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
