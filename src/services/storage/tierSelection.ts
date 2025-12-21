import AsyncStorage from '@react-native-async-storage/async-storage';

const TIER_SELECTION_KEY = '@transfitness:tier_selection_completed';

/**
 * Check if user has completed tier selection
 */
export async function checkTierSelection(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(TIER_SELECTION_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error checking tier selection:', error);
    return false;
  }
}

/**
 * Mark tier selection as completed
 */
export async function setTierSelectionCompleted(): Promise<void> {
  try {
    await AsyncStorage.setItem(TIER_SELECTION_KEY, 'true');
  } catch (error) {
    console.error('Error setting tier selection:', error);
  }
}

/**
 * Clear tier selection (for testing/logout)
 */
export async function clearTierSelection(): Promise<void> {
  try {
    await AsyncStorage.removeItem(TIER_SELECTION_KEY);
  } catch (error) {
    console.error('Error clearing tier selection:', error);
  }
}
