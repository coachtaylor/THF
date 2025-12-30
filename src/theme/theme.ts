// Design System - TransFitness
// Elite, powerful, minimal aesthetic with Trans Pride colors

import { MD3DarkTheme } from "react-native-paper";

// ============================================
// COLOR SYSTEM
// Trans Pride: Blue (primary), Pink (secondary), White
// Same shade intensity as the previous orange
// ============================================

export const colors = {
  // Backgrounds - true dark
  bg: {
    primary: "#000000",
    secondary: "#0A0A0A",
    tertiary: "#111111",
    elevated: "#1A1A1A",
    // Legacy
    deep: "#000000",
    mid: "#0A0A0A",
    card: "#111111",
    raised: "#1A1A1A",
  },

  // Text - clean hierarchy
  text: {
    primary: "#FFFFFF",
    secondary: "rgba(255, 255, 255, 0.7)",
    tertiary: "rgba(255, 255, 255, 0.4)",
    disabled: "rgba(255, 255, 255, 0.25)",
    inverse: "#000000",
    statLabel: "rgba(255, 255, 255, 0.4)",
  },

  // Trans Pride accents - Blue (primary), Pink (secondary)
  // Same saturation/brightness as the orange #FF6B35
  accent: {
    primary: "#5BCEFA", // Trans blue - vibrant like the orange was
    primaryLight: "#7DD8FF",
    primaryDark: "#45A8D4",
    primaryMuted: "rgba(91, 206, 250, 0.15)",
    primaryGlow: "rgba(91, 206, 250, 0.3)",
    // Secondary - Trans pink
    secondary: "#F5A9B8", // Trans pink
    secondaryLight: "#FFB8C6",
    secondaryDark: "#E08A9A",
    secondaryMuted: "rgba(245, 169, 184, 0.15)",
    secondaryGlow: "rgba(245, 169, 184, 0.3)",
    // Success for completed states
    success: "#4ADE80",
    successMuted: "rgba(74, 222, 128, 0.15)",
    // Warning
    warning: "#FBBF24",
    warningMuted: "rgba(251, 191, 36, 0.12)",
  },

  // Gradient stops for hero elements
  gradient: {
    transPride: ["#5BCEFA", "#F5A9B8", "#FFFFFF", "#F5A9B8", "#5BCEFA"],
    transSubtle: ["rgba(91, 206, 250, 0.2)", "rgba(245, 169, 184, 0.15)"],
    warm: ["#5BCEFA", "#7DD8FF", "#A8E6FF"],
    pink: ["#F5A9B8", "#FFB8C6", "#FFD6E0"],
    dark: ["rgba(0,0,0,0)", "rgba(0,0,0,0.8)", "#000000"],
    overlay: ["transparent", "rgba(0,0,0,0.6)"],
    glass: ["rgba(91, 206, 250, 0.08)", "rgba(245, 169, 184, 0.05)"],
  },

  // Legacy support - mapped to new blue
  cyan: {
    400: "#7DD8FF",
    500: "#5BCEFA",
    600: "#45A8D4",
    700: "#3090BE",
  },
  // Pink for secondary uses
  pink: {
    400: "#FFB8C6",
    500: "#F5A9B8",
    600: "#E08A9A",
    700: "#CC6B7C",
  },
  red: {
    400: "#F5A9B8",
    500: "#F5A9B8",
    600: "#E08A9A",
    flame: "#F5A9B8",
    flameBg: "rgba(245, 169, 184, 0.15)",
  },
  purple: {
    400: "#7DD8FF",
    500: "#5BCEFA",
    600: "#45A8D4",
  },

  // Borders - barely visible with subtle blue tint
  border: {
    default: "rgba(255, 255, 255, 0.08)",
    subtle: "rgba(255, 255, 255, 0.04)",
    focus: "#5BCEFA",
    glow: "rgba(91, 206, 250, 0.2)",
  },

  // Liquid glass effects
  glass: {
    bg: "rgba(255, 255, 255, 0.03)",
    bgLight: "rgba(255, 255, 255, 0.05)",
    border: "rgba(255, 255, 255, 0.08)",
    borderLight: "rgba(255, 255, 255, 0.12)",
    bgHero: "rgba(91, 206, 250, 0.08)",
    bgHeroPink: "rgba(245, 169, 184, 0.08)",
    borderCyan: "rgba(91, 206, 250, 0.2)",
    borderPink: "rgba(245, 169, 184, 0.2)",
    // Liquid glass specific
    liquidBg: "rgba(91, 206, 250, 0.06)",
    liquidBorder: "rgba(91, 206, 250, 0.15)",
    liquidHighlight: "rgba(255, 255, 255, 0.1)",
  },

  // Semantic
  success: "#4ADE80",
  warning: "#FBBF24",
  error: "#EF4444",
  info: "#5BCEFA",

  semantic: {
    success: "#4ADE80",
    warning: "#FBBF24",
    error: "#EF4444",
    info: "#5BCEFA",
  },

  stat: {
    cardBg: "#111111",
    iconBgBlue: "rgba(91, 206, 250, 0.15)",
    iconBgPink: "rgba(245, 169, 184, 0.15)",
    iconBgRed: "rgba(245, 169, 184, 0.15)",
    iconBgGray: "rgba(255, 255, 255, 0.08)",
    labelColor: "rgba(255, 255, 255, 0.4)",
  },
};

