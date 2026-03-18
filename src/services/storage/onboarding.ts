import { getProfile } from './profile';
import { Profile } from '../../types';

/**
 * Check if user has completed onboarding
 * User has completed onboarding if they have a profile with required fields
 */
export async function checkOnboardingStatus(): Promise<boolean> {
  try {
    const profile = await getProfile();

    // SECURITY: Only log status, not sensitive profile field values
    if (__DEV__) {
      console.log('🔍 Checking onboarding status...');
      console.log('  - Profile exists:', profile !== null);
      if (profile) {
        console.log('  - Has required fields:',
          profile.gender_identity !== undefined &&
          profile.primary_goal !== undefined &&
          profile.fitness_experience !== undefined
        );
      }
    }

    // User has completed onboarding if they have a profile with required fields
    const isComplete = (
      profile !== null &&
      profile.gender_identity !== undefined &&
      profile.primary_goal !== undefined &&
      profile.fitness_experience !== undefined
    );

    if (__DEV__) console.log('🔍 Onboarding complete:', isComplete);
    return isComplete;
  } catch (error) {
    if (__DEV__) console.error('❌ Error checking onboarding status:', error);
    return false;
  }
}

