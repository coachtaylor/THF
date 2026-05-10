#!/usr/bin/env node
/**
 * Copies EAS file secrets into the project tree at build time.
 *
 * Each entry in `secrets` maps an EAS file-secret env var to a destination
 * path. EAS materializes the secret file and sets the env var to its absolute
 * path; this script copies the file to the destination expected by the bundler.
 *
 * Locally (no env var set) the script no-ops, so dev workflow is unaffected:
 * developers keep a local copy of the gitignored file as before.
 *
 * To register a secret once per project:
 *   eas secret:create --scope project --type file \
 *     --name RECOVERY_PHASES_TS --value ./src/data/recoveryPhases.ts
 */

const fs = require("fs");
const path = require("path");

const secrets = [
  { env: "RECOVERY_PHASES_TS", dest: "src/data/recoveryPhases.ts" },
];

let copied = 0;
let skipped = 0;

for (const { env, dest } of secrets) {
  const srcPath = process.env[env];
  if (!srcPath) {
    console.log(`[eas-prebuild-secrets] ${env} not set; skipping ${dest}`);
    skipped++;
    continue;
  }
  if (!fs.existsSync(srcPath)) {
    console.error(
      `[eas-prebuild-secrets] ${env} points to "${srcPath}" but file not found.`
    );
    process.exit(1);
  }
  const destAbs = path.resolve(process.cwd(), dest);
  fs.mkdirSync(path.dirname(destAbs), { recursive: true });
  fs.copyFileSync(srcPath, destAbs);
  console.log(`[eas-prebuild-secrets] copied ${env} -> ${dest}`);
  copied++;
}

console.log(
  `[eas-prebuild-secrets] done (${copied} copied, ${skipped} skipped)`
);
