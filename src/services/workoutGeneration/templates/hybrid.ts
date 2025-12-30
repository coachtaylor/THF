// Hybrid Template Generation
// Creates blended templates for users who want non-standard emphasis
// e.g., MTF user who wants feminization + shoulder focus

import { WorkoutTemplate, DayTemplate, PatternRequirement, PrimaryGoal, ExperienceLevel } from './types';
import { feminizationTemplates } from './feminization';
import { masculinizationTemplates } from './masculinization';
import { Profile } from '../../../types';

/**
 * Request structure for hybrid template generation
 */
export interface HybridTemplateRequest {
  /** Base gender-affirming goal (feminization or masculinization) */
  base_goal: 'feminization' | 'masculinization';

  /** Body areas to add secondary focus for */
  secondary_focus_areas: string[];

  /** Desired workout frequency */
  frequency: number;

  /** User's experience level */
  experience_level: ExperienceLevel;
}

/**
 * Hybrid template configuration embedded in the template
 */
export interface HybridConfig {
  /** Primary emphasis (feminization or masculinization) */
  primary_emphasis: 'feminization' | 'masculinization';

  /** Weight of primary emphasis (0.65-0.70) */
  primary_weight: number;

  /** Body areas receiving secondary focus */
  secondary_emphasis_areas: string[];

  /** Weight of secondary emphasis (0.30-0.35) */
  secondary_weight: number;
}

// Map body areas to muscle groups for pattern generation
const BODY_AREA_TO_MUSCLES: Record<string, string[]> = {
  shoulders: ['shoulders', 'delts', 'deltoids'],
  back: ['lats', 'upper_back', 'traps', 'rhomboids'],
  chest: ['chest', 'pecs'],
  arms: ['biceps', 'triceps', 'forearms'],
  glutes: ['glutes', 'hips'],
  legs: ['quads', 'hamstrings', 'calves'],
  core: ['abs', 'obliques', 'core'],
};

// Map body areas to appropriate exercise patterns
const BODY_AREA_TO_PATTERN: Record<string, 'push' | 'pull' | 'isolation' | 'squat' | 'hinge' | 'lunge' | 'core'> = {
  shoulders: 'push',
  back: 'pull',
  chest: 'push',
  arms: 'isolation',
  glutes: 'hinge',
  legs: 'squat',
  core: 'core',
};

/**
 * Determine if a hybrid template is needed based on user profile
 * Returns true if user has body focus preferences that conflict with their primary goal
 */
export function detectHybridNeed(profile: Profile): boolean {
  if (!profile.body_focus_prefer || profile.body_focus_prefer.length === 0) {
    return false;
  }

  const counterGoalAreas = profile.body_focus_prefer.filter(area =>
    isCounterToGoal(area, profile.primary_goal)
  );

  return counterGoalAreas.length > 0;
}

/**
 * Check if a body area is counter to the user's primary goal
 * e.g., "shoulders" is counter to "feminization"
 */
function isCounterToGoal(area: string, goal: string): boolean {
  const femAreas = ['glutes', 'legs', 'hips'];
  const mascAreas = ['shoulders', 'chest', 'back', 'arms'];
  const areaLower = area.toLowerCase();

  if (goal === 'feminization' || goal === 'mtf') {
    // For feminization, upper body areas are counter
    return mascAreas.includes(areaLower);
  }
  if (goal === 'masculinization' || goal === 'ftm') {
    // For masculinization, lower body areas are counter
    return femAreas.includes(areaLower);
  }
  return false;
}

/**
 * Create a hybrid template by modifying a base template
 * Adds 2-3 secondary exercises to appropriate days (30-35% secondary emphasis)
 */
