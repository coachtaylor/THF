// scripts/import_exercisedb_local.ts
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

// Get __dirname equivalent that works in both CommonJS and ESM
const getDirname = () => {
  try {
    // ESM mode
    if (typeof import.meta !== "undefined" && import.meta.url) {
      return dirname(fileURLToPath(import.meta.url));
    }
  } catch {}
  // CommonJS mode
  // @ts-ignore - __dirname exists in CommonJS
  return typeof __dirname !== "undefined" ? __dirname : process.cwd();
};

const scriptDir = getDirname();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

type RawExercise = {
  exerciseId: string;
  name: string;
  gifUrl?: string;
  targetMuscles?: string[];
  bodyParts?: string[];
  equipments?: string[];
  secondaryMuscles?: string[];
  instructions?: string[];
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function run() {
  const filePath = path.join(__dirname, "..", "exercise_db", "exercises.json");
  const rawJson = fs.readFileSync(filePath, "utf8");
  const raw: RawExercise[] = JSON.parse(rawJson);

  const rows = raw.map((e) => {
    const equipment =
      e.equipments && e.equipments.length > 0
        ? e.equipments[0].toLowerCase()
        : "body weight";

    return {
      external_id: e.exerciseId,
      slug: slugify(e.name),
      name: e.name,
      equipment, // we'll normalize later (band → bands, body weight → bodyweight, etc.)
      body_parts: e.bodyParts?.join(", ") ?? null,
      target_muscles: e.targetMuscles?.join(", ") ?? null,
      secondary_muscles: e.secondaryMuscles?.join(", ") ?? null,
      exercise_type: null, // optional, we can infer later in tagging
      gif_url: e.gifUrl ?? null,
      media_thumb: e.gifUrl ?? null,
      media_video: null,
      instructions: e.instructions ?? [],
      source_name: "ExerciseDB",
      source_url: e.gifUrl ?? null,
    };
  });

  const chunkSize = 500;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase
      .from("staging_exercisedb")
      .upsert(chunk, { onConflict: "external_id" });

    if (error) {
      console.error("Error upserting chunk:", error);
      throw error;
    }
    console.log(`Upserted ${i + chunk.length} / ${rows.length} exercises`);
  }

  console.log("Done importing ExerciseDB into staging_exercisedb.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
