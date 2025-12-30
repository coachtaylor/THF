/**
 * Safety Rules Configuration Loader
 *
 * Fetches proprietary rule configurations from Supabase and caches them.
 * This keeps sensitive values (multipliers, thresholds, timelines) out of
 * the source code while maintaining the rule logic structure.
 */

import { supabase } from '../../utils/supabase';

// Configuration types
export interface HrtPhaseConfig {
  min_months: number;
  max_months: number;
  recovery_multiplier?: number;
  volume_reduction_percent?: number;
  rest_seconds_increase?: number;
  rest_seconds_reduction?: number;
  progressive_overload_rate?: number;
  tendon_warning?: boolean;
}

export interface BindingConfig {
  volume_reduction_percent: number;
  rest_seconds_increase: number;
  max_workout_minutes?: number;
  suggested_intensity?: string;
  max_sets?: number;
  duration_threshold_hours?: number;
  break_interval_minutes?: number;
}

export interface PostOpPhaseConfig {
  weeks_start: number;
  weeks_end: number;
  blocked_patterns?: string[];
  blocked_muscle_groups?: string[];
  volume_reduction_percent?: number;
  max_sets?: number;
  max_weight?: string;
  rep_range?: string;
  rest_seconds_increase?: number;
}

export interface DysphoriaFilterConfig {
  trigger: string;
  filter_type: 'soft_filter' | 'exclude';
  deprioritize_tags?: string[];
  prefer_tags?: string[];
  exclude_tags?: string[];
}

export interface SafetyRulesConfig {
  hrt_estrogen_phases: Record<string, HrtPhaseConfig>;
  hrt_testosterone_phases: Record<string, HrtPhaseConfig>;
  hrt_dual_phases: Record<string, HrtPhaseConfig>;
  hrt_body_distribution: {
    mtf_feminization: { lower_body_percent: number; upper_body_percent: number };
    ftm_masculinization: { upper_body_percent: number; lower_body_percent: number };
  };
  binding: {
    commercial: BindingConfig;
    ace_bandage: BindingConfig;
    diy: BindingConfig;
    long_duration: BindingConfig;
  };
  post_op: Record<string, PostOpPhaseConfig[]>;
  dysphoria: DysphoriaFilterConfig[];
}

// In-memory cache
let cachedConfig: SafetyRulesConfig | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour cache

/**
 * Load safety rules configuration from Supabase
 * Results are cached for 1 hour to minimize database calls
 */
export async function loadSafetyConfig(): Promise<SafetyRulesConfig | null> {
  // Return cached config if still valid
  if (cachedConfig && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cachedConfig;
  }

  try {
    const { data, error } = await supabase
      .from('safety_rules_config')
      .select('rule_category, rule_id, config')
      .eq('is_active', true);

    if (error) {
      console.error('[ConfigLoader] Failed to fetch safety config:', error);
      // Return cached config if available, even if stale
      return cachedConfig;
    }

    if (!data || data.length === 0) {
      if (__DEV__) console.warn('[ConfigLoader] No safety config found in database, using defaults');
      return null;
    }

    // Parse and organize the config
    const config = parseConfigRows(data);

    // Update cache
    cachedConfig = config;
    cacheTimestamp = Date.now();

    if (__DEV__) console.log('[ConfigLoader] Safety config loaded and cached');

    return config;
  } catch (err) {
    console.error('[ConfigLoader] Unexpected error loading config:', err);
    return cachedConfig;
  }
}

/**
 * Parse database rows into structured config object
 */
function parseConfigRows(rows: Array<{ rule_category: string; rule_id: string; config: unknown }>): SafetyRulesConfig {
  const config: SafetyRulesConfig = {
    hrt_estrogen_phases: {},
    hrt_testosterone_phases: {},
    hrt_dual_phases: {},
    hrt_body_distribution: {
      mtf_feminization: { lower_body_percent: 65, upper_body_percent: 35 },
      ftm_masculinization: { upper_body_percent: 55, lower_body_percent: 45 },
    },
    binding: {
      commercial: { volume_reduction_percent: 25, rest_seconds_increase: 30 },
      ace_bandage: { volume_reduction_percent: 40, rest_seconds_increase: 45, max_workout_minutes: 30, suggested_intensity: 'light' },
      diy: { volume_reduction_percent: 40, rest_seconds_increase: 45, max_workout_minutes: 30, suggested_intensity: 'light' },
      long_duration: { volume_reduction_percent: 25, rest_seconds_increase: 30, duration_threshold_hours: 8 },
    },
    post_op: {},
    dysphoria: [],
  };

  for (const row of rows) {
    const { rule_category, rule_id, config: rowConfig } = row;

    switch (rule_category) {
      case 'hrt_estrogen':
        config.hrt_estrogen_phases[rule_id] = rowConfig as HrtPhaseConfig;
        break;
      case 'hrt_testosterone':
        config.hrt_testosterone_phases[rule_id] = rowConfig as HrtPhaseConfig;
        break;
      case 'hrt_dual':
        config.hrt_dual_phases[rule_id] = rowConfig as HrtPhaseConfig;
        break;
      case 'hrt_distribution':
        if (rule_id === 'mtf_feminization') {
          config.hrt_body_distribution.mtf_feminization = rowConfig as { lower_body_percent: number; upper_body_percent: number };
        } else if (rule_id === 'ftm_masculinization') {
          config.hrt_body_distribution.ftm_masculinization = rowConfig as { upper_body_percent: number; lower_body_percent: number };
        }
        break;
      case 'binding':
        config.binding[rule_id as keyof typeof config.binding] = rowConfig as BindingConfig;
        break;
      case 'post_op':
        if (!config.post_op[rule_id]) {
          config.post_op[rule_id] = [];
        }
        config.post_op[rule_id].push(rowConfig as PostOpPhaseConfig);
        break;
      case 'dysphoria':
        config.dysphoria.push(rowConfig as DysphoriaFilterConfig);
        break;
    }
  }

  return config;
}

/**
 * Get a specific HRT phase config
 */
export function getHrtPhaseConfig(
  hrtType: 'estrogen' | 'testosterone' | 'both',
  phaseName: string
): HrtPhaseConfig | null {
  if (!cachedConfig) return null;

  switch (hrtType) {
    case 'estrogen':
      return cachedConfig.hrt_estrogen_phases[phaseName] || null;
    case 'testosterone':
      return cachedConfig.hrt_testosterone_phases[phaseName] || null;
    case 'both':
      return cachedConfig.hrt_dual_phases[phaseName] || null;
    default:
      return null;
  }
}

/**
 * Get binding config by binder type
 */
export function getBindingConfig(binderType: string): BindingConfig | null {
  if (!cachedConfig) return null;
  return cachedConfig.binding[binderType as keyof typeof cachedConfig.binding] || null;
}

/**
 * Get post-op phases for a surgery type
 */
export function getPostOpConfig(surgeryType: string): PostOpPhaseConfig[] {
  if (!cachedConfig) return [];
  return cachedConfig.post_op[surgeryType] || [];
}

/**
 * Clear cached config (useful for testing or forcing refresh)
 */
export function clearConfigCache(): void {
  cachedConfig = null;
  cacheTimestamp = 0;
}

/**
 * Check if config is loaded
 */
export function isConfigLoaded(): boolean {
  return cachedConfig !== null;
}
