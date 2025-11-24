import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette, typography } from '../../theme';

export default function ProgressScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Progress</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.deepBlack,
    padding: 16,
  },
  title: {
    ...typography.h1,
    color: palette.white,
  },
});

