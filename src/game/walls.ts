import type { GameState, Wall, WallValidationResult } from './types';
import { allActivePlayersHavePath } from './pathfinding';

export function hasWallCollision(existing: Wall[], candidate: Wall): 'OVERLAP' | 'CROSSING' | null {
  for (const wall of existing) {
    if (wall.orientation === candidate.orientation) {
      if (
        candidate.orientation === 'horizontal' &&
        wall.row === candidate.row &&
        Math.abs(wall.col - candidate.col) <= 1
      ) {
        return 'OVERLAP';
      }

      if (
        candidate.orientation === 'vertical' &&
        wall.col === candidate.col &&
        Math.abs(wall.row - candidate.row) <= 1
      ) {
        return 'OVERLAP';
      }
    } else if (wall.row === candidate.row && wall.col === candidate.col) {
      return 'CROSSING';
    }
  }

  return null;
}

export function validateWallPlacement(
  state: GameState,
  playerId: string,
  candidate: Wall
): WallValidationResult {
  if (state.status !== 'playing') return { valid: false, reason: 'GAME_FINISHED' };
  if (state.turn.currentPlayerId !== playerId) return { valid: false, reason: 'NOT_YOUR_TURN' };

  const player = state.players.find((candidatePlayer) => candidatePlayer.id === playerId);
  if (!player || player.wallsRemaining <= 0) return { valid: false, reason: 'NO_WALLS_LEFT' };

  if (
    candidate.row < 0 ||
    candidate.row > 9 ||
    candidate.col < 0 ||
    candidate.col > 9
  ) {
    return { valid: false, reason: 'OUT_OF_BOUNDS' };
  }

  const collision = hasWallCollision(state.walls, candidate);
  if (collision) return { valid: false, reason: collision };

  const walls = [...state.walls, candidate];
  if (!allActivePlayersHavePath(state, walls)) {
    return { valid: false, reason: 'BLOCKS_ALL_PATHS' };
  }

  return { valid: true };
}
