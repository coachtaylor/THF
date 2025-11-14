import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet } from 'react-native';

const Stack = createStackNavigator();

function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>TransFitness</Text>
      <Text style={styles.subtitle}>Week 1 Setup Complete! 🎉</Text>
      <Text style={styles.body}>
        Your development environment is ready.{'\n'}
        Next: Open WEEK_2_README.md to start building features!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 24,
    marginBottom: 16,
  },
  body: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
});

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ title: 'TransFitness' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
