import axios from 'axios';

// В разработке используем относительные пути (прокси в Vite)
// В проде используем API_URL из переменных окружения
const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: (API_URL || '') + '/api', // добавляем /api для prod
  withCredentials: true, // для refresh token cookie
  headers: {
    'Content-Type': 'application/json',
  },
});

let accessToken: string | null = localStorage.getItem('accessToken');

// Функция для установки access токена
export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    localStorage.setItem('accessToken', token);
  } else {
    localStorage.removeItem('accessToken');
  }
};

// Интерцептор запросов
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Убрали интерцептор ответов для избежания бесконечного цикла refresh
// Обновление токенов управляется через AuthContext

export default api;
