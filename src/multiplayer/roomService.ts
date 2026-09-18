import {
  get,
  onDisconnect,
  onValue,
  ref,
  runTransaction,
  serverTimestamp,
  update
} from 'firebase/database';
import {
  MODE_CONFIG,
  SEAT_ORDER,
  TEAM_BY_SEAT,
  applyGameAction,
  createGameState,
  type GameAction,
  type GameMode,
  type GameState,
  type PlayerState,
  type ThemeId,
  type Wall
} from '../game';
import {
  REACTION_EMOJIS,
  type ReactionEmoji,
  type ReactionEvent
} from '../reactions';
import { ensureAnonymousUser, getFirebase } from './firebase';
import type { RoomPlayer, RoomRecord } from './types';
import { getNextConnectedHost } from './hostElection';

const ROOM_TTL_MS = 12 * 60 * 60 * 1000;
const REACTION_TTL_MS = 12_000;
const MAX_REACTIONS = 16;

function roomRef(code: string) {
  return ref(getFirebase().database, `rooms/${code}`);
}

type FirebaseList<T> =
  | T[]
  | Record<string, T>
  | null
  | undefined;

type FirebaseGameState =
  Omit<GameState, 'players' | 'walls' | 'turnOrder'> & {
    players?: FirebaseList<PlayerState>;
    walls?: FirebaseList<Wall>;
    turnOrder?: FirebaseList<string>;
  };

function firebaseListToArray<T>(value: FirebaseList<T>): T[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is T => item != null);
  }

  if (!value) return [];

  return Object.keys(value)
    .sort((a, b) => Number(a) - Number(b))
    .map((key) => value[key])
    .filter((item): item is T => item != null);
}

function hydrateGameState(
  raw: FirebaseGameState | null | undefined,
  roomPlayers: Record<string, RoomPlayer>
): GameState | null {
  if (!raw) return null;

  const players = firebaseListToArray(raw.players).map((player) => ({
    ...player,
    connected: roomPlayers?.[player.id]?.connected ?? false,
    inactivityWarnings: player.inactivityWarnings ?? 0
  }));

  return {
    ...raw,
    players,
    walls: firebaseListToArray(raw.walls),
    turnOrder: firebaseListToArray(raw.turnOrder),
    turn: {
      ...raw.turn,
      phase: raw.turn?.phase ?? 'active'
    }
  } as GameState;
}

function normalizeRoom(
  code: string,
  value: Omit<RoomRecord, 'code'> | null
): RoomRecord | null {
  if (!value) return null;

  const room: RoomRecord = {
    code,
    ...value,
    game: null,
    rematchVotes: value.rematchVotes ?? {},
    reactions: value.reactions ?? {}
  };

  room.game = hydrateGameState(
    value.game as unknown as FirebaseGameState | null,
    room.players ?? {}
  );

  return room;
}

function randomCode() {
  return Math.floor(Math.random() * 10_000).toString().padStart(4, '0');
}

export function subscribeServerOffset(callback: (offsetMs: number) => void) {
  const { database } = getFirebase();

  return onValue(ref(database, '.info/serverTimeOffset'), (snapshot) => {
    callback(Number(snapshot.val() ?? 0));
  });
}

export function subscribeConnectionState(callback: (connected: boolean) => void) {
  const { database } = getFirebase();

  return onValue(ref(database, '.info/connected'), (snapshot) => {
    callback(snapshot.val() === true);
  });
}

/**
 * Re-registers onDisconnect every time Firebase reconnects. This is important:
 * onDisconnect hooks are consumed by a disconnect and need to be armed again.
 */
