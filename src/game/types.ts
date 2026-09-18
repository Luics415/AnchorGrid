export const BOARD_SIZE = 11 as const;
export const CENTER = { row: 5, col: 5 } as const;

export type GameMode = 'duel' | 'freeForAll' | 'team2v2';
export type GameStatus = 'playing' | 'finished';
export type Seat = 'north' | 'east' | 'south' | 'west';
export type TeamId = 'A' | 'B';
export type ThemeId = 'aurora' | 'bloom' | 'crystal' | 'stormlight' | 'nebula' | 'gardenPulse';
export type ThemeChoice = ThemeId | 'random';
export type WallOrientation = 'horizontal' | 'vertical';
export type MoveKind = 'step' | 'jump' | 'diagonal-jump' | 'multi-jump';

export interface Position {
  row: number;
  col: number;
}

export interface PlayerProfile {
  id: string;
  name: string;
  seat?: Seat;
}

export interface PlayerState {
  id: string;
  name: string;
  seat: Seat;
  teamId?: TeamId;
  position: Position;
  wallsRemaining: number;
  connected: boolean;
  eliminated: boolean;
}

export interface Wall {
  row: number;
  col: number;
  orientation: WallOrientation;
  ownerId: string;
}

export interface LegalMove {
  to: Position;
  kind: MoveKind;
  over?: string[];
}

export interface TurnState {
  currentPlayerId: string;
  startedAt: number;
  endsAt: number;
  durationMs: number;
}

export interface GameState {
  id: string;
  mode: GameMode;
  status: GameStatus;
  themeId: ThemeId;
  boardSize: typeof BOARD_SIZE;
  center: Position;
  players: PlayerState[];
  walls: Wall[];
  turnOrder: string[];
  turn: TurnState;
  revision: number;
  moveNumber: number;
  winnerPlayerId?: string;
  winnerTeamId?: TeamId;
  lastAction?: GameAction;
}

export type GameAction =
  | { type: 'MOVE_PAWN'; playerId: string; to: Position }
  | { type: 'PLACE_WALL'; playerId: string; wall: Wall }
  | { type: 'TIMEOUT'; playerId: string };

export interface WallValidationResult {
  valid: boolean;
  reason?:
    | 'GAME_FINISHED'
    | 'NOT_YOUR_TURN'
    | 'NO_WALLS_LEFT'
    | 'OUT_OF_BOUNDS'
    | 'OVERLAP'
    | 'CROSSING'
    | 'BLOCKS_ALL_PATHS';
}
