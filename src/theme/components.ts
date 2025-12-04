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
// STAT CARD STYLES
// ============================================

// Extract color values for StyleSheet compatibility
const statRed = colors.red[500];
const statCyan = colors.cyan[500];

export const statCardStyles = StyleSheet.create({
  card: {
    width: 98.33, // Fixed width from Figma: 98.33px
    height: 110,
    backgroundColor: '#30363B', // Exact color from Figma
    borderRadius: 24, // border-radius: 24px from Figma
    padding: 18, // padding: 18px (all sides) from Figma
    borderWidth: 0,
    flexDirection: 'column', // flex-direction: column from Figma
    justifyContent: 'center', // justify-content: center from Figma
    alignItems: 'flex-start', // align-items: flex-start from Figma
    gap: 16, // gap: 12px from Figma (was incorrectly 16px)
    shadowColor: '#000', // React Native shadow color
    shadowOffset: { width: 0, height: 6 }, // box-shadow: 0px 6px from Figma
    shadowOpacity: 0.05, // rgba(0, 0, 0, 0.05) opacity
    shadowRadius: 40, // box-shadow blur: 40px from Figma
    elevation: 4,
    // Removed overflow: 'hidden' to allow shadows to be visible
    flexShrink: 0, // Prevent shrinking
    flexGrow: 0, // Prevent growing
  },

  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },

  iconContainer: {
    // Container for custom icons
  },

  icon: {
    marginBottom: spacing.xs,
  },

  valueBase: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: typography.weights.bold,
    lineHeight: 20,
    letterSpacing: 0,
    color: colors.text.primary,
  },

  valueRed: {
    fontFamily: 'Poppins', // Using Poppins (app standard) - Figma shows DM Sans but app uses Poppins
    fontSize: 14, // font-size: 14px from Figma CSS
    fontWeight: '700', // font-weight: 700 from Figma
    lineHeight: 20, // line-height: 20px from Figma CSS (identical to box height, or 143%)
    letterSpacing: 0,
    color: '#FFFFFF', // Exact white color from Figma
    textAlign: 'right', // text-align: right from Figma CSS
    alignSelf: 'stretch', // Stretch to full width of container
    // No marginTop - gap: 12px handles spacing
  },

  valueCyan: {
    fontFamily: 'Poppins', // Using Poppins (app standard) - Figma shows DM Sans but app uses Poppins
    fontSize: 14, // font-size: 14px from Figma CSS
    fontWeight: '700', // font-weight: 700 from Figma
    lineHeight: 20, // line-height: 20px from Figma CSS (identical to box height, or 143%)
    letterSpacing: 0,
    color: '#FFFFFF', // Exact white color from Figma
    textAlign: 'right', // text-align: right from Figma CSS
    alignSelf: 'stretch', // Stretch to full width of container
    // No marginTop - gap: 12px handles spacing
  },

  valueBottom: {
    // Legacy support
  },

  label: {
    fontFamily: 'Poppins', // Using Poppins (app standard) - Figma shows DM Sans but app uses Poppins
    fontSize: 10, // font-size: 10px from Figma CSS
    fontWeight: '500', // font-weight: 500 from Figma
    color: '#B4BCD0', // Exact color from Figma
    lineHeight: 12, // Adjusted from 0px (Figma shows 0px which would clip text, using 12px for readability)
    letterSpacing: 0.3, // letter-spacing: 0.03em = 0.03 * 10px = 0.3px (varies by card in Figma, using 0.3px)
    textTransform: 'uppercase', // Uppercase text
    textAlign: 'left', // Align to left (align-items: flex-start)
    alignSelf: 'stretch', // align-self: stretch from Figma
    // No marginTop - gap: 12px handles spacing
  },
});

// Helper function to get icon color for stat cards based on variant
export const getStatCardIconColor = (variant: 'red' | 'cyan'): string => {
  return variant === 'red' ? statRed : statCyan;
};