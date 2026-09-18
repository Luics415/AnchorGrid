import {
  applyGameAction,
  getLegalMoves,
  shortestPath,
  shortestPathDistance,
  validateWallPlacement,
  type GameAction,
  type GameState,
  type PlayerState,
  type Position,
  type Wall
} from '../game';

function wallKey(wall: Pick<Wall, 'row' | 'col' | 'orientation'>) {
  return `${wall.row}:${wall.col}:${wall.orientation}`;
}

function addWall(set: Map<string, Wall>, wall: Wall) {
  if (wall.row < 0 || wall.row > 9 || wall.col < 0 || wall.col > 9) return;
  set.set(wallKey(wall), wall);
}

function wallsBlockingEdge(from: Position, to: Position, ownerId: string) {
  const result: Wall[] = [];

  if (from.row !== to.row) {
    const row = Math.min(from.row, to.row);
    for (const col of [from.col - 1, from.col]) {
      if (col >= 0 && col <= 9) {
        result.push({ row, col, orientation: 'horizontal', ownerId });
      }
    }
  } else if (from.col !== to.col) {
    const col = Math.min(from.col, to.col);
    for (const row of [from.row - 1, from.row]) {
      if (row >= 0 && row <= 9) {
        result.push({ row, col, orientation: 'vertical', ownerId });
      }
    }
  }

  return result;
}

function relevantOpponents(state: GameState, player: PlayerState) {
  if (state.mode === 'team2v2') {
    return state.players.filter(
      (candidate) => !candidate.eliminated && candidate.teamId !== player.teamId
    );
  }

  return state.players.filter(
    (candidate) => !candidate.eliminated && candidate.id !== player.id
  );
}

function strategicWalls(state: GameState, player: PlayerState) {
  const candidates = new Map<string, Wall>();

  for (const opponent of relevantOpponents(state, player)) {
    const path = shortestPath(state, opponent);
    if (path) {
      // The first part of the shortest route is the most actionable section.
      for (let index = 0; index < Math.min(path.length - 1, 7); index += 1) {
        for (const wall of wallsBlockingEdge(path[index], path[index + 1], player.id)) {
          addWall(candidates, wall);
        }
      }
    }

    // Also consider the immediate neighborhood around a dangerous pawn.
    for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
      for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
        const row = opponent.position.row + rowOffset;
        const col = opponent.position.col + colOffset;
        addWall(candidates, { row, col, orientation: 'horizontal', ownerId: player.id });
        addWall(candidates, { row, col, orientation: 'vertical', ownerId: player.id });
      }
    }
  }

  if (state.mode !== 'duel') {
    // A few central candidates help 4P/2v2 reason about the final approach.
    for (const [row, col] of [[4, 4], [4, 5], [5, 4], [5, 5]] as const) {
      addWall(candidates, { row, col, orientation: 'horizontal', ownerId: player.id });
      addWall(candidates, { row, col, orientation: 'vertical', ownerId: player.id });
    }
  }

  return [...candidates.values()];
}

function wallImpact(state: GameState, player: PlayerState, wall: Wall) {
  const opponents = relevantOpponents(state, player);
  const ownBefore = shortestPathDistance(state, player);
  const enemyBefore = opponents.reduce(
    (sum, opponent) => sum + shortestPathDistance(state, opponent),
    0
  );

  const withWall: GameState = {
    ...state,
    walls: [...state.walls, wall]
  };

  const ownAfter = shortestPathDistance(withWall, player);
  const enemyAfter = opponents.reduce(
    (sum, opponent) => sum + shortestPathDistance(withWall, opponent),
    0
  );

  const enemyDelay = enemyAfter - enemyBefore;
  const selfDelay = ownAfter - ownBefore;

  // A wall that hurts us nearly as much as the opponent is usually noise.
  return enemyDelay * 18 - selfDelay * 22;
}

export function generateAiActions(
  state: GameState,
  playerId: string,
  wallLimit: number
): GameAction[] {
  if (state.status !== 'playing' || state.turn.currentPlayerId !== playerId) return [];

  const player = state.players.find((candidate) => candidate.id === playerId);
  if (!player || player.eliminated) return [];

  const moves: GameAction[] = getLegalMoves(state, playerId).map((move) => ({
    type: 'MOVE_PAWN',
    playerId,
    to: move.to
  }));

  if (player.wallsRemaining <= 0 || wallLimit <= 0) return moves;

  const validWalls = strategicWalls(state, player)
    .filter((wall) => validateWallPlacement(state, playerId, wall).valid)
    .map((wall) => ({ wall, impact: wallImpact(state, player, wall) }))
    .sort((a, b) => b.impact - a.impact)
    .slice(0, wallLimit)
    .map(({ wall }) => ({
      type: 'PLACE_WALL',
      playerId,
      wall
    }) satisfies GameAction);

  return [...moves, ...validWalls];
}

export function orderActionsForPlayer(
  state: GameState,
  playerId: string,
  actions: GameAction[],
  evaluator: (nextState: GameState) => number,
  limit: number
) {
  return actions
    .map((action) => ({
      action,
      score: evaluator(applyGameAction(state, action, state.moveNumber * 1000))
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ action }) => action);
}