export function createHybridTemplate(request: HybridTemplateRequest): WorkoutTemplate & { hybrid_config: HybridConfig } {
  // Find base template
  const templates = request.base_goal === 'feminization'
    ? feminizationTemplates
    : masculinizationTemplates;

  // Find matching template by frequency and experience
  let baseTemplate = templates.find(
    t => t.frequency === request.frequency && t.experience_level === request.experience_level
  );

  // Fallback: try to find any template with matching frequency
  if (!baseTemplate) {
    baseTemplate = templates.find(t => t.frequency === request.frequency);
  }

  // Last resort: use first template
  if (!baseTemplate) {
    baseTemplate = templates[0];
  }

  // Deep clone the template
  const hybridTemplate: WorkoutTemplate = JSON.parse(JSON.stringify(baseTemplate));
  hybridTemplate.name = `${baseTemplate.name} (Hybrid)`;
  hybridTemplate.description = `${baseTemplate.description} With added focus on: ${request.secondary_focus_areas.join(', ')}.`;

  // Create hybrid config
  const hybridConfig: HybridConfig = {
    primary_emphasis: request.base_goal,
    primary_weight: 0.65, // 65% primary emphasis
    secondary_emphasis_areas: request.secondary_focus_areas,
    secondary_weight: 0.35, // 35% secondary emphasis
  };

  // Inject secondary focus exercises into appropriate days
  hybridTemplate.days = hybridTemplate.days.map(day => {
    return injectSecondaryFocus(day, request.secondary_focus_areas, request.base_goal);
  });

  return {
    ...hybridTemplate,
    hybrid_config: hybridConfig,
  };
}

/**
 * Inject secondary focus exercises into a day template
 */
function injectSecondaryFocus(
  day: DayTemplate,
  secondaryAreas: string[],
  baseGoal: 'feminization' | 'masculinization'
): DayTemplate {
  // Determine which day types should get secondary focus
  // For feminization + upper body focus: add to upper body days
  // For masculinization + lower body focus: add to lower body days
  const modifiedDay = { ...day, patterns: [...day.patterns] };

  const shouldModify =
    (baseGoal === 'feminization' && (day.focus === 'upper_body' || day.focus === 'full_body')) ||
    (baseGoal === 'masculinization' && (day.focus === 'lower_body' || day.focus === 'full_body'));

  if (!shouldModify) {
    return modifiedDay;
  }

  // Add 2-3 secondary focus exercises based on the secondary areas
  const exercisesToAdd = Math.min(secondaryAreas.length, 3);
  let addedCount = 0;

  for (const area of secondaryAreas) {
    if (addedCount >= exercisesToAdd) break;

    const pattern = BODY_AREA_TO_PATTERN[area.toLowerCase()];
    const muscles = BODY_AREA_TO_MUSCLES[area.toLowerCase()];

    if (pattern && muscles) {
      // Check if we already have this pattern
      const existingPatternCount = modifiedDay.patterns.filter(p => p.pattern === pattern).length;

      // Add the secondary focus pattern
      const newPattern: PatternRequirement = {
        pattern: pattern === 'isolation' ? 'isolation' : pattern,
        count: 1,
        priority: 'preferred',
        // Use neutral emphasis to avoid gender mismatch penalties
        gender_emphasis: 'neutral',
        target_muscles: muscles,
      };

      modifiedDay.patterns.push(newPattern);
      addedCount++;
    }
  }

  // Update total exercises count
  modifiedDay.total_exercises = modifiedDay.total_exercises + addedCount;

  // Adjust name to reflect hybrid nature
  modifiedDay.name = `${modifiedDay.name} + ${secondaryAreas.slice(0, 2).join('/')}`;

  return modifiedDay;
}

/**
 * Build a hybrid template request from user profile
 * Only creates hybrid templates when user explicitly selects feminization or masculinization
 */
export function buildHybridRequest(profile: Profile): HybridTemplateRequest | null {
  if (!detectHybridNeed(profile)) {
    return null;
  }

  // Determine base goal - only use explicit goal selection, not gender identity
  // Hybrid templates are only for users who explicitly choose feminization/masculinization
  let baseGoal: 'feminization' | 'masculinization';
  if (profile.primary_goal === 'feminization') {
    baseGoal = 'feminization';
  } else if (profile.primary_goal === 'masculinization') {
    baseGoal = 'masculinization';
  } else {
    // For non-gender goals (strength, endurance, general_fitness), don't create hybrid
    return null;
  }

  // Get counter-goal areas from body focus preferences
  const secondaryFocusAreas = (profile.body_focus_prefer || []).filter(area =>
    isCounterToGoal(area, baseGoal)
  );

  if (secondaryFocusAreas.length === 0) {
    return null;
  }

  return {
    base_goal: baseGoal,
    secondary_focus_areas: secondaryFocusAreas,
    frequency: profile.workout_frequency,
    experience_level: profile.fitness_experience,
  };
}
