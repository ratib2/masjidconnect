// src/utils/theme.js
import { useColorScheme } from 'react-native';
import { useApp } from '../context/AppContext';

export const COLORS = {
  primary: '#0f6e56',
  primaryLight: '#1d9e75',
  primaryBg: '#e1f5ee',
  primaryBorder: '#9fe1cb',

  // Light mode
  light: {
    bg: '#ffffff',
    bgSecondary: '#f5f5f5',
    bgCard: '#ffffff',
    text: '#111111',
    textSecondary: '#555555',
    textTertiary: '#999999',
    border: '#e0e0e0',
    borderSecondary: '#cccccc',
  },
  // Dark mode
  dark: {
    bg: '#0e1510',
    bgSecondary: '#1a2420',
    bgCard: '#1e2d28',
    text: '#f0f0f0',
    textSecondary: '#aaaaaa',
    textTertiary: '#666666',
    border: '#2a3d36',
    borderSecondary: '#3a5048',
  },
};

export function useTheme() {
  const system = useColorScheme();
  let { theme } = { theme: 'system' };
  try {
    ({ theme } = useApp());
  } catch (_) {}
  const mode = theme === 'system' ? system : theme;
  const colors = mode === 'dark' ? COLORS.dark : COLORS.light;
  return { colors, mode, isDark: mode === 'dark' };
}
