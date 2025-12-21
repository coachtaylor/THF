/**
 * ExerciseDB Seeding Script
 *
 * Fetches GIF URLs from ExerciseDB API for exercises missing media_thumb.
 *
 * Usage:
 *   1. Add EXERCISEDB_KEY to .env file
 *   2. Run: node scripts/seed-exercisedb.js
 *
 * Outputs:
 *   - exercisedb-results.json: Matched exercises with GIF URLs
 *   - exercisedb-not-found.csv: Exercises needing manual review
 *   - update-media-thumbs.sql: SQL UPDATE statements for Supabase
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Configuration
const API_KEY = process.env.EXERCISEDB_KEY || process.env.RAPIDAPI_KEY;
const API_HOST = 'exercisedb-api1.p.rapidapi.com';
const DELAY_MS = 2000; // 2 seconds between requests
const CSV_PATH = path.join(__dirname, '..', 'exercises_rows (17).csv');
const MAX_RETRIES = 3;

// Output paths
const RESULTS_JSON = path.join(__dirname, '..', 'exercisedb-results.json');
const NOT_FOUND_CSV = path.join(__dirname, '..', 'exercisedb-not-found.csv');
const SQL_OUTPUT = path.join(__dirname, '..', 'update-media-thumbs.sql');

// Common abbreviation mappings
const ABBREVIATIONS = {
  'rdl': 'romanian deadlift',
  'db': 'dumbbell',
  'bb': 'barbell',
  'kb': 'kettlebell',
  'ohp': 'overhead press',
};

/**
 * Generate search term variations for an exercise slug
 */
function getSearchVariations(slug, name) {
  const variations = [];

  // 1. Slug with hyphens replaced by spaces
  const baseFromSlug = slug.replace(/-/g, ' ');
  variations.push(baseFromSlug);

  // 2. Use the display name (lowercase)
  const baseName = name.toLowerCase();
  if (baseName !== baseFromSlug) {
    variations.push(baseName);
  }

  // 3. Remove common prefixes
  const prefixes = ['dumbbell ', 'barbell ', 'kettlebell ', 'band ', 'cable '];
  for (const prefix of prefixes) {
    if (baseFromSlug.startsWith(prefix)) {
      variations.push(baseFromSlug.slice(prefix.length));
    }
  }

  // 4. Remove common suffixes
  const suffixes = [' assisted', ' single leg', ' single arm', ' bodyweight'];
  for (const suffix of suffixes) {
    if (baseFromSlug.endsWith(suffix)) {
      variations.push(baseFromSlug.slice(0, -suffix.length));
    }
  }

  // 5. Handle "assisted" differently - try "assisted X" format
  if (baseFromSlug.includes(' assisted')) {
    const withoutAssisted = baseFromSlug.replace(' assisted', '');
    variations.push(`assisted ${withoutAssisted}`);
    variations.push(withoutAssisted);
  }

  // 6. Expand abbreviations
  for (const [abbr, full] of Object.entries(ABBREVIATIONS)) {
    if (baseFromSlug.includes(abbr)) {
      variations.push(baseFromSlug.replace(abbr, full));
    }
  }

  // 7. Try just the core exercise name (last word often)
  const words = baseFromSlug.split(' ');
  if (words.length > 1) {
    // Try last word (e.g., "squat" from "goblet squat")
    variations.push(words[words.length - 1]);
    // Try last two words
    if (words.length > 2) {
      variations.push(words.slice(-2).join(' '));
    }
  }

  // 8. Handle specific patterns
  if (baseFromSlug.includes('glute bridge')) {
    variations.push('bridge');
    variations.push('glute bridge');
  }
  if (baseFromSlug.includes('calf raise')) {
    variations.push('calf raise');
    variations.push('standing calf raise');
  }
  if (baseFromSlug.includes('push up') || baseFromSlug.includes('pushup')) {
    variations.push('push up');
    variations.push('push-up');
  }
  if (baseFromSlug.includes('pull up') || baseFromSlug.includes('pullup')) {
    variations.push('pull up');
    variations.push('pull-up');
  }

  // Remove duplicates while preserving order
  return [...new Set(variations)];
}

/**
 * Calculate similarity between two strings (word overlap with exact match bonus)
 */
