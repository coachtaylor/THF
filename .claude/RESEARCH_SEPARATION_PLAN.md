# TransFitness Research Separation Plan

**Goal:** Separate proprietary research/data from saleable app code

---

## Step 1: Create New Private Repository

```bash
# On GitHub, create: transfitness-research (PRIVATE)
# Clone it somewhere separate from the app
cd ~/Projects
git clone git@github.com:coachtaylor/transfitness-research.git
```

---

## Step 2: Files to Move to Research Repo

### Research Pipeline (YOUR MOAT)

```
scripts/research_analyzer/           # Entire research analysis system
├── analyzers/                       # Article analysis logic
├── scrapers/                        # Data collection
├── validators/                      # Source validation
├── reddit_api/                      # Reddit research collection
├── outputs/                         # Output generators
├── output/*.json                    # Analysis reports
├── config.py
├── main.py
└── requirements.txt
```

### Proprietary Data Files

```
scripts/inferred_dysphoria_tags.json      # Dysphoria tagging data
scripts/exercise_classifications.json      # Safety classifications
scripts/generated_swaps.json               # Exercise swap mappings
```

### Knowledge Base Exports

```
exports/knowledge-v1/
├── exercise_trans_tips.json
├── knowledge_entries.json
├── safety_guides.json
├── rule_metadata.json
├── manifest.json
├── SCHEMA.md
└── INTEGRATION.md
```

### Trans-Specific Scripts

```
scripts/populate_dysphoria_tags.ts
scripts/apply_dysphoria_tags.ts
scripts/tag_exercises_recovery.ts
scripts/generate_exercise_swaps.ts
scripts/generate_low_impact_exercises.ts
scripts/add_rehab_articles.ts
scripts/add_immediate_exercises.ts
scripts/validate_exercise_safety.ts
scripts/migrateKnowledgeContent.ts
scripts/migrateSafetyGuides.ts
scripts/exportKnowledgeEngine.ts
```

### Embedded Knowledge (CONSIDER - may break app)

```
src/knowledge/                        # Knowledge base code
├── content/guides.ts
├── content/knowledgeBase.ts
├── rules/index.ts
└── types/index.ts

src/data/recoveryPhases.ts           # Recovery phase definitions
src/services/rulesEngine/rules/dysphoriaFiltering.ts
```

---

## Step 3: Execute the Move

```bash
# From transfitness-scaffold directory

# 1. Copy files to research repo (preserving structure)
cp -R scripts/research_analyzer ../transfitness-research/
cp -R exports/knowledge-v1 ../transfitness-research/
cp scripts/inferred_dysphoria_tags.json ../transfitness-research/data/
cp scripts/exercise_classifications.json ../transfitness-research/data/
cp scripts/generated_swaps.json ../transfitness-research/data/
cp scripts/*dysphoria*.ts ../transfitness-research/scripts/
cp scripts/*recovery*.ts ../transfitness-research/scripts/
cp scripts/*swaps*.ts ../transfitness-research/scripts/
cp scripts/migrateKnowledgeContent.ts ../transfitness-research/scripts/
cp scripts/migrateSafetyGuides.ts ../transfitness-research/scripts/
cp scripts/exportKnowledgeEngine.ts ../transfitness-research/scripts/

# 2. Commit to research repo
cd ../transfitness-research
git add .
git commit -m "Initial import of proprietary research data"
git push origin main
```

---

## Step 4: Remove from App Repo Git History

**WARNING: This rewrites git history. Backup first!**

```bash
cd ~/Downloads/transfitness-scaffold

# Backup current state
git branch backup-before-purge

# Use git-filter-repo (recommended over filter-branch)
# Install: pip install git-filter-repo

# Create file with paths to remove
cat > /tmp/paths-to-remove.txt << 'EOF'
scripts/research_analyzer/
exports/knowledge-v1/
scripts/inferred_dysphoria_tags.json
scripts/exercise_classifications.json
scripts/generated_swaps.json
scripts/populate_dysphoria_tags.ts
scripts/apply_dysphoria_tags.ts
scripts/tag_exercises_recovery.ts
scripts/generate_exercise_swaps.ts
scripts/generate_low_impact_exercises.ts
scripts/add_rehab_articles.ts
scripts/add_immediate_exercises.ts
scripts/validate_exercise_safety.ts
scripts/migrateKnowledgeContent.ts
scripts/migrateSafetyGuides.ts
scripts/exportKnowledgeEngine.ts
EOF

# Remove from all history
git filter-repo --invert-paths --paths-from-file /tmp/paths-to-remove.txt

# Force push (DESTRUCTIVE - make sure you have backup!)
git push origin --force --all
```

