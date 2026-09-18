import { useEffect, useMemo, useRef, useState } from 'react';
import { MODE_CONFIG, SEAT_ORDER, getTheme, type GameAction, type GameState } from '../game';
import { GameBoard } from './GameBoard';
import { useAppTheme } from '../theme/useAppTheme';
import { ThemeAtmosphere } from './ThemeAtmosphere';
import { NetworkStatus } from './NetworkStatus';
import { BrandSignature } from './BrandSignature';

interface Props {
  game: GameState;
  roomCode?: string;
  localPlayerId?: string | null;
  canControlAll?: boolean;
  isHost?: boolean;
  authorityEpoch?: number;
  networkConnected?: boolean;
  serverOffsetMs?: number;
  serverNow: () => number;
  onAction: (action: GameAction) => void | Promise<void>;
  onLeave: () => void;
  onRematch: () => void;
  onRequestRematch?: () => void;
  onReturnLobby?: () => void;
  rematchVotes?: Record<string, boolean>;
  requiredPlayers?: number;
}

function teamName(teamId?: string) {
  if (teamId === 'A') return 'Morado';
  if (teamId === 'B') return 'Naranja';
  return teamId ?? '';
}

function winnerLabel(game: GameState) {
  if (game.winnerTeamId) return `Equipo ${teamName(game.winnerTeamId)}`;
  const winner = game.players.find((player) => player.id === game.winnerPlayerId);
  return winner?.name ?? 'Victoria';
}

