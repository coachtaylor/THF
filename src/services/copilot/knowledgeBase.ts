// Copilot Knowledge Base
// PRD 3.0: Retrieval-based responses for common questions
// Categories: Binding, HRT, Post-op, Exercise, Recovery, Dysphoria management
//
// NOTE: This module now uses the database-backed knowledge engine.
// The implementation is in src/knowledge/content/knowledgeBase.ts
// KNOWLEDGE_BASE is kept as a fallback seed for offline/migration scenarios.

import {
  searchKnowledge as dbSearchKnowledge,
  getRandomTips as dbGetRandomTips,
  getAllKnowledgeEntries,
} from "../../knowledge/content/knowledgeBase";
import type { UserContext as DbUserContext } from "../../knowledge/types";

// =============================================
// TYPE DEFINITIONS (kept for backward compatibility)
// =============================================

export interface KnowledgeEntry {
  id: string;
  category:
    | "binding"
    | "hrt"
    | "post_op"
    | "exercise"
    | "recovery"
    | "dysphoria"
    | "general";
  keywords: string[];
  question: string;
  answer: string;
  relatedGuide?: "binder_safety" | "post_op_movement";
  requiresContext?: {
    binds_chest?: boolean;
    on_hrt?: boolean;
    has_surgery?: boolean;
    hrt_type?: "estrogen" | "testosterone";
  };
}

// =============================================
// SEARCH FUNCTION (uses database with fallback)
// =============================================

/**
 * Find relevant knowledge entries based on user query.
 * Uses database-backed search with local fallback.
 */
export function searchKnowledge(
  query: string,
  context?: {
    binds_chest?: boolean;
    on_hrt?: boolean;
    has_surgery?: boolean;
    hrt_type?: "estrogen" | "testosterone";
  },
): KnowledgeEntry[] {
  // Convert context for database function
  const dbContext: DbUserContext | undefined = context
    ? {
        binds_chest: context.binds_chest,
        on_hrt: context.on_hrt,
        has_surgery: context.has_surgery,
        hrt_type: context.hrt_type,
      }
    : undefined;

  // Try database first (async but we need sync for now - use cache)
  // For now, fall back to local search until we can make responseGenerator async
  return searchKnowledgeLocal(query, context);
}

/**
 * Local search using hardcoded KNOWLEDGE_BASE (fallback)
 */
function searchKnowledgeLocal(
  query: string,
  context?: {
    binds_chest?: boolean;
    on_hrt?: boolean;
    has_surgery?: boolean;
    hrt_type?: "estrogen" | "testosterone";
  },
): KnowledgeEntry[] {
  const queryLower = query.toLowerCase();
  const words = queryLower.split(/\s+/);

  // Score each entry based on keyword matches
  const scored = KNOWLEDGE_BASE.map((entry) => {
    let score = 0;

    // Check keyword matches
    for (const keyword of entry.keywords) {
      if (queryLower.includes(keyword)) {
        score += 2;
      } else if (
        words.some((word) => keyword.includes(word) || word.includes(keyword))
      ) {
        score += 1;
      }
    }

    // Boost if context matches
    if (entry.requiresContext && context) {
      const ctxMatch = Object.entries(entry.requiresContext).every(
        ([key, value]) => {
          return context[key as keyof typeof context] === value;
        },
      );
      if (ctxMatch) {
        score += 3;
      }
    }

    // Slight boost for category match in query
    if (queryLower.includes(entry.category)) {
      score += 1;
    }

    return { entry, score };
  });

  // Return top matches with score > 0
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => s.entry);
}

/**
 * Get random helpful tips for when no specific query matches
 */
