import { useMemo } from 'react';

interface ProfileLike {
  low_sensory_mode?: boolean;
}

export function useProfile() {
  return useMemo(
    () => ({
      profile: null as ProfileLike | null,
      loading: false,
      error: null as Error | null,
      // Placeholder methods to be implemented with storage integration in US-2.2
      updateProfile: async (_updates: Partial<ProfileLike>) => {},
      refreshProfile: async () => {},
    }),
    []
  );
}

