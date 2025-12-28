/**
 * Utility functions for exercise name formatting
 *
 * Handles:
 * 1. Gender marker removal: "(male)" and "(female)" suffixes
 * 2. Title case capitalization: "band shrug" -> "Band Shrug"
 */

/**
 * Words that should remain lowercase in title case
 * (prepositions, articles, conjunctions when not first word)
 */
const LOWERCASE_WORDS = new Set([
  'a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor',
  'on', 'at', 'to', 'from', 'by', 'with', 'in', 'of'
]);

/**
 * Remove gender markers from exercise names
 * Handles: "(male)", "(female)", " (male)", " (female)"
 *
 * @example
 * stripGenderMarkers("forward lunge (male)") // "forward lunge"
 * stripGenderMarkers("resistance band hip thrusts on knees (female)") // "resistance band hip thrusts on knees"
 */
export function stripGenderMarkers(name: string): string {
  if (!name) return '';

  // Remove (male) or (female) with optional leading space
  return name
    .replace(/\s*\(male\)\s*/gi, '')
    .replace(/\s*\(female\)\s*/gi, '')
    .trim();
}

/**
 * Capitalize a word, handling hyphenated words
 * @example
 * capitalizeWord("push-up") // "Push-Up"
 * capitalizeWord("barbell") // "Barbell"
 */
function capitalizeWord(word: string): string {
  if (!word) return '';

  // Handle hyphenated words (e.g., "push-up" -> "Push-Up")
  if (word.includes('-')) {
    return word
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('-');
  }

  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * Convert exercise name to title case
 * Capitalizes first letter of each word, with exceptions for
 * prepositions/articles/conjunctions (unless first word)
 *
 * @example
 * toTitleCase("band shrug") // "Band Shrug"
 * toTitleCase("push-up to downward dog") // "Push-Up to Downward Dog"
 */
export function toTitleCase(name: string): string {
  if (!name) return '';

  return name
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      // Always capitalize first word
      if (index === 0) {
        return capitalizeWord(word);
      }

      // Keep prepositions/articles lowercase (except in parentheses context)
      if (LOWERCASE_WORDS.has(word)) {
        return word;
      }

      return capitalizeWord(word);
    })
    .join(' ');
}

/**
 * Format exercise name for display
 * Applies both gender marker removal and title case
 *
 * @example
 * formatExerciseName("forward lunge (male)") // "Forward Lunge"
 * formatExerciseName("resistance band hip thrusts on knees (female)") // "Resistance Band Hip Thrusts on Knees"
 * formatExerciseName("band shrug") // "Band Shrug"
 */
export function formatExerciseName(name: string): string {
  if (!name) return '';

  const withoutGender = stripGenderMarkers(name);
  return toTitleCase(withoutGender);
}
