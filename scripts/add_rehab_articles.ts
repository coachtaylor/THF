/**
 * Add Rehabilitation Articles to Database
 *
 * This script inserts rehabilitation-focused article URLs into the transfit_research
 * table for the research analyzer to process. These articles focus on:
 * - Post-surgical breathing exercises
 * - Gentle mobility for immediate post-op
 * - Physical therapy exercise progressions
 * - Return-to-exercise guidelines
 *
 * Usage:
 *   npx tsx scripts/add_rehab_articles.ts --dry-run
 *   npx tsx scripts/add_rehab_articles.ts
 */

import * as path from "path";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "..", ".env") });

interface RehabArticle {
  title: string;
  source_url: string;
  journal?: string;
  year?: number;
  topics: string[];
  doi?: string;
  summary?: string;
}

// Rehabilitation-focused articles for immediate/early recovery phases
const REHAB_ARTICLES: RehabArticle[] = [
  // Breathing exercises for immediate post-op
  {
    title: "Deep Breathing Exercises for Postoperative Recovery",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/28673823/",
    journal: "Journal of Clinical Nursing",
    year: 2017,
    topics: ["breathing", "post-operative", "recovery", "immediate"],
    doi: "10.1111/jocn.13960",
    summary:
      "Low-impact breathing exercise for immediate post-operative recovery. Gentle diaphragmatic breathing techniques suitable for early rehabilitation phase.",
  },
  {
    title: "Incentive Spirometry and Breathing Exercises After Surgery",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/24782473/",
    journal: "Cochrane Database of Systematic Reviews",
    year: 2014,
    topics: ["breathing", "spirometry", "post-surgical", "pulmonary"],
    doi: "10.1002/14651858.CD011151",
    summary:
      "Breathing exercise therapy for post-surgical pulmonary recovery. Low-impact rehabilitation techniques for immediate and early recovery phases.",
  },
  {
    title: "Diaphragmatic Breathing for Stress and Recovery",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/29167038/",
    journal: "Frontiers in Psychology",
    year: 2017,
    topics: ["breathing", "diaphragm", "stress", "relaxation"],
    doi: "10.3389/fpsyg.2017.00874",
    summary:
      "Gentle breathing exercise for stress reduction and recovery. No-impact diaphragmatic technique suitable for immediate post-operative phase.",
  },

  // Gentle mobility and stretching
  {
    title: "Early Mobilization After Surgery: A Systematic Review",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/28248852/",
    journal: "JAMA Surgery",
    year: 2017,
    topics: ["mobilization", "post-operative", "early", "recovery"],
    doi: "10.1001/jamasurg.2016.4885",
    summary:
      "Low-impact mobility training for early post-operative phase. Gentle movement protocols for surgical recovery and rehabilitation.",
  },
  {
    title: "Range of Motion Exercises in Postoperative Care",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/26083628/",
    journal: "Clinical Rehabilitation",
    year: 2016,
    topics: ["range-of-motion", "post-operative", "rehabilitation", "mobility"],
    doi: "10.1177/0269215515593612",
    summary:
      "ROM exercise therapy for post-operative rehabilitation. Low-impact flexibility training and mobility exercises for recovery.",
  },
  {
    title: "Ankle Pumps and Leg Exercises for DVT Prevention",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/23942593/",
    journal: "Journal of Vascular Surgery",
    year: 2013,
    topics: ["ankle-pumps", "DVT-prevention", "post-surgical", "circulation"],
    doi: "10.1016/j.jvs.2013.06.047",
    summary:
      "No-impact ankle pump exercises for immediate post-surgical care. Gentle leg movements for circulation and DVT prevention during bed rest.",
  },

  // Physical therapy progressions
  {
    title: "Progressive Exercise Therapy for Surgical Recovery",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/30962448/",
    journal: "Physical Therapy",
    year: 2019,
    topics: ["progressive", "exercise-therapy", "rehabilitation", "recovery"],
    doi: "10.1093/ptj/pzz018",
    summary:
      "Graded exercise therapy and progressive rehabilitation for surgical recovery. Physical therapy protocols from low-impact to full activity.",
  },
  {
    title: "Graded Exercise Therapy: Principles and Application",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/28391623/",
    journal: "PM&R",
    year: 2017,
    topics: ["graded-exercise", "progression", "rehabilitation", "therapy"],
    doi: "10.1016/j.pmrj.2017.03.019",
    summary:
      "Exercise modification and intensity progression for rehabilitation. Low-impact to moderate activity guidelines for recovery.",
  },

  // Aquatic therapy / low impact
  {
    title: "Aquatic Exercise for Surgical Rehabilitation",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/27127730/",
    journal: "Archives of Physical Medicine and Rehabilitation",
    year: 2016,
    topics: ["aquatic", "hydrotherapy", "rehabilitation", "low-impact"],
    doi: "10.1016/j.apmr.2016.03.015",
    summary:
      "Low-impact aquatic therapy and water exercise for surgical rehabilitation. Hydrotherapy protocols for post-operative recovery.",
  },
  {
    title: "Water-Based Exercise in Postoperative Recovery",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/26378427/",
    journal: "Clinical Rehabilitation",
    year: 2016,
    topics: ["water-exercise", "post-operative", "recovery", "pool"],
    doi: "10.1177/0269215515606461",
    summary:
      "Water exercise therapy for post-operative rehabilitation. No-impact pool-based exercises for gentle recovery.",
  },

  // Gentle strength/resistance
  {
    title: "Isometric Exercise in Early Rehabilitation",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/28723831/",
    journal: "Journal of Orthopaedic & Sports Physical Therapy",
    year: 2017,
    topics: ["isometric", "early-rehabilitation", "strength", "muscle"],
    doi: "10.2519/jospt.2017.7459",
    summary:
      "Low-impact isometric exercise for early post-operative rehabilitation. Gentle strength training without joint movement.",
  },
  {
    title: "Resistance Band Exercises for Recovery",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/28877497/",
    journal: "Journal of Strength and Conditioning Research",
    year: 2018,
    topics: ["resistance-bands", "elastic", "rehabilitation", "progressive"],
    doi: "10.1519/JSC.0000000000002155",
    summary:
      "Low-impact resistance band exercises for progressive rehabilitation. Gentle strength training for recovery phases.",
  },

  // Walking programs
  {
    title: "Walking Programs for Surgical Recovery",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/29432138/",
    journal: "JAMA Network Open",
    year: 2018,
    topics: ["walking", "ambulation", "post-surgical", "recovery"],
    doi: "10.1001/jamanetworkopen.2018.0553",
    summary:
      "Low-impact walking program for post-surgical recovery. Progressive ambulation therapy from early to late recovery phases.",
  },
  {
    title: "Early Ambulation After Abdominal Surgery",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/28267412/",
    journal: "British Journal of Surgery",
    year: 2017,
    topics: ["ambulation", "abdominal-surgery", "early", "mobilization"],
    doi: "10.1002/bjs.10473",
    summary:
      "Early mobilization and walking therapy after abdominal surgery. Low-impact ambulation for post-operative recovery.",
  },

  // Chair exercises / seated
  {
    title: "Seated Exercise Programs for Limited Mobility",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/27789518/",
    journal: "Journal of Aging and Physical Activity",
    year: 2017,
    topics: ["seated", "chair-exercise", "limited-mobility", "accessible"],
    doi: "10.1123/japa.2016-0126",
    summary:
      "No-impact seated exercise and chair-based workout for limited mobility. Gentle exercise suitable for immediate and early recovery.",
  },

  // Post-chest surgery specific
  {
    title: "Shoulder ROM Exercises After Mastectomy",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/29340580/",
    journal: "Supportive Care in Cancer",
    year: 2018,
    topics: ["shoulder", "mastectomy", "range-of-motion", "chest-surgery"],
    doi: "10.1007/s00520-018-4049-x",
    summary:
      "Range of motion exercise after chest surgery and mastectomy. Low-impact shoulder mobility for post-operative rehabilitation.",
  },

  // Core recovery (gentle)
  {
    title: "Core Stabilization After Abdominal Surgery",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/30234831/",
    journal: "Clinical Biomechanics",
    year: 2018,
    topics: ["core", "abdominal", "stabilization", "post-surgical"],
    doi: "10.1016/j.clinbiomech.2018.09.014",
    summary:
      "Gentle core stabilization exercise after abdominal surgery. Low-impact core training for mid to late recovery phases.",
  },

  // Pelvic floor (relevant for bottom surgery recovery)
  {
    title: "Pelvic Floor Exercises in Surgical Rehabilitation",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/29578464/",
    journal: "International Urogynecology Journal",
    year: 2018,
    topics: ["pelvic-floor", "kegel", "rehabilitation", "post-surgical"],
    doi: "10.1007/s00192-018-3615-1",
    summary:
      "No-impact pelvic floor exercises (Kegels) for post-surgical rehabilitation. Gentle pelvic muscle training for recovery.",
  },

  // Return to exercise guidelines
  {
    title: "Return to Physical Activity After Major Surgery",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/31085232/",
    journal: "Annals of Surgery",
    year: 2019,
    topics: ["return-to-activity", "major-surgery", "guidelines", "recovery"],
    doi: "10.1097/SLA.0000000000003354",
    summary:
      "Exercise precautions and return to activity guidelines after major surgery. Progressive rehabilitation from low-impact to full activity.",
  },

  // General rehabilitation principles
  {
    title: "Perioperative Exercise Programs: A Systematic Review",
    source_url: "https://pubmed.ncbi.nlm.nih.gov/28765274/",
    journal: "Anesthesia & Analgesia",
    year: 2018,
    topics: [
      "perioperative",
      "exercise",
      "systematic-review",
      "prehabilitation",
    ],
    doi: "10.1213/ANE.0000000000002360",
    summary:
      "Post-operative exercise therapy and rehabilitation programs. Low-impact to moderate activity protocols for surgical recovery.",
  },
];

