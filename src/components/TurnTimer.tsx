import { useEffect, useRef, useState } from 'react';
import type { GameAction, GameState, TurnState } from '../game';

interface Props {
  gameStatus: GameState['status'];
  revision: number;
  turn: TurnState;
  activePlayerName: string;
  warningForLocalPlayer: boolean;
  mayDriveTimer: boolean;
  serverNow: () => number;
  onAction: (action: GameAction) => void | Promise<void>;
}

export function TurnTimer({
  gameStatus,
  revision,
  turn,
  activePlayerName,
  warningForLocalPlayer,
  mayDriveTimer,
  serverNow,
  onAction
}: Props) {
  const [now, setNow] = useState(serverNow());
  const timeoutRevisionRef = useRef<number | null>(null);
  const inactivityWarning = turn.phase === 'warning';

  useEffect(() => {
    setNow(serverNow());

    // Four updates per second are enough for a smooth progress bar and,
    // importantly, only this tiny component re-renders now.
    const timer = window.setInterval(() => {
      setNow(serverNow());
    }, 250);

    return () => window.clearInterval(timer);
  }, [serverNow, revision, turn.currentPlayerId, turn.endsAt]);

  const remainingMs = Math.max(0, turn.endsAt - now);
  const seconds = Math.ceil(remainingMs / 1000);
  const progress = Math.max(
    0,
    Math.min(100, (remainingMs / Math.max(1, turn.durationMs)) * 100)
  );

  useEffect(() => {
    if (
      gameStatus !== 'playing' ||
      remainingMs > 0 ||
      !mayDriveTimer ||
      timeoutRevisionRef.current === revision
    ) {
      return;
    }

    timeoutRevisionRef.current = revision;
    void onAction({
      type: 'TIMEOUT',
      playerId: turn.currentPlayerId
    });
  }, [
    gameStatus,
    mayDriveTimer,
    onAction,
    remainingMs,
    revision,
    turn.currentPlayerId
  ]);

  return (
    <>
      <section className={`turn-panel glass-panel ${seconds <= 5 || inactivityWarning ? 'urgent' : ''} ${inactivityWarning ? 'inactivity-phase' : ''}`}>
        <div className="turn-line">
          <div>
            <small>{inactivityWarning ? 'Aviso de inactividad' : 'Turno'}</small>
            <strong>{activePlayerName || '—'}</strong>
          </div>
          <div className={`timer-number ${seconds <= 5 || inactivityWarning ? 'danger' : ''}`}>
            {seconds}
          </div>
        </div>
        <div className="timer-track">
          <div className="timer-fill" style={{ width: `${progress}%` }} />
        </div>
      </section>

      {inactivityWarning && (
        <section
          className={`inactivity-notice glass-panel ${warningForLocalPlayer ? 'for-you' : ''}`}
          role="status"
          aria-live="polite"
        >
          <span className="inactivity-icon" aria-hidden="true">!</span>
          <div>
            <strong>
              {warningForLocalPlayer
                ? '¿Sigues ahí?'
                : `${activePlayerName || 'El jugador'} está inactivo`}
            </strong>
            <p>
              {warningForLocalPlayer
                ? `Tienes ${seconds} s para mover una ficha o arrastrar una pared. Si no respondes, sólo se saltará tu turno.`
                : `Tiene ${seconds} s para volver. Si no responde, el turno continuará con el siguiente jugador.`}
            </p>
          </div>
        </section>
      )}
    </>
  );
}
