import os
import json
from typing import List, Dict, Any

from dotenv import load_dotenv
from supabase import create_client, Client
from openai import OpenAI

# -------------------------
# ENV + CLIENT SETUP
# -------------------------

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

assert SUPABASE_URL, "SUPABASE_URL not set"
assert SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY not set"
assert OPENAI_API_KEY, "OPENAI_API_KEY not set"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
openai_client = OpenAI(api_key=OPENAI_API_KEY)

# Safety limit while you test – set to None to process all
MAX_EXERCISES = 25

# Topic keywords used to tag research
TOPIC_KEYWORDS = {
    "hrt_strength": [
        "hormone", "androgen", "testosterone", "estradiol",
        "sex steroid", "muscle strength", "lean mass"
    ],
    "bone_health": [
        "bone density", "bmd", "osteoporosis", "fracture", "bone mineral"
    ],
    "top_surgery": [
        "mastectomy", "top surgery", "chest surgery", "breast surgery"
    ],
    "cardio_risk": [
        "cardiovascular", "cardio", "aerobic", "heart disease", "hypertension"
    ],
    "mental_health": [
        "depression", "anxiety", "mental health", "distress", "dysphoria"
    ],
}


# -------------------------
# RESEARCH HELPERS
# -------------------------

def tag_topics_for_research_row(row: Dict[str, Any]) -> List[str]:
    """Assign topic tags based on title + takeaways."""
    text = f"{row.get('title', '')} {row.get('takeaways', '')}".lower()
    topics = []
    for topic, keywords in TOPIC_KEYWORDS.items():
        if any(k.lower() in text for k in keywords):
            topics.append(topic)
    return topics


def update_research_topics() -> List[Dict[str, Any]]:
    """
    Fetches relevant research rows, tags topics, writes them back,
    and returns a list of processed research rows.
    """
    resp = (
        supabase.table("transfit_research")
        .select("*")
        .eq("relevant", True)
        .execute()
    )
    rows = resp.data or []

    updated_rows = []
    for row in rows:
        topics = tag_topics_for_research_row(row)
        if topics and (row.get("topics") != topics):
            supabase.table("transfit_research").update(
                {"topics": topics, "processed": True}
            ).eq("id", row["id"]).execute()
            row["topics"] = topics
            row["processed"] = True
        updated_rows.append(row)

    return updated_rows


# -------------------------
# EXERCISE HELPERS
# -------------------------

def load_exercises() -> List[Dict[str, Any]]:
    """
    Loads exercises and joins in staging_exercisedb metadata by slug when available.
    """
    ex_resp = (
        supabase.table("exercises")
        .select(
            "id, slug, name, pattern, goal, difficulty, equipment, "
            "binder_aware, pelvic_floor_safe"
        )
        .execute()
    )
    exercises = ex_resp.data or []

    stag_resp = (
        supabase.table("staging_exercisedb")
        .select("slug, body_parts, exercise_type, target_muscles")
        .execute()
    )
    staging_rows = stag_resp.data or []
    staging_by_slug = {r["slug"]: r for r in staging_rows if r.get("slug")}

    for ex in exercises:
        s = staging_by_slug.get(ex["slug"])
        ex["body_parts"] = s.get("body_parts") if s else None
        ex["exercise_type"] = s.get("exercise_type") if s else None
        ex["target_muscles"] = s.get("target_muscles") if s else None

    return exercises


