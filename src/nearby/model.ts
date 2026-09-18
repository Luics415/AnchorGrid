import {
  MODE_CONFIG,
  type PlayerProfile,
  type Seat
} from '../game';
import type {
  NearbyDevice,
  NearbyGamePlan,
  NearbyLobbyState,
  NearbyPlatform,
  NearbySeatAssignment
} from './types';

const SEAT_LABEL: Record<Seat, string> = {
  north: 'Norte',
  east: 'Este',
  south: 'Sur',
  west: 'Oeste'
};

const TEAM_PURPLE: Seat[] = ['north', 'south'];
const TEAM_ORANGE: Seat[] = ['east', 'west'];

function makeId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2)}`;
}

export function getOrCreateNearbyDeviceId() {
  const key = 'anchorgrid-nearby-device-id';
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;

  const value = makeId('device');
  sessionStorage.setItem(key, value);
  return value;
}

export function createNearbyLobby(input: {
  mode: NearbyLobbyState['mode'];
  themeId: NearbyLobbyState['themeId'];
  deviceId: string;
  deviceName: string;
  platform?: NearbyPlatform;
  now?: number;
}): NearbyLobbyState {
  const config = MODE_CONFIG[input.mode];
  const firstSeat = config.seats[0];
  const host: NearbyDevice = {
    id: input.deviceId,
    name: input.deviceName,
    platform: input.platform ?? 'web',
    connected: true,
    isHost: true
  };

  return {
    id: makeId('nearby'),
    mode: input.mode,
    themeId: input.themeId,
    createdAt: input.now ?? Date.now(),
    hostDeviceId: input.deviceId,
    localDeviceId: input.deviceId,
    devices: {
      [input.deviceId]: host
    },
    assignments: {
      [firstSeat]: {
        seat: firstSeat,
        deviceId: input.deviceId,
        playerName: input.deviceName
      }
    }
  };
}

export function upsertNearbyDevice(
  lobby: NearbyLobbyState,
  device: NearbyDevice
): NearbyLobbyState {
  return {
    ...lobby,
    devices: {
      ...lobby.devices,
      [device.id]: device
    }
  };
}

export function assignNearbySeat(
  lobby: NearbyLobbyState,
  seat: Seat,
  deviceId: string,
  playerName: string
): NearbyLobbyState {
  const config = MODE_CONFIG[lobby.mode];
  if (!config.seats.includes(seat)) return lobby;

  const existing = lobby.assignments[seat];
  if (existing && existing.deviceId !== deviceId) return lobby;
  if (!lobby.devices[deviceId]) return lobby;

  return {
    ...lobby,
    assignments: {
      ...lobby.assignments,
      [seat]: {
        seat,
        deviceId,
        playerName: playerName.trim() || SEAT_LABEL[seat]
      }
    }
  };
}

export function releaseNearbySeat(
  lobby: NearbyLobbyState,
  seat: Seat,
  deviceId: string
): NearbyLobbyState {
  const existing = lobby.assignments[seat];
  if (!existing || existing.deviceId !== deviceId) return lobby;

  const nextAssignments = { ...lobby.assignments };
  delete nextAssignments[seat];

  return {
    ...lobby,
    assignments: nextAssignments
  };
}

export function toggleLocalNearbySeat(
  lobby: NearbyLobbyState,
  seat: Seat,
  fallbackName: string
): NearbyLobbyState {
  const existing = lobby.assignments[seat];

  if (existing?.deviceId === lobby.localDeviceId) {
    return releaseNearbySeat(lobby, seat, lobby.localDeviceId);
  }

  if (existing) return lobby;

  return assignNearbySeat(
    lobby,
    seat,
    lobby.localDeviceId,
    fallbackName
  );
}

export function updateLocalNearbySeatName(
  lobby: NearbyLobbyState,
  seat: Seat,
  playerName: string
): NearbyLobbyState {
  const existing = lobby.assignments[seat];
  if (!existing || existing.deviceId !== lobby.localDeviceId) return lobby;

  return {
    ...lobby,
    assignments: {
      ...lobby.assignments,
      [seat]: {
        ...existing,
        playerName
      }
    }
  };
}

export function claimNearbyTeam(
  lobby: NearbyLobbyState,
  team: 'purple' | 'orange',
  baseName: string
): NearbyLobbyState {
  if (lobby.mode !== 'team2v2') return lobby;

  const seats = team === 'purple' ? TEAM_PURPLE : TEAM_ORANGE;
  let next = lobby;

  // A team preset means "this device controls this whole team".
  // Release any other seats currently owned by this device first, but never
  // touch seats owned by another nearby device.
  for (const seat of MODE_CONFIG[lobby.mode].seats) {
    if (
      !seats.includes(seat) &&
      next.assignments[seat]?.deviceId === lobby.localDeviceId
    ) {
      next = releaseNearbySeat(next, seat, lobby.localDeviceId);
    }
  }

  for (const seat of seats) {
    const owner = next.assignments[seat];
    if (owner && owner.deviceId !== lobby.localDeviceId) continue;

    next = assignNearbySeat(
      next,
      seat,
      lobby.localDeviceId,
      owner?.playerName || `${baseName} · ${SEAT_LABEL[seat]}`
    );
  }

  return next;
}

export function claimAllNearbySeats(
  lobby: NearbyLobbyState,
  baseName: string
): NearbyLobbyState {
  let next = lobby;

  for (const seat of MODE_CONFIG[lobby.mode].seats) {
    const owner = next.assignments[seat];
    if (owner && owner.deviceId !== lobby.localDeviceId) continue;

    next = assignNearbySeat(
      next,
      seat,
      lobby.localDeviceId,
      owner?.playerName || (
        seat === MODE_CONFIG[lobby.mode].seats[0]
          ? baseName
          : `Jugador ${SEAT_LABEL[seat]}`
      )
    );
  }

  return next;
}

export function missingNearbySeats(lobby: NearbyLobbyState): Seat[] {
  return MODE_CONFIG[lobby.mode].seats.filter(
    (seat) => !lobby.assignments[seat]
  );
}

export function fillMissingNearbySeatsOnHost(
  lobby: NearbyLobbyState
): NearbyLobbyState {
  let next = lobby;
  let guestIndex = 2;

  for (const seat of missingNearbySeats(next)) {
    next = assignNearbySeat(
      next,
      seat,
      lobby.hostDeviceId,
      `Jugador ${guestIndex}`
    );
    guestIndex += 1;
  }

  return next;
}

export function buildNearbyGamePlan(
  lobby: NearbyLobbyState
): NearbyGamePlan & { players: PlayerProfile[] } {
  const complete = fillMissingNearbySeatsOnHost(lobby);
  const seats = MODE_CONFIG[complete.mode].seats;

  const players: PlayerProfile[] = seats.map((seat) => {
    const assignment = complete.assignments[seat]!;
    return {
      id: `nearby-${assignment.deviceId}-${seat}`,
      name: assignment.playerName.trim() || SEAT_LABEL[seat],
      seat
    };
  });

  const localPlayerIds = seats
    .map((seat) => complete.assignments[seat]!)
    .filter((assignment) => assignment.deviceId === complete.localDeviceId)
    .map((assignment) => `nearby-${assignment.deviceId}-${assignment.seat}`);

  return {
    lobby: complete,
    players,
    localPlayerIds
  };
}

export function nearbySeatLabel(seat: Seat) {
  return SEAT_LABEL[seat];
}
