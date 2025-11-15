import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Disclaimer() {
  return (
    <View style={styles.container}>
      <Text style={styles.headline}>Disclaimer</Text>
      <Text style={styles.description}>Full content coming in US-2.2.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  headline: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
  },
});