def infer_topics_for_exercise(ex: Dict[str, Any]) -> List[str]:
    """
    Infer topic tags for an exercise from pattern, goal, difficulty, and body region.
    """
    topics = set()
    pattern = (ex.get("pattern") or "").lower()
    goal = (ex.get("goal") or "").lower()
    exercise_type = (ex.get("exercise_type") or "").lower()
    body_parts = (ex.get("body_parts") or "").lower()

    # Lower body / axial loading patterns → bone & HRT strength considerations
    if pattern in ["hinge", "squat", "lunge", "carry", "gait"]:
        topics.update(["hrt_strength", "bone_health"])

    # Core work often relevant for post-op rehab & general support
    if pattern == "core":
        topics.update(["hrt_strength", "bone_health"])

    # Conditioning / high-impact → cardio risk considerations
    if goal == "conditioning" or exercise_type in ["cardio", "plyometrics"]:
        topics.add("cardio_risk")

    # Mobility / recovery → gentle / post-op / bone considerations
    if goal in ["mobility", "recovery"]:
        topics.update(["bone_health", "top_surgery"])

    # Upper body / chest involvement → binding & top surgery relevance
    if any(k in body_parts for k in ["chest", "shoulder", "upper arm"]):
        topics.add("top_surgery")

    # Binder-aware flag implies chest involvement / top surgery context
    if ex.get("binder_aware"):
        topics.add("top_surgery")

    # Non-pelvic-floor-safe might intersect with HRT and core/bracing strategy
    if not ex.get("pelvic_floor_safe"):
        topics.add("hrt_strength")

    return list(topics)


def build_research_context_for_topics(
    research_rows: List[Dict[str, Any]],
    exercise_topics: List[str],
    max_articles: int = 6,
) -> (str, List[str]):
    """
    Given a list of research rows and the exercise's topics,
    return a formatted context string plus a list of DOIs.
    """
    if not exercise_topics:
        return "", []

    matched = []
    for row in research_rows:
        row_topics = row.get("topics") or []
        if any(t in row_topics for t in exercise_topics):
            matched.append(row)
        if len(matched) >= max_articles:
            break

    if not matched:
        return "", []

    lines = []
    dois = []
    for r in matched:
        year = r.get("year")
        journal = r.get("journal") or "n.d."
        title = r.get("title") or "Untitled"
        takeaways = r.get("takeaways") or r.get("summary") or ""
        lines.append(
            f"- {title} ({year if year is not None else 'n.d.'}, {journal}): {takeaways}"
        )
        if r.get("doi"):
            dois.append(r["doi"])

    return "\n".join(lines), dois


def exercise_already_has_tips(exercise_id: int, population: str, context: str) -> bool:
    """
    Check if we already generated tips for this exercise/population/context combo.
    Prevents duplicates when re-running the script.
    """
    resp = (
        supabase.table("exercise_trans_tips")
        .select("id", count="exact")
        .eq("exercise_id", exercise_id)
        .eq("population", population)
        .eq("context", context)
        .execute()
    )
    return (resp.count or 0) > 0


# -------------------------
# OPENAI: TIP GENERATION
# -------------------------

