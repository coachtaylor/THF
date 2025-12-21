// src/theme/components.ts
// TransFitness Component Styles - Liquid Glass Aesthetic with Trans Pride colors

import { StyleSheet, Platform } from 'react-native';
import { colors, spacing, borderRadius, shadows, typography } from './theme';

// ============================================
// LIQUID GLASS MORPHISM STYLES
// Advanced glass effects with depth and light refraction
// ============================================

export const glassStyles = StyleSheet.create({
  // Base glass card
  card: {
    backgroundColor: colors.glass.bg,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.glass.border,
    ...Platform.select({
      ios: shadows.ios.glass,
      android: { elevation: shadows.android.glass },
    }),
  },

  // Liquid glass - more advanced effect
  liquidCard: {
    backgroundColor: colors.glass.liquidBg,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.glass.liquidBorder,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: { elevation: 6 },
    }),
  },

  // Hero card with trans pride gradient hint
  cardHero: {
    backgroundColor: colors.glass.bgHero,
    borderRadius: borderRadius['3xl'],
    borderWidth: 1,
    borderColor: colors.glass.borderCyan,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 32,
      },
      android: { elevation: shadows.android.glassStrong },
    }),
  },

  // Pink accent hero card
  cardHeroPink: {
    backgroundColor: colors.glass.bgHeroPink,
    borderRadius: borderRadius['3xl'],
    borderWidth: 1,
    borderColor: colors.glass.borderPink,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.secondary,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 32,
      },
      android: { elevation: shadows.android.glassStrong },
    }),
  },

  circle: {
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },

  // Liquid highlight effect (for inner glow)
  liquidHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: colors.glass.liquidHighlight,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
  },
});

// ============================================
// LIQUID GLASS PRESETS
// Ready-to-use liquid glass configurations
// ============================================

export const liquidGlass = {
  // For cards with blue accent
  blue: {
    background: colors.glass.bgHero,
    border: colors.glass.borderCyan,
    glow: colors.accent.primaryGlow,
  },
  // For cards with pink accent
  pink: {
    background: colors.glass.bgHeroPink,
    border: colors.glass.borderPink,
    glow: colors.accent.secondaryGlow,
  },
  // Neutral glass
  neutral: {
    background: colors.glass.bg,
    border: colors.glass.border,
    glow: 'rgba(255, 255, 255, 0.1)',
  },
};

// ============================================
// BUTTON STYLES
// ============================================

export const buttonStyles = StyleSheet.create({
  primary: {
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.cyan[500],
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: shadows.ios.cyan,
      android: { elevation: shadows.android.button },
    }),
  },

  primaryDisabled: {
    opacity: 0.4,
    ...Platform.select({
      ios: { shadowOpacity: 0 },
      android: { elevation: 0 },
    }),
  },

  // Dashboard Start Workout button style (from Figma)
  // Dimensions: 331px width, 52px height, 26px border radius
  // Straight horizontal section: 279px (331 - 26 - 26 = 279)
  dashboardPrimary: {
    width: 331,
    height: 52,
    borderRadius: 26, // 26px rounded corners with 279px straight middle section
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  dashboardPrimaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.m,
    gap: spacing.xs,
    width: '100%',
    height: '100%',
  },

  dashboardPrimaryText: {
    fontFamily: 'Poppins',
    fontSize: typography.body,
    fontWeight: typography.weights.semibold,
    color: colors.bg.deep,
  },

  secondary: {
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.glass.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  ghost: {
    height: 48,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },

  icon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.base,
    ...glassStyles.circle,
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryText: {
    fontFamily: 'Poppins',
    fontSize: typography.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },

  secondaryText: {
    fontFamily: 'Poppins',
    fontSize: typography.body,
    fontWeight: typography.weights.medium,
    color: colors.cyan[400],
  },

  ghostText: {
    fontFamily: 'Poppins',
    fontSize: typography.bodySmall,
    fontWeight: typography.weights.medium,
    color: colors.text.tertiary,
  },
});

// ============================================
// INPUT STYLES
// ============================================

