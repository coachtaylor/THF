// Template Selection Logic
// Selects and customizes workout templates based on user profile
// Supports hybrid templates for users with non-standard body focus preferences

import { Profile } from '../../types';
import { SelectedTemplate, WorkoutTemplate, PrimaryGoal } from './templates/types';
import { feminizationTemplates } from './templates/feminization';
import { masculinizationTemplates } from './templates/masculinization';
import { generalFitnessTemplates } from './templates/generalFitness';
import { strengthTemplates } from './templates/strength';
import { enduranceTemplates } from './templates/endurance';
import { detectHybridNeed, buildHybridRequest, createHybridTemplate, HybridConfig } from './templates/hybrid';

// Extended SelectedTemplate that can include hybrid config
export interface HybridSelectedTemplate extends SelectedTemplate {
  hybrid_config?: HybridConfig;
  is_hybrid?: boolean;
}

// Combine all available templates
const allTemplates: WorkoutTemplate[] = [
  ...feminizationTemplates,
  ...masculinizationTemplates,
  ...generalFitnessTemplates,
  ...strengthTemplates,
  ...enduranceTemplates,
];

/**
 * Select and customize a workout template based on user profile
 * Returns a SelectedTemplate with HRT adjustments applied
 *
 * If user has body focus preferences that conflict with their primary goal,
 * a hybrid template will be generated with 65-70% primary emphasis and
 * 30-35% secondary focus on the preferred areas.
 */
export function selectTemplate(profile: Profile): HybridSelectedTemplate {
  // Check if user needs a hybrid template
  // (e.g., MTF user with feminization goal who also wants shoulder focus)
  if (detectHybridNeed(profile)) {
    const hybridRequest = buildHybridRequest(profile);
    if (hybridRequest) {
      console.log(
        `🔀 Creating hybrid template: ${hybridRequest.base_goal} + ${hybridRequest.secondary_focus_areas.join(', ')}`
      );

      const hybridTemplate = createHybridTemplate(hybridRequest);
      const adjusted_for_hrt = profile.on_hrt === true;
      const volume_multiplier = calculateHrtVolumeMultiplier(profile);

      return {
        ...hybridTemplate,
        adjusted_for_hrt,
        volume_multiplier,
        is_hybrid: true,
      };
    }
  }

  // Standard template selection (no hybrid needed)
  // Use the user's explicitly selected primary goal
  const targetGoal: PrimaryGoal = profile.primary_goal;

  // Filter templates by user's selected primary goal
  let candidates = allTemplates.filter(
    template => template.primary_goal === targetGoal
  );

  // If no match found, fallback to general_fitness templates
  if (candidates.length === 0) {
    candidates = allTemplates.filter(t => t.primary_goal === 'general_fitness');
  }

  // Filter by experience level
  candidates = candidates.filter(
    template => template.experience_level === profile.fitness_experience
  );

  // Filter by frequency (match exactly, or use closest match)
  let selectedTemplate: WorkoutTemplate | null = null;
  
  // Try exact frequency match first
  const exactMatch = candidates.find(
    template => template.frequency === profile.workout_frequency
  );
  
  if (exactMatch) {
    selectedTemplate = exactMatch;
  } else {
    // Fallback to closest frequency match
    // Prefer templates with frequency <= user's desired frequency
    const suitableTemplates = candidates.filter(
      template => template.frequency <= profile.workout_frequency
    );
    
    if (suitableTemplates.length > 0) {
      // Sort by frequency descending (closest to user's frequency)
      suitableTemplates.sort((a, b) => b.frequency - a.frequency);
      selectedTemplate = suitableTemplates[0];
    } else {
      // Last resort: use the template with closest frequency
      candidates.sort((a, b) => 
        Math.abs(a.frequency - profile.workout_frequency) - 
        Math.abs(b.frequency - profile.workout_frequency)
      );
      selectedTemplate = candidates[0] || null;
    }
  }

  // If still no template found, fallback to general fitness
  if (!selectedTemplate) {
    console.warn(
      `⚠️ No matching template found for profile. ` +
      `Goal: ${profile.primary_goal}, Experience: ${profile.fitness_experience}, ` +
      `Frequency: ${profile.workout_frequency}. Falling back to general fitness template.`
    );

    // Fallback to general fitness templates (body-neutral)
    const fallbackCandidates = allTemplates.filter(t => t.primary_goal === 'general_fitness');

    if (fallbackCandidates.length > 0) {
      // Prefer beginner templates for safety when falling back
      const beginnerFallback = fallbackCandidates.find(t => t.experience_level === 'beginner');
      selectedTemplate = beginnerFallback || fallbackCandidates[0];
    } else {
      // Last resort: use any available template
      selectedTemplate = allTemplates[0];
    }
  }

  if (!selectedTemplate) {
    throw new Error('No workout templates available');
  }

  // Create SelectedTemplate with HRT adjustments
  const adjusted_for_hrt = profile.on_hrt === true;
  const volume_multiplier = calculateHrtVolumeMultiplier(profile);

  const selected: HybridSelectedTemplate = {
    ...selectedTemplate,
    adjusted_for_hrt,
    volume_multiplier,
    is_hybrid: false,
  };

  return selected;
}

/**
 * Calculate HRT volume multiplier based on profile
 */
function calculateHrtVolumeMultiplier(profile: Profile): number {
  if (!profile.on_hrt) {
    return 1.0;
  }

  // Determine volume multiplier based on HRT status and gender identity
  // MTF on estrogen: slightly reduced volume (0.85)
  // FTM on testosterone: standard volume (1.0)
  if (profile.gender_identity === 'mtf') {
    return 0.85; // MTF on estrogen - slightly reduced volume
  } else if (profile.gender_identity === 'ftm') {
    return 1.0; // FTM on testosterone - standard volume
  } else {
    // Nonbinary/questioning on HRT: slight reduction for safety
    return 0.9;
  }
}

