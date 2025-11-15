import { MD3DarkTheme } from 'react-native-paper';

// Dark Theme Palette (v2.0)
export const palette = {
  // Background Colors
  deepBlack: '#0A0E0E',
  darkCard: '#1A1F1F',
  darkerCard: '#141818',
  border: '#2A2F2F',
  
  // Accent Colors
  tealPrimary: '#00D9C0',
  tealDark: '#00B39D',
  tealGlow: 'rgba(0, 217, 192, 0.15)',
  
  // Text Colors
  white: '#FFFFFF',
  lightGray: '#B8C5C5',
  midGray: '#7A8585',
  disabled: '#4A5050',
  
  // Semantic Colors
  success: '#00D9C0',
  warning: '#FFB84D',
  error: '#FF6B6B',
  info: '#5B9FFF',
};

export const spacing = {
  xxs: 4,
  xs: 8,
  s: 12,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  display: { fontSize: 34, fontWeight: '700' as const, color: palette.white },
  h1: { fontSize: 28, fontWeight: '700' as const, color: palette.white },
  h2: { fontSize: 24, fontWeight: '600' as const, color: palette.white },
  h3: { fontSize: 20, fontWeight: '600' as const, color: palette.white },
  h4: { fontSize: 18, fontWeight: '600' as const, color: palette.white },
  bodyLarge: { fontSize: 17, fontWeight: '400' as const, color: palette.lightGray },
  body: { fontSize: 15, fontWeight: '400' as const, color: palette.lightGray },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, color: palette.midGray },
  caption: { fontSize: 12, fontWeight: '500' as const, color: palette.midGray },
  button: { fontSize: 16, fontWeight: '600' as const, color: palette.white },
};

export const darkTheme = {
  ...MD3DarkTheme,
  dark: true,
  colors: {
    ...MD3DarkTheme.colors,
    primary: palette.tealPrimary,
    primaryContainer: palette.tealDark,
    secondary: palette.info,
    secondaryContainer: '#4A7FCC',
    tertiary: palette.warning,
    background: palette.deepBlack,
    surface: palette.darkCard,
    surfaceVariant: palette.darkerCard,
    surfaceDisabled: palette.border,
    onPrimary: palette.deepBlack,
    onSecondary: palette.white,
    onSurface: palette.white,
    onSurfaceVariant: palette.lightGray,
    onSurfaceDisabled: palette.disabled,
    outline: palette.border,
    outlineVariant: '#3A4545',
    error: palette.error,
    errorContainer: '#CC5555',
    onError: palette.white,
    success: palette.success,
    warning: palette.warning,
    info: palette.info,
    backdrop: 'rgba(10, 14, 14, 0.8)',
  },
  roundness: 16,
  fonts: {
    ...MD3DarkTheme.fonts,
    displayLarge: { fontFamily: 'System', fontSize: 34, fontWeight: '700', letterSpacing: 0 },
    displayMedium: { fontFamily: 'System', fontSize: 28, fontWeight: '700', letterSpacing: 0 },
    displaySmall: { fontFamily: 'System', fontSize: 24, fontWeight: '600', letterSpacing: 0 },
    headlineLarge: { fontFamily: 'System', fontSize: 20, fontWeight: '600', letterSpacing: 0 },
    bodyLarge: { fontFamily: 'System', fontSize: 17, fontWeight: '400', letterSpacing: 0 },
    bodyMedium: { fontFamily: 'System', fontSize: 15, fontWeight: '400', letterSpacing: 0 },
    bodySmall: { fontFamily: 'System', fontSize: 13, fontWeight: '400', letterSpacing: 0 },
    labelLarge: { fontFamily: 'System', fontSize: 16, fontWeight: '600', letterSpacing: 0 },
  },
};

// Default theme (dark)
export const theme = darkTheme;

