export type GameState = 'start' | 'playing' | 'paused' | 'gameOver';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface FinancialItem {
  id: string;
  type: 'good' | 'bad';
  category: 'card' | 'investment' | 'saving' | 'loan' | 'scam';
  name: string;
  color: number;
  position: { x: number; y: number; z: number };
  mesh?: any; // THREE.Mesh
}

export interface GameConfig {
  speed: number;
  spawnRate: number;
  lanePositions: number[];
}

export interface GameCallbacks {
  onScoreChange: (score: number) => void;
  onGameOver: (finalScore: number) => void;
}