export function GameScreen({
  game,
  roomCode,
  localPlayerId,
  canControlAll = false,
  isHost = false,
  authorityEpoch,
  networkConnected = true,
  serverOffsetMs = 0,
  serverNow,
  onAction,
  onLeave,
  onRematch,
  onRequestRematch,
  onReturnLobby,
  rematchVotes = {},
  requiredPlayers
}: Props) {
  const [now, setNow] = useState(serverNow());
  const timeoutRevisionRef = useRef<number | null>(null);
  const theme = getTheme(game.themeId);
  useAppTheme(game.themeId);
  const activePlayer = game.players.find((player) => player.id === game.turn.currentPlayerId);
  const inactivityWarning = game.turn.phase === 'warning';
  const warningForLocalPlayer = inactivityWarning && (canControlAll || localPlayerId === game.turn.currentPlayerId);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(serverNow()), 100);
    return () => window.clearInterval(timer);
  }, [serverNow]);

  const remainingMs = Math.max(0, game.turn.endsAt - now);
  const seconds = Math.ceil(remainingMs / 1000);
  const progress = Math.max(0, Math.min(100, (remainingMs / game.turn.durationMs) * 100));
  const mayDriveTimer = networkConnected && (canControlAll || isHost || localPlayerId === game.turn.currentPlayerId);

  useEffect(() => {
    if (game.status !== 'playing' || remainingMs > 0 || !mayDriveTimer || timeoutRevisionRef.current === game.revision) return;
    timeoutRevisionRef.current = game.revision;
    void onAction({ type: 'TIMEOUT', playerId: game.turn.currentPlayerId });
  }, [game.status, game.revision, game.turn.currentPlayerId, remainingMs, mayDriveTimer, onAction]);

  const sortedPlayers = useMemo(() => [...game.players].sort((a, b) => SEAT_ORDER.indexOf(a.seat) - SEAT_ORDER.indexOf(b.seat)), [game.players]);
  const rematchCount = Object.values(rematchVotes).filter(Boolean).length;
  const rematchTarget = requiredPlayers ?? game.players.length;
  const localVotedRematch = Boolean(localPlayerId && rematchVotes[localPlayerId]);

  return (
    <main className={`game-shell theme-${game.themeId} mode-${game.mode}`}>
      <ThemeAtmosphere themeId={game.themeId} />
      {!networkConnected && roomCode && <div className="connection-banner">Conexión perdida. Reconectando sin abandonar tu asiento…</div>}

      <header className="game-topbar glass-panel">
        <div>
          <p className="eyebrow">{roomCode ? `SALA ${roomCode}` : 'JUEGO LOCAL'}</p>
          <h1>{MODE_CONFIG[game.mode].label}</h1>
        </div>
        <div className="game-top-actions">
          {roomCode && <NetworkStatus connected={networkConnected} isHost={isHost} epoch={authorityEpoch} revision={game.revision} compact />}
          <span className="theme-badge">{theme.name}</span>
          <button className="ghost-button" onClick={onLeave}>Salir</button>
        </div>
      </header>

      <section className={`turn-panel glass-panel ${seconds <= 5 || inactivityWarning ? 'urgent' : ''} ${inactivityWarning ? 'inactivity-phase' : ''}`}>
        <div className="turn-line">
          <div><small>{inactivityWarning ? 'Aviso de inactividad' : 'Turno'}</small><strong>{activePlayer?.name ?? '—'}</strong></div>
          <div className={`timer-number ${seconds <= 5 || inactivityWarning ? 'danger' : ''}`}>{seconds}</div>
        </div>
        <div className="timer-track"><div className="timer-fill" style={{ width: `${progress}%` }} /></div>
      </section>

      {inactivityWarning && (
        <section className={`inactivity-notice glass-panel ${warningForLocalPlayer ? 'for-you' : ''}`} role="status" aria-live="polite">
          <span className="inactivity-icon" aria-hidden="true">!</span>
          <div>
            <strong>{warningForLocalPlayer ? '¿Sigues ahí?' : `${activePlayer?.name ?? 'El jugador'} está inactivo`}</strong>
            <p>
              {warningForLocalPlayer
                ? `Tienes ${seconds} s para mover una ficha o arrastrar una pared. Si no respondes, sólo se saltará tu turno.`
                : `Tiene ${seconds} s para volver. Si no responde, el turno continuará con el siguiente jugador.`}
            </p>
          </div>
        </section>
      )}

      <section className="player-grid">
        {sortedPlayers.map((player) => (
          <article key={player.id} className={`player-card glass-panel seat-${player.seat} ${player.id === game.turn.currentPlayerId ? 'active' : ''} ${player.eliminated ? 'eliminated' : ''}`}>
            <div className="player-color" />
            <div className="player-info">
              <strong>{player.name}</strong>
              <small>{player.teamId ? `Equipo ${teamName(player.teamId)} · ` : ''}{player.eliminated ? 'Eliminado' : `${player.wallsRemaining} paredes${player.inactivityWarnings ? ` · ${player.inactivityWarnings} aviso${player.inactivityWarnings === 1 ? '' : 's'}` : ''}`}</small>
            </div>
            {!player.connected && <span className="offline-badge">OFFLINE</span>}
          </article>
        ))}
      </section>

      <GameBoard game={game} localPlayerId={localPlayerId} canControlAll={canControlAll} onAction={onAction} />

      {roomCode && (
        <div className="game-diagnostics" title="Datos útiles durante las pruebas entre dispositivos">
          R{game.revision} · movimiento {game.moveNumber} · reloj {Math.round(serverOffsetMs)} ms {isHost ? '· autoridad local' : ''}
        </div>
      )}

      <BrandSignature compact className="game-signature" />

      {game.status === 'finished' && (
        <div className="result-backdrop">
          <section className="result-card glass-panel">
            <div className="result-rays" aria-hidden="true" />
            <p className="eyebrow">PARTIDA TERMINADA</p>
            <div className="result-symbol">✦</div>
            <h2>{winnerLabel(game)}</h2>
            <p>{game.winnerTeamId ? 'El equipo alcanzó la meta.' : 'Ha ganado la partida.'}</p>
            <div className={`result-actions result-actions-grid ${roomCode ? 'online-result-actions' : 'local-result-actions'}`}>
              {roomCode ? (
                <>
                  <button className="secondary-button" onClick={onReturnLobby} disabled={!networkConnected} title="Volver con todos a la sala de espera">
                    Regresar al lobby
                  </button>
                  <button className="ghost-button" onClick={onLeave}>Menú principal</button>
                  <button className="primary-button rematch-vote-button" onClick={onRequestRematch} disabled={localVotedRematch || !networkConnected}>
                    {`Revancha ${rematchCount}/${rematchTarget}${localVotedRematch ? ' ✓' : ''}`}
                  </button>
                  <small className="result-help">Regresar al lobby devuelve la sala completa a espera. La revancha inicia automáticamente cuando voten todos.</small>
                </>
              ) : (
                <>
                  <button className="ghost-button" onClick={onLeave}>Menú principal</button>
                  <button className="primary-button" onClick={onRematch}>Revancha</button>
                </>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
