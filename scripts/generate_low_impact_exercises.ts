/**
 * Generate Low-Impact Exercise Database Entries from Research Analyzer Output
 *
 * This script reads extracted LowImpactExerciseInsight records from the research
 * analyzer output and either updates existing exercises or generates candidate
 * entries for manual review.
 *
 * Usage:
 *   npx ts-node scripts/generate_low_impact_exercises.ts --input output/analysis_report.json
 *   npx ts-node scripts/generate_low_impact_exercises.ts --input output/analysis_report.json --dry-run
 *   npx ts-node scripts/generate_low_impact_exercises.ts --input output/analysis_report.json --output exercise_candidates.json
 */

import * as fs from "fs";
import * as path from "path";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Types matching the Python models
interface RecoveryPhaseAppropriateness {
  earliest_safe_phase: "immediate" | "early" | "mid" | "late" | "maintenance";
  surgery_types: string[];
  avoid_body_regions: string[];
}

interface ExerciseModifications {
  regressions: string[];
  progressions: string[];
  contraindicated_for: string[];
}

interface LowImpactExerciseInsight {
  exercise_name: string;
  standardized_name: string;
  category:
    | "mobility"
    | "strength"
    | "cardio"
    | "flexibility"
    | "balance"
    | "breathing";
  movement_pattern: string;
  impact_level:
    | "no_impact"
    | "very_low_impact"
    | "low_impact"
    | "moderate_impact";
  exertion_level: "minimal" | "light" | "moderate";
  equipment: string[];
  recovery_phases: RecoveryPhaseAppropriateness;
  modifications?: ExerciseModifications;
  evidence_quote?: string;
  confidence: "high" | "medium" | "low";
  research_id?: string;
}

interface AnalysisReport {
  metadata: {
    generated_at: string;
    articles_processed: number;
  };
  insights: {
    low_impact_exercise_findings?: LowImpactExerciseInsight[];
  };
}

interface ExerciseCandidate {
  slug: string;
  name: string;
  pattern: string;
  goal: string;
  post_op_safe_weeks: number;
  recovery_phases: string[];
  impact_level: string;
  earliest_safe_phase: string;
  equipment: string[];
  source: string;
  confidence: string;
  evidence_quote?: string;
  research_id?: string;
  needs_review: boolean;
  is_new: boolean;
  existing_exercise_id?: string;
}

// Phase to weeks mapping
const PHASE_TO_WEEKS: Record<string, number> = {
  immediate: 0,
  early: 2,
  mid: 6,
  late: 12,
  maintenance: 24,
};

// Category to goal mapping
const CATEGORY_TO_GOAL: Record<string, string> = {
  mobility: "mobility",
  strength: "strength",
  cardio: "cardio",
  flexibility: "flexibility",
  balance: "mobility",
  breathing: "mobility",
};

async function loadAnalysisReport(inputPath: string): Promise<AnalysisReport> {
  const content = fs.readFileSync(inputPath, "utf-8");
  return JSON.parse(content) as AnalysisReport;
}

async function fetchExistingExercises(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("exercises")
    .select("id, slug, name")
    .order("name");

  if (error) {
    console.error("Error fetching exercises:", error);
    throw error;
  }

  return data || [];
}

function matchExistingExercise(
  candidate: LowImpactExerciseInsight,
  existingExercises: { id: string; slug: string; name: string }[],
): { id: string; slug: string; name: string } | null {
  const slug = candidate.standardized_name;
  const nameLower = candidate.exercise_name.toLowerCase();

  for (const ex of existingExercises) {
    if (ex.slug === slug) {
      return ex;
    }
    if (ex.name.toLowerCase() === nameLower) {
      return ex;
    }
    // Fuzzy match: check if names are similar
    if (
      ex.name.toLowerCase().includes(nameLower) ||
      nameLower.includes(ex.name.toLowerCase())
    ) {
      return ex;
    }
  }

  return null;
}

function generateExerciseCandidate(
  insight: LowImpactExerciseInsight,
  existingExercise: { id: string; slug: string; name: string } | null,
): ExerciseCandidate {
  const earliestPhase = insight.recovery_phases.earliest_safe_phase;
  const postOpSafeWeeks = PHASE_TO_WEEKS[earliestPhase] || 24;

  // Generate all applicable recovery phases
  const phaseOrder = ["immediate", "early", "mid", "late", "maintenance"];
  const phaseIdx = phaseOrder.indexOf(earliestPhase);
  const recoveryPhases = phaseOrder.slice(phaseIdx);

  return {
    slug: insight.standardized_name,
    name: insight.exercise_name,
    pattern: insight.movement_pattern,
    goal: CATEGORY_TO_GOAL[insight.category] || "mobility",
    post_op_safe_weeks: postOpSafeWeeks,
    recovery_phases: recoveryPhases,
    impact_level: insight.impact_level,
    earliest_safe_phase: earliestPhase,
    equipment: insight.equipment,
    source: "research_analyzer",
    confidence: insight.confidence,
    evidence_quote: insight.evidence_quote,
    research_id: insight.research_id,
    needs_review: true,
    is_new: !existingExercise,
    existing_exercise_id: existingExercise?.id,
  };
}

