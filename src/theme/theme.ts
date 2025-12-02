// Design System Tokens - TransFitness
// Use these tokens throughout the app for consistency

import { MD3DarkTheme } from 'react-native-paper';

export const colors = {
  // Background colors
  bg: {
    deep: '#0F1419',      // Primary dark background
    mid: '#151920',       // Secondary dark background
    card: '#1A1F26',      // Card backgrounds
    elevated: '#1F2530',  // Elevated surfaces
    raised: '#1F2530',    // Raised surfaces (alias for elevated)
  },

  // Glass morphism colors
  glass: {
    bg: 'rgba(255, 255, 255, 0.06)',
    bgHero: 'rgba(6, 182, 212, 0.08)',
    border: 'rgba(255, 255, 255, 0.1)',
    borderCyan: 'rgba(6, 182, 212, 0.15)',
  },

  // Text colors
  text: {
    primary: '#FFFFFF',   // Primary text (headers, important text)
    secondary: '#E0E4E8', // Secondary text (body text)
    tertiary: '#9CA3AF',  // Tertiary text (meta info, labels)
    disabled: '#6B7280',  // Disabled text
  },

  // Border colors
  border: {
    default: '#2A2F36',   // Default border color
    focus: '#00D9C0',     // Focused border color
    subtle: '#1F2530',    // Subtle border color
  },

  // Brand colors
  cyan: {
    400: '#22D3EE',
    500: '#06b6d4',       // Primary cyan
    600: '#00B39D',       // Darker cyan
    700: '#008F7D',
  },

  red: {
    400: '#F87171',
    500: '#EF4444',       // Primary red
    600: '#DC2626',
  },

  purple: {
    400: '#C084FC',
    500: '#A78BFA',       // Primary purple
    600: '#9333EA',
  },

  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Semantic colors (wrapper for status colors)
  semantic: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
};

export const spacing = {
  xxs: 2,
  xs: 4,
  s: 8,
  sm: 10,
  m: 12,
  base: 12,
  md: 14,
  l: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  xxl: 32,
  '3xl': 40,
  '4xl': 48,
  xxxl: 48,
};

export const borderRadius = {
  xs: 4,
  s: 8,
  sm: 8,
  m: 12,
  base: 12,
  md: 14,
  l: 16,
  lg: 20,
  xl: 20,
  '2xl': 24,
  xxl: 24,
  '3xl': 32,
  full: 999,
};

export const typography = {
  // Display sizes
  display1: 48,
  display2: 40,
  
  // Headings (fontSize values for direct use)
  h1: 32,
  h2: 24,
  h3: 20,
  h4: {
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: 0,
    lineHeight: 24,
  },

  // Body text
  body: 15,
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodySmall: 13,

  // Labels
  label: 11,
  labelLarge: {
    fontSize: 13,
    fontWeight: '600' as const,
    letterSpacing: 0.3,
  },

  // Button text
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  buttonSmall: {
    fontSize: 14,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },

  // Caption
  caption: 11,

  // Stats
  statHero: 32,
  statLarge: 24,
  statMedium: 20,

  // Weights
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Line heights
  lineHeights: {
    normal: 1.5,
    tight: 1.2,
    loose: 1.8,
  },

  // Letter spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
  },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  glow: {
    shadowColor: colors.cyan[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  // Platform-specific shadows
  ios: {
    glass: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.2,
      shadowRadius: 24,
    },
    glassStrong: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 32,
    },
    cyan: {
      shadowColor: colors.cyan[500],
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
    },
  },
  android: {
    glass: 8,
    glassStrong: 12,
    button: 8,
  },
};

// Animation timing
export const timing = {
  fast: 150,
  normal: 250,
  slow: 350,
};

// Common component styles
export const components = {
  card: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.m,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.l,
  },
  button: {
    primary: {
      backgroundColor: colors.cyan[500],
      borderRadius: borderRadius.m,
      paddingVertical: spacing.m,
      paddingHorizontal: spacing.l,
    },
    secondary: {
      backgroundColor: colors.bg.elevated,
      borderRadius: borderRadius.m,
      borderWidth: 1,
      borderColor: colors.border.default,
      paddingVertical: spacing.m,
      paddingHorizontal: spacing.l,
    },
  },
  input: {
    backgroundColor: colors.bg.elevated,
    borderRadius: borderRadius.m,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.l,
    fontSize: 15,
    color: colors.text.primary,
  },
};

// Layout
export const layout = {
  screenPadding: spacing.l,
  sectionSpacing: spacing.xl,
  cardSpacing: spacing.m,
};

// Legacy palette object for backward compatibility
// Maps old palette names to new colors structure
export const palette = {
  deepBlack: colors.bg.deep,
  white: colors.text.primary,
  midGray: colors.text.tertiary,
  lightGray: colors.text.secondary,
  darkCard: colors.bg.card,
  darkerCard: colors.bg.elevated,
  border: colors.border.default,
  tealPrimary: colors.cyan[500],
  tealDark: colors.cyan[600],
  tealGlow: colors.cyan[400],
  error: colors.error,
  success: colors.success,
  warning: colors.warning,
};

// React Native Paper theme
export const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.cyan[500],
    background: colors.bg.deep,
    surface: colors.bg.card,
    error: colors.error,
  },
};