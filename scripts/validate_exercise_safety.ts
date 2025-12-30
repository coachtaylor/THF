#!/usr/bin/env npx ts-node
/**
 * Exercise Safety Fields Validation Script
 *
 * This script validates that exercises have the required fields for trans-safe
 * workout generation. Missing fields can cause:
 * - Gender-affirming selection to fail (missing gender_goal_emphasis)
 * - Dysphoria filtering to miss exercises (missing dysphoria_tags)
 * - Binding users to see unsafe exercises (missing binder_aware)
 * - Post-op users to see blocked exercises (missing pelvic_floor_safe)
 *
 * Usage:
 *   npx ts-node scripts/validate_exercise_safety.ts
 *
 * Output:
 *   - Console summary of validation results
 *   - Detailed report of exercises missing critical fields
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    "Error: SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface ValidationStats {
  total: number;
  missing: number;
  populated: number;
  percentage: number;
}

interface ValidationResult {
  totalExercises: number;
  fields: {
    gender_goal_emphasis: ValidationStats;
    dysphoria_tags: ValidationStats;
    binder_aware: ValidationStats;
    pelvic_floor_safe: ValidationStats;
    heavy_binding_safe: ValidationStats;
    effectiveness_rating: ValidationStats;
    target_muscles: ValidationStats;
    pattern: ValidationStats;
    earliest_safe_phase: ValidationStats; // CRITICAL for post-op filtering
  };
  criticalIssues: string[];
  warnings: string[];
  exercisesMissingCriticalFields: Array<{
    id: number;
    name: string;
    slug: string;
    missingFields: string[];
  }>;
  isLaunchReady: boolean;
}

function calculateStats(
  exercises: any[],
  field: string,
  checkFn?: (value: any) => boolean,
): ValidationStats {
  const total = exercises.length;
  const populated = exercises.filter((ex) => {
    const value = ex[field];
    if (checkFn) return checkFn(value);
    // Default check: not null, not undefined, not empty string, not empty array
    if (value === null || value === undefined) return false;
    if (typeof value === "string" && value.trim() === "") return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  }).length;

  return {
    total,
    missing: total - populated,
    populated,
    percentage: Math.round((populated / total) * 100),
  };
}

async function validateExercises(): Promise<ValidationResult> {
  console.log("🔍 Fetching exercises from database...\n");

  const { data: exercises, error } = await supabase
    .from("exercises")
    .select(
      `
      id,
      name,
      slug,
      pattern,
      target_muscles,
      gender_goal_emphasis,
      dysphoria_tags,
      binder_aware,
      pelvic_floor_safe,
      heavy_binding_safe,
      effectiveness_rating,
      difficulty,
      equipment,
      earliest_safe_phase
    `,
    )
    .order("name");

  if (error) {
    console.error("❌ Error fetching exercises:", error);
    process.exit(1);
  }

  if (!exercises || exercises.length === 0) {
    console.error("❌ No exercises found in database");
    process.exit(1);
  }

  console.log(
    `📊 Found ${exercises.length} exercises. Validating safety fields...\n`,
  );

  // Valid recovery phases for earliest_safe_phase
  const validPhases = ["immediate", "early", "mid", "late", "maintenance"];

  // Calculate stats for each field
  const fields = {
    gender_goal_emphasis: calculateStats(exercises, "gender_goal_emphasis"),
    dysphoria_tags: calculateStats(exercises, "dysphoria_tags", (v) => {
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === "string") return v.trim() !== "";
      return false;
    }),
    binder_aware: calculateStats(
      exercises,
      "binder_aware",
      (v) => v === true || v === false,
    ),
    pelvic_floor_safe: calculateStats(
      exercises,
      "pelvic_floor_safe",
      (v) => v === true || v === false,
    ),
    heavy_binding_safe: calculateStats(
      exercises,
      "heavy_binding_safe",
      (v) => v === true || v === false,
    ),
    effectiveness_rating: calculateStats(
      exercises,
      "effectiveness_rating",
      (v) => typeof v === "number",
    ),
    target_muscles: calculateStats(exercises, "target_muscles"),
    pattern: calculateStats(exercises, "pattern"),
    earliest_safe_phase: calculateStats(
      exercises,
      "earliest_safe_phase",
      (v) => {
        // Must be a valid recovery phase string
        return typeof v === "string" && validPhases.includes(v);
      },
    ),
  };

  // Find exercises missing critical fields (now includes earliest_safe_phase)
  const exercisesMissingCriticalFields = exercises
    .map((ex) => {
      const missingFields: string[] = [];

      if (!ex.gender_goal_emphasis) missingFields.push("gender_goal_emphasis");
      if (ex.binder_aware !== true && ex.binder_aware !== false)
        missingFields.push("binder_aware");
      if (ex.pelvic_floor_safe !== true && ex.pelvic_floor_safe !== false)
        missingFields.push("pelvic_floor_safe");
      // CRITICAL: earliest_safe_phase is required for post-op filtering
      if (
        !ex.earliest_safe_phase ||
        !validPhases.includes(ex.earliest_safe_phase)
      ) {
        missingFields.push("earliest_safe_phase");
      }

      return {
        id: ex.id,
        name: ex.name,
        slug: ex.slug,
        missingFields,
      };
    })
    .filter((ex) => ex.missingFields.length > 0);

  // Generate issues and warnings
  const criticalIssues: string[] = [];
  const warnings: string[] = [];

  // Critical: Gender goal emphasis (needed for gender-affirming selection)
  if (fields.gender_goal_emphasis.percentage < 50) {
    criticalIssues.push(
      `CRITICAL: Only ${fields.gender_goal_emphasis.percentage}% of exercises have gender_goal_emphasis. ` +
        `Gender-affirming workout selection will NOT work correctly.`,
    );
  } else if (fields.gender_goal_emphasis.percentage < 80) {
    warnings.push(
      `WARNING: ${fields.gender_goal_emphasis.percentage}% of exercises have gender_goal_emphasis. ` +
        `Some gender-affirming exercises may be missed.`,
    );
  }

  // Critical: Binder aware (needed for binding safety rules)
  if (fields.binder_aware.percentage < 90) {
    criticalIssues.push(
      `CRITICAL: Only ${fields.binder_aware.percentage}% of exercises have binder_aware set. ` +
        `Binding safety rules may not work correctly.`,
    );
  }

  // Critical: Pelvic floor safe (needed for post-op safety)
  if (fields.pelvic_floor_safe.percentage < 90) {
    criticalIssues.push(
      `CRITICAL: Only ${fields.pelvic_floor_safe.percentage}% of exercises have pelvic_floor_safe set. ` +
        `Post-operative safety rules may not work correctly.`,
    );
  }

  // Warning: Dysphoria tags (needed for dysphoria filtering)
  if (fields.dysphoria_tags.percentage < 50) {
    warnings.push(
      `WARNING: Only ${fields.dysphoria_tags.percentage}% of exercises have dysphoria_tags. ` +
        `Dysphoria filtering will be less effective.`,
    );
  }

  // Warning: Effectiveness rating
  if (fields.effectiveness_rating.percentage < 50) {
    warnings.push(
      `WARNING: Only ${fields.effectiveness_rating.percentage}% of exercises have effectiveness_rating. ` +
        `Exercise scoring will use default values.`,
    );
  }

  // CRITICAL: Earliest safe phase (needed for post-op filtering)
  // Without this field, exercises are EXCLUDED from post-op users' pools
  if (fields.earliest_safe_phase.percentage < 80) {
    criticalIssues.push(
      `CRITICAL: Only ${fields.earliest_safe_phase.percentage}% of exercises have earliest_safe_phase. ` +
        `Post-op users will have severely limited exercise pools! ` +
        `Exercises WITHOUT this field are automatically excluded for safety.`,
    );
  } else if (fields.earliest_safe_phase.percentage < 95) {
    warnings.push(
      `WARNING: ${fields.earliest_safe_phase.percentage}% of exercises have earliest_safe_phase. ` +
        `${fields.earliest_safe_phase.missing} exercises will be unavailable to post-op users.`,
    );
  }

  // Determine if launch ready
  // Added earliest_safe_phase requirement - must be >= 80% for post-op users
  const isLaunchReady =
    fields.binder_aware.percentage >= 90 &&
    fields.pelvic_floor_safe.percentage >= 90 &&
    fields.gender_goal_emphasis.percentage >= 50 &&
    fields.earliest_safe_phase.percentage >= 80 &&
    criticalIssues.length === 0;

  return {
    totalExercises: exercises.length,
    fields,
    criticalIssues,
    warnings,
    exercisesMissingCriticalFields,
    isLaunchReady,
  };
}

function printResults(result: ValidationResult) {
  console.log(
    "═══════════════════════════════════════════════════════════════",
  );
  console.log("       TRANSFITNESS EXERCISE DATABASE SAFETY VALIDATION");
  console.log(
    "═══════════════════════════════════════════════════════════════\n",
  );

  console.log(`Total exercises: ${result.totalExercises}\n`);

  console.log("FIELD COVERAGE:");
  console.log(
    "───────────────────────────────────────────────────────────────",
  );

  const fieldLabels: Record<string, string> = {
    gender_goal_emphasis: "Gender Goal Emphasis (gender-affirming selection)",
    dysphoria_tags: "Dysphoria Tags (dysphoria filtering)",
    binder_aware: "Binder Aware (binding safety)",
    pelvic_floor_safe: "Pelvic Floor Safe (post-op safety)",
    heavy_binding_safe: "Heavy Binding Safe (binding safety)",
    effectiveness_rating: "Effectiveness Rating (exercise scoring)",
    target_muscles: "Target Muscles (exercise selection)",
    pattern: "Pattern (template matching)",
    earliest_safe_phase: "Earliest Safe Phase (POST-OP CRITICAL)",
  };

  for (const [field, stats] of Object.entries(result.fields)) {
    const label = fieldLabels[field] || field;
    const bar =
      "█".repeat(Math.floor(stats.percentage / 5)) +
      "░".repeat(20 - Math.floor(stats.percentage / 5));
    const status =
      stats.percentage >= 90 ? "✅" : stats.percentage >= 50 ? "⚠️" : "❌";
    console.log(`${status} ${label}`);
    console.log(
      `   [${bar}] ${stats.percentage}% (${stats.populated}/${stats.total})`,
    );
  }

  if (result.criticalIssues.length > 0) {
    console.log("\n🚨 CRITICAL ISSUES:");
    console.log(
      "───────────────────────────────────────────────────────────────",
    );
    result.criticalIssues.forEach((issue) => console.log(`   ${issue}`));
  }

  if (result.warnings.length > 0) {
    console.log("\n⚠️  WARNINGS:");
    console.log(
      "───────────────────────────────────────────────────────────────",
    );
    result.warnings.forEach((warning) => console.log(`   ${warning}`));
  }

  if (
    result.exercisesMissingCriticalFields.length > 0 &&
    result.exercisesMissingCriticalFields.length <= 20
  ) {
    console.log("\n📋 EXERCISES MISSING CRITICAL FIELDS:");
    console.log(
      "───────────────────────────────────────────────────────────────",
    );
    result.exercisesMissingCriticalFields.slice(0, 20).forEach((ex) => {
      console.log(`   ${ex.id}: ${ex.name}`);
      console.log(`      Missing: ${ex.missingFields.join(", ")}`);
    });
    if (result.exercisesMissingCriticalFields.length > 20) {
      console.log(
        `   ... and ${result.exercisesMissingCriticalFields.length - 20} more`,
      );
    }
  } else if (result.exercisesMissingCriticalFields.length > 20) {
    console.log(
      `\n📋 ${result.exercisesMissingCriticalFields.length} exercises missing critical fields (too many to list)`,
    );
  }

  console.log(
    "\n═══════════════════════════════════════════════════════════════",
  );
  if (result.isLaunchReady) {
    console.log("✅ LAUNCH READY: Exercise database passes safety validation");
  } else {
    console.log("❌ NOT LAUNCH READY: Fix critical issues before launch");
  }
  console.log(
    "═══════════════════════════════════════════════════════════════\n",
  );

  // Return exit code based on status
  return result.isLaunchReady ? 0 : 1;
}

async function main() {
  try {
    const result = await validateExercises();
    const exitCode = printResults(result);
    process.exit(exitCode);
  } catch (error) {
    console.error("❌ Validation failed:", error);
    process.exit(1);
  }
}

main();
