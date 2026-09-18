import { useMemo } from 'react';
import {
  MODE_CONFIG,
  SEAT_ORDER,
  getTheme,
  type GameAction,
  type GameState
} from '../game';
import type { ReactionEmoji, ReactionEvent } from '../reactions';
import { GameBoard } from './GameBoard';
import { useAppTheme } from '../theme/useAppTheme';
import { ThemeAtmosphere } from './ThemeAtmosphere';
import { NetworkStatus } from './NetworkStatus';
import { BrandSignature } from './BrandSignature';
import { TurnTimer } from './TurnTimer';
import { ReactionBar, ReactionTray } from './Reactions';
import { useAutoPerformance } from '../performance';

interface Props {
  game: GameState;
  roomCode?: string;
  localPlayerId?: string | null;
  controllablePlayerIds?: string[];
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
  aiThinking?: boolean;
  aiLabel?: string;
  sessionLabel?: string;
  reactions?: ReactionEvent[];
  onReact?: (emoji: ReactionEmoji) => void | Promise<void>;
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
  controllablePlayerIds = [],
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
  requiredPlayers,
  aiThinking = false,
  aiLabel,
  sessionLabel,
  reactions = [],
  onReact
}: Props) {
  const theme = getTheme(game.themeId);
  const autoPerformance = useAutoPerformance();
  useAppTheme(game.themeId);

  const activePlayer = game.players.find(
    (player) => player.id === game.turn.currentPlayerId
  );

  const inactivityWarning = game.turn.phase === 'warning';
  const controlsCurrentPlayer =
    canControlAll ||
    localPlayerId === game.turn.currentPlayerId ||
    controllablePlayerIds.includes(game.turn.currentPlayerId);

  const warningForLocalPlayer =
    inactivityWarning &&
    controlsCurrentPlayer;

  const mayDriveTimer =
    networkConnected &&
    (
      controlsCurrentPlayer ||
      Boolean(aiLabel) ||
      isHost
    );

  const sortedPlayers = useMemo(
    () => [...game.players].sort(
      (a, b) => SEAT_ORDER.indexOf(a.seat) - SEAT_ORDER.indexOf(b.seat)
    ),
    [game.players]
  );

  const rematchCount = Object.values(rematchVotes).filter(Boolean).length;
  const rematchTarget = requiredPlayers ?? game.players.length;
  const localVotedRematch = Boolean(
    localPlayerId && rematchVotes[localPlayerId]
  );

  return (
    <main
      className={`game-shell theme-${game.themeId} mode-${game.mode}`}
      data-performance={autoPerformance.quality}
    >
      <ThemeAtmosphere
        themeId={game.themeId}
        intensity="game"
        quality={autoPerformance.quality}
      />

      <ReactionTray reactions={reactions} players={game.players} />

      {!networkConnected && roomCode && (
        <div className="connection-banner">
          Conexión perdida. Reconectando sin abandonar tu asiento…
        </div>
      )}

      <header className="game-topbar glass-panel">
        <div>
          <p className="eyebrow">
            {roomCode
              ? `SALA ${roomCode}`
              : aiLabel
                ? 'VS IA'
                : sessionLabel ?? 'JUEGO LOCAL'}
          </p>
          <h1>{MODE_CONFIG[game.mode].label}</h1>
        </div>

        <div className="game-top-actions">
          {roomCode && (
            <NetworkStatus
              connected={networkConnected}
              isHost={isHost}
              epoch={authorityEpoch}
              revision={game.revision}
              compact
            />
          )}

          {aiLabel && (
            <span className={`ai-status-pill ${aiThinking ? 'thinking' : ''}`}>
              {aiThinking ? 'CPU pensando…' : aiLabel}
            </span>
          )}

          <span
            className="theme-badge"
            title={`Rendimiento automático · ${autoPerformance.quality}`}
          >
            {theme.name}
          </span>

          <button className="ghost-button" onClick={onLeave}>
            Salir
          </button>
        </div>
      </header>

      <TurnTimer
        gameStatus={game.status}
        revision={game.revision}
        turn={game.turn}
        activePlayerName={activePlayer?.name ?? '—'}
        warningForLocalPlayer={warningForLocalPlayer}
        mayDriveTimer={mayDriveTimer}
        serverNow={serverNow}
        onAction={onAction}
      />

      <section className="player-grid">
        {sortedPlayers.map((player) => (
          <article
            key={player.id}
            className={`player-card glass-panel seat-${player.seat} ${player.id === game.turn.currentPlayerId ? 'active' : ''} ${player.eliminated ? 'eliminated' : ''}`}
          >
            <div className="player-color" />
            <div className="player-info">
              <strong>{player.name}</strong>
              <small>
                {player.teamId ? `Equipo ${teamName(player.teamId)} · ` : ''}
                {player.eliminated
                  ? 'Eliminado'
                  : `${player.wallsRemaining} paredes${player.inactivityWarnings ? ` · ${player.inactivityWarnings} aviso${player.inactivityWarnings === 1 ? '' : 's'}` : ''}`}
              </small>
            </div>
            {!player.connected && <span className="offline-badge">OFFLINE</span>}
          </article>
        ))}
      </section>

      <GameBoard
        game={game}
        localPlayerId={localPlayerId}
        controllablePlayerIds={controllablePlayerIds}
        canControlAll={canControlAll}
        onAction={onAction}
      />

      {roomCode && (
        <div className="game-diagnostics" title="Datos útiles durante las pruebas entre dispositivos">
          R{game.revision} · movimiento {game.moveNumber} · reloj {Math.round(serverOffsetMs)} ms {isHost ? '· autoridad local' : ''}
        </div>
      )}

      {onReact && game.status === 'playing' && (
        <ReactionBar
          disabled={!networkConnected}
          onReact={onReact}
        />
      )}

      <BrandSignature compact className="game-signature" />

      {game.status === 'finished' && (
        <div className="result-backdrop">
          <section className="result-card glass-panel">
            <div className="result-rays" aria-hidden="true" />
            <p className="eyebrow">PARTIDA TERMINADA</p>
            <div className="result-symbol">✦</div>
            <h2>{winnerLabel(game)}</h2>
            <p>
              {game.winnerTeamId
                ? 'El equipo alcanzó la meta.'
                : 'Ha ganado la partida.'}
            </p>

            <div className={`result-actions result-actions-grid ${roomCode ? 'online-result-actions' : 'local-result-actions'}`}>
              {roomCode ? (
                <>
                  <button
                    className="secondary-button"
                    onClick={onReturnLobby}
                    disabled={!networkConnected}
                    title="Volver con todos a la sala de espera"
                  >
                    Regresar al lobby
                  </button>
                  <button className="ghost-button" onClick={onLeave}>
                    Menú principal
                  </button>
                  <button
                    className="primary-button rematch-vote-button"
                    onClick={onRequestRematch}
                    disabled={localVotedRematch || !networkConnected}
                  >
                    {`Revancha ${rematchCount}/${rematchTarget}${localVotedRematch ? ' ✓' : ''}`}
                  </button>
                  <small className="result-help">
                    Regresar al lobby devuelve la sala completa a espera. La revancha inicia automáticamente cuando voten todos.
                  </small>
                </>
              ) : (
                <>
                  <button className="ghost-button" onClick={onLeave}>
                    Menú principal
                  </button>
                  <button className="primary-button" onClick={onRematch}>
                    Revancha
                  </button>
                </>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
