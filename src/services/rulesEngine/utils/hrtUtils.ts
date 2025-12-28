import { Profile } from '../../storage/profile';

/**
 * Check if a given date is an HRT injection/medication day for the user.
 * Exported for use in UI components (e.g., showing injection day notifications).
 *
 * @param profile - User profile with hrt_frequency and hrt_days
 * @param date - Optional date to check (defaults to today)
 * @returns true if the given date is an injection/medication day
 */
export function isInjectionDay(
  profile: Pick<Profile, 'hrt_frequency' | 'hrt_days'>,
  date: Date = new Date()
): boolean {
  // Only applies to non-daily HRT methods (injections, patches that aren't daily)
  if (!profile.hrt_frequency || profile.hrt_frequency === 'daily') {
    return false;
  }

  // Check if user has specified HRT days
  if (profile.hrt_days && profile.hrt_days.length > 0) {
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const todayName = dayNames[date.getDay()];

    // Check if today matches one of their HRT days
    return profile.hrt_days.some((day: string) =>
      day.toLowerCase().startsWith(todayName)
    );
  }

  return false;
}
