import { chooseAiAction } from './engine';
import type { AiWorkerRequest, AiWorkerResponse } from './types';

const workerScope = self as unknown as {
  onmessage: ((event: MessageEvent<AiWorkerRequest>) => void) | null;
  postMessage: (message: AiWorkerResponse) => void;
};

workerScope.onmessage = (event) => {
  const { requestId, state, playerId, difficulty } = event.data;

  try {
    const decision = chooseAiAction(state, playerId, difficulty);
    workerScope.postMessage({ requestId, decision });
  } catch (error) {
    workerScope.postMessage({
      requestId,
      error: error instanceof Error ? error.message : 'Error desconocido en la CPU.'
    });
  }
};
