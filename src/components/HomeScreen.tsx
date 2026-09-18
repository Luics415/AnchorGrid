import { useState, type CSSProperties } from 'react';
import { MODE_CONFIG, THEMES, type GameMode, type ThemeChoice } from '../game';
import { usePreferences } from '../store/usePreferences';
import { useAppTheme } from '../theme/useAppTheme';
import { ThemeAtmosphere } from './ThemeAtmosphere';
import { NetworkStatus } from './NetworkStatus';
import { BrandSignature } from './BrandSignature';
import { saveRuntimeFirebaseConfig } from '../multiplayer/firebase';

type PreviewStyle = CSSProperties & { '--preview-a': string; '--preview-b': string; '--preview-c': string };

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
  onStartLocal
}: Props) {
  const {
    nickname,
    mode,
    themeChoice,
    setNickname,
    setMode,
    setThemeChoice
  } = usePreferences();

  const [onlineSetupOpen, setOnlineSetupOpen] = useState(false);
  const [firebaseSnippet, setFirebaseSnippet] = useState('');
  const [setupError, setSetupError] = useState('');

  useAppTheme(themeChoice);

  function createRoom() {
    if (!firebaseConfigured) {
      setOnlineSetupOpen(true);
      return;
    }
    onCreateOnline();
  }

  function joinRoom() {
    if (!firebaseConfigured) {
      setOnlineSetupOpen(true);
      return;
    }
    onJoinOnline();
  }

  function connectFirebase() {
    setSetupError('');
    try {
      saveRuntimeFirebaseConfig(firebaseSnippet);
    } catch (cause) {
      setSetupError(cause instanceof Error ? cause.message : 'No se pudo guardar la configuración.');
    }
  }

  return (
    <main className={`shell home-shell theme-${themeChoice}`}>
      {themeChoice !== 'random' && <ThemeAtmosphere themeId={themeChoice} />}
      <section className="hero glass-panel">
        <div className="brand-mark brand-mark-image" aria-hidden="true"><img src={`${import.meta.env.BASE_URL}brand/anchor.webp`} alt="" /></div>
        <div className="hero-content">
          <p className="eyebrow">PRIVATE STRATEGY ARENA</p>
          <h1>AnchorGrid</h1>
          <p className="hero-copy">
            Cruza, bloquea y anticipa. El tablero siempre conserva una ruta válida y cada turno mantiene la partida en movimiento.
          </p>
          <div className="hero-pills">
            <span>11×11</span><span>30 s</span><span>1v1 · 4P · 2v2</span>
            {firebaseConfigured && <NetworkStatus connected={firebaseConnected} compact />}
          </div>
        </div>
      </section>

      <section className="setup-grid">
        <div className="glass-panel setup-card identity-card">
          <div className="section-heading"><div><p className="eyebrow">01 · IDENTIDAD</p><h2>Tu nombre</h2></div></div>
          <input
            className="text-input"
            value={nickname}
            onChange={(event) => setNickname(event.target.value.slice(0, 18))}
            placeholder="Luics"
            autoComplete="nickname"
          />
        </div>

        <div className="glass-panel setup-card wide-card">
          <div className="section-heading"><div><p className="eyebrow">02 · MODO</p><h2>Cómo se juega</h2></div></div>
          <div className="mode-grid">
            {(Object.keys(MODE_CONFIG) as GameMode[]).map((id) => {
              const config = MODE_CONFIG[id];
              return (
                <button key={id} className={`mode-card ${mode === id ? 'selected' : ''}`} onClick={() => setMode(id)}>
                  <span className="mode-icon">{id === 'duel' ? '↕' : id === 'team2v2' ? '×' : '✦'}</span>
                  <strong>{config.shortLabel}</strong>
                  <span>{config.label}</span>
                  <small>{id === 'duel' ? 'Llega al lado opuesto.' : id === 'team2v2' ? 'Equipos cruzados hacia el centro.' : 'Primero en alcanzar el centro.'}</small>
                </button>
              );
            })}
          </div>
        </div>

        <div className="glass-panel setup-card wide-card theme-picker-card">
          <div className="section-heading"><div><p className="eyebrow">03 · ATMÓSFERA</p><h2>El tablero cambia de carácter</h2></div></div>
          <div className="theme-strip rich-themes">
            <button className={`theme-chip theme-preview random-preview ${themeChoice === 'random' ? 'selected' : ''}`} onClick={() => setThemeChoice('random')}>
              <span className="theme-preview-art random-swatch"><i /><i /><i /></span>
              <span><strong>Aleatorio</strong><small>Una atmósfera distinta en cada partida.</small></span>
            </button>
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                className={`theme-chip theme-preview preview-${theme.id} ${themeChoice === theme.id ? 'selected' : ''}`}
                onClick={() => setThemeChoice(theme.id as ThemeChoice)}
              >
                <span className="theme-preview-art" style={{ '--preview-a': theme.accent, '--preview-b': theme.accent2, '--preview-c': theme.accent3 } as PreviewStyle}>
                  <i /><i /><i />
                </span>
                <span><strong>{theme.name}</strong><small>{theme.description}</small></span>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-panel setup-card action-card online-card">
          <div>
            <p className="eyebrow">04 · SALA PRIVADA</p>
            <h2>Crear partida</h2>
            <p className="muted">Código de 4 dígitos, enlace directo y migración automática de host.</p>
          </div>
          <button className="primary-button" disabled={busy || nickname.trim().length < 2} onClick={createRoom}>
            {busy ? 'Preparando…' : 'Crear sala'}
          </button>
        </div>

        <div className="glass-panel setup-card action-card online-card">
          <div>
            <p className="eyebrow">05 · CÓDIGO</p>
            <h2>Unirse</h2>
            <p className="muted">Sin lista pública: entra quien tenga el código o el enlace.</p>
          </div>
          <div className="join-row">
            <input className="code-input" inputMode="numeric" value={roomCode} onChange={(event) => setRoomCode(event.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="4826" aria-label="Código de sala" />
            <button className="secondary-button" disabled={busy || nickname.trim().length < 2 || roomCode.length !== 4} onClick={joinRoom}>Entrar</button>
          </div>
          {resuming && <p className="mini-status">Buscando tu asiento reservado…</p>}
        </div>
      </section>

      {error && <div className="notice error-notice">{error}</div>}

      {!firebaseConfigured && (
        <section className={`online-setup glass-panel ${onlineSetupOpen ? 'open' : ''}`}>
          <button className="online-setup-toggle" onClick={() => setOnlineSetupOpen((value) => !value)}>
            <span><b>Salas privadas</b><small>{onlineSetupOpen ? 'Ocultar configuración' : 'Conectar Firebase para crear códigos de 4 dígitos'}</small></span>
            <strong>{onlineSetupOpen ? '−' : '+'}</strong>
          </button>
          {onlineSetupOpen && (
            <div className="online-setup-body">
              <p>Pega el objeto <code>firebaseConfig</code> de tu Web App. Se guarda sólo en este navegador. Si creas una sala con esta configuración, la invitación directa puede transportarla al dispositivo de tus amigos.</p>
              <textarea
                className="firebase-config-input"
                value={firebaseSnippet}
                onChange={(event) => setFirebaseSnippet(event.target.value)}
                placeholder={'const firebaseConfig = {\n  apiKey: "...",\n  authDomain: "...",\n  databaseURL: "https://...firebaseio.com",\n  projectId: "...",\n  appId: "..."\n};'}
                spellCheck={false}
              />
              {setupError && <div className="notice error-notice">{setupError}</div>}
              <div className="online-setup-actions">
                <button className="primary-button" onClick={connectFirebase} disabled={!firebaseSnippet.trim()}>Activar salas</button>
                <small>Authentication anónimo y Realtime Database deben estar habilitados en Firebase.</small>
              </div>
            </div>
          )}
        </section>
      )}

      <button className="local-test-button" disabled={nickname.trim().length < 2} onClick={onStartLocal}>Probar partida local</button>
      <footer className="home-brand-footer"><BrandSignature compact /></footer>
    </main>
  );
}