function calculateSimilarity(str1, str2) {
  const words1 = str1.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const words2 = str2.toLowerCase().split(/\s+/).filter(w => w.length > 0);

  // Check for exact match first
  if (str1.toLowerCase().trim() === str2.toLowerCase().trim()) {
    return 1.0;
  }

  let matches = 0;
  for (const word of words1) {
    if (words2.includes(word)) matches++;
  }

  const baseScore = matches / Math.max(words1.length, words2.length);

  // Bonus for containing the complete search term
  if (str2.toLowerCase().includes(str1.toLowerCase()) ||
      str1.toLowerCase().includes(str2.toLowerCase())) {
    return Math.min(baseScore + 0.3, 1.0);
  }

  return baseScore;
}

/**
 * Find best matching exercise from API results
 * Note: This API returns { exerciseId, name, imageUrl } structure
 */
function findBestMatch(results, searchTerm, originalSlug) {
  if (!results || results.length === 0) return null;

  // First, try exact match on name
  for (const exercise of results) {
    if (exercise.name.toLowerCase().trim() === searchTerm.toLowerCase().trim()) {
      return exercise;
    }
  }

  // Score each result based on similarity
  let bestMatch = null;
  let bestScore = 0;

  const originalTerms = originalSlug.replace(/-/g, ' ').toLowerCase();

  for (const exercise of results) {
    const name = exercise.name.toLowerCase().trim();

    // Calculate similarity with both search term and original slug
    const scoreWithSearch = calculateSimilarity(name, searchTerm);
    const scoreWithOriginal = calculateSimilarity(name, originalTerms);
    let score = Math.max(scoreWithSearch, scoreWithOriginal);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = exercise;
    }
  }

  // Only return if we have a reasonable match (at least 30% overlap)
  return bestScore >= 0.3 ? bestMatch : null;
}

/**
 * Delay helper
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Search ExerciseDB API for an exercise
 */
