import { chooseAiAction } from './engine';
import type {
  AiDecision,
  AiDifficulty,
  AiWorkerRequest,
  AiWorkerResponse
} from './types';
import type { GameState } from '../game';

let worker: Worker | null = null;
let sequence = 0;
const pending = new Map<
  number,
  {
    resolve: (decision: AiDecision) => void;
    reject: (error: Error) => void;
  }
>();

function getWorker() {
  if (worker || typeof Worker === 'undefined') return worker;

  try {
    worker = new Worker(new URL('./worker.ts', import.meta.url), {
      type: 'module'
    });

    worker.onmessage = (event: MessageEvent<AiWorkerResponse>) => {
      const response = event.data;
      const request = pending.get(response.requestId);
      if (!request) return;

      pending.delete(response.requestId);

      if (response.error || !response.decision) {
        request.reject(new Error(response.error ?? 'La CPU no devolvió una decisión.'));
        return;
      }

      request.resolve(response.decision);
    };

    worker.onerror = () => {
      for (const request of pending.values()) {
        request.reject(new Error('El proceso de IA se detuvo inesperadamente.'));
      }
      pending.clear();
      worker?.terminate();
      worker = null;
    };
  } catch {
    worker = null;
  }

  return worker;
}

export function requestAiDecision(
  state: GameState,
  playerId: string,
  difficulty: AiDifficulty
): Promise<AiDecision> {
  const activeWorker = getWorker();

  if (!activeWorker) {
    return Promise.resolve(chooseAiAction(state, playerId, difficulty));
  }

  const requestId = ++sequence;
  const request: AiWorkerRequest = {
    requestId,
    state,
    playerId,
    difficulty
  };

  return new Promise((resolve, reject) => {
    pending.set(requestId, { resolve, reject });
    activeWorker.postMessage(request);
  });
}

export function disposeAiWorker() {
  worker?.terminate();
  worker = null;

  for (const request of pending.values()) {
    request.reject(new Error('La partida contra IA fue cerrada.'));
  }

  pending.clear();
}
