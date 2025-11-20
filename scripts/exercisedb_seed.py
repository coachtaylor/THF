import csv, json, re, os, time, sys
from pathlib import Path
from urllib.parse import quote
from datetime import datetime
import shutil
import requests

# Try to load .env file if python-dotenv is available
try:
    from dotenv import load_dotenv
    # Load .env from project root (two levels up from scripts/)
    env_path = Path(__file__).parent.parent / ".env"
    if env_path.exists():
        load_dotenv(env_path)
        print(f"✓ Loaded .env file from: {env_path}")
    else:
        print(f"⚠ .env file not found at: {env_path}")
except ImportError:
    pass  # python-dotenv not installed, skip

# ---- Config
RAPID_KEY = os.getenv("RAPIDAPI_KEY", "").strip()  # set this in your shell or .env file (strip whitespace)
BASE = "https://exercisedb-api1.p.rapidapi.com"  # Updated API base URL

if not RAPID_KEY:
    print("ERROR: RAPIDAPI_KEY environment variable is not set.")
    print("Please set it in one of the following ways:")
    print("  1. Add RAPIDAPI_KEY=your_key_here to your .env file in the project root")
    print("  2. Export it in your shell: export RAPIDAPI_KEY=your_key_here")
    print("  3. Run with inline: RAPIDAPI_KEY=your_key_here python3 exercisedb_seed.py")
    sys.exit(1)

# Debug: Show first/last few chars of key (for verification, not full key for security)
key_preview = RAPID_KEY[:8] + "..." + RAPID_KEY[-4:] if len(RAPID_KEY) > 12 else "***"
print(f"✓ Using RAPIDAPI_KEY: {key_preview} (length: {len(RAPID_KEY)})")

HEADERS = {
    "x-rapidapi-key": RAPID_KEY,
    "x-rapidapi-host": "exercisedb-api1.p.rapidapi.com",  # Updated host
}

OUT = Path("exercisedb_staging_export")
OUT.mkdir(exist_ok=True)

def slugify(s: str) -> str:
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')[:64]

# Map ExerciseDB equipment → your tokens
def norm_equipment(equip_str: str):
    n = (equip_str or "").strip().lower()
    if n in ("body weight","bodyweight"): return ["bodyweight"]
    if "dumbbell" in n: return ["db"]
    if "kettlebell" in n: return ["kb"]
    if "barbell" in n or "smith" in n or "trap bar" in n or "ez bar" in n: return ["barbell"]
    if "band" in n or "resistance band" in n: return ["band"]
    if "bench" in n: return ["bench"]
    if "step" in n or "box" in n: return ["step"]
    if "cable" in n: return ["cable"]
    if "machine" in n or "leverage" in n: return ["machine"]
    if "bike" in n or "ergometer" in n: return ["bike"]
    if "tread" in n: return ["treadmill"]
    if "sled" in n: return ["sled"]
    # catch-alls
    if n in ("assisted","roller","rope","medicine ball","bosu ball","hammer","wheel roller"):
        return ["bodyweight"]  # treat as accessory/bodyweight for now
    return ["bodyweight"]

def get_equipment_types():
    """Fetch all available equipment types from the API"""
    url = f"{BASE}/api/v1/equipments"
    print(f"Fetching equipment types from: {url}")
    
    try:
        r = requests.get(url, headers=HEADERS, timeout=60)
        r.raise_for_status()
        
        data = r.json()
        # Handle different response formats
        if isinstance(data, list):
            equipment_list = data
        elif isinstance(data, dict) and "data" in data:
            equipment_list = data["data"]
        elif isinstance(data, dict) and "results" in data:
            equipment_list = data["results"]
        elif isinstance(data, dict) and "equipments" in data:
            equipment_list = data["equipments"]
        else:
            equipment_list = [data] if data else []
        
        # Extract equipment names/IDs
        equipment_names = []
        for eq in equipment_list:
            if isinstance(eq, str):
                equipment_names.append(eq)
            elif isinstance(eq, dict):
                # Try common field names
                name = eq.get("name") or eq.get("id") or eq.get("equipment") or str(eq)
                equipment_names.append(name)
        
        print(f"✓ Found {len(equipment_names)} equipment types: {', '.join(equipment_names[:10])}{'...' if len(equipment_names) > 10 else ''}")
        return equipment_names
        
    except Exception as e:
        print(f"❌ Error fetching equipment types: {e}")
        # Fallback to common equipment types if API fails
        print("  → Using fallback equipment list")
        return ["bodyweight", "dumbbell", "barbell", "cable", "machine", "kettlebell", "band", "bench"]

