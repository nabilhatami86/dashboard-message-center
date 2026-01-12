import { ThemeType } from '@/store/themeStore';

export interface Theme {
  name: string;
  type: ThemeType;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
  };
  icon: string;
}

export const themes: Record<ThemeType, Theme> = {
  default: {
    name: 'Default Light',
    type: 'default',
    icon: '☀️',
    colors: {
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      accent: '#06b6d4',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#0f172a',
      textSecondary: '#64748b',
      border: '#e2e8f0',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
  dark: {
    name: 'Dark Mode',
    type: 'dark',
    icon: '🌙',
    colors: {
      primary: '#60a5fa',
      secondary: '#a78bfa',
      accent: '#22d3ee',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9',
      textSecondary: '#94a3b8',
      border: '#334155',
      success: '#34d399',
      warning: '#fbbf24',
      error: '#f87171',
    },
  },
  blue: {
    name: 'Ocean Blue',
    type: 'blue',
    icon: '🌊',
    colors: {
      primary: '#0ea5e9',
      secondary: '#06b6d4',
      accent: '#14b8a6',
      background: '#f0f9ff',
      surface: '#e0f2fe',
      text: '#0c4a6e',
      textSecondary: '#0369a1',
      border: '#bae6fd',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
  purple: {
    name: 'Purple Dream',
    type: 'purple',
    icon: '💜',
    colors: {
      primary: '#a855f7',
      secondary: '#d946ef',
      accent: '#ec4899',
      background: '#faf5ff',
      surface: '#f3e8ff',
      text: '#581c87',
      textSecondary: '#7e22ce',
      border: '#e9d5ff',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
  green: {
    name: 'Forest Green',
    type: 'green',
    icon: '🌲',
    colors: {
      primary: '#10b981',
      secondary: '#14b8a6',
      accent: '#22c55e',
      background: '#f0fdf4',
      surface: '#dcfce7',
      text: '#064e3b',
      textSecondary: '#047857',
      border: '#bbf7d0',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
  ocean: {
    name: 'Deep Ocean',
    type: 'ocean',
    icon: '🐋',
    colors: {
      primary: '#06b6d4',
      secondary: '#0891b2',
      accent: '#14b8a6',
      background: '#083344',
      surface: '#164e63',
      text: '#ecfeff',
      textSecondary: '#a5f3fc',
      border: '#0e7490',
      success: '#2dd4bf',
      warning: '#fbbf24',
      error: '#f87171',
    },
  },
};

export const getTheme = (type: ThemeType): Theme => {
  return themes[type] || themes.default;
};