// ============================================
// SPACING
// ============================================

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
  "2xl": 32,
  xxl: 32,
  "3xl": 40,
  "4xl": 48,
  xxxl: 48,
};

// ============================================
// BORDER RADIUS
// ============================================

export const borderRadius = {
  xs: 4,
  s: 6,
  sm: 8,
  m: 12,
  base: 12,
  md: 16,
  l: 20,
  lg: 24,
  xl: 28,
  "2xl": 32,
  xxl: 32,
  "3xl": 40,
  full: 999,
  // Semantic aliases for consistency
  pill: 28, // For pill-shaped buttons
  button: 28, // Alias for clarity
  input: 16, // Standard input field radius
  card: 24, // Standard card radius
};

export const radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  full: 999,
};

// ============================================
// TYPOGRAPHY
// Light, editorial, powerful
// ============================================

export const typography = {
  // Display - bold statement
  display1: 48,
  display2: 36,

  // Headings
  h1: 32,
  h2: 24,
  h3: 18,
  h4: {
    fontSize: 16,
    fontWeight: "500" as const,
    letterSpacing: -0.3,
    lineHeight: 22,
  },

  // Body
  body: 15,
  bodyLarge: {
    fontSize: 17,
    fontWeight: "400" as const,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  bodySmall: 13,

  // Labels
  label: 11,
  labelLarge: {
    fontSize: 13,
    fontWeight: "500" as const,
    letterSpacing: 0.5,
  },

  // Button
  button: {
    fontSize: 16,
    fontWeight: "600" as const,
    letterSpacing: -0.2,
  },
  buttonSmall: {
    fontSize: 14,
    fontWeight: "600" as const,
    letterSpacing: 0,
  },

  caption: 11,

  // Stats
  statHero: 36,
  statLarge: 28,
  statMedium: 22,

  // Weights
  weights: {
    light: "300" as const,
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },

  lineHeights: {
    tight: 1.1,
    normal: 1.3,
    relaxed: 1.5,
  },

  letterSpacing: {
    tighter: -0.5,
    tight: -0.3,
    normal: 0,
    wide: 0.5,
    wider: 1.0,
    caps: 1.5,
  },
};

// ============================================
// SHADOWS
// ============================================

export const shadows = {
  none: {},
  xs: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 3,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 5,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 8,
  },
  glow: {
    shadowColor: "#5BCEFA", // colors.accent.primary - inlined to avoid circular import
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 6,
  },
  ios: {
    glass: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
    },
    glassStrong: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
    },
    cyan: {
      shadowColor: "#5BCEFA", // colors.accent.primary - inlined to avoid circular import
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
    },
  },
  android: {
    glass: 4,
    glassStrong: 8,
    button: 6,
  },
};