def parse_exercise_response(data):
    """Parse API response and extract exercise list"""
    if isinstance(data, list):
        return data
    elif isinstance(data, dict):
        # Try common response wrapper keys
        if "data" in data:
            return data["data"]
        elif "results" in data:
            return data["results"]
        elif "exercises" in data:
            return data["exercises"]
        elif "items" in data:
            return data["items"]
        # If it's a single exercise object, wrap it
        elif "exerciseId" in data or "id" in data:
            return [data]
    return []

def get_all_exercises():
    """
    Use diverse search strategies to get comprehensive exercise coverage across
    all equipment types, body parts, and exercise types.
    """
    all_exercises = []
    seen_ids = set()  # To avoid duplicates
    
    # Strategy: Use diverse searches targeting different dimensions
    # Mix of equipment, body parts, exercise types, and broad terms
    search_strategies = [
        # First, try to get all without filters (if API supports it)
        {"params": {"limit": 2000}, "desc": "All exercises (no filter)"},
        {"params": {"limit": 5000}, "desc": "All exercises (high limit)"},
        
        # Exercise type searches
        {"params": {"keywords": "strength", "limit": 1000}, "desc": "Strength exercises"},
        {"params": {"keywords": "cardio", "limit": 500}, "desc": "Cardio exercises"},
        {"params": {"keywords": "stretch,flexibility", "limit": 500}, "desc": "Stretching"},
        {"params": {"keywords": "plyometric", "limit": 300}, "desc": "Plyometric"},
        
        # Equipment-specific (critical for variety)
        {"params": {"keywords": "dumbbell", "limit": 1000}, "desc": "Dumbbell exercises"},
        {"params": {"keywords": "barbell", "limit": 1000}, "desc": "Barbell exercises"},
        {"params": {"keywords": "cable", "limit": 500}, "desc": "Cable exercises"},
        {"params": {"keywords": "machine", "limit": 500}, "desc": "Machine exercises"},
        {"params": {"keywords": "kettlebell", "limit": 500}, "desc": "Kettlebell"},
        {"params": {"keywords": "resistance band,band", "limit": 500}, "desc": "Resistance bands"},
        {"params": {"keywords": "bodyweight", "limit": 500}, "desc": "Bodyweight"},
        {"params": {"keywords": "smith machine", "limit": 300}, "desc": "Smith machine"},
        {"params": {"keywords": "medicine ball", "limit": 300}, "desc": "Medicine ball"},
        
        # Body part specific
        {"params": {"keywords": "chest", "limit": 500}, "desc": "Chest exercises"},
        {"params": {"keywords": "shoulders", "limit": 500}, "desc": "Shoulder exercises"},
        {"params": {"keywords": "back", "limit": 500}, "desc": "Back exercises"},
        {"params": {"keywords": "arms,biceps,triceps", "limit": 500}, "desc": "Arm exercises"},
        {"params": {"keywords": "legs,quads,hamstrings", "limit": 500}, "desc": "Leg exercises"},
        {"params": {"keywords": "glutes", "limit": 500}, "desc": "Glute exercises"},
        {"params": {"keywords": "core,abs", "limit": 500}, "desc": "Core exercises"},
        {"params": {"keywords": "calves", "limit": 300}, "desc": "Calf exercises"},
        
        # Compound movements
        {"params": {"keywords": "squat", "limit": 500}, "desc": "Squat variations"},
        {"params": {"keywords": "deadlift", "limit": 500}, "desc": "Deadlift variations"},
        {"params": {"keywords": "press", "limit": 500}, "desc": "Press movements"},
        {"params": {"keywords": "row", "limit": 500}, "desc": "Row movements"},
        {"params": {"keywords": "pull", "limit": 500}, "desc": "Pull movements"},
        {"params": {"keywords": "push", "limit": 500}, "desc": "Push movements"},
        
        # Broad catch-alls
        {"params": {"keywords": "exercise", "limit": 1000}, "desc": "Broad 'exercise'"},
        {"params": {"keywords": "workout", "limit": 1000}, "desc": "Workout"},
    ]
    
    print(f"Fetching exercises using {len(search_strategies)} diverse search strategies...\n")
    
    for i, strategy in enumerate(search_strategies, 1):
        params = strategy["params"]
        desc = strategy["desc"]
        
        # Build description showing what we're searching for
        search_desc = ", ".join([f"{k}={v}" for k, v in params.items() if k != "limit"])
        if not search_desc:
            search_desc = "no filters"
        
        print(f"[{i}/{len(search_strategies)}] {desc} ({search_desc})")
        
        url = f"{BASE}/api/v1/exercises"
        
        try:
            r = requests.get(url, headers=HEADERS, params=params, timeout=60)
            
            if r.status_code == 200:
                data = r.json()
                exercises = parse_exercise_response(data)
                
                # Add unique exercises by exerciseId (the API's ID field)
                new_count = 0
                for ex in exercises:
                    # Try different ID field names
                    ex_id = ex.get("exerciseId") or ex.get("id") or ex.get("_id") or str(ex)
                    if ex_id not in seen_ids:
                        seen_ids.add(ex_id)
                        all_exercises.append(ex)
                        new_count += 1
                
                # Show equipment variety in this batch
                equipments_in_batch = set()
                for ex in exercises:
                    eq_list = ex.get("equipments") or ex.get("equipment") or []
                    if isinstance(eq_list, list):
                        equipments_in_batch.update([str(e).upper() for e in eq_list])
                    elif isinstance(eq_list, str):
                        equipments_in_batch.add(eq_list.upper())
                
                equip_str = ", ".join(sorted(list(equipments_in_batch))[:5])
                if len(equipments_in_batch) > 5:
                    equip_str += f" (+{len(equipments_in_batch)-5} more)"
                
                print(f"  ✓ Got {len(exercises)} exercises ({new_count} new, total: {len(all_exercises)})")
                if equipments_in_batch:
                    print(f"     Equipment types: {equip_str}")
                
            elif r.status_code == 404:
                print(f"  ⚠ Endpoint not found")
            else:
                print(f"  ❌ {r.status_code}: {r.reason}")
                if r.status_code in [403, 400]:
                    try:
                        error_body = r.json()
                        print(f"     Error: {error_body}")
                    except:
                        print(f"     Error text: {r.text[:200]}")
            
            time.sleep(0.3)  # Be polite with rate limits
            
        except Exception as e:
            print(f"  ❌ Error: {e}")
            continue
    
    # Show summary of equipment variety
    if all_exercises:
        all_equipments = set()
        all_body_parts = set()
        all_exercise_types = set()
        
        for ex in all_exercises:
            # Collect equipment types
            eq_list = ex.get("equipments") or ex.get("equipment") or []
            if isinstance(eq_list, list):
                all_equipments.update([str(e).upper() for e in eq_list if e])
            elif isinstance(eq_list, str) and eq_list:
                all_equipments.add(eq_list.upper())
            
            # Collect body parts
            bp_list = ex.get("bodyParts") or ex.get("bodyParts") or []
            if isinstance(bp_list, list):
                all_body_parts.update([str(bp).upper() for bp in bp_list if bp])
            elif isinstance(bp_list, str) and bp_list:
                all_body_parts.add(bp_list.upper())
            
            # Collect exercise types
            et = ex.get("exerciseType") or ex.get("type") or ""
            if et:
                all_exercise_types.add(str(et).upper())
        
        print(f"\n📊 Summary:")
        print(f"   Equipment types: {len(all_equipments)} ({', '.join(sorted(list(all_equipments))[:10])}{'...' if len(all_equipments) > 10 else ''})")
        print(f"   Body parts: {len(all_body_parts)} ({', '.join(sorted(list(all_body_parts))[:10])}{'...' if len(all_body_parts) > 10 else ''})")
        print(f"   Exercise types: {len(all_exercise_types)} ({', '.join(sorted(list(all_exercise_types)))})")
    
    if all_exercises:
        print(f"\n✓ Total unique exercises collected: {len(all_exercises)}")
        return all_exercises
    
    # If we get here, nothing worked
    print("\n❌ Failed to fetch exercises. Please check:")
    print("  1. Your RapidAPI subscription includes ExerciseDB access")
    print("  2. The API endpoints are correct")
    print("  3. Your API key has the correct permissions")
    raise Exception("Failed to fetch exercises from ExerciseDB API")