export function attachRoomPresence(code: string, uid: string) {
  const { database } = getFirebase();
  const infoRef = ref(database, '.info/connected');
  const playerRef = ref(database, `rooms/${code}/players/${uid}`);
  const connectedRef = ref(database, `rooms/${code}/players/${uid}/connected`);
  const lastSeenRef = ref(database, `rooms/${code}/players/${uid}/lastSeenAt`);

  return onValue(infoRef, async (snapshot) => {
    if (snapshot.val() !== true) return;

    await onDisconnect(connectedRef).set(false);
    await onDisconnect(lastSeenRef).set(serverTimestamp());

    await update(playerRef, {
      connected: true,
      lastSeenAt: serverTimestamp()
    });
  });
}

export async function createRoom(input: {
  name: string;
  mode: GameMode;
  themeId: ThemeId;
}): Promise<RoomRecord> {
  const user = await ensureAnonymousUser();
  const now = Date.now();
  const config = MODE_CONFIG[input.mode];

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const code = randomCode();
    const firstSeat = config.seats[0];

    const player: RoomPlayer = {
      uid: user.uid,
      name: input.name,
      seat: firstSeat,
      ...(input.mode === 'team2v2'
        ? { teamId: TEAM_BY_SEAT[firstSeat] }
        : {}),
      connected: true,
      joinedAt: now,
      lastSeenAt: now
    };

    const initial: Omit<RoomRecord, 'code'> = {
      meta: {
        mode: input.mode,
        themeId: input.themeId,
        status: 'lobby',
        createdAt: now,
        updatedAt: now,
        expiresAt: now + ROOM_TTL_MS,
        requiredPlayers: config.requiredPlayers
      },
      authority: {
        hostUid: user.uid,
        epoch: 1,
        claimedAt: now
      },
      players: {
        [user.uid]: player
      },
      game: null,
      rematchVotes: {},
      reactions: {}
    };

    const result = await runTransaction(
      roomRef(code),
      (current) => {
        if (
          current &&
          (!current.meta?.expiresAt || current.meta.expiresAt > now)
        ) {
          return;
        }

        return initial;
      },
      { applyLocally: false }
    );

    if (result.committed) {
      return {
        code,
        ...initial
      };
    }
  }

  throw new Error('No se pudo reservar un código de sala. Intenta de nuevo.');
}

export async function joinRoom(
  codeInput: string,
  name: string
): Promise<RoomRecord> {
  const code = codeInput.replace(/\D/g, '').slice(0, 4);

  if (code.length !== 4) {
    throw new Error('El código debe tener 4 dígitos.');
  }

  const user = await ensureAnonymousUser();
  const now = Date.now();
  const room = await getRoom(code);

  if (!room) {
    throw new Error('La sala no existe o ya expiró.');
  }

  if (room.meta.expiresAt && room.meta.expiresAt <= now) {
    throw new Error('La sala ya expiró.');
  }

  const existingPlayer = room.players?.[user.uid];

  if (room.meta.status !== 'lobby' && !existingPlayer) {
    throw new Error(
      'La partida ya comenzó y este dispositivo no tiene un asiento reservado.'
    );
  }

  const config = MODE_CONFIG[room.meta.mode];
  const playersRef = ref(
    getFirebase().database,
    `rooms/${code}/players`
  );

  const result = await runTransaction(
    playersRef,
    (currentPlayers) => {
      const players: Record<string, RoomPlayer> = currentPlayers ?? {};
      const existing = players[user.uid];

      if (existing) {
        return {
          ...players,
          [user.uid]: {
            ...existing,
            name,
            connected: true,
            lastSeenAt: now
          }
        };
      }

      const usedSeats = new Set(
        Object.values(players).map((player) => player.seat)
      );

      const seat = config.seats.find(
        (candidate) => !usedSeats.has(candidate)
      );

      if (!seat) return;

      const newPlayer: RoomPlayer = {
        uid: user.uid,
        name,
        seat,
        ...(room.meta.mode === 'team2v2'
          ? { teamId: TEAM_BY_SEAT[seat] }
          : {}),
        connected: true,
        joinedAt: now,
        lastSeenAt: now
      };

      return {
        ...players,
        [user.uid]: newPlayer
      };
    },
    {
      applyLocally: false
    }
  );

  if (!result.committed) {
    const latest = await getRoom(code);

    if (!latest) {
      throw new Error('La sala ya no existe.');
    }

    const players = Object.values(latest.players ?? {});
    const latestConfig = MODE_CONFIG[latest.meta.mode];

    if (players.length >= latestConfig.requiredPlayers) {
      throw new Error(
        `La sala está llena (${players.length}/${latestConfig.requiredPlayers}).`
      );
    }

    throw new Error(
      'No se pudo reservar el asiento. Intenta nuevamente.'
    );
  }

  await update(
    ref(getFirebase().database, `rooms/${code}/meta`),
    {
      updatedAt: now
    }
  );

  const joined = await getRoom(code);

  if (!joined?.players?.[user.uid]) {
    throw new Error(
      'El asiento se reservó, pero no pudo recuperarse.'
    );
  }

  return joined;
}

