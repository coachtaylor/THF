/**
 * Apply Media Thumb Updates to Supabase
 *
 * Reads the cleaned SQL and applies updates directly to Supabase.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const CLEANED_FILE = path.join(__dirname, '..', 'exercisedb-cleaned.json');

// Use service role key if available, otherwise anon key
const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: Supabase credentials not found in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('='.repeat(60));
  console.log('Applying Media Thumb Updates to Supabase');
  console.log('='.repeat(60));

  // Load cleaned results
  const cleaned = JSON.parse(fs.readFileSync(CLEANED_FILE, 'utf8'));
  const { approved } = cleaned;

  console.log(`\nUpdates to apply: ${approved.length}`);
  console.log('');

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < approved.length; i++) {
    const exercise = approved[i];
    process.stdout.write(`[${i + 1}/${approved.length}] Updating id=${exercise.id} (${exercise.slug})... `);

    const { error } = await supabase
      .from('exercises')
      .update({ media_thumb: exercise.imageUrl })
      .eq('id', exercise.id);

    if (error) {
      console.log(`\x1b[31mERROR: ${error.message}\x1b[0m`);
      errorCount++;
    } else {
      console.log(`\x1b[32mOK\x1b[0m`);
      successCount++;
    }
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`  \x1b[32mSuccess: ${successCount}\x1b[0m`);
  console.log(`  \x1b[31mErrors:  ${errorCount}\x1b[0m`);
  console.log('');

  if (errorCount === 0) {
    console.log('All updates applied successfully!');
  } else {
    console.log('Some updates failed. Check the errors above.');
  }
}

main().catch(console.error);
