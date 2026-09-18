import type { CSSProperties } from 'react';
import type { ThemeId } from '../game';

type FxStyle = CSSProperties & {
  '--fx-index': number;
  '--fx-x': string;
  '--fx-y': string;
  '--fx-size': number;
  '--fx-drift-x': string;
  '--fx-drift-y': string;
  '--fx-rotation': string;
};

type AtmosphereIntensity = 'ambient' | 'game';

interface Props {
  themeId: ThemeId;
  compact?: boolean;
  intensity?: AtmosphereIntensity;
}

const GAME_DENSITY: Record<ThemeId, number> = {
  aurora: 12,
  bloom: 38,
  crystal: 18,
  stormlight: 12,
  nebula: 52,
  gardenPulse: 30
};

const AMBIENT_DENSITY: Record<ThemeId, number> = {
  aurora: 8,
  bloom: 14,
  crystal: 9,
  stormlight: 7,
  nebula: 18,
  gardenPulse: 12
};

function position(index: number, multiplier: number, offset = 0) {
  return (offset + index * multiplier) % 100;
}

export function ThemeAtmosphere({
  themeId,
  compact = false,
  intensity = 'ambient'
}: Props) {
  const count = compact
    ? Math.min(8, AMBIENT_DENSITY[themeId])
    : intensity === 'game'
      ? GAME_DENSITY[themeId]
      : AMBIENT_DENSITY[themeId];

  return (
    <div
      className={`theme-atmosphere atmosphere-${themeId} atmosphere-${intensity} ${compact ? 'compact' : ''}`}
      aria-hidden="true"
    >
      <span className="theme-field theme-field-a" />
      <span className="theme-field theme-field-b" />
      <span className="theme-field theme-field-c" />

      {Array.from({ length: count }, (_, index) => {
        const direction = index % 2 === 0 ? 1 : -1;
        const x = position(index, 37.13, 4);
        const y = position(index, 53.71, 6);
        const size = 0.68 + (index % 7) * 0.105;

        return (
          <i
            key={index}
            style={{
              '--fx-index': index,
              '--fx-x': `${x}%`,
              '--fx-y': `${y}%`,
              '--fx-size': size,
              '--fx-drift-x': `${direction * (44 + (index % 6) * 23)}px`,
              '--fx-drift-y': `${(index % 3 - 1) * (28 + (index % 5) * 17)}px`,
              '--fx-rotation': `${direction * (8 + (index % 5) * 7)}deg`,
              left: `${x}%`,
              top: `${y}%`,
              animationDelay: `${-(index * 2.73)}s`,
              animationDuration: `${18 + (index % 8) * 3.25}s`
            } as FxStyle}
          />
        );
      })}
    </div>
  );
}
