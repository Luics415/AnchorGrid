import { ThemeAtmosphere } from './ThemeAtmosphere';

interface Props {
  roomCode?: string;
  onContinue: () => void;
}

export function WelcomeScreen({ roomCode, onContinue }: Props) {
  const base = import.meta.env.BASE_URL;

  return (
    <main className="welcome-screen">
      <ThemeAtmosphere themeId="aurora" />
      <div className="welcome-backdrop-mark" aria-hidden="true" style={{ backgroundImage: `url(${base}brand/anchor.webp)` }} />

      <section className="welcome-card glass-panel" aria-labelledby="welcome-title">
        <div className="welcome-emblem-wrap" aria-hidden="true">
          <img className="welcome-emblem" src={`${base}brand/anchor.webp`} alt="" />
        </div>

        <div className="welcome-copy">
          <p className="eyebrow">PRIVATE STRATEGY ROOMS</p>
          <h1 id="welcome-title">AnchorGrid</h1>
          <p className="welcome-lead">
            Cruza, bloquea y anticipa. Cada pared cambia el camino, pero la meta siempre conserva una ruta válida.
          </p>

          <div className="welcome-features" aria-label="Características principales">
            <span><b>11×11</b><small>tablero fijo</small></span>
            <span><b>30 s</b><small>por turno</small></span>
            <span><b>1v1 · 4P · 2v2</b><small>salas privadas</small></span>
          </div>

          {roomCode && (
            <div className="welcome-invite">
              <small>INVITACIÓN DETECTADA</small>
              <strong>{roomCode}</strong>
              <span>Al continuar intentaremos recuperar o reservar tu asiento.</span>
            </div>
          )}

          <button className="primary-button welcome-enter" onClick={onContinue} autoFocus>
            {roomCode ? `Entrar a la sala ${roomCode}` : 'Entrar al tablero'}
          </button>
        </div>

        <footer className="welcome-signature">
          <img src={`${base}brand/signature.webp`} alt="Luics415" />
        </footer>
      </section>
    </main>
  );
}
