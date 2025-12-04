import React, { useRef, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius } from '../../theme/theme';

interface SelectionCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
  accentColor?: 'primary' | 'secondary';
}

export default function SelectionCard({
  icon,
  title,
  description,
  selected,
  onClick,
  accentColor = 'primary',
}: SelectionCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  const iconColor = accentColor === 'primary' ? colors.accent.primary : colors.accent.secondary;
  const borderColor = accentColor === 'primary' ? colors.glass.borderCyan : colors.glass.borderPink;
  const bgMuted = accentColor === 'primary' ? colors.accent.primaryMuted : colors.accent.secondaryMuted;

  useEffect(() => {
    if (selected) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.98,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 300,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();

      // Start shimmer for selected
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 2500,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 2500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      shimmerAnim.stopAnimation();
      shimmerAnim.setValue(0);
    }
  }, [selected]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 400],
  });

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onClick}
        style={({ pressed }) => [
          styles.card,
          selected && [styles.cardSelected, { borderColor }],
          pressed && styles.cardPressed,
        ]}
      >
        <LinearGradient
          colors={['#141418', '#0A0A0C']}
          style={StyleSheet.absoluteFill}
        />

        {selected && (
          <>
            <LinearGradient
              colors={[bgMuted, 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.selectedGlow}
            />
            <Animated.View
              style={[
                styles.shimmerOverlay,
                { transform: [{ translateX: shimmerTranslate }] },
              ]}
            >
              <LinearGradient
                colors={['transparent', 'rgba(255, 255, 255, 0.05)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </>
        )}

        <View style={styles.glassHighlight} />

        <View style={styles.content}>
          <View style={[styles.iconCircle, selected && { backgroundColor: bgMuted }]}>
            <Ionicons
              name={icon}
              size={24}
              color={selected ? iconColor : colors.text.secondary}
            />
          </View>

          <View style={styles.textContainer}>
            <Text style={[styles.title, selected && { color: colors.text.primary }]}>
              {title}
            </Text>
            <Text style={styles.description}>{description}</Text>
          </View>

          {selected && (
            <View style={[styles.checkmark, { backgroundColor: iconColor }]}>
              <Ionicons name="checkmark" size={16} color={colors.text.inverse} />
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.lg,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  cardSelected: {
    borderWidth: 2,
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.primary,
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: { elevation: 6 },
    }),
  },
  cardPressed: {
    opacity: 0.9,
  },
  selectedGlow: {
    ...StyleSheet.absoluteFillObject,
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
    flexDirection: 'row',
    gap: spacing.m,
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.glass.bgLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontFamily: 'Poppins',
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  description: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: colors.text.tertiary,
    lineHeight: 20,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
});
