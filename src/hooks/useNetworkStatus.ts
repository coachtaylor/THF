import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export interface NetworkStatus {
  isConnected: boolean | null;
  isLoading: boolean;
  lastChecked: Date | null;
}

/**
 * Hook to monitor network connectivity status
 * Uses a simple ping approach to check connectivity
 *
 * Usage:
 * const { isConnected, isLoading, checkConnection } = useNetworkStatus();
 *
 * if (!isConnected) {
 *   showToast('No internet connection');
 * }
 */
export function useNetworkStatus(checkInterval = 30000): NetworkStatus & { checkConnection: () => Promise<boolean> } {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: null,
    isLoading: true,
    lastChecked: null,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      // Use a small, fast endpoint to check connectivity
      // Google's generate_204 is commonly used for this purpose
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('https://www.google.com/generate_204', {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const isConnected = response.status === 204 || response.ok;
      setStatus({
        isConnected,
        isLoading: false,
        lastChecked: new Date(),
      });
      return isConnected;
    } catch {
      setStatus({
        isConnected: false,
        isLoading: false,
        lastChecked: new Date(),
      });
      return false;
    }
  }, []);

  // Initial check and periodic checks
  useEffect(() => {
    checkConnection();

    // Check periodically
    intervalRef.current = setInterval(checkConnection, checkInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkConnection, checkInterval]);

  // Check when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkConnection();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [checkConnection]);

  return { ...status, checkConnection };
}

/**
 * Simple hook that just returns current connection status
 * For use in components that just need to know if online
 */
export function useIsOnline(): boolean | null {
  const { isConnected } = useNetworkStatus(60000); // Check less frequently
  return isConnected;
}

/**
 * Hook to wrap async actions with network check
 *
 * Usage:
 * const { executeWithNetworkCheck } = useNetworkAction();
 *
 * const handleSave = () => executeWithNetworkCheck(
 *   async () => await saveData(),
 *   () => showToast('No internet connection')
 * );
 */
export function useNetworkAction() {
  const { isConnected, checkConnection } = useNetworkStatus();

  const executeWithNetworkCheck = useCallback(
    async <T>(
      onlineAction: () => Promise<T>,
      offlineAction?: () => void
    ): Promise<T | undefined> => {
      // Double-check connection before action
      const connected = await checkConnection();

      if (!connected) {
        offlineAction?.();
        return undefined;
      }

      return onlineAction();
    },
    [checkConnection]
  );

  return { isConnected, executeWithNetworkCheck };
}

export default useNetworkStatus;
