import { getProfile } from './profile';
import { Profile } from '../../types';

/**
 * Check if user has completed onboarding
 * User has completed onboarding if they have a profile with required fields
 */
export async function checkOnboardingStatus(): Promise<boolean> {
  try {
    const profile = await getProfile();
    
    console.log('🔍 Checking onboarding status...');
    console.log('  - Profile exists:', profile !== null);
    
    if (profile) {
      console.log('  - gender_identity:', profile.gender_identity);
      console.log('  - primary_goal:', profile.primary_goal);
      console.log('  - fitness_experience:', profile.fitness_experience);
      console.log('  - Profile ID:', profile.id || profile.user_id);
    }

    // User has completed onboarding if they have a profile with required fields
    const isComplete = (
      profile !== null &&
      profile.gender_identity !== undefined &&
      profile.primary_goal !== undefined &&
      profile.fitness_experience !== undefined
    );
    
    console.log('🔍 Onboarding complete:', isComplete);
    return isComplete;
  } catch (error) {
    console.error('❌ Error checking onboarding status:', error);
    return false;
  }
}