async function searchExerciseDB(searchTerm, retryCount = 0) {
  const encodedTerm = encodeURIComponent(searchTerm);
  const url = `https://exercisedb-api1.p.rapidapi.com/api/v1/exercises/search?search=${encodedTerm}&limit=10`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': API_HOST,
      },
    });

    if (response.status === 429) {
      // Rate limited - wait and retry
      console.log('    Rate limited, waiting 60 seconds...');
      await delay(60000);
      if (retryCount < MAX_RETRIES) {
        return searchExerciseDB(searchTerm, retryCount + 1);
      }
      return null;
    }

    if (!response.ok) {
      console.log(`    API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const json = await response.json();
    // Handle the { success, data } structure
    if (json.success && Array.isArray(json.data)) {
      return json.data;
    }
    // Fallback if API returns array directly
    if (Array.isArray(json)) {
      return json;
    }
    return [];
  } catch (error) {
    console.log(`    Network error: ${error.message}`);
    if (retryCount < MAX_RETRIES) {
      await delay(5000);
      return searchExerciseDB(searchTerm, retryCount + 1);
    }
    return null;
  }
}

/**
 * Search for an exercise, trying multiple variations
 */
async function findExercise(exercise) {
  const variations = getSearchVariations(exercise.slug, exercise.name);
  const triedTerms = [];

  for (const searchTerm of variations) {
    triedTerms.push(searchTerm);

    const results = await searchExerciseDB(searchTerm);

    if (results && results.length > 0) {
      const bestMatch = findBestMatch(results, searchTerm, exercise.slug);
      if (bestMatch) {
        return {
          found: true,
          searchTerm,
          match: bestMatch,
          triedTerms,
        };
      }
    }

    // Wait between API calls
    await delay(DELAY_MS);
  }

  return {
    found: false,
    triedTerms,
  };
}

/**
 * Read exercises from CSV
 */
function readExercisesFromCSV() {
  return new Promise((resolve, reject) => {
    const exercises = [];

    fs.createReadStream(CSV_PATH)
      .pipe(csv())
      .on('data', (row) => {
        exercises.push({
          id: parseInt(row.id, 10),
          slug: row.slug,
          name: row.name,
          media_thumb: row.media_thumb || '',
        });
      })
      .on('end', () => resolve(exercises))
      .on('error', reject);
  });
}

/**
 * Write results to JSON file
 */
function writeResultsJSON(matched, notFound, stats) {
  const output = {
    generatedAt: new Date().toISOString(),
    stats,
    matched,
    notFound: notFound.map(e => ({
      id: e.id,
      slug: e.slug,
      name: e.name,
      triedTerms: e.triedTerms,
    })),
  };

  fs.writeFileSync(RESULTS_JSON, JSON.stringify(output, null, 2));
  console.log(`\nResults saved to: ${RESULTS_JSON}`);
}

/**
 * Write not-found exercises to CSV
 */
function writeNotFoundCSV(notFound) {
  const header = 'id,slug,name,tried_terms\n';
  const rows = notFound.map(e => {
    const triedTerms = e.triedTerms.join(';');
    return `${e.id},"${e.slug}","${e.name}","${triedTerms}"`;
  }).join('\n');

  fs.writeFileSync(NOT_FOUND_CSV, header + rows);
  console.log(`Not found exercises saved to: ${NOT_FOUND_CSV}`);
}

/**
 * Write SQL UPDATE statements
 */
function writeSQLOutput(matched) {
  const header = `-- ExerciseDB Media Thumb Updates
-- Generated: ${new Date().toISOString()}
-- Run against Supabase: exercises table
-- Total updates: ${matched.length}

`;

  const statements = matched.map(e => {
    // Escape single quotes in URL (shouldn't happen but be safe)
    const safeUrl = e.imageUrl.replace(/'/g, "''");
    return `UPDATE exercises SET media_thumb = '${safeUrl}' WHERE id = ${e.id};`;
  }).join('\n');

  fs.writeFileSync(SQL_OUTPUT, header + statements);
  console.log(`SQL updates saved to: ${SQL_OUTPUT}`);
}

/**
 * Main execution
 */
async function main() {
  console.log('='.repeat(60));
  console.log('ExerciseDB Seeding Script');
  console.log('='.repeat(60));

  // Validate API key
  if (!API_KEY || API_KEY.trim() === '') {
    console.error('\nERROR: API key not found in .env file');
    console.error('Please add: EXERCISEDB_KEY=your_rapidapi_key');
    console.error('(or RAPIDAPI_KEY if you prefer)');
    process.exit(1);
  }

  // Check CSV exists
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`\nERROR: CSV file not found: ${CSV_PATH}`);
    process.exit(1);
  }

  console.log(`\nReading exercises from: ${CSV_PATH}`);

  // Read all exercises
  const allExercises = await readExercisesFromCSV();
  console.log(`Total exercises in CSV: ${allExercises.length}`);

  // Filter to those missing media_thumb
  const missingThumb = allExercises.filter(e => !e.media_thumb || e.media_thumb.trim() === '');
  console.log(`Exercises missing media_thumb: ${missingThumb.length}`);

  if (missingThumb.length === 0) {
    console.log('\nAll exercises already have media_thumb! Nothing to do.');
    return;
  }

  console.log(`\nStarting search (${DELAY_MS/1000}s delay between requests)...`);
  console.log('-'.repeat(60));

  const matched = [];
  const notFound = [];

  for (let i = 0; i < missingThumb.length; i++) {
    const exercise = missingThumb[i];
    const progress = `[${i + 1}/${missingThumb.length}]`;

    process.stdout.write(`${progress} Searching: "${exercise.slug}"... `);

    const result = await findExercise(exercise);

    if (result.found) {
      console.log(`\x1b[32m OK\x1b[0m -> ${result.match.name}`);
      matched.push({
        id: exercise.id,
        slug: exercise.slug,
        name: exercise.name,
        searchTerm: result.searchTerm,
        imageUrl: result.match.imageUrl,  // This API uses imageUrl (PNG)
        exerciseId: result.match.exerciseId,
        matchedName: result.match.name,
      });
    } else {
      console.log(`\x1b[31m Not found\x1b[0m`);
      notFound.push({
        ...exercise,
        triedTerms: result.triedTerms,
      });
    }
  }

  // Summary
  console.log('-'.repeat(60));
  console.log('\nSUMMARY');
  console.log(`  Total processed: ${missingThumb.length}`);
  console.log(`  \x1b[32mFound: ${matched.length}\x1b[0m`);
  console.log(`  \x1b[31mNot found: ${notFound.length}\x1b[0m`);

  const stats = {
    total: missingThumb.length,
    found: matched.length,
    notFound: notFound.length,
    successRate: `${((matched.length / missingThumb.length) * 100).toFixed(1)}%`,
  };

  // Write outputs
  writeResultsJSON(matched, notFound, stats);

  if (notFound.length > 0) {
    writeNotFoundCSV(notFound);
  }

  if (matched.length > 0) {
    writeSQLOutput(matched);
    console.log(`\nTo apply updates, run the SQL in Supabase SQL Editor.`);
  }

  console.log('\nDone!');
}

// Run
main().catch(console.error);
