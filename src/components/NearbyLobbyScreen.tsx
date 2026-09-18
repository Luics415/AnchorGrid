import { useMemo, useState } from 'react';
import { MODE_CONFIG, TEAM_BY_SEAT, type Seat } from '../game';
import {
  claimAllNearbySeats,
  claimNearbyTeam,
  missingNearbySeats,
  nearbySeatLabel,
  type NearbyLobbyState
} from '../nearby';
import { BrandSignature } from './BrandSignature';
import { ThemeAtmosphere } from './ThemeAtmosphere';

interface Props {
  lobby: NearbyLobbyState;
  nativeAvailable: boolean;
  onChange: (lobby: NearbyLobbyState) => void;
  onToggleSeat: (seat: Seat) => void;
  onRenameSeat: (seat: Seat, value: string) => void;
  onStart: () => void;
  onLeave: () => void;
}

function teamLabel(seat: Seat) {
  const team = TEAM_BY_SEAT[seat];
  if (team === 'A') return 'Morado';
  if (team === 'B') return 'Naranja';
  return '';
}

export function NearbyLobbyScreen({
  lobby,
  nativeAvailable,
  onChange,
  onToggleSeat,
  onRenameSeat,
  onStart,
  onLeave
}: Props) {
  const [confirmFill, setConfirmFill] = useState(false);
  const config = MODE_CONFIG[lobby.mode];

  const missing = useMemo(
    () => missingNearbySeats(lobby),
    [lobby]
  );

  const localDevice = lobby.devices[lobby.localDeviceId];
  const connectedDevices = Object.values(lobby.devices)
    .filter((device) => device.connected);

  function requestStart() {
    if (missing.length === 0) {
      onStart();
      return;
    }
    setConfirmFill(true);
  }

  function confirmStart() {
    setConfirmFill(false);
    onStart();
  }

  return (
    <main className={`shell lobby-shell nearby-lobby-shell theme-${lobby.themeId} mode-${lobby.mode}`}>
      <ThemeAtmosphere themeId={lobby.themeId} />

      <section className="glass-panel nearby-lobby-header">
        <div>
          <p className="eyebrow">SALA CERCANA</p>
          <div className="nearby-public-title">
            <h1>Pública</h1>
            <span className="nearby-public-badge">SIN CÓDIGO</span>
          </div>
          <p className="muted">
            Visible para dispositivos cercanos. No usa enlace ni invitación de 4 dígitos.
          </p>
        </div>

        <div className="nearby-header-actions">
          <span className={`nearby-radio-pill ${nativeAvailable ? 'ready' : ''}`}>
            {nativeAvailable
              ? '● iPhone / Android cercano listo'
              : 'Vista local · puente móvil pendiente'}
          </span>
          <button className="ghost-button" onClick={onLeave}>
            Salir
          </button>
        </div>
      </section>

      {!nativeAvailable && (
        <div className="notice nearby-native-notice">
          La sala y el reparto de jugadores ya funcionan. En navegador puedes probar
          partidas mixtas en este dispositivo; el descubrimiento real entre iPhone y
          Android se activará al conectar el puente nativo de Nearby.
        </div>
      )}

      <section className="glass-panel nearby-seat-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">ASIENTOS</p>
            <h2>Un dispositivo puede controlar más de un jugador</h2>
          </div>
          <span className="status-pill ready">
            {config.seats.length - missing.length}/{config.seats.length} asignados
          </span>
        </div>

        <p className="nearby-seat-explainer">
          Esto permite, por ejemplo, 3 dispositivos en 4P con dos personas jugando
          desde uno de ellos, o un teléfono para todo el Equipo Morado y otro para
          todo el Equipo Naranja.
        </p>

        {lobby.mode === 'team2v2' && (
          <div className="nearby-team-presets">
            <button
              className="secondary-button nearby-team-purple"
              onClick={() => onChange(
                claimNearbyTeam(
                  lobby,
                  'purple',
                  localDevice?.name ?? 'Morado'
                )
              )}
            >
              Este dispositivo: Equipo Morado
            </button>

            <button
              className="secondary-button nearby-team-orange"
              onClick={() => onChange(
                claimNearbyTeam(
                  lobby,
                  'orange',
                  localDevice?.name ?? 'Naranja'
                )
              )}
            >
              Este dispositivo: Equipo Naranja
            </button>
          </div>
        )}

        <div className="nearby-seat-grid">
          {config.seats.map((seat) => {
            const assignment = lobby.assignments[seat];
            const isLocal = assignment?.deviceId === lobby.localDeviceId;
            const owner = assignment
              ? lobby.devices[assignment.deviceId]
              : undefined;

            return (
              <article
                key={seat}
                className={`nearby-seat-card seat-${seat} ${assignment ? 'assigned' : ''} ${isLocal ? 'local' : 'remote'}`}
              >
                <div className="nearby-seat-topline">
                  <span className="seat-dot" />
                  <div>
                    <strong>{nearbySeatLabel(seat)}</strong>
                    {lobby.mode === 'team2v2' && (
                      <small>Equipo {teamLabel(seat)}</small>
                    )}
                  </div>
                </div>

                {assignment ? (
                  <>
                    <div className="nearby-seat-owner">
                      <small>Dispositivo</small>
                      <strong>{owner?.name ?? 'Jugador cercano'}</strong>
                    </div>

                    {isLocal ? (
                      <input
                        className="nearby-player-name"
                        value={assignment.playerName}
                        maxLength={18}
                        onChange={(event) => onRenameSeat(
                          seat,
                          event.target.value
                        )}
                        aria-label={`Nombre del jugador ${nearbySeatLabel(seat)}`}
                      />
                    ) : (
                      <div className="nearby-remote-player">
                        {assignment.playerName}
                      </div>
                    )}

                    {isLocal && (
                      <button
                        className="nearby-seat-release"
                        onClick={() => onToggleSeat(seat)}
                      >
                        Liberar asiento
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    className="nearby-seat-claim"
                    onClick={() => onToggleSeat(seat)}
                  >
                    Jugar este asiento aquí
                  </button>
                )}
              </article>
            );
          })}
        </div>

        <div className="nearby-quick-row">
          <button
            className="secondary-button"
            onClick={() => onChange(
              claimAllNearbySeats(
                lobby,
                localDevice?.name ?? 'Jugador'
              )
            )}
          >
            Todos en este dispositivo
          </button>

          <div className="nearby-device-count">
            <small>Dispositivos conectados</small>
            <strong>{connectedDevices.length}</strong>
          </div>
        </div>
      </section>

      <section className="glass-panel nearby-start-card">
        <div>
          <p className="eyebrow">INICIAR</p>
          <h2>
            {missing.length === 0
              ? 'Todos los asientos están listos'
              : `${missing.length} asiento${missing.length === 1 ? '' : 's'} sin dispositivo`}
          </h2>
          <p className="muted">
            El botón permanece disponible. Si faltan jugadores, esos asientos
            se asignarán a este dispositivo antes de comenzar.
          </p>
        </div>

        <button
          className="primary-button nearby-start-button"
          onClick={requestStart}
        >
          Iniciar partida
        </button>
      </section>

      {confirmFill && (
        <div className="nearby-confirm-backdrop" role="dialog" aria-modal="true">
          <section className="nearby-confirm-card glass-panel">
            <p className="eyebrow">COMPLETAR LOCALMENTE</p>
            <h2>Este dispositivo tendrá más de un jugador</h2>
            <p>
              Los asientos <strong>{missing.map(nearbySeatLabel).join(', ')}</strong>
              {' '}no están asignados. Si continúas, se jugarán desde este dispositivo.
            </p>

            {lobby.mode === 'team2v2' && (
              <p className="nearby-team-example">
                En 2v2 puedes dejar un dispositivo con Morado (Norte + Sur) y
                otro con Naranja (Este + Oeste).
              </p>
            )}

            <div className="nearby-confirm-actions">
              <button
                className="ghost-button"
                onClick={() => setConfirmFill(false)}
              >
                Seguir esperando
              </button>
              <button
                className="primary-button"
                onClick={confirmStart}
              >
                Iniciar así
              </button>
            </div>
          </section>
        </div>
      )}

      <footer className="lobby-brand-footer">
        <BrandSignature compact />
      </footer>
    </main>
  );
}
