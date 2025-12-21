/**
 * Replace Missing Exercises Script
 *
 * Replaces 55 exercises missing thumbnails with equivalent ExerciseDB exercises
 * that have GIF thumbnails, matching by target muscles + equipment type.
 *
 * Usage:
 *   node scripts/replace-missing-exercises.js
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// File paths
const EXERCISEDB_JSON = path.join(__dirname, '..', 'exercise_db', 'exercises.json');
const NOT_FOUND_CSV = path.join(__dirname, '..', 'exercisedb-not-found.csv');
const REJECTED_CSV = path.join(__dirname, '..', 'exercisedb-rejected.csv');
const ORIGINAL_CSV = path.join(__dirname, '..', 'exercises_rows (17).csv');

// Output paths
const MATCHES_JSON = path.join(__dirname, '..', 'replacement-matches.json');
const REVIEW_CSV = path.join(__dirname, '..', 'replacement-review.csv');
const SQL_OUTPUT = path.join(__dirname, '..', 'replace-exercises.sql');

// Equipment mapping: TransFitness → ExerciseDB
const EQUIPMENT_MAP = {
  'bodyweight': 'body weight',
  'dumbbells': 'dumbbell',
  'dumbbell': 'dumbbell',
  'barbell': 'barbell',
  'resistance_band': 'band',
  'band': 'band',
  'kettlebell': 'kettlebell',
  'pull_up_bar': 'body weight',
  'bench': null, // accessory, ignore
  'cable': 'cable',
  'machine': 'leverage machine',
};

// Muscle mapping: TransFitness → ExerciseDB targetMuscles
const MUSCLE_MAP = {
  'glutes': ['glutes'],
  'quads': ['quads'],
  'quadriceps': ['quads'],
  'hamstrings': ['hamstrings'],
  'calves': ['calves'],
  'core': ['abs'],
  'abs': ['abs'],
  'obliques': ['abs'],
  'biceps': ['biceps'],
  'triceps': ['triceps'],
  'shoulders': ['delts'],
  'deltoids': ['delts'],
  'pectorals': ['pectorals'],
  'chest': ['pectorals'],
  'upper pectorals': ['pectorals'],
  'lats': ['lats'],
  'upper back': ['lats', 'traps'],
  'back': ['lats'],
  'traps': ['traps'],
  'forearms': ['forearms'],
  'hip flexors': ['hip flexors', 'glutes'],
  'inner thighs': ['adductors'],
  'adductors': ['adductors'],
  'ankle stabilizers': ['calves'],
  'cardio': [], // Special case - match any cardio exercise
};

/**
 * Parse CSV file into array of objects
 */
