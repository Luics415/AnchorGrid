import { useEffect } from 'react';
import { getTheme, type ThemeChoice, type ThemeId } from '../game';

const RANDOM_PREVIEW = {
  accent: '#D069B8',
  accent2: '#BAF0FA',
  accent3: '#4A7CA1',
  wall: '#344D75',
  glow: 'rgba(208,105,184,.38)',
  background: '#B6DDFE',
  backgroundSoft: '#E2DDF4',
  panelTint: 'rgba(255,255,255,.34)',
  boardFrom: 'rgba(255,255,255,.74)',
  boardTo: 'rgba(247,197,235,.24)',
  cellFrom: '#FAFDFF',
  cellTo: '#E8F4FA',
  center: '#F7C5EB'
};

export function useAppTheme(choice: ThemeChoice | ThemeId) {
  useEffect(() => {
    const root = document.documentElement;
    const theme = choice === 'random' ? RANDOM_PREVIEW : getTheme(choice);

    root.dataset.theme = choice;
    root.style.setProperty('--theme-accent', theme.accent);
    root.style.setProperty('--theme-accent-2', theme.accent2);
    root.style.setProperty('--theme-accent-3', theme.accent3);
    root.style.setProperty('--theme-wall', theme.wall);
    root.style.setProperty('--theme-glow', theme.glow);
    root.style.setProperty('--theme-bg', theme.background);
    root.style.setProperty('--theme-bg-soft', theme.backgroundSoft);
    root.style.setProperty('--theme-panel', theme.panelTint);
    root.style.setProperty('--theme-board-from', theme.boardFrom);
    root.style.setProperty('--theme-board-to', theme.boardTo);
    root.style.setProperty('--theme-cell-from', theme.cellFrom);
    root.style.setProperty('--theme-cell-to', theme.cellTo);
    root.style.setProperty('--theme-center', theme.center);

    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    meta?.setAttribute('content', theme.background);
  }, [choice]);
}
