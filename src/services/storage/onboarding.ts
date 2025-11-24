import { getProfile } from './profile';
import { Profile } from '../../types';

/**
 * Check if user has completed onboarding
 * User has completed onboarding if they have a profile with required fields
 */
export async function checkOnboardingStatus(): Promise<boolean> {
  try {
    const profile = await getProfile();

    // User has completed onboarding if they have a profile with required fields
    return (
      profile !== null &&
      profile.gender_identity !== undefined &&
      profile.primary_goal !== undefined &&
      profile.fitness_experience !== undefined
    );
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
}

