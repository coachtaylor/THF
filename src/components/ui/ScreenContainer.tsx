import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../../theme';

interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  padding?: 'none' | 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export default function ScreenContainer({ 
  children, 
  scrollable = false, 
  padding = 'medium',
  style 
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();
  const paddingValue = padding === 'none' ? 0 : padding === 'small' ? spacing.s : padding === 'medium' ? spacing.l : spacing.xl;

  const containerStyle = {
    paddingTop: Math.max(insets.top, paddingValue),
    paddingBottom: Math.max(insets.bottom + spacing.m, paddingValue),
    paddingHorizontal: paddingValue,
  };

  if (scrollable) {
    return (
      <ScrollView
        style={[styles.container, style]}
        contentContainerStyle={containerStyle}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View style={[styles.container, containerStyle, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});


