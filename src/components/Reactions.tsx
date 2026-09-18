import { useEffect, useMemo, useState } from 'react';
import { REACTION_EMOJIS, type ReactionEmoji, type ReactionEvent } from '../reactions';
import type { PlayerState } from '../game';

interface BarProps {
  disabled?: boolean;
  onReact: (emoji: ReactionEmoji) => void | Promise<void>;
}

export function ReactionBar({ disabled = false, onReact }: BarProps) {
  const [open, setOpen] = useState(false);

  async function choose(emoji: ReactionEmoji) {
    setOpen(false);
    await onReact(emoji);
  }

  return (
    <div className={`reaction-bar ${open ? 'open' : ''}`}>
      <button
        type="button"
        className="reaction-toggle"
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label="Abrir reacciones"
      >
        😸
      </button>

      {open && (
        <div className="reaction-picker glass-panel" role="menu" aria-label="Reacciones rápidas">
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              role="menuitem"
              onClick={() => void choose(emoji)}
              aria-label={`Enviar ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface TrayProps {
  reactions: ReactionEvent[];
  players: PlayerState[];
}

export function ReactionTray({ reactions, players }: TrayProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (reactions.length === 0) return;

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [reactions.length]);

  const visible = useMemo(
    () => reactions
      .filter((reaction) => now - reaction.createdAt < 6500)
      .sort((a, b) => a.createdAt - b.createdAt)
      .slice(-6),
    [now, reactions]
  );

  if (visible.length === 0) return null;

  return (
    <div className="reaction-tray" aria-live="polite">
      {visible.map((reaction) => {
        const player = players.find((candidate) => candidate.id === reaction.uid);

        return (
          <div className="reaction-pop" key={reaction.id}>
            <span>{reaction.emoji}</span>
            <small>{player?.name ?? 'Jugador'}</small>
          </div>
        );
      })}
    </div>
  );
}
