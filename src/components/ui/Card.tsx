import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { palette, spacing } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export default function Card({ children, style, variant = 'default', padding = 'medium' }: CardProps) {
  const paddingValue = padding === 'none' ? 0 : padding === 'small' ? spacing.s : padding === 'medium' ? spacing.m : spacing.l;

  return (
    <View style={[
      styles.card,
      variant === 'elevated' && styles.elevated,
      variant === 'outlined' && styles.outlined,
      { padding: paddingValue },
      style,
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.darkCard,
    borderRadius: 20,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  outlined: {
    borderWidth: 2,
    borderColor: palette.border,
  },
});

