import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeType = 'default' | 'dark' | 'blue' | 'purple' | 'green' | 'ocean';

interface ThemeStore {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: 'default',
      setTheme: (theme) => {
        set({ theme });
        // Apply theme to document
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', theme);
        }
      },
    }),
    {
      name: 'dashboard-theme',
    }
  )
);
