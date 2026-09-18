import { getLegalMoves, shortestPathDistance, type GameState, type PlayerState, type TeamId } from '../game';

const WIN_SCORE = 1_000_000;
const DISTANCE_WEIGHT = 100;
const WALL_WEIGHT = 7;
const MOBILITY_WEIGHT = 3;

function safeDistance(state: GameState, player: PlayerState) {
  const distance = shortestPathDistance(state, player);
  return Number.isFinite(distance) ? distance : 99;
}

function mobility(state: GameState, player: PlayerState) {
  return getLegalMoves(state, player.id).length;
}

export function evaluatePlayerUtility(state: GameState, playerId: string) {
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (!player) return -WIN_SCORE;

  if (state.status === 'finished') {
    if (state.mode === 'team2v2') {
      return state.winnerTeamId === player.teamId ? WIN_SCORE : -WIN_SCORE;
    }
    return state.winnerPlayerId === player.id ? WIN_SCORE : -WIN_SCORE;
  }

  return (
    -safeDistance(state, player) * DISTANCE_WEIGHT +
    player.wallsRemaining * WALL_WEIGHT +
    mobility(state, player) * MOBILITY_WEIGHT
  );
}

export function evaluateDuel(state: GameState, perspectiveId: string) {
  if (state.status === 'finished') {
    return state.winnerPlayerId === perspectiveId ? WIN_SCORE : -WIN_SCORE;
  }

  const perspective = state.players.find((player) => player.id === perspectiveId);
  const opponent = state.players.find((player) => player.id !== perspectiveId);
  if (!perspective || !opponent) return -WIN_SCORE;

  const ownDistance = safeDistance(state, perspective);
  const opponentDistance = safeDistance(state, opponent);
  const mobilityDiff = mobility(state, perspective) - mobility(state, opponent);
  const wallDiff = perspective.wallsRemaining - opponent.wallsRemaining;

  return (
    (opponentDistance - ownDistance) * DISTANCE_WEIGHT +
    wallDiff * WALL_WEIGHT +
    mobilityDiff * MOBILITY_WEIGHT
  );
}

function teamPlayers(state: GameState, teamId: TeamId) {
  return state.players.filter((player) => player.teamId === teamId && !player.eliminated);
}

function teamDistanceScore(state: GameState, teamId: TeamId) {
  const distances = teamPlayers(state, teamId)
    .map((player) => safeDistance(state, player))
    .sort((a, b) => a - b);

  if (distances.length === 0) return 99 * DISTANCE_WEIGHT;

  const best = distances[0] ?? 99;
  const second = distances[1] ?? best + 3;

  // The first player reaching center wins, but keeping the second player
  // relevant gives the team a real cooperative shape instead of two solo bots.
  return best * DISTANCE_WEIGHT + second * 18;
}

export function evaluateTeam(state: GameState, perspectiveTeam: TeamId) {
  if (state.status === 'finished') {
    return state.winnerTeamId === perspectiveTeam ? WIN_SCORE : -WIN_SCORE;
  }

  const opponentTeam: TeamId = perspectiveTeam === 'A' ? 'B' : 'A';
  const own = teamPlayers(state, perspectiveTeam);
  const opponents = teamPlayers(state, opponentTeam);

  const ownDistance = teamDistanceScore(state, perspectiveTeam);
  const opponentDistance = teamDistanceScore(state, opponentTeam);
  const ownWalls = own.reduce((sum, player) => sum + player.wallsRemaining, 0);
  const opponentWalls = opponents.reduce((sum, player) => sum + player.wallsRemaining, 0);
  const ownMobility = own.reduce((sum, player) => sum + mobility(state, player), 0);
  const opponentMobility = opponents.reduce((sum, player) => sum + mobility(state, player), 0);

  return (
    opponentDistance -
    ownDistance +
    (ownWalls - opponentWalls) * 5 +
    (ownMobility - opponentMobility) * 2
  );
}

export function evaluateFfaVector(state: GameState) {
  const vector: Record<string, number> = {};

  for (const player of state.players) {
    vector[player.id] = evaluatePlayerUtility(state, player.id);
  }

  return vector;
}
