import { useState } from 'react';
import { useInstallApp } from '../pwa/useInstallApp';
import { ThemeAtmosphere } from './ThemeAtmosphere';

interface Props {
  roomCode?: string;
  onContinue: () => void;
}

export function WelcomeScreen({ roomCode, onContinue }: Props) {
  const base = import.meta.env.BASE_URL;
  const {
    installed,
    canPromptInstall,
    isIos,
    install
  } = useInstallApp();

  const [showIosSteps, setShowIosSteps] = useState(false);
  const showInstallOption = !installed && (canPromptInstall || isIos);

  return (
    <main className="welcome-screen">
      <ThemeAtmosphere themeId="aurora" />
      <div
        className="welcome-backdrop-mark"
        aria-hidden="true"
        style={{ backgroundImage: `url(${base}brand/anchor.webp)` }}
      />

      <section
        className="welcome-card glass-panel"
        aria-labelledby="welcome-title"
      >
        <div className="welcome-emblem-wrap" aria-hidden="true">
          <img
            className="welcome-emblem"
            src={`${base}brand/anchor.webp`}
            alt=""
          />
        </div>

        <div className="welcome-copy">
          <p className="eyebrow">PRIVATE STRATEGY ROOMS</p>
          <h1 id="welcome-title">AnchorGrid</h1>
          <p className="welcome-lead">
            Cruza, bloquea y anticipa. Juega online, comparte una pantalla o reta
            a una IA competitiva sin perder la fluidez del tablero.
          </p>

          <div
            className="welcome-features"
            aria-label="Características principales"
          >
            <span><b>11×11</b><small>tablero fijo</small></span>
            <span><b>1v1 · 4P · 2v2</b><small>tres modos</small></span>
            <span><b>VS IA</b><small>4 dificultades</small></span>
          </div>

          {roomCode && (
            <div className="welcome-invite">
              <small>INVITACIÓN DETECTADA</small>
              <strong>{roomCode}</strong>
              <span>
                Al continuar intentaremos recuperar o reservar tu asiento.
              </span>
            </div>
          )}

          <div className="welcome-primary-actions">
            <button
              className="primary-button welcome-enter"
              onClick={onContinue}
              autoFocus
            >
              {roomCode
                ? `Entrar a la sala ${roomCode}`
                : 'Entrar a AnchorGrid'}
            </button>

            {showInstallOption && canPromptInstall && (
              <button
                className="secondary-button welcome-install-button"
                onClick={() => void install()}
              >
                <span className="welcome-install-icon" aria-hidden="true">↓</span>
                Instalar AnchorGrid
              </button>
            )}

            {showInstallOption && isIos && !canPromptInstall && (
              <button
                className="secondary-button welcome-install-button"
                onClick={() => setShowIosSteps((current) => !current)}
                aria-expanded={showIosSteps}
              >
                <span className="welcome-install-icon" aria-hidden="true">＋</span>
                Instalar en iPhone / iPad
              </button>
            )}
          </div>

          {showInstallOption && (
            <p className="welcome-install-note">
              Instalar es opcional. AnchorGrid seguirá funcionando en el navegador.
            </p>
          )}

          {showInstallOption && isIos && showIosSteps && (
            <div className="ios-install-guide" role="status">
              <div className="ios-install-step">
                <span>1</span>
                <p>
                  En Safari toca <strong>Compartir</strong>.
                </p>
              </div>
              <div className="ios-install-step">
                <span>2</span>
                <p>
                  Elige <strong>Agregar a pantalla de inicio</strong>.
                </p>
              </div>
              <div className="ios-install-step">
                <span>3</span>
                <p>
                  Abre AnchorGrid desde su nuevo icono.
                </p>
              </div>
            </div>
          )}

          {!showInstallOption && installed && (
            <div className="welcome-installed-badge">
              <span aria-hidden="true">✓</span>
              Ejecutándose como aplicación
            </div>
          )}
        </div>

        <footer className="welcome-signature">
          <img src={`${base}brand/signature.webp`} alt="Luics415" />
        </footer>
      </section>
    </main>
  );
}
