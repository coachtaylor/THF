import csv, json, time, re, hashlib
from pathlib import Path
import requests

BASE = "https://wger.de/api/v2"
OUT = Path("wger_staging_export")

OUT.mkdir(exist_ok=True)

def slugify(s: str) -> str:
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')[:64]

# 1) Fetch full equipment list
equip = {}
url = f"{BASE}/equipment/?limit=200"
while url:
    r = requests.get(url, timeout=30)
    r.raise_for_status()
    data = r.json()
    for row in data["results"]:
        equip[row["id"]] = row["name"].strip().lower()
    url = data.get("next")

# 2) Normalization to your tokens
def map_equipment(names):
    tokens = set()
    for name in names:
        n = name.lower()
        if n in ("none", "no equipment"): tokens.add("bodyweight")
        elif "dumbbell" in n or n == "db": tokens.add("db")
        elif "kettlebell" in n or n == "kb": tokens.add("kb")
        elif "barbell" in n: tokens.add("barbell")
        elif "band" in n or "resistance band" in n: tokens.add("band")
        elif "bench" in n: tokens.add("bench")
        elif "step" in n or "box" in n: tokens.add("step")
        elif "cable" in n: tokens.add("cable")
        elif "machine" in n or "leverage" in n: tokens.add("machine")
        elif "bike" in n or "cycle" in n or "erg" in n: tokens.add("bike")
        elif "tread" in n: tokens.add("treadmill")
        elif "sled" in n: tokens.add("sled")
        else:
            # fallback: treat as bodyweight if unknown
            tokens.add("bodyweight")
    return sorted(tokens)

# 3) Fetch all English exercises using exerciseinfo endpoint
exercises = []
url = f"{BASE}/exerciseinfo/?limit=200&offset=0"
while url:
    r = requests.get(url, timeout=60)
    r.raise_for_status()
    data = r.json()
    for ex in data["results"]:
        # Extract name from translations (filter for English, language=2)
        name = None
        translations = ex.get("translations", [])
        for trans in translations:
            # English translations typically have language=2
            # We'll take the first translation with a name
            if trans.get("name"):
                name = trans["name"].strip()
                break
        
        if not name:
            continue
        
        slug = slugify(name)
        # Equipment is a list of objects in exerciseinfo
        equipment_list = ex.get("equipment", [])
        if equipment_list and isinstance(equipment_list[0], dict):
            # Extract equipment names from objects
            eq_names = [eq.get("name", "").strip().lower() for eq in equipment_list if eq.get("name")]
        else:
            # Fallback: try to get equipment IDs if they're just numbers
            ids = equipment_list or []
            eq_names = [equip.get(eid, "none") for eid in ids if isinstance(eid, int)]
        
        eq_tokens = map_equipment(eq_names) if eq_names else ["bodyweight"]
        exercises.append({
            "slug": slug,
            "name": name,
            "equipment_tokens": eq_tokens,
            "media_thumb": None,    # fill later if you want
            "media_video": None,    # fill later if you want
            "source_url": f"https://wger.de/en/exercise/{ex['id']}",
            "external_id": str(ex["id"]),
        })
    url = data.get("next")
    time.sleep(0.3)  # be polite

# 4) Write CSV for Supabase import into staging_wger
csv_path = OUT / "staging_wger.csv"
with csv_path.open("w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["slug","name","equipment","media_thumb","media_video","source_url","external_id"])
    for ex in exercises:
        # Supabase import: represent arrays as JSON or as Postgres array text. We'll use JSON then cast in merge.
        w.writerow([
            ex["slug"],
            ex["name"],
            json.dumps(ex["equipment_tokens"]),   # e.g. ["db","bench"]
            ex["media_thumb"] or "",
            ex["media_video"] or "",
            ex["source_url"],
            ex["external_id"],
        ])

print(f"Wrote {csv_path} with {len(exercises)} rows.")

# 5) Optional: generate a quick SQL you can use to create staging_wger
sql = f"""
create table if not exists staging_wger (
  slug text,
  name text,
  equipment text[],     -- normalized tokens
  media_thumb text,
  media_video text,
  source_url text,
  external_id text
);
"""
(Path(OUT/"create_staging_wger.sql")).write_text(sql)
print("Wrote create_staging_wger.sql")
