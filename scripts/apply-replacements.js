/**
 * Apply Exercise Replacements to Supabase
 *
 * Applies the replacement matches from replacement-matches.json to Supabase,
 * with manual overrides for exercises that got wrong auto-matches.
 *
 * Usage:
 *   node scripts/apply-replacements.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const MATCHES_FILE = path.join(__dirname, '..', 'replacement-matches.json');

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: Supabase credentials not found in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Manual overrides for exercises that got wrong auto-matches
const MANUAL_OVERRIDES = {
  // Fire Hydrant -> resistance band hip thrusts on knees
  '67': {
    name: 'resistance band hip thrusts on knees (female)',
    gifUrl: 'https://static.exercisedb.dev/media/Pjbc0Kt.gif',
    targetMuscles: ['glutes'],
  },
  // Clamshell -> resistance band seated hip abduction
  '69': {
    name: 'resistance band seated hip abduction',
    gifUrl: 'https://static.exercisedb.dev/media/0xDpB4L.gif',
    targetMuscles: ['abductors'],
  },
  // Bird Dog -> dead bug
  '21': {
    name: 'dead bug',
    gifUrl: 'https://static.exercisedb.dev/media/iny3m5y.gif',
    targetMuscles: ['abs'],
  },
  // Wall Angels -> band standing rear delt row
  '96': {
    name: 'band standing rear delt row',
    gifUrl: 'https://static.exercisedb.dev/media/tc5dYrf.gif',
    targetMuscles: ['delts'],
  },
};

// Exercises to skip (no good replacement available)
const SKIP_IDS = ['56']; // Jogging

async function main() {
  console.log('='.repeat(60));
  console.log('Apply Exercise Replacements to Supabase');
  console.log('='.repeat(60));

  // Load matches
  const data = JSON.parse(fs.readFileSync(MATCHES_FILE, 'utf8'));
  const matches = data.matches;

  console.log(`\nTotal matches: ${matches.length}`);
  console.log(`Manual overrides: ${Object.keys(MANUAL_OVERRIDES).length}`);
  console.log(`Skipping: ${SKIP_IDS.length}`);
  console.log('');

  let successCount = 0;
  let errorCount = 0;
  let skipCount = 0;

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const id = String(match.originalId);

    // Skip exercises with no good replacement
    if (SKIP_IDS.includes(id)) {
      console.log(`[${i + 1}/${matches.length}] ${match.originalName}: \x1b[33mSKIPPED\x1b[0m (no replacement)`);
      skipCount++;
      continue;
    }

    // Check for manual override
    let replacement = match.replacement;
    let isOverride = false;

    if (MANUAL_OVERRIDES[id]) {
      replacement = MANUAL_OVERRIDES[id];
      isOverride = true;
    }

    process.stdout.write(`[${i + 1}/${matches.length}] ${match.originalName}${isOverride ? ' (override)' : ''}... `);

    // Update the exercise
    const { error } = await supabase
      .from('exercises')
      .update({
        name: replacement.name,
        media_thumb: replacement.gifUrl,
        target_muscles: Array.isArray(replacement.targetMuscles)
          ? replacement.targetMuscles.join(', ')
          : replacement.targetMuscles,
      })
      .eq('id', match.originalId);

    if (error) {
      console.log(`\x1b[31mERROR: ${error.message}\x1b[0m`);
      errorCount++;
    } else {
      console.log(`\x1b[32mOK\x1b[0m -> ${replacement.name}`);
      successCount++;
    }
  }

  // Also apply manual overrides for exercises that might not be in matches list
  console.log('\n' + '-'.repeat(60));
  console.log('Applying additional manual overrides...');
  console.log('-'.repeat(60));

  for (const [id, replacement] of Object.entries(MANUAL_OVERRIDES)) {
    // Check if this ID was already processed
    const alreadyProcessed = matches.some(m => String(m.originalId) === id);
    if (alreadyProcessed) continue;

    process.stdout.write(`ID ${id} (manual override)... `);

    const { error } = await supabase
      .from('exercises')
      .update({
        name: replacement.name,
        media_thumb: replacement.gifUrl,
        target_muscles: Array.isArray(replacement.targetMuscles)
          ? replacement.targetMuscles.join(', ')
          : replacement.targetMuscles,
      })
      .eq('id', parseInt(id));

    if (error) {
      console.log(`\x1b[31mERROR: ${error.message}\x1b[0m`);
      errorCount++;
    } else {
      console.log(`\x1b[32mOK\x1b[0m -> ${replacement.name}`);
      successCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`  \x1b[32mSuccess: ${successCount}\x1b[0m`);
  console.log(`  \x1b[31mErrors:  ${errorCount}\x1b[0m`);
  console.log(`  \x1b[33mSkipped: ${skipCount}\x1b[0m`);
  console.log('');

  if (errorCount === 0) {
    console.log('All replacements applied successfully!');
  } else {
    console.log('Some updates failed. Check the errors above.');
  }
}

main().catch(console.error);
