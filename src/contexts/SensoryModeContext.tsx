import React, { createContext, useContext, ReactNode } from 'react';
import { useProfile } from '../hooks/useProfile';

/**
 * Sensory Mode Context
 *
 * Provides app-wide access to low sensory mode settings.
 * When enabled, this affects:
 * - Animations (disabled)
 * - Sounds (disabled)
 * - Haptics (disabled)
 * - Media/thumbnails (hidden)
 * - Visual complexity (reduced)
 */

interface SensoryModeContextType {
  /** Whether low sensory mode is enabled */
  lowSensoryMode: boolean;
  /** Should animations be disabled */
  disableAnimations: boolean;
  /** Should sounds be disabled */
  disableSounds: boolean;
  /** Should haptic feedback be disabled */
  disableHaptics: boolean;
  /** Should media/thumbnails be hidden */
  hideMedia: boolean;
}

const defaultValue: SensoryModeContextType = {
  lowSensoryMode: false,
  disableAnimations: false,
  disableSounds: false,
  disableHaptics: false,
  hideMedia: false,
};

const SensoryModeContext = createContext<SensoryModeContextType>(defaultValue);

interface SensoryModeProviderProps {
  children: ReactNode;
}

export function SensoryModeProvider({ children }: SensoryModeProviderProps) {
  const { profile } = useProfile();
  const lowSensoryMode = profile?.low_sensory_mode ?? false;

  const value: SensoryModeContextType = {
    lowSensoryMode,
    disableAnimations: lowSensoryMode,
    disableSounds: lowSensoryMode,
    disableHaptics: lowSensoryMode,
    hideMedia: lowSensoryMode,
  };

  return (
    <SensoryModeContext.Provider value={value}>
      {children}
    </SensoryModeContext.Provider>
  );
}

/**
 * Hook to access sensory mode settings throughout the app
 *
 * @example
 * const { disableAnimations, hideMedia } = useSensoryMode();
 *
 * // Conditionally render animations
 * {!disableAnimations && <ShimmerEffect />}
 *
 * // Conditionally hide media
 * {!hideMedia && <Image source={thumbnail} />}
 */
export function useSensoryMode(): SensoryModeContextType {
  const context = useContext(SensoryModeContext);
  if (context === undefined) {
    // Return defaults if used outside provider (shouldn't happen in normal use)
    return defaultValue;
  }
  return context;
}

export default SensoryModeContext;