export const inputStyles = StyleSheet.create({
  textInput: {
    height: 60,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.glass.bg,
    borderWidth: 2,
    borderColor: colors.glass.border,
    paddingHorizontal: spacing.lg,
    fontFamily: 'Poppins',
    fontSize: typography.body,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },

  textInputFocused: {
    borderColor: colors.cyan[500],
    ...Platform.select({
      ios: shadows.ios.cyan,
      android: { elevation: shadows.android.button },
    }),
  },

  checkbox: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkboxChecked: {
    backgroundColor: colors.cyan[500],
    borderColor: colors.cyan[500],
    ...Platform.select({
      ios: {
        shadowColor: colors.cyan[500],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
    }),
  },
});

// ============================================
// CARD STYLES
// ============================================

export const cardStyles = StyleSheet.create({
  selection: {
    ...glassStyles.card,
    padding: spacing['2xl'],
  },

  selectionSelected: {
    borderWidth: 2,
    borderColor: colors.cyan[500],
    backgroundColor: colors.glass.bgHero,
    ...Platform.select({
      ios: shadows.ios.cyan,
      android: { elevation: shadows.android.glassStrong },
    }),
  },

  info: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    padding: spacing.lg,
  },

  warning: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    padding: spacing.lg,
  },

  success: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
    padding: spacing.lg,
  },
});

// ============================================
// TEXT STYLES
// ============================================

export const textStyles = StyleSheet.create({
  display1: {
    fontFamily: 'Poppins',
    fontSize: typography.display1,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    letterSpacing: 1.5,
  },

  display2: {
    fontFamily: 'Poppins',
    fontSize: typography.display2,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    letterSpacing: 1.2,
  },

  h1: {
    fontFamily: 'Poppins',
    fontSize: typography.h1,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    letterSpacing: 1.0,
  },

  h2: {
    fontFamily: 'Poppins',
    fontSize: typography.h2,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    letterSpacing: 0.8,
  },

  h3: {
    fontFamily: 'Poppins',
    fontSize: typography.h3,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    letterSpacing: 0.6,
  },

  body: {
    fontFamily: 'Poppins',
    fontSize: typography.body,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
    lineHeight: typography.body * typography.lineHeights.normal,
  },

  bodySmall: {
    fontFamily: 'Poppins',
    fontSize: typography.bodySmall,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
    lineHeight: typography.bodySmall * typography.lineHeights.normal,
  },

  label: {
    fontFamily: 'Poppins',
    fontSize: typography.label,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },

  caption: {
    fontFamily: 'Poppins',
    fontSize: typography.caption,
    fontWeight: typography.weights.regular,
    color: colors.text.tertiary,
    letterSpacing: typography.letterSpacing.wide,
    textTransform: 'uppercase',
  },

  statHero: {
    fontFamily: 'Poppins',
    fontSize: typography.statHero,
    fontWeight: typography.weights.bold,
    color: colors.cyan[500],
    letterSpacing: 2.0,
  },

  statLarge: {
    fontFamily: 'Poppins',
    fontSize: typography.statLarge,
    fontWeight: typography.weights.bold,
    color: colors.cyan[500],
    letterSpacing: 1.5,
  },

  statMedium: {
    fontFamily: 'Poppins',
    fontSize: typography.statMedium,
    fontWeight: typography.weights.bold,
    letterSpacing: 1.2,
  },

  statMediumBase: {
    fontFamily: 'Poppins',
    fontSize: typography.statMedium,
    fontWeight: typography.weights.bold,
    letterSpacing: 1.2,
  },
});

// ============================================
// LAYOUT STYLES
// ============================================

export const layoutStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg.deep,
  },

  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'android' ? spacing.lg : 0,
  },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  spaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

// ============================================
// STAT CARD STYLES (Legacy - kept for backwards compatibility)
// New StatCard component uses inline styles with new design tokens
// ============================================

export const statCardStyles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 100,
    backgroundColor: colors.bg.card,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '500',
    color: colors.text.tertiary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  valueRed: {
    fontFamily: 'Poppins',
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  valueCyan: {
    fontFamily: 'Poppins',
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
});