export function getRandomTips(count: number = 3): KnowledgeEntry[] {
  const shuffled = [...KNOWLEDGE_BASE].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// =============================================
// KNOWLEDGE BASE ENTRIES (seed data / fallback)
// This data is also stored in Supabase knowledge_entries table
// =============================================

export const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  // ========== BINDING CATEGORY ==========
  {
    id: "binding_cardio",
    category: "binding",
    keywords: ["cardio", "running", "binder", "breath", "breathing", "chest"],
    question: "Can I do cardio while binding?",
    answer: `Yes, but with modifications. When binding during cardio:

• **Keep intensity moderate** - stay at a conversational pace where you can speak in full sentences
• **Take breaks every 30-45 minutes** to rest and allow deeper breathing
• **Listen to your body** - if you feel short of breath, dizzy, or chest pain, stop immediately
• **Consider a sports binder** - they're designed for physical activity and offer better breathability
• **Stay hydrated** - binding can increase sweating and heat retention

If high-intensity cardio is important to you, consider doing those sessions without a binder when you feel comfortable doing so.`,
    relatedGuide: "binder_safety",
    requiresContext: { binds_chest: true },
  },
  {
    id: "binding_chest_exercises",
    category: "binding",
    keywords: ["chest", "press", "push", "binder", "bench"],
    question: "Should I do chest exercises while binding?",
    answer: `Chest exercises while binding require extra consideration:

• **Avoid heavy pressing movements** - like bench press or push-ups - while wearing a binder
• **The compression limits your breathing** and can make exertion dangerous
• **Your form may be compromised** due to restricted movement

**What we recommend:**
- Do chest exercises on non-binding days if possible
- If you must bind, stick to lighter weights and higher reps
- Focus on exercises that don't require deep breathing under load
- Consider resistance band work instead of heavy weights

TransFitness automatically selects binder-aware exercises for your workouts.`,
    relatedGuide: "binder_safety",
    requiresContext: { binds_chest: true },
  },
  {
    id: "binding_duration",
    category: "binding",
    keywords: ["how long", "hours", "duration", "binder", "break"],
    question: "How long can I safely bind while working out?",
    answer: `The general guideline is:

• **No more than 8-10 hours total per day** of binding
• **During workouts, take a break every 30-45 minutes**
• **Remove your binder immediately** if you experience pain, difficulty breathing, or dizziness

**Signs you need a break:**
- Shortness of breath beyond normal exertion
- Rib or back pain
- Lightheadedness
- Skin irritation or rashes

TransFitness adds automatic "binder break" reminders to workouts over 45 minutes.`,
    relatedGuide: "binder_safety",
    requiresContext: { binds_chest: true },
  },
  {
    id: "binding_ace_bandage",
    category: "binding",
    keywords: [
      "ace bandage",
      "elastic bandage",
      "diy",
      "tape",
      "unsafe",
      "ribs",
      "homemade",
    ],
    question: "Is it safe to use ace bandages or tape to bind during workouts?",
    answer: `**No - ace bandages and DIY binding methods are not safe for exercise.**

• Ace bandages tighten with movement, increasing rib compression during activity
• Can cause rib fractures, breathing restriction, and permanent damage
• TransFitness limits workouts to **30 minutes maximum** if you're using these methods
• We also exclude all high-intensity cardio and plyometric exercises

**What to use instead:**
- Commercial binders designed for movement (gc2b, Underworks, Spectrum)
- Sports binders specifically made for athletic activity
- Compression sports bras as a lower-compression alternative

If cost is a barrier, organizations like Point of Pride offer free binder programs.`,
    relatedGuide: "binder_safety",
    requiresContext: { binds_chest: true },
  },
  {
    id: "binding_sports_binder",
    category: "binding",
    keywords: [
      "sports binder",
      "gc2b",
      "underworks",
      "exercise binder",
      "workout binder",
      "athletic",
    ],
    question: "Should I use a sports binder for workouts?",
    answer: `Sports binders or athletic-focused binders are your best option for exercise:

**Benefits:**
• Designed with breathable, moisture-wicking fabric
• Allow slightly more chest expansion than standard binders
• Built to handle sweat and movement

**Recommendations:**
- Half-binders often work better for cardio than full-length
- Look for mesh panels for ventilation
- Size up if between sizes for activity

**Still important:**
- Follow the same duration guidelines (breaks every 30-45 min)
- Remove after workouts for recovery
- Replace when elasticity wears out

Some people use a compression sports bra for cardio days - this is valid if it works for your dysphoria.`,
    relatedGuide: "binder_safety",
    requiresContext: { binds_chest: true },
  },
  {
    id: "binding_breathing",
    category: "binding",
    keywords: [
      "breathing",
      "breath",
      "shortness",
      "difficulty",
      "deep breath",
      "lung",
      "oxygen",
    ],
    question: "How do I manage breathing while exercising in a binder?",
    answer: `Breathing is the #1 challenge when exercising while binding. Here's how to manage it:

**Breathing techniques:**
• Focus on **diaphragmatic breathing** - push your belly out, not chest up
• Breathe through pursed lips on exertion (like blowing out a candle)
• Count your breaths: 2 counts in through nose, 4 counts out through mouth

**Workout adjustments:**
• Keep intensity moderate - you should be able to speak in sentences
• Take longer rest periods between sets
• Avoid exercises that require deep breaths under heavy load

**Warning signs to STOP immediately:**
- Lightheadedness or dizziness
- Sharp chest or rib pain
- Numbness or tingling
- Extreme shortness of breath beyond normal exertion

TransFitness automatically keeps cardio at moderate intensity for binding users.`,
    relatedGuide: "binder_safety",
    requiresContext: { binds_chest: true },
  },
  {
    id: "binding_when_to_remove",
    category: "binding",
    keywords: [
      "remove",
      "take off",
      "when",
      "stop",
      "pain",
      "discomfort",
      "binder break",
    ],
    question: "When should I remove my binder during a workout?",
    answer: `TransFitness includes automatic reminders, but here's when you should remove your binder:

**Scheduled breaks:**
• Every 90 minutes during extended activity
• After your workout - keep it off for at least 30 minutes

**Remove immediately if you experience:**
• Sharp pain in ribs, chest, or back
• Difficulty catching your breath after rest
• Dizziness or feeling faint
• Skin rashes, chafing, or blistering
• Numbness in arms or chest

**Tips for gym environments:**
• Bathroom stalls offer privacy for breaks
• Wear a loose t-shirt to cover during breaks
• Plan workouts for times when you have post-workout privacy

It's okay to modify your workout around binder breaks - your safety matters more than finishing every set.`,
    relatedGuide: "binder_safety",
    requiresContext: { binds_chest: true },
  },
  {
    id: "binding_overhead",
    category: "binding",
    keywords: [
      "overhead",
      "press",
      "shoulder",
      "arms up",
      "reach",
      "stretch",
      "above head",
    ],
    question: "Can I do overhead exercises while binding?",
    answer: `Overhead movements require extra rib expansion, making them challenging while binding:

**General guidelines:**
• If you've been binding for 10+ hours, avoid heavy overhead work
• TransFitness limits overhead pressing to **2 sets maximum** for extended binding
• Light shoulder work is usually fine; heavy pressing is harder

**Exercises to be cautious with:**
- Overhead press / military press
- Pull-ups and lat pulldowns
- Overhead tricep extensions
- Yoga poses with arms overhead

**Alternatives that work well:**
- Lateral raises (arms don't go fully overhead)
- Front raises (controlled range)
- Landmine presses (angled, less rib expansion)
- Pushdowns for triceps

Listen to your body - if breathing feels restricted during overhead movements, switch to alternatives.`,
    relatedGuide: "binder_safety",
    requiresContext: { binds_chest: true },
  },
  {
    id: "binding_long_duration",
    category: "binding",
    keywords: [
      "all day",
      "long time",
      "8 hours",
      "10 hours",
      "work",
      "school",
      "already binding",
    ],
    question: "I've been binding all day - can I still work out?",
    answer: `If you've been binding for 8+ hours, you have options:

**Option 1: Remove for workout**
• If you have a private workout space or feel comfortable, this is safest
• Your workout can be longer and more intense
• Put it back on after for remaining activities

**Option 2: Continue binding with modifications**
• TransFitness automatically reduces intensity and volume
• Keep workouts shorter (30-45 minutes max)
• Focus on lower body and core (less breathing demand)
• Take extra rest between sets
• Skip high-intensity cardio

**What TransFitness adjusts for 8+ hour binding:**
- 25% volume reduction
- Extra 30 seconds rest between sets
- Moderate intensity maximum
- Limited overhead movements

**Best practice:** Try to schedule workouts earlier in the day when binding time is lower, if your schedule allows.`,
    relatedGuide: "binder_safety",
    requiresContext: { binds_chest: true },
  },

  // ========== HRT - TESTOSTERONE ==========
  {
    id: "hrt_t_energy",
    category: "hrt",
    keywords: ["testosterone", "energy", "tired", "fatigue", "T", "injection"],
    question: "Why do I feel tired after starting T?",
    answer: `Fatigue during the early stages of testosterone is common. Here's why:

• **Your body is adjusting** to new hormone levels
• **Red blood cell production increases** which temporarily affects oxygen delivery
• **Sleep patterns may shift** as your body adapts

**What helps:**
- Ensure adequate sleep (7-9 hours)
- Stay hydrated - testosterone can increase your fluid needs
- Eat enough protein and iron-rich foods
- Light to moderate exercise can actually help energy levels
- Be patient - most people see improvement after 2-3 months

If fatigue persists beyond 3 months or is severe, talk to your healthcare provider.`,
    requiresContext: { on_hrt: true, hrt_type: "testosterone" },
  },
  {
    id: "hrt_t_muscle",
    category: "hrt",
    keywords: ["testosterone", "muscle", "gains", "strength", "build", "T"],
    question: "When will I start seeing muscle gains on T?",
    answer: `Muscle development on testosterone follows a general timeline:

**0-3 months:**
- Increased energy and strength
- You may lift heavier but visible changes are subtle

**3-6 months:**
- Noticeable strength gains
- Upper body fills out
- Fat redistribution begins

**6-12 months:**
- Significant muscle development
- Shoulders broaden
- Body composition shifts

**Tips for maximizing results:**
- Eat adequate protein (0.8-1g per pound of bodyweight)
- Progressive overload is key - gradually increase weights
- Rest days matter - muscle grows during recovery
- Stay consistent with your workouts

Your TransFitness program is optimized for masculine physique development.`,
    requiresContext: { on_hrt: true, hrt_type: "testosterone" },
  },
  {
    id: "hrt_t_injection_timing",
    category: "hrt",
    keywords: ["injection", "workout", "timing", "T", "testosterone", "shot"],
    question: "Should I work out on injection day?",
    answer: `It's generally fine to work out on injection day, but:

**Considerations:**
- **Avoid working the injection site muscle** for 24-48 hours
- If you inject in your thigh, skip heavy leg work that day
- If you inject in your glute, avoid exercises that put pressure on the area

**Timing tips:**
- Work out before your injection if possible
- If working out after, choose exercises that don't stress the injection site
- Light activity can actually help absorption

Some people feel a slight energy boost 24-48 hours post-injection - use that window for harder workouts if you notice this pattern.`,
    requiresContext: { on_hrt: true, hrt_type: "testosterone" },
  },
  {
    id: "hrt_t_tendon_safety",
    category: "hrt",
    keywords: [
      "tendon",
      "ligament",
      "injury",
      "joint",
      "connective tissue",
      "early T",
      "strain",
    ],
    question: "Why should I be careful with tendons early on T?",
    answer: `This is one of the most important things to know in your first months on testosterone:

**The issue:**
• Testosterone rapidly increases muscle strength
• Tendons and ligaments adapt much more slowly
• This mismatch creates injury risk - you can lift more than your joints can handle

**First 3 months on T:**
• Your muscles may feel stronger than ever
• BUT your tendons haven't caught up yet
• TransFitness shows a reminder before strength workouts during this period

**How to stay safe:**
- Focus on **form over weight** - this is crucial
- Increase weights gradually (5-10% per week max)
- Include warm-ups and mobility work
- Don't chase the "newbie gains" too aggressively

**Common injuries to avoid:**
- Tennis/golfer's elbow
- Rotator cuff strains
- Patellar tendinitis

By 6-12 months, your tendons will have adapted. Patience now prevents injuries later.`,
    requiresContext: { on_hrt: true, hrt_type: "testosterone" },
  },
  {
    id: "hrt_t_body_recomp",
    category: "hrt",
    keywords: [
      "body recomposition",
      "fat loss",
      "muscle gain",
      "cut",
      "bulk",
      "recomp",
      "simultaneous",
    ],
    question: "Can I lose fat and gain muscle at the same time on T?",
    answer: `Yes - and testosterone actually makes this easier than it would be otherwise:

**Why T helps with body recomp:**
• Increased metabolic rate
• Fat redistribution away from hips/thighs
• Enhanced muscle protein synthesis
• Often increased energy for training

**What to expect:**
- **Months 0-3:** Energy changes, early strength gains
- **Months 3-6:** Noticeable fat redistribution begins
- **Months 6-12:** Significant body composition shifts

**Nutrition for recomp:**
• Eat at maintenance or slight surplus
• Prioritize protein (0.8-1g per pound bodyweight)
• Don't cut calories aggressively - you need fuel for changes

**TransFitness approach:**
Your program emphasizes upper body (55%) for masculine development while building overall strength. The app adjusts as your body changes.

Note: Individual results vary based on genetics, dose, and consistency.`,
    requiresContext: { on_hrt: true, hrt_type: "testosterone" },
  },
  {
    id: "hrt_t_body_fat",
    category: "hrt",
    keywords: [
      "body fat",
      "fat redistribution",
      "stomach",
      "belly",
      "hips",
      "thighs",
      "percentage",
    ],
    question: "When will my body fat redistribute on T?",
    answer: `Fat redistribution is one of the slower changes on testosterone, but it does happen:

**Timeline:**
• **0-3 months:** Minimal visible change, but process is starting
• **3-6 months:** Hip/thigh fat begins decreasing, may notice waist changes
• **6-12 months:** More noticeable redistribution to masculine pattern
• **1-2+ years:** Maximum redistribution achieved

**Where fat goes:**
- FROM: Hips, thighs, butt
- TO: Abdomen, back, general distribution

**How exercise helps:**
• Strength training builds muscle that burns more fat
• Cardio accelerates overall fat loss
• Can't spot-reduce, but overall activity helps

**Important notes:**
- New fat deposits in the new pattern; existing fat takes time to mobilize
- Diet matters - excess calories will still be stored
- Genetics influence pattern and timeline

Focus on what you can control: consistent training, adequate protein, and patience.`,
    requiresContext: { on_hrt: true, hrt_type: "testosterone" },
  },
  {
    id: "hrt_t_pre_t_fitness",
    category: "hrt",
    keywords: [
      "pre-T",
      "before testosterone",
      "starting",
      "preparation",
      "not on T yet",
      "waiting",
    ],
    question: "How should I train before starting T?",
    answer: `Training before T is incredibly valuable - you're building a foundation that will accelerate your results:

**Why pre-T training matters:**
• Master proper form NOW while weights are lighter
• Build the habit and discipline of consistent training
• Develop mind-muscle connection
• Create a cardio base for later intensity

**Focus areas:**
- **Form:** Perfect your squat, hinge, push, pull movements
- **Consistency:** 3-4 sessions per week is more important than intensity
- **Core strength:** Essential for all compound lifts
- **Flexibility:** Don't neglect mobility work

**What to expect:**
- Strength gains will be slower than on T (that's normal)
- You're still building real muscle and fitness
- Your body is learning movement patterns

**The payoff:**
When T kicks in, you'll have the foundation to progress safely and quickly. People who trained pre-T often see faster, safer gains than those who start from zero.

TransFitness works great pre-T - the app adjusts to your current state.`,
  },
  {
    id: "hrt_t_strength_timeline",
    category: "hrt",
    keywords: [
      "strength gains",
      "how long",
      "progress",
      "getting stronger",
      "lift more",
      "timeline",
    ],
    question: "How fast will I get stronger on T?",
    answer: `Strength gains on testosterone follow a general pattern, though individual results vary:

**0-3 months:**
• Energy and motivation often increase first
• May notice modest strength improvements
• Focus on form, not maxing out

**3-6 months:**
• More noticeable strength gains
• Likely lifting heavier than pre-T
• Upper body starts filling out
• Progressive overload becomes easier

**6-12 months:**
• Significant strength development
• Visible muscle mass increases
• Training capacity improves (more volume possible)

**1-2+ years:**
• Approaching your genetic potential rate of gain
• Gains become more gradual but continue

**Factors that affect your timeline:**
- Training consistency and program quality
- Nutrition (especially protein intake)
- Sleep and recovery
- T dose and levels
- Starting fitness level
- Genetics

TransFitness adjusts progressive overload based on your HRT phase.`,
    requiresContext: { on_hrt: true, hrt_type: "testosterone" },
  },
  {
    id: "hrt_t_bulking_fear",
    category: "hrt",
    keywords: [
      "bulk",
      "bulking",
      "afraid",
      "fear",
      "feminine",
      "worried",
      "scared",
      "gaining weight",
    ],
    question: "I want to bulk up but I'm scared of looking feminine",
    answer: `This fear is really common, and completely understandable. Here's the reality:

**Why it's different on T:**
• Fat redistributes to masculine patterns over time
• Muscle builds in masculine areas (shoulders, arms, back)
• Your body is literally changing how it stores and builds

**Strategic bulking for masculinization:**
TransFitness emphasizes **55% upper body** work to prioritize:
- Broader shoulders
- Bigger arms and back
- Fuller chest
- V-taper appearance

**How to bulk masculinely:**
- Focus on compound upper body lifts
- Don't fear lower body - strong legs support everything
- Eat in a slight surplus (200-300 calories over maintenance)
- Prioritize protein for muscle, not just calories

**Mindset shift:**
- Temporary fat gain during bulking is normal for everyone
- T will redistribute where that fat sits
- Muscle takes time but fat patterns shift too

**What helps:**
- Progress photos over time (not daily)
- Focus on strength numbers
- Trust the process - bodies change gradually`,
    requiresContext: { on_hrt: true, hrt_type: "testosterone" },
  },
  {
    id: "hrt_t_voice_training",
    category: "hrt",
    keywords: [
      "voice",
      "deep",
      "lower",
      "masculine",
      "vocal",
      "speaking",
      "singing",
    ],
    question: "Does exercise affect voice changes on T?",
    answer: `Voice changes on testosterone are hormonal, not exercise-related. Here's what to know:

**What causes voice changes:**
• Testosterone thickens the vocal cords
• This happens regardless of exercise
• Timeline: usually starts 3-12 months, continues for 1-2+ years

**How exercise CAN help indirectly:**
- **Cardio** improves lung capacity for voice projection
- **Core work** supports diaphragmatic breathing
- **Posture exercises** help voice resonance
- Overall fitness can boost confidence in using your new voice

**What exercise WON'T do:**
- Speed up vocal cord thickening
- Make your voice deeper faster
- Replace voice training if you want it

**Voice training is separate:**
If you want to work on masculine speech patterns, pitch, or resonance, that's a separate practice from fitness. Some people do both - they're complementary but distinct.

TransFitness focuses on physical fitness - voice training is its own specialty.`,
    requiresContext: { on_hrt: true, hrt_type: "testosterone" },
  },

  // ========== HRT - ESTROGEN ==========
  {
    id: "hrt_e_exercise",
    category: "hrt",
    keywords: ["estrogen", "exercise", "workout", "E", "feminization"],
    question: "How does estrogen affect my workouts?",
    answer: `Estrogen therapy affects exercise in several ways:

**Physical changes:**
- Decreased muscle mass over time
- Increased fat storage, especially in hips/thighs
- Potentially reduced strength
- Changes in body temperature regulation

**Training considerations:**
- Focus on **lower body and glutes** for feminine curves
- **Moderate weights with higher reps** (12-20) for toning
- **Cardio** helps with fat redistribution
- Recovery may take longer - listen to your body

**What to expect:**
- Strength may plateau or decrease initially
- This is normal and part of feminization
- Focus on building the physique you want, not numbers

Your TransFitness program is tailored for feminine physique goals.`,
    requiresContext: { on_hrt: true, hrt_type: "estrogen" },
  },
  {
    id: "hrt_e_muscle_loss",
    category: "hrt",
    keywords: [
      "muscle loss",
      "losing strength",
      "weaker",
      "atrophy",
      "losing gains",
      "shrinking",
    ],
    question: "Will I lose all my muscle on estrogen?",
    answer: `You'll lose some muscle mass, but not all of it - and you have more control than you might think:

**What happens:**
• Muscle mass decreases due to lower testosterone
• Strength typically decreases somewhat
• This is a gradual process over months to years

**What you can do:**
• **Keep training** - you'll retain more muscle than if you stop
• Strength training signals your body to preserve muscle
• You're building "feminine muscle" - toned and functional

**Reality check:**
- You won't suddenly become weak
- Many trans women maintain significant strength
- The decrease is often less dramatic than feared

**TransFitness adjusts for this:**
- Recovery time increased (your body needs it)
- Focus shifts to feminine physique goals
- Lower body emphasis (65%) for curves
- Upper body maintained at 35%

Reframe: You're not "losing" muscle - you're reshaping your body toward your goals.`,
    requiresContext: { on_hrt: true, hrt_type: "estrogen" },
  },
  {
    id: "hrt_e_hip_exercises",
    category: "hrt",
    keywords: [
      "hips",
      "hip dips",
      "wider hips",
      "glutes",
      "lower body",
      "curves",
      "booty",
    ],
    question: "What exercises help feminize my hips?",
    answer: `Great news: exercise can enhance the hip development that estrogen provides! Here's how:

**TransFitness focuses on:**
Your program is **65% lower body** to maximize feminine curves:

**Key exercises for hips/glutes:**
• **Glute bridges & hip thrusts** - primary glute builders
• **Sumo squats** - emphasizes inner thighs and glutes
• **Side-lying leg raises** - targets hip abductors for width
• **Clamshells** - gluteus medius for that side curve
• **Romanian deadlifts** - glutes and hamstrings

**How estrogen + exercise work together:**
- Estrogen directs fat to hips and thighs
- Exercise builds muscle underneath
- Result: enhanced curves

**Tips for maximum effect:**
- Focus on mind-muscle connection in glutes
- Use moderate weights, higher reps (12-20)
- Train glutes 2-3x per week
- Give muscles time to recover

**Timeline:**
Noticeable results typically visible at 3-6 months of consistent training combined with HRT.`,
    requiresContext: { on_hrt: true, hrt_type: "estrogen" },
  },
  {
    id: "hrt_e_upper_body",
    category: "hrt",
    keywords: [
      "upper body",
      "arms",
      "shoulders",
      "masculine",
      "shrink",
      "reduce",
      "too big",
    ],
    question: "Should I avoid upper body training on estrogen?",
    answer: `No - you don't need to completely avoid upper body training. Here's the balanced approach:

**What estrogen does naturally:**
• Reduces muscle mass over time (especially upper body)
• Decreases shoulder width somewhat
• Shifts body composition toward feminine patterns

**Why some upper body training helps:**
• Maintains functional strength for daily life
• Prevents muscle imbalances
• Supports good posture
• Toned arms can look feminine

**TransFitness approach:**
Your program is **35% upper body** with focus on:
- Toning, not building bulk
- Higher reps (12-15+) with moderate weights
- Exercises that elongate rather than bulk

**What to de-emphasize:**
- Heavy shoulder pressing
- Exercises that widen the back
- Low-rep, heavy lifting for upper body

**What works well:**
- Tricep work for toned arms
- Light back work for posture
- Core exercises for waist definition

Trust that your body is changing - you don't need to fear all upper body work.`,
    requiresContext: { on_hrt: true, hrt_type: "estrogen" },
  },
  {
    id: "hrt_e_cardio",
    category: "hrt",
    keywords: [
      "cardio",
      "running",
      "cycling",
      "heart",
      "endurance",
      "sweat",
      "temperature",
    ],
    question: "How does cardio change on estrogen HRT?",
    answer: `Cardio on estrogen comes with some changes you should know about:

**Body temperature:**
• Many people feel colder on estrogen
• Sweating patterns may change
• Dress in layers you can adjust

**Endurance changes:**
• May notice decreased cardiovascular capacity initially
• This stabilizes over time
• Don't compare to pre-HRT performance

**Why cardio helps feminization:**
• Accelerates overall fat redistribution
• Burns calories that could otherwise store as fat
• Helps estrogen-directed fat go to hips/thighs
• Improves circulation and skin health

**Recommendations:**
- Start where you are, not where you used to be
- Moderate, steady cardio is great for feminization
- Mix walking, cycling, swimming if comfortable
- Don't overtrain - recovery takes longer

**TransFitness adjusts:**
- Recovery multiplier increased
- Rest periods extended
- Intensity recommendations account for HRT effects

Listen to your body - it's telling you what it needs.`,
    requiresContext: { on_hrt: true, hrt_type: "estrogen" },
  },
  {
    id: "hrt_e_breast_growth",
    category: "hrt",
    keywords: [
      "breast",
      "chest",
      "growth",
      "developing",
      "sensitive",
      "sports bra",
      "tender",
    ],
    question: "How should I train with breast growth on E?",
    answer: `Breast development on estrogen requires some workout adjustments:

**Common experiences:**
• Tenderness and sensitivity (especially early on)
• Increased awareness during movement
• May need support during cardio/jumping

**Support during exercise:**
• A supportive **sports bra** is essential
• Look for encapsulation style for larger sizes
• Compression-style works for smaller sizes
• Replace when elasticity decreases

**Chest exercises:**
• Chest exercises do NOT prevent breast growth
• Pec muscles sit behind breast tissue
• Some find chest work uncomfortable during tenderness peaks
• Modify if needed - come back to them later

**High-impact activities:**
- Running may require extra support
- Consider low-impact cardio during tender periods
- Walking, cycling, swimming are good alternatives

**Tips:**
- Layer a tank top under looser shirt if self-conscious
- Tenderness typically decreases over time
- Adjust as needed - there's no one-size-fits-all

Your body is doing amazing things - work with it, not against it.`,
    requiresContext: { on_hrt: true, hrt_type: "estrogen" },
  },
  {
    id: "hrt_e_no_hrt_feminization",
    category: "hrt",
    keywords: [
      "no hrt",
      "without hormones",
      "natural",
      "feminize",
      "non-hrt",
      "cant take",
      "before hrt",
    ],
    question: "How can I feminize my body without HRT?",
    answer: `While HRT provides the most significant changes, exercise can help create a more feminine appearance:

**What exercise CAN do:**
• Build curves through lower body training (glutes, thighs)
• Improve posture for more feminine carriage
• Reduce overall body fat percentage
• Create waist-to-hip contrast through targeted training

**Lower body focus:**
- Glute bridges and hip thrusts
- Squats (especially sumo style)
- Lunges and step-ups
- Side-lying leg work for hip width appearance

**Upper body approach:**
- Minimize heavy shoulder/back work
- Focus on posture correction
- Light toning rather than building

**Additional strategies:**
- Core work for waist definition
- Flexibility training for graceful movement
- Cardio for overall leanness

**Being honest:**
- Skeletal structure won't change without HRT
- Fat distribution is largely hormonal
- Results will be more subtle than with HRT
- Every body is different

TransFitness can work with any body and any goals - tell us your situation and we'll adapt.`,
  },
  {
    id: "hrt_e_timeline",
    category: "hrt",
    keywords: [
      "timeline",
      "how long",
      "changes",
      "months",
      "progress",
      "when",
      "expectations",
    ],
    question: "When will I see body changes on estrogen?",
    answer: `Body changes on estrogen happen gradually. Here's what to expect:

**0-3 months:**
• Breast budding begins
• Skin softens
• Libido changes
• Minimal visible body composition change yet

**3-6 months:**
• Fat redistribution beginning
• Breasts continue developing
• May notice face softening
• Muscle mass starting to decrease

**6-12 months:**
• More noticeable fat redistribution (hips, thighs)
• Continued breast development
• Skin and body hair changes
• Strength/muscle changes more apparent

**1-2 years:**
• Approaching maximum fat redistribution
• Breast development nearing final size (varies)
• Body shape clearly feminizing
• Muscle mass stabilized at new baseline

**2+ years:**
• Continued subtle changes
• Final fat distribution patterns

**How exercise interacts:**
- Training enhances hormone-driven changes
- Lower body work builds on fat redistribution
- Consistent training accelerates visible results

Individual timelines vary based on genetics, age, dose, and other factors.`,
    requiresContext: { on_hrt: true, hrt_type: "estrogen" },
  },

  // ========== POST-OP ==========
  {
    id: "postop_top_timeline",
    category: "post_op",
    keywords: [
      "top surgery",
      "chest",
      "return",
      "exercise",
      "when",
      "timeline",
    ],
    question: "When can I exercise after top surgery?",
    answer: `Recovery after top surgery follows a general timeline, but **always follow your surgeon's specific instructions**:

**Week 1-2:**
- Rest and light walking only
- No arm raising above shoulders
- Focus on recovery

**Week 3-4:**
- Light walking increases
- Gentle lower body movements (no weights)
- Still no upper body work

**Week 4-6:**
- Can often begin light lower body exercises
- Still avoid upper body strain
- No lifting over 10 lbs

**Week 6-8:**
- May begin gentle upper body stretching
- Light resistance work with surgeon approval
- Avoid chest-specific exercises

**Week 8-12:**
- Gradual return to normal activity
- Start light and progress slowly

TransFitness automatically adjusts exercises based on your surgery date.`,
    relatedGuide: "post_op_movement",
    requiresContext: { has_surgery: true },
  },
  {
    id: "postop_scar_care",
    category: "post_op",
    keywords: ["scar", "stretch", "incision", "heal", "top surgery"],
    question: "Will exercise affect my surgery scars?",
    answer: `Exercise can affect scar healing, so timing and movement matter:

**Early healing (0-6 weeks):**
- Avoid any stretching or tension on incision sites
- No overhead movements
- Keep the area dry during workouts

**Mid healing (6-12 weeks):**
- Scars are still maturing
- Avoid exercises that pull or stretch the chest
- Sweat is okay but shower promptly

**After 12 weeks:**
- Scar tissue is stronger but still developing
- Can gradually introduce more range of motion
- Massage may help (ask your surgeon)

**Tips:**
- Silicone strips or gel can help scars during exercise
- Sun protection is important - UV can darken scars
- Stay hydrated for skin health

Always follow your surgeon's specific guidance.`,
    relatedGuide: "post_op_movement",
    requiresContext: { has_surgery: true },
  },
  {
    id: "postop_bottom_surgery",
    category: "post_op",
    keywords: [
      "bottom surgery",
      "vaginoplasty",
      "mtf",
      "recovery",
      "pelvic",
      "grs",
      "srs",
    ],
    question: "When can I exercise after vaginoplasty?",
    answer: `Recovery after vaginoplasty requires careful attention to pelvic floor healing. **Always follow your surgeon's specific guidance.**

**General timeline:**

**Weeks 0-6 (Critical):**
• Walking only - short distances, gradually increasing
• No lifting over 5-10 lbs
• Absolutely no exercises involving pelvic floor engagement
• Focus on rest and dilation schedule

**Weeks 6-12 (Modified):**
• TransFitness restricts **pelvic-floor-stressing exercises** for 12 weeks
• Can begin gentle upper body work (with surgeon approval)
• Still avoid squats, lunges, and core work
• Continue prioritizing dilation schedule

**Weeks 12+:**
• Gradual return to lower body work
• Start with bodyweight only
• Progress slowly over weeks

**Dilation and exercise:**
- Schedule workouts around dilation (not immediately after)
- Stay hydrated
- Listen to your body

TransFitness automatically adjusts your program based on your surgery date.`,
    relatedGuide: "post_op_movement",
    requiresContext: { has_surgery: true },
  },
  {
    id: "postop_phalloplasty",
    category: "post_op",
    keywords: [
      "phalloplasty",
      "phallo",
      "donor site",
      "forearm",
      "ftm bottom",
      "rff",
    ],
    question: "What exercises are restricted after phalloplasty?",
    answer: `Phalloplasty recovery has unique considerations, especially regarding the donor site. **Always follow your surgeon's guidance.**

**Donor site restrictions (typically forearm):**
TransFitness excludes these exercises for **12 weeks**:
• Grip-intensive exercises (deadlifts, rows, pull-ups)
• Wrist curls and forearm work
• Exercises requiring strong grip
• Push-ups and planks (wrist pressure)

**Why this matters:**
- The radial forearm flap needs time to heal
- Grip strength will be temporarily reduced
- Rushing can damage the graft site

**What you CAN do (with surgeon approval):**

**Weeks 4-6:**
- Lower body machines (leg press, leg curl)
- No gripping required

**Weeks 6-12:**
- More lower body work
- Core exercises that don't stress arms
- Light cardio

**Weeks 12+:**
- Gradual return to upper body
- Start with very light grip work
- Progress slowly

**Long-term:**
Most people regain significant grip strength, but it takes time and patience.`,
    relatedGuide: "post_op_movement",
    requiresContext: { has_surgery: true },
  },
  {
    id: "postop_metoidioplasty",
    category: "post_op",
    keywords: ["metoidioplasty", "meta", "ftm", "bottom surgery", "recovery"],
    question: "What's the exercise timeline after metoidioplasty?",
    answer: `Metoidioplasty typically has a shorter recovery than phalloplasty, but still requires care. **Follow your surgeon's specific instructions.**

**General timeline:**

**Weeks 0-4:**
• Walking only - gentle, short distances
• No lifting over 5-10 lbs
• Avoid any pelvic strain

**Weeks 4-8:**
• Gradual increase in walking
• Light upper body work may be possible
• Still avoid lower body exercises

**Weeks 8-12:**
• Can often return to more activity
• Still avoid heavy squats and deadlifts
• Listen to your body

**Weeks 12+:**
• Most activity can resume
• Progress gradually
• Check in with surgeon for clearance

**Key considerations:**
- Less donor site concern than phalloplasty
- Pelvic floor still needs protection
- Swelling may affect comfort during activity

TransFitness adjusts based on your surgery date and type.`,
    relatedGuide: "post_op_movement",
    requiresContext: { has_surgery: true },
  },
  {
    id: "postop_ffs",
    category: "post_op",
    keywords: [
      "ffs",
      "facial feminization",
      "face",
      "recovery",
      "swelling",
      "forehead",
    ],
    question: "When can I exercise after FFS?",
    answer: `FFS recovery has specific exercise restrictions due to blood flow and swelling concerns. **Follow your surgeon's guidance.**

**Critical restriction (first 6 weeks):**
TransFitness excludes exercises requiring **head inversion or forward bending**:
• Deadlifts and Romanian deadlifts
• Bent-over rows
• Yoga poses (downward dog, forward folds)
• Any exercise where your head goes below your heart

**Why this matters:**
- Blood pressure changes can increase swelling
- May affect healing of bone work
- Can cause discomfort or complications

**What you CAN do:**

**Weeks 2-4:**
- Walking (keeping head level)
- Light seated exercises

**Weeks 4-6:**
- More walking
- Standing exercises only
- Light weights for arms (nothing overhead)

**Weeks 6+:**
- Gradually reintroduce other movements
- Start light with previously restricted exercises
- Progress slowly

**Other considerations:**
- Sun protection for incision sites during outdoor activity
- Compression garment guidelines for exercise
- Sleep position affects recovery - follow surgeon advice`,
    relatedGuide: "post_op_movement",
    requiresContext: { has_surgery: true },
  },
  {
    id: "postop_breast_aug",
    category: "post_op",
    keywords: [
      "breast augmentation",
      "implants",
      "ba",
      "chest surgery",
      "mtf",
      "augmentation",
    ],
    question: "What exercises should I avoid after breast augmentation?",
    answer: `Breast augmentation recovery focuses on protecting the implants while they settle. **Follow your surgeon's specific instructions.**

**Critical restrictions (first 8 weeks):**
TransFitness excludes:
• Chest flies and cable crossovers
• Bench press and push-ups
• Chest stretches
• Any movement that significantly stretches the chest

**Why:**
- Implants need time to settle in the pocket
- Excessive chest movement can cause displacement
- Muscle needs to heal over/around the implant

**Timeline:**

**Weeks 0-2:**
• Rest, walking only
• Arms close to body
• No reaching or lifting

**Weeks 2-4:**
• Light walking increases
• Gentle arm movement
• Still no lifting

**Weeks 4-6:**
• Can begin lower body work
• Core work (no planks yet)
• Still avoid upper body

**Weeks 6-8:**
• Light upper body may begin (surgeon approval)
• Avoid chest-specific work

**Weeks 8-12:**
• Gradual return to chest work
• Start very light
• Progress slowly

**Sports bra:**
Wear a supportive sports bra during all activity - your surgeon will advise on type.`,
    relatedGuide: "post_op_movement",
    requiresContext: { has_surgery: true },
  },
  {
    id: "postop_compression",
    category: "post_op",
    keywords: [
      "compression garment",
      "vest",
      "binder after surgery",
      "post surgical",
      "post-op binder",
    ],
    question: "Can I exercise in my compression garment?",
    answer: `Post-surgical compression garments are different from regular binders - here's what to know:

**Key difference:**
• Compression garments are medical devices for healing
• They're typically less restrictive than chest binders
• Designed to be worn during recovery activities

**General guidelines:**

**Usually okay:**
• Walking and light movement
• Gentle stretching (as cleared by surgeon)
• Low-intensity activity during early recovery

**Check with surgeon first:**
• Any cardio that causes significant sweating
• Activities that may shift the garment
• Workouts longer than 30-45 minutes

**Practical tips:**
- Keep the garment dry - shower and change after sweaty activity
- Don't substitute regular binders during recovery
- Replace if elasticity decreases
- Follow wear-time instructions (often 24/7 initially)

**After compression phase ends:**
- You'll transition off the garment
- At that point, regular binder rules apply if you bind
- TransFitness adjusts your workout accordingly

Always prioritize surgeon instructions over general advice.`,
    relatedGuide: "post_op_movement",
    requiresContext: { has_surgery: true },
  },
  {
    id: "postop_bench_substitute",
    category: "post_op",
    keywords: [
      "bench press",
      "push up",
      "chest exercise",
      "alternative",
      "substitute",
      "replacement",
    ],
    question: "What can I do instead of bench press during recovery?",
    answer: `Can't do chest work due to recovery (or binding)? Here are effective alternatives:

**Lower body compound movements:**
These build overall strength without upper body strain:
• Squats and leg press
• Romanian deadlifts (if cleared for hinging)
• Lunges and Bulgarian split squats
• Hip thrusts and glute bridges

**Core work:**
• Dead bugs
• Bird dogs
• Pallof presses
• Leg raises (if pelvic floor allows)

**Non-chest upper body (if cleared):**
• Bicep curls
• Tricep pushdowns (minimal chest involvement)
• Lateral raises
• Face pulls

**Cardio options:**
• Walking
• Stationary bike
• Elliptical (arms optional)

**Why lower body focus works:**
- Legs and glutes are your largest muscle groups
- You maintain overall fitness and strength
- Keeps gym habit and routine alive
- Returns are worth it when you can train chest again

TransFitness automatically swaps in appropriate exercises based on your restrictions.`,
    relatedGuide: "post_op_movement",
    requiresContext: { has_surgery: true },
  },
  {
    id: "postop_return_timeline",
    category: "post_op",
    keywords: [
      "return",
      "when",
      "start",
      "again",
      "resume",
      "exercise after",
      "general",
    ],
    question:
      "What's the general timeline for returning to exercise after surgery?",
    answer: `Every surgery is different, but here's a general framework. **Always follow your surgeon's specific instructions.**

**General phases:**

**Week 1-2: Rest**
• Walking only - gentle, short distances
• Focus on healing basics
• No exercise beyond essential movement
• Prioritize sleep and nutrition

**Week 2-4: Light Movement**
• Gradually increase walking
• May begin gentle stretching (surgeon-dependent)
• Still no resistance training
• Listen to your body signals

**Week 4-8: Modified Activity**
• Can often begin some exercise (varies by surgery)
• Usually lower body before upper body
• Avoid surgery-specific restricted movements
• Progress slowly

**Week 8-12: Gradual Return**
• More exercises typically allowed
• Still modifications for specific areas
• Don't rush back to pre-surgery weights

**Week 12+: Approaching Normal**
• Most restrictions lift
• Continue progressing slowly
• Some surgeries require longer timelines

**TransFitness helps by:**
- Tracking your surgery date
- Automatically excluding restricted exercises
- Suggesting appropriate alternatives
- Progressing you safely over time

When in doubt, wait and ask your surgeon.`,
    relatedGuide: "post_op_movement",
    requiresContext: { has_surgery: true },
  },

  // ========== DYSPHORIA MANAGEMENT ==========
  {
    id: "dysphoria_gym",
    category: "dysphoria",
    keywords: ["dysphoria", "gym", "uncomfortable", "mirror", "anxiety"],
    question: "How can I manage dysphoria at the gym?",
    answer: `Gym dysphoria is real and valid. Here are strategies that help:

**Environment:**
- Choose times when the gym is less crowded
- Find gyms with private or semi-private areas
- Home workouts are completely valid
- Position yourself away from mirrors if they trigger dysphoria

**Clothing:**
- Wear what makes you feel comfortable and safe
- Loose, dark clothing can help if you're feeling exposed
- Compression wear or binders if that's your norm

**Mindset:**
- Focus on how your body FEELS, not how it looks
- Headphones can create a personal bubble
- Remember: you belong there as much as anyone

**During exercise:**
- Choose exercises that help you feel connected to your body
- Avoid movements that trigger dysphoria (we help with this)
- Celebrate what your body CAN do

TransFitness avoids exercises you've flagged as triggering.`,
  },
  {
    id: "dysphoria_rest_days",
    category: "dysphoria",
    keywords: ["rest", "day", "off", "skip", "bad", "dysphoria"],
    question: "Is it okay to skip workouts on bad dysphoria days?",
    answer: `Absolutely yes. Your mental health matters as much as physical fitness.

**On hard days, you might:**
- Take a complete rest day - that's valid
- Do gentle movement at home instead (stretching, walking)
- Do a shorter workout
- Focus on exercises that feel affirming

**Remember:**
- Consistency over perfection
- One missed workout won't derail your progress
- Pushing through severe distress can make things worse
- Some movement is often better than none - but zero is okay too

**Reframing:**
- Rest is part of fitness, not failure
- Your body needs recovery anyway
- Being kind to yourself IS part of the journey

You're doing amazing by showing up at all.`,
  },
  {
    id: "dysphoria_locker_rooms",
    category: "dysphoria",
    keywords: [
      "locker room",
      "changing",
      "shower",
      "gym",
      "undressing",
      "bathroom",
      "changing room",
    ],
    question: "How do I handle locker room anxiety?",
    answer: `Locker room anxiety is one of the most common barriers to gym-going for trans people. Here are strategies that work:

**Avoidance strategies:**
• Arrive already dressed for your workout
• Change in a bathroom stall or accessible restroom
• Leave in workout clothes and change at home
• Look for gyms with private changing areas

**Timing strategies:**
• Go during off-peak hours (early morning, mid-afternoon)
• Learn the gym's pattern for when locker rooms are emptiest
• Time your exit to avoid rush periods

**Gym selection:**
• Ask about private changing options when joining
• Look for LGBTQ+-friendly gyms
• Consider 24-hour gyms (more privacy at odd hours)
• Some gyms have family/unisex facilities

**Home alternatives:**
TransFitness works great for home workouts if the gym isn't accessible right now. You can still get an excellent workout.

**Remember:**
- You have every right to be there
- Your safety and comfort matter
- There's no shame in avoiding spaces that feel unsafe`,
  },
  {
    id: "dysphoria_swimming",
    category: "dysphoria",
    keywords: [
      "swimming",
      "pool",
      "aquatic",
      "swimsuit",
      "water exercise",
      "beach",
    ],
    question: "How can I exercise if swimming triggers dysphoria?",
    answer: `If swimming triggers dysphoria, you're not alone - and you have great alternatives:

**TransFitness approach:**
When you flag swimming as a trigger, we **completely exclude** all aquatic exercises. You won't see pool-based workouts.

**Low-impact alternatives to swimming:**
• Cycling or stationary bike (easy on joints)
• Elliptical trainer
• Rowing machine (full body, no impact)
• Walking or incline walking

**If you want water exercise:**
• Private pools (home, apartment complex off-peak)
• Trans-friendly swim sessions (some cities have these)
• Board shorts and rash guards work for many
• Early morning or late evening timing

**For joint issues that made swimming appealing:**
• Chair-based exercises
• Resistance bands
• Yoga and stretching
• Pilates

**What NOT to do:**
Don't force yourself into situations that harm your mental health. The "best" exercise is one you'll actually do - and that means one that doesn't trigger dysphoria.

Your mental health is part of your fitness.`,
  },
  {
    id: "dysphoria_mirrors",
    category: "dysphoria",
    keywords: [
      "mirror",
      "reflection",
      "looking",
      "see myself",
      "form check",
      "watching",
    ],
    question: "How do I exercise without relying on mirrors?",
    answer: `If mirrors trigger dysphoria, you can absolutely train effectively without them:

**TransFitness approach:**
When you flag mirror dysphoria, we exclude exercises that require mirror-based form checks.

**Alternatives to mirror form checks:**

**Kinesthetic awareness:**
• Focus on how the movement FEELS, not looks
• Touch the target muscle to feel it working
• Move slowly and mindfully

**Other feedback methods:**
• Record yourself with phone propped up (review later, or don't)
• Use verbal cues: "knees out," "chest up," "squeeze at the top"
• Work with a trainer who can give feedback
• Use machines - they guide your movement path

**Gym positioning:**
• Position yourself facing away from mirrors
• Use corners or walls without mirrors
• Wear a brimmed hat or hood to limit peripheral mirror view
• Focus on a fixed point (floor, equipment, phone)

**Home workouts:**
• Cover or turn away from mirrors
• Use a small room without mirrors
• Focus entirely on internal sensation

**Reframing:**
You don't need to see yourself to train effectively. Many excellent athletes never use mirrors. Focus on what your body can DO.`,
  },
  {
    id: "dysphoria_home_workouts",
    category: "dysphoria",
    keywords: [
      "home",
      "at home",
      "private",
      "alone",
      "bedroom",
      "living room",
      "apartment",
    ],
    question: "Can I get a good workout at home?",
    answer: `Absolutely yes - home workouts can be just as effective as gym workouts:

**Why home works well:**
• Complete privacy
• No locker rooms or public spaces
• Wear whatever you want
• No mirrors if you don't want them
• Workout on your schedule

**Bodyweight effectiveness:**
You can build significant strength and fitness with zero equipment:
• Push-up progressions
• Squat variations
• Lunges and step-ups
• Core work (planks, dead bugs, etc.)

**Minimal equipment options:**
• Resistance bands ($15-30) - huge exercise variety
• Adjustable dumbbells - if budget allows
• A sturdy chair - for step-ups, dips, elevated push-ups
• A yoga mat - comfort for floor work

**TransFitness adapts:**
Tell us your equipment list and workout space, and we'll create effective workouts that work for your situation.

**The truth:**
Many people build amazing physiques training at home. The gym is one option, not the only option.

You don't need access to a gym to transform your body.`,
  },
  {
    id: "dysphoria_clothing",
    category: "dysphoria",
    keywords: [
      "clothing",
      "clothes",
      "wear",
      "outfit",
      "tight",
      "loose",
      "gym clothes",
      "what to wear",
    ],
    question: "What should I wear to work out with dysphoria?",
    answer: `What you wear can significantly impact gym comfort. Here are strategies:

**General principles:**
• Wear what makes you feel SAFE, not what's "optimal"
• Function matters, but so does mental comfort
• Dark colors minimize visibility of body shape
• Layers give you control

**If you want to minimize:**
• Loose-fitting shirts and tanks
• Joggers or loose shorts
• Hoodies (even if warm - your choice)
• Compression underneath if it helps

**If you want to accentuate:**
• Fitted leggings for lower body
• Crop tops or fitted tanks (if comfortable)
• Compression wear to smooth lines

**For binding:**
• Loose shirts hide binder lines
• Dark colors show less sweat
• Layers can help if you need to adjust

**For tucking:**
• Compression shorts/underwear
• Loose shorts or joggers over top
• Avoid very tight leggings if uncomfortable

**Practical tips:**
- Bring a change of clothes if you'll be sweaty
- Athletic fabric wicks better than cotton
- Test outfits at home first

**Bottom line:**
TransFitness selects exercises that work with loose clothing when you flag tight-clothing dysphoria. Wear what works for you.`,
  },
  {
    id: "dysphoria_chest_exercises",
    category: "dysphoria",
    keywords: [
      "chest",
      "pec",
      "bench",
      "push up",
      "looking at chest",
      "chest focus",
      "chest dysphoria",
    ],
    question: "How can I work out if chest exercises trigger me?",
    answer: `Chest-focused exercises can be triggering for many trans people. Here's how to handle it:

**TransFitness approach:**
When you flag chest dysphoria, we **deprioritize** exercises that:
• Draw attention to the chest
• Require looking at your chest
• Emphasize chest development

**Upper body alternatives:**
You can build a strong upper body while avoiding chest emphasis:
• Back work (rows, pulldowns, face pulls)
• Shoulder work (lateral raises, overhead press)
• Arm isolation (biceps, triceps)
• Functional movements (carries, pulls)

**For transmasc folks:**
• Back development creates V-taper
• Shoulder width balances proportions
• You can skip direct chest work entirely

**For transfem folks:**
• Chest exercises don't prevent breast development
• But if they trigger you, skip them
• Focus on lower body and other areas

**Mindset options:**
• Some people reframe chest work as "building pecs to fill out shirts"
• Others avoid it entirely - both are valid
• You can always come back to it later

**Remember:**
There's no exercise you MUST do. TransFitness builds complete programs around your triggers.`,
  },

  // ========== EXERCISE ==========
  {
    id: "exercise_modification",
    category: "exercise",
    keywords: ["modify", "modification", "easier", "hard", "alternative"],
    question: "How do I modify an exercise if it's too hard?",
    answer: `Every exercise can be modified. Here are general principles:

**To make exercises easier:**
- Reduce range of motion
- Use lighter weights or bodyweight
- Slow down the movement
- Take longer rest periods
- Use assistance (bands, bench, wall)

**Common modifications:**
- **Push-ups:** Wall → incline → knee → full
- **Squats:** Chair-assisted → bodyweight → weighted
- **Pull-ups:** Bands → negatives → assisted machine

**In TransFitness:**
- Tap any exercise to see modifications
- The app suggests progressions/regressions based on your level
- You can swap exercises during workouts

**Important:**
- Modifications aren't "lesser" - they're smart training
- Progress at YOUR pace
- Form over weight, always`,
  },
  {
    id: "exercise_rest",
    category: "exercise",
    keywords: ["rest", "between", "sets", "how long", "wait"],
    question: "How long should I rest between sets?",
    answer: `Rest time depends on your goals:

**For strength (1-5 reps):**
- 2-5 minutes between sets
- Allows full recovery for max effort

**For muscle building (6-12 reps):**
- 60-90 seconds between sets
- Creates metabolic stress for growth

**For endurance (12+ reps):**
- 30-60 seconds between sets
- Builds stamina

**General guidelines:**
- Shorter rest = more cardio effect
- Longer rest = more strength focus
- If you're breathing hard, wait until it calms
- If binding, err on the side of longer rest

TransFitness sets appropriate rest times for each exercise in your workout.`,
  },

  // ========== RECOVERY ==========
  {
    id: "recovery_soreness",
    category: "recovery",
    keywords: ["sore", "soreness", "doms", "pain", "muscle", "hurt"],
    question: "Is muscle soreness normal?",
    answer: `Muscle soreness (DOMS) is normal, especially when:
- Starting a new program
- Trying new exercises
- Increasing intensity

**What's normal:**
- Mild to moderate achiness 24-72 hours after exercise
- Stiffness that improves with movement
- Soreness that fades within 3-4 days

**What's NOT normal:**
- Sharp or stabbing pain
- Pain during exercise (not after)
- Soreness lasting more than a week
- Swelling, bruising, or visible changes
- Pain that gets worse, not better

**To help recovery:**
- Light movement and stretching
- Adequate protein and sleep
- Stay hydrated
- Don't skip rest days

If pain persists or seems wrong, consult a healthcare provider.`,
  },

  // ========== GENERAL ==========
  {
    id: "general_start",
    category: "general",
    keywords: ["start", "begin", "new", "first", "workout"],
    question: "Where do I start with TransFitness?",
    answer: `Welcome! Here's how to get started:

**1. Complete your profile** (if you haven't)
- Tell us about your goals, experience, and any safety considerations
- This helps us create personalized workouts

**2. Check your weekly plan**
- Go to the Workouts tab to see your schedule
- Each workout is tailored to you

**3. Start your first workout**
- Tap any workout to see the details
- Hit "Start Workout" when ready
- Follow along with the exercises

**Tips for success:**
- Start lighter than you think you need
- Focus on form over weight
- Rest when you need to
- Celebrate small wins

You've got this! Every journey starts with a single workout.`,
  },
  {
    id: "exercise_building_confidence",
    category: "exercise",
    keywords: [
      "confidence",
      "nervous",
      "scared",
      "anxious",
      "first time",
      "new",
      "intimidated",
    ],
    question: "How do I build confidence to work out?",
    answer: `Feeling nervous about working out is completely normal - especially as a trans person. Here's how to build confidence:

**Start private:**
• Begin with home workouts to learn movements
• Build a base level of fitness before going public
• This is valid long-term, not just a stepping stone

**Small wins approach:**
• Start with 10-15 minute sessions
• Focus on showing up, not intensity
• Celebrate every completed workout
• Consistency builds confidence

**Gym strategies:**
• Visit during off-peak hours first
• Wear headphones - create your bubble
• Have a written plan so you look purposeful
• Start with machines - less intimidating than free weights

**Mindset shifts:**
• Everyone started somewhere
• Most people are focused on themselves, not you
• You belong in fitness spaces
• Your goals are valid

**TransFitness helps:**
• Workouts are designed for YOUR level
• Exercise demonstrations so you know what to do
• Progress tracking shows your improvement

Every expert was once a beginner. You've got this.`,
  },
  {
    id: "exercise_lower_vs_upper",
    category: "exercise",
    keywords: [
      "lower body",
      "upper body",
      "balance",
      "skip",
      "leg day",
      "ratio",
      "focus",
    ],
    question: "Should I focus more on upper or lower body?",
    answer: `The right balance depends on your goals:

**For feminization (transfem):**
TransFitness uses **65% lower body / 35% upper body**:
• Emphasizes glutes, hips, and thighs
• Maintains upper body function without building bulk
• Supports estrogen's natural fat redistribution

**For masculinization (transmasc):**
TransFitness uses **55% upper body / 45% lower body**:
• Emphasizes shoulders, back, and arms for V-taper
• Maintains strong lower body foundation
• Supports testosterone's muscle-building effects

**For general fitness:**
A balanced 50/50 split works well for overall health.

**Common concerns:**

*"Can I skip legs entirely?"*
Not recommended - your legs support everything and prevent imbalances.

*"Will lower body make me look bulky?"*
Depends on training style and hormones. Higher reps with moderate weight builds shape without excessive size.

*"Will upper body make me look masculine?"*
On estrogen, building excessive upper body muscle is difficult. Maintenance work is fine.

TransFitness adjusts your ratio automatically based on your profile and goals.`,
  },
  {
    id: "general_trans_gym",
    category: "general",
    keywords: [
      "trans gym",
      "lgbtq",
      "inclusive",
      "friendly",
      "safe",
      "welcoming",
      "find",
    ],
    question: "How do I find a trans-friendly gym?",
    answer: `Finding a safe gym space matters. Here's how to find trans-friendly options:

**Research strategies:**
• Search "[city] LGBTQ gym" or "[city] trans-friendly gym"
• Check local LGBTQ+ center recommendations
• Ask in local trans community groups/subreddits
• Read Google reviews for mentions of inclusivity

**Questions to ask gyms:**
• "Do you have gender-neutral changing facilities?"
• "What is your policy on name/pronoun use?"
• "Do you have any LGBTQ+ focused programming?"
• "How do you handle harassment?"

**Green flags:**
• Gender-neutral or private changing options
• Staff who ask for pronouns
• Clear anti-discrimination policy
• Trans-inclusive marketing
• LGBTQ+ specific classes or times

**Red flags:**
• Dismissive responses to inclusion questions
• "We've never thought about that"
• Gendered-only changing/facilities with no alternatives
• Visible discomfort when you ask

**Alternatives:**
• Home workouts (TransFitness works great here)
• YMCA/community centers (often more inclusive)
• 24-hour gyms during off-peak hours
• Outdoor fitness (parks, running trails)

You deserve a space where you feel safe.`,
  },
  {
    id: "general_progress_tracking",
    category: "general",
    keywords: [
      "progress",
      "track",
      "measure",
      "before after",
      "photos",
      "improvement",
      "results",
    ],
    question: "How should I track progress with body dysphoria?",
    answer: `Traditional progress tracking (photos, measurements) can trigger dysphoria. Here are alternatives:

**Performance-based tracking:**
• Weight lifted for each exercise
• Reps completed
• Workout duration and consistency
• How exercises feel (easier over time)

**Non-visual metrics:**
• Energy levels throughout the day
• Sleep quality
• How clothes fit (without looking)
• Strength in daily activities
• Recovery time between workouts

**Mood and wellbeing:**
• Post-workout mood
• Overall confidence
• Anxiety levels
• Relationship with your body

**If photos work for you:**
• Some people find before/after affirming
• Others find them triggering
• Both are valid responses
• Only you know what works

**TransFitness tracking:**
• Workout logs track your exercises
• Progress is visible in numbers
• No photos required

**Reframing success:**
- Did you show up? Success.
- Did you complete the workout? Success.
- Did you try a new exercise? Success.
- Are you taking care of your body? Success.

Progress isn't just visual. Celebrate what your body can DO.`,
  },
  {
    id: "recovery_hrt_recovery",
    category: "recovery",
    keywords: [
      "recovery",
      "rest",
      "sore",
      "tired",
      "hrt",
      "healing",
      "longer",
      "hormones",
    ],
    question: "Does HRT affect my recovery time?",
    answer: `Yes - HRT affects recovery, and TransFitness adjusts for this:

**On estrogen:**
• Recovery typically takes longer
• TransFitness applies a **1.1x recovery multiplier**
• Extra rest time between sets
• May need more rest days

**Why estrogen affects recovery:**
• Changes in muscle protein synthesis
• Different inflammatory response
• Body is adapting to new hormone levels
• Energy may fluctuate

**On testosterone:**
• Recovery may improve over time
• Muscle builds and repairs faster
• BUT early on (< 3 months), rest is still crucial
• Tendons need extra recovery time

**General HRT recovery tips:**
• Sleep is crucial - aim for 7-9 hours
• Protein intake matters (0.8-1g per lb bodyweight)
• Stay hydrated
• Don't skip rest days
• Listen to your body's signals

**Injection day considerations:**
• Some feel great day-of
• Others feel tired
• TransFitness suggests lighter workouts on injection days

**The bottom line:**
Your body is doing a lot of work adapting to hormones. Give it the recovery it needs. Progress happens during rest, not just during workouts.`,
    requiresContext: { on_hrt: true },
  },

  // ========== NUTRITION ==========
  {
    id: "nutrition_protein",
    category: "general",
    keywords: [
      "protein",
      "how much",
      "grams",
      "eat",
      "food",
      "muscle",
      "building",
    ],
    question: "How much protein do I need?",
    answer: `Protein needs depend on your goals:

**General guidelines:**
• **Muscle building:** 0.8-1g per pound of bodyweight
• **Maintenance:** 0.6-0.8g per pound
• **Example:** 150lb person building muscle = 120-150g protein daily

**Good protein sources:**
• Chicken, fish, lean beef, eggs
• Greek yogurt, cottage cheese
• Tofu, tempeh, seitan
• Beans, lentils, legumes
• Protein powder (whey, pea, soy)

**Timing:**
- Spread throughout the day (20-40g per meal)
- Post-workout protein helps, but total daily intake matters more
- Don't stress about perfect timing

**On HRT:**
- Testosterone: Protein is crucial for muscle building
- Estrogen: Still important for maintaining muscle tone

TransFitness isn't a nutrition app, but protein supports all your workout goals.`,
  },
  {
    id: "nutrition_calories",
    category: "general",
    keywords: [
      "calories",
      "eat",
      "diet",
      "lose weight",
      "gain weight",
      "bulk",
      "cut",
    ],
    question: "How many calories should I eat?",
    answer: `Calorie needs are individual, but here's a framework:

**To lose fat:** Eat slightly below maintenance (200-500 calorie deficit)
**To build muscle:** Eat slightly above maintenance (200-300 surplus)
**To maintain:** Eat at maintenance

**Rough maintenance estimate:**
• Bodyweight in lbs × 14-16 = approximate maintenance calories
• Example: 150lbs × 15 = ~2250 calories

**Important notes:**
- These are estimates - adjust based on results
- Don't cut too aggressively, especially on HRT
- Consistency matters more than perfection
- Quality of food matters, not just calories

**Trans-specific considerations:**
- Bodies change on HRT - calorie needs may shift
- Don't restrict severely during transition
- Focus on fueling your workouts and recovery

TransFitness focuses on training - for detailed nutrition, consider a registered dietitian.`,
  },
  {
    id: "nutrition_meal_timing",
    category: "general",
    keywords: [
      "meal timing",
      "before workout",
      "after workout",
      "eating",
      "when to eat",
      "fasting",
    ],
    question: "When should I eat around workouts?",
    answer: `Meal timing is less critical than total daily intake, but here are guidelines:

**Before workout (1-2 hours):**
• Light meal with carbs and protein
• Examples: banana + peanut butter, oatmeal, toast with eggs
• Some people train fasted and do fine - experiment

**After workout (within 2 hours):**
• Protein + carbs for recovery
• Examples: protein shake + fruit, chicken + rice, Greek yogurt
• Not urgent - the "anabolic window" is overhyped

**What matters more:**
- Total daily protein and calories
- Eating consistently
- Not feeling sick during workouts
- Sustainable habits

**If you bind:**
- Avoid eating too much right before - fullness + binding = uncomfortable
- Smaller, more frequent meals may work better

Don't overthink it. Eat enough, prioritize protein, and fuel your workouts.`,
  },
  {
    id: "equipment_home",
    category: "exercise",
    keywords: [
      "equipment",
      "home gym",
      "what to buy",
      "dumbbells",
      "bands",
      "minimal",
    ],
    question: "What equipment do I need for home workouts?",
    answer: `You can start with nothing, but here's what helps:

**Zero equipment (still effective):**
• Push-up variations
• Squats and lunges
• Planks and core work
• Burpees and cardio

**Starter kit ($30-50):**
• **Resistance bands** - huge variety of exercises
• Yoga mat for floor comfort

**Level up ($100-200):**
• **Adjustable dumbbells** - most versatile single purchase
• Pull-up bar (doorframe style)

**If you have more budget:**
• Kettlebell (one heavy one goes far)
• Bench (adjustable preferred)
• Barbell + plates (if you have space)

**What NOT to buy:**
- Gimmicky "as seen on TV" stuff
- Machines that do only one thing
- Anything claiming to "target belly fat"

TransFitness adapts workouts to your equipment. Tell us what you have and we'll make it work.`,
  },
  {
    id: "motivation_consistency",
    category: "general",
    keywords: [
      "motivation",
      "consistency",
      "habit",
      "keep going",
      "stick with",
      "dont feel like",
    ],
    question: "How do I stay consistent when I don't feel motivated?",
    answer: `Motivation comes and goes - consistency is what works:

**Key mindset shifts:**
• Don't wait for motivation - it follows action
• Discipline > motivation
• Some workout is better than no workout
• Progress isn't linear

**Practical strategies:**
• **Lower the bar:** On hard days, commit to 10 minutes. You'll often do more.
• **Schedule it:** Treat workouts like appointments
• **Remove friction:** Lay out clothes, prep equipment
• **Stack habits:** "After I [existing habit], I workout"

**When you miss a workout:**
- One missed workout doesn't matter
- Missing two in a row is the danger zone
- Get back to it, no guilt, no "starting over"

**Trans-specific:**
- Bad dysphoria days are valid rest days
- Home workouts count just as much
- Progress toward YOUR goals matters

**Remember:**
You don't need to feel like it. You just need to show up. The feeling often comes after you start.`,
  },
  {
    id: "injury_prevention",
    category: "recovery",
    keywords: [
      "injury",
      "prevent",
      "hurt",
      "pain",
      "warm up",
      "stretch",
      "safe",
    ],
    question: "How do I prevent injuries?",
    answer: `Injury prevention is about smart training:

**Before workouts:**
• **Warm up:** 5-10 minutes of light movement
• Dynamic stretching (leg swings, arm circles)
• Start with lighter weights, then build up

**During workouts:**
• **Form over weight** - always
• Progress gradually (5-10% per week max)
• Rest between sets
• Stop if something feels wrong (sharp pain, not muscle burn)

**After workouts:**
• Cool down with light movement
• Static stretching is optional but can help
• Adequate sleep and nutrition

**Common injury causes:**
- Too much too soon
- Ego lifting (too heavy, bad form)
- Not enough recovery between sessions
- Ignoring pain signals

**On early T (< 3 months):**
Muscles strengthen faster than tendons - be extra careful with weights.

**If you bind:**
Modified breathing can affect form - be aware of this during heavy lifts.

Listen to your body. It knows the difference between good discomfort and bad pain.`,
  },
  {
    id: "beginner_routine",
    category: "exercise",
    keywords: [
      "beginner",
      "routine",
      "program",
      "starting",
      "where to start",
      "first workout",
    ],
    question: "What's a good beginner routine?",
    answer: `For beginners, simplicity and consistency beat complexity:

**TransFitness approach:**
The app generates a personalized program based on your:
• Experience level
• Available equipment
• Goals (feminization, masculinization, general fitness)
• Safety considerations (binding, HRT, post-op)

**General beginner principles:**
• **Frequency:** 3 days per week is plenty to start
• **Full body:** Hit all major muscle groups each session
• **Progressive overload:** Gradually increase difficulty

**Basic structure (if doing it yourself):**
1. Squat variation
2. Push variation (push-up or press)
3. Pull variation (row or pulldown)
4. Hinge variation (deadlift or hip hinge)
5. Core work

**What matters most:**
- Show up consistently
- Learn proper form before adding weight
- Don't overthink it - just start

TransFitness takes the guesswork out - your first workout is already built for you.`,
  },
  {
    id: "nonbinary_goals",
    category: "general",
    keywords: [
      "nonbinary",
      "non-binary",
      "enby",
      "androgynous",
      "neither",
      "both",
      "neutral",
    ],
    question: "What if I want an androgynous or non-binary physique?",
    answer: `TransFitness supports all body goals, not just binary ones:

**Androgynous/balanced physique:**
• 50/50 upper/lower body distribution
• Focus on overall fitness rather than gendered development
• Build strength without emphasizing traditionally masc or fem features

**Customizable approach:**
• You can adjust any recommendations
• Mix elements: strong shoulders AND curves, for example
• Your goals don't need to fit a binary

**Exercise selection:**
• Core work for overall stability
• Balanced compound movements
• Emphasis on what makes YOU feel good

**If you're unsure:**
• Start with general fitness
• Notice what feels affirming as you go
• Adjust over time - bodies and goals can change

**What TransFitness does:**
- Doesn't assume your goals based on identity
- Lets you specify what you want
- Adapts as your preferences evolve

There's no wrong way to have a body. Build the one that feels like home.`,
  },
];
