import { MODE_CONFIG, SEAT_ORDER, START_POSITIONS, TEAM_BY_SEAT, TURN_DURATION_MS } from './config';
import { BOARD_SIZE, CENTER, type GameMode, type GameState, type PlayerProfile, type PlayerState, type Seat, type ThemeId } from './types';

function id() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export function createGameState(input: {
  mode: GameMode;
  themeId: ThemeId;
  players: PlayerProfile[];
  now?: number;
  gameId?: string;
}): GameState {
  const config = MODE_CONFIG[input.mode];
  if (input.players.length !== config.requiredPlayers) {
    throw new Error(`${input.mode} requires exactly ${config.requiredPlayers} players.`);
  }

  const now = input.now ?? Date.now();
  const occupiedSeats = new Set<Seat>();

  const players: PlayerState[] = input.players.map((profile, index) => {
    const seat = profile.seat ?? config.seats[index];
    if (!config.seats.includes(seat) || occupiedSeats.has(seat)) {
      throw new Error(`Invalid or duplicated seat: ${seat}`);
    }
    occupiedSeats.add(seat);

    return {
      id: profile.id,
      name: profile.name,
      seat,
      teamId: input.mode === 'team2v2' ? TEAM_BY_SEAT[seat] : undefined,
      position: { ...START_POSITIONS[seat] },
      wallsRemaining: config.wallsPerPlayer,
      connected: true,
      eliminated: false,
      inactivityWarnings: 0
    };
  });

  const order = SEAT_ORDER
    .filter((seat) => config.seats.includes(seat))
    .map((seat) => players.find((player) => player.seat === seat)!.id);

  const firstPlayerId = order[0];

  return {
    id: input.gameId ?? id(),
    mode: input.mode,
    status: 'playing',
    themeId: input.themeId,
    boardSize: BOARD_SIZE,
    center: { ...CENTER },
    players,
    walls: [],
    turnOrder: order,
    turn: {
      currentPlayerId: firstPlayerId,
      startedAt: now,
      endsAt: now + TURN_DURATION_MS,
      durationMs: TURN_DURATION_MS,
      phase: 'active'
    },
    revision: 1,
    moveNumber: 1
  };
}