/** Resume after refresh/app restart when this anonymous Firebase user already owns a seat. */
export async function resumeRoom(codeInput: string): Promise<RoomRecord | null> {
  const code = codeInput.replace(/\D/g, '').slice(0, 4);

  if (code.length !== 4) return null;

  const user = await ensureAnonymousUser();
  const room = await getRoom(code);

  if (!room?.players?.[user.uid]) return null;

  await update(
    ref(
      getFirebase().database,
      `rooms/${code}/players/${user.uid}`
    ),
    {
      connected: true,
      lastSeenAt: serverTimestamp()
    }
  );

  return (await getRoom(code)) ?? room;
}

export async function getRoom(code: string): Promise<RoomRecord | null> {
  const snapshot = await get(roomRef(code));
  return normalizeRoom(code, snapshot.val());
}

export function subscribeRoom(
  code: string,
  callback: (room: RoomRecord | null) => void
) {
  return onValue(roomRef(code), (snapshot) => {
    callback(normalizeRoom(code, snapshot.val()));
  });
}

export async function startRoom(code: string, serverNow: number) {
  const user = await ensureAnonymousUser();
  const room = await getRoom(code);

  if (!room) {
    throw new Error('Sala no encontrada.');
  }

  if (room.authority.hostUid !== user.uid) {
    throw new Error('Solo el host puede iniciar.');
  }

  const connected = Object.values(room.players)
    .filter((player) => player.connected)
    .sort(
      (a, b) =>
        SEAT_ORDER.indexOf(a.seat) -
        SEAT_ORDER.indexOf(b.seat)
    );

  if (connected.length !== room.meta.requiredPlayers) {
    throw new Error(
      `Se necesitan ${room.meta.requiredPlayers} jugadores conectados.`
    );
  }

  const game = createGameState({
    mode: room.meta.mode,
    themeId: room.meta.themeId,
    now: serverNow,
    gameId: `${code}-${serverNow}`,
    players: connected.map((player) => ({
      id: player.uid,
      name: player.name,
      seat: player.seat
    }))
  });

  await update(roomRef(code), {
    game,
    'meta/status': 'playing',
    'meta/updatedAt': serverNow,
    rematchVotes: {},
    reactions: null
  });
}

export async function restartRoom(code: string, serverNow: number) {
  const user = await ensureAnonymousUser();
  const room = await getRoom(code);

  if (!room) {
    throw new Error('Sala no encontrada.');
  }

  if (room.authority.hostUid !== user.uid) {
    throw new Error('Solo el host puede iniciar la revancha.');
  }

  const connected = Object.values(room.players)
    .filter((player) => player.connected)
    .sort(
      (a, b) =>
        SEAT_ORDER.indexOf(a.seat) -
        SEAT_ORDER.indexOf(b.seat)
    );

  if (connected.length !== room.meta.requiredPlayers) {
    throw new Error(
      'Todos los asientos deben estar conectados para la revancha.'
    );
  }

  const game = createGameState({
    mode: room.meta.mode,
    themeId: room.meta.themeId,
    now: serverNow,
    gameId: `${code}-${serverNow}`,
    players: connected.map((player) => ({
      id: player.uid,
      name: player.name,
      seat: player.seat
    }))
  });

  await update(roomRef(code), {
    game,
    'meta/status': 'playing',
    'meta/updatedAt': serverNow,
    rematchVotes: {},
    reactions: null
  });
}

