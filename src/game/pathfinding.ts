import { CENTER, type GameState, type PlayerState, type Position, type Wall } from './types';
import { DIRECTIONS, addPosition, inBounds, positionKey, samePosition } from './geometry';

function reachesGoal(state: GameState, player: PlayerState, position: Position) {
  if (state.mode === 'duel') {
    if (player.seat === 'north') return position.row === 10;
    if (player.seat === 'south') return position.row === 0;
    return false;
  }

  return samePosition(position, CENTER);
}

function edgeKey(a: Position, b: Position) {
  const aKey = positionKey(a);
  const bKey = positionKey(b);
  return aKey < bKey ? `${aKey}|${bKey}` : `${bKey}|${aKey}`;
}

/**
 * Pathfinding used to ask every wall whether it blocked every explored edge.
 * Building the blocked-edge set once turns those checks into O(1) lookups and
 * matters a lot for AI search and wall previews.
 */
function buildBlockedEdges(walls: Wall[]) {
  const blocked = new Set<string>();

  for (const wall of walls) {
    if (wall.orientation === 'horizontal') {
      blocked.add(edgeKey(
        { row: wall.row, col: wall.col },
        { row: wall.row + 1, col: wall.col }
      ));
      blocked.add(edgeKey(
        { row: wall.row, col: wall.col + 1 },
        { row: wall.row + 1, col: wall.col + 1 }
      ));
    } else {
      blocked.add(edgeKey(
        { row: wall.row, col: wall.col },
        { row: wall.row, col: wall.col + 1 }
      ));
      blocked.add(edgeKey(
        { row: wall.row + 1, col: wall.col },
        { row: wall.row + 1, col: wall.col + 1 }
      ));
    }
  }

  return blocked;
}

function parsePosition(key: string): Position {
  const [row, col] = key.split(':').map(Number);
  return { row, col };
}

function findPath(
  state: GameState,
  player: PlayerState,
  blocked: Set<string>
): Position[] | null {
  if (player.eliminated) return [player.position];

  const startKey = positionKey(player.position);
  const queue: Position[] = [player.position];
  const visited = new Set<string>([startKey]);
  const parent = new Map<string, string>();
  let queueIndex = 0;
  let goalKey: string | null = null;

  while (queueIndex < queue.length) {
    const current = queue[queueIndex++];
    const currentKey = positionKey(current);

    if (reachesGoal(state, player, current)) {
      goalKey = currentKey;
      break;
    }

    for (const direction of DIRECTIONS) {
      const next = addPosition(current, direction);
      if (!inBounds(next)) continue;
      if (blocked.has(edgeKey(current, next))) continue;

      const key = positionKey(next);
      if (visited.has(key)) continue;

      visited.add(key);
      parent.set(key, currentKey);
      queue.push(next);
    }
  }

  if (!goalKey) return null;

  const path: Position[] = [];
  let cursor: string | undefined = goalKey;

  while (cursor) {
    path.push(parsePosition(cursor));
    if (cursor === startKey) break;
    cursor = parent.get(cursor);
  }

  path.reverse();
  return path;
}

export function shortestPath(
  state: GameState,
  player: PlayerState,
  walls = state.walls
) {
  return findPath(state, player, buildBlockedEdges(walls));
}

export function shortestPathDistance(
  state: GameState,
  player: PlayerState,
  walls = state.walls
) {
  const path = shortestPath(state, player, walls);
  return path ? Math.max(0, path.length - 1) : Number.POSITIVE_INFINITY;
}

export function hasPathToGoal(
  state: GameState,
  player: PlayerState,
  walls = state.walls
) {
  return Number.isFinite(shortestPathDistance(state, player, walls));
}

export function allActivePlayersHavePath(state: GameState, walls: Wall[]) {
  const blocked = buildBlockedEdges(walls);

  return state.players
    .filter((player) => !player.eliminated)
    .every((player) => findPath(state, player, blocked) !== null);
}
