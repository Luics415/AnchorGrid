import type { CSSProperties } from 'react';
import type { ThemeId } from '../game';

type FxStyle = CSSProperties & {
  '--fx-index': number;
  '--fx-scale': number;
  '--fx-drift': string;
  '--fx-scale-end': number;
};

interface Props {
  themeId: ThemeId;
  compact?: boolean;
}

export function ThemeAtmosphere({ themeId, compact = false }: Props) {
  const count = compact ? 8 : 18;

  return (
    <div className={`theme-atmosphere atmosphere-${themeId} ${compact ? 'compact' : ''}`} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <i
          key={index}
          style={{
            '--fx-index': index,
            '--fx-scale': 0.72 + (index % 6) * 0.11,
            '--fx-drift': `${(index % 2 === 0 ? 1 : -1) * (18 + (index % 5) * 9)}px`,
            '--fx-scale-end': 1.06 + (index % 5) * 0.12,
            left: `${2 + (index * 17.3) % 94}%`,
            top: `${2 + (index * 23.7) % 92}%`,
            animationDelay: `${-(index * 2.83)}s`,
            animationDuration: `${20 + (index % 7) * 3.4}s`
          } as FxStyle}
        />
      ))}
    </div>
  );
}