export const shadowPresets = {
  none: {},
  subtle: shadows.xs,
  card: shadows.sm,
  elevated: shadows.md,
  prominent: shadows.lg,
};

// ============================================
// ANIMATION
// ============================================

export const timing = {
  fast: 150,
  normal: 250,
  slow: 400,
  shimmer: 3000, // Standardized shimmer animation duration
};

// ============================================
// ICON SIZES
// ============================================

export const iconSize = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

// ============================================
// ICON CONTAINER SIZES
// ============================================

export const iconContainer = {
  sm: 28, // Settings section icons
  md: 32, // Workout section icons
  lg: 44, // Stat circles
};

// ============================================
// BUTTON HEIGHTS
// ============================================

export const buttonHeight = {
  sm: 40,
  md: 52,
  lg: 56,
};

// ============================================
// STANDARD GRADIENTS
// ============================================

export const gradients = {
  cardBg: ["#141418", "#0A0A0C"] as const,
  restDayGlow: ["rgba(245, 169, 184, 0.1)", "transparent"] as const,
  buttonPrimary: ["#5BCEFA", "#45A8D4"] as const, // [colors.accent.primary, colors.accent.primaryDark] - inlined
  inputBg: ["#141418", "#0A0A0C"] as const,
  glassHighlight: ["rgba(255, 255, 255, 0.2)", "transparent"] as const,
  shimmer: ["transparent", "rgba(255, 255, 255, 0.15)", "transparent"] as const,
};

// ============================================
// INTERACTION FEEDBACK
// ============================================

export const interaction = {
  pressScale: 0.98, // Standard press scale for pressables
  pressOpacity: 0.85, // Alternative press feedback
};

// ============================================
// CONTENT SPACING
// ============================================

export const contentSpacing = {
  screenPadding: 24,
  sectionGap: 32,
  cardGap: 16,
  inlineGap: 8,
  cardPadding: 20,
  cardPaddingLarge: 24,
};

// ============================================
// COMPONENTS
// ============================================

export const components = {
  card: {
    backgroundColor: colors.bg.tertiary,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  button: {
    primary: {
      backgroundColor: "#5BCEFA", // colors.accent.primary - inlined to avoid circular import
      borderRadius: radii.full,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
    },
    secondary: {
      backgroundColor: "transparent",
      borderRadius: radii.full,
      borderWidth: 1,
      borderColor: colors.border.default,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
    },
  },
  input: {
    backgroundColor: colors.bg.tertiary,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.l,
    fontSize: 16,
    color: colors.text.primary,
  },
};

export const layout = {
  screenPadding: spacing.xl, // 24px - standardized screen edge padding
  sectionSpacing: spacing.xl, // 24px - between sections
  cardSpacing: spacing.l, // 16px - between cards
  headerHeight: 56, // Standard header height
};

// ============================================
// LEGACY
// ============================================

export const palette = {
  deepBlack: colors.bg.primary,
  white: colors.text.primary,
  midGray: colors.text.tertiary,
  lightGray: colors.text.secondary,
  darkCard: colors.bg.tertiary,
  darkerCard: colors.bg.elevated,
  border: colors.border.default,
  tealPrimary: "#5BCEFA", // colors.accent.primary - inlined
  tealDark: "#45A8D4", // colors.accent.primaryDark - inlined
  tealGlow: "#7DD8FF", // colors.accent.primaryLight - inlined
  error: colors.error,
  success: colors.success,
  warning: colors.warning,
};

export const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#5BCEFA", // colors.accent.primary - inlined to avoid circular import
    background: colors.bg.primary,
    surface: colors.bg.tertiary,
    surfaceVariant: colors.bg.elevated,
    elevation: {
      level0: "transparent",
      level1: colors.bg.secondary,
      level2: colors.bg.tertiary,
      level3: colors.bg.elevated,
      level4: colors.bg.elevated,
      level5: colors.bg.elevated,
    },
    error: colors.error,
  },
};
