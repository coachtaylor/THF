/**
 * Safety Guides Migration Script
 *
 * Migrates safety guide content from React components to Supabase.
 * Run this script after executing 003_create_knowledge_tables.sql
 *
 * Usage:
 *   npx ts-node scripts/migrateSafetyGuides.ts
 *
 * Or with environment variables:
 *   SUPABASE_URL=xxx SUPABASE_SERVICE_KEY=xxx npx ts-node scripts/migrateSafetyGuides.ts
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// =============================================
// SAFETY GUIDES DATA
// Extracted from src/screens/guides/*.tsx
// =============================================

interface GuideSection {
  icon: string;
  title: string;
  content: string[];
  iconColor: string;
  iconBg: string;
  type?: 'standard' | 'phase';
  // For phase-type sections (post-op)
  weeks?: string;
  focus?: string;
  activities?: string[];
  avoid?: string[];
}

interface IntegrationInfo {
  title: string;
  description: string;
  items: string[];
}

interface SafetyGuideData {
  id: string;
  slug: string;
  title: string;
  category: 'binding' | 'post_op' | 'hrt' | 'general';
  summary: string;
  hero_icon: string;
  hero_subtitle: string;
  disclaimer: string;
  sections: GuideSection[];
  integration_info: IntegrationInfo;
  external_resources: string;
  footer_note?: string;
  surgery_type?: string;
  hrt_type?: string;
}

// Binder Safety Guide - from BinderSafetyGuide.tsx
const BINDER_SAFETY_GUIDE: SafetyGuideData = {
  id: 'guide_binder_safety',
  slug: 'binder_safety',
  title: 'Binder Safety',
  category: 'binding',
  summary: 'Exercise Safely While Binding',
  hero_icon: 'shield-checkmark',
  hero_subtitle: 'Practical guidance to help you train while respecting your body\'s limits',
  disclaimer: 'This guide provides general information only. It is not medical advice. If you experience pain or concerning symptoms, stop and consult a healthcare provider.',
  sections: [
    {
      icon: 'time-outline',
      title: 'Time Limits',
      content: [
        'Limit binding to 8-10 hours maximum per day',
        'Take breaks every few hours when possible',
        'Never sleep in a binder',
        'On workout days, consider shorter binding sessions',
      ],
      iconColor: '#38bdf8', // colors.accent.primary
      iconBg: 'rgba(56, 189, 248, 0.15)', // colors.accent.primaryMuted
    },
    {
      icon: 'fitness-outline',
      title: 'Exercise Modifications',
      content: [
        'Avoid high-intensity cardio while binding',
        'Reduce weights for chest-loading exercises',
        'Take longer rest periods between sets',
        'Skip jumping and high-impact movements',
        'Focus on lower body and core work',
      ],
      iconColor: '#f472b6', // colors.accent.secondary
      iconBg: 'rgba(244, 114, 182, 0.15)', // colors.accent.secondaryMuted
    },
    {
      icon: 'alert-circle-outline',
      title: 'Warning Signs to Stop',
      content: [
        'Sharp or stabbing chest pain',
        'Difficulty taking a full breath',
        'Lightheadedness or dizziness',
        'Rib tenderness or bruising',
        'Numbness in arms or chest',
      ],
      iconColor: '#f59e0b', // colors.warning
      iconBg: 'rgba(245, 158, 11, 0.15)', // colors.accent.warningMuted
    },
    {
      icon: 'heart-outline',
      title: 'Safer Alternatives',
      content: [
        'Trans tape for longer activities',
        'Compression sports bras',
        'Layered loose clothing',
        'Consider binding less on workout days',
      ],
      iconColor: '#34d399', // colors.success
      iconBg: 'rgba(52, 211, 153, 0.15)', // colors.accent.successMuted
    },
    {
      icon: 'checkmark-circle-outline',
      title: 'Best Practices',
      content: [
        'Use properly sized binders (never too tight)',
        'Take full unbinding rest days each week',
        'Listen to your body—discomfort is a signal',
        'Stay hydrated during exercise',
        'Consider the post-workout binder break',
      ],
      iconColor: '#38bdf8', // colors.accent.primary
      iconBg: 'rgba(56, 189, 248, 0.15)', // colors.accent.primaryMuted
    },
  ],
  integration_info: {
    title: 'How TransFitness Helps',
    description: 'When you tell us you bind, we automatically:',
    items: [
      'Reduce high-impact exercises',
      'Add breathing check-ins to your workout',
      'Adjust rest periods for recovery',
      'Show relevant safety reminders',
    ],
  },
  external_resources: 'For comprehensive medical information about binding safety, consult organizations like GLMA, Fenway Health, or your healthcare provider.',
};

// Post-Op Movement Guide - from PostOpMovementGuide.tsx
const POST_OP_MOVEMENT_GUIDE: SafetyGuideData = {
  id: 'guide_post_op_movement',
  slug: 'post_op_movement',
  title: 'Post-Op Movement',
  category: 'post_op',
  summary: 'Returning to Movement',
  hero_icon: 'trending-up',
  hero_subtitle: 'A general outline for getting back to training after top surgery',
  disclaimer: 'This is a general educational outline, not a medical protocol. Your surgeon\'s instructions take priority. Every surgery and every body is different—these phases are approximate guidelines, not strict rules.',
  surgery_type: 'top_surgery',
  sections: [
    {
      icon: 'bed-outline',
      title: 'Phase 1: Rest & Heal',
      type: 'phase',
      weeks: 'Weeks 0-2',
      focus: 'Complete rest and initial healing',
      activities: [
        'Short, gentle walks (5-10 minutes)',
        'Light stretching of lower body only',
        'Deep breathing exercises',
        'Focus on sleep and nutrition',
      ],
      avoid: [
        'Any upper body movement',
        'Raising arms above shoulder level',
        'Lifting anything heavier than 5 lbs',
        'Driving (first week minimum)',
      ],
      content: [],
      iconColor: '#f472b6',
      iconBg: 'rgba(244, 114, 182, 0.15)',
    },
    {
      icon: 'walk-outline',
      title: 'Phase 2: Gentle Mobility',
      type: 'phase',
      weeks: 'Weeks 2-6',
      focus: 'Gradual mobility restoration',
      activities: [
        'Walking (gradually increasing distance)',
        'Gentle lower body movements',
        'Light core work (no crunches)',
        'Range of motion for shoulders (if cleared)',
      ],
      avoid: [
        'Chest exercises of any kind',
        'Overhead movements',
        'Heavy carrying or lifting',
        'High-impact activities',
      ],
      content: [],
      iconColor: '#38bdf8',
      iconBg: 'rgba(56, 189, 248, 0.15)',
    },
    {
      icon: 'barbell-outline',
      title: 'Phase 3: Building Back',
      type: 'phase',
      weeks: 'Weeks 6-12',
      focus: 'Conservative strength rebuilding',
      activities: [
        'Light upper body work (surgeon approved)',
        'Bodyweight exercises',
        'Resistance bands',
        'Stationary cardio',
      ],
      avoid: [
        'Heavy pressing movements',
        'Direct chest loading',
        'Pull-ups and dips',
        'Pushing to failure',
      ],
      content: [],
      iconColor: '#34d399',
      iconBg: 'rgba(52, 211, 153, 0.15)',
    },
    {
      icon: 'rocket-outline',
      title: 'Phase 4: Progressive Return',
      type: 'phase',
      weeks: 'Weeks 12-24',
      focus: 'Gradual return to normal training',
      activities: [
        'Progressive overload (slowly)',
        'Full range of motion work',
        'Most exercises with modifications',
        'Scar massage and mobility',
      ],
      avoid: [
        'Maximal lifts (PRs)',
        'Anything causing pulling at incisions',
        'Ignoring pain signals',
        'Rushing the process',
      ],
      content: [],
      iconColor: '#38bdf8',
      iconBg: 'rgba(56, 189, 248, 0.15)',
    },
  ],
  integration_info: {
    title: 'How TransFitness Adapts',
    description: 'When you enter your surgery date, we:',
    items: [
      'Calculate your current recovery phase',
      'Exclude exercises that are typically too risky',
      'Suggest appropriate movement for your phase',
      'Gradually reintroduce upper body work',
      'Include scar care reminders when relevant',
    ],
  },
  external_resources: 'For comprehensive medical information, consult your surgeon or organizations like Fenway Health.',
  footer_note: 'Recovery is not linear. Some weeks will feel great, others less so. Trust the process and give yourself grace.',
};

const SAFETY_GUIDES: SafetyGuideData[] = [
  BINDER_SAFETY_GUIDE,
  POST_OP_MOVEMENT_GUIDE,
];

// =============================================
// DATABASE RECORD TRANSFORMATION
// =============================================

interface SafetyGuideDbRecord {
  id: string;
  slug: string;
  title: string;
  category: string;
  summary: string;
  hero_icon: string;
  hero_subtitle: string;
  disclaimer: string;
  sections: object;
  integration_info: object;
  external_resources: string;
  footer_note: string | null;
  surgery_type: string | null;
  hrt_type: string | null;
  source_citations: string[] | null;
  medical_reviewer: string | null;
  last_medical_review: string | null;
  is_active: boolean;
  version: number;
}

function transformToDbRecord(guide: SafetyGuideData): SafetyGuideDbRecord {
  return {
    id: guide.id,
    slug: guide.slug,
    title: guide.title,
    category: guide.category,
    summary: guide.summary,
    hero_icon: guide.hero_icon,
    hero_subtitle: guide.hero_subtitle,
    disclaimer: guide.disclaimer,
    sections: guide.sections,
    integration_info: guide.integration_info,
    external_resources: guide.external_resources,
    footer_note: guide.footer_note ?? null,
    surgery_type: guide.surgery_type ?? null,
    hrt_type: guide.hrt_type ?? null,
    source_citations: null, // Can be added later
    medical_reviewer: null, // Can be added later
    last_medical_review: null, // Can be added later
    is_active: true,
    version: 1,
  };
}

// =============================================
// MIGRATION FUNCTIONS
// =============================================

async function migrateSafetyGuides(supabase: SupabaseClient): Promise<void> {
  console.log('\n📖 Migrating safety guides...');
  console.log(`   Found ${SAFETY_GUIDES.length} guides to migrate`);

  const records = SAFETY_GUIDES.map(transformToDbRecord);

  // Upsert records (insert or update on conflict)
  const { data, error } = await supabase
    .from('safety_guides')
    .upsert(records, { onConflict: 'id' })
    .select();

  if (error) {
    console.error('   ❌ Error migrating safety guides:', error.message);
    throw error;
  }

  console.log(`   ✅ Successfully migrated ${data?.length ?? 0} safety guides`);
}

async function verifyMigration(supabase: SupabaseClient): Promise<void> {
  console.log('\n🔍 Verifying migration...');

  const { data, error } = await supabase
    .from('safety_guides')
    .select('slug, title, category')
    .eq('is_active', true);

  if (error) {
    console.error('   ❌ Error verifying migration:', error.message);
    throw error;
  }

  console.log('   Migrated guides:');
  data?.forEach((guide) => {
    console.log(`     - ${guide.slug}: ${guide.title} (${guide.category})`);
  });

  console.log(`   ✅ Total active guides: ${data?.length ?? 0}`);
}

// =============================================
// MAIN
// =============================================

async function main(): Promise<void> {
  console.log('='.repeat(50));
  console.log('TransFitness Safety Guides Migration');
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
    await migrateSafetyGuides(supabase);
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
