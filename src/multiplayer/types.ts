import type { GameMode, GameState, Seat, TeamId, ThemeId } from '../game';

export type RoomStatus = 'lobby' | 'playing';

export interface RoomMeta {
  mode: GameMode;
  themeId: ThemeId;
  status: RoomStatus;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  requiredPlayers: number;
}

export interface RoomPlayer {
  uid: string;
  name: string;
  seat: Seat;
  teamId?: TeamId;
  connected: boolean;
  joinedAt: number;
  lastSeenAt: number;
}

export interface RoomAuthority {
  hostUid: string;
  epoch: number;
  claimedAt: number;
}

export interface RoomRecord {
  code: string;
  meta: RoomMeta;
  authority: RoomAuthority;
  players: Record<string, RoomPlayer>;
  game: GameState | null;
  rematchVotes: Record<string, boolean>;
}
