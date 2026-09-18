import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameMode, ThemeChoice } from '../game';

interface PreferencesState {
  nickname: string;
  mode: GameMode;
  themeChoice: ThemeChoice;
  soundEnabled: boolean;
  setNickname: (nickname: string) => void;
  setMode: (mode: GameMode) => void;
  setThemeChoice: (theme: ThemeChoice) => void;
  setSoundEnabled: (enabled: boolean) => void;
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      nickname: '',
      mode: 'duel',
      themeChoice: 'random',
      soundEnabled: true,
      setNickname: (nickname) => set({ nickname }),
      setMode: (mode) => set({ mode }),
      setThemeChoice: (themeChoice) => set({ themeChoice }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled })
    }),
    { name: 'anchorgrid-preferences' }
  )
);
