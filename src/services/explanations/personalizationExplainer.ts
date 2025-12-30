// TransFitness - Personalization Explainer Service
// Generates user-facing explanations for how workouts are personalized

import { Profile } from '../../types';
import { SafetyContext } from '../rulesEngine/rules/types';
import {
  PersonalizationExplanation,
  WorkoutPersonalizationSummary,
  PersonalizationCategory,
  ImpactLevel,
} from '../../types/explanations';

/**
 * Generate a complete personalization explanation for the workout
 * Used by WorkoutOverviewScreen to show "Personalized for you" section
 */
export function generatePersonalizationSummary(
  profile: Profile,
  safetyContext?: SafetyContext
): WorkoutPersonalizationSummary {
  const primary: PersonalizationExplanation[] = [];
  const secondary: PersonalizationExplanation[] = [];
  const safety: PersonalizationExplanation[] = [];

  // ========== PRIMARY INFLUENCES ==========

  // 1. Primary Goal
  primary.push(getGoalExplanation(profile));

  // 2. Gender Identity + Goal Alignment
  const genderAlignment = getGenderAlignmentExplanation(profile);
  if (genderAlignment) {
    primary.push(genderAlignment);
  }

  // ========== SECONDARY INFLUENCES ==========

  // 3. Body Focus Preferences
  if (profile.body_focus_prefer?.length) {
    secondary.push({
      category: 'body_focus',
      title: `Focus: ${formatBodyFocusList(profile.body_focus_prefer)}`,
      description: `Exercises targeting ${profile.body_focus_prefer[0]} are prioritized in your selection.`,
      impact_level: 'medium',
      icon: 'target',
    });
  }

  // 4. Body Areas to Avoid
  if (profile.body_focus_soft_avoid?.length) {
    secondary.push({
      category: 'body_focus',
      title: `Gentle with: ${formatBodyFocusList(profile.body_focus_soft_avoid)}`,
      description: `Exercises heavily targeting these areas are deprioritized.`,
      impact_level: 'medium',
      icon: 'shield',
    });
  }

  // 5. HRT Status
  const hrtExplanation = getHrtExplanation(profile);
  if (hrtExplanation) {
    secondary.push(hrtExplanation);
  }

  // 6. Experience Level
  secondary.push({
    category: 'experience',
    title: `${capitalize(profile.fitness_experience)} Level`,
    description: getExperienceDescription(profile.fitness_experience),
    impact_level: 'low',
    icon: 'trending-up',
  });

  // 7. Dysphoria Filters
  if (profile.dysphoria_triggers?.length) {
    secondary.push({
      category: 'dysphoria',
      title: 'Comfort Preferences',
      description: 'Exercises are filtered based on your comfort settings.',
      impact_level: 'medium',
      icon: 'heart',
    });
  }

  // ========== SAFETY ADJUSTMENTS ==========

  // 8. Post-Op Recovery
  if (profile.surgeries?.some(s => s.date && !s.fully_healed)) {
    const activeSurgeries = profile.surgeries.filter(s => s.date && !s.fully_healed);
    safety.push({
      category: 'safety',
      title: 'Recovery Mode',
      description: `Exercises adapted for your ${activeSurgeries.map(s => formatSurgeryType(s.type)).join(', ')} recovery.`,
      impact_level: 'high',
      icon: 'medical',
    });
  }

  // 9. Binding Safety
  if (profile.binds_chest) {
    safety.push({
      category: 'safety',
      title: 'Binder-Safe',
      description: 'Exercises avoid movements that could be uncomfortable while binding.',
      impact_level: 'high',
      icon: 'shield-check',
    });
  }

  // 10. From Safety Context (rules engine outputs)
  if (safetyContext?.user_messages) {
    for (const message of safetyContext.user_messages) {
      // Avoid duplicates
      if (!safety.some(s => s.description.includes(message.substring(0, 20)))) {
        safety.push({
          category: 'safety',
          title: 'Safety Adjustment',
          description: message,
          impact_level: 'high',
          icon: 'alert-circle',
        });
      }
    }
  }

  const totalFactors = primary.length + secondary.length + safety.length;

  return {
    primary_influences: primary,
    secondary_influences: secondary,
    safety_adjustments: safety,
    total_factors: totalFactors,
  };
}

/**
 * Get explanation for primary goal
 */
function getGoalExplanation(profile: Profile): PersonalizationExplanation {
  const goalDescriptions: Record<string, { title: string; description: string; examples: string[] }> = {
    feminization: {
      title: 'Feminization Focus',
      description: '60-70% of exercises target lower body (glutes, legs, hips) with lighter upper body work.',
      examples: ['Hip thrusts', 'Glute bridges', 'Lunges'],
    },
    masculinization: {
      title: 'Masculinization Focus',
      description: '55-60% of exercises target upper body (shoulders, back, chest) for V-taper development.',
      examples: ['Shoulder press', 'Pull-ups', 'Rows'],
    },
    strength: {
      title: 'Strength Focus',
      description: 'Compound movements with lower rep ranges and longer rest periods.',
      examples: ['Squats', 'Deadlifts', 'Bench press'],
    },
    endurance: {
      title: 'Endurance Focus',
      description: 'Higher rep ranges with shorter rest periods for cardiovascular conditioning.',
      examples: ['Circuit training', 'High-rep sets'],
    },
    general_fitness: {
      title: 'Balanced Fitness',
      description: 'Well-rounded routine covering all major muscle groups.',
      examples: ['Mix of compound and isolation exercises'],
    },
  };

  const goalInfo = goalDescriptions[profile.primary_goal] || goalDescriptions.general_fitness;

  return {
    category: 'goal',
    title: goalInfo.title,
    description: goalInfo.description,
    impact_level: 'high',
    examples: goalInfo.examples,
    icon: 'star',
  };
}

