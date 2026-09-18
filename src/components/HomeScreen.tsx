import type { CSSProperties } from 'react';
import {
  MODE_CONFIG,
  THEMES,
  type GameMode,
  type ThemeChoice
} from '../game';
import { AI_DIFFICULTIES } from '../ai';
import { usePreferences } from '../store/usePreferences';
import { useAppTheme } from '../theme/useAppTheme';
import { ThemeAtmosphere } from './ThemeAtmosphere';
import { NetworkStatus } from './NetworkStatus';
import { BrandSignature } from './BrandSignature';

type PreviewStyle = CSSProperties & {
  '--preview-a': string;
  '--preview-b': string;
  '--preview-c': string;
};

interface Props {
  firebaseConfigured: boolean;
  firebaseConnected: boolean;
  busy: boolean;
  resuming: boolean;
  error: string;
  roomCode: string;
  setRoomCode: (value: string) => void;
  onCreateOnline: () => void;
  onJoinOnline: () => void;
  onStartLocal: () => void;
  onStartAi: () => void;
  nearbyNativeAvailable: boolean;
  onCreateNearby: () => void;
}

export function HomeScreen({
  firebaseConfigured,
  firebaseConnected,
  busy,
  resuming,
  error,
  roomCode,
  setRoomCode,
  onCreateOnline,
  onJoinOnline,
  onStartLocal,
  onStartAi,
  nearbyNativeAvailable,
  onCreateNearby
}: Props) {
  const {
    nickname,
    mode,
    themeChoice,
    aiDifficulty,
    setNickname,
    setMode,
    setThemeChoice,
    setAiDifficulty
  } = usePreferences();

  useAppTheme(themeChoice);

  const selectedThemeName = themeChoice === 'random'
    ? 'Atmósfera aleatoria'
    : THEMES.find((theme) => theme.id === themeChoice)?.name ?? 'Atmósfera';

  const selectedAi = AI_DIFFICULTIES.find(
    (difficulty) => difficulty.id === aiDifficulty
  ) ?? AI_DIFFICULTIES[1];

  function createRoom() {
    if (!firebaseConfigured || !firebaseConnected) return;
    onCreateOnline();
  }

  function joinRoom() {
    if (!firebaseConfigured || !firebaseConnected) return;
    onJoinOnline();
  }

  return (
    <main className={`shell home-shell theme-${themeChoice}`}>
      {themeChoice !== 'random' && (
        <ThemeAtmosphere themeId={themeChoice} />
      )}

      <section className="hero glass-panel">
        <div className="brand-mark brand-mark-image" aria-hidden="true">
          <img src={`${import.meta.env.BASE_URL}brand/anchor.webp`} alt="" />
        </div>

        <div className="hero-content">
          <p className="eyebrow">PRIVATE STRATEGY ARENA</p>
          <h1>AnchorGrid</h1>
          <p className="hero-copy">
            Cruza, bloquea y anticipa. Juega con amigos, comparte una pantalla o reta a una CPU que realmente piensa.
          </p>

          <div className="hero-pills">
            <span>11×11</span>
            <span>30 s</span>
            <span>1v1 · 4P · 2v2</span>
            <span>VS IA</span>
            {firebaseConfigured && (
              <NetworkStatus connected={firebaseConnected} compact />
            )}
          </div>
        </div>
      </section>

      <section className="setup-grid">
        <div className="glass-panel setup-card identity-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">01 · IDENTIDAD</p>
              <h2>Tu nombre</h2>
            </div>
          </div>

          <input
            className="text-input"
            value={nickname}
            onChange={(event) => setNickname(event.target.value.slice(0, 18))}
            placeholder="Luics"
            autoComplete="nickname"
          />
        </div>

        <div className="glass-panel setup-card wide-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">02 · MODO</p>
              <h2>Cómo se juega</h2>
            </div>
          </div>

          <div className="mode-grid">
            {(Object.keys(MODE_CONFIG) as GameMode[]).map((id) => {
              const config = MODE_CONFIG[id];

              return (
                <button
                  key={id}
                  className={`mode-card ${mode === id ? 'selected' : ''}`}
                  onClick={() => setMode(id)}
                >
                  <span className="mode-icon">
                    {id === 'duel' ? '↕' : id === 'team2v2' ? '×' : '✦'}
                  </span>
                  <strong>{config.shortLabel}</strong>
                  <span>{config.label}</span>
                  <small>
                    {id === 'duel'
                      ? 'Llega al lado opuesto.'
                      : id === 'team2v2'
                        ? 'Equipo Morado vs Equipo Naranja.'
                        : 'Primero en alcanzar el centro.'}
                  </small>
                </button>
              );
            })}
          </div>
        </div>

        <div className="glass-panel setup-card wide-card theme-picker-card">
          <div className="section-heading atmosphere-heading">
            <div>
              <p className="eyebrow">03 · ATMÓSFERA</p>
              <h2>El tablero cambia de carácter</h2>
            </div>
            <p className="atmosphere-hint">
              Cada tema tiene movimiento propio durante toda la partida.
            </p>
          </div>

          <div className="theme-strip rich-themes">
            <button
              className={`theme-chip theme-preview random-preview ${themeChoice === 'random' ? 'selected' : ''}`}
              onClick={() => setThemeChoice('random')}
            >
              <span className="theme-preview-art random-swatch">
                <i /><i /><i />
              </span>
              <span>
                <strong>Aleatorio</strong>
                <small>Una atmósfera distinta en cada partida.</small>
              </span>
            </button>

            {THEMES.map((theme) => (
              <button
                key={theme.id}
                className={`theme-chip theme-preview preview-${theme.id} ${themeChoice === theme.id ? 'selected' : ''}`}
                onClick={() => setThemeChoice(theme.id as ThemeChoice)}
              >
                <span
                  className="theme-preview-art"
                  style={{
                    '--preview-a': theme.accent,
                    '--preview-b': theme.accent2,
                    '--preview-c': theme.accent3
                  } as PreviewStyle}
                >
                  <i /><i /><i />
                </span>
                <span>
                  <strong>{theme.name}</strong>
                  <small>{theme.description}</small>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-panel setup-card action-card online-card">
          <div>
            <p className="eyebrow">04 · SALA PRIVADA</p>
            <h2>Crear partida</h2>
            <p className="muted">
              Código de 4 dígitos, enlace directo y migración automática de host.
            </p>
          </div>

          <button
            className="primary-button"
            disabled={
              busy ||
              nickname.trim().length < 2 ||
              !firebaseConfigured ||
              !firebaseConnected
            }
            onClick={createRoom}
          >
            {busy
              ? 'Creando sala…'
              : !firebaseConfigured
                ? 'Online no configurado'
                : !firebaseConnected
                  ? 'Conectando…'
                  : 'Crear sala'}
          </button>

          {firebaseConfigured && firebaseConnected && (
            <p className="online-ready">
              ● Online listo · sincronización directa
            </p>
          )}
        </div>

        <div className="glass-panel setup-card action-card online-card">
          <div>
            <p className="eyebrow">05 · CÓDIGO</p>
            <h2>Unirse</h2>
            <p className="muted">
              Sin lista pública: entra quien tenga el código o el enlace.
            </p>
          </div>

          <div className="join-row">
            <input
              className="code-input"
              inputMode="numeric"
              value={roomCode}
              onChange={(event) => setRoomCode(
                event.target.value.replace(/\D/g, '').slice(0, 4)
              )}
              placeholder="4826"
              aria-label="Código de sala"
            />
            <button
              className="secondary-button"
              disabled={
                busy ||
                nickname.trim().length < 2 ||
                roomCode.length !== 4 ||
                !firebaseConfigured ||
                !firebaseConnected
              }
              onClick={joinRoom}
            >
              Entrar
            </button>
          </div>

          {resuming && (
            <p className="mini-status">
              Buscando tu asiento reservado…
            </p>
          )}
        </div>

        <section className="glass-panel setup-card wide-card local-play-card">
          <div className="local-play-copy">
            <p className="eyebrow">06 · JUEGO LOCAL</p>
            <h2>Una pantalla, todos los jugadores</h2>
            <p className="muted">
              Juega AnchorGrid directamente en este dispositivo. Sin sala,
              sin código y sin depender de Internet.
            </p>

            <div className="local-feature-row" aria-label="Características del juego local">
              <span>Sin Internet</span>
              <span>11×11</span>
              <span>10 paredes</span>
              <span>1v1 · 4P · 2v2</span>
            </div>
          </div>

          <div className="local-play-action">
            <div className="local-selection-summary">
              <small>Configuración actual</small>
              <strong>
                {MODE_CONFIG[mode].shortLabel} · {selectedThemeName}
              </strong>
            </div>

            <button
              className="primary-button local-start-button"
              disabled={nickname.trim().length < 2}
              onClick={onStartLocal}
            >
              Iniciar partida local
            </button>
          </div>
        </section>

        <section className="glass-panel setup-card wide-card ai-play-card">
          <div className="ai-play-heading">
            <div>
              <p className="eyebrow">07 · VS IA</p>
              <h2>Una CPU que compite de verdad</h2>
              <p className="muted">
                La IA usa las mismas reglas que tú. Fácil deja espacios; Maestro
                calcula rutas, paredes y respuestas sin volverse invencible.
              </p>
            </div>

            <span className="auto-performance-badge" title="AnchorGrid ajusta automáticamente efectos y carga según los FPS reales.">
              Rendimiento AUTO
            </span>
          </div>

          <div className="ai-difficulty-grid">
            {AI_DIFFICULTIES.map((difficulty) => (
              <button
                key={difficulty.id}
                className={`ai-difficulty-card ${aiDifficulty === difficulty.id ? 'selected' : ''}`}
                onClick={() => setAiDifficulty(difficulty.id)}
              >
                <span className="ai-difficulty-icon" aria-hidden="true">
                  {difficulty.icon}
                </span>
                <span>
                  <strong>{difficulty.label}</strong>
                  <small>{difficulty.shortDescription}</small>
                </span>
                <p>{difficulty.detail}</p>
              </button>
            ))}
          </div>

          <div className="ai-start-row">
            <div>
              <small>Dificultad seleccionada</small>
              <strong>
                {selectedAi.label} · {MODE_CONFIG[mode].shortLabel}
              </strong>
            </div>

            <button
              className="primary-button ai-start-button"
              disabled={nickname.trim().length < 2}
              onClick={onStartAi}
            >
              Jugar contra la IA
            </button>
          </div>
        </section>

        <section className="glass-panel setup-card wide-card nearby-play-card">
          <div className="nearby-play-heading">
            <div>
              <p className="eyebrow">08 · JUEGO CERCANO</p>
              <h2>Sala pública alrededor de ti</h2>
              <p className="muted">
                Sin código ni invitación. Un iPhone o Android crea la sala y los
                dispositivos cercanos pueden encontrarla. Un mismo dispositivo
                puede controlar uno o varios jugadores.
              </p>
            </div>

            <span className={`nearby-capability-badge ${nearbyNativeAvailable ? 'ready' : ''}`}>
              {nearbyNativeAvailable
                ? 'iPhone / Android listo'
                : 'Preparando app móvil'}
            </span>
          </div>

          <div className="nearby-play-features">
            <span>Sin código</span>
            <span>Sin enlace</span>
            <span>1–4 dispositivos</span>
            <span>Asientos compartidos</span>
          </div>

          <div className="nearby-play-actions">
            <div>
              <small>Configuración actual</small>
              <strong>
                {MODE_CONFIG[mode].shortLabel} · {selectedThemeName}
              </strong>
              <p>
                El host siempre puede iniciar. Los asientos que falten se
                completan en su dispositivo.
              </p>
            </div>

            <button
              className="primary-button nearby-create-button"
              disabled={nickname.trim().length < 2}
              onClick={onCreateNearby}
            >
              Crear sala pública
            </button>
          </div>
        </section>
      </section>

      {error && (
        <div className="notice error-notice">
          {error}
        </div>
      )}

      {!firebaseConfigured && (
        <div className="notice online-service-notice">
          El servicio de salas online aún no está conectado en este despliegue.
          La configuración es del administrador y nunca debe pedirse a los jugadores.
        </div>
      )}

      <footer className="home-brand-footer">
        <BrandSignature compact />
      </footer>
    </main>
  );
}
