/**
 * Add Immediate Recovery Phase Exercises to Database
 *
 * This script adds validated exercises suitable for the immediate recovery phase
 * (weeks 0-2 post-op). These are gentle breathing, mobility, and circulation
 * exercises that are safe for post-surgical patients.
 *
 * Based on established rehabilitation protocols from:
 * - Post-surgical breathing exercises for pulmonary recovery
 * - DVT prevention exercises (ankle pumps, leg circles)
 * - Gentle ROM exercises for non-surgical areas
 *
 * Usage:
 *   npx tsx scripts/add_immediate_exercises.ts --dry-run
 *   npx tsx scripts/add_immediate_exercises.ts
 */

import * as path from "path";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "..", ".env") });

interface ImmediateExercise {
  slug: string;
  name: string;
  pattern: string;
  goal: string;
  equipment: string[];
  target_muscles: string;
  recovery_phases: string[];
  impact_level: string;
  earliest_safe_phase: string;
  contraindications: string[];
}

// Validated immediate-phase exercises based on rehabilitation protocols
const IMMEDIATE_EXERCISES: ImmediateExercise[] = [
  // Breathing exercises
  {
    slug: "diaphragmatic_breathing",
    name: "Diaphragmatic Breathing",
    pattern: "breathing",
    goal: "mobility",
    equipment: [],
    target_muscles: "diaphragm, intercostals",
    recovery_phases: ["immediate", "early", "mid", "late", "maintenance"],
    impact_level: "no_impact",
    earliest_safe_phase: "immediate",
    contraindications: [],
  },
  {
    slug: "pursed_lip_breathing",
    name: "Pursed Lip Breathing",
    pattern: "breathing",
    goal: "mobility",
    equipment: [],
    target_muscles: "diaphragm, intercostals",
    recovery_phases: ["immediate", "early", "mid", "late", "maintenance"],
    impact_level: "no_impact",
    earliest_safe_phase: "immediate",
    contraindications: [],
  },
  {
    slug: "box_breathing",
    name: "Box Breathing",
    pattern: "breathing",
    goal: "mobility",
    equipment: [],
    target_muscles: "diaphragm, intercostals",
    recovery_phases: ["immediate", "early", "mid", "late", "maintenance"],
    impact_level: "no_impact",
    earliest_safe_phase: "immediate",
    contraindications: [],
  },

  // Circulation/DVT prevention
  {
    slug: "ankle_pumps",
    name: "Ankle Pumps",
    pattern: "mobility",
    goal: "mobility",
    equipment: [],
    target_muscles: "calves, tibialis anterior",
    recovery_phases: ["immediate", "early", "mid", "late", "maintenance"],
    impact_level: "no_impact",
    earliest_safe_phase: "immediate",
    contraindications: [],
  },
  {
    slug: "ankle_circles",
    name: "Ankle Circles",
    pattern: "mobility",
    goal: "mobility",
    equipment: [],
    target_muscles: "calves, tibialis anterior, peroneals",
    recovery_phases: ["immediate", "early", "mid", "late", "maintenance"],
    impact_level: "no_impact",
    earliest_safe_phase: "immediate",
    contraindications: [],
  },
  {
    slug: "heel_slides_gentle",
    name: "Gentle Heel Slides",
    pattern: "mobility",
    goal: "mobility",
    equipment: [],
    target_muscles: "hip flexors, quadriceps",
    recovery_phases: ["immediate", "early", "mid", "late", "maintenance"],
    impact_level: "no_impact",
    earliest_safe_phase: "immediate",
    contraindications: ["bottom_surgery", "hip_surgery", "abdominal_surgery"],
  },

  // Gentle upper body (for non-chest surgery patients)
  {
    slug: "wrist_circles",
    name: "Wrist Circles",
    pattern: "mobility",
    goal: "mobility",
    equipment: [],
    target_muscles: "forearm flexors and extensors",
    recovery_phases: ["immediate", "early", "mid", "late", "maintenance"],
    impact_level: "no_impact",
    earliest_safe_phase: "immediate",
    contraindications: [],
  },
  {
    slug: "finger_spreads",
    name: "Finger Spreads",
    pattern: "mobility",
    goal: "mobility",
    equipment: [],
    target_muscles: "intrinsic hand muscles",
    recovery_phases: ["immediate", "early", "mid", "late", "maintenance"],
    impact_level: "no_impact",
    earliest_safe_phase: "immediate",
    contraindications: [],
  },

  // Neck mobility (for non-FFS patients)
  {
    slug: "gentle_neck_turns",
    name: "Gentle Neck Turns",
    pattern: "mobility",
    goal: "mobility",
    equipment: [],
    target_muscles: "neck rotators, sternocleidomastoid",
    recovery_phases: ["immediate", "early", "mid", "late", "maintenance"],
    impact_level: "no_impact",
    earliest_safe_phase: "immediate",
    contraindications: ["ffs", "facial_surgery", "neck_surgery"],
  },

  // Relaxation/gentle stretching
  {
    slug: "progressive_muscle_relaxation",
    name: "Progressive Muscle Relaxation",
    pattern: "breathing",
    goal: "mobility",
    equipment: [],
    target_muscles: "full body",
    recovery_phases: ["immediate", "early", "mid", "late", "maintenance"],
    impact_level: "no_impact",
    earliest_safe_phase: "immediate",
    contraindications: [],
  },
];