async function updateExistingExercise(
  supabase: SupabaseClient,
  exerciseId: string,
  candidate: ExerciseCandidate,
  dryRun: boolean,
): Promise<boolean> {
  const updateData: Record<string, unknown> = {
    recovery_phases: candidate.recovery_phases,
    impact_level: candidate.impact_level,
    earliest_safe_phase: candidate.earliest_safe_phase,
    post_op_safe_weeks: candidate.post_op_safe_weeks,
    research_source_ids: candidate.research_id ? [candidate.research_id] : [],
  };

  if (dryRun) {
    console.log(`  [DRY RUN] Would update exercise ${exerciseId}:`, updateData);
    return true;
  }

  const { error } = await supabase
    .from("exercises")
    .update(updateData)
    .eq("id", exerciseId);

  if (error) {
    console.error(`  Error updating exercise ${exerciseId}:`, error);
    return false;
  }

  return true;
}

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const inputIdx = args.indexOf("--input");
  const outputIdx = args.indexOf("--output");
  const dryRun = args.includes("--dry-run");

  if (inputIdx === -1 || !args[inputIdx + 1]) {
    console.error(
      "Usage: npx ts-node scripts/generate_low_impact_exercises.ts --input <path> [--output <path>] [--dry-run]",
    );
    process.exit(1);
  }

  const inputPath = args[inputIdx + 1];
  const outputPath =
    outputIdx !== -1 ? args[outputIdx + 1] : "exercise_candidates.json";

  console.log("=".repeat(60));
  console.log("Low-Impact Exercise Database Integration");
  console.log("=".repeat(60));
  console.log(`Input: ${inputPath}`);
  console.log(`Output: ${outputPath}`);
  console.log(`Dry run: ${dryRun}`);
  console.log("");

  // Load analysis report
  console.log("[1/4] Loading analysis report...");
  let report: AnalysisReport;
  try {
    report = await loadAnalysisReport(inputPath);
  } catch (error) {
    console.error("Failed to load analysis report:", error);
    process.exit(1);
  }

  const insights = report.insights?.low_impact_exercise_findings || [];
  console.log(`  Found ${insights.length} low-impact exercise insights`);

  if (insights.length === 0) {
    console.log("No low-impact exercises found in report. Exiting.");
    process.exit(0);
  }

  // Initialize Supabase client
  console.log("\n[2/4] Connecting to database...");
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables",
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch existing exercises
  console.log("\n[3/4] Fetching existing exercises...");
  let existingExercises: { id: string; slug: string; name: string }[];
  try {
    existingExercises = await fetchExistingExercises(supabase);
    console.log(`  Found ${existingExercises.length} existing exercises`);
  } catch (error) {
    console.error("Failed to fetch exercises:", error);
    process.exit(1);
  }

  // Process insights
  console.log("\n[4/4] Processing insights...");
  const candidates: ExerciseCandidate[] = [];
  let matchedCount = 0;
  let newCount = 0;
  let updatedCount = 0;
  let errorCount = 0;

  for (const insight of insights) {
    const existingExercise = matchExistingExercise(insight, existingExercises);
    const candidate = generateExerciseCandidate(insight, existingExercise);
    candidates.push(candidate);

    if (existingExercise) {
      matchedCount++;
      console.log(
        `  MATCH: "${insight.exercise_name}" -> ${existingExercise.slug}`,
      );

      // Update existing exercise with recovery phase data
      const success = await updateExistingExercise(
        supabase,
        existingExercise.id,
        candidate,
        dryRun,
      );
      if (success) {
        updatedCount++;
      } else {
        errorCount++;
      }
    } else {
      newCount++;
      console.log(
        `  NEW: "${insight.exercise_name}" (${insight.standardized_name})`,
      );
    }
  }

  // Save candidates to output file
  const output = {
    generated_at: new Date().toISOString(),
    source_report: inputPath,
    dry_run: dryRun,
    summary: {
      total_insights: insights.length,
      matched_existing: matchedCount,
      new_exercises: newCount,
      updated: updatedCount,
      errors: errorCount,
    },
    candidates: candidates,
    new_exercise_candidates: candidates.filter((c) => c.is_new),
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total insights processed: ${insights.length}`);
  console.log(`Matched existing exercises: ${matchedCount}`);
  console.log(`New exercise candidates: ${newCount}`);
  console.log(`Updated in database: ${updatedCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`\nOutput saved to: ${outputPath}`);

  if (newCount > 0) {
    console.log(
      "\nNew exercises require manual review before adding to database.",
    );
    console.log('See the "new_exercise_candidates" array in the output file.');
  }
}

main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