def infer_pattern_from_exercise(name, body_parts, exercise_type):
    """Infer pattern (category) from exercise name and metadata"""
    name_lower = name.lower()
    body_parts_lower = " ".join([str(bp).lower() for bp in body_parts]) if isinstance(body_parts, list) else str(body_parts).lower()
    
    # Core/abs exercises
    if any(word in name_lower for word in ["core", "abs", "plank", "crunch", "sit-up"]):
        return "core"
    if "CORE" in body_parts_lower.upper() or "ABS" in body_parts_lower.upper():
        return "core"
    
    # Mobility/flexibility
    if any(word in name_lower for word in ["stretch", "flexibility", "mobility", "yoga"]):
        return "mobility"
    if exercise_type and "STRETCH" in str(exercise_type).upper():
        return "mobility"
    
    # Cardio
    if any(word in name_lower for word in ["jump", "run", "sprint", "cardio", "hiit", "burpee"]):
        return "cardio"
    if exercise_type and "CARDIO" in str(exercise_type).upper():
        return "cardio"
    
    # Default to strength
    return "strength"

def infer_goal_from_exercise(name, body_parts, exercise_type):
    """Infer goal from exercise metadata"""
    name_lower = name.lower()
    
    if any(word in name_lower for word in ["stretch", "flexibility", "mobility"]):
        return "mobility"
    if any(word in name_lower for word in ["endurance", "cardio"]):
        return "endurance"
    
    # Default to strength
    return "strength"

