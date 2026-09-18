import { describe, expect, it } from 'vitest';
import { createGameState } from './createGame';
import { applyGameAction } from './engine';
import { getLegalMoves } from './movement';
import { validateWallPlacement } from './walls';
import type { GameState, Wall } from './types';

function duel() {
  return createGameState({
    mode: 'duel',
    themeId: 'aurora',
    now: 1_000,
    players: [
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' }
    ]
  });
}

function four() {
  return createGameState({
    mode: 'freeForAll',
    themeId: 'aurora',
    now: 1_000,
    players: [
      { id: 'n', name: 'N' },
      { id: 'e', name: 'E' },
      { id: 's', name: 'S' },
      { id: 'w', name: 'W' }
    ]
  });
}

function withCurrent(state: GameState, playerId: string) {
  return {
    ...state,
    turn: {
      ...state.turn,
      currentPlayerId: playerId
    }
  };
}

describe('movement', () => {
  it('allows a normal orthogonal step', () => {
    const state = duel();
    const moves = getLegalMoves(state, 'a');
    expect(moves.some((move) => move.to.row === 1 && move.to.col === 5)).toBe(true);
  });

  it('automatically jumps an adjacent pawn', () => {
    const state = duel();
    state.players[0].position = { row: 5, col: 4 };
    state.players[1].position = { row: 5, col: 5 };

    const moves = getLegalMoves(state, 'a');
    expect(moves.some((move) => move.to.row === 5 && move.to.col === 6 && move.kind === 'jump')).toBe(true);
    expect(moves.some((move) => move.to.row === 5 && move.to.col === 5)).toBe(false);
  });

  it('offers diagonal jumps when a wall blocks the square behind a pawn', () => {
    const state = duel();
    state.players[0].position = { row: 5, col: 4 };
    state.players[1].position = { row: 5, col: 5 };
    state.walls = [{ row: 5, col: 5, orientation: 'vertical', ownerId: 'a' }];

    const moves = getLegalMoves(state, 'a');
    expect(moves.some((move) => move.to.row === 4 && move.to.col === 5 && move.kind === 'diagonal-jump')).toBe(true);
    expect(moves.some((move) => move.to.row === 6 && move.to.col === 5 && move.kind === 'diagonal-jump')).toBe(true);
  });

  it('supports a straight multi-jump in four-player modes', () => {
    const state = four();
    state.players[0].position = { row: 5, col: 3 };
    state.players[1].position = { row: 5, col: 4 };
    state.players[2].position = { row: 5, col: 5 };
    state.players[3].position = { row: 10, col: 10 };

    const moves = getLegalMoves(state, 'n');
    expect(moves.some((move) => move.to.row === 5 && move.to.col === 6 && move.kind === 'multi-jump')).toBe(true);
  });
});

describe('walls and path protection', () => {
  it('rejects overlapping walls', () => {
    const state = duel();
    state.walls = [{ row: 4, col: 4, orientation: 'horizontal', ownerId: 'b' }];

    const result = validateWallPlacement(state, 'a', {
      row: 4,
      col: 5,
      orientation: 'horizontal',
      ownerId: 'a'
    });

    expect(result).toEqual({ valid: false, reason: 'OVERLAP' });
  });

  it('rejects crossing walls', () => {
    const state = duel();
    state.walls = [{ row: 4, col: 4, orientation: 'horizontal', ownerId: 'b' }];

    const result = validateWallPlacement(state, 'a', {
      row: 4,
      col: 4,
      orientation: 'vertical',
      ownerId: 'a'
    });

    expect(result).toEqual({ valid: false, reason: 'CROSSING' });
  });

  it('never allows the central goal to be fully sealed', () => {
    let state = four();
    const existing: Wall[] = [
      { row: 4, col: 4, orientation: 'horizontal', ownerId: 'n' },
      { row: 5, col: 5, orientation: 'horizontal', ownerId: 'e' },
      { row: 5, col: 4, orientation: 'vertical', ownerId: 's' }
    ];
    state = { ...state, walls: existing };

    const candidate: Wall = {
      row: 4,
      col: 5,
      orientation: 'vertical',
      ownerId: 'n'
    };

    const result = validateWallPlacement(withCurrent(state, 'n'), 'n', candidate);
    expect(result).toEqual({ valid: false, reason: 'BLOCKS_ALL_PATHS' });
  });
});

describe('turns and timeout', () => {
  it('changes turn after a valid move', () => {
    const state = duel();
    const next = applyGameAction(state, {
      type: 'MOVE_PAWN',
      playerId: 'a',
      to: { row: 1, col: 5 }
    }, 2_000);

    expect(next.turn.currentPlayerId).toBe('b');
    expect(next.revision).toBe(2);
  });

  it('loses the duel when the clock expires', () => {
    const state = duel();
    const next = applyGameAction(state, {
      type: 'TIMEOUT',
      playerId: 'a'
    }, 31_001);

    expect(next.status).toBe('finished');
    expect(next.winnerPlayerId).toBe('b');
  });

  it('eliminates only the timed-out player in four-player mode', () => {
    const state = four();
    const next = applyGameAction(state, {
      type: 'TIMEOUT',
      playerId: 'n'
    }, 31_001);

    expect(next.players.find((player) => player.id === 'n')?.eliminated).toBe(true);
    expect(next.status).toBe('playing');
    expect(next.turn.currentPlayerId).toBe('e');
  });
});