/** Return the whole room to the waiting lobby while keeping seats and presence. */
export async function returnRoomToLobby(
  code: string,
  serverNow: number
) {
  const user = await ensureAnonymousUser();
  const room = await getRoom(code);

  if (!room) {
    throw new Error('Sala no encontrada.');
  }

  if (!room.players?.[user.uid]) {
    throw new Error('No perteneces a esta sala.');
  }

  if (!room.game || room.game.status !== 'finished') {
    throw new Error('La partida todavía no ha terminado.');
  }

  await update(roomRef(code), {
    game: null,
    rematchVotes: {},
    reactions: null,
    'meta/status': 'lobby',
    'meta/updatedAt': serverNow
  });
}

/**
 * Reactions live in their own Firebase branch so sending 😹 never touches
 * /game and therefore cannot delay or conflict with a move transaction.
 */
export async function sendReaction(
  code: string,
  emoji: ReactionEmoji,
  serverNow: number
) {
  if (!REACTION_EMOJIS.includes(emoji)) return;

  const user = await ensureAnonymousUser();
  const reactionId = [
    serverNow.toString(36),
    user.uid.slice(0, 6),
    Math.random().toString(36).slice(2, 7)
  ].join('-');

  const reaction: ReactionEvent = {
    id: reactionId,
    uid: user.uid,
    emoji,
    createdAt: serverNow
  };

  await runTransaction(
    ref(getFirebase().database, `rooms/${code}/reactions`),
    (current) => {
      const source = (current ?? {}) as Record<string, ReactionEvent>;

      const freshEntries = Object.entries(source)
        .filter(([, item]) => (
          item &&
          typeof item.createdAt === 'number' &&
          serverNow - item.createdAt <= REACTION_TTL_MS
        ))
        .sort((a, b) => a[1].createdAt - b[1].createdAt)
        .slice(-(MAX_REACTIONS - 1));

      return {
        ...Object.fromEntries(freshEntries),
        [reactionId]: reaction
      };
    },
    { applyLocally: true }
  );
}

/**
 * Every connected player can vote for a rematch. When all required players
 * have voted, the final voter atomically starts a fresh game for the room.
 */
export async function voteRematch(
  code: string,
  serverNow: number
) {
  const user = await ensureAnonymousUser();
  const root = roomRef(code);

  const result = await runTransaction(
    root,
    (room) => {
      if (!room?.game || room.game.status !== 'finished') {
        return room;
      }

      if (!room.players?.[user.uid]?.connected) {
        return room;
      }

      room.rematchVotes = room.rematchVotes ?? {};
      room.rematchVotes[user.uid] = true;

      const connected = (
        Object.values(room.players) as RoomPlayer[]
      )
        .filter((player) => player.connected)
        .sort(
          (a, b) =>
            SEAT_ORDER.indexOf(a.seat) -
            SEAT_ORDER.indexOf(b.seat)
        );

      const votes = connected.filter(
        (player) => room.rematchVotes?.[player.uid]
      ).length;

      if (
        connected.length === room.meta.requiredPlayers &&
        votes === room.meta.requiredPlayers
      ) {
        room.game = createGameState({
          mode: room.meta.mode as GameMode,
          themeId: room.meta.themeId as ThemeId,
          now: serverNow,
          gameId: `${code}-${serverNow}`,
          players: connected.map((player) => ({
            id: player.uid,
            name: player.name,
            seat: player.seat
          }))
        });

        room.meta.status = 'playing';
        room.meta.updatedAt = serverNow;
        room.rematchVotes = {};
        room.reactions = {};
      }

      return room;
    },
    { applyLocally: false }
  );

  if (!result.committed) {
    throw new Error(
      'No se pudo registrar el voto de revancha.'
    );
  }
}

