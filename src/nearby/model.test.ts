import { describe, expect, it } from 'vitest';
import {
  assignNearbySeat,
  buildNearbyGamePlan,
  claimNearbyTeam,
  createNearbyLobby,
  fillMissingNearbySeatsOnHost,
  missingNearbySeats,
  upsertNearbyDevice
} from './model';

function duelLobby() {
  return createNearbyLobby({
    mode: 'duel',
    themeId: 'aurora',
    deviceId: 'host',
    deviceName: 'Luics',
    platform: 'web',
    now: 1
  });
}

describe('nearby lobby seat allocation', () => {
  it('lets the host start alone by filling remaining seats locally', () => {
    const filled = fillMissingNearbySeatsOnHost(duelLobby());
    expect(missingNearbySeats(filled)).toEqual([]);

    const plan = buildNearbyGamePlan(filled);
    expect(plan.players).toHaveLength(2);
    expect(plan.localPlayerIds).toHaveLength(2);
  });

  it('supports three devices where one device controls the fourth player', () => {
    let lobby = createNearbyLobby({
      mode: 'freeForAll',
      themeId: 'nebula',
      deviceId: 'host',
      deviceName: 'Luics',
      platform: 'android',
      now: 1
    });

    lobby = upsertNearbyDevice(lobby, {
      id: 'iphone-a',
      name: 'Azlynn',
      platform: 'ios',
      connected: true,
      isHost: false
    });

    lobby = upsertNearbyDevice(lobby, {
      id: 'iphone-b',
      name: 'Amigo',
      platform: 'ios',
      connected: true,
      isHost: false
    });

    lobby = assignNearbySeat(lobby, 'east', 'iphone-a', 'Azlynn');
    lobby = assignNearbySeat(lobby, 'south', 'iphone-b', 'Amigo');

    const plan = buildNearbyGamePlan(lobby);

    expect(plan.players).toHaveLength(4);
    expect(plan.localPlayerIds).toHaveLength(2);
  });

  it('can assign an entire 2v2 team to one device', () => {
    let lobby = createNearbyLobby({
      mode: 'team2v2',
      themeId: 'bloom',
      deviceId: 'purple-phone',
      deviceName: 'Morado',
      platform: 'ios',
      now: 1
    });

    lobby = claimNearbyTeam(lobby, 'purple', 'Morado');

    expect(lobby.assignments.north?.deviceId).toBe('purple-phone');
    expect(lobby.assignments.south?.deviceId).toBe('purple-phone');
  });
});