/**
 * Get explanation for gender identity alignment with goal
 */
function getGenderAlignmentExplanation(profile: Profile): PersonalizationExplanation | null {
  // Only show if goal was auto-remapped
  if (
    profile.primary_goal === 'strength' ||
    profile.primary_goal === 'endurance' ||
    profile.primary_goal === 'general_fitness'
  ) {
    if (profile.gender_identity === 'mtf') {
      return {
        category: 'goal',
        title: 'Feminization Enhanced',
        description: 'Your strength/fitness goal includes feminization-aligned exercise selection.',
        impact_level: 'medium',
        icon: 'sparkles',
      };
    } else if (profile.gender_identity === 'ftm') {
      return {
        category: 'goal',
        title: 'Masculinization Enhanced',
        description: 'Your strength/fitness goal includes masculinization-aligned exercise selection.',
        impact_level: 'medium',
        icon: 'sparkles',
      };
    }
  }
  return null;
}

/**
 * Get explanation for HRT status
 */
function getHrtExplanation(profile: Profile): PersonalizationExplanation | null {
  if (!profile.on_hrt) return null;

  const months = profile.hrt_months_duration || 0;
  const hrtType = profile.hrt_type;

  if (hrtType === 'estrogen') {
    if (months < 3) {
      return {
        category: 'hrt',
        title: `${months} Month${months === 1 ? '' : 's'} on E`,
        description: 'Volume slightly reduced while your body adjusts to hormone changes.',
        impact_level: 'medium',
        icon: 'clock',
      };
    } else {
      return {
        category: 'hrt',
        title: `${months} Months on E`,
        description: 'Rest periods extended to accommodate estrogen-related recovery changes.',
        impact_level: 'medium',
        icon: 'clock',
      };
    }
  } else if (hrtType === 'testosterone') {
    if (months < 3) {
      return {
        category: 'hrt',
        title: `${months} Month${months === 1 ? '' : 's'} on T`,
        description: 'Focus on form over weight - muscles strengthen faster than tendons early on.',
        impact_level: 'medium',
        icon: 'alert-triangle',
      };
    } else if (months >= 6) {
      return {
        category: 'hrt',
        title: `${months} Months on T`,
        description: 'Your strength gains are accelerating - progressive overload rate increased.',
        impact_level: 'medium',
        icon: 'trending-up',
      };
    }
  }

  return null;
}

/**
 * Get description for experience level
 */
function getExperienceDescription(level: string): string {
  switch (level) {
    case 'beginner':
      return 'Exercises prioritize learning proper form with moderate volume.';
    case 'intermediate':
      return 'Balanced volume and intensity for continued progress.';
    case 'advanced':
      return 'Higher volume and more complex movements for experienced lifters.';
    default:
      return 'Exercises matched to your fitness level.';
  }
}

/**
 * Format body focus list for display
 */
function formatBodyFocusList(areas: string[]): string {
  if (areas.length === 1) return capitalize(areas[0]);
  if (areas.length === 2) return `${capitalize(areas[0])} & ${capitalize(areas[1])}`;
  return `${capitalize(areas[0])} +${areas.length - 1} more`;
}

/**
 * Format surgery type for display
 */
