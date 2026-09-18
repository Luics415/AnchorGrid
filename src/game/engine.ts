import { INACTIVITY_GRACE_MS, TURN_DURATION_MS } from './config';
import { getLegalMoves } from './movement';
import { samePosition } from './geometry';
import { validateWallPlacement } from './walls';
import type { GameAction, GameState, PlayerState } from './types';

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
        durationMs: TURN_DURATION_MS,
        phase: 'active'
      };
      return;
    }
  }
}

/**
 * A 30 s timeout no longer eliminates or disconnects anyone.
 * First expiration: show the player an inactivity warning and grant a short grace period.
 * Second expiration: skip only that turn and continue the match.
 */
function applyTimeout(state: GameState, player: PlayerState, now: number) {
  if (state.turn.phase !== 'warning') {
    player.inactivityWarnings = (player.inactivityWarnings ?? 0) + 1;
    state.turn = {
      currentPlayerId: player.id,
      startedAt: now,
      endsAt: now + INACTIVITY_GRACE_MS,
      durationMs: INACTIVITY_GRACE_MS,
      phase: 'warning'
    };
    return 'warning' as const;
  }

  setNextTurn(state, now);
  return 'skipped' as const;
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

  let incrementMoveNumber = false;

  if (action.type === 'MOVE_PAWN') {
    const legalMove = getLegalMoves(original, action.playerId).find((move) => samePosition(move.to, action.to));
    if (!legalMove) return original;

    player.position = { ...action.to };
    incrementMoveNumber = true;

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
    incrementMoveNumber = true;
    setNextTurn(state, now);
  }

  if (action.type === 'TIMEOUT') {
    if (now < original.turn.endsAt) return original;
    const timeoutResult = applyTimeout(state, player, now);
    incrementMoveNumber = timeoutResult === 'skipped';
  }

  state.revision += 1;
  if (incrementMoveNumber) state.moveNumber += 1;
  state.lastAction = action;
  return state;
}
