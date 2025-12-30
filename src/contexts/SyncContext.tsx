// SyncContext - Global sync status management
// Provides sync state to components throughout the app

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { syncToCloud, getSyncStatus, SyncResult } from '../services/storage/sync';
import { showWarningToast } from '../utils/toast';

export type SyncState = 'idle' | 'syncing' | 'synced' | 'error';

interface SyncContextValue {
  syncState: SyncState;
  lastSyncTime: Date | null;
  lastError: string | null;
  triggerSync: () => Promise<SyncResult>;
  clearError: () => void;
}

const SyncContext = createContext<SyncContextValue | undefined>(undefined);

interface SyncProviderProps {
  children: ReactNode;
}

export function SyncProvider({ children }: SyncProviderProps) {
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);

  // Initial check of sync status
  useEffect(() => {
    const status = getSyncStatus();
    if (status.isSyncing) {
      setSyncState('syncing');
    } else if (status.errors.length > 0) {
      setSyncState('error');
      setLastError(status.errors[0]);
    }
    if (status.lastSyncAttempt) {
      setLastSyncTime(status.lastSyncAttempt);
    }
  }, []);

  const triggerSync = useCallback(async (): Promise<SyncResult> => {
    setSyncState('syncing');

    try {
      const result = await syncToCloud();

      if (result.success) {
        setSyncState('synced');
        setLastSyncTime(new Date());
        setLastError(null);
        setConsecutiveFailures(0);
      } else {
        setSyncState('error');
        const errorMsg = result.errors[0] || 'Sync failed';
        setLastError(errorMsg);
        setConsecutiveFailures(prev => prev + 1);

        // Only show notification after 3 consecutive failures
        // to avoid spamming users on temporary network issues
        if (consecutiveFailures >= 2) {
          showWarningToast(
            'Sync Issue',
            'Your data will sync when connection is restored.'
          );
        }
      }

      return result;
    } catch (error) {
      setSyncState('error');
      const errorMsg = error instanceof Error ? error.message : 'Unknown sync error';
      setLastError(errorMsg);
      setConsecutiveFailures(prev => prev + 1);

      return {
        success: false,
        profileSynced: false,
        sessionsSynced: 0,
        plansSynced: 0,
        errors: [errorMsg],
      };
    }
  }, [consecutiveFailures]);

  const clearError = useCallback(() => {
    setLastError(null);
    if (syncState === 'error') {
      setSyncState('idle');
    }
  }, [syncState]);

  return (
    <SyncContext.Provider
      value={{
        syncState,
        lastSyncTime,
        lastError,
        triggerSync,
        clearError,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSyncStatus() {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSyncStatus must be used within a SyncProvider');
  }
  return context;
}
