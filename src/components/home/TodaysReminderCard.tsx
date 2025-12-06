import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/theme';

export default function TodaysReminderCard() {
  return (
    <View style={styles.container}>
      {/* Subtle glass background */}
      <LinearGradient
        colors={[colors.glass.bg, 'rgba(245, 169, 184, 0.03)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.indicator} />
      <View style={styles.content}>
        <Text style={styles.text}>
          Remove binder if you feel discomfort
        </Text>
      </View>
      <Pressable
        style={({ pressed }) => [
          styles.dismissButton,
          pressed && styles.dismissButtonPressed
        ]}
        hitSlop={12}
      >
        <Ionicons name="close" size={12} color={colors.text.disabled} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: colors.glass.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.glass.border,
    marginBottom: 8,
    overflow: 'hidden',
  },
  indicator: {
    width: 3,
    height: 16,
    borderRadius: 1.5,
    backgroundColor: colors.accent.secondary,
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.secondary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 4,
      },
    }),
  },
  content: {
    flex: 1,
  },
  text: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '400',
    color: colors.text.secondary,
    letterSpacing: -0.1,
  },
  dismissButton: {
    padding: 4,
  },
  dismissButtonPressed: {
    opacity: 0.5,
  },
});
