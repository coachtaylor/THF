import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
  ViewStyle,
  PressableProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, borderRadius, spacing } from '../../theme/theme';

export type GlassCardVariant = 'default' | 'hero' | 'heroPink' | 'liquid';

interface GlassCardProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  variant?: GlassCardVariant;
  shimmer?: boolean;
  pressable?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  noPadding?: boolean;
}

const variantConfig = {
  default: {
    baseColors: ['#0A0A0C', '#0A0A0C'] as [string, string],
    borderColor: colors.glass.border,
    showGlows: false,
    shadowColor: '#000',
    shadowOpacity: 0.3,
  },
  hero: {
    baseColors: ['#141418', '#0A0A0C'] as [string, string],
    borderColor: colors.glass.borderCyan,
    showGlows: true,
    glowColor: 'cyan',
    shadowColor: colors.accent.primary,
    shadowOpacity: 0.2,
  },
  heroPink: {
    baseColors: ['#141418', '#0A0A0C'] as [string, string],
    borderColor: colors.glass.borderPink,
    showGlows: true,
    glowColor: 'pink',
    shadowColor: colors.accent.secondary,
    shadowOpacity: 0.2,
  },
  liquid: {
    baseColors: ['#141418', '#0A0A0C'] as [string, string],
    borderColor: colors.glass.liquidBorder,
    showGlows: true,
    glowColor: 'both',
    shadowColor: colors.accent.primary,
    shadowOpacity: 0.15,
  },
};

export default function GlassCard({
  children,
  variant = 'default',
  shimmer = false,
  pressable = false,
  style,
  contentStyle,
  noPadding = false,
  onPress,
  ...pressableProps
}: GlassCardProps) {
  const config = variantConfig[variant];
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (shimmer) {
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
  }, [shimmer]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 400],
  });

  const handlePressIn = () => {
    if (pressable) {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (pressable) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  };

  const containerStyle: ViewStyle = {
    borderRadius: variant === 'default' ? borderRadius['2xl'] : borderRadius['3xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: config.borderColor,
    ...Platform.select({
      ios: {
        shadowColor: config.shadowColor,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: config.shadowOpacity,
        shadowRadius: 32,
      },
      android: { elevation: variant === 'default' ? 4 : 8 },
    }),
  };

  const renderContent = () => (
    <>
      {/* Base gradient background */}
      <LinearGradient
        colors={config.baseColors}
        style={StyleSheet.absoluteFill}
      />

      {/* Cyan glow overlay (top-right) */}
      {config.showGlows && (config.glowColor === 'cyan' || config.glowColor === 'both') && (
        <LinearGradient
          colors={['rgba(91, 206, 250, 0.2)', 'rgba(91, 206, 250, 0.08)', 'transparent']}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.glowOverlay}
        />
      )}

      {/* Pink glow overlay (bottom-left) */}
      {config.showGlows && (config.glowColor === 'pink' || config.glowColor === 'both') && (
        <LinearGradient
          colors={['rgba(245, 169, 184, 0.12)', 'transparent']}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={styles.glowOverlayPink}
        />
      )}

      {/* Shimmer effect */}
      {shimmer && (
        <Animated.View
          style={[
            styles.shimmerOverlay,
            { transform: [{ translateX: shimmerTranslate }] },
          ]}
        >
          <LinearGradient
            colors={['transparent', 'rgba(255, 255, 255, 0.03)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}

      {/* Glass highlight at top */}
      <View style={styles.glassHighlight} />

      {/* Content */}
      <View style={[styles.content, noPadding && styles.noPadding, contentStyle]}>
        {children}
      </View>
    </>
  );

  if (pressable || onPress) {
    return (
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
        <Pressable
          style={containerStyle}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
          {...pressableProps}
        >
          {renderContent()}
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <View style={[containerStyle, style]}>
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  glowOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '70%',
    height: '70%',
  },
  glowOverlayPink: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '50%',
    height: '50%',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 200,
  },
  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    padding: spacing.lg,
  },
  noPadding: {
    padding: 0,
  },
});
