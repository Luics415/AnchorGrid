import type { GameAction, GameState } from '../game';

export type AiDifficulty = 'easy' | 'normal' | 'hard' | 'master';

export interface AiDifficultyDefinition {
  id: AiDifficulty;
  label: string;
  shortDescription: string;
  detail: string;
  icon: string;
}

export const AI_DIFFICULTIES: AiDifficultyDefinition[] = [
  {
    id: 'easy',
    label: 'Fácil',
    shortDescription: 'Aprende y avanza.',
    detail: 'Mira poco hacia adelante y deja pasar oportunidades.',
    icon: '🙂'
  },
  {
    id: 'normal',
    label: 'Normal',
    shortDescription: 'Ya responde a tus planes.',
    detail: 'Compara rutas, amenazas y paredes razonables.',
    icon: '🧠'
  },
  {
    id: 'hard',
    label: 'Difícil',
    shortDescription: 'Castiga errores.',
    detail: 'Anticipa varias respuestas y administra paredes.',
    icon: '⚔️'
  },
  {
    id: 'master',
    label: 'Maestro',
    shortDescription: 'Preciso y competitivo.',
    detail: 'Busca líneas fuertes como un motor de tablero, sin ser invencible.',
    icon: '♟️'
  }
];

export interface AiSearchStats {
  depth: number;
  nodes: number;
  elapsedMs: number;
  candidates: number;
  mode: GameState['mode'];
}

export interface AiDecision {
  action: GameAction;
  stats: AiSearchStats;
}

export interface AiWorkerRequest {
  requestId: number;
  state: GameState;
  playerId: string;
  difficulty: AiDifficulty;
}

export interface AiWorkerResponse {
  requestId: number;
  decision?: AiDecision;
  error?: string;
}
