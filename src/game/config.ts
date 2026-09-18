import type { GameMode, Seat, TeamId, ThemeId } from './types';

export const TURN_DURATION_MS = 30_000;

export const SEAT_ORDER: Seat[] = ['north', 'east', 'south', 'west'];

export const START_POSITIONS: Record<Seat, { row: number; col: number }> = {
  north: { row: 0, col: 5 },
  east: { row: 5, col: 10 },
  south: { row: 10, col: 5 },
  west: { row: 5, col: 0 }
};

export const MODE_CONFIG: Record<GameMode, {
  label: string;
  shortLabel: string;
  requiredPlayers: number;
  wallsPerPlayer: number;
  seats: Seat[];
  goal: 'oppositeEdge' | 'center' | 'teamCenter';
}> = {
  duel: {
    label: 'Duelo 1 vs 1',
    shortLabel: '1v1',
    requiredPlayers: 2,
    wallsPerPlayer: 10,
    seats: ['north', 'south'],
    goal: 'oppositeEdge'
  },
  freeForAll: {
    label: 'Todos al centro',
    shortLabel: '4P',
    requiredPlayers: 4,
    wallsPerPlayer: 7,
    seats: ['north', 'east', 'south', 'west'],
    goal: 'center'
  },
  team2v2: {
    label: 'Equipos 2 vs 2',
    shortLabel: '2v2',
    requiredPlayers: 4,
    wallsPerPlayer: 7,
    seats: ['north', 'east', 'south', 'west'],
    goal: 'teamCenter'
  }
};

export const TEAM_BY_SEAT: Partial<Record<Seat, TeamId>> = {
  north: 'A',
  south: 'A',
  east: 'B',
  west: 'B'
};

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  accent: string;
  accent2: string;
  accent3: string;
  wall: string;
  glow: string;
  background: string;
  backgroundSoft: string;
  panelTint: string;
  boardFrom: string;
  boardTo: string;
  cellFrom: string;
  cellTo: string;
  center: string;
}

export const THEMES: ThemeDefinition[] = [
  {
    id: 'aurora',
    name: 'Aurora',
    description: 'Cintas de energía fría con reflejos magenta.',
    accent: '#D069B8',
    accent2: '#BAF0FA',
    accent3: '#4A7CA1',
    wall: '#344D75',
    glow: 'rgba(208,105,184,.38)',
    background: '#B6DDFE',
    backgroundSoft: '#D7F1FF',
    panelTint: 'rgba(255,255,255,.34)',
    boardFrom: 'rgba(255,255,255,.72)',
    boardTo: 'rgba(186,240,250,.32)',
    cellFrom: '#F9FDFF',
    cellTo: '#E4F5FF',
    center: '#F7C5EB'
  },
  {
    id: 'bloom',
    name: 'Bloom',
    description: 'Pétalos suaves, rosa luminoso y vidrio floral.',
    accent: '#F7C5EB',
    accent2: '#D069B8',
    accent3: '#BAF0FA',
    wall: '#4A7CA1',
    glow: 'rgba(247,197,235,.55)',
    background: '#B6DDFE',
    backgroundSoft: '#F7DDF2',
    panelTint: 'rgba(255,245,252,.40)',
    boardFrom: 'rgba(255,248,253,.78)',
    boardTo: 'rgba(247,197,235,.28)',
    cellFrom: '#FFF9FD',
    cellTo: '#FBE6F5',
    center: '#D069B8'
  },
  {
    id: 'crystal',
    name: 'Crystal',
    description: 'Cian helado, facetas brillantes y muros prismáticos.',
    accent: '#BAF0FA',
    accent2: '#637D98',
    accent3: '#F7C5EB',
    wall: '#637D98',
    glow: 'rgba(186,240,250,.62)',
    background: '#B6DDFE',
    backgroundSoft: '#DDFBFF',
    panelTint: 'rgba(239,253,255,.38)',
    boardFrom: 'rgba(242,254,255,.82)',
    boardTo: 'rgba(99,125,152,.20)',
    cellFrom: '#F7FEFF',
    cellTo: '#D8F6FB',
    center: '#BAF0FA'
  },
  {
    id: 'stormlight',
    name: 'Stormlight',
    description: 'Azul profundo, pulsos eléctricos y contraste intenso.',
    accent: '#344D75',
    accent2: '#D069B8',
    accent3: '#BAF0FA',
    wall: '#263D62',
    glow: 'rgba(52,77,117,.52)',
    background: '#B6DDFE',
    backgroundSoft: '#9ABDD9',
    panelTint: 'rgba(231,242,251,.30)',
    boardFrom: 'rgba(76,104,139,.58)',
    boardTo: 'rgba(52,77,117,.72)',
    cellFrom: '#E7F1F8',
    cellTo: '#ABC7DB',
    center: '#D069B8'
  },
  {
    id: 'nebula',
    name: 'Nebula',
    description: 'Malva espacial, polvo estelar y profundidad azul.',
    accent: '#637D98',
    accent2: '#F7C5EB',
    accent3: '#D069B8',
    wall: '#4A668B',
    glow: 'rgba(99,125,152,.55)',
    background: '#B6DDFE',
    backgroundSoft: '#C8CBE5',
    panelTint: 'rgba(246,240,252,.34)',
    boardFrom: 'rgba(222,229,244,.70)',
    boardTo: 'rgba(99,125,152,.35)',
    cellFrom: '#F6F5FB',
    cellTo: '#D7DBEB',
    center: '#F7C5EB'
  },
  {
    id: 'gardenPulse',
    name: 'Garden Pulse',
    description: 'Pulso orgánico, cian acuoso y rosa vivo.',
    accent: '#BAF0FA',
    accent2: '#F7C5EB',
    accent3: '#D069B8',
    wall: '#4A7CA1',
    glow: 'rgba(247,197,235,.48)',
    background: '#B6DDFE',
    backgroundSoft: '#D8F4EE',
    panelTint: 'rgba(245,255,252,.36)',
    boardFrom: 'rgba(245,255,252,.76)',
    boardTo: 'rgba(186,240,250,.30)',
    cellFrom: '#FBFFFE',
    cellTo: '#E0F7F3',
    center: '#F7C5EB'
  }
];

export function resolveTheme(theme: ThemeId | 'random'): ThemeId {
  if (theme !== 'random') return theme;
  return THEMES[Math.floor(Math.random() * THEMES.length)].id;
}

export function getTheme(id: ThemeId) {
  return THEMES.find((theme) => theme.id === id) ?? THEMES[0];
}
