import type { CSSProperties } from 'react';
import type { ThemeId } from '../game';

type FxStyle = CSSProperties & { '--fx-index': number };

interface Props {
  themeId: ThemeId;
  compact?: boolean;
}

export function ThemeAtmosphere({ themeId, compact = false }: Props) {
  const count = compact ? 5 : 12;
  return (
    <div className={`theme-atmosphere atmosphere-${themeId} ${compact ? 'compact' : ''}`} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <i
          key={index}
          style={{
            '--fx-index': index,
            left: `${2 + (index * 17.3) % 94}%`,
            top: `${3 + (index * 23.7) % 91}%`,
            animationDelay: `${-(index * 2.37)}s`,
            animationDuration: `${18 + (index % 5) * 3}s`
          } as FxStyle}
        />
      ))}
    </div>
  );
}
