// src/theme/theme.ts
// TransFitness Design System - Pure FigmaMake Premium Glass Aesthetic

import { MD3DarkTheme } from 'react-native-paper';

// ============================================
// COLORS
// ============================================

export const colors = {
  // Primary - Cyan
  cyan: {
    500: '#06b6d4',
    600: '#0891b2',
    400: '#22d3ee',
  },

  // Secondary - Red
  red: {
    500: '#f43f5e',
    600: '#e11d48',
    400: '#fb7185',
  },

  // Backgrounds
  bg: {
    deep: '#000000',
    mid: '#0a0f14',
    raised: '#141b23',
    surface: '#1a2332',
  },

  // Glass Effects
  glass: {
    bg: 'rgba(255, 255, 255, 0.06)',
    bgHero: 'rgba(6, 182, 212, 0.08)',
    border: 'rgba(255, 255, 255, 0.1)',
    borderCyan: 'rgba(6, 182, 212, 0.15)',
  },

  // Text
  text: {
    primary: '#ffffff',
    secondary: '#b4bcd0',
    tertiary: '#6b7280',
    disabled: '#4b5563',
  },

  // Semantic
  semantic: {
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },

  // Glows (for shadows)
  glow: {
    cyan: 'rgba(6, 182, 212, 0.4)',
    red: 'rgba(244, 63, 94, 0.3)',
    white: 'rgba(255, 255, 255, 0.15)',
  },
};

// ============================================
// SPACING
// ============================================

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 28,
  '3xl': 32,
  '4xl': 40,
  '5xl': 56,
};

// ============================================
// TYPOGRAPHY
// ============================================

export const typography = {
  // Font Sizes
  display1: 42,
  display2: 36,
  h1: 32,
  h2: 26,
  h3: 22,
  h4: 20,
  body: 16,
  bodySmall: 14,
  label: 14,
  caption: 11,

  // Stats/Numbers
  statHero: 80,
  statLarge: 48,
  statMedium: 36,
  statSmall: 24,

  // Font Weights
  weights: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Line Heights
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Letter Spacing
  letterSpacing: {
    tight: -1.5,
    normal: -0.5,
    wide: 0.8,
  },
};

// ============================================
// BORDER RADIUS
// ============================================

export const borderRadius = {
  sm: 8,
  md: 10,
  base: 12,
  lg: 14,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
};

// ============================================
// SHADOWS
// ============================================

export const shadows = {
  // iOS shadows
  ios: {
    glass: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 24,
    },
    glassStrong: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.3,
      shadowRadius: 32,
    },
    cyan: {
      shadowColor: '#06b6d4',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 24,
    },
    cyanStrong: {
      shadowColor: '#06b6d4',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 32,
    },
  },

  // Android elevations
  android: {
    glass: 8,
    glassStrong: 12,
    button: 8,
    card: 4,
  },
};

// ============================================
// REACT NATIVE PAPER THEME
// ============================================

export const darkTheme = {
  ...MD3DarkTheme,
  dark: true,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.cyan[500],
    primaryContainer: colors.cyan[600],
    secondary: colors.semantic.info,
    secondaryContainer: '#4A7FCC',
    tertiary: colors.semantic.warning,
    background: colors.bg.deep,
    surface: colors.bg.raised,
    surfaceVariant: colors.bg.mid,
    surfaceDisabled: colors.glass.border,
    onPrimary: colors.bg.deep,
    onSecondary: colors.text.primary,
    onSurface: colors.text.primary,
    onSurfaceVariant: colors.text.secondary,
    onSurfaceDisabled: colors.text.disabled,
    outline: colors.glass.border,
    outlineVariant: '#3A4545',
    error: colors.semantic.error,
    errorContainer: '#CC5555',
    onError: colors.text.primary,
    backdrop: 'rgba(10, 14, 14, 0.8)',
  },
  roundness: 16,
  fonts: {
    ...MD3DarkTheme.fonts,
    displayLarge: { 
      fontFamily: 'Anton', 
      fontSize: 34, 
      fontWeight: '400' as const, 
      letterSpacing: 1.0 
    },
    displayMedium: { 
      fontFamily: 'Anton', 
      fontSize: 28, 
      fontWeight: '400' as const, 
      letterSpacing: 0.8 
    },
    displaySmall: { 
      fontFamily: 'Anton', 
      fontSize: 24, 
      fontWeight: '400' as const, 
      letterSpacing: 0.6 
    },
    headlineLarge: { 
      fontFamily: 'Anton', 
      fontSize: 20, 
      fontWeight: '400' as const, 
      letterSpacing: 0.5 
    },
    bodyLarge: { 
      fontFamily: 'Poppins', 
      fontSize: 17, 
      fontWeight: '400' as const, 
      letterSpacing: 0 
    },
    bodyMedium: { 
      fontFamily: 'Poppins', 
      fontSize: 15, 
      fontWeight: '400' as const, 
      letterSpacing: 0 
    },
    bodySmall: { 
      fontFamily: 'Poppins', 
      fontSize: 13, 
      fontWeight: '400' as const, 
      letterSpacing: 0 
    },
    labelLarge: { 
      fontFamily: 'Poppins', 
      fontSize: 16, 
      fontWeight: '600' as const, 
      letterSpacing: 0 
    },
  },
};

// Default export
export const theme = darkTheme;

// Legacy palette export for existing components that use it
// (Remove this after migrating all components to use 'colors')
export const palette = {
  deepBlack: colors.bg.deep,
  darkCard: colors.bg.raised,
  darkerCard: colors.bg.mid,
  border: colors.glass.border,
  tealPrimary: colors.cyan[500],
  tealDark: colors.cyan[600],
  white: colors.text.primary,
  lightGray: colors.text.secondary,
  midGray: colors.text.tertiary,
  disabled: colors.text.disabled,
  success: colors.semantic.success,
  warning: colors.semantic.warning,
  error: colors.semantic.error,
  info: colors.semantic.info,
};