export async function submitAction(
  code: string,
  room: RoomRecord,
  action: GameAction,
  serverNow: number
) {
  const user = await ensureAnonymousUser();

  if (!room.game) return;

  const isOwnAction = action.playerId === user.uid;
  const isHostTimeout =
    action.type === 'TIMEOUT' &&
    room.authority.hostUid === user.uid;

  if (!isOwnAction && !isHostTimeout) {
    throw new Error(
      'Esta jugada no pertenece a este dispositivo.'
    );
  }

  const expectedRevision = room.game.revision;

  await runTransaction(
    ref(
      getFirebase().database,
      `rooms/${code}/game`
    ),
    (rawGame) => {
      const game = hydrateGameState(
        rawGame as FirebaseGameState | null,
        room.players
      );

      if (!game) return rawGame;

      if (game.revision !== expectedRevision) {
        return rawGame;
      }

      if (
        action.type !== 'TIMEOUT' &&
        game.turn.currentPlayerId !== user.uid
      ) {
        return rawGame;
      }

      if (
        action.type === 'TIMEOUT' &&
        game.turn.currentPlayerId !== action.playerId
      ) {
        return rawGame;
      }

      return applyGameAction(
        game,
        action,
        serverNow
      );
    }
  );
}

export async function attemptHostMigration(
  room: RoomRecord,
  serverNow: number
) {
  const user = await ensureAnonymousUser();
  const nextHost = getNextConnectedHost(room);

  if (!nextHost || nextHost.uid !== user.uid) {
    return false;
  }

  const authorityRef = ref(
    getFirebase().database,
    `rooms/${room.code}/authority`
  );

  const result = await runTransaction(
    authorityRef,
    (authority) => {
      if (
        !authority ||
        authority.hostUid !== room.authority.hostUid
      ) {
        return;
      }

      return {
        hostUid: user.uid,
        epoch: Number(authority.epoch ?? 0) + 1,
        claimedAt: serverNow
      };
    },
    { applyLocally: false }
  );

  return result.committed;
}

export async function leaveRoom(code: string) {
  const user = await ensureAnonymousUser();
  const now = Date.now();
  const current = await getRoom(code);

  if (!current?.players?.[user.uid]) return;

  if (
    current.meta.status === 'playing' &&
    current.game?.status !== 'finished'
  ) {
    await update(
      ref(
        getFirebase().database,
        `rooms/${code}/players/${user.uid}`
      ),
      {
        connected: false,
        lastSeenAt: serverTimestamp()
      }
    );

    return;
  }

  await runTransaction(
    roomRef(code),
    (room) => {
      if (!room?.players?.[user.uid]) {
        return room;
      }

      delete room.players[user.uid];

      const remaining = Object.values(room.players) as RoomPlayer[];

      if (remaining.length === 0) {
        return null;
      }

      if (room.rematchVotes?.[user.uid]) {
        delete room.rematchVotes[user.uid];
      }

      if (room.authority?.hostUid === user.uid) {
        const seats = MODE_CONFIG[
          room.meta.mode as GameMode
        ].seats;

        const next = [...remaining]
          .filter((player) => player.connected)
          .sort(
            (a, b) =>
              seats.indexOf(a.seat) -
              seats.indexOf(b.seat)
          )[0] ?? remaining[0];

        room.authority = {
          hostUid: next.uid,
          epoch: Number(room.authority.epoch ?? 0) + 1,
          claimedAt: now
        };
      }

      room.meta.updatedAt = now;
      return room;
    },
    { applyLocally: false }
  );
}
