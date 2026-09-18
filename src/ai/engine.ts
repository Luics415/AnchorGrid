import {
  applyGameAction,
  type GameAction,
  type GameState,
  type TeamId
} from '../game';
import { generateAiActions, orderActionsForPlayer } from './candidates';
import {
  evaluateDuel,
  evaluateFfaVector,
  evaluatePlayerUtility,
  evaluateTeam
} from './evaluation';
import type { AiDecision, AiDifficulty, AiSearchStats } from './types';

interface SearchConfig {
  budgetMs: number;
  maxDepth: number;
  branchLimit: number;
  wallLimit: number;
}

const CONFIG: Record<AiDifficulty, SearchConfig> = {
  easy: {
    budgetMs: 45,
    maxDepth: 1,
    branchLimit: 7,
    wallLimit: 2
  },
  normal: {
    budgetMs: 130,
    maxDepth: 2,
    branchLimit: 8,
    wallLimit: 3
  },
  hard: {
    budgetMs: 320,
    maxDepth: 3,
    branchLimit: 9,
    wallLimit: 4
  },
  master: {
    budgetMs: 720,
    maxDepth: 4,
    branchLimit: 6,
    wallLimit: 3
  }
};

class SearchTimeout extends Error {}

interface SearchContext {
  deadline: number;
  nodes: number;
  difficulty: AiDifficulty;
  config: SearchConfig;
  scalarCache: Map<string, number>;
  vectorCache: Map<string, Record<string, number>>;
}

function nowMs() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function checkTime(context: SearchContext) {
  context.nodes += 1;
  if ((context.nodes & 31) === 0 && nowMs() >= context.deadline) {
    throw new SearchTimeout();
  }
}

function stateKey(state: GameState, depth: number, perspective: string) {
  const players = state.players
    .map((player) => [
      player.id,
      player.position.row,
      player.position.col,
      player.wallsRemaining,
      player.eliminated ? 1 : 0
    ].join(','))
    .join(';');

  const walls = state.walls
    .map((wall) => `${wall.row},${wall.col},${wall.orientation[0]},${wall.ownerId}`)
    .sort()
    .join(';');

  return [
    perspective,
    depth,
    state.mode,
    state.status,
    state.turn.currentPlayerId,
    players,
    walls,
    state.winnerPlayerId ?? '',
    state.winnerTeamId ?? ''
  ].join('|');
}

function activePlayer(state: GameState) {
  return state.players.find((player) => player.id === state.turn.currentPlayerId);
}

function rootTeam(state: GameState, playerId: string): TeamId | undefined {
  return state.players.find((player) => player.id === playerId)?.teamId;
}

function scalarEvaluator(state: GameState, perspectiveId: string) {
  if (state.mode === 'duel') return evaluateDuel(state, perspectiveId);
  if (state.mode === 'team2v2') {
    const team = rootTeam(state, perspectiveId);
    return team ? evaluateTeam(state, team) : -1_000_000;
  }
  return evaluatePlayerUtility(state, perspectiveId);
}

function orderedActions(
  state: GameState,
  context: SearchContext,
  evaluator: (nextState: GameState) => number
) {
  const player = activePlayer(state);
  if (!player) return [];

  const actions = generateAiActions(
    state,
    player.id,
    context.config.wallLimit
  );

  return orderActionsForPlayer(
    state,
    player.id,
    actions,
    evaluator,
    context.config.branchLimit
  );
}

function scalarSearch(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  perspectiveId: string,
  context: SearchContext
): number {
  checkTime(context);

  if (depth <= 0 || state.status === 'finished') {
    return scalarEvaluator(state, perspectiveId);
  }

  const cacheKey = stateKey(state, depth, perspectiveId);
  const cached = context.scalarCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const perspectiveTeam = rootTeam(state, perspectiveId);
  const current = activePlayer(state);

  const maximizing = state.mode === 'team2v2'
    ? Boolean(current && current.teamId === perspectiveTeam)
    : current?.id === perspectiveId;

  const actions = orderedActions(
    state,
    context,
    (nextState) => {
      if (state.mode === 'team2v2' && perspectiveTeam) {
        return maximizing
          ? evaluateTeam(nextState, perspectiveTeam)
          : -evaluateTeam(nextState, perspectiveTeam);
      }

      const score = scalarEvaluator(nextState, perspectiveId);
      return maximizing ? score : -score;
    }
  );

  if (actions.length === 0) {
    return scalarEvaluator(state, perspectiveId);
  }

  let best = maximizing ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;

  for (const action of actions) {
    const next = applyGameAction(state, action, state.moveNumber * 1000);
    const score = scalarSearch(
      next,
      depth - 1,
      alpha,
      beta,
      perspectiveId,
      context
    );

    if (maximizing) {
      best = Math.max(best, score);
      alpha = Math.max(alpha, best);
    } else {
      best = Math.min(best, score);
      beta = Math.min(beta, best);
    }

    if (beta <= alpha) break;
  }

  context.scalarCache.set(cacheKey, best);
  return best;
}

