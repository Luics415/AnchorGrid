import { describe, expect, it } from 'vitest';
import {
  applyGameAction,
  createGameState,
  type GameMode,
  type Seat
} from '../game';
import { chooseAiAction } from './engine';

function game(mode: GameMode) {
  const seats: Record<GameMode, Seat[]> = {
    duel: ['north', 'south'],
    freeForAll: ['north', 'east', 'south', 'west'],
    team2v2: ['north', 'east', 'south', 'west']
  };

  return createGameState({
    mode,
    themeId: 'aurora',
    players: seats[mode].map((seat, index) => ({
      id: `p${index + 1}`,
      name: `P${index + 1}`,
      seat
    })),
    now: 0
  });
}

describe('AnchorGrid AI', () => {
  it.each<GameMode>(['duel', 'freeForAll', 'team2v2'])(
    'returns a legal action in %s',
    (mode) => {
      const state = game(mode);
      const playerId = state.turn.currentPlayerId;
      const decision = chooseAiAction(state, playerId, 'easy');

      expect(decision.action.playerId).toBe(playerId);

      const next = applyGameAction(state, decision.action, 1000);
      expect(next.revision).toBeGreaterThan(state.revision);
      expect(next.lastAction).toEqual(decision.action);
    }
  );

  it('normal difficulty searches beyond a purely random move', () => {
    const state = game('duel');
    const decision = chooseAiAction(
      state,
      state.turn.currentPlayerId,
      'normal'
    );

    expect(decision.stats.depth).toBeGreaterThanOrEqual(1);
    expect(decision.stats.nodes).toBeGreaterThan(0);
    expect(decision.stats.candidates).toBeGreaterThan(0);
  });
});