---

## Step 5: Add to .gitignore

```bash
cat >> .gitignore << 'EOF'

# Proprietary Research (keep local, never commit)
scripts/research_analyzer/
scripts/*dysphoria*.ts
scripts/*dysphoria*.json
scripts/*recovery*.ts
scripts/*swaps*.ts
scripts/*swaps*.json
scripts/*classifications*.json
scripts/migrateKnowledgeContent.ts
scripts/migrateSafetyGuides.ts
scripts/exportKnowledgeEngine.ts
exports/knowledge-v1/
EOF
```

---

## Step 6: What Stays in App Repo

### Keep (Generic Engine Code)

```
src/services/rulesEngine/           # The ENGINE (applies rules from DB)
├── evaluator.ts                    # Rule evaluation logic
├── postOperative.ts                # Post-op rule definitions
└── rules/
    ├── types.ts                    # Type definitions
    ├── bindingSafety.ts            # Binding rules (generic)
    └── hrtAdjustment.ts            # HRT rules (generic)
```

### Keep (App Infrastructure)

```
scripts/migrations/                  # DB schema (no data)
scripts/exercisedb_seed.py          # Generic exercise import
scripts/check_exercises.ts          # Utility scripts
scripts/testWorkoutGeneration.ts    # Testing
```

---

## Decision: src/knowledge/ Directory

**Option A: Move to research repo**

- Pros: Maximum protection
- Cons: App needs refactoring to fetch from API/DB

**Option B: Keep in app but genericize**

- Replace specific content with placeholders
- Actual content comes from Supabase

**Recommendation:** Keep the TYPE definitions and STRUCTURE in app,
move the actual CONTENT (guides.ts, knowledgeBase.ts) to research repo.

---

## Post-Separation Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    transfitness-app                          │
│  (Saleable - contains app code, UI, generic engines)        │
│                                                              │
│  src/services/rulesEngine/  ─────► Applies rules            │
│  src/services/workoutGeneration/ ─► Generates workouts      │
│                    │                                         │
│                    │ fetches data from                       │
│                    ▼                                         │
│            ┌──────────────┐                                  │
│            │   Supabase   │ ◄──── Your data lives here      │
│            │   Database   │       (exercises, rules, etc)   │
│            └──────────────┘                                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│               transfitness-research                          │
│  (NEVER SOLD - your competitive moat)                       │
│                                                              │
│  research_analyzer/  ─────► Generates insights              │
│  knowledge exports/  ─────► Source of truth                 │
│  dysphoria tags/     ─────► Trans-specific mappings        │
│                    │                                         │
│                    │ populates                               │
│                    ▼                                         │
│            ┌──────────────┐                                  │
│            │   Supabase   │                                  │
│            │   Database   │                                  │
│            └──────────────┘                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Licensing Model (Future)

When you sell the app:

- Buyer gets: App code + Supabase structure + basic exercises
- Buyer needs: License to your research data OR bring their own
- You retain: Research repo, ability to license to multiple buyers

---

## Verification Checklist

After separation:

- [ ] App still builds: `npm run build`
- [ ] App still works: `npx expo start`
- [ ] Research repo has all proprietary files
- [ ] App repo git history clean: `git log --all --oneline | grep -i dysphoria` (should be empty)
- [ ] .gitignore prevents future commits

---

## Commands Summary

```bash
# 1. Create research repo on GitHub (manual)

# 2. Copy files
./scripts/separate-research.sh  # We can create this

# 3. Purge from app history
git filter-repo --invert-paths --paths-from-file /tmp/paths-to-remove.txt

# 4. Force push
git push origin --force --all

# 5. Verify
git log --all --oneline --name-only | grep -E "(dysphoria|research_analyzer|knowledge-v1)"
```
