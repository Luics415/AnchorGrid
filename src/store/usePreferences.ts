import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameMode, ThemeChoice } from '../game';
import type { AiDifficulty } from '../ai';

interface PreferencesState {
  nickname: string;
  mode: GameMode;
  themeChoice: ThemeChoice;
  aiDifficulty: AiDifficulty;
  soundEnabled: boolean;
  setNickname: (nickname: string) => void;
  setMode: (mode: GameMode) => void;
  setThemeChoice: (theme: ThemeChoice) => void;
  setAiDifficulty: (difficulty: AiDifficulty) => void;
  setSoundEnabled: (enabled: boolean) => void;
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      nickname: '',
      mode: 'duel',
      themeChoice: 'random',
      aiDifficulty: 'normal',
      soundEnabled: true,
      setNickname: (nickname) => set({ nickname }),
      setMode: (mode) => set({ mode }),
      setThemeChoice: (themeChoice) => set({ themeChoice }),
      setAiDifficulty: (aiDifficulty) => set({ aiDifficulty }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled })
    }),
    { name: 'anchorgrid-preferences' }
  )
);
