/**
 * Knowledge Content Migration Script
 *
 * Migrates knowledge base entries from TypeScript to Supabase.
 * Run this script after executing 003_create_knowledge_tables.sql
 *
 * Usage:
 *   npx ts-node scripts/migrateKnowledgeContent.ts
 *
 * Or with environment variables:
 *   SUPABASE_URL=xxx SUPABASE_SERVICE_KEY=xxx npx ts-node scripts/migrateKnowledgeContent.ts
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// =============================================
// KNOWLEDGE BASE ENTRIES
// Copied from src/services/copilot/knowledgeBase.ts
// =============================================

interface KnowledgeEntry {
  id: string;
  category: 'binding' | 'hrt' | 'post_op' | 'exercise' | 'recovery' | 'dysphoria' | 'general';
  keywords: string[];
  question: string;
  answer: string;
  relatedGuide?: 'binder_safety' | 'post_op_movement';
  requiresContext?: {
    binds_chest?: boolean;
    on_hrt?: boolean;
    has_surgery?: boolean;
    hrt_type?: 'estrogen_blockers' | 'testosterone';
  };
}

const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  // ========== BINDING CATEGORY ==========
  {
    id: 'binding_cardio',
    category: 'binding',
    keywords: ['cardio', 'running', 'binder', 'breath', 'breathing', 'chest'],
    question: 'Can I do cardio while binding?',
    answer: `Yes, but with modifications. When binding during cardio:

• **Keep intensity moderate** - stay at a conversational pace where you can speak in full sentences
• **Take breaks every 30-45 minutes** to rest and allow deeper breathing
• **Listen to your body** - if you feel short of breath, dizzy, or chest pain, stop immediately
• **Consider a sports binder** - they're designed for physical activity and offer better breathability
• **Stay hydrated** - binding can increase sweating and heat retention

If high-intensity cardio is important to you, consider doing those sessions without a binder when you feel comfortable doing so.`,
    relatedGuide: 'binder_safety',
    requiresContext: { binds_chest: true },
  },
  {
    id: 'binding_chest_exercises',
    category: 'binding',
    keywords: ['chest', 'press', 'push', 'binder', 'bench'],
    question: 'Should I do chest exercises while binding?',
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
    relatedGuide: 'binder_safety',
    requiresContext: { binds_chest: true },
  },
  {
    id: 'binding_duration',
    category: 'binding',
    keywords: ['how long', 'hours', 'duration', 'binder', 'break'],
    question: 'How long can I safely bind while working out?',
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
    relatedGuide: 'binder_safety',
    requiresContext: { binds_chest: true },
  },

  // ========== HRT - TESTOSTERONE ==========
  {
    id: 'hrt_t_energy',
    category: 'hrt',
    keywords: ['testosterone', 'energy', 'tired', 'fatigue', 'T', 'injection'],
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
    requiresContext: { on_hrt: true, hrt_type: 'testosterone' },
  },
  {
    id: 'hrt_t_muscle',
    category: 'hrt',
    keywords: ['testosterone', 'muscle', 'gains', 'strength', 'build', 'T'],
    question: 'When will I start seeing muscle gains on T?',
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
    requiresContext: { on_hrt: true, hrt_type: 'testosterone' },
  },
  {
    id: 'hrt_t_injection_timing',
    category: 'hrt',
    keywords: ['injection', 'workout', 'timing', 'T', 'testosterone', 'shot'],
    question: 'Should I work out on injection day?',
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
    requiresContext: { on_hrt: true, hrt_type: 'testosterone' },
  },

  // ========== HRT - ESTROGEN ==========
  {
    id: 'hrt_e_exercise',
    category: 'hrt',
    keywords: ['estrogen', 'exercise', 'workout', 'E', 'feminization'],
    question: 'How does estrogen affect my workouts?',
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
    requiresContext: { on_hrt: true, hrt_type: 'estrogen_blockers' },
  },

  // ========== POST-OP ==========
  {
    id: 'postop_top_timeline',
    category: 'post_op',
    keywords: ['top surgery', 'chest', 'return', 'exercise', 'when', 'timeline'],
    question: 'When can I exercise after top surgery?',
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
    relatedGuide: 'post_op_movement',
    requiresContext: { has_surgery: true },
  },
  {
    id: 'postop_scar_care',
    category: 'post_op',
    keywords: ['scar', 'stretch', 'incision', 'heal', 'top surgery'],
    question: 'Will exercise affect my surgery scars?',
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
    relatedGuide: 'post_op_movement',
    requiresContext: { has_surgery: true },
  },

  // ========== DYSPHORIA MANAGEMENT ==========
  {
    id: 'dysphoria_gym',
    category: 'dysphoria',
    keywords: ['dysphoria', 'gym', 'uncomfortable', 'mirror', 'anxiety'],
    question: 'How can I manage dysphoria at the gym?',
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
    id: 'dysphoria_rest_days',
    category: 'dysphoria',
    keywords: ['rest', 'day', 'off', 'skip', 'bad', 'dysphoria'],
    question: 'Is it okay to skip workouts on bad dysphoria days?',
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

  // ========== EXERCISE ==========
  {
    id: 'exercise_modification',
    category: 'exercise',
    keywords: ['modify', 'modification', 'easier', 'hard', 'alternative'],
    question: 'How do I modify an exercise if it\'s too hard?',
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
    id: 'exercise_rest',
    category: 'exercise',
    keywords: ['rest', 'between', 'sets', 'how long', 'wait'],
    question: 'How long should I rest between sets?',
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
    id: 'recovery_soreness',
    category: 'recovery',
    keywords: ['sore', 'soreness', 'doms', 'pain', 'muscle', 'hurt'],
    question: 'Is muscle soreness normal?',
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
    id: 'general_start',
    category: 'general',
    keywords: ['start', 'begin', 'new', 'first', 'workout'],
    question: 'Where do I start with TransFitness?',
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
];

// =============================================
// DATABASE RECORD TRANSFORMATION
// =============================================

interface KnowledgeDbRecord {
  id: string;
  category: string;
  subcategory: string | null;
  keywords: string[];
  question: string;
  answer: string;
  requires_binding: boolean;
  requires_hrt: boolean;
  hrt_type: string | null;
  requires_surgery: boolean;
  surgery_type: string | null;
  related_guide: string | null;
  source: string | null;
  is_active: boolean;
  priority: number;
  version: number;
}

function transformToDbRecord(entry: KnowledgeEntry): KnowledgeDbRecord {
  return {
    id: entry.id,
    category: entry.category,
    subcategory: null, // Can be set manually later
    keywords: entry.keywords,
    question: entry.question,
    answer: entry.answer,
    requires_binding: entry.requiresContext?.binds_chest ?? false,
    requires_hrt: entry.requiresContext?.on_hrt ?? false,
    hrt_type: entry.requiresContext?.hrt_type ?? null,
    requires_surgery: entry.requiresContext?.has_surgery ?? false,
    surgery_type: null, // Can be set manually later
    related_guide: entry.relatedGuide ?? null,
    source: null, // Can be set manually later
    is_active: true,
    priority: 100,
    version: 1,
  };
}

// =============================================
// MIGRATION FUNCTIONS
// =============================================

async function migrateKnowledgeEntries(supabase: SupabaseClient): Promise<void> {
  console.log('\n📚 Migrating knowledge base entries...');
  console.log(`   Found ${KNOWLEDGE_BASE.length} entries to migrate`);

  const records = KNOWLEDGE_BASE.map(transformToDbRecord);

  // Upsert records (insert or update on conflict)
  const { data, error } = await supabase
    .from('knowledge_entries')
    .upsert(records, { onConflict: 'id' })
    .select();

  if (error) {
    console.error('   ❌ Error migrating knowledge entries:', error.message);
    throw error;
  }

  console.log(`   ✅ Successfully migrated ${data?.length ?? 0} knowledge entries`);
}

async function verifyMigration(supabase: SupabaseClient): Promise<void> {
  console.log('\n🔍 Verifying migration...');

  const { data, error } = await supabase
    .from('knowledge_entries')
    .select('id, category')
    .eq('is_active', true);

  if (error) {
    console.error('   ❌ Error verifying migration:', error.message);
    throw error;
  }

  const byCategory = data?.reduce((acc, entry) => {
    acc[entry.category] = (acc[entry.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) ?? {};

  console.log('   Entries by category:');
  Object.entries(byCategory).forEach(([category, count]) => {
    console.log(`     - ${category}: ${count}`);
  });

  console.log(`   ✅ Total active entries: ${data?.length ?? 0}`);
}

// =============================================
// MAIN
// =============================================

async function main(): Promise<void> {
  console.log('='.repeat(50));
  console.log('TransFitness Knowledge Content Migration');
  console.log('='.repeat(50));

  // Get environment variables
  const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl) {
    console.error('❌ Missing SUPABASE_URL or EXPO_PUBLIC_SUPABASE_URL environment variable');
    process.exit(1);
  }

  if (!supabaseServiceKey) {
    console.error('❌ Missing SUPABASE_SERVICE_KEY environment variable');
    console.error('   Note: This script requires the service_role key, not the anon key');
    process.exit(1);
  }

  // Create Supabase client with service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    await migrateKnowledgeEntries(supabase);
    await verifyMigration(supabase);

    console.log('\n' + '='.repeat(50));
    console.log('✅ Migration complete!');
    console.log('='.repeat(50));
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
