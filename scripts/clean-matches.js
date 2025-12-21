/**
 * Clean ExerciseDB Matches
 *
 * Removes obviously wrong matches and generates cleaned SQL.
 *
 * Usage:
 *   node scripts/clean-matches.js
 */

const fs = require('fs');
const path = require('path');

const RESULTS_FILE = path.join(__dirname, '..', 'exercisedb-results.json');
const CLEANED_FILE = path.join(__dirname, '..', 'exercisedb-cleaned.json');
const SQL_OUTPUT = path.join(__dirname, '..', 'update-media-thumbs-cleaned.sql');
const REJECTED_CSV = path.join(__dirname, '..', 'exercisedb-rejected.csv');

// Load results
const results = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'));

// Define bad matches to reject (exerciseId -> reason)
// These are matches where the API returned completely wrong exercises
const BAD_MATCHES = {
  // Glute bridges matched to thoracic bridge (wrong exercise)
  3: 'Glute Bridge matched to Thoracic Bridge',
  4: 'Single-Leg Glute Bridge matched to Single Leg Deadlift',
  49: 'Band Glute Bridge matched to Thoracic Bridge',
  97: 'Bridge March matched to Thoracic Bridge',

  // Bird dog matched to downward dog (wrong exercise)
  21: 'Bird Dog matched to Downward Facing Dog',

  // Side plank matched to side lunge (completely different)
  19: 'Side Plank matched to Side Lunge',

  // Bicycle crunch matched to floor crunch (different variation)
  23: 'Bicycle Crunch matched to Crunch Floor',

  // RDL matched to burpee or calf raise (completely wrong)
  25: 'Dumbbell RDL matched to Dumbbell Burpee',
  29: 'Dumbbell Single-Leg RDL matched to Calf Raise',

  // Bicep curl matched to jumping squat (completely wrong)
  37: 'Dumbbell Bicep Curl matched to Jumping Squat',
  47: 'Barbell Bicep Curl matched to Hammer Curl',

  // Tricep extension matched to neck extension (wrong)
  39: 'Overhead Tricep Extension matched to Neck Extension',

  // Back squat matched to jumping squat (different exercise)
  40: 'Barbell Back Squat matched to Dumbbell Jumping Squat',

  // Overhead press matched to bench press (wrong)
  45: 'Barbell Overhead Press matched to Bench Press',

  // Band exercises with wrong matches
  50: 'Band Lateral Walk matched to Lateral Raise',
  52: 'Band Pull-Apart matched to Pull-up',
  122: 'Band Face Pull matched to Pull-up',
  127: 'Band Leg Press matched to Diamond Press',

  // Walking matched to walking lunge (different)
  55: 'Walking matched to Walking Lunge',

  // Stretches with wrong matches
  61: "Child's Pose matched to Butterfly Yoga Pose",
  62: 'Hip Flexor Stretch matched to Elbow Flexor Stretch',
  64: 'Doorway Chest Stretch matched to Peroneals Stretch',
  65: '90/90 Hip Stretch matched to Back Pec Stretch',
  66: 'Thoracic Spine Rotation matched to Thoracic Bridge',

  // Donkey kick matched to donkey calf raise (different)
  68: 'Donkey Kick matched to Donkey Calf Raise',

  // Scapular push-up matched to clap push-up (different)
  70: 'Scapular Push-Up matched to Clap Push Up',

  // Kettlebell exercises with wrong matches
  79: 'Kettlebell Turkish Get-Up matched to Diamond Push up',
  81: 'Kettlebell Press matched to Triceps Press',
  82: 'Kettlebell Row matched to Suspended Row',

  // Hollow body hold matched to lying leg raise (different)
  93: 'Hollow Body Hold matched to Lying Leg Raise',

  // Chest fly matched to rear delt fly (opposite!)
  98: 'Dumbbell Chest Fly matched to Rear Delt Fly',

  // Tricep kickback matched to jumping squat (completely wrong)
  103: 'Dumbbell Tricep Kickback matched to Jumping Squat',

  // Hip thrust matched to jumping squat (completely wrong)
  105: 'Dumbbell Hip Thrust matched to Jumping Squat',

  // Floor press matched to clean and press (different)
  107: 'Dumbbell Floor Press matched to Clean and Press',

  // Landmine press matched to bench press (different)
  117: 'Barbell Landmine Press matched to Bench Press',

  // Band squat with abduction matched to pistol squat (different)
  118: 'Band Squat with Abduction matched to Single Leg Squat',

  // Upright row matched to suspended row (different grip/movement)
  124: 'Band Upright Row matched to Suspended Row',

  // Rowing machine matched to elliptical (completely different)
  132: 'Rowing Machine matched to Elliptical Machine',

  // Sled push matched to clap push-up (completely wrong)
  136: 'Sled Push matched to Clap Push Up',
};

