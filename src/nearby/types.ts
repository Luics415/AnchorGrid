import type { GameMode, Seat, ThemeId } from '../game';

export type NearbyPlatform = 'android' | 'ios' | 'web' | 'unknown';

export interface NearbyDevice {
  id: string;
  name: string;
  platform: NearbyPlatform;
  connected: boolean;
  isHost: boolean;
}

export interface NearbySeatAssignment {
  seat: Seat;
  deviceId: string;
  playerName: string;
}

export interface NearbyLobbyState {
  id: string;
  mode: GameMode;
  themeId: ThemeId;
  createdAt: number;
  hostDeviceId: string;
  localDeviceId: string;
  devices: Record<string, NearbyDevice>;
  assignments: Partial<Record<Seat, NearbySeatAssignment>>;
}

export interface NearbyGamePlan {
  lobby: NearbyLobbyState;
  localPlayerIds: string[];
}
