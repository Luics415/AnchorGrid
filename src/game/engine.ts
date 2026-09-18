import { TURN_DURATION_MS } from './config';
import { getLegalMoves } from './movement';
import { samePosition } from './geometry';
import { validateWallPlacement } from './walls';
import type { GameAction, GameState, PlayerState, TeamId } from './types';

function cloneState(state: GameState): GameState {
  return {
    ...state,
    center: { ...state.center },
    players: state.players.map((player) => ({ ...player, position: { ...player.position } })),
    walls: state.walls.map((wall) => ({ ...wall })),
    turnOrder: [...state.turnOrder],
    turn: { ...state.turn }
  };
}

function playerReachedGoal(state: GameState, player: PlayerState) {
  if (state.mode === 'duel') {
    return (
      (player.seat === 'north' && player.position.row === 10) ||
      (player.seat === 'south' && player.position.row === 0)
    );
  }
  return samePosition(player.position, state.center);
}

function finishForPlayer(state: GameState, player: PlayerState) {
  state.status = 'finished';
  if (state.mode === 'team2v2') {
    state.winnerTeamId = player.teamId;
  } else {
    state.winnerPlayerId = player.id;
  }
}

function activePlayers(state: GameState) {
  return state.players.filter((player) => !player.eliminated);
}

function activeTeam(state: GameState, teamId: TeamId) {
  return state.players.some((player) => player.teamId === teamId && !player.eliminated);
}

function setNextTurn(state: GameState, now: number) {
  const currentIndex = state.turnOrder.indexOf(state.turn.currentPlayerId);

  for (let offset = 1; offset <= state.turnOrder.length; offset += 1) {
    const id = state.turnOrder[(currentIndex + offset) % state.turnOrder.length];
    const player = state.players.find((candidate) => candidate.id === id);
    if (player && !player.eliminated) {
      state.turn = {
        currentPlayerId: id,
        startedAt: now,
        endsAt: now + TURN_DURATION_MS,
        durationMs: TURN_DURATION_MS
      };
      return;
    }
  }
}

function applyTimeout(state: GameState, player: PlayerState, now: number) {
  if (state.mode === 'duel') {
    const winner = state.players.find((candidate) => candidate.id !== player.id && !candidate.eliminated);
    state.status = 'finished';
    state.winnerPlayerId = winner?.id;
    return;
  }

  player.eliminated = true;

  if (state.mode === 'freeForAll') {
    const remaining = activePlayers(state);
    if (remaining.length === 1) {
      state.status = 'finished';
      state.winnerPlayerId = remaining[0].id;
      return;
    }
  }

  if (state.mode === 'team2v2') {
    const losingTeam = player.teamId!;
    if (!activeTeam(state, losingTeam)) {
      state.status = 'finished';
      state.winnerTeamId = losingTeam === 'A' ? 'B' : 'A';
      return;
    }
  }

  setNextTurn(state, now);
}

export function applyGameAction(
  original: GameState,
  action: GameAction,
  now = Date.now()
): GameState {
  if (original.status !== 'playing') return original;
  if (original.turn.currentPlayerId !== action.playerId) return original;

  const state = cloneState(original);
  const player = state.players.find((candidate) => candidate.id === action.playerId);
  if (!player || player.eliminated) return original;

  if (action.type === 'MOVE_PAWN') {
    const legalMove = getLegalMoves(original, action.playerId).find((move) => samePosition(move.to, action.to));
    if (!legalMove) return original;

    player.position = { ...action.to };

    if (playerReachedGoal(state, player)) {
      finishForPlayer(state, player);
    } else {
      setNextTurn(state, now);
    }
  }

  if (action.type === 'PLACE_WALL') {
    const validation = validateWallPlacement(original, action.playerId, action.wall);
    if (!validation.valid) return original;

    state.walls.push({ ...action.wall, ownerId: action.playerId });
    player.wallsRemaining -= 1;
    setNextTurn(state, now);
  }

  if (action.type === 'TIMEOUT') {
    if (now < original.turn.endsAt) return original;
    applyTimeout(state, player, now);
  }

  state.revision += 1;
  state.moveNumber += 1;
  state.lastAction = action;
  return state;
}
