// Template Selection Logic
// Selects and customizes workout templates based on user profile

import { Profile } from '../types';
import { SelectedTemplate, WorkoutTemplate } from './templates/types';
import { feminizationTemplates } from './templates/feminization';
import { masculinizationTemplates } from './templates/masculinization';

// Combine all available templates
const allTemplates: WorkoutTemplate[] = [
  ...feminizationTemplates,
  ...masculinizationTemplates,
];

/**
 * Select and customize a workout template based on user profile
 * Returns a SelectedTemplate with HRT adjustments applied
 */
export function selectTemplate(profile: Profile): SelectedTemplate {
  // Filter templates by primary goal
  let candidates = allTemplates.filter(
    template => template.primary_goal === profile.primary_goal
  );

  // If no exact match for primary goal, fallback to general_fitness templates
  // (Note: we don't have general_fitness templates yet, so this is future-proofing)
  if (candidates.length === 0 && profile.primary_goal === 'general_fitness') {
    // Fallback: use feminization for mtf, masculinization for ftm, or first available
    if (profile.gender_identity === 'mtf') {
      candidates = allTemplates.filter(t => t.primary_goal === 'feminization');
    } else if (profile.gender_identity === 'ftm') {
      candidates = allTemplates.filter(t => t.primary_goal === 'masculinization');
    }
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

  // If still no template found, use first available template as fallback
  if (!selectedTemplate) {
    console.warn(
      `⚠️ No matching template found for profile. ` +
      `Goal: ${profile.primary_goal}, Experience: ${profile.fitness_experience}, ` +
      `Frequency: ${profile.workout_frequency}. Using first available template.`
    );
    selectedTemplate = allTemplates[0];
  }

  if (!selectedTemplate) {
    throw new Error('No workout templates available');
  }

  // Create SelectedTemplate with HRT adjustments
  const adjusted_for_hrt = profile.on_hrt === true;
  
  // Determine volume multiplier based on HRT status and gender identity
  // MTF on estrogen: slightly reduced volume (0.85)
  // FTM on testosterone: standard volume (1.0)
  let volume_multiplier = 1.0;
  if (adjusted_for_hrt) {
    if (profile.gender_identity === 'mtf') {
      volume_multiplier = 0.85; // MTF on estrogen - slightly reduced volume
    } else if (profile.gender_identity === 'ftm') {
      volume_multiplier = 1.0; // FTM on testosterone - standard volume
    } else {
      // Nonbinary/questioning on HRT: slight reduction for safety
      volume_multiplier = 0.9;
    }
  }

  const selected: SelectedTemplate = {
    ...selectedTemplate,
    adjusted_for_hrt,
    volume_multiplier,
  };

  return selected;
}

