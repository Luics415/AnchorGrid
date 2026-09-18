import { CENTER, type GameState, type PlayerState, type Position, type Wall } from './types';
import { DIRECTIONS, addPosition, inBounds, isBlockedByWall, positionKey, samePosition } from './geometry';

function reachesGoal(state: GameState, player: PlayerState, position: Position) {
  if (state.mode === 'duel') {
    if (player.seat === 'north') return position.row === 10;
    if (player.seat === 'south') return position.row === 0;
    return false;
  }

  return samePosition(position, CENTER);
}

export function hasPathToGoal(state: GameState, player: PlayerState, walls = state.walls) {
  if (player.eliminated) return true;

  const queue: Position[] = [player.position];
  const visited = new Set<string>([positionKey(player.position)]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (reachesGoal(state, player, current)) return true;

    for (const direction of DIRECTIONS) {
      const next = addPosition(current, direction);
      if (!inBounds(next)) continue;
      if (isBlockedByWall(current, next, walls)) continue;

      const key = positionKey(next);
      if (visited.has(key)) continue;
      visited.add(key);
      queue.push(next);
    }
  }

  return false;
}

export function allActivePlayersHavePath(state: GameState, walls: Wall[]) {
  return state.players
    .filter((player) => !player.eliminated)
    .every((player) => hasPathToGoal(state, player, walls));
}
