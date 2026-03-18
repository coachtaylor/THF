/**
 * NetworkContext - Global network connectivity state management
 *
 * Provides network status to components throughout the app.
 * Uses @react-native-community/netinfo to detect online/offline state.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface NetworkContextValue {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: string | null;
}

const NetworkContext = createContext<NetworkContextValue | undefined>(undefined);

interface NetworkProviderProps {
  children: ReactNode;
}

export function NetworkProvider({ children }: NetworkProviderProps) {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);
  const [connectionType, setConnectionType] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsConnected(state.isConnected ?? false);
      setIsInternetReachable(state.isInternetReachable);
      setConnectionType(state.type);

      if (__DEV__) {
        console.log('Network state changed:', {
          isConnected: state.isConnected,
          isInternetReachable: state.isInternetReachable,
          type: state.type,
        });
      }
    });

    // Fetch initial state
    NetInfo.fetch().then((state: NetInfoState) => {
      setIsConnected(state.isConnected ?? false);
      setIsInternetReachable(state.isInternetReachable);
      setConnectionType(state.type);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <NetworkContext.Provider
      value={{
        isConnected,
        isInternetReachable,
        connectionType,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetworkStatus() {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetworkStatus must be used within a NetworkProvider');
  }
  return context;
}

/**
 * Hook to check if the app is offline
 * Returns true if definitely offline, false otherwise
 */
export function useIsOffline(): boolean {
  const { isConnected, isInternetReachable } = useNetworkStatus();

  // If not connected, definitely offline
  if (!isConnected) return true;

  // If internet reachability is known and false, offline
  if (isInternetReachable === false) return true;

  // Otherwise assume online (including when reachability is unknown/null)
  return false;
}
