import { describe, expect, it } from 'vitest';
import { getNextConnectedHost } from './hostElection';
import type { RoomRecord } from './types';

function room(connectivity: Record<string, boolean>): RoomRecord {
  const players = {
    n: { uid: 'n', name: 'N', seat: 'north' as const, connected: connectivity.n ?? true, joinedAt: 1, lastSeenAt: 1 },
    e: { uid: 'e', name: 'E', seat: 'east' as const, connected: connectivity.e ?? true, joinedAt: 1, lastSeenAt: 1 },
    s: { uid: 's', name: 'S', seat: 'south' as const, connected: connectivity.s ?? true, joinedAt: 1, lastSeenAt: 1 },
    w: { uid: 'w', name: 'W', seat: 'west' as const, connected: connectivity.w ?? true, joinedAt: 1, lastSeenAt: 1 }
  };

  return {
    code: '4826',
    meta: { mode: 'freeForAll', themeId: 'aurora', status: 'playing', createdAt: 1, updatedAt: 1, expiresAt: 99, requiredPlayers: 4 },
    authority: { hostUid: 'n', epoch: 3, claimedAt: 1 },
    players,
    game: null,
    rematchVotes: {}
  };
}

describe('host election', () => {
  it('chooses the next connected seat clockwise', () => {
    expect(getNextConnectedHost(room({ n: false }))?.uid).toBe('e');
  });

  it('skips disconnected seats', () => {
    expect(getNextConnectedHost(room({ n: false, e: false }))?.uid).toBe('s');
  });

  it('does nothing while the current host is connected', () => {
    expect(getNextConnectedHost(room({ n: true }))).toBeNull();
  });

  it('returns null if nobody remains connected', () => {
    expect(getNextConnectedHost(room({ n: false, e: false, s: false, w: false }))).toBeNull();
  });
});