// Categorize matches
const approved = [];
const rejected = [];

for (const match of results.matched) {
  if (BAD_MATCHES[match.id]) {
    rejected.push({
      ...match,
      rejectionReason: BAD_MATCHES[match.id],
    });
  } else {
    approved.push(match);
  }
}

// Save cleaned results
const cleaned = {
  generatedAt: new Date().toISOString(),
  stats: {
    originalTotal: results.matched.length,
    approved: approved.length,
    rejected: rejected.length,
    notFoundFromOriginal: results.notFound.length,
  },
  approved,
  rejected,
};

fs.writeFileSync(CLEANED_FILE, JSON.stringify(cleaned, null, 2));
console.log(`Cleaned results saved to: ${CLEANED_FILE}`);

// Generate SQL for approved matches only
const sqlHeader = `-- ExerciseDB Media Thumb Updates (Cleaned)
-- Generated: ${new Date().toISOString()}
-- Approved: ${approved.length}
-- Rejected: ${rejected.length} (see exercisedb-rejected.csv for details)
-- Original not found: ${results.notFound.length}

`;

const sqlStatements = approved
  .map((e) => {
    const safeUrl = e.imageUrl.replace(/'/g, "''");
    return `UPDATE exercises SET media_thumb = '${safeUrl}' WHERE id = ${e.id}; -- ${e.name} -> ${e.matchedName}`;
  })
  .join('\n');

fs.writeFileSync(SQL_OUTPUT, sqlHeader + sqlStatements);
console.log(`SQL updates saved to: ${SQL_OUTPUT}`);

// Generate rejected CSV for manual review
const csvHeader = 'id,slug,name,matchedName,imageUrl,rejectionReason\n';
const csvRows = rejected
  .map((e) => {
    return `${e.id},"${e.slug}","${e.name}","${e.matchedName}","${e.imageUrl}","${e.rejectionReason}"`;
  })
  .join('\n');

fs.writeFileSync(REJECTED_CSV, csvHeader + csvRows);
console.log(`Rejected matches saved to: ${REJECTED_CSV}`);

// Summary
console.log('\n' + '='.repeat(60));
console.log('CLEANING SUMMARY');
console.log('='.repeat(60));
console.log(`  Original matches:     ${results.matched.length}`);
console.log(`  \x1b[32mApproved (good):      ${approved.length}\x1b[0m`);
console.log(`  \x1b[31mRejected (bad):       ${rejected.length}\x1b[0m`);
console.log(`  Original not found:   ${results.notFound.length}`);
console.log('');
console.log('Good matches include:');
approved.slice(0, 10).forEach((m) => {
  console.log(`  - ${m.name} -> ${m.matchedName}`);
});
if (approved.length > 10) {
  console.log(`  ... and ${approved.length - 10} more`);
}
console.log('');
console.log('Next steps:');
console.log('  1. Review exercisedb-rejected.csv for exercises needing manual GIF search');
console.log('  2. Run: psql or Supabase SQL Editor with update-media-thumbs-cleaned.sql');
console.log('  3. Or use node scripts/review-matches.js for interactive review');
