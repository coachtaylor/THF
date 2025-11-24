// Workout Template Types for Trans-Specific Fitness App
// Supports feminization (lower body emphasis) and masculinization (upper body emphasis) goals

import { Profile } from '../../../types';

/**
 * Pattern types for exercise classification
 */
export type ExercisePattern = 
  | 'squat' 
  | 'hinge' 
  | 'push' 
  | 'pull' 
  | 'lunge' 
  | 'core' 
  | 'cardio' 
  | 'isolation';

/**
 * Day focus types for workout emphasis
 */
export type DayFocus = 'lower_body' | 'upper_body' | 'full_body';

/**
 * Experience level for workout templates
 */
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

/**
 * Primary goal types (matches Profile.primary_goal)
 */
export type PrimaryGoal = 
  | 'feminization' 
  | 'masculinization' 
  | 'general_fitness' 
  | 'strength' 
  | 'endurance';

/**
 * Pattern requirement priority
 */
export type PatternPriority = 'required' | 'preferred' | 'optional';

/**
 * Gender emphasis levels for exercise selection
 */
export type GenderEmphasis = 
  | 'fem_very_high' 
  | 'fem_high' 
  | 'fem_medium' 
  | 'fem_low' 
  | 'masc_very_high' 
  | 'masc_high' 
  | 'masc_medium' 
  | 'masc_low' 
  | 'neutral';

/**
 * Pattern requirement specifies what exercises should be included in a day
 */
export interface PatternRequirement {
  /** Exercise movement pattern */
  pattern: ExercisePattern;
  
  /** Number of exercises of this pattern to include */
  count: number;
  
  /** Priority level for this requirement */
  priority: PatternPriority;
  
  /** Gender-specific emphasis for exercise selection */
  gender_emphasis?: GenderEmphasis;
  
  /** Target muscles for this pattern (e.g., ['glutes', 'quads']) */
  target_muscles?: string[];
}

/**
 * Day template defines the structure for a single workout day
 */
export interface DayTemplate {
  /** Day name (e.g., "Lower Body Emphasis") */
  name: string;
  
  /** Primary focus area for this day */
  focus: DayFocus;
  
  /** Exercise pattern requirements for this day */
  patterns: PatternRequirement[];
  
  /** Total number of exercises to include (5-8) */
  total_exercises: number;
  
  /** Percentage of weekly volume this day represents */
  volume_percent: number;
  
  /** Warm-up duration in minutes */
  warm_up_duration_minutes: number;
  
  /** Cool-down duration in minutes */
  cool_down_duration_minutes: number;
}

/**
 * Workout template defines a complete workout program structure
 */
export interface WorkoutTemplate {
  /** Template name */
  name: string;
  
  /** Template description */
  description: string;
  
  /** Frequency in days per week */
  frequency: number;
  
  /** Required experience level */
  experience_level: ExperienceLevel;
  
  /** Primary goal this template supports */
  primary_goal: PrimaryGoal;
  
  /** Array of day templates that make up the program */
  days: DayTemplate[];
}

/**
 * Selected template with HRT adjustments applied
 * Extends WorkoutTemplate with user-specific modifications
 */
export interface SelectedTemplate extends WorkoutTemplate {
  /** Whether template has been adjusted for HRT */
  adjusted_for_hrt: boolean;
  
  /** Volume multiplier based on HRT status
   * - 0.85 for MTF on estrogen (slightly reduced volume)
   * - 1.0 for FTM on testosterone (standard volume)
   */
  volume_multiplier: number;
}

