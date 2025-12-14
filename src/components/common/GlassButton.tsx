import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  Pressable,
  Text,
  Animated,
  Platform,
  ActivityIndicator,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, spacing, typography } from '../../theme/theme';

export type GlassButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type GlassButtonSize = 'small' | 'medium' | 'large';

interface GlassButtonProps {
  title: string;
  onPress: () => void;
  variant?: GlassButtonVariant;
  size?: GlassButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  shimmer?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const sizeConfig = {
  small: {
    height: 40,
    paddingHorizontal: spacing.l,
    fontSize: 14,
    iconSize: 16,
    borderRadius: borderRadius.md,
  },
  medium: {
    height: 52,
    paddingHorizontal: spacing.xl,
    fontSize: 15,
    iconSize: 18,
    borderRadius: borderRadius.lg,
  },
  large: {
    height: 56,
    paddingHorizontal: spacing['2xl'],
    fontSize: 16,
    iconSize: 20,
    borderRadius: 28, // Pill shape
  },
};

export default function GlassButton({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = true,
  shimmer = false,
  style,
  accessibilityLabel,
  accessibilityHint,
}: GlassButtonProps) {
  // Use title as default accessibility label
  const a11yLabel = accessibilityLabel || title;
  const a11yState = { disabled: disabled || loading };
  const sizeStyles = sizeConfig[size];
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (shimmer && variant === 'primary' && !disabled) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [shimmer, variant, disabled]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 400],
  });

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getTextColor = () => {
    if (disabled) return colors.text.disabled;
    switch (variant) {
      case 'primary':
        return colors.text.inverse;
      case 'secondary':
        return colors.accent.primary;
      case 'ghost':
        return colors.text.secondary;
      case 'danger':
        return colors.error;
      default:
        return colors.text.primary;
    }
  };

  const getIconColor = () => {
    if (disabled) return colors.text.disabled;
    switch (variant) {
      case 'primary':
        return colors.text.inverse;
      case 'secondary':
        return colors.accent.primary;
      case 'ghost':
        return colors.text.tertiary;
      case 'danger':
        return colors.error;
      default:
        return colors.text.primary;
    }
  };

  const containerStyle: ViewStyle = {
    height: sizeStyles.height,
    borderRadius: sizeStyles.borderRadius,
    overflow: 'hidden',
    opacity: disabled ? 0.4 : 1,
    ...(fullWidth ? {} : { alignSelf: 'flex-start' as const }),
  };

  const buttonStyle: ViewStyle = {
    height: '100%',
    paddingHorizontal: sizeStyles.paddingHorizontal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
  };

  const textStyle: TextStyle = {
    fontFamily: 'Poppins',
    fontSize: sizeStyles.fontSize,
    fontWeight: '600',
    color: getTextColor(),
    letterSpacing: -0.2,
  };

  const renderContent = () => (
    <>
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons name={icon} size={sizeStyles.iconSize} color={getIconColor()} />
          )}
          <Text style={textStyle}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <Ionicons name={icon} size={sizeStyles.iconSize} color={getIconColor()} />
          )}
        </>
      )}
    </>
  );

  const renderPrimaryButton = () => (
    <View style={containerStyle}>
      <Pressable
        style={buttonStyle}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={a11yState}
      >
        {/* Base gradient */}
        <LinearGradient
          colors={[colors.accent.primary, colors.accent.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Glass overlay - top highlight */}
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.05)', 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.glassOverlay}
        />

        {/* Shimmer effect */}
        {shimmer && !disabled && (
          <Animated.View
            style={[
              styles.shimmer,
              { transform: [{ translateX: shimmerTranslate }] },
            ]}
          >
            <LinearGradient
              colors={['transparent', 'rgba(255, 255, 255, 0.15)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        )}

        {renderContent()}
      </Pressable>
    </View>
  );

  const renderSecondaryButton = () => (
    <View
      style={[
        containerStyle,
        {
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: disabled ? colors.border.default : colors.glass.borderCyan,
          ...Platform.select({
            ios: disabled
              ? {}
              : {
                  shadowColor: colors.accent.primary,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                },
            android: {},
          }),
        },
      ]}
    >
      <Pressable
        style={buttonStyle}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={a11yState}
      >
        {renderContent()}
      </Pressable>
    </View>
  );

  const renderGhostButton = () => (
    <View style={[containerStyle, { backgroundColor: 'transparent' }]}>
      <Pressable
        style={buttonStyle}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={a11yState}
      >
        {renderContent()}
      </Pressable>
    </View>
  );

  const renderDangerButton = () => (
    <View
      style={[
        containerStyle,
        {
          backgroundColor: colors.glass.bg,
          borderWidth: 1,
          borderColor: `${colors.error}40`,
        },
      ]}
    >
      <Pressable
        style={buttonStyle}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={a11yState}
      >
        {renderContent()}
      </Pressable>
    </View>
  );

  const renderButton = () => {
    switch (variant) {
      case 'primary':
        return renderPrimaryButton();
      case 'secondary':
        return renderSecondaryButton();
      case 'ghost':
        return renderGhostButton();
      case 'danger':
        return renderDangerButton();
      default:
        return renderPrimaryButton();
    }
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      {renderButton()}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  glassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 100,
  },
});
