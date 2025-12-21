import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme/theme';

export default function OrDivider() {
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <Text style={styles.text}>or</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.l,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.default,
  },
  text: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: colors.text.tertiary,
    paddingHorizontal: spacing.m,
  },
});