function maxNSearch(
  state: GameState,
  depth: number,
  context: SearchContext
): Record<string, number> {
  checkTime(context);

  if (depth <= 0 || state.status === 'finished') {
    return evaluateFfaVector(state);
  }

  const current = activePlayer(state);
  if (!current) return evaluateFfaVector(state);

  const cacheKey = stateKey(state, depth, 'maxn');
  const cached = context.vectorCache.get(cacheKey);
  if (cached) return cached;

  const actions = orderedActions(
    state,
    context,
    (nextState) => evaluatePlayerUtility(nextState, current.id)
  );

  if (actions.length === 0) return evaluateFfaVector(state);

  let bestVector: Record<string, number> | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const action of actions) {
    const next = applyGameAction(state, action, state.moveNumber * 1000);
    const vector = maxNSearch(next, depth - 1, context);
    const ownScore = vector[current.id] ?? Number.NEGATIVE_INFINITY;

    if (ownScore > bestScore) {
      bestScore = ownScore;
      bestVector = vector;
    }
  }

  const result = bestVector ?? evaluateFfaVector(state);
  context.vectorCache.set(cacheKey, result);
  return result;
}

interface ScoredAction {
  action: GameAction;
  score: number;
}

function scoreRootAtDepth(
  state: GameState,
  playerId: string,
  depth: number,
  context: SearchContext
): ScoredAction[] {
  const current = activePlayer(state);
  if (!current || current.id !== playerId) return [];

  const actions = orderedActions(
    state,
    context,
    (nextState) => {
      if (state.mode === 'duel') return evaluateDuel(nextState, playerId);
      if (state.mode === 'team2v2') {
        const team = current.teamId;
        return team ? evaluateTeam(nextState, team) : -1_000_000;
      }
      return evaluatePlayerUtility(nextState, playerId);
    }
  );

  const scored: ScoredAction[] = [];

  for (const action of actions) {
    checkTime(context);
    const next = applyGameAction(state, action, state.moveNumber * 1000);

    let score: number;

    if (state.mode === 'freeForAll') {
      score = maxNSearch(next, Math.max(0, depth - 1), context)[playerId] ?? -1_000_000;
    } else {
      score = scalarSearch(
        next,
        Math.max(0, depth - 1),
        Number.NEGATIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        playerId,
        context
      );
    }

    scored.push({ action, score });
  }

  return scored.sort((a, b) => b.score - a.score);
}

function chooseFromScored(scored: ScoredAction[], difficulty: AiDifficulty) {
  if (scored.length === 0) return null;
  if (scored.length === 1) return scored[0].action;

  if (difficulty === 'easy') {
    const poolSize = Math.max(1, Math.ceil(scored.length * 0.45));
    return scored[Math.floor(Math.random() * poolSize)].action;
  }

  if (difficulty === 'normal') {
    const pool = scored.slice(0, Math.min(3, scored.length));
    const weights = [0.64, 0.25, 0.11];
    const roll = Math.random();
    let cursor = 0;

    for (let index = 0; index < pool.length; index += 1) {
      cursor += weights[index] ?? 0;
      if (roll <= cursor) return pool[index].action;
    }

    return pool[0].action;
  }

  const best = scored[0];
  const second = scored[1];
  const gap = best.score - second.score;

  if (difficulty === 'hard' && gap <= 18 && Math.random() < 0.16) {
    return second.action;
  }

  /*
   * Maestro never deliberately throws a clearly better line away. When two
   * moves are effectively equivalent, a small 12% choice of the runner-up
   * prevents robotic repetition and leaves the human a narrow, fair opening.
   */
  if (difficulty === 'master' && gap <= 7 && Math.random() < 0.12) {
    return second.action;
  }

  return best.action;
}

export function chooseAiAction(
  state: GameState,
  playerId: string,
  difficulty: AiDifficulty
): AiDecision {
  if (state.status !== 'playing') {
    throw new Error('La partida ya terminó.');
  }

  if (state.turn.currentPlayerId !== playerId) {
    throw new Error('No es el turno de esta CPU.');
  }

  const config = CONFIG[difficulty];
  const start = nowMs();
  const context: SearchContext = {
    deadline: start + config.budgetMs,
    nodes: 0,
    difficulty,
    config,
    scalarCache: new Map(),
    vectorCache: new Map()
  };

  let completedDepth = 0;
  let bestScored: ScoredAction[] = [];

  // Maestro uses iterative deepening: if the time budget ends, the last fully
  // completed depth remains valid instead of freezing the UI or returning junk.
  const targetDepth = state.mode === 'freeForAll'
    ? Math.min(config.maxDepth, difficulty === 'master' ? 3 : config.maxDepth)
    : config.maxDepth;

  for (let depth = 1; depth <= targetDepth; depth += 1) {
    try {
      const scored = scoreRootAtDepth(state, playerId, depth, context);
      if (scored.length > 0) {
        bestScored = scored;
        completedDepth = depth;
      }

      if (difficulty !== 'master' && depth >= targetDepth) break;
    } catch (error) {
      if (error instanceof SearchTimeout) break;
      throw error;
    }
  }

  if (bestScored.length === 0) {
    const fallback = generateAiActions(state, playerId, 0)[0];
    if (!fallback) throw new Error('La CPU no encontró una jugada legal.');
    bestScored = [{ action: fallback, score: 0 }];
  }

  const action = chooseFromScored(bestScored, difficulty) ?? bestScored[0].action;
  const elapsedMs = nowMs() - start;

  const stats: AiSearchStats = {
    depth: completedDepth || 1,
    nodes: context.nodes,
    elapsedMs,
    candidates: bestScored.length,
    mode: state.mode
  };

  return { action, stats };
}