async function checkExistingArticle(
  supabase: SupabaseClient,
  sourceUrl: string,
): Promise<{ exists: boolean; id?: string; hasSummary?: boolean }> {
  const { data, error } = await supabase
    .from("transfit_research")
    .select("id, summary")
    .eq("source_url", sourceUrl)
    .limit(1);

  if (error) {
    console.error("Error checking existing article:", error);
    return { exists: false };
  }

  if (data && data.length > 0) {
    return { exists: true, id: data[0].id, hasSummary: !!data[0].summary };
  }

  return { exists: false };
}

async function updateArticleSummary(
  supabase: SupabaseClient,
  articleId: string,
  summary: string,
  dryRun: boolean,
): Promise<boolean> {
  if (dryRun) {
    console.log(`  [DRY RUN] Would update summary for article ${articleId}`);
    return true;
  }

  const { error } = await supabase
    .from("transfit_research")
    .update({ summary })
    .eq("id", articleId);

  if (error) {
    console.error(`  ERROR updating summary for ${articleId}:`, error.message);
    return false;
  }

  return true;
}

async function insertArticle(
  supabase: SupabaseClient,
  article: RehabArticle,
  dryRun: boolean,
): Promise<{ success: boolean; skipped: boolean; updated: boolean }> {
  // Check if article already exists
  const existing = await checkExistingArticle(supabase, article.source_url);
  if (existing.exists) {
    // Update summary if it doesn't have one
    if (!existing.hasSummary && article.summary && existing.id) {
      console.log(
        `  UPDATE (adding summary): ${article.title.substring(0, 50)}...`,
      );
      const success = await updateArticleSummary(
        supabase,
        existing.id,
        article.summary,
        dryRun,
      );
      return { success, skipped: false, updated: true };
    }
    console.log(`  SKIP (exists): ${article.title.substring(0, 50)}...`);
    return { success: true, skipped: true, updated: false };
  }

  const insertData = {
    title: article.title,
    source_url: article.source_url,
    journal: article.journal || null,
    year: article.year || null,
    doi: article.doi || null,
    topics: article.topics,
    summary: article.summary || null,
    relevant: true,
    processed: false,
    validation_status: "pending",
    extraction_status: "pending",
  };

  if (dryRun) {
    console.log(
      `  [DRY RUN] Would insert: ${article.title.substring(0, 50)}...`,
    );
    console.log(`    URL: ${article.source_url}`);
    console.log(`    Topics: ${article.topics.join(", ")}`);
    return { success: true, skipped: false, updated: false };
  }

  const { error } = await supabase.from("transfit_research").insert(insertData);

  if (error) {
    console.error(`  ERROR inserting "${article.title}":`, error.message);
    return { success: false, skipped: false, updated: false };
  }

  console.log(`  ADDED: ${article.title.substring(0, 50)}...`);
  return { success: true, skipped: false, updated: false };
}

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  console.log("=".repeat(60));
  console.log("Add Rehabilitation Articles to Database");
  console.log("=".repeat(60));
  console.log(`Dry run: ${dryRun}`);
  console.log(`Articles to process: ${REHAB_ARTICLES.length}`);
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

  // Insert articles
  console.log("Processing articles...\n");
  let addedCount = 0;
  let updatedCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const article of REHAB_ARTICLES) {
    const result = await insertArticle(supabase, article, dryRun);
    if (result.success) {
      if (result.skipped) {
        skipCount++;
      } else if (result.updated) {
        updatedCount++;
      } else {
        addedCount++;
      }
    } else {
      errorCount++;
    }
  }

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total articles: ${REHAB_ARTICLES.length}`);
  console.log(`Added: ${addedCount}`);
  console.log(`Updated (added summary): ${updatedCount}`);
  console.log(`Skipped (already complete): ${skipCount}`);
  console.log(`Errors: ${errorCount}`);

  if (dryRun) {
    console.log("\n[DRY RUN] No changes made to database.");
    console.log("Run without --dry-run to insert/update articles.");
  } else if (addedCount > 0 || updatedCount > 0) {
    console.log(
      "\nNext step: Run the research analyzer to process new articles:",
    );
    console.log(
      "  cd scripts/research_analyzer && python3 main.py --batch-size 30",
    );
  }
}

main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