def infer_difficulty_from_exercise(name, exercise_type):
    """Infer difficulty level from exercise name"""
    name_lower = name.lower()
    
    # Advanced indicators
    if any(word in name_lower for word in ["advanced", "complex", "plyometric", "explosive", "olympic"]):
        return "advanced"
    
    # Beginner indicators
    if any(word in name_lower for word in ["beginner", "assisted", "supported", "wall", "knee"]):
        return "beginner"
    
    # Default to intermediate
    return "intermediate"

def infer_binder_safety(name, body_parts, exercise_type):
    """Infer binder safety from exercise characteristics"""
    name_lower = name.lower()
    body_parts_str = " ".join([str(bp).lower() for bp in body_parts]) if isinstance(body_parts, list) else str(body_parts).lower()
    
    # High compression risk exercises
    unsafe_keywords = ["jump", "burpee", "mountain climber", "high knees", "sprint", "plyometric", "explosive"]
    if any(keyword in name_lower for keyword in unsafe_keywords):
        return False
    
    # Chest-focused exercises might have compression
    if "CHEST" in body_parts_str.upper() or "pectoral" in name_lower:
        # Most chest exercises are okay, but be cautious
        return True
    
    # Generally safe
    return True

def infer_heavy_binding_safety(name):
    """Infer heavy binding safety - exercises that are NOT safe for heavy binding"""
    name_lower = name.lower()
    unsafe_patterns = ['jumping_jack', 'high_knees', 'mountain_climber', 'burpee', 'squat_thrust']
    
    for pattern in unsafe_patterns:
        if pattern.replace('_', ' ') in name_lower or pattern.replace('_', '-') in name_lower:
            return False
    
    return True

def infer_pelvic_floor_safety(name, body_parts, exercise_type):
    """Infer pelvic floor safety"""
    name_lower = name.lower()
    body_parts_str = " ".join([str(bp).lower() for bp in body_parts]) if isinstance(body_parts, list) else str(body_parts).lower()
    
    # High impact/compression exercises
    unsafe_keywords = ["jump", "sprint", "explosive", "plyometric", "heavy", "max"]
    if any(keyword in name_lower for keyword in unsafe_keywords):
        return False
    
    # Core exercises that involve bearing down
    if "core" in name_lower or "CORE" in body_parts_str.upper():
        # Most core exercises are safe, but some require caution
        if any(word in name_lower for word in ["crunch", "sit-up", "v-up"]):
            return False  # These involve bearing down
    
    return True