async function getMaxExerciseId(supabase: SupabaseClient): Promise<number> {
  const { data, error } = await supabase
    .from("exercises")
    .select("id")
    .order("id", { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    console.error("Error getting max id:", error);
    return 1000; // Start from 1000 if we can't get max
  }

  return data[0].id;
}

async function checkExistingExercise(
  supabase: SupabaseClient,
  slug: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("exercises")
    .select("id")
    .eq("slug", slug)
    .limit(1);

  if (error) {
    console.error("Error checking existing exercise:", error);
    return false;
  }

  return data && data.length > 0;
}

async function insertExercise(
  supabase: SupabaseClient,
  exercise: ImmediateExercise,
  nextId: number,
  dryRun: boolean,
): Promise<{ success: boolean; skipped: boolean }> {
  // Check if exercise already exists
  const exists = await checkExistingExercise(supabase, exercise.slug);
  if (exists) {
    console.log(`  SKIP (exists): ${exercise.name}`);
    return { success: true, skipped: true };
  }

  // Database requires explicit integer id
  const insertData = {
    id: nextId,
    slug: exercise.slug,
    name: exercise.name,
    pattern: exercise.pattern,
    goal: exercise.goal,
    equipment: exercise.equipment,
    target_muscles: exercise.target_muscles,
    recovery_phases: exercise.recovery_phases,
    impact_level: exercise.impact_level,
    earliest_safe_phase: exercise.earliest_safe_phase,
    contraindications: exercise.contraindications,
    // Add other required fields with sensible defaults
    difficulty: "beginner",
    binder_aware: true,
    pelvic_floor_safe: true,
  };

  if (dryRun) {
    console.log(`  [DRY RUN] Would insert: ${exercise.name}`);
    console.log(`    Pattern: ${exercise.pattern}`);
    console.log(`    Impact: ${exercise.impact_level}`);
    console.log(`    Phases: ${exercise.recovery_phases.join(", ")}`);
    return { success: true, skipped: false };
  }

  const { error } = await supabase.from("exercises").insert(insertData);

  if (error) {
    console.error(`  ERROR inserting "${exercise.name}":`, error.message);
    return { success: false, skipped: false };
  }

  console.log(`  ADDED: ${exercise.name}`);
  return { success: true, skipped: false };
}

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  console.log("=".repeat(60));
  console.log("Add Immediate Recovery Phase Exercises");
  console.log("=".repeat(60));
  console.log(`Dry run: ${dryRun}`);
  console.log(`Exercises to process: ${IMMEDIATE_EXERCISES.length}`);
  console.log("");

  // Validate environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get the max exercise id to start from
  let maxId = await getMaxExerciseId(supabase);
  console.log(`Current max exercise id: ${maxId}`);

  // Insert exercises
  console.log("\nProcessing exercises...\n");
  let addedCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const exercise of IMMEDIATE_EXERCISES) {
    const nextId = maxId + 1;
    const result = await insertExercise(supabase, exercise, nextId, dryRun);
    if (result.success) {
      if (result.skipped) {
        skipCount++;
      } else {
        addedCount++;
        maxId = nextId; // Increment for next exercise
      }
    } else {
      errorCount++;
    }
  }

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total exercises: ${IMMEDIATE_EXERCISES.length}`);
  console.log(`Added: ${addedCount}`);
  console.log(`Skipped (already exist): ${skipCount}`);
  console.log(`Errors: ${errorCount}`);

  // Print exercise breakdown
  console.log("\nExercise Categories Added:");
  const byPattern: Record<string, number> = {};
  for (const ex of IMMEDIATE_EXERCISES) {
    byPattern[ex.pattern] = (byPattern[ex.pattern] || 0) + 1;
  }
  for (const [pattern, count] of Object.entries(byPattern)) {
    console.log(`  ${pattern}: ${count}`);
  }

  if (dryRun) {
    console.log("\n[DRY RUN] No changes made to database.");
    console.log("Run without --dry-run to insert exercises.");
  } else if (addedCount > 0) {
    console.log("\nImmediate phase exercises added successfully!");
    console.log("These exercises are suitable for weeks 0-2 post-op.");
  }
}

main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
