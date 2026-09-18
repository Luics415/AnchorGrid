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
}

function winnerLabel(game: GameState) {
  if (game.winnerTeamId) return `Equipo ${game.winnerTeamId}`;
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
  onRematch
}: Props) {
  const [now, setNow] = useState(serverNow());
  const timeoutRevisionRef = useRef<number | null>(null);
  const theme = getTheme(game.themeId);
  useAppTheme(game.themeId);
  const activePlayer = game.players.find((player) => player.id === game.turn.currentPlayerId);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(serverNow()), 100);
    return () => window.clearInterval(timer);
  }, [serverNow]);

  const remainingMs = Math.max(0, game.turn.endsAt - now);
  const seconds = Math.ceil(remainingMs / 1000);
  const progress = Math.max(0, Math.min(100, (remainingMs / game.turn.durationMs) * 100));
  const mayDriveTimer = networkConnected && (canControlAll || isHost);

  useEffect(() => {
    if (game.status !== 'playing' || remainingMs > 0 || !mayDriveTimer || timeoutRevisionRef.current === game.revision) return;
    timeoutRevisionRef.current = game.revision;
    void onAction({ type: 'TIMEOUT', playerId: game.turn.currentPlayerId });
  }, [game.status, game.revision, game.turn.currentPlayerId, remainingMs, mayDriveTimer, onAction]);

  const sortedPlayers = useMemo(() => [...game.players].sort((a, b) => SEAT_ORDER.indexOf(a.seat) - SEAT_ORDER.indexOf(b.seat)), [game.players]);

  return (
    <main className={`game-shell theme-${game.themeId}`}>
      <ThemeAtmosphere themeId={game.themeId} />
      {!networkConnected && roomCode && <div className="connection-banner">Conexión perdida. Reconectando sin abandonar tu asiento…</div>}

      <header className="game-topbar glass-panel">
        <div>
          <p className="eyebrow">{roomCode ? `SALA ${roomCode}` : 'PRUEBA LOCAL'}</p>
          <h1>{MODE_CONFIG[game.mode].label}</h1>
        </div>
        <div className="game-top-actions">
          {roomCode && <NetworkStatus connected={networkConnected} isHost={isHost} epoch={authorityEpoch} revision={game.revision} compact />}
          <span className="theme-badge">{theme.name}</span>
          <button className="ghost-button" onClick={onLeave}>Salir</button>
        </div>
      </header>

      <section className={`turn-panel glass-panel ${seconds <= 5 ? 'urgent' : ''}`}>
        <div className="turn-line">
          <div><small>Turno</small><strong>{activePlayer?.name ?? '—'}</strong></div>
          <div className={`timer-number ${seconds <= 5 ? 'danger' : ''}`}>{seconds}</div>
        </div>
        <div className="timer-track"><div className="timer-fill" style={{ width: `${progress}%` }} /></div>
      </section>

      <section className="player-grid">
        {sortedPlayers.map((player) => (
          <article key={player.id} className={`player-card glass-panel seat-${player.seat} ${player.id === game.turn.currentPlayerId ? 'active' : ''} ${player.eliminated ? 'eliminated' : ''}`}>
            <div className="player-color" />
            <div className="player-info"><strong>{player.name}</strong><small>{player.teamId ? `Equipo ${player.teamId} · ` : ''}{player.eliminated ? 'Eliminado' : `${player.wallsRemaining} paredes`}</small></div>
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
            <p>{game.winnerTeamId ? 'El equipo alcanzó la meta o fue el último con jugadores activos.' : 'Ha ganado la partida.'}</p>
            <div className="result-actions">
              <button className="ghost-button" onClick={onLeave}>Volver</button>
              {(canControlAll || isHost) && <button className="primary-button" onClick={onRematch}>Revancha</button>}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
