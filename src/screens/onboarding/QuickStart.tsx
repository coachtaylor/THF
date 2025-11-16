import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette, spacing, typography } from '../../theme';

export default function QuickStart() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Start</Text>
      <Text style={styles.body}>This is a placeholder. The quick start flow will generate a plan in US-2.3.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.deepBlack,
    padding: spacing.l,
    justifyContent: 'center',
  },
  title: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.m,
  },
  body: {
    ...typography.body,
    textAlign: 'center',
  },
});