data = get_all_exercises()
rows = []
for ex in data:
    name = ex.get("name","").strip().title()
    slug = slugify(name)
    
    # Handle equipment - API returns equipments as array
    equip_list = ex.get("equipments") or ex.get("equipment") or []
    if isinstance(equip_list, list):
        # Convert array to string for norm_equipment function
        equip_str = ", ".join([str(e) for e in equip_list if e])
    else:
        equip_str = str(equip_list) if equip_list else ""
    
    equip_tokens = norm_equipment(equip_str)
    
    # Handle image URL - API uses imageUrl
    thumb = ex.get("imageUrl") or ex.get("gifUrl") or ex.get("gif_url") or ex.get("image") or ""
    
    # Handle ID - API uses exerciseId
    ex_id = ex.get("exerciseId") or ex.get("id") or ex.get("_id") or ""
    source_url = f"https://exercisedb-api1.p.rapidapi.com/api/v1/exercises/{ex_id}" if ex_id else ""
    
    # Extract additional useful fields from API
    body_parts_raw = ex.get("bodyParts") or []
    if not isinstance(body_parts_raw, list):
        body_parts_raw = [body_parts_raw] if body_parts_raw else []
    
    body_parts_str = ", ".join([str(bp) for bp in body_parts_raw if bp])
    
    exercise_type = ex.get("exerciseType") or ""
    target_muscles_raw = ex.get("targetMuscles") or []
    if not isinstance(target_muscles_raw, list):
        target_muscles_raw = [target_muscles_raw] if target_muscles_raw else []
    
    target_muscles_str = ", ".join([str(tm) for tm in target_muscles_raw if tm])
    
    # Infer trans-specific fields with sensible defaults (pass list version)
    pattern = infer_pattern_from_exercise(name, body_parts_raw, exercise_type)
    goal = infer_goal_from_exercise(name, body_parts_raw, exercise_type)
    difficulty = infer_difficulty_from_exercise(name, exercise_type)
    binder_aware = infer_binder_safety(name, body_parts_raw, exercise_type)
    heavy_binding_safe = infer_heavy_binding_safety(name)
    pelvic_floor_safe = infer_pelvic_floor_safety(name, body_parts_raw, exercise_type)
    
    # Default values for fields that need manual curation
    # These should be reviewed and filled in manually
    contraindications = []  # TODO: Manual curation needed
    cue_primary = ""  # TODO: Manual curation needed
    cues = []  # TODO: Manual curation needed - can use target_muscles as starting point
    breathing = ""  # TODO: Manual curation needed
    coaching_points = []  # TODO: Manual curation needed
    common_errors = []  # TODO: Manual curation needed
    progressions = []  # TODO: Manual curation needed
    regressions = []  # TODO: Manual curation needed
    swaps = []  # TODO: Manual curation needed - exercise indices
    
    rows.append({
        "slug": slug,
        "name": name,
        "pattern": pattern,
        "goal": goal,
        "equipment": json.dumps(equip_tokens),
        "difficulty": difficulty,
        "binder_aware": str(binder_aware).lower(),
        "heavy_binding_safe": str(heavy_binding_safe).lower(),
        "pelvic_floor_safe": str(pelvic_floor_safe).lower(),
        "contraindications": json.dumps(contraindications),
        "cue_primary": cue_primary,
        "cues": json.dumps(cues),
        "breathing": breathing,
        "coaching_points": json.dumps(coaching_points),
        "common_errors": json.dumps(common_errors),
        "progressions": json.dumps(progressions),
        "regressions": json.dumps(regressions),
        "swaps": json.dumps(swaps),
        # API metadata (for reference)
        "body_parts": body_parts_str,
        "exercise_type": exercise_type,
        "target_muscles": target_muscles_str,
        "media_thumb": thumb,
        "media_video": "",
        "source_url": source_url,
        "external_id": str(ex_id),
    })

csv_path = OUT / "staging_exercisedb.csv"

# Backup previous file if it exists
if csv_path.exists():
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = OUT / f"staging_exercisedb_backup_{timestamp}.csv"
    shutil.copy2(csv_path, backup_path)
    print(f"✓ Backed up previous file to: {backup_path}")

# Write new CSV with all trans-specific fields
csv_headers = [
    "slug", "name", "pattern", "goal", "equipment", "difficulty",
    "binder_aware", "heavy_binding_safe", "pelvic_floor_safe",
    "contraindications", "cue_primary", "cues", "breathing",
    "coaching_points", "common_errors", "progressions", "regressions", "swaps",
    # API metadata (for reference)
    "body_parts", "exercise_type", "target_muscles",
    "media_thumb", "media_video", "source_url", "external_id"
]