function parseCSV(filepath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filepath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

/**
 * Parse simple CSV (not-found, rejected) without csv-parser
 */
function parseSimpleCSV(filepath) {
  const content = fs.readFileSync(filepath, 'utf8');
  const lines = content.trim().split('\n');
  const header = lines[0].split(',').map(h => h.replace(/"/g, ''));

  return lines.slice(1).map(line => {
    // Handle quoted values
    const values = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const obj = {};
    header.forEach((key, i) => {
      obj[key] = values[i] || '';
    });
    return obj;
  });
}

/**
 * Normalize muscle names for matching
 */
function normalizeMuscles(muscleString) {
  if (!muscleString) return [];

  return muscleString
    .toLowerCase()
    .split(',')
    .map(m => m.trim())
    .filter(m => m.length > 0);
}

/**
 * Normalize equipment array
 */
function normalizeEquipment(equipmentStr) {
  if (!equipmentStr) return [];

  try {
    // Parse JSON array format: ["bodyweight", "bench"]
    const arr = JSON.parse(equipmentStr.replace(/'/g, '"'));
    return arr.map(e => e.toLowerCase().trim());
  } catch {
    // Fallback for plain string
    return [equipmentStr.toLowerCase().trim()];
  }
}

/**
 * Map TransFitness equipment to ExerciseDB format
 */
function mapEquipment(tfEquipment) {
  const mapped = [];
  for (const eq of tfEquipment) {
    const dbEq = EQUIPMENT_MAP[eq];
    if (dbEq) {
      mapped.push(dbEq);
    }
  }
  return mapped;
}

/**
 * Map TransFitness muscles to ExerciseDB targetMuscles
 */
function mapMuscles(tfMuscles) {
  const mapped = new Set();
  for (const muscle of tfMuscles) {
    const dbMuscles = MUSCLE_MAP[muscle];
    if (dbMuscles) {
      dbMuscles.forEach(m => mapped.add(m));
    }
  }
  return [...mapped];
}

/**
 * Calculate match score between TransFitness exercise and ExerciseDB exercise
 * Prioritizes: 1) Name similarity 2) Muscle match 3) Equipment match
 */
function calculateMatchScore(tfExercise, dbExercise, tfMuscles, tfEquipment) {
  let score = 0;

  // Map to ExerciseDB format
  const dbTargetMuscles = mapMuscles(tfMuscles);
  const dbEquipment = mapEquipment(tfEquipment);

  const tfName = tfExercise.name.toLowerCase();
  const dbName = dbExercise.name.toLowerCase();

  // ============================================
  // NAME MATCHING (Primary factor - 0-200 points)
  // ============================================

  // Extract key words (ignore common modifiers)
  const ignoreWords = ['the', 'with', 'on', 'and', 'to', 'for', 'a', 'an', 'one', 'two', 'arm', 'leg', 'single', 'double', 'standing', 'seated', 'lying', 'bent', 'over', 'male', 'female'];

  const tfWords = tfName.split(/[\s\-()]+/)
    .filter(w => w.length > 2 && !ignoreWords.includes(w));
  const dbWords = dbName.split(/[\s\-()]+/)
    .filter(w => w.length > 2 && !ignoreWords.includes(w));

  // Exact name match bonus
  if (tfName === dbName) {
    score += 300;
  }

  // Check for key exercise name in DB name (e.g., "glute bridge" in "glute bridge march")
  const tfKeyName = tfWords.slice(0, 3).join(' ');
  if (dbName.includes(tfKeyName) && tfKeyName.length > 5) {
    score += 200;
  }

  // Specific keyword bonuses for exercise types (must match core movement)
  const keywordPairs = [
    ['bridge', 'bridge'], ['squat', 'squat'], ['lunge', 'lunge'],
    ['curl', 'curl'], ['press', 'press'], ['row', 'row'],
    ['fly', 'fly'], ['raise', 'raise'], ['deadlift', 'deadlift'],
    ['crunch', 'crunch'], ['plank', 'plank'], ['push-up', 'push'],
    ['pullup', 'pull-up'], ['pull-up', 'pull-up'],
    ['kick', 'kick'], ['extension', 'extension'],
    ['thrust', 'thrust'], ['stretch', 'stretch'],
    ['snatch', 'snatch'], ['clean', 'clean'], ['halo', 'halo'],
  ];

  for (const [tfKey, dbKey] of keywordPairs) {
    if (tfName.includes(tfKey) && dbName.includes(dbKey)) {
      score += 100;
      break;
    }
  }

  // Word overlap scoring
  let exactWordMatches = 0;
  let partialWordMatches = 0;

  for (const tfWord of tfWords) {
    for (const dbWord of dbWords) {
      if (tfWord === dbWord) {
        exactWordMatches++;
        break;
      } else if (tfWord.length > 3 && dbWord.length > 3 &&
                 (tfWord.includes(dbWord) || dbWord.includes(tfWord))) {
        partialWordMatches++;
        break;
      }
    }
  }

  // Score based on word matches
  if (tfWords.length > 0) {
    score += (exactWordMatches / tfWords.length) * 80;
    score += (partialWordMatches / tfWords.length) * 30;
  }

  // ============================================
  // MUSCLE MATCHING (Secondary - 0-50 points)
  // ============================================
  const exerciseTargets = dbExercise.targetMuscles || [];
  const exerciseSecondary = dbExercise.secondaryMuscles || [];
  const allExerciseMuscles = [...exerciseTargets, ...exerciseSecondary].map(m => m.toLowerCase());

  let muscleMatches = 0;
  for (const muscle of dbTargetMuscles) {
    if (allExerciseMuscles.some(m => m.includes(muscle) || muscle.includes(m))) {
      muscleMatches++;
    }
  }

  if (dbTargetMuscles.length > 0) {
    score += (muscleMatches / dbTargetMuscles.length) * 30;
  }

  // Bonus for exact target muscle match
  for (const target of exerciseTargets) {
    if (dbTargetMuscles.some(m => target.toLowerCase().includes(m))) {
      score += 20;
      break;
    }
  }

  // ============================================
  // EQUIPMENT MATCHING (Tertiary - 0-30 points)
  // ============================================
  const exerciseEquipment = (dbExercise.equipments || []).map(e => e.toLowerCase());

  let equipmentMatch = false;
  for (const eq of dbEquipment) {
    if (exerciseEquipment.some(e => e.includes(eq) || eq.includes(e))) {
      equipmentMatch = true;
      break;
    }
  }

  if (equipmentMatch) {
    score += 30;
  }

  // Penalize if equipment doesn't match at all (and both have equipment specified)
  if (!equipmentMatch && dbEquipment.length > 0 && exerciseEquipment.length > 0) {
    score -= 20;
  }

  return score;
}

/**
 * Find best ExerciseDB match for a TransFitness exercise
 */
function findBestMatch(tfExercise, exerciseDB, originalData) {
  // Get original exercise data for muscle/equipment info
  const original = originalData.find(e =>
    e.id === tfExercise.id ||
    e.id === String(tfExercise.id)
  );

  if (!original) {
    console.log(`  Warning: No original data found for ID ${tfExercise.id}`);
    return null;
  }

  const tfMuscles = normalizeMuscles(original.target_muscles);
  const tfSecondary = normalizeMuscles(original.secondary_muscles);
  const allMuscles = [...tfMuscles, ...tfSecondary];
  const tfEquipment = normalizeEquipment(original.equipment);

  // Special handling for cardio exercises
  const isCardio = original.pattern === 'cardio' ||
                   original.goal === 'conditioning' ||
                   tfMuscles.includes('cardio');

  // Score all exercises
  const candidates = exerciseDB
    .filter(db => db.gifUrl) // Must have a GIF
    .map(db => ({
      exercise: db,
      score: calculateMatchScore(
        { name: tfExercise.name || original.name },
        db,
        allMuscles,
        tfEquipment
      ),
    }))
    .filter(c => c.score > 30) // Minimum threshold
    .sort((a, b) => b.score - a.score);

  if (candidates.length === 0) {
    return null;
  }

  // Return top match
  return {
    match: candidates[0].exercise,
    score: candidates[0].score,
    alternatives: candidates.slice(1, 4).map(c => ({
      name: c.exercise.name,
      score: c.score,
    })),
    originalMuscles: allMuscles.join(', '),
    originalEquipment: tfEquipment.join(', '),
  };
}

/**
 * Main execution
 */
async function main() {
  console.log('='.repeat(60));
  console.log('Exercise Replacement Script');
  console.log('='.repeat(60));

  // Load ExerciseDB
  console.log('\nLoading ExerciseDB...');
  const exerciseDB = JSON.parse(fs.readFileSync(EXERCISEDB_JSON, 'utf8'));
  console.log(`  Loaded ${exerciseDB.length} exercises`);

  // Load original CSV for exercise details
  console.log('\nLoading original exercise data...');
  const originalData = await parseCSV(ORIGINAL_CSV);
  console.log(`  Loaded ${originalData.length} exercises`);

  // Load missing exercises
  console.log('\nLoading missing exercises...');

  const notFound = parseSimpleCSV(NOT_FOUND_CSV);
  console.log(`  Not found: ${notFound.length}`);

  const rejected = parseSimpleCSV(REJECTED_CSV);
  console.log(`  Rejected: ${rejected.length}`);

  // Combine missing exercises
  const missingExercises = [
    ...notFound.map(e => ({ id: e.id, name: e.name, slug: e.slug, source: 'not_found' })),
    ...rejected.map(e => ({ id: e.id, name: e.name, slug: e.slug, source: 'rejected' })),
  ];

  console.log(`\nTotal to replace: ${missingExercises.length}`);
  console.log('');

  // Find matches
  const matches = [];
  const failures = [];

  for (let i = 0; i < missingExercises.length; i++) {
    const exercise = missingExercises[i];
    process.stdout.write(`[${i + 1}/${missingExercises.length}] ${exercise.name}... `);

    const result = findBestMatch(exercise, exerciseDB, originalData);

    if (result) {
      console.log(`\x1b[32mOK\x1b[0m (${result.match.name}, score: ${result.score.toFixed(1)})`);
      matches.push({
        originalId: exercise.id,
        originalName: exercise.name,
        originalSlug: exercise.slug,
        source: exercise.source,
        replacement: {
          exerciseId: result.match.exerciseId,
          name: result.match.name,
          gifUrl: result.match.gifUrl,
          targetMuscles: result.match.targetMuscles,
          equipments: result.match.equipments,
          instructions: result.match.instructions,
        },
        score: result.score,
        alternatives: result.alternatives,
        originalMuscles: result.originalMuscles,
        originalEquipment: result.originalEquipment,
      });
    } else {
      console.log(`\x1b[31mNo match\x1b[0m`);
      failures.push(exercise);
    }
  }

  // Save results
  console.log('\n' + '='.repeat(60));
  console.log('RESULTS');
  console.log('='.repeat(60));
  console.log(`  Matched: ${matches.length}`);
  console.log(`  No match: ${failures.length}`);

  // Save JSON
  const output = {
    generatedAt: new Date().toISOString(),
    stats: {
      total: missingExercises.length,
      matched: matches.length,
      failed: failures.length,
    },
    matches,
    failures,
  };

  fs.writeFileSync(MATCHES_JSON, JSON.stringify(output, null, 2));
  console.log(`\nSaved: ${MATCHES_JSON}`);

  // Save CSV for review
  const csvHeader = 'Original ID,Original Name,Replacement Name,Score,GIF URL,Target Muscles,Equipment,Alternatives\n';
  const csvRows = matches.map(m => {
    const alts = m.alternatives.map(a => `${a.name}(${a.score.toFixed(0)})`).join('; ');
    return `${m.originalId},"${m.originalName}","${m.replacement.name}",${m.score.toFixed(1)},"${m.replacement.gifUrl}","${(m.replacement.targetMuscles || []).join(', ')}","${(m.replacement.equipments || []).join(', ')}","${alts}"`;
  }).join('\n');

  fs.writeFileSync(REVIEW_CSV, csvHeader + csvRows);
  console.log(`Saved: ${REVIEW_CSV}`);

  // Generate SQL
  const sqlHeader = `-- Exercise Replacements
-- Generated: ${new Date().toISOString()}
-- Total: ${matches.length}
--
-- This SQL updates the exercises table with replacement exercise data
-- from ExerciseDB, including new name, media_thumb (GIF), and metadata.
--
-- WARNING: This will REPLACE the original exercises. Review carefully!

`;

  const sqlStatements = matches.map(m => {
    const safeName = m.replacement.name.replace(/'/g, "''");
    const safeUrl = m.replacement.gifUrl.replace(/'/g, "''");
    const targetMuscles = (m.replacement.targetMuscles || []).join(', ').replace(/'/g, "''");

    return `-- Replacing: ${m.originalName} (ID: ${m.originalId})
UPDATE exercises
SET name = '${safeName}',
    media_thumb = '${safeUrl}',
    target_muscles = '${targetMuscles}'
WHERE id = ${m.originalId};
`;
  }).join('\n');

  fs.writeFileSync(SQL_OUTPUT, sqlHeader + sqlStatements);
  console.log(`Saved: ${SQL_OUTPUT}`);

  // Show sample matches
  console.log('\n' + '-'.repeat(60));
  console.log('SAMPLE MATCHES');
  console.log('-'.repeat(60));
  matches.slice(0, 10).forEach(m => {
    console.log(`  ${m.originalName} → ${m.replacement.name} (${m.score.toFixed(1)})`);
  });
  if (matches.length > 10) {
    console.log(`  ... and ${matches.length - 10} more`);
  }

  // Show failures
  if (failures.length > 0) {
    console.log('\n' + '-'.repeat(60));
    console.log('FAILED TO MATCH');
    console.log('-'.repeat(60));
    failures.forEach(f => {
      console.log(`  ${f.id} | ${f.name}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('Next steps:');
  console.log('  1. Review replacement-review.csv for accuracy');
  console.log('  2. Run replace-exercises.sql in Supabase SQL Editor');
  console.log('  3. Or use: node scripts/apply-replacements.js');
  console.log('='.repeat(60));
}

main().catch(console.error);
