import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette, spacing, typography } from '../../../theme';

export default function Goals() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Goals</Text>
      <Text style={styles.body}>This is a placeholder. The full intake flow will be added in US-2.4.</Text>
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

