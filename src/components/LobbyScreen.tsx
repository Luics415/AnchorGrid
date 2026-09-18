import { MODE_CONFIG, SEAT_ORDER, getTheme } from '../game';
import type { RoomRecord } from '../multiplayer/types';
import { useAppTheme } from '../theme/useAppTheme';
import { ThemeAtmosphere } from './ThemeAtmosphere';
import { NetworkStatus } from './NetworkStatus';
import { BrandSignature } from './BrandSignature';
import { getShareableFirebaseConfigParam } from '../multiplayer/firebase';

interface Props {
  room: RoomRecord;
  isHost: boolean;
  networkConnected: boolean;
  serverOffsetMs: number;
  error: string;
  onStart: () => void;
  onLeave: () => void;
}

const SEAT_LABEL: Record<string, string> = {
  north: 'Norte',
  east: 'Este',
  south: 'Sur',
  west: 'Oeste'
};

export function LobbyScreen({ room, isHost, networkConnected, serverOffsetMs, error, onStart, onLeave }: Props) {
  const theme = getTheme(room.meta.themeId);
  useAppTheme(room.meta.themeId);
  const players = Object.values(room.players).sort((a, b) => SEAT_ORDER.indexOf(a.seat) - SEAT_ORDER.indexOf(b.seat));
  const connected = players.filter((player) => player.connected).length;
  const ready = connected === room.meta.requiredPlayers;
  const cfg = getShareableFirebaseConfigParam();
  const inviteParams = new URLSearchParams({ room: room.code });
  if (cfg) inviteParams.set('cfg', cfg);
  const invite = `${window.location.origin}${window.location.pathname}?${inviteParams.toString()}`;

  async function copyInvite() {
    const text = `Únete a mi partida de AnchorGrid. Código: ${room.code}\n${invite}`;
    await navigator.clipboard?.writeText(text);
  }

  async function shareInvite() {
    const text = `Código ${room.code}`;
    if (navigator.share) await navigator.share({ title: 'AnchorGrid', text, url: invite });
    else await copyInvite();
  }

  return (
    <main className={`shell lobby-shell theme-${room.meta.themeId}`}>
      <ThemeAtmosphere themeId={room.meta.themeId} />
      {!networkConnected && <div className="connection-banner">Reconectando con la sala… tu asiento permanece reservado.</div>}

      <section className="glass-panel lobby-header">
        <div>
          <p className="eyebrow">SALA PRIVADA</p>
          <h1 className="room-code">{room.code}</h1>
          <p className="muted">{MODE_CONFIG[room.meta.mode].label} · {theme.name}</p>
        </div>
        <div className="lobby-actions">
          <NetworkStatus connected={networkConnected} isHost={isHost} epoch={room.authority.epoch} />
          <button className="secondary-button" onClick={copyInvite}>Copiar invitación</button>
          <button className="secondary-button" onClick={shareInvite}>Compartir</button>
        </div>
      </section>

      <section className="glass-panel lobby-panel">
        <div className="section-heading">
          <div><p className="eyebrow">JUGADORES</p><h2>{connected}/{room.meta.requiredPlayers} conectados</h2></div>
          <span className={`status-pill ${ready ? 'ready' : ''}`}>{ready ? 'Listos' : 'Esperando'}</span>
        </div>

        <div className="seat-list">
          {MODE_CONFIG[room.meta.mode].seats.map((seat) => {
            const player = players.find((candidate) => candidate.seat === seat);
            const isRoomHost = player?.uid === room.authority.hostUid;
            return (
              <div key={seat} className={`seat-row seat-${seat} ${player?.connected ? 'connected' : ''}`}>
                <div className="seat-dot" />
                <div className="seat-copy">
                  <strong>{player?.name ?? 'Esperando jugador…'}</strong>
                  <small>{SEAT_LABEL[seat]}{player?.teamId ? ` · Equipo ${player.teamId}` : ''}</small>
                </div>
                {isRoomHost && <span className="host-badge">HOST</span>}
                {player && !player.connected && <span className="offline-badge">OFFLINE</span>}
              </div>
            );
          })}
        </div>

        <div className="test-diagnostics">
          <span><b>Prueba multidispositivo</b></span>
          <span>Host migrable · época {room.authority.epoch}</span>
          <span>Reloj servidor {Math.round(serverOffsetMs)} ms</span>
          <span>{networkConnected ? 'Firebase conectado' : 'Esperando red'}</span>
        </div>

        {error && <div className="notice error-notice">{error}</div>}

        <div className="lobby-footer">
          <button className="ghost-button" onClick={onLeave}>Salir</button>
          {isHost ? (
            <button className="primary-button" disabled={!ready || !networkConnected} onClick={onStart}>Iniciar partida</button>
          ) : (
            <p className="muted">El host inicia cuando todos estén conectados.</p>
          )}
        </div>
      </section>
      <footer className="lobby-brand-footer"><BrandSignature compact /></footer>
    </main>
  );
}
