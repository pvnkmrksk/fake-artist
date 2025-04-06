
export interface Player {
  id: number;
  name: string;
  colorIndex: number;
  isImposter?: boolean;
  isOnline?: boolean;
  socketId?: string;
}

export interface GameConfig {
  playerCount: number;
  roundCount: number;
  isMultiplayer?: boolean;
  isHost?: boolean;
  roomId?: string;
}

export interface Stroke {
  points: {x: number, y: number}[];
  color: string;
  width: number;
  playerId: number;
  timestamp?: number;
}

export type GamePhase = 
  | 'setup' 
  | 'playerConfig' 
  | 'wordReveal' 
  | 'drawing' 
  | 'voting' 
  | 'results';

export interface DrawingAction {
  type: 'start' | 'move' | 'end';
  point?: {x: number, y: number};
  playerId: number;
  color: string;
  strokeId?: string;
}

export interface GameRoom {
  id: string;
  hostId: string;
  players: Player[];
  gameConfig?: GameConfig;
  currentPhase: GamePhase;
  secretWord?: string;
  strokes: Stroke[];
}
