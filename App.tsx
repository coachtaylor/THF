import React, { useEffect, useState } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { initDatabase } from './src/utils/database';

export default function App() {
  const [dbInitialized, setDbInitialized] = useState(false);

  useEffect(() => {
    async function setup() {
      try {
        await initDatabase();
        console.log('✅ App setup complete');
        setDbInitialized(true);
      } catch (error) {
        console.error('❌ App setup failed:', error);
      }
    }
    setup();
  }, []);

  if (!dbInitialized) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <AppNavigator />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