function formatSurgeryType(type: string): string {
  const names: Record<string, string> = {
    top_surgery: 'top surgery',
    bottom_surgery: 'bottom surgery',
    vaginoplasty: 'vaginoplasty',
    phalloplasty: 'phalloplasty',
    metoidioplasty: 'metoidioplasty',
    ffs: 'FFS',
    orchiectomy: 'orchiectomy',
    hysterectomy: 'hysterectomy',
    breast_augmentation: 'breast augmentation',
  };
  return names[type] || type.replace(/_/g, ' ');
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============================================================
// SHORT SUMMARIES FOR VISIBLE SAFETY DISPLAY
// ============================================================

export interface ShortSummary {
  category: 'binding' | 'post_op' | 'hrt' | 'dysphoria' | 'goal';
  text: string; // ≤10 words
  priority: number; // 1 = highest (show first)
}

/**
 * Generate short, skimmable summaries for visible display in hero card
 * Returns max 4 summaries, prioritized by importance
 *
 * Used by WorkoutOverviewScreen to show "Tailored for you" section
 */
export function getShortSummaries(profile: Profile): ShortSummary[] {
  const summaries: ShortSummary[] = [];

  // ========== BINDING (Priority 1-2) ==========
  if (profile.binds_chest) {
    const binderType = profile.binder_type;
    const frequency = profile.binding_frequency;

    if (binderType === 'ace_bandage' || binderType === 'diy') {
      // Ace bandage/DIY gets strictest messaging
      summaries.push({
        category: 'binding',
        text: '30-min limit, intensity reduced',
        priority: 1,
      });
    } else if (frequency === 'daily' || frequency === 'sometimes') {
      summaries.push({
        category: 'binding',
        text: 'Overhead volume reduced',
        priority: 2,
      });
    }
  }

  // ========== POST-OP (Priority 1-2) ==========
  if (profile.surgeries?.length) {
    const activeSurgeries = profile.surgeries.filter(s => s.date && !s.fully_healed);

    for (const surgery of activeSurgeries) {
      const weeksPostOp = getWeeksPostOp(surgery.date);
      const summaryText = getPostOpShortSummary(surgery.type, weeksPostOp);

      if (summaryText) {
        summaries.push({
          category: 'post_op',
          text: summaryText,
          priority: 1, // Post-op is always high priority
        });
      }
    }
  }

  // ========== HRT (Priority 2-3) ==========
  if (profile.on_hrt && profile.hrt_type) {
    const months = profile.hrt_months_duration || 0;
    const hrtSummary = getHrtShortSummary(profile.hrt_type, months);

    if (hrtSummary) {
      summaries.push({
        category: 'hrt',
        text: hrtSummary,
        priority: months < 3 ? 2 : 3, // Early HRT is higher priority
      });
    }
  }

  // ========== DYSPHORIA (Priority 3-4) ==========
  if (profile.dysphoria_triggers?.length) {
    const dysphoriaText = getDysphoriaShortSummary(profile.dysphoria_triggers);

    if (dysphoriaText) {
      summaries.push({
        category: 'dysphoria',
        text: dysphoriaText,
        priority: 4,
      });
    }
  }

  // Sort by priority and limit to 4
  return summaries
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 4);
}

/**
 * Calculate weeks since surgery date
 */
function getWeeksPostOp(dateString: string | undefined): number {
  if (!dateString) return 0;

  try {
    const surgeryDate = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - surgeryDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
  } catch {
    return 0;
  }
}

/**
 * Get short summary for post-op status
 */
function getPostOpShortSummary(surgeryType: string, weeksPostOp: number): string | null {
  // Format weeks display
  const weeksText = weeksPostOp < 2 ? 'Early recovery' : `${weeksPostOp} wks`;

  switch (surgeryType) {
    case 'top_surgery':
      if (weeksPostOp < 6) return `Chest loading excluded (${weeksText})`;
      if (weeksPostOp < 12) return 'Light upper body only';
      return null; // Healed enough, no summary needed

    case 'vaginoplasty':
    case 'bottom_surgery':
      if (weeksPostOp < 12) return 'Pelvic floor focus';
      return null;

    case 'phalloplasty':
      if (weeksPostOp < 12) return 'Grip/forearm exercises excluded';
      return null;

    case 'metoidioplasty':
      if (weeksPostOp < 8) return 'Lower body limited';
      return null;

    case 'ffs':
      if (weeksPostOp < 6) return 'Head inversion avoided';
      return null;

    case 'breast_augmentation':
      if (weeksPostOp < 8) return 'Chest pressing excluded';
      return null;

    case 'orchiectomy':
      if (weeksPostOp < 4) return 'Core exercises limited';
      return null;

    case 'hysterectomy':
      if (weeksPostOp < 6) return 'Core/lower limited';
      return null;

    default:
      if (weeksPostOp < 6) return `Recovery mode (${weeksText})`;
      return null;
  }
}

/**
 * Get short summary for HRT status
 */
function getHrtShortSummary(hrtType: string, months: number): string | null {
  if (hrtType === 'testosterone') {
    if (months < 3) return 'Conservative load progression';
    if (months < 6) return 'Progressive overload ramping';
    return null; // Established, no special note needed
  }

  if (hrtType === 'estrogen' || hrtType === 'estrogen_blockers') {
    if (months < 6) return 'Extended recovery periods';
    return null;
  }

  return null;
}

/**
 * Get short summary for dysphoria filters
 */
function getDysphoriaShortSummary(triggers: string[]): string | null {
  // Show most impactful trigger as summary
  if (triggers.includes('swimming') || triggers.includes('aquatic')) {
    return 'Aquatic exercises excluded';
  }
  if (triggers.includes('mirrors')) {
    return 'Mirror exercises filtered';
  }
  if (triggers.includes('crowded_spaces') || triggers.includes('locker_rooms')) {
    return 'Home-friendly exercises prioritized';
  }
  if (triggers.includes('form_focused') || triggers.includes('body_contact')) {
    return 'Simple movements preferred';
  }
  if (triggers.includes('looking_at_chest') || triggers.includes('chest')) {
    return 'Chest-focus deprioritized';
  }

  // Generic fallback if triggers exist but no specific match
  if (triggers.length > 0) {
    return 'Comfort-adjusted exercises';
  }

  return null;
}
