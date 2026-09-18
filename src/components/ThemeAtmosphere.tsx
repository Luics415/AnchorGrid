import { memo, type CSSProperties } from 'react';
import type { ThemeId } from '../game';
import type { AutoPerformanceQuality } from '../performance';

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
  quality?: AutoPerformanceQuality;
}

const GAME_DENSITY: Record<ThemeId, number> = {
  aurora: 10,
  bloom: 24,
  crystal: 14,
  stormlight: 8,
  nebula: 26,
  gardenPulse: 16
};

const AMBIENT_DENSITY: Record<ThemeId, number> = {
  aurora: 6,
  bloom: 10,
  crystal: 7,
  stormlight: 5,
  nebula: 12,
  gardenPulse: 8
};

const QUALITY_FACTOR: Record<AutoPerformanceQuality, number> = {
  high: 1,
  balanced: 0.72,
  performance: 0.46
};

function position(index: number, multiplier: number, offset = 0) {
  return (offset + index * multiplier) % 100;
}

export const ThemeAtmosphere = memo(function ThemeAtmosphere({
  themeId,
  compact = false,
  intensity = 'ambient',
  quality = 'balanced'
}: Props) {
  const baseCount = intensity === 'game'
    ? GAME_DENSITY[themeId]
    : AMBIENT_DENSITY[themeId];

  const count = compact
    ? Math.max(4, Math.min(7, Math.round(baseCount * 0.55)))
    : Math.max(4, Math.round(baseCount * QUALITY_FACTOR[quality]));

  return (
    <div
      className={`theme-atmosphere atmosphere-${themeId} atmosphere-${intensity} quality-${quality} ${compact ? 'compact' : ''}`}
      aria-hidden="true"
    >
      <span className="theme-field theme-field-a" />
      <span className="theme-field theme-field-b" />
      {quality !== 'performance' && <span className="theme-field theme-field-c" />}

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
});
