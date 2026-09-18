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
            Cruza, bloquea y anticipa. Local, online o contra la IA.
          </p>

          <div className="hero-pills">
            <span>11×11</span>
            <span>30 s</span>
            <span>1v1 · 4P · 2v2</span>
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
                        ? 'Morado vs Naranja.'
                        : 'Primero al centro.'}
                  </small>
                </button>
              );
            })}
          </div>
        </div>

        <div className="glass-panel setup-card wide-card theme-picker-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">03 · ATMÓSFERA</p>
              <h2>Elige el ambiente</h2>
            </div>
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
                <small>Una distinta cada partida.</small>
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

        <section className="glass-panel setup-card wide-card local-hub-card">
          <div className="section-heading local-hub-heading">
            <div>
              <p className="eyebrow">04 · JUEGO LOCAL</p>
              <h2>Juega aquí o con dispositivos cercanos</h2>
            </div>
          </div>

          <div className="local-hub-actions">
            <article className="local-hub-option">
              <div>
                <span className="local-hub-icon" aria-hidden="true">▦</span>
                <strong>Este dispositivo</strong>
                <small>Todos juegan en la misma pantalla.</small>
              </div>
              <button
                className="primary-button"
                disabled={nickname.trim().length < 2}
                onClick={onStartLocal}
              >
                Jugar aquí
              </button>
            </article>

            <article className="local-hub-option nearby">
              <div>
                <span className="local-hub-icon" aria-hidden="true">◌</span>
                <strong>Dispositivos cercanos</strong>
                <small>
                  Sala pública · iPhone / Android
                  {nearbyNativeAvailable ? ' · lista' : ''}
                </small>
              </div>
              <button
                className="secondary-button"
                disabled={nickname.trim().length < 2}
                onClick={onCreateNearby}
              >
                Crear sala cercana
              </button>
            </article>
          </div>
        </section>

        <div className="glass-panel setup-card action-card online-card">
          <div>
            <p className="eyebrow">05 · SALA PRIVADA</p>
            <h2>Crear partida</h2>
            <p className="muted">Código de 4 dígitos y enlace directo.</p>
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
            <p className="online-ready">● Online listo</p>
          )}
        </div>

        <div className="glass-panel setup-card action-card online-card">
          <div>
            <p className="eyebrow">06 · CÓDIGO</p>
            <h2>Unirse</h2>
            <p className="muted">Escribe los 4 dígitos de la sala.</p>
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
            <p className="mini-status">Buscando tu asiento…</p>
          )}
        </div>

        <section className="glass-panel setup-card wide-card ai-play-card">
          <div className="ai-play-heading">
            <div>
              <p className="eyebrow">07 · VS IA</p>
              <h2>Elige dificultad</h2>
            </div>

            <span
              className="auto-performance-badge"
              title="AnchorGrid ajusta automáticamente los efectos según el rendimiento."
            >
              AUTO
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
              </button>
            ))}
          </div>

          <div className="ai-start-row">
            <div>
              <small>Seleccionado</small>
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
      </section>

      {error && (
        <div className="notice error-notice">
          {error}
        </div>
      )}

      {!firebaseConfigured && (
        <div className="notice online-service-notice">
          Salas online no disponibles en este despliegue.
        </div>
      )}

      <footer className="home-brand-footer">
        <BrandSignature compact />
      </footer>
    </main>
  );
}