with csv_path.open("w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(csv_headers)
    for r in rows:
        w.writerow([r.get(header, "") for header in csv_headers])

print(f"✓ Wrote {csv_path} with {len(rows)} rows.")

# Count exercises needing manual curation
needs_curation = sum(1 for r in rows if not r.get("cues") or r.get("cues") == "[]")
print(f"\n📝 Curation Status:")
print(f"   Exercises with inferred values: {len(rows)}")
print(f"   Exercises needing manual cue/coaching curation: {needs_curation}")
print(f"   ⚠️  Review and fill in: cues, breathing, coaching_points, common_errors, progressions, regressions, swaps")

# Generate SQL file for database import (similar to wger script)
sql_content = f"""
-- Staging table for ExerciseDB exercises with trans-specific fields
-- Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
-- Total exercises: {len(rows)}
-- 
-- NOTE: Some fields are auto-inferred and should be reviewed:
--   - difficulty, binder_aware, heavy_binding_safe, pelvic_floor_safe (auto-inferred)
--   - cues, breathing, coaching_points, common_errors (need manual curation)
--   - progressions, regressions, swaps (need manual curation)

CREATE TABLE IF NOT EXISTS staging_exercisedb (
  slug TEXT,
  name TEXT,
  pattern TEXT,              -- e.g., "strength", "core", "mobility", "cardio"
  goal TEXT,                 -- e.g., "strength", "mobility", "endurance"
  equipment TEXT[],          -- normalized tokens (Postgres array)
  difficulty TEXT,           -- "beginner", "intermediate", "advanced"
  binder_aware BOOLEAN,      -- Safe for chest binding
  heavy_binding_safe BOOLEAN, -- Safe for heavy/tight binding
  pelvic_floor_safe BOOLEAN,  -- Safe for pelvic floor considerations
  contraindications TEXT[],  -- Array of contraindications
  cue_primary TEXT,          -- Primary cue for form
  cues TEXT[],               -- Array of form cues
  breathing TEXT,            -- Breathing pattern/cue
  coaching_points TEXT[],    -- Coaching tips
  common_errors TEXT[],      -- Common mistakes to avoid
  progressions TEXT[],       -- Progressions (exercise slugs/names)
  regressions TEXT[],        -- Regressions (exercise slugs/names)
  swaps TEXT[],              -- Alternative exercises (exercise slugs/names)
  -- API metadata (for reference)
  body_parts TEXT,          -- comma-separated body parts from API
  exercise_type TEXT,       -- STRENGTH, CARDIO, etc. from API
  target_muscles TEXT,      -- comma-separated target muscles from API
  media_thumb TEXT,
  media_video TEXT,
  source_url TEXT,
  external_id TEXT
);

-- To import from CSV (if using Supabase/Postgres):
-- COPY staging_exercisedb (slug, name, equipment, media_thumb, media_video, source_url, external_id)
-- FROM '/path/to/staging_exercisedb.csv'
-- WITH (FORMAT csv, HEADER true);

-- Or use INSERT statements (for SQLite or other databases):
-- Note: For SQLite, you may need to parse the JSON equipment array differently
"""
sql_path = OUT / "create_staging_exercisedb.sql"
sql_path.write_text(sql_content)
print(f"✓ Generated SQL file: {sql_path}")
print(f"\n📋 Next Steps:")
print(f"   1. Review the CSV: {csv_path}")
print(f"      - Auto-inferred fields: pattern, goal, difficulty, binder_aware, heavy_binding_safe, pelvic_floor_safe")
print(f"      - Need manual curation: cues, breathing, coaching_points, common_errors, progressions, regressions, swaps")
print(f"   2. Manually curate trans-specific fields:")
print(f"      - Add form cues based on target_muscles and body_parts")
print(f"      - Add breathing patterns")
print(f"      - Add coaching points and common errors")
print(f"      - Add progressions/regressions (easier/harder variations)")
print(f"      - Add swaps (alternative exercises)")
print(f"      - Review and adjust binder/pelvic floor safety flags")
print(f"   3. Import into your database using: {sql_path}")
print(f"   4. Previous backups are saved with timestamps in: {OUT}")
