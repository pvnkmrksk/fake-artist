
export interface Player {
  id: number;
  name: string;
  colorIndex: number;
  isImposter?: boolean;
}

export interface GameConfig {
  playerCount: number;
  roundCount: number;
}

export interface Stroke {
  points: {x: number, y: number}[];
  color: string;
  width: number;
  playerId: number;
}

export type GamePhase = 
  | 'setup' 
  | 'playerConfig' 
  | 'wordReveal' 
  | 'drawing' 
  | 'voting' 
  | 'results';
