import type { CSSProperties } from 'react';
import type { ThemeId } from '../game';

type FxStyle = CSSProperties & { '--fx-index': number };

interface Props {
  themeId: ThemeId;
  compact?: boolean;
}

export function ThemeAtmosphere({ themeId, compact = false }: Props) {
  const count = compact ? 5 : 10;
  return (
    <div className={`theme-atmosphere atmosphere-${themeId} ${compact ? 'compact' : ''}`} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <i
          key={index}
          style={{
            '--fx-index': index,
            left: `${3 + (index * 7.1) % 91}%`,
            top: `${4 + (index * 11.7) % 88}%`,
            animationDelay: `${-(index * 0.37)}s`
          } as FxStyle}
        />
      ))}
    </div>
  );
}
