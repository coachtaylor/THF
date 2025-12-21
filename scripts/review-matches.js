/**
 * Interactive Review Script for ExerciseDB Matches
 *
 * Allows you to approve/reject each match before generating final SQL.
 *
 * Usage:
 *   node scripts/review-matches.js
 *
 * Controls:
 *   y/Enter = Approve
 *   n = Reject
 *   s = Skip (review later)
 *   q = Quit and save progress
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const RESULTS_FILE = path.join(__dirname, '..', 'exercisedb-results.json');
const REVIEWED_FILE = path.join(__dirname, '..', 'exercisedb-reviewed.json');
const SQL_OUTPUT = path.join(__dirname, '..', 'update-media-thumbs-reviewed.sql');

// Load results
const results = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'));

// Load or initialize reviewed state
let reviewed = {
  approved: [],
  rejected: [],
  skipped: [],
};

if (fs.existsSync(REVIEWED_FILE)) {
  reviewed = JSON.parse(fs.readFileSync(REVIEWED_FILE, 'utf8'));
  console.log(`Loaded previous review: ${reviewed.approved.length} approved, ${reviewed.rejected.length} rejected`);
}

// Get IDs already reviewed
const reviewedIds = new Set([
  ...reviewed.approved.map((e) => e.id),
  ...reviewed.rejected.map((e) => e.id),
]);

// Filter to unreviewed matches
const toReview = results.matched.filter((m) => !reviewedIds.has(m.id));

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function saveProgress() {
  fs.writeFileSync(REVIEWED_FILE, JSON.stringify(reviewed, null, 2));
  console.log(`\nProgress saved to ${REVIEWED_FILE}`);
}

function generateSQL() {
  const header = `-- ExerciseDB Media Thumb Updates (Reviewed)
-- Generated: ${new Date().toISOString()}
-- Approved: ${reviewed.approved.length}
-- Rejected: ${reviewed.rejected.length}

`;

  const statements = reviewed.approved
    .map((e) => {
      const safeUrl = e.imageUrl.replace(/'/g, "''");
      return `UPDATE exercises SET media_thumb = '${safeUrl}' WHERE id = ${e.id}; -- ${e.name} -> ${e.matchedName}`;
    })
    .join('\n');

  fs.writeFileSync(SQL_OUTPUT, header + statements);
  console.log(`SQL saved to ${SQL_OUTPUT}`);
}

async function reviewMatch(match, index, total) {
  return new Promise((resolve) => {
    console.log('\n' + '='.repeat(60));
    console.log(`[${index + 1}/${total}] Exercise Review`);
    console.log('='.repeat(60));
    console.log(`  Your exercise: ${match.name} (${match.slug})`);
    console.log(`  API match:     ${match.matchedName}`);
    console.log(`  Search term:   ${match.searchTerm}`);
    console.log(`  Image URL:     ${match.imageUrl}`);
    console.log('');

    // Simple match quality indicator
    const exactMatch = match.name.toLowerCase().trim() === match.matchedName.toLowerCase().trim();
    const containsName = match.matchedName.toLowerCase().includes(match.slug.replace(/-/g, ' ').split(' ').slice(-1)[0]);

    if (exactMatch) {
      console.log('  Quality: \x1b[32m EXACT MATCH\x1b[0m');
    } else if (containsName) {
      console.log('  Quality: \x1b[33m PARTIAL MATCH\x1b[0m');
    } else {
      console.log('  Quality: \x1b[31m POOR MATCH - Review carefully!\x1b[0m');
    }

    console.log('');
    console.log('  [y/Enter] Approve  [n] Reject  [s] Skip  [q] Quit');

    rl.question('  > ', (answer) => {
      const choice = answer.toLowerCase().trim();

      if (choice === 'q') {
        resolve('quit');
      } else if (choice === 'n') {
        reviewed.rejected.push(match);
        console.log('  \x1b[31m REJECTED\x1b[0m');
        resolve('continue');
      } else if (choice === 's') {
        reviewed.skipped.push(match);
        console.log('  \x1b[33m SKIPPED\x1b[0m');
        resolve('continue');
      } else {
        // y, Enter, or anything else = approve
        reviewed.approved.push(match);
        console.log('  \x1b[32m APPROVED\x1b[0m');
        resolve('continue');
      }
    });
  });
}

async function main() {
  console.log('='.repeat(60));
  console.log('ExerciseDB Match Review');
  console.log('='.repeat(60));
  console.log(`Total matches: ${results.matched.length}`);
  console.log(`Already reviewed: ${reviewedIds.size}`);
  console.log(`To review: ${toReview.length}`);

  if (toReview.length === 0) {
    console.log('\nAll matches have been reviewed!');
    generateSQL();
    rl.close();
    return;
  }

  for (let i = 0; i < toReview.length; i++) {
    const result = await reviewMatch(toReview[i], i, toReview.length);
    if (result === 'quit') {
      break;
    }
  }

  saveProgress();
  generateSQL();

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`  Approved: ${reviewed.approved.length}`);
  console.log(`  Rejected: ${reviewed.rejected.length}`);
  console.log(`  Skipped:  ${reviewed.skipped.length}`);

  rl.close();
}

main();