def generate_tips_json_for_exercise(
    exercise: Dict[str, Any],
    research_context: str,
    source_dois: List[str],
) -> Dict[str, Any]:
    """
    Calls OpenAI Chat Completions (1.x style) to generate a structured JSON object of tips.
    This version is explicitly movement-specific and trans-informed.
    """
    if not research_context.strip():
        return {}

    equipment = exercise.get("equipment") or []
    equipment_str = ", ".join(equipment) if isinstance(equipment, list) else str(equipment)

    pattern = exercise.get("pattern")
    goal = exercise.get("goal")
    difficulty = exercise.get("difficulty")
    body_parts = exercise.get("body_parts")
    exercise_type = exercise.get("exercise_type")
    target_muscles = exercise.get("target_muscles")

    prompt = f"""
You are a trans-informed strength and conditioning coach and exercise physiologist.
You specialize in safe training guidance for transgender and gender diverse people.

EXERCISE PROFILE:
- Name: {exercise.get('name')}
- Pattern: {pattern}
- Goal: {goal}
- Difficulty: {difficulty}
- Equipment: {equipment_str}
- Body parts (from ExerciseDB, if present): {body_parts}
- Exercise type (from ExerciseDB, if present): {exercise_type}
- Target muscles (from ExerciseDB, if present): {target_muscles}
- Binder aware flag: {exercise.get('binder_aware')}
- Pelvic floor safe flag: {exercise.get('pelvic_floor_safe')}

RESEARCH EXTRACTS (summaries from peer-reviewed articles on trans health, HRT, surgery outcomes, bone health, and exercise):
{research_context}

TASK:
Using only information that is compatible with these research extracts and general evidence-based exercise practice,
generate concise, practical tips for a general trans population for this specific exercise.

The tips MUST explicitly address:
1) FORM & TECHNIQUE for this exact movement (set-up, joint positions, what to feel, what to avoid).
2) HRT-related considerations (e.g., recovery, joint/tendon sensitivity, bone health), scoped to training, not medication changes.
3) BINDING & CHEST considerations if the exercise meaningfully uses the chest, shoulders, or upper body, or if binder_aware is true.
4) GENDER-AFFIRMING MODIFICATIONS (e.g., posture, angles, clothing, exercise variations that reduce dysphoria or feel safer).
5) GENERAL SAFETY (breathing, pain vs. discomfort, when to regress, when to seek medical advice).

Return a SINGLE JSON object with EXACTLY this shape and NOTHING else in the response:

{{
  "form_focus": [ "...", "..." ],
  "hrt_considerations": [ "...", "..." ],
  "binding_considerations": [ "...", "..." ],
  "post_op_considerations": [ "...", "..." ],
  "gender_affirming_modifications": [ "...", "..." ],
  "general_safety": [ "...", "..." ],
  "disclaimer": "short 1–2 sentences reminding users to consult a provider familiar with trans health.",
  "source_dois": {json.dumps(source_dois)}
}}

Rules:
- Each array should have 2–4 short, specific bullet-style sentences.
- FORM_FOCUS must reference this exact movement (e.g. squats vs push-ups), including which joints are moving and what a “good rep” feels like.
- BINDING_CONSIDERATIONS should mention breath, heat, and volume management when relevant, and when to shorten sets or reduce intensity.
- GENDER_AFFIRMING_MODIFICATIONS should mention options like training alone/with a trusted partner, clothing or setup choices, and alternative variations that might feel less dysphoric.
- Do not give individualized medical advice or tell anyone to change medications or doses.
- Do not mention specific study names or journals.
- Do not copy-paste identical phrasing across sections; make the tips clearly about THIS exercise.
- If a section is genuinely not applicable, return an empty array for that section.
- Keep the tone validating, practical, and strength-based.
- Respond with ONLY the raw JSON, no explanation.
"""

    response = openai_client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {"role": "system", "content": "You return only valid JSON objects."},
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0,
    )

    content = response.choices[0].message.content
    return json.loads(content)


# -------------------------
# MAIN PIPELINE
# -------------------------

def main():
    print("Loading and tagging research...")
    research_rows = update_research_topics()
    print(f"Loaded {len(research_rows)} research rows.")

    print("Loading exercises and staging metadata...")
    exercises = load_exercises()
    print(f"Loaded {len(exercises)} exercises.")

    processed_count = 0
    population = "general"
    context = "general"

    for ex in exercises:
        if MAX_EXERCISES is not None and processed_count >= MAX_EXERCISES:
            break

        exercise_id = ex["id"]

        if exercise_already_has_tips(exercise_id, population, context):
            print(f"Skipping {ex['name']} (existing tips).")
            continue

        ex_topics = infer_topics_for_exercise(ex)
        if not ex_topics:
            print(f"No topics inferred for {ex['name']}, skipping.")
            continue

        research_context, dois = build_research_context_for_topics(
            research_rows, ex_topics
        )
        if not research_context:
            print(f"No matching research for topics {ex_topics} on {ex['name']}, skipping.")
            continue

        try:
            tips_json = generate_tips_json_for_exercise(ex, research_context, dois)
        except Exception as e:
            print(f"Error generating tips for {ex['name']}: {e}")
            continue

        if not tips_json:
            print(f"No tips generated for {ex['name']}, skipping.")
            continue

        supabase.table("exercise_trans_tips").insert(
            {
                "exercise_id": exercise_id,
                "population": population,
                "context": context,
                "tips": tips_json,
                "source_dois": dois,
                "needs_review": True,
            }
        ).execute()

        processed_count += 1
        print(f"Inserted tips for {ex['name']} (id {exercise_id}).")

    print(f"Done. Generated tips for {processed_count} exercises.")


if __name__ == "__main__":
    main()
