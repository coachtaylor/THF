// src/theme/components.ts
// TransFitness Component Styles - Pure FigmaMake Glass Aesthetic

import { StyleSheet, Platform } from 'react-native';
import { colors, spacing, borderRadius, shadows, typography } from './theme';

// ============================================
// GLASS MORPHISM STYLES
// ============================================

export const glassStyles = StyleSheet.create({
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

  cardHero: {
    backgroundColor: colors.glass.bgHero,
    borderRadius: borderRadius['3xl'],
    borderWidth: 1,
    borderColor: colors.glass.borderCyan,
    ...Platform.select({
      ios: shadows.ios.glassStrong,
      android: { elevation: shadows.android.glassStrong },
    }),
  },

  circle: {
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
});

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
    borderColor: colors.glass.border,
    backgroundColor: 'transparent',
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
    fontFamily: 'Anton',
    fontSize: typography.display1,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    letterSpacing: 1.5,
  },

  display2: {
    fontFamily: 'Anton',
    fontSize: typography.display2,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    letterSpacing: 1.2,
  },

  h1: {
    fontFamily: 'Anton',
    fontSize: typography.h1,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    letterSpacing: 1.0,
  },

  h2: {
    fontFamily: 'Anton',
    fontSize: typography.h2,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    letterSpacing: 0.8,
  },

  h3: {
    fontFamily: 'Anton',
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
    fontFamily: 'Anton',
    fontSize: typography.statHero,
    fontWeight: typography.weights.bold,
    color: colors.cyan[500],
    letterSpacing: 2.0,
  },

  statLarge: {
    fontFamily: 'Anton',
    fontSize: typography.statLarge,
    fontWeight: typography.weights.bold,
    color: colors.cyan[500],
    letterSpacing: 1.5,
  },

  statMedium: {
    fontFamily: 'Anton',
    fontSize: typography.statMedium,
    fontWeight: typography.weights.bold,
    color: colors.cyan[500],
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