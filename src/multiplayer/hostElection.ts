import { MODE_CONFIG } from '../game';
import type { RoomPlayer, RoomRecord } from './types';

/**
 * Pure deterministic election used by every client. No network calls here,
 * which makes host migration independently testable.
 */
export function getNextConnectedHost(room: RoomRecord): RoomPlayer | null {
  const current = room.players[room.authority.hostUid];
  if (current?.connected) return null;

  const seats = MODE_CONFIG[room.meta.mode].seats;
  const connected = Object.values(room.players).filter((player) => player.connected);
  if (!connected.length) return null;

  if (!current) {
    return [...connected].sort((a, b) => seats.indexOf(a.seat) - seats.indexOf(b.seat))[0] ?? null;
  }

  const start = seats.indexOf(current.seat);
  for (let offset = 1; offset <= seats.length; offset += 1) {
    const seat = seats[(start + offset) % seats.length];
    const candidate = connected.find((player) => player.seat === seat);
    if (candidate) return candidate;
  }

  return null;
}
