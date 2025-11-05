import { GameConfig } from './types';

export const DIFFICULTY_CONFIGS: Record<string, GameConfig> = {
  easy: {
    speed: 2,
    spawnRate: 3000,
    lanePositions: [-4, 0, 4], // 3 полосы на широкой дороге
  },
  medium: {
    speed: 3,
    spawnRate: 2500,
    lanePositions: [-4, 0, 4],
  },
  hard: {
    speed: 4,
    spawnRate: 2000,
    lanePositions: [-4, 0, 4],
  },
};

// Финансовые объекты для сбора/избегания
// Используем брендовые цвета Уралсиб
export const FINANCIAL_ITEMS = {
  // Хорошие объекты (зеленые - успех)
  good: [
    { name: 'Накопления', category: 'saving', color: 0x10B981 }, // success
    { name: 'Инвестиции', category: 'investment', color: 0x059669 }, // success-600
    { name: 'Дебетовая карта', category: 'card', color: 0x047857 }, // success-700
    { name: 'Кешбэк', category: 'card', color: 0x065F46 }, // success-800
    { name: 'Вклад', category: 'saving', color: 0x064E3B }, // success-900
  ],
  // Плохие объекты (красные - ошибка)
  bad: [
    { name: 'Мошенники', category: 'scam', color: 0xEF4444 }, // error
    { name: 'Кредит без цели', category: 'loan', color: 0xDC2626 }, // error-600
    { name: 'Импульсивная покупка', category: 'loan', color: 0xB91C1C }, // error-700
    { name: 'Пирамида', category: 'scam', color: 0x991B1B }, // error-800
    { name: 'Микрозайм', category: 'loan', color: 0x7F1D1D }, // error-900
  ],
} as const;

export const LANE_COUNT = 3;
export const GAME_AREA_WIDTH = 20;
export const GAME_AREA_HEIGHT = 460;