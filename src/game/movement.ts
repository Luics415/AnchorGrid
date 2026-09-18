import type { GameState, LegalMove, PlayerState, Position } from './types';
import {
  DIRECTIONS,
  addPosition,
  inBounds,
  isBlockedByWall,
  perpendicularDirections,
  positionKey
} from './geometry';

function activePawnAt(state: GameState, position: Position): PlayerState | undefined {
  return state.players.find(
    (player) =>
      !player.eliminated &&
      player.position.row === position.row &&
      player.position.col === position.col
  );
}

function jumpFromOccupied(
  state: GameState,
  occupiedPosition: Position,
  direction: Position,
  over: string[],
  depth = 0
): LegalMove[] {
  if (depth > state.players.length) return [];

  const behind = addPosition(occupiedPosition, direction);
  const straightBlocked = !inBounds(behind) || isBlockedByWall(occupiedPosition, behind, state.walls);

  if (!straightBlocked) {
    const pawnBehind = activePawnAt(state, behind);
    if (!pawnBehind) {
      return [
        {
          to: behind,
          kind: over.length > 1 ? 'multi-jump' : 'jump',
          over
        }
      ];
    }

    // Four-player modes can create chains of adjacent pawns. Continue straight
    // until a free square appears, preserving the automatic-jump behavior.
    if (state.mode !== 'duel') {
      const chained = jumpFromOccupied(
        state,
        behind,
        direction,
        [...over, pawnBehind.id],
        depth + 1
      );
      if (chained.length > 0) return chained;
    }
  }

  // If the straight jump is impossible, route diagonally around the pawn.
  const diagonalMoves: LegalMove[] = [];
  for (const sideDirection of perpendicularDirections(direction)) {
    const side = addPosition(occupiedPosition, sideDirection);
    if (!inBounds(side)) continue;
    if (isBlockedByWall(occupiedPosition, side, state.walls)) continue;
    if (activePawnAt(state, side)) continue;

    diagonalMoves.push({
      to: side,
      kind: 'diagonal-jump',
      over
    });
  }

  return diagonalMoves;
}

export function getLegalMoves(state: GameState, playerId: string): LegalMove[] {
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (!player || player.eliminated || state.status !== 'playing') return [];

  const moves: LegalMove[] = [];

  for (const direction of DIRECTIONS) {
    const adjacent = addPosition(player.position, direction);
    if (!inBounds(adjacent)) continue;
    if (isBlockedByWall(player.position, adjacent, state.walls)) continue;

    const occupant = activePawnAt(state, adjacent);
    if (!occupant) {
      moves.push({ to: adjacent, kind: 'step' });
      continue;
    }

    moves.push(...jumpFromOccupied(state, adjacent, direction, [occupant.id]));
  }

  const deduped = new Map<string, LegalMove>();
  for (const move of moves) {
    const key = positionKey(move.to);
    const previous = deduped.get(key);
    if (!previous || (move.over?.length ?? 0) > (previous.over?.length ?? 0)) {
      deduped.set(key, move);
    }
  }

  return [...deduped.values()];